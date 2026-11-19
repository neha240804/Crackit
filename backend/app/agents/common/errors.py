"""Turn a failed Groq call into an honest, actionable HTTP error.

With bring-your-own-key there are two very different "AI failed" stories, and the user can
only fix one of them: their own key was rejected or ran out (they can fix it in Settings),
or the shared server key did (they can't, beyond waiting or adding their own key).
"""

import logging

import groq
from fastapi import HTTPException

from app.core.groq_key import using_own_key

logger = logging.getLogger(__name__)

OWN_KEY_REJECTED = ("Groq rejected your saved API key (it may have been deleted or mistyped). "
                    "Update or remove it in Settings.")


def groq_cause(exc: BaseException) -> BaseException | None:
    """The groq.AuthenticationError / RateLimitError behind `exc`, if any (LangChain and
    LangGraph wrap the original error, so walk the chain)."""
    seen = 0
    cause: BaseException | None = exc
    while cause is not None and seen < 10:
        if isinstance(cause, groq.AuthenticationError | groq.RateLimitError):
            return cause
        cause = cause.__cause__ or cause.__context__
        seen += 1
    return None


def ai_http_error(exc: Exception, what: str) -> HTTPException:
    """`what` names the step for the generic message, e.g. "The AI interviewer"."""
    logger.exception("%s failed", what)  # always log the real cause (see CLAUDE.md gotchas)
    cause = groq_cause(exc)
    own = using_own_key()
    if isinstance(cause, groq.AuthenticationError):
        if own:
            # 400, not 401: the frontend treats 401 as "your login expired" and logs out.
            return HTTPException(400, OWN_KEY_REJECTED)
        return HTTPException(502, f"{what} is unavailable right now (server configuration). "
                                  "Please try again later.")
    if isinstance(cause, groq.RateLimitError):
        if own:
            return HTTPException(503, "Your Groq key reached its free-tier limit for now. "
                                      "Wait a minute and try again.")
        return HTTPException(503, f"{what} is busy right now (shared free-tier limit). Wait a "
                                  "few seconds and try again, or add your own free Groq key "
                                  "in Settings.")
    return HTTPException(502, f"{what} hit an error ({exc.__class__.__name__}). "
                              "Please try again.")
