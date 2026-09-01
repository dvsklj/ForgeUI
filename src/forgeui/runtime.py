"""Host-owned runtime bindings for data and side-effect capabilities."""

from __future__ import annotations

import re
from dataclasses import dataclass

from pydantic import BaseModel

from forgeui.domain.device_health import (
    DEVICE_HEALTH_PATHS,
    DeviceHealthSnapshot,
    empty_device_health_data,
    representative_device_health_data,
)
from forgeui.security import Principal
from forgeui.services.capabilities import CapabilityRegistry, declared_capabilities
from forgeui.services.devices import DeviceHealthService
from forgeui.sources import DataContractRegistry, DataSourceRegistry, SourceContext
from forgeui.sources.registry import JsonObject
from forgeui.validation import ManifestPolicy

_DESTINATION_ID = re.compile(r"^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$")


@dataclass(frozen=True, slots=True)
class RuntimeRegistries:
    """The explicit authority supplied to one ForgeUI instance.

    Registration is host code. A manifest receives only the derived identifiers and
    expression paths, never the registered callables or their configuration.
    """

    contracts: DataContractRegistry
    sources: DataSourceRegistry
    capabilities: CapabilityRegistry
    destinations: frozenset[str] = frozenset({"overview", "devices"})

    def __post_init__(self) -> None:
        if self.sources.contracts is not self.contracts:
            raise ValueError("data sources and contracts must use the same registry")
        if len(self.destinations) > 256 or any(
            len(destination) > 120 or not _DESTINATION_ID.fullmatch(destination)
            for destination in self.destinations
        ):
            raise ValueError("navigation destinations must be bounded runtime identifiers")
        object.__setattr__(self, "destinations", frozenset(self.destinations))

    @property
    def policy(self) -> ManifestPolicy:
        return ManifestPolicy(
            contracts=self.contracts.policy_paths,
            sources=self.sources.source_contracts,
            capabilities=self.capabilities.names,
            destinations=self.destinations,
        )

    def freeze(self) -> RuntimeRegistries:
        """Prevent authority from changing after app startup."""

        self.sources.freeze()
        self.capabilities.freeze()
        return self

    def fetch(
        self,
        source_id: str,
        *,
        principal: Principal,
        app_id: str,
        request_id: str,
        input_value: object | None = None,
    ) -> JsonObject:
        return self.sources.fetch(
            source_id,
            principal=principal,
            input_value=input_value,
            app_id=app_id,
            request_id=request_id,
        ).data

    def dry_run_data(self, contract_id: str) -> JsonObject:
        return self.contracts.example(contract_id) or {}


def device_health_runtime(devices: DeviceHealthService) -> RuntimeRegistries:
    """Build the backwards-compatible device-health runtime shipped with ForgeUI."""

    contracts = DataContractRegistry()
    contracts.register(
        "device-health/1",
        DeviceHealthSnapshot,
        expression_paths=DEVICE_HEALTH_PATHS,
        example=representative_device_health_data(),
    )
    sources = DataSourceRegistry(contracts)

    def latest_device_health(context: SourceContext, input_value: BaseModel | None) -> object:
        del input_value
        app_id = context.app_id
        snapshot = devices.latest(app_id=app_id) if app_id is not None else None
        snapshot = snapshot or devices.latest(app_id=None)
        return empty_device_health_data() if snapshot is None else snapshot.snapshot

    sources.register(
        "device-health",
        contract_id="device-health/1",
        handler=latest_device_health,
    )
    capabilities = declared_capabilities(("device-note.create", "incident.acknowledge"))
    return RuntimeRegistries(contracts, sources, capabilities).freeze()


__all__ = ["RuntimeRegistries", "device_health_runtime"]
