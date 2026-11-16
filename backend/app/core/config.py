"""Central application settings.

pydantic-settings reads values from environment variables and the root `.env` file,
validates their types, and exposes them as one typed object. Every other module imports
`settings` from here instead of calling os.getenv() directly.
"""

from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
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

    # PostgreSQL (own database and port, so it can run next to CareerPilot AI)
    postgres_user: str = "mockinterview"
    postgres_password: str = "mockinterview"
    postgres_db: str = "mockinterview"
    postgres_host: str = "localhost"
    postgres_port: int = 5434

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
