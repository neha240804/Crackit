"""Central application settings.

pydantic-settings reads values from environment variables and the root `.env` file,
validates their types, and exposes them as one typed object. Every other module imports
`settings` from here instead of calling os.getenv() directly.
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py -> parents[3] is the repository root, where `.env` lives.
ROOT_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT_DIR / "data"  # uploaded resumes, generated files (git-ignored)

# Also export .env into os.environ: LangChain/LangSmith read LANGSMITH_* from there directly.
load_dotenv(ROOT_DIR / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ROOT_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",  # ignore .env keys this class doesn't declare
        # A failed check (e.g. the production refusal below) must not print the settings:
        # pydantic's error includes the input values by default, and a container log once
        # showed the tail of a secret that way.
        hide_input_in_errors=True,
    )

    # App
    app_env: str = "development"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440
    # Browser origins allowed to call the API, comma-separated in .env
    # (e.g. CORS_ORIGINS=https://crackit.example.com). Dev default: the Vite server.
    cors_origins: str = "http://localhost:5174"
    # LangSmith tracing in production (sends user data to LangSmith). Off unless set to true.
    trace_in_production: bool = False
    # The site's public address, for links in emails (password reset), e.g.
    # https://crackit.example.com. Dev default: the Vite server.
    app_url: str = "http://localhost:5174"

    # Outgoing email (password reset). Plain SMTP, so any provider works (Brevo, Mailjet,
    # Resend, Amazon SES, a Gmail app password...). Not set in development: the reset link is
    # written to the server log instead. Not set in production: reset answers 503 and startup
    # logs a warning, so a missing setup is visible instead of silently sending nothing.
    smtp_host: str = ""
    smtp_port: int = 587  # 587 = STARTTLS; 465 = TLS from the start
    smtp_user: str = ""
    smtp_password: str = ""
    mail_from: str = ""  # e.g. "Crackit <no-reply@crackit.example.com>"
    password_reset_minutes: int = 30

    # Error alerts (optional): a Sentry DSN sends unhandled server errors to Sentry, with no
    # request bodies, headers or user data (see main.py). Empty = off.
    sentry_dsn: str = ""

    # PostgreSQL (own database and port, so it can run next to CareerPilot AI)
    postgres_user: str = "mockinterview"
    postgres_password: str = "mockinterview"
    postgres_db: str = "mockinterview"
    postgres_host: str = "localhost"
    postgres_port: int = 5434

    # Connection pools. Requests release their DB connection before slow AI calls (see
    # release_connection), so these cover the DB work of ~100 users, not their AI waits.
    # Total (pool + overflow + checkpointer pool) must stay under Postgres max_connections (100).
    db_pool_size: int = 20
    db_max_overflow: int = 10
    checkpoint_pool_size: int = 20

    # Qdrant
    qdrant_url: str = "http://localhost:6335"

    # LLM (Groq free tier). "fast" = the live interviewer and the interview plan;
    # "strong" = resume parsing and the feedback report. Each falls back to the other.
    # No server API key: every call uses the user's own key (core/groq_key.py). A leftover
    # GROQ_API_KEY in .env is ignored (extra="ignore").
    llm_fast_model: str = "openai/gpt-oss-20b"
    llm_strong_model: str = "openai/gpt-oss-120b"
    stt_model: str = "whisper-large-v3-turbo"

    # Interviewer voice (product decision, Nov 21, 2026: "browser").
    # "browser": the student's own browser voice (Web Speech API). Instant, unlimited, no
    #   download and no server work, so 3 x 15-minute interviews a day work for everyone and
    #   the voice never changes mid-interview. Quality depends on the browser (Edge's
    #   "Natural" voices are good). The server does no voice work and doesn't load Kokoro.
    # Measured alternatives (docs/DEPLOYMENT.md, Capacity):
    # "kokoro": local Kokoro on the server: ~1 interview at a time without gaps (4-core VM:
    #   ~6 s wait even for one). "groq": Orpheus on the user's key: fast, but the free tier
    #   allows only 3,600 characters a day (< one 15-minute interview), after which the voice
    #   switched to Kokoro mid-interview. Kokoro in the browser (prototype, removed): ~26 s
    #   wait on CPU, 4-6 s on WebGPU on the dev laptop.
    tts_engine: Literal["browser", "groq", "kokoro"] = "browser"
    groq_tts_model: str = "canopylabs/orpheus-v1-english"
    # Local Kokoro-82M via ONNX (the fallback). Model file in data/models/kokoro/.
    # Full fp32 model: on this CPU the int8 one measured ~5x SLOWER (RTF 3.2 vs 0.65).
    kokoro_model: str = "kokoro-v1.0.onnx"
    tts_speed: float = 1.1  # slightly brisker than default: confident, conversational

    # Embeddings (local FastEmbed, no API key). The dimension must match the Qdrant collections.
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_dim: int = 384

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() in ("production", "prod")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @model_validator(mode="after")
    def refuse_unsafe_production_config(self) -> "Settings":
        """Fail at startup rather than run production on development defaults.

        The defaults below are fine on a laptop and dangerous on a server: with the default
        SECRET_KEY anyone can sign a login token for any user id, and the default database
        password is public (it's in this repo). A missing .env must stop the app, not
        silently fall back to them."""
        if not self.is_production:
            return self
        problems = []
        if self.secret_key in ("change-me", "change-me-to-a-long-random-string") or len(self.secret_key) < 32:
            problems.append("SECRET_KEY must be a random string of at least 32 characters")
        if self.postgres_password == "mockinterview":
            problems.append("POSTGRES_PASSWORD is still the development default")
        if any(o.startswith("http://localhost") or o == "*" for o in self.cors_origin_list):
            problems.append("CORS_ORIGINS must list the real site origin(s), not localhost or *")
        if problems:
            raise ValueError("Unsafe production settings: " + "; ".join(problems))
        return self

    @property
    def database_url(self) -> str:
        # "+asyncpg" tells SQLAlchemy to use the async driver.
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )


@lru_cache  # build Settings once and reuse it everywhere
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# LangSmith traces contain everything the AI saw: resumes, job posts, interview transcripts.
# Useful while developing; in production it would send every user's data to a third party
# without telling them (audit H7). Off in production unless explicitly re-enabled.
if settings.is_production and not settings.trace_in_production:
    os.environ["LANGSMITH_TRACING"] = "false"
    os.environ["LANGCHAIN_TRACING_V2"] = "false"
