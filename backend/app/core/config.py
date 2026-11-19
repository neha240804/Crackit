"""Central application settings.

pydantic-settings reads values from environment variables and the root `.env` file,
validates their types, and exposes them as one typed object. Every other module imports
`settings` from here instead of calling os.getenv() directly.
"""

import os
from functools import lru_cache
from pathlib import Path

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
    )

    # App
    app_env: str = "development"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440
    # Browser origins allowed to call the API, comma-separated in .env
    # (e.g. CORS_ORIGINS=https://crackit.example.com). Dev default: the Vite server.
    cors_origins: str = "http://localhost:5174"
    # AES-256 key that encrypts users' own Groq keys at rest (32 bytes, base64). Generate:
    # uv run python -c "from app.core.crypto import new_key_encryption_key as k; print(k())"
    # Required in production; in development a key is derived from SECRET_KEY.
    # Changing it makes saved keys unreadable (users are asked to add theirs again).
    key_encryption_key: str = ""
    # LangSmith tracing in production (sends user data to LangSmith). Off unless set to true.
    trace_in_production: bool = False

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
    groq_api_key: str = ""
    llm_fast_model: str = "openai/gpt-oss-20b"
    llm_strong_model: str = "openai/gpt-oss-120b"
    stt_model: str = "whisper-large-v3-turbo"

    # Interviewer voice (local Kokoro-82M via ONNX). Model file in data/models/kokoro/.
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
        if not self.key_encryption_key:
            problems.append("KEY_ENCRYPTION_KEY is missing (it encrypts users' Groq keys)")
        if not self.groq_api_key:
            problems.append("GROQ_API_KEY is missing")
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
