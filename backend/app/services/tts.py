"""Interviewer voice: Groq Orpheus on the user's own key, with local Kokoro as the fallback.

Why two engines (load test, Nov 2026, docs/DEPLOYMENT.md "Capacity"): local Kokoro runs on the
server CPU, one chunk at a time for everyone, so only ~1 interview at a time could speak
without gaps (4-core VM: even one waited ~6 s). Groq's Orpheus (settings.tts_engine = "groq")
generates on Groq with the user's own key (bring-your-own-key), so capacity no longer depends
on the server: a 10 s line came back in ~2.3 s, three at once in 3.2 s.

- Groq: ONE request per interviewer line (presynthesize returns the whole line as a single
  chunk). The free tier allows 100 voice requests a day per key; per line that's ~6
  ten-minute interviews a day, per sentence it would be ~2.
- Kokoro (Kokoro-82M, open source, Apache-2.0, ONNX Runtime): used when the engine is
  "kokoro", when the request has no key, or for the rest of an interview once Groq refused
  (terms not accepted on the user's Groq account, daily limit reached, key rejected). Lines
  are split into sentences so speaking can start before the whole line is generated.
- Kokoro loads once in the background at startup (main.py lifespan) and runs in a worker
  thread. If it is missing or still loading, TTSUnavailable -> 503 -> the browser voice.

Kokoro model files (git-ignored) go in data/models/kokoro/, from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1
"""

import asyncio
import io
import logging
import re
import threading
import time
import wave
from collections import OrderedDict

import numpy as np

from app.core.config import DATA_DIR, settings
from app.core.groq_key import current_groq_key, has_user_key
from app.core.http import groq_http_client

logger = logging.getLogger(__name__)

MODEL_DIR = DATA_DIR / "models" / "kokoro"
MAX_CHARS = 600

# Persona -> Kokoro voice (American / British English neural voices).
VOICES = {"maya": "af_heart", "sara": "bf_emma", "arjun": "am_michael"}
# Persona -> Groq Orpheus voice (chosen by listening to samples, Nov 2026).
GROQ_VOICES = {"maya": "diana", "arjun": "troy", "sara": "hannah"}
GROQ_SPEECH_URL = "https://api.groq.com/openai/v1/audio/speech"
GROQ_TIMEOUT_S = 15  # a full line usually takes ~2-3 s; past this Kokoro is the better bet

_model = None
_load_error: str | None = None
_lock = threading.Lock()  # one synthesis at a time: parallel runs only fight over the CPU
_cache: OrderedDict[tuple[str, str], bytes] = OrderedDict()  # (interviewer, text) -> WAV
_CACHE_SIZE = 64
_engine_used: OrderedDict[tuple[str, str], str] = OrderedDict()  # for the X-Voice-Engine header


class TTSUnavailable(Exception):
    pass


class NotAllowed(Exception):
    """The text isn't an interviewer line this server produced."""


class GroqVoiceError(Exception):
    """Groq refused or failed a voice request. `reason` says for how long to stop trying."""

    def __init__(self, reason: str, detail: str = "", retry_after: float | None = None):
        super().__init__(f"{reason}: {detail}")
        self.reason, self.retry_after = reason, retry_after


# Only lines the interviewer actually said may be voiced (audit C2). /tts used to accept any
# text from any logged-in user: a script could keep the single-file generator busy with
# arbitrary text and stall every interview's voice. Every chunk handed to the browser goes
# through presynthesize(), which registers it here; /tts refuses anything else. Bounded LRU:
# lines expire once ~2,000 newer ones were spoken (far more than any interview in progress).
# Value: (stream, engine): the interview the line belongs to and the engine chosen for it.
_allowed: OrderedDict[str, tuple[str, str]] = OrderedDict()
_ALLOWED_SIZE = 2000


def allow(chunks: list[str], stream: str = "default", engine: str = "kokoro") -> None:
    for chunk in chunks:
        key = normalize_for_speech(chunk)
        _allowed[key] = (stream, engine)
        _allowed.move_to_end(key)
    while len(_allowed) > _ALLOWED_SIZE:
        _allowed.popitem(last=False)


# Per interview (stream): Groq voice switched off until this time, and why. A Groq refusal
# (terms not accepted on the user's account, the daily limit, a rejected key) would repeat on
# every line, each costing a round trip before falling back, so the rest of that interview
# uses Kokoro straight away. Short outages only pause it briefly.
_groq_off: dict[str, tuple[float, str]] = {}
GROQ_OFF_SECONDS = {"terms": 3600, "auth": 3600, "rate_limit": 900, "error": 60}


