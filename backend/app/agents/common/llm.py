"""One place to create chat models.

Agents ask for a *tier* ("fast" or "strong"), never a model name, so switching models or
even providers is a config change. ChatGroq already retries rate-limit (429) errors with
backoff, which matters on Groq's free tier.

The gpt-oss models "think" (reasoning tokens) before answering, and that thinking counts
toward max_tokens. Too low a limit cuts the answer off, so we leave generous room.
"""

from typing import Literal

import groq
from langchain_core.runnables import Runnable
from langchain_groq import ChatGroq
from pydantic import BaseModel

from app.core.config import settings
from app.core.groq_key import current_groq_key
from app.core.http import groq_http_client

Tier = Literal["fast", "strong"]
Effort = Literal["low", "medium", "high"]


def get_llm(
    tier: Tier = "fast",
    temperature: float = 0.1,
    reasoning_effort: Effort = "low",
    max_tokens: int = 8192,
) -> ChatGroq:
    model = settings.llm_fast_model if tier == "fast" else settings.llm_strong_model
    return ChatGroq(
        model=model,
        api_key=current_groq_key(),  # the user's own key if they saved one (core/groq_key.py)
        temperature=temperature,
        reasoning_effort=reasoning_effort,  # "low" = faster/cheaper; raise for hard judgments
        max_tokens=max_tokens,
        # One quick retry for brief per-minute limits; then with_fallbacks switches model.
        # (4 retries with backoff meant ~8 s of silence before the fallback kicked in.)
        max_retries=1,
        timeout=90,
        http_async_client=groq_http_client(),  # reuse warm connections
    )


def get_structured_llm[SchemaT: BaseModel](
    schema: type[SchemaT],
    tier: Tier = "fast",
    temperature: float = 0.1,
    reasoning_effort: Effort = "low",
) -> Runnable:
    """An LLM that must answer with an instance of `schema` (a Pydantic model).

    method="json_schema" + strict=True makes Groq *enforce* the schema while generating
    (constrained decoding), instead of merely suggesting it. Tested on resumes:
    - function_calling: 400 errors when the model omits a field
    - json_schema (not strict): sometimes echoes the schema back or drops sections
    - json_schema + strict: complete, valid output every run
    """
    def build(t: Tier) -> Runnable:
        llm = get_llm(t, temperature, reasoning_effort)
        return llm.with_structured_output(schema, method="json_schema", strict=True)

    # Groq's free tier limits tokens PER MODEL per day (200k for gpt-oss-120b; hit during
    # testing -> 429 crashed an interview). Each model has its own quota, so on a rate
    # limit or a Groq server error, retry the same request on the other model.
    other: Tier = "strong" if tier == "fast" else "fast"
    return build(tier).with_fallbacks(
        [build(other)],
        # BadRequestError covers 400 json_validate_failed: a reply that broke the schema.
        # The other model gets a fresh try instead of the request failing outright.
        exceptions_to_handle=(groq.RateLimitError, groq.InternalServerError, groq.BadRequestError),
    )
