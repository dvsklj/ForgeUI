"""Strict, frozen registries for host-owned data contracts and sources."""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Protocol, TypeAlias, cast

from pydantic import BaseModel, ValidationError

from forgeui.security import Principal

JsonScalar: TypeAlias = str | int | float | bool | None
JsonValue: TypeAlias = JsonScalar | list["JsonValue"] | dict[str, "JsonValue"]
JsonObject: TypeAlias = dict[str, JsonValue]

_SOURCE_ID = re.compile(r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$")
_CONTRACT_ID = re.compile(r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*/[1-9][0-9]*$")
_EXPRESSION_PATH = re.compile(r"^(?:data|item)(?:\.[a-z][a-z0-9_]*)+$")


class SourceError(ValueError):
    """A source request or trusted registry configuration was rejected."""


class SourceUnknownError(SourceError):
    """The requested host-owned source or contract was not registered."""


class SourceUnauthorizedError(SourceError):
    """The source is not authorized for the active principal."""


class SourceFrozenError(SourceError):
    """A registry cannot change after it has been frozen."""


def _require_id(value: str, pattern: re.Pattern[str], kind: str) -> str:
    if not isinstance(value, str) or len(value) > 120 or not pattern.fullmatch(value):
        raise SourceError(f"invalid {kind} identifier")
    return value


def _canonical_json(value: object) -> str:
    """Return canonical JSON or reject non-JSON values (including NaN)."""

    try:
        rendered = json.dumps(
            value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False
        )
        parsed = json.loads(rendered)
    except (TypeError, ValueError, json.JSONDecodeError) as exc:
        raise SourceError("source values must be JSON") from exc
    if not isinstance(parsed, dict):
        raise SourceError("source data must be a JSON object")
    return rendered


def _json_object(value: object) -> JsonObject:
    return cast(JsonObject, json.loads(_canonical_json(value)))


@dataclass(frozen=True, slots=True)
class SourceContext:
    """Immutable, non-secret context passed to a registered source handler."""

    principal: Principal
    source_id: str
    app_id: str | None = None
    request_id: str | None = None

    def __post_init__(self) -> None:
        if not isinstance(self.principal, Principal):
            raise SourceError("source principal is invalid")
        _require_id(self.source_id, _SOURCE_ID, "source")
        for name in ("app_id", "request_id"):
            value = getattr(self, name)
            if value is not None and (not isinstance(value, str) or not value):
                raise SourceError(f"{name} is invalid")


@dataclass(frozen=True, slots=True, init=False)
class DataEnvelope:
    """A JSON-only immutable snapshot from a validated trusted source."""

    source_id: str
    contract_id: str
    fetched_at: datetime
    _data_json: str = field(repr=False)

    def __init__(
        self,
        *,
        source_id: str,
        contract_id: str,
        data: Mapping[str, JsonValue] | JsonObject,
        fetched_at: datetime | None = None,
    ) -> None:
        object.__setattr__(self, "source_id", _require_id(source_id, _SOURCE_ID, "source"))
        object.__setattr__(self, "contract_id", _require_id(contract_id, _CONTRACT_ID, "contract"))
        object.__setattr__(self, "_data_json", _canonical_json(data))
        timestamp = fetched_at or datetime.now(UTC)
        if not isinstance(timestamp, datetime) or timestamp.tzinfo is None:
            raise SourceError("fetched_at must be timezone-aware")
        object.__setattr__(self, "fetched_at", timestamp)

    @property
    def data(self) -> JsonObject:
        """Return a fresh JSON object so callers cannot mutate the stored snapshot."""

        return cast(JsonObject, json.loads(self._data_json))

    @property
    def canonical_json(self) -> str:
        return self._data_json

    @property
    def byte_size(self) -> int:
        return len(self._data_json.encode("utf-8"))


@dataclass(frozen=True, slots=True)
class DataContract:
    contract_id: str
    model: type[BaseModel]
    expression_paths: frozenset[str]
    example_json: str | None = field(default=None, repr=False)

    @property
    def example(self) -> JsonObject | None:
        return (
            None if self.example_json is None else cast(JsonObject, json.loads(self.example_json))
        )


class DataContractRegistry:
    """Maps versioned contract identifiers to strict Pydantic output models."""

    def __init__(self) -> None:
        self._contracts: dict[str, DataContract] = {}
        self._frozen = False

    @property
    def frozen(self) -> bool:
        return self._frozen

    @property
    def contract_ids(self) -> frozenset[str]:
        """Registered contract identifiers as an immutable snapshot."""

        return frozenset(self._contracts)

    @property
    def policy_paths(self) -> dict[str, frozenset[str]]:
        """Copy of model-visible expression paths keyed by contract identifier."""

        return {
            contract_id: frozenset(contract.expression_paths)
            for contract_id, contract in self._contracts.items()
        }

    def freeze(self) -> None:
        self._frozen = True

    def register(
        self,
        contract_id: str,
        model: type[BaseModel],
        *,
        expression_paths: Iterable[str],
        example: object | None = None,
    ) -> DataContract:
        if self._frozen:
            raise SourceFrozenError("data contract registry is frozen")
        _require_id(contract_id, _CONTRACT_ID, "contract")
        if contract_id in self._contracts:
            raise SourceError("data contract is already registered")
        if not isinstance(model, type) or not issubclass(model, BaseModel):
            raise SourceError("data contract model must be a Pydantic BaseModel type")
        paths = frozenset(expression_paths)
        if (
            not paths
            or len(paths) > 512
            or any(
                not isinstance(path, str) or len(path) > 160 or not _EXPRESSION_PATH.fullmatch(path)
                for path in paths
            )
        ):
            raise SourceError("contract expression paths are invalid")
        example_json: str | None = None
        if example is not None:
            try:
                parsed_example = model.model_validate(example, strict=True)
            except ValidationError as exc:
                raise SourceError("contract example does not satisfy its model") from exc
            example_json = _canonical_json(parsed_example.model_dump(mode="json"))
        contract = DataContract(contract_id, model, paths, example_json)
        self._contracts[contract_id] = contract
        return contract

    def get(self, contract_id: str) -> DataContract:
        _require_id(contract_id, _CONTRACT_ID, "contract")
        try:
            return self._contracts[contract_id]
        except KeyError as exc:
            raise SourceUnknownError("data contract is not registered") from exc

    def validate(self, contract_id: str, value: object) -> JsonObject:
        contract = self.get(contract_id)
        try:
            parsed = contract.model.model_validate(value, strict=True)
        except ValidationError as exc:
            raise SourceError("source output does not satisfy its contract") from exc
        return _json_object(parsed.model_dump(mode="json"))

    def schema(self, contract_id: str) -> JsonObject:
        return _json_object(self.get(contract_id).model.model_json_schema())

    def example(self, contract_id: str) -> JsonObject | None:
        """Return a detached, validated dry-render example when one was registered."""

        return self.get(contract_id).example

    def docs(self) -> list[JsonObject]:
        return [
            _json_object(
                {
                    "id": contract.contract_id,
                    "expression_paths": sorted(contract.expression_paths),
                    "schema": self.schema(contract.contract_id),
                }
            )
            for contract in sorted(self._contracts.values(), key=lambda item: item.contract_id)
        ]


class SourceHandler(Protocol):
    """Trusted synchronous host code; never supplied by a manifest."""

    def __call__(self, context: SourceContext, input_value: BaseModel | None) -> object: ...


class SourceAuthorizer(Protocol):
    def __call__(self, context: SourceContext, input_value: BaseModel | None) -> bool: ...


@dataclass(frozen=True, slots=True)
class DataSource:
    source_id: str
    contract_id: str
    handler: SourceHandler = field(repr=False)
    input_model: type[BaseModel] | None = field(default=None, repr=False)
    authorize: SourceAuthorizer | None = field(default=None, repr=False)


class DataSourceRegistry:
    """Runs only registered, authorized source handlers and validates every result."""

    def __init__(
        self, contracts: DataContractRegistry, *, max_response_bytes: int = 262_144
    ) -> None:
        if not isinstance(max_response_bytes, int) or max_response_bytes < 1:
            raise SourceError("max_response_bytes must be a positive integer")
        self._contracts = contracts
        self._sources: dict[str, DataSource] = {}
        self._max_response_bytes = max_response_bytes
        self._frozen = False

    @property
    def frozen(self) -> bool:
        return self._frozen

    @property
    def contracts(self) -> DataContractRegistry:
        return self._contracts

    @property
    def source_contracts(self) -> dict[str, str]:
        """Copy of source-to-contract bindings without handlers or secrets."""

        return {source_id: source.contract_id for source_id, source in self._sources.items()}

    def freeze(self) -> None:
        self._frozen = True
        self._contracts.freeze()

    def register(
        self,
        source_id: str,
        *,
        contract_id: str,
        handler: SourceHandler,
        input_model: type[BaseModel] | None = None,
        authorize: SourceAuthorizer | None = None,
    ) -> DataSource:
        if self._frozen:
            raise SourceFrozenError("data source registry is frozen")
        _require_id(source_id, _SOURCE_ID, "source")
        if source_id in self._sources:
            raise SourceError("data source is already registered")
        self._contracts.get(contract_id)
        if not callable(handler):
            raise SourceError("data source handler must be callable")
        if input_model is not None and (
            not isinstance(input_model, type) or not issubclass(input_model, BaseModel)
        ):
            raise SourceError("source input model must be a Pydantic BaseModel type")
        if authorize is not None and not callable(authorize):
            raise SourceError("source authorizer must be callable")
        source = DataSource(source_id, contract_id, handler, input_model, authorize)
        self._sources[source_id] = source
        return source

    def get(self, source_id: str) -> DataSource:
        _require_id(source_id, _SOURCE_ID, "source")
        try:
            return self._sources[source_id]
        except KeyError as exc:
            raise SourceUnknownError("data source is not registered") from exc

    @staticmethod
    def _input(source: DataSource, value: object | None) -> BaseModel | None:
        if source.input_model is None:
            if value is not None:
                raise SourceError("data source does not accept input")
            return None
        if value is None:
            value = {}
        try:
            return source.input_model.model_validate(value, strict=True)
        except ValidationError as exc:
            raise SourceError("source input does not satisfy its contract") from exc

    def fetch(
        self,
        source_id: str,
        *,
        principal: Principal,
        input_value: object | None = None,
        app_id: str | None = None,
        request_id: str | None = None,
    ) -> DataEnvelope:
        source = self.get(source_id)
        context = SourceContext(principal, source.source_id, app_id, request_id)
        parsed_input = self._input(source, input_value)
        if source.authorize is not None and not source.authorize(context, parsed_input):
            raise SourceUnauthorizedError("data source access is not authorized")
        output = source.handler(context, parsed_input)
        data = self._contracts.validate(source.contract_id, output)
        envelope = DataEnvelope(
            source_id=source.source_id, contract_id=source.contract_id, data=data
        )
        if envelope.byte_size > self._max_response_bytes:
            raise SourceError("source response exceeds maximum size")
        return envelope
