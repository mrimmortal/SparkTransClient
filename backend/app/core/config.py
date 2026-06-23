from functools import lru_cache

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "SparkTransClient"
    app_env: str = "development"
    app_version: str = "0.1.0"
    secret_key: str = Field(default="dev-only-change-me", min_length=16)
    database_url: str = "sqlite:///./data/app.db"
    cookie_name: str = "sparktrans_session"
    cookie_secure: bool = False
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]
    trusted_hosts: list[str] = ["127.0.0.1", "localhost"]
    corestt_ws_url: str = "ws://127.0.0.1:8020/ws/transcribe"
    max_upload_bytes: int = 10 * 1024 * 1024
    max_audio_packet_bytes: int = 512 * 1024
    login_rate_limit_per_minute: int = 10

    @field_validator("cors_origins", "trusted_hosts", mode="before")
    @classmethod
    def split_csv(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
