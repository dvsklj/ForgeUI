"""Per-application Prometheus metrics without process-global collector state."""

from __future__ import annotations

from dataclasses import dataclass

from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry, Counter, Histogram
from prometheus_client.exposition import generate_latest


@dataclass(slots=True)
class Metrics:
    registry: CollectorRegistry
    http_requests: Counter
    http_duration: Histogram
    generations: Counter
    generation_attempts: Histogram

    @classmethod
    def create(cls) -> Metrics:
        registry = CollectorRegistry()
        return cls(
            registry=registry,
            http_requests=Counter(
                "forgeui_http_requests_total",
                "HTTP requests completed by ForgeUI.",
                ("method", "status"),
                registry=registry,
            ),
            http_duration=Histogram(
                "forgeui_http_request_duration_seconds",
                "ForgeUI HTTP request duration.",
                ("method",),
                registry=registry,
            ),
            generations=Counter(
                "forgeui_generations_total",
                "Completed ForgeUI generation jobs.",
                ("status", "error_code"),
                registry=registry,
            ),
            generation_attempts=Histogram(
                "forgeui_generation_attempts",
                "Model attempts consumed by a completed generation job.",
                buckets=(1, 2, 3),
                registry=registry,
            ),
        )

    def observe_http(self, method: str, status_code: int, elapsed_seconds: float) -> None:
        self.http_requests.labels(method=method, status=str(status_code)).inc()
        self.http_duration.labels(method=method).observe(elapsed_seconds)

    def observe_generation(
        self, status: str, *, error_code: str | None = None, attempts: int = 0
    ) -> None:
        self.generations.labels(status=status, error_code=error_code or "none").inc()
        if attempts:
            self.generation_attempts.observe(attempts)

    def render(self) -> tuple[bytes, str]:
        return generate_latest(self.registry), CONTENT_TYPE_LATEST
