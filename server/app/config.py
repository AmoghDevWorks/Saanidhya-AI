import os
from pathlib import Path
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load .env file from the server directory
server_dir = Path(__file__).resolve().parent.parent
dotenv_path = server_dir / ".env"
load_dotenv(dotenv_path=dotenv_path)


class Settings(BaseModel):
    """Application Settings and Configuration."""

    APP_NAME: str = "Saanidhya AI"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # MongoDB
    MONGODB_URI: str = Field(
        default_factory=lambda: os.getenv(
            "MONGODB_URI", "your_mongodb_connection_string"
        )
    )
    DATABASE_NAME: str = Field(
        default_factory=lambda: os.getenv("DATABASE_NAME", "saanidhya")
    )

    # JWT Authentication
    JWT_SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv(
            "JWT_SECRET_KEY", "dev_secret_key_change_in_production_min32chars!"
        )
    )
    JWT_ALGORITHM: str = Field(
        default_factory=lambda: os.getenv("JWT_ALGORITHM", "HS256")
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default_factory=lambda: int(
            os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
        )
    )

    # CORS & Frontend Origins
    FRONTEND_URL: str = Field(
        default_factory=lambda: os.getenv(
            "FRONTEND_URL", "http://localhost:5173"
        )
    )

    # Gnani AI API Key
    GNANI_API_KEY: str = Field(
        default_factory=lambda: os.getenv("GNANI_API_KEY", "")
    )
    PRISMA_API_KEY: str = Field(
        default_factory=lambda: os.getenv("PRISMA_API_KEY", os.getenv("GNANI_API_KEY", ""))
    )
    TIMBRE_API_KEY: str = Field(
        default_factory=lambda: os.getenv("TIMBRE_API_KEY", os.getenv("GNANI_API_KEY", ""))
    )
    PRISMA_MODEL: str = Field(
        default_factory=lambda: os.getenv("PRISMA_MODEL", "prisma-v3.0")
    )
    PRISMA_LANGUAGE_CODE: str = Field(
        default_factory=lambda: os.getenv("PRISMA_LANGUAGE_CODE", "indic-auto")
    )
    PRISMA_FORMAT: str = Field(
        default_factory=lambda: os.getenv("PRISMA_FORMAT", "verbatim")
    )
    GNANI_REQUEST_TIMEOUT_SECONDS: float = Field(
        default_factory=lambda: float(os.getenv("GNANI_REQUEST_TIMEOUT_SECONDS", "60"))
    )
    MAX_AUDIO_UPLOAD_BYTES: int = Field(
        default_factory=lambda: int(os.getenv("MAX_AUDIO_UPLOAD_BYTES", str(10 * 1024 * 1024)))
    )
    TIMBRE_MODEL: str = Field(
        default_factory=lambda: os.getenv("TIMBRE_MODEL", "timbre-v2.5")
    )
    TIMBRE_VOICE: str = Field(
        default_factory=lambda: os.getenv("TIMBRE_VOICE", "Nalini")
    )
    TIMBRE_LANGUAGE: str = Field(
        default_factory=lambda: os.getenv("TIMBRE_LANGUAGE", "auto")
    )
    EVON_MODEL_ID: str = Field(
        default_factory=lambda: os.getenv(
            "EVON_MODEL_ID", "gnani/gnani-evon-v3.3-30B-A3B"
        )
    )
    EVON_INFERENCE_MODE: str = Field(
        default_factory=lambda: os.getenv("EVON_INFERENCE_MODE", "local")
    )
    EVON_ENABLED: bool = Field(
        default_factory=lambda: os.getenv("EVON_ENABLED", "true").lower() == "true"
    )
    EVON_DEVICE_MAP: str = Field(
        default_factory=lambda: os.getenv("EVON_DEVICE_MAP", "auto")
    )
    EVON_MODEL_CACHE_DIR: str = Field(
        default_factory=lambda: os.getenv("EVON_MODEL_CACHE_DIR", "./model_cache")
    )
    EVON_MAX_NEW_TOKENS: int = Field(
        default_factory=lambda: int(os.getenv("EVON_MAX_NEW_TOKENS", "256"))
    )
    EVON_MAX_CONCURRENT_REQUESTS: int = Field(
        default_factory=lambda: int(os.getenv("EVON_MAX_CONCURRENT_REQUESTS", "1"))
    )
    EVON_INFERENCE_TIMEOUT_SECONDS: float = Field(
        default_factory=lambda: float(os.getenv("EVON_INFERENCE_TIMEOUT_SECONDS", "120"))
    )


settings = Settings()
