"""Turn a failed Groq call into an honest, actionable HTTP error.

Every AI call runs on the user's own Groq key (bring-your-own-key only), so a rejected or
exhausted key is something the user can fix in Settings: say so. A missing key passes through
as its own 428 (core/groq_key.py) instead of becoming a generic "AI failed".
"""

import logging

import groq
from fastapi import HTTPException

from app.core.groq_key import GroqKeyMissing

logger = logging.getLogger(__name__)

OWN_KEY_REJECTED = ("Groq rejected your saved API key (it may have been deleted or mistyped). "
                    "Update or remove it in Settings.")


def groq_cause(exc: BaseException) -> BaseException | None:
    """The groq.AuthenticationError / RateLimitError / missing key behind `exc`, if any
    (LangChain and LangGraph wrap the original error, so walk the chain)."""
    seen = 0
    cause: BaseException | None = exc
    while cause is not None and seen < 10:
        if isinstance(cause, groq.AuthenticationError | groq.RateLimitError | GroqKeyMissing):
            return cause
        cause = cause.__cause__ or cause.__context__
        seen += 1
    return None


def ai_http_error(exc: Exception, what: str) -> HTTPException:
    """`what` names the step for the generic message, e.g. "The AI interviewer"."""
    cause = groq_cause(exc)
    if isinstance(cause, GroqKeyMissing):
        return cause  # not a failure worth a stack trace: the user hasn't added a key yet
    logger.exception("%s failed", what)  # always log the real cause (see CLAUDE.md gotchas)
    if isinstance(cause, groq.AuthenticationError):
        # 400, not 401: the frontend treats 401 as "your login expired" and logs out.
        return HTTPException(400, OWN_KEY_REJECTED)
    if isinstance(cause, groq.RateLimitError):
        return HTTPException(503, "Your Groq key reached its free-tier limit for now. "
                                  "Wait a minute and try again.")
    return HTTPException(502, f"{what} hit an error ({exc.__class__.__name__}). "
                              "Please try again.")
