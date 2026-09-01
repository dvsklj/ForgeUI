from __future__ import annotations

import gzip
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATIC = ROOT / "src" / "forgeui" / "web" / "static"


def test_browser_assets_stay_within_explicit_raw_size_budgets() -> None:
    assert (STATIC / "forgeui.css").stat().st_size <= 32 * 1024
    assert (STATIC / "forgeui.js").stat().st_size <= 16 * 1024
    assert (STATIC / "forgeui-embed.js").stat().st_size <= 4 * 1024


def test_browser_assets_stay_within_compressed_transfer_budgets() -> None:
    budgets = {
        "forgeui.css": 6 * 1024,
        "forgeui.js": 4 * 1024,
        "forgeui-embed.js": 1024,
    }
    for name, budget in budgets.items():
        assert len(gzip.compress((STATIC / name).read_bytes(), compresslevel=9)) <= budget


def test_runtime_dependency_set_avoids_cli_and_uvicorn_extra_bloat() -> None:
    project = tomllib.loads((ROOT / "pyproject.toml").read_text(encoding="utf-8"))["project"]
    dependencies = project["dependencies"]
    extras = project["optional-dependencies"]

    assert dependencies == ["jinja2>=3.1,<4", "pydantic>=2.10,<3"]
    assert not any(
        dependency.startswith("typer") for group in extras.values() for dependency in group
    )
    assert not any(
        dependency.startswith("uvicorn[") for group in extras.values() for dependency in group
    )
    assert {name for name in extras if name != "dev"} == {
        "app",
        "http",
        "ollama",
        "serve",
        "web",
    }


def test_shipped_source_tree_stays_below_one_megabyte() -> None:
    package = ROOT / "src" / "forgeui"
    shipped_suffixes = {".py", ".html", ".css", ".js"}
    total = sum(
        path.stat().st_size
        for path in package.rglob("*")
        if path.is_file() and path.suffix in shipped_suffixes
    )

    assert total <= 1024 * 1024