def groq_voice_usable(stream: str) -> bool:
    if settings.tts_engine != "groq" or not has_user_key():
        return False
    until, _ = _groq_off.get(stream, (0.0, ""))
    return time.time() >= until


def _groq_failed(stream: str, err: GroqVoiceError) -> None:
    seconds = err.retry_after or GROQ_OFF_SECONDS.get(err.reason, 60)
    _groq_off[stream] = (time.time() + seconds, err.reason)
    # Never log the key; the reason and Groq's own message are enough to act on.
    logger.warning("Groq voice off for %.0f s in stream %s: %s", seconds, stream, err)


def is_allowed(text: str) -> bool:
    return normalize_for_speech(text) in _allowed


def load_model() -> None:
    """Load Kokoro (blocking; call from a thread). Safe to call more than once."""
    global _model, _load_error
    if _model is not None:
        return
    model_path = MODEL_DIR / settings.kokoro_model
    voices_path = MODEL_DIR / "voices-v1.0.bin"
    if not model_path.exists() or not voices_path.exists():
        _load_error = f"Kokoro model files not found in {MODEL_DIR}"
        return
    try:
        from kokoro_onnx import Kokoro

        model = Kokoro(str(model_path), str(voices_path))
        model.create("Ready.", voice="af_heart", speed=1.0, lang="en-us")  # warm-up
        _model = model
        _load_error = None
    except Exception as exc:  # noqa: BLE001 - report, then fall back to the browser voice
        _load_error = f"Kokoro failed to load: {exc.__class__.__name__}"


# Pause added after a chunk, by how the chunk ends. Kokoro's own edge silence varies
# (measured: 0.02-0.06 s before the first word, ~0.25 s after the last), and back-to-back
# chunks stacked both into a ~0.3 s gap at EVERY seam, plus any wait for generation. That
# read as robotic. Trimming the edges and adding a deliberate pause makes seams sound like
# a speaker's natural rhythm: a short breath after a sentence, barely a beat after a comma.
PAUSE_AFTER_SENTENCE_S = 0.18
PAUSE_AFTER_CLAUSE_S = 0.07
_KEEP_LEAD_S = 0.015  # don't clip the attack of the first consonant

# Seconds of generation per second of audio, measured on THIS machine (moving average).
# The browser needs it to decide when it can start speaking without stalling later. It
# used to guess from fetch times, but chunks the server had already pre-generated return in
# ~50 ms, which made generation look ~10x faster than it is: playback started too early and
# then waited between sentences. Measured here: ~0.75-0.9 (barely faster than real time).
_gen_per_audio = 0.85


def gen_per_audio() -> float:
    return round(_gen_per_audio, 3)


def pause_after(text: str) -> float:
    return PAUSE_AFTER_SENTENCE_S if text.rstrip().endswith((".", "!", "?")) else PAUSE_AFTER_CLAUSE_S


def trim_silence(samples: np.ndarray, sample_rate: int, pause_s: float) -> np.ndarray:
    """Cut leading/trailing silence, then append exactly `pause_s` of silence.

    Silence = 10 ms frames whose RMS is under 2% of the clip's loudest frame (relative, so it
    works for quiet and loud voices alike)."""
    frame = max(1, int(sample_rate * 0.01))
    n = len(samples) // frame
    if n == 0:
        return samples
    rms = np.sqrt((samples[: n * frame].reshape(n, frame) ** 2).mean(axis=1))
    voiced = np.flatnonzero(rms > max(rms.max() * 0.02, 1e-4))
    if voiced.size == 0:
        return samples
    start = max(0, voiced[0] * frame - int(_KEEP_LEAD_S * sample_rate))
    end = min(len(samples), (voiced[-1] + 1) * frame)
    pause = np.zeros(int(pause_s * sample_rate), dtype=samples.dtype)
    return np.concatenate([samples[start:end], pause])


def _synthesize_sync(text: str, voice: str) -> bytes:
    global _gen_per_audio
    with _lock:
        t0 = time.perf_counter()
        samples, sample_rate = _model.create(
            text, voice=voice, speed=settings.tts_speed, lang="en-us"
        )
        took = time.perf_counter() - t0
    samples = np.asarray(samples, dtype=np.float32)
    if len(samples):
        _gen_per_audio = 0.7 * _gen_per_audio + 0.3 * (took / (len(samples) / sample_rate))
    return to_wav(trim_silence(samples, sample_rate, pause_after(text)), sample_rate)


