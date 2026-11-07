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


settings = Settings()
