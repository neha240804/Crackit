#!/bin/sh
# Container start: bring the database schema up to date, then serve the API.
set -e

# Migrations run on every start; Alembic does nothing when the schema is already current.
# Doing it here means a deploy is just "pull, build, up": no separate manual step to forget.
alembic upgrade head

# Exactly ONE uvicorn process (no --workers): the per-minute rate limits, the voice cache and
# the TTS in-flight dedupe live in this process's memory (see core/rate_limit.py).
#
# --proxy-headers / --forwarded-allow-ips: the API sits behind Caddy, so without these every
# request would look like it came from Caddy's IP and all visitors would share one per-IP
# login/register limit. "*" trusts X-Forwarded-For from any peer, which is safe ONLY because
# this port is not published: the sole peer that can reach it is Caddy on the compose network,
# and Caddy overwrites any X-Forwarded-For a visitor sends.
#
# No --loop flag: the Windows-only SelectorEventLoop workaround isn't needed on Linux.
exec uvicorn app.main:app \
    --host 0.0.0.0 --port 8001 \
    --proxy-headers --forwarded-allow-ips="*" \
    --timeout-keep-alive 75
