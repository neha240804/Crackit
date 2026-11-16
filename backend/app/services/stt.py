"""Speech-to-text with Groq's hosted Whisper (free tier).

- language="en" skips language detection: faster and avoids mis-detection on short clips.
- `prompt` biases Whisper toward expected vocabulary (e.g. "bias-variance, XGBoost"), so
  technical terms are spelled correctly.
- response_format="verbose_json" also returns the audio duration, used for words-per-minute.
"""

from groq import AsyncGroq

from app.core.config import settings
from app.core.http import groq_http_client

_client: AsyncGroq | None = None
MIN_SPEECH_SECONDS = 0.8
# Whisper's well-known outputs for silence/noise. Rejected so silence isn't scored as an answer.
SILENCE_HALLUCINATIONS = {"thank you.", "thanks for watching!", "thank you for watching.",
                          "you", ".", "bye.", "thank you"}


def _get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.groq_api_key, http_client=groq_http_client())
    return _client


async def transcribe(audio: bytes, filename: str, prompt: str | None = None) -> tuple[str, float | None]:
    """Return (text, duration_seconds). Text is "" when nothing usable was said."""
    result = await _get_client().audio.transcriptions.create(
        file=(filename, audio),
        model=settings.stt_model,
        language="en",
        response_format="verbose_json",
        temperature=0,
        prompt=(prompt or "")[:400] or None,
    )
    text = (result.text or "").strip()
    extra = getattr(result, "model_extra", None) or {}
    duration = getattr(result, "duration", None) or extra.get("duration")
    if (duration is not None and duration < MIN_SPEECH_SECONDS) or \
            text.lower() in SILENCE_HALLUCINATIONS:
        return "", duration
    return text, duration
