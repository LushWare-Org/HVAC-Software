"""
bandit_routes.py — HTTP API for the Bandit Observability Dashboard.

Exposes all six bandit analytics endpoints plus a summary route.
Designed as a read-only layer — no agent state is mutated here.

Endpoints (all GET):
  /bandit/summary               — KPI overview card data
  /bandit/reward-trend          — learning curve (avg reward by day)
  /bandit/actions               — action frequency distribution
  /bandit/exploration           — exploration vs exploitation ratio
  /bandit/revenue-impact        — actual_revenue − baseline_revenue uplift
  /bandit/context-performance   — per (state_key, action) avg reward table
  /bandit/regret                — empirical regret over time

All endpoints accept an optional `?agent=<name>` query param to filter
to a single agent (revenue | retention | upsell | followup).

Sample call:
  GET /bandit/summary
  →  {"avg_reward": 350, "exploration_rate": 0.18, "top_action": "discount_20", ...}

Sample response for GET /bandit/summary:
  {
    "avg_reward": 350.0,
    "exploration_rate": 0.18,
    "top_action": "discount_20",
    "revenue_uplift": 1200.0,
    "sample_size": 482
  }
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

from analytics.bandit_metrics import BanditMetricsService

_service = BanditMetricsService()


# ── Route handlers (framework-agnostic) ────────────────────────────────────────

def handle_summary(agent: str | None = None) -> dict[str, Any]:
    """GET /bandit/summary

    Single-call KPI card data for the dashboard header.
    Tells you at a glance: is the bandit learning, what's the top action,
    and how much incremental revenue has it generated?
    """
    return _service.get_summary(agent=agent)


def handle_reward_trend(agent: str | None = None, days: int = 30) -> list[dict[str, Any]]:
    """GET /bandit/reward-trend?agent=revenue&days=30

    Learning curve data for the line chart.  A rising avg_reward over time
    indicates the bandit is converging on better actions.
    """
    return _service.get_reward_trend(agent=agent, days=days)


def handle_actions(agent: str | None = None) -> list[dict[str, Any]]:
    """GET /bandit/actions?agent=retention

    Action frequency breakdown for the pie chart.  Uneven distribution
    shows the bandit has learned to prefer certain actions in this context.
    """
    return _service.get_action_distribution(agent=agent)


def handle_exploration(agent: str | None = None, days: int = 30) -> dict[str, Any]:
    """GET /bandit/exploration?agent=upsell

    Exploration vs exploitation ratio for the bar chart.
    A declining exploration rate over time shows the bandit maturing.
    """
    return _service.get_exploration_rate(agent=agent, days=days)


def handle_revenue_impact(agent: str | None = None, days: int = 30) -> dict[str, Any]:
    """GET /bandit/revenue-impact

    Revenue uplift KPI cards: avg and total (actual − baseline) revenue.
    Positive uplift validates that bandit decisions beat the do-nothing baseline.
    """
    return _service.get_revenue_uplift(agent=agent, days=days)


def handle_context_performance(agent: str | None = None) -> list[dict[str, Any]]:
    """GET /bandit/context-performance

    Context insights table: what the bandit has learned works best in each
    state bucket.  High avg_reward + high count = high-confidence learned policy.
    """
    return _service.get_context_performance(agent=agent)


def handle_regret(agent: str | None = None) -> dict[str, Any]:
    """GET /bandit/regret

    Regret analysis: how much reward was left on the table vs the empirical
    oracle.  Declining cumulative regret confirms the bandit is improving.
    """
    return _service.get_regret(agent=agent)


# ── Flask Blueprint ────────────────────────────────────────────────────────────

def create_flask_blueprint() -> Any:
    """Return a Flask Blueprint for mounting in an existing Flask app.

    Usage:
        from api.bandit_routes import create_flask_blueprint
        app.register_blueprint(create_flask_blueprint())
    """
    from flask import Blueprint, jsonify, request

    bp = Blueprint("bandit_observability", __name__, url_prefix="/bandit")

    @bp.get("/summary")
    def summary() -> Any:
        return jsonify(handle_summary(agent=_qp(request.args.get("agent"))))

    @bp.get("/reward-trend")
    def reward_trend() -> Any:
        return jsonify(handle_reward_trend(
            agent=_qp(request.args.get("agent")),
            days=_qi(request.args.get("days"), 30),
        ))

    @bp.get("/actions")
    def actions() -> Any:
        return jsonify(handle_actions(agent=_qp(request.args.get("agent"))))

    @bp.get("/exploration")
    def exploration() -> Any:
        return jsonify(handle_exploration(
            agent=_qp(request.args.get("agent")),
            days=_qi(request.args.get("days"), 30),
        ))

    @bp.get("/revenue-impact")
    def revenue_impact() -> Any:
        return jsonify(handle_revenue_impact(
            agent=_qp(request.args.get("agent")),
            days=_qi(request.args.get("days"), 30),
        ))

    @bp.get("/context-performance")
    def context_performance() -> Any:
        return jsonify(handle_context_performance(agent=_qp(request.args.get("agent"))))

    @bp.get("/regret")
    def regret() -> Any:
        return jsonify(handle_regret(agent=_qp(request.args.get("agent"))))

    return bp


# ── Standalone HTTP server (dev / smoke-test) ──────────────────────────────────

class BanditRequestHandler(BaseHTTPRequestHandler):
    """Minimal HTTP server for running the bandit API without Flask."""

    _ROUTES = {
        "/bandit/summary":             handle_summary,
        "/bandit/reward-trend":        handle_reward_trend,
        "/bandit/actions":             handle_actions,
        "/bandit/exploration":         handle_exploration,
        "/bandit/revenue-impact":      handle_revenue_impact,
        "/bandit/context-performance": handle_context_performance,
        "/bandit/regret":              handle_regret,
    }

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        qs     = parse_qs(parsed.query)
        agent  = _qp(qs.get("agent", [None])[0])
        days   = _qi(qs.get("days",  [None])[0], 30)

        handler = self._ROUTES.get(parsed.path)
        if handler is None:
            self._send_json(
                {
                    "endpoints": list(self._ROUTES.keys()),
                    "usage":     "GET /bandit/<endpoint>?agent=<revenue|retention|upsell|followup>&days=30",
                },
                status=404,
            )
            return

        import inspect
        sig = inspect.signature(handler)
        kwargs: dict[str, Any] = {}
        if "agent" in sig.parameters:
            kwargs["agent"] = agent
        if "days" in sig.parameters:
            kwargs["days"] = days

        self._send_json(handler(**kwargs))

    def log_message(self, format: str, *args: Any) -> None:
        return  # silence request logs in dev

    def _send_json(self, payload: Any, status: int = 200) -> None:
        body = json.dumps(payload, indent=2, sort_keys=True, default=str).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)


def run_server(host: str = "127.0.0.1", port: int = 8766) -> None:
    """Start the standalone bandit observability API server."""
    server = ThreadingHTTPServer((host, port), BanditRequestHandler)
    print(f"Bandit Observability API listening on http://{host}:{port}")
    print("Endpoints:")
    for path in BanditRequestHandler._ROUTES:
        print(f"  GET http://{host}:{port}{path}?agent=<revenue|retention|upsell|followup>")
    server.serve_forever()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _qp(value: Any) -> str | None:
    """Parse optional string query param; return None for empty/invalid values."""
    if value is None or value == "":
        return None
    s = str(value).lower().strip()
    return s if s in {"revenue", "retention", "upsell", "followup"} else None


def _qi(value: Any, default: int) -> int:
    """Parse optional int query param with a fallback default."""
    try:
        if value is None or value == "":
            return default
        return max(1, int(value))
    except (TypeError, ValueError):
        return default


if __name__ == "__main__":
    run_server()
