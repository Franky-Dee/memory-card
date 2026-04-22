from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Memory Card API"
    api_prefix: str = "/api"
    demo_mode: bool = True
    mongo_url: str = Field(default="mongodb://localhost:27017")
    mongo_database: str = Field(default="memory_card")
    jwt_secret: str = Field(default="change-me-in-production")
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 60 * 24
    rawg_api_key: str | None = None
    igdb_client_id: str | None = None
    igdb_access_token: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

