"""Small operational CLI for running the ForgeUI application."""

from __future__ import annotations

import argparse
from collections.abc import Sequence


def serve() -> None:
    """Start the configured FastAPI server."""

    try:
        import uvicorn

        from forgeui.app import create_app
        from forgeui.config import get_settings
        from forgeui.logging import configure_logging
    except ModuleNotFoundError as exc:
        raise SystemExit("forgeui serve requires the 'forgeui[app]' extra") from exc

    settings = get_settings()
    configure_logging(settings.log_level, json_logs=settings.json_logs)
    uvicorn.run(create_app(settings), host=settings.host, port=settings.port)


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="forgeui", description="Run ForgeUI.")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("serve", help="Start the configured FastAPI server.")
    return parser


def main(argv: Sequence[str] | None = None) -> None:
    """Run the small dependency-free command dispatcher."""

    arguments = _parser().parse_args(argv)
    if arguments.command == "serve":
        serve()
