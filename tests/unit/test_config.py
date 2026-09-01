from __future__ import annotations

import pytest
from pydantic import ValidationError

from forgeui.config import Settings


def settings(**overrides: object) -> Settings:
    return Settings(_env_file=None, **overrides)


def test_root_path_is_normalized() -> None:
    assert settings(root_path="/embedded/").root_path == "/embedded"
    assert settings(root_path="/").root_path == ""


def test_database_backend_is_deliberately_bounded() -> None:
    with pytest.raises(ValidationError, match="sqlite"):
        settings(database_url="postgresql://localhost/forgeui")


def test_production_requires_secret_and_admin_token() -> None:
    with pytest.raises(ValueError, match="SECRET_KEY"):
        settings(environment="production").validate_runtime()

    with pytest.raises(ValueError, match="ADMIN_TOKEN"):
        settings(environment="production", secret_key="a-long-random-secret").validate_runtime()


def test_explicit_insecure_override_is_required_for_unprotected_production() -> None:
    configured = settings(environment="production", allow_insecure_production=True)
    configured.validate_runtime()


def test_generation_attempts_are_bounded() -> None:
    with pytest.raises(ValidationError):
        settings(generation_max_attempts=4)


def test_default_model_matches_the_supported_nine_billion_parameter_target() -> None:
    assert settings().ollama_model == "qwen3.5:9b"


def test_compact_self_hosted_assets_are_the_default() -> None:
    assert settings().asset_mode == "self-hosted"


def test_frame_ancestors_accept_only_exact_origins() -> None:
    assert settings(frame_ancestors=["'self'", "https://chat.example.test/"]).frame_ancestors == [
        "'self'",
        "https://chat.example.test",
    ]
    with pytest.raises(ValidationError, match="exact HTTP"):
        settings(frame_ancestors=["https://*.example.test"])
    with pytest.raises(ValidationError, match="exact HTTP"):
        settings(frame_ancestors=["https://chat.example.test/path"])
