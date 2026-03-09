import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()
print(f"ENV_SERVER: {os.getenv('SMTP_SERVER')}")
print(f"ENV_USER: {os.getenv('SMTP_USER')}")

class Settings(BaseSettings):
    SMTP_SERVER: str | None = None
    SMTP_USER: str | None = None
    SMTP_PORT: int = 587
    SMTP_PASSWORD: str | None = None

    class Config:
        env_file = ".env"
        extra = "ignore"

try:
    s = Settings()
    print(f"S_SERVER: {s.SMTP_SERVER}")
    print(f"S_USER: {s.S_USER}")
except Exception as e:
    print(f"ERR: {e}")
