from __future__ import annotations

import tomllib
from pathlib import Path

ROOT = Path(__file__).parents[2]


def test_public_distribution_exposes_expected_install_layers() -> None:
    project = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]

    assert project["name"] == "forgeui"
    assert set(project["optional-dependencies"]) >= {"web", "http", "ollama", "serve", "app"}
    assert project["urls"]["Repository"] == "https://github.com/dvsklj/ForgeUI.git"


def test_release_workflow_uses_isolated_oidc_publishing() -> None:
    workflow = (ROOT / ".github" / "workflows" / "publish.yml").read_text()

    assert "release:" in workflow
    assert "types: [published]" in workflow
    assert "environment:\n      name: pypi" in workflow
    assert "id-token: write" in workflow
    assert "pypa/gh-action-pypi-publish@release/v1" in workflow
    assert "PYPI_TOKEN" not in workflow
    assert workflow.index("uv build") < workflow.index("pypa/gh-action-pypi-publish")


def test_runtime_source_package_is_not_hidden_by_ignore_rules() -> None:
    gitignore = (ROOT / ".gitignore").read_text().splitlines()
    dockerignore = (ROOT / ".dockerignore").read_text().splitlines()

    assert "/data/" in gitignore
    assert "data/" not in gitignore
    assert "/data" in dockerignore
    assert "data" not in dockerignore
    assert (ROOT / "src" / "forgeui" / "data" / "repositories.py").is_file()
