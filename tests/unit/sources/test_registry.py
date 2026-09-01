from __future__ import annotations

from dataclasses import FrozenInstanceError

import pytest
from pydantic import BaseModel, ConfigDict

from forgeui.sources import (
    DataContractRegistry,
    DataSourceRegistry,
    Principal,
    SourceError,
    SourceFrozenError,
    SourceUnauthorizedError,
    SourceUnknownError,
)


class Result(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str
    count: int


class Query(BaseModel):
    model_config = ConfigDict(extra="forbid")
    term: str


def contracts() -> DataContractRegistry:
    registry = DataContractRegistry()
    registry.register("search-results/1", Result, expression_paths=["data.title", "data.count"])
    return registry


@pytest.mark.parametrize("value", ["Search", "a..b", ".search", "search/1", "search_"])
def test_source_identifiers_are_strict(value: str) -> None:
    registry = DataSourceRegistry(contracts())
    with pytest.raises(SourceError, match="identifier"):
        registry.register(value, contract_id="search-results/1", handler=lambda _c, _i: {})


@pytest.mark.parametrize(
    "value", ["search-results", "search-results/0", "search-results/x", "Search/1"]
)
def test_contract_identifiers_are_versioned(value: str) -> None:
    with pytest.raises(SourceError, match="identifier"):
        DataContractRegistry().register(value, Result, expression_paths=["data.title"])


def test_contracts_validate_strictly_publish_schema_and_freeze() -> None:
    registry = contracts()
    assert registry.contract_ids == {"search-results/1"}
    assert registry.policy_paths == {"search-results/1": {"data.title", "data.count"}}
    assert registry.validate("search-results/1", {"title": "Found", "count": 2}) == {
        "title": "Found",
        "count": 2,
    }
    assert registry.docs()[0]["expression_paths"] == ["data.count", "data.title"]
    assert registry.schema("search-results/1")["type"] == "object"
    with pytest.raises(SourceError, match="contract"):
        registry.validate("search-results/1", {"title": "Found", "count": "2"})
    registry.freeze()
    with pytest.raises(SourceFrozenError):
        registry.register("other/1", Result, expression_paths=["data.title"])


def test_contract_example_is_validated_and_returned_as_a_detached_copy() -> None:
    registry = DataContractRegistry()
    registry.register(
        "search-results/1",
        Result,
        expression_paths=["data.title", "item.title"],
        example={"title": "Example", "count": 1},
    )
    example = registry.example("search-results/1")
    assert example == {"title": "Example", "count": 1}
    assert example is not None
    example["title"] = "Changed"
    assert registry.example("search-results/1") == {"title": "Example", "count": 1}

    with pytest.raises(SourceError, match="example"):
        DataContractRegistry().register(
            "invalid/1",
            Result,
            expression_paths=["data.title"],
            example={"title": "Example", "count": "1"},
        )


def test_sources_reject_before_handler_and_validate_every_boundary() -> None:
    calls = 0

    def handler(_context: object, request: Query | None) -> object:
        nonlocal calls
        calls += 1
        assert request is not None
        return {"title": request.term, "count": 1}

    registry = DataSourceRegistry(contracts())
    registry.register(
        "search.results",
        contract_id="search-results/1",
        handler=handler,
        input_model=Query,
        authorize=lambda context, _input: context.principal.actor_id == "allowed",
    )
    with pytest.raises(SourceUnknownError):
        registry.fetch(
            "missing", principal=Principal(actor_id="allowed"), input_value={"term": "x"}
        )
    with pytest.raises(SourceError, match="input"):
        registry.fetch(
            "search.results", principal=Principal(actor_id="allowed"), input_value={"term": 1}
        )
    with pytest.raises(SourceUnauthorizedError):
        registry.fetch(
            "search.results", principal=Principal(actor_id="no"), input_value={"term": "x"}
        )
    assert calls == 0
    envelope = registry.fetch(
        "search.results", principal=Principal(actor_id="allowed"), input_value={"term": "x"}
    )
    assert envelope.data == {"title": "x", "count": 1}
    copy = envelope.data
    copy["title"] = "changed"
    assert envelope.data["title"] == "x"
    with pytest.raises(FrozenInstanceError):
        envelope.source_id = "other"  # type: ignore[misc]


def test_duplicate_freeze_invalid_output_and_size() -> None:
    contract_registry = contracts()
    registry = DataSourceRegistry(contract_registry, max_response_bytes=20)
    registry.register(
        "search",
        contract_id="search-results/1",
        handler=lambda _c, _i: {"title": "long", "count": 1},
    )
    with pytest.raises(SourceError, match="already"):
        registry.register("search", contract_id="search-results/1", handler=lambda _c, _i: {})
    with pytest.raises(SourceError, match="maximum size"):
        registry.fetch("search", principal=Principal(actor_id="one"))
    registry.freeze()
    assert registry.source_contracts == {"search": "search-results/1"}
    assert contract_registry.frozen
    with pytest.raises(SourceFrozenError):
        contract_registry.register("other/1", Result, expression_paths=["data.title"])
    with pytest.raises(SourceFrozenError):
        registry.register("other", contract_id="search-results/1", handler=lambda _c, _i: {})
