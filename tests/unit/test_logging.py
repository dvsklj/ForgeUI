from __future__ import annotations

import json
import logging

from forgeui.logging import JsonFormatter


def test_json_formatter_includes_safe_context_without_payloads() -> None:
    record = logging.LogRecord(
        name="forgeui.test",
        level=logging.INFO,
        pathname=__file__,
        lineno=10,
        msg="rendered app",
        args=(),
        exc_info=None,
    )
    record.app_id = "fleet-overview"
    record.request_id = "request-1"
    record.device_payload = {"secret": "must-not-log"}

    payload = json.loads(JsonFormatter().format(record))

    assert payload["app_id"] == "fleet-overview"
    assert payload["request_id"] == "request-1"
    assert "device_payload" not in payload
