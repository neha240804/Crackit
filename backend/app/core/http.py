"""Shared HTTP connection pool for Groq (LLM + Whisper).

httpx closes idle connections after 5 s by default. A candidate usually speaks for longer
than that, so every answer paid for a new TLS connection. Measured: Whisper after 8 s idle
took 0.51 s with the default vs 0.33 s with a long keep-alive.
"""

from functools import lru_cache

import httpx


@lru_cache
def groq_http_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=90,
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10, keepalive_expiry=120),
    )