def read_wav(data: bytes) -> tuple[np.ndarray, int]:
    """16-bit PCM WAV -> float samples. Groq streams its WAV, so the header's frame count is a
    placeholder (it reported 89,478 s for a 4 s clip): read every frame that is there."""
    with wave.open(io.BytesIO(data)) as w:
        rate, channels, width = w.getframerate(), w.getnchannels(), w.getsampwidth()
        frames = w.readframes(2**31 - 1)
    if width != 2:
        raise GroqVoiceError("error", f"unexpected sample width {width}")
    samples = np.frombuffer(frames[: len(frames) - len(frames) % (2 * channels)], dtype="<i2")
    samples = samples.reshape(-1, channels).mean(axis=1) if channels > 1 else samples
    return samples.astype(np.float32) / 32768.0, rate


async def _groq_speech(text: str, interviewer: str) -> bytes:
    """One interviewer line from Groq Orpheus, on the user's own key."""
    try:
        response = await groq_http_client().post(
            GROQ_SPEECH_URL, timeout=GROQ_TIMEOUT_S,
            headers={"Authorization": f"Bearer {current_groq_key()}"},
            json={"model": settings.groq_tts_model, "voice": GROQ_VOICES.get(interviewer, "diana"),
                  "input": text[:MAX_CHARS], "response_format": "wav"},
        )
    except Exception as exc:
        raise GroqVoiceError("error", exc.__class__.__name__) from exc
    if response.status_code != 200:
        try:
            error = response.json().get("error", {})
        except ValueError:
            error = {}
        code, message = error.get("code", ""), str(error.get("message", ""))[:200]
        if code == "model_terms_required":
            raise GroqVoiceError("terms", message)
        if response.status_code == 429:
            retry = response.headers.get("retry-after")
            raise GroqVoiceError("rate_limit", message,
                                 float(retry) if retry and retry.replace(".", "").isdigit() else None)
        if response.status_code in (401, 403):
            raise GroqVoiceError("auth", message)
        raise GroqVoiceError("error", f"HTTP {response.status_code} {message}")
    samples, rate = read_wav(response.content)
    return to_wav(trim_silence(samples, rate, pause_after(text)), rate)


def to_wav(samples: np.ndarray, sample_rate: int) -> bytes:
    """Float samples in [-1, 1] -> 16-bit mono WAV bytes (standard library only)."""
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype("<i2")
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm.tobytes())
    return buffer.getvalue()


def normalize_for_speech(text: str) -> str:
    """LLM text uses typographic characters the phonemizer may not know: the interviewer
    wrote U+2011 (non-breaking hyphen) and em dashes in testing. Make them speakable."""
    for src, dst in {"‑": "-", "‐": "-", "—": ", ", "–": ", ",
                     "’": "'", "‘": "'", "“": '"', "”": '"'}.items():
        text = text.replace(src, dst)
    return " ".join(text.split())


SENTENCE_RE = re.compile(r"[^.!?]+[.!?]*\s*")
CLAUSE_RE = re.compile(r"[^,;:]+[,;:]?\s*")


def speech_chunks(text: str, max_len: int = 140) -> list[str]:
    """Split an interviewer line into chunks that are spoken one after another.

    Boundaries are ONLY sentence ends, or clause commas inside long sentences: never between
    two words. (The previous browser-side chunker split long clauses between words to keep
    chunks small; whenever a chunk was late, the voice paused in the middle of a phrase.)
    """
    text = normalize_for_speech(text)
    chunks: list[str] = []
    for sentence in SENTENCE_RE.findall(text) or [text]:
        sentence = sentence.strip()
        if not sentence:
            continue
        if len(sentence) <= max_len:
            chunks.append(sentence)
            continue
        current = ""
        for clause in CLAUSE_RE.findall(sentence):
            if current and len(current) + len(clause) > max_len:
                chunks.append(current.strip())
                current = ""
            current += clause
        if current.strip():
            chunks.append(current.strip())
    # A tiny fragment ("curve?") sounds clipped on its own: attach it to the chunk before.
    merged: list[str] = []
    for chunk in chunks:
        if merged and len(chunk) < 12:
            merged[-1] = f"{merged[-1]} {chunk}"
        else:
            merged.append(chunk)
    return merged


