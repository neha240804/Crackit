"""Per-minute rate limits: stop one client from flooding an endpoint.

Why: without limits, one script could guess passwords at full speed, create thousands of
accounts, or loop the AI endpoints and burn the shared Groq quota for everyone (audit H2).

How: a sliding-window log. For each (rule, client) we keep the timestamps of recent calls in
a deque; a call is allowed when fewer than `times` happened in the last `seconds`.

Kept in memory on purpose: Crackit runs as ONE process (the voice cache and interview
streams already assume that), so a dict is exact and costs nothing. Losing the counts on a
restart is harmless for windows of seconds to an hour. (There are no daily quotas: every AI
call runs on the user's own Groq key, and Groq enforces its quota.) If the API ever runs as
several processes, move this to Redis or Postgres, or each process would allow the full limit.

Behind a reverse proxy, run uvicorn with --proxy-headers --forwarded-allow-ips=<proxy ip>
so request.client.host is the visitor's IP and not the proxy's (else everyone shares one
IP limit).
"""

import math
import time
from collections import deque

from fastapi import Depends, HTTPException, Request

from app.api.deps import CurrentUser

_hits: dict[tuple[str, str], deque[float]] = {}


def check(rule: str, client: str, times: int, seconds: float, now: float | None = None) -> None:
    """Record one call, or raise 429 with Retry-After if the client is over the limit."""
    now = time.monotonic() if now is None else now
    key = (rule, client)
    window = _hits.setdefault(key, deque())
    while window and window[0] <= now - seconds:  # forget calls older than the window
        window.popleft()
    if len(window) >= times:
        retry = max(1, math.ceil(window[0] + seconds - now))
        raise HTTPException(
            429,
            f"Too many requests. Please wait {retry} s and try again.",
            headers={"Retry-After": str(retry)},
        )
    window.append(now)
    _cleanup(now)


_last_cleanup = 0.0


def _cleanup(now: float, every: float = 300, max_age: float = 3600) -> None:
    """Drop clients we haven't seen for an hour, so the dict can't grow forever."""
    global _last_cleanup
    if now - _last_cleanup < every:
        return
    _last_cleanup = now
    for key in [k for k, w in _hits.items() if not w or w[-1] < now - max_age]:
        del _hits[key]


def reset() -> None:
    """Forget all counts (tests)."""
    _hits.clear()


def per_user(rule: str, times: int, seconds: float):
    """Route dependency: at most `times` calls per `seconds` for each logged-in user."""

    async def dependency(user: CurrentUser) -> None:
        check(rule, str(user.id), times, seconds)

    return Depends(dependency)


def per_ip(rule: str, times: int, seconds: float):
    """Route dependency for routes without a user (login, register): limit by IP address."""

    async def dependency(request: Request) -> None:
        check(rule, request.client.host if request.client else "unknown", times, seconds)

    return Depends(dependency)
