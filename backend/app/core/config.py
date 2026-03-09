import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Get the directory where this file is located (app/core)
# and then go up two levels to get to the backend root where .env is
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
env_path = os.path.join(BASE_DIR, ".env")

# Load environment variables from .env file
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "supersecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost;DATABASE=ITInventoryDB;Trusted_Connection=yes;TrustServerCertificate=yes;"

    # SMTP Configuration
    SMTP_SERVER: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None

    model_config = SettingsConfigDict(
        env_file=env_path,
        env_file_encoding='utf-8',
        extra='ignore'
    )

# Create a settings instance
settings = Settings()
print(f"Settings initialized. SMTP_SERVER: {settings.SMTP_SERVER}, SMTP_USER: {settings.SMTP_USER}")
