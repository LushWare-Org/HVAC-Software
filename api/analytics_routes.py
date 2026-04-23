from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

from analytics.metrics_service import MetricsService


service = MetricsService()


def get_dashboard_summary() -> dict[str, float | int]:
    """GET /analytics/summary."""

    return service.dashboard_summary()


def get_trends(limit: int = 30) -> list[dict[str, Any]]:
    """GET /analytics/trends."""

    return service.trends(limit=limit)


def get_raw_logs(limit: int = 100) -> list[dict[str, Any]]:
    """GET /analytics/logs."""

    return service.get_logs(limit=limit)


def create_flask_blueprint() -> Any:
    """Return a Flask Blueprint when Flask is installed."""

    from flask import Blueprint, jsonify, request

    blueprint = Blueprint("revenue_analytics", __name__, url_prefix="/analytics")

    @blueprint.get("/summary")
    def summary() -> Any:
        return jsonify(get_dashboard_summary())

    @blueprint.get("/trends")
    def trends() -> Any:
        return jsonify(get_trends(limit=_query_int(request.args.get("limit"), 30)))

    @blueprint.get("/logs")
    def logs() -> Any:
        return jsonify(get_raw_logs(limit=_query_int(request.args.get("limit"), 100)))

    return blueprint


class AnalyticsRequestHandler(BaseHTTPRequestHandler):
    """Small local HTTP adapter for dashboard development and smoke testing."""

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        limit = _query_int(query.get("limit", [None])[0], 100)

        if parsed.path == "/analytics/summary":
            self._send_json(get_dashboard_summary())
            return

        if parsed.path == "/analytics/trends":
            self._send_json(get_trends(limit=limit or 30))
            return

        if parsed.path == "/analytics/logs":
            self._send_json(get_raw_logs(limit=limit or 100))
            return

        self._send_json({"error": "not_found"}, status=404)

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _send_json(self, payload: Any, status: int = 200) -> None:
        body = json.dumps(payload, indent=2, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run_server(host: str = "127.0.0.1", port: int = 8765) -> None:
    server = ThreadingHTTPServer((host, port), AnalyticsRequestHandler)
    print(f"Analytics API listening on http://{host}:{port}")
    server.serve_forever()


def _query_int(value: Any, default: int) -> int:
    try:
        if value is None or value == "":
            return default
        return max(0, int(value))
    except (TypeError, ValueError):
        return default


if __name__ == "__main__":
    run_server()
