from __future__ import annotations

from forgeui.domain.device_health import DEVICE_HEALTH_PATHS, DeviceHealthSnapshot


def test_device_health_snapshot_is_typed_and_bounded() -> None:
    snapshot = DeviceHealthSnapshot.model_validate(
        {
            "contract": "device-health/1",
            "generated_at": "2026-07-24T12:00:00+00:00",
            "stale": False,
            "summary": {
                "total": 2,
                "healthy": 1,
                "warning": 0,
                "critical": 1,
                "offline": 0,
                "fleet_cpu": 0.4,
                "fleet_memory": 0.5,
                "fleet_disk": 0.6,
            },
            "devices": [
                {
                    "id": "edge-1",
                    "name": "Edge 1",
                    "platform": "linux",
                    "status": "healthy",
                    "cpu": 0.2,
                    "memory": 0.3,
                    "disk": 0.4,
                    "temperature": 40.0,
                    "latency": 20.0,
                    "last_seen": "2026-07-24T12:00:00+00:00",
                    "active_alert_count": 0,
                }
            ],
            "series": [
                {
                    "timestamp": "2026-07-24T12:00:00+00:00",
                    "cpu": 0.2,
                    "memory": 0.3,
                    "online_count": 2,
                }
            ],
            "incidents": [
                {
                    "id": "incident-1",
                    "device_id": "edge-1",
                    "severity": "critical",
                    "message": "Temperature threshold exceeded",
                    "opened": "2026-07-24T11:00:00+00:00",
                    "status": "open",
                }
            ],
        },
        strict=True,
    )
    assert snapshot.summary.fleet_cpu == 0.4
    assert "data.series.online_count" in DEVICE_HEALTH_PATHS
    assert "item.active_alert_count" in DEVICE_HEALTH_PATHS
