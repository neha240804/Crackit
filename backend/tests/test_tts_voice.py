"""Interviewer voice: Groq Orpheus on the user's key first, local Kokoro as the fallback.

No network: Groq and Kokoro are replaced by fakes. What matters is the decision logic:
one Groq request per line, falling back to Kokoro (and staying there for that interview)
when Groq refuses, and never using Groq without the user's key.
"""

import io
import struct
import wave

import pytest

from app.core.groq_key import set_user_key
from app.services import tts

LINE = "Good answer. Now, how would you index this table, and what would it cost on inserts?"


@pytest.fixture
def voice(monkeypatch):
    """Fresh voice state, a fake Kokoro, a Groq key in the request context."""
    calls = {"groq": 0, "kokoro": 0}

    async def fake_groq(text, interviewer):
        calls["groq"] += 1
        return b"GROQ"

    def fake_kokoro(text, voice):
        calls["kokoro"] += 1
        return b"KOKORO"

    monkeypatch.setattr(tts, "_groq_speech", fake_groq)
    monkeypatch.setattr(tts, "_synthesize_sync", fake_kokoro)
    monkeypatch.setattr(tts, "_model", object())
    monkeypatch.setattr(tts.settings, "tts_engine", "groq")
    for state in (tts._cache, tts._inflight, tts._groq_off, tts._latest_line):
        state.clear()
    set_user_key("gsk_" + "Ab3" * 10)
    yield calls
    set_user_key(None)


def test_interviewers_use_the_chosen_groq_voices():
    assert tts.GROQ_VOICES == {"maya": "diana", "arjun": "troy", "sara": "hannah"}


async def test_groq_voices_a_whole_line_in_one_request(voice):
    chunks = tts.presynthesize(LINE, "maya", "s1")
    assert chunks == [tts.normalize_for_speech(LINE)]  # one chunk = one Groq request
    assert await tts.synthesize(chunks[0], "maya") == b"GROQ"
    assert voice == {"groq": 1, "kokoro": 0}  # presynthesize and /tts share one request
    assert tts.engine_used(chunks[0], "maya") == "groq"


async def test_without_a_key_the_line_is_split_for_kokoro(voice):
    set_user_key(None)
    chunks = tts.presynthesize(LINE, "maya", "s2")
    assert len(chunks) == 2  # sentence chunks: speaking starts before the whole line is ready
    assert await tts.synthesize(chunks[0], "maya") == b"KOKORO"
    assert voice["groq"] == 0


async def test_groq_refusal_falls_back_and_sticks_for_the_interview(voice, monkeypatch):
    async def refuse(text, interviewer):
        voice["groq"] += 1
        raise tts.GroqVoiceError("terms", "accept the model terms")

    monkeypatch.setattr(tts, "_groq_speech", refuse)
    chunks = tts.presynthesize(LINE, "arjun", "s3")
    assert await tts.synthesize(chunks[0], "arjun") == b"KOKORO"  # same line, Kokoro instead
    assert tts.engine_used(chunks[0], "arjun") == "kokoro;fallback=terms"
    # The rest of this interview goes straight to Kokoro (no wasted Groq round trip)...
    later = tts.presynthesize("Thanks. What would you change next time, and why?", "arjun", "s3")
    assert len(later) == 2 and voice["groq"] == 1
    # ...while another interview still tries Groq.
    assert len(tts.presynthesize(LINE + " Take your time.", "sara", "s4")) == 1


def test_kokoro_engine_setting_never_calls_groq(voice, monkeypatch):
    monkeypatch.setattr(tts.settings, "tts_engine", "kokoro")
    assert not tts.groq_voice_usable("s5")


def test_streamed_groq_wav_is_read_in_full():
    """Groq streams its WAV: the header's length field is a placeholder, not the real one."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(b"\x10\x00" * 24000)  # 1 s
    data = bytearray(buffer.getvalue())
    data[40:44] = struct.pack("<I", 0x7FFFFFFF)  # data chunk size = "unknown", as streamed
    samples, rate = tts.read_wav(bytes(data))
    assert rate == 24000 and len(samples) == 24000


def test_browser_voice_is_the_default_and_the_server_voices_nothing(monkeypatch):
    """Product decision: the student's browser voices every line (no quota, no server load,
    no voice change mid-interview). The server then returns no chunks and generates nothing."""
    from app.core.config import Settings
    from app.services import interview_service

    assert Settings(_env_file=None).tts_engine == "browser"
    calls = []
    monkeypatch.setattr(tts, "presynthesize", lambda *a: calls.append(a) or ["chunk"])
    monkeypatch.setattr(interview_service.settings, "tts_engine", "browser")
    assert interview_service._voice("Hello there.", "maya", "s") == {"voice": "browser", "speech_chunks": []}
    assert calls == []
    monkeypatch.setattr(interview_service.settings, "tts_engine", "kokoro")
    assert interview_service._voice("Hello there.", "maya", "s") == {"voice": "server", "speech_chunks": ["chunk"]}
