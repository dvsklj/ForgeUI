"""Typed application configuration."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import AnyHttpUrl, Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """ForgeUI settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="FORGEUI_",
        extra="ignore",
        case_sensitive=False,
    )

    environment: Literal["development", "test", "production"] = "development"
    host: str = "127.0.0.1"
    port: int = Field(default=8000, ge=1, le=65535)
    root_path: str = ""
    data_dir: Path = Path("./data")
    database_url: str = "sqlite:///./data/forgeui.db"

    secret_key: SecretStr = SecretStr("development-only-change-me")
    admin_token: SecretStr | None = None
    allow_public_read: bool = True
    allow_insecure_production: bool = False
    secure_cookies: bool = False
    trusted_hosts: list[str] = ["localhost", "127.0.0.1", "testserver"]
    frame_ancestors: list[str] = ["'self'"]

    ollama_base_url: AnyHttpUrl = AnyHttpUrl("http://host.docker.internal:11434")
    ollama_model: str = "qwen3.5:9b"
    ollama_connect_timeout_seconds: float = Field(default=5.0, gt=0, le=30)
    ollama_response_timeout_seconds: float = Field(default=90.0, gt=1, le=600)
    ollama_max_concurrency: int = Field(default=1, ge=1, le=16)
    ollama_temperature: float = Field(default=0.1, ge=0, le=2)
    ollama_seed: int | None = 42
    ollama_keep_alive: str = "10m"

    max_manifest_bytes: int = Field(default=262_144, ge=16_384, le=2_097_152)
    max_request_bytes: int = Field(default=1_048_576, ge=16_384, le=10_485_760)
    generation_max_attempts: int = Field(default=3, ge=1, le=3)
    generation_job_timeout_seconds: float = Field(default=180.0, gt=10, le=900)
    generation_poll_interval_ms: int = Field(default=1000, ge=250, le=10_000)

    tailwind_cdn_url: str = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11"
    htmx_cdn_url: str = "https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js"
    htmx_sri: str = "sha384-H5SrcfygHmAuTDZphMHqBJLc3FhssKjG7w/CeCpFReSfwBWDTKpkzPP8c+cLsK+V"
    asset_mode: Literal["cdn", "self-hosted"] = "self-hosted"

    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    json_logs: bool = False

    @field_validator("root_path")
    @classmethod
    def normalize_root_path(cls, value: str) -> str:
        if not value or value == "/":
            return ""
        return "/" + value.strip("/")

    @field_validator("database_url")
    @classmethod
    def reject_unsupported_database_schemes(cls, value: str) -> str:
        if not value.startswith("sqlite:///"):
            raise ValueError("ForgeUI 0.1 supports sqlite:/// database URLs")
        return value

    @field_validator("frame_ancestors")
    @classmethod
    def validate_frame_ancestors(cls, values: list[str]) -> list[str]:
        """Accept only self or exact HTTP(S) origins, never wildcards or paths."""

        if not values:
            raise ValueError("frame_ancestors must contain at least one source")
        normalized: list[str] = []
        for value in values:
            if value == "'self'":
                normalized.append(value)
                continue
            parsed = urlsplit(value)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.username is not None
                or parsed.password is not None
                or parsed.path not in {"", "/"}
                or parsed.query
                or parsed.fragment
                or "*" in value
            ):
                raise ValueError("frame_ancestors entries must be exact HTTP(S) origins")
            normalized.append(f"{parsed.scheme}://{parsed.netloc}")
        return list(dict.fromkeys(normalized))

    def validate_runtime(self) -> None:
        """Fail early on configurations that would expose an insecure instance."""

        default_secret = self.secret_key.get_secret_value() == "development-only-change-me"
        if self.environment == "production" and not self.allow_insecure_production:
            if default_secret:
                raise ValueError("FORGEUI_SECRET_KEY must be changed in production")
            if self.admin_token is None:
                raise ValueError("FORGEUI_ADMIN_TOKEN is required in production")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached default settings object for the process."""

    settings = Settings()
    settings.validate_runtime()
    return settings
