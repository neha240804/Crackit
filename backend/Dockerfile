# Crackit API (FastAPI + LangGraph + Kokoro voice). Build from the REPO ROOT:
#   docker build -f backend/Dockerfile -t crackit-backend .
# (the context must include knowledge_base/, which sits next to backend/).
#
# Runs on amd64 and arm64 (the target server is an Oracle Cloud Ampere A1 VM): every
# dependency ships Linux aarch64 wheels (onnxruntime, fastembed, psycopg, asyncpg, bcrypt).
#
# Layout inside the image mirrors the repo, because app/core/config.py finds the project
# root as parents[3] of itself:
#   /srv/backend/app/...      code              -> ROOT_DIR = /srv
#   /srv/knowledge_base/      question banks    (baked in: they change with a deploy)
#   /srv/data/                uploads, exports, Kokoro + FastEmbed models (a mounted volume)

FROM python:3.12-slim AS base

# uv: the same installer used in development, pinned so builds are repeatable.
COPY --from=ghcr.io/astral-sh/uv:0.11.23 /uv /usr/local/bin/uv

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/srv/.venv \
    PATH="/srv/.venv/bin:$PATH"

WORKDIR /srv/backend

# 1) Dependencies only (cached until pyproject.toml / uv.lock change).
#    --frozen: install exactly what uv.lock says; --no-dev: no pytest/ruff in production.
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# 2) The app itself.
COPY backend/ ./
COPY knowledge_base/ /srv/knowledge_base/

# Run as an unprivileged user: a bug in the app can't then change the image or the host.
# The data volume must be writable by this uid (see docs/DEPLOYMENT.md: chown 10001).
# (sed: a checkout on Windows may give the script CRLF line endings, which sh can't run.)
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh \
    && useradd --uid 10001 --create-home crackit \
    && mkdir -p /srv/data \
    && chown -R crackit:crackit /srv/data
USER crackit

EXPOSE 8001

# Startup indexes the knowledge base and loads the embedding model (~30-90 s on a small
# CPU), hence the long start period before failed checks count.
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if b'\"ok\"' in urllib.request.urlopen('http://127.0.0.1:8001/api/v1/health', timeout=8).read() else 1)"

ENTRYPOINT ["/srv/backend/docker-entrypoint.sh"]
