"""The first trusted data contract available to generated dashboards."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DeviceHealthDevice(BaseModel):
    """Flat device record supplied by the trusted device-health source."""

    model_config = ConfigDict(extra="forbid", strict=True)

    id: str = Field(min_length=1, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    name: str = Field(min_length=1, max_length=120)
    platform: str = Field(min_length=1, max_length=48)
    status: Literal["healthy", "warning", "critical", "offline", "unknown"]
    cpu: float = Field(ge=0, le=1)
    memory: float = Field(ge=0, le=1)
    disk: float = Field(ge=0, le=1)
    temperature: float = Field(ge=-100, le=250)
    latency: float = Field(ge=0, le=300_000)
    last_seen: str = Field(min_length=20, max_length=40)
    active_alert_count: int = Field(ge=0, le=10_000)


class DeviceHealthSummary(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    total: int = Field(ge=0, le=100_000)
    healthy: int = Field(ge=0, le=100_000)
    warning: int = Field(ge=0, le=100_000)
    critical: int = Field(ge=0, le=100_000)
    offline: int = Field(ge=0, le=100_000)
    fleet_cpu: float = Field(ge=0, le=1)
    fleet_memory: float = Field(ge=0, le=1)
    fleet_disk: float = Field(ge=0, le=1)


class DeviceHealthSeriesPoint(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    timestamp: str = Field(min_length=20, max_length=40)
    cpu: float = Field(ge=0, le=1)
    memory: float = Field(ge=0, le=1)
    online_count: int = Field(ge=0, le=100_000)


class DeviceHealthIncident(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    id: str = Field(min_length=1, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    device_id: str = Field(min_length=1, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    severity: Literal["warning", "critical"]
    message: str = Field(min_length=1, max_length=240)
    opened: str = Field(min_length=20, max_length=40)
    status: Literal["open", "acknowledged", "resolved"]


class DeviceHealthSnapshot(BaseModel):
    """Bounded shape used by render dry-runs and a later data-source adapter."""

    model_config = ConfigDict(extra="forbid", strict=True)

    contract: Literal["device-health/1"] = "device-health/1"
    generated_at: str = Field(min_length=20, max_length=40)
    stale: bool = False
    summary: DeviceHealthSummary
    devices: list[DeviceHealthDevice] = Field(default_factory=list, max_length=100)
    series: list[DeviceHealthSeriesPoint] = Field(default_factory=list, max_length=120)
    incidents: list[DeviceHealthIncident] = Field(default_factory=list, max_length=100)


DEVICE_HEALTH_PATHS = frozenset(
    {
        "data.summary",
        "data.summary.total",
        "data.summary.healthy",
        "data.summary.warning",
        "data.summary.critical",
        "data.summary.offline",
        "data.summary.fleet_cpu",
        "data.summary.fleet_memory",
        "data.summary.fleet_disk",
        "data.generated_at",
        "data.stale",
        "data.devices",
        "data.devices.id",
        "data.devices.name",
        "data.devices.platform",
        "data.devices.status",
        "data.devices.cpu",
        "data.devices.memory",
        "data.devices.disk",
        "data.devices.temperature",
        "data.devices.latency",
        "data.devices.last_seen",
        "data.devices.active_alert_count",
        "data.series",
        "data.series.timestamp",
        "data.series.cpu",
        "data.series.memory",
        "data.series.online_count",
        "data.incidents",
        "data.incidents.id",
        "data.incidents.device_id",
        "data.incidents.severity",
        "data.incidents.message",
        "data.incidents.opened",
        "data.incidents.status",
        "item.id",
        "item.device_id",
        "item.name",
        "item.platform",
        "item.status",
        "item.severity",
        "item.message",
        "item.cpu",
        "item.memory",
        "item.disk",
        "item.temperature",
        "item.latency",
        "item.online_count",
        "item.timestamp",
        "item.opened",
        "item.last_seen",
        "item.active_alert_count",
    }
)


def empty_device_health_data() -> dict[str, object]:
    """Return a truthful, contract-valid snapshot for a source with no observations yet."""

    return DeviceHealthSnapshot.model_validate(
        {
            "contract": "device-health/1",
            "generated_at": "1970-01-01T00:00:00+00:00",
            "stale": True,
            "summary": {
                "total": 0,
                "healthy": 0,
                "warning": 0,
                "critical": 0,
                "offline": 0,
                "fleet_cpu": 0.0,
                "fleet_memory": 0.0,
                "fleet_disk": 0.0,
            },
            "devices": [],
            "series": [],
            "incidents": [],
        },
        strict=True,
    ).model_dump(mode="json")


def representative_device_health_data() -> dict[str, object]:
    """Return bounded typed data used only for deterministic manifest dry-renders."""

    snapshot = DeviceHealthSnapshot.model_validate(
        {
            "contract": "device-health/1",
            "generated_at": "2026-01-01T00:00:00+00:00",
            "stale": False,
            "summary": {
                "total": 1,
                "healthy": 1,
                "warning": 0,
                "critical": 0,
                "offline": 0,
                "fleet_cpu": 0.25,
                "fleet_memory": 0.5,
                "fleet_disk": 0.75,
            },
            "devices": [
                {
                    "id": "dry-run-device",
                    "name": "Dry run device",
                    "platform": "linux",
                    "status": "healthy",
                    "cpu": 0.25,
                    "memory": 0.5,
                    "disk": 0.75,
                    "temperature": 42.0,
                    "latency": 10.0,
                    "last_seen": "2026-01-01T00:00:00+00:00",
                    "active_alert_count": 0,
                }
            ],
            "series": [
                {
                    "timestamp": "2026-01-01T00:00:00+00:00",
                    "cpu": 0.25,
                    "memory": 0.5,
                    "online_count": 1,
                }
            ],
            "incidents": [
                {
                    "id": "dry-run-incident",
                    "device_id": "dry-run-device",
                    "severity": "warning",
                    "message": "Representative incident",
                    "opened": "2026-01-01T00:00:00+00:00",
                    "status": "acknowledged",
                }
            ],
        },
        strict=True,
    )
    return snapshot.model_dump(mode="json")
