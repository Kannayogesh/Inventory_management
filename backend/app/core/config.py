from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "supersecretkey"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "DRIVER={ODBC Driver 18 for SQL Server};SERVER=localhost;DATABASE=ITInventoryDB;Trusted_Connection=yes;TrustServerCertificate=yes;"

    class Config:
        env_file = ".env"
        extra = "ignore"


# Create a settings instance
settings = Settings()