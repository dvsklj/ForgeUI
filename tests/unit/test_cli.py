from __future__ import annotations

import pytest

from forgeui import cli


def test_cli_dispatches_serve_without_a_framework_dependency(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    called: list[bool] = []
    monkeypatch.setattr(cli, "serve", lambda: called.append(True))

    cli.main(["serve"])

    assert called == [True]
