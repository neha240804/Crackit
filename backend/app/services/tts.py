"""Interviewer voice: Kokoro-82M, a small open-source neural TTS model (Apache-2.0),
run locally through ONNX Runtime. Free, private (text never leaves the machine), and
fast enough on a laptop CPU.

- The model loads once in the background at startup (see main.py lifespan).
- Synthesis is CPU-heavy, so it runs in a worker thread: the async server stays responsive.
- If the model files are missing or still loading, TTSUnavailable makes the API return
  503 and the browser falls back to its built-in voice.

Model files (git-ignored) go in data/models/kokoro/, from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1
"""

import asyncio
import io
import re
import threading
import time
import wave
from collections import OrderedDict

import numpy as np

from app.core.config import DATA_DIR, settings

MODEL_DIR = DATA_DIR / "models" / "kokoro"
MAX_CHARS = 600

# Persona -> Kokoro voice (American / British English neural voices).
VOICES = {"maya": "af_heart", "sara": "bf_emma", "arjun": "am_michael"}

_model = None
_load_error: str | None = None
_lock = threading.Lock()  # one synthesis at a time: parallel runs only fight over the CPU
_cache: OrderedDict[tuple[str, str], bytes] = OrderedDict()
_CACHE_SIZE = 64


class TTSUnavailable(Exception):
    pass


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


async def synthesize(text: str, interviewer: str) -> bytes:
    """Return WAV audio for `text`, or raise TTSUnavailable."""
    if _model is None:
        raise TTSUnavailable(_load_error or "Voice model is still loading")
    text = normalize_for_speech(text)
    voice = VOICES.get(interviewer, "af_heart")
    key = (voice, text)
    if key in _cache:
        _cache.move_to_end(key)
        return _cache[key]
    task = _inflight.get(key)
    if task is None:
        task = asyncio.create_task(asyncio.to_thread(_synthesize_sync, text[:MAX_CHARS], voice))
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
    """
    chunks = speech_chunks(text)
    if _model is None or not chunks:
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
