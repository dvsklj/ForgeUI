# syntax=docker/dockerfile:1
# Build a small, reproducible runtime image from the committed uv lockfile.
FROM ghcr.io/astral-sh/uv:0.7.16 AS uv

FROM python:3.12-slim AS builder

COPY --from=uv /uv /uvx /bin/
WORKDIR /build
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1

COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev --extra app --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev --extra app

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/src \
    VIRTUAL_ENV=/opt/venv \
    PATH=/opt/venv/bin:$PATH \
    FORGEUI_DATA_DIR=/data \
    FORGEUI_DATABASE_URL=sqlite:////data/forgeui.db

RUN addgroup --system --gid 10001 forgeui \
    && adduser --system --uid 10001 --ingroup forgeui --home /nonexistent forgeui \
    && mkdir -p /app /data \
    && chown -R forgeui:forgeui /app /data

WORKDIR /app
COPY --from=builder --chown=forgeui:forgeui /build/.venv /opt/venv
COPY --from=builder --chown=forgeui:forgeui /build/src /app/src

USER forgeui
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health/ready', timeout=3)"

# The SQLite-backed in-process job worker requires one Uvicorn worker.
CMD ["uvicorn", "forgeui.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