# Generation already running for a chunk: a second request for the same chunk waits for it
# instead of generating it again (the server pre-generates; the browser then asks for it).
_inflight: dict[tuple[str, str], asyncio.Task] = {}
_background: set[asyncio.Task] = set()  # keep references so tasks aren't garbage-collected


def _remember(key: tuple[str, str], task: asyncio.Task) -> None:
    _inflight.pop(key, None)
    if task.cancelled() or task.exception() is not None:
        return
    _cache[key] = task.result()
    if len(_cache) > _CACHE_SIZE:
        _cache.popitem(last=False)


async def _generate(text: str, interviewer: str, stream: str, engine: str) -> bytes:
    """Groq first when this line was planned for it, else (or when Groq refuses) Kokoro."""
    key = (interviewer, text)
    if engine == "groq" and groq_voice_usable(stream):
        try:
            audio = await _groq_speech(text, interviewer)
            _note_engine(key, "groq")
            return audio
        except GroqVoiceError as err:
            _groq_failed(stream, err)
    if _model is None:
        raise TTSUnavailable(_load_error or "Voice model is still loading")
    audio = await asyncio.to_thread(_synthesize_sync, text[:MAX_CHARS], VOICES.get(interviewer, "af_heart"))
    reason = _groq_off.get(stream, (0, ""))[1] if engine == "groq" else ""
    _note_engine(key, f"kokoro;fallback={reason}" if reason else "kokoro")
    return audio


def _note_engine(key: tuple[str, str], engine: str) -> None:
    _engine_used[key] = engine
    if len(_engine_used) > _CACHE_SIZE * 4:
        _engine_used.popitem(last=False)


def engine_used(text: str, interviewer: str) -> str:
    """Which engine voiced this line (sent as X-Voice-Engine, for debugging)."""
    return _engine_used.get((interviewer, normalize_for_speech(text)), "")


async def synthesize(text: str, interviewer: str) -> bytes:
    """Return WAV audio for `text`, or raise TTSUnavailable / NotAllowed."""
    text = normalize_for_speech(text)
    plan = _allowed.get(text)
    if plan is None:
        raise NotAllowed("Only interviewer lines can be voiced")
    stream, engine = plan
    if engine != "groq" and _model is None:
        raise TTSUnavailable(_load_error or "Voice model is still loading")
    key = (interviewer, text)
    if key in _cache:
        _cache.move_to_end(key)
        return _cache[key]
    task = _inflight.get(key)
    if task is None:
        task = asyncio.create_task(_generate(text, interviewer, stream, engine))
        _inflight[key] = task
        task.add_done_callback(lambda t, k=key: _remember(k, t))
    # shield: if this HTTP request is cancelled, the generation still finishes for the cache
    return await asyncio.shield(task)


_latest_line: dict[str, str] = {}  # stream (interview id) -> the line being voiced now


def presynthesize(text: str, interviewer: str, stream: str = "default") -> list[str]:
    """Start generating an interviewer line NOW, in order, in the background, and return its
    chunks. The browser requests exactly these chunks and finds them ready or in progress,
    instead of only starting generation after the response reaches it.

    A newer line on the same `stream` (interview) stops the older one: speech nobody will
    hear (the candidate skipped it or answered early) must not delay the next reply. The
    generator is single-file, so in testing a stale backlog pushed first audio to ~10 s.

    Groq: the whole line is ONE chunk (one request: the free tier allows 100 a day). Kokoro:
    sentence chunks, so speaking can start before the whole line is generated. Must be
    called inside the request (the background task inherits the request's Groq key).
    """
    engine = "groq" if groq_voice_usable(stream) else "kokoro"
    line = normalize_for_speech(text)
    chunks = [line] if engine == "groq" and 0 < len(line) <= MAX_CHARS else speech_chunks(text)
    if engine == "groq" and len(chunks) > 1:
        engine = "kokoro"  # a very long line: sentence chunks on Kokoro
    allow(chunks, stream, engine)  # register first: the browser may ask while the model loads
    if (engine == "kokoro" and _model is None) or not chunks:
        return chunks
    _latest_line[stream] = text

    async def run() -> None:
        for chunk in chunks:
            if _latest_line.get(stream) != text:
                return  # superseded by a newer line in this interview
            try:
                await synthesize(chunk, interviewer)
            except Exception:  # noqa: BLE001 - background warm-up only; the browser will retry
                return

    task = asyncio.create_task(run())
    _background.add(task)
    task.add_done_callback(_background.discard)
    return chunks
