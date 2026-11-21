"""Error alerts (optional): unhandled server errors go to Sentry when SENTRY_DSN is set.

Privacy first. Sentry's defaults would send far too much for this app: request bodies (spoken
answers, resumes), headers (X-Groq-Key, the user's own API key; Authorization) and LOCAL
VARIABLES of every frame (which can hold resume text or the key). So:
  - include_local_variables=False, max_request_body_size="never", send_default_pii=False;
  - before_send drops the whole request section, user data and breadcrumbs (log lines and
    HTTP calls made before the error), keeping only the error type, message and stack trace;
  - no performance tracing.
The privacy notice (/privacy) promises exactly this; keep the two in step.
"""

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


def scrub(event: dict, _hint: dict) -> dict:
    for key in ("request", "user", "breadcrumbs", "extra", "contexts"):
        event.pop(key, None)
    return event


def init_error_alerts() -> bool:
    if not settings.sentry_dsn:
        return False
    import sentry_sdk

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,
        send_default_pii=False,
        include_local_variables=False,
        max_request_body_size="never",
        traces_sample_rate=0,
        before_send=scrub,
        before_send_transaction=lambda *_: None,
    )
    logger.info("Error alerts on (Sentry)")
    return True
