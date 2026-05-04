"""
agent-service/server.py — Combined Flask server for AI agent APIs.

Serves two route groups on a single port (8080 in Cloud Run):
  /analytics/*  — Revenue agent metrics (accuracy, trends, logs)
  /bandit/*     — Bandit observability (reward trends, action stats, regret)
  /health       — Health check

In local development these ran as separate standalone HTTP servers
(analytics_routes.py on :8765, bandit_routes.py on :8766).
In Cloud Run both are merged here on port 8080.

The frontend accesses them via the gateway:
  GET /api/analytics/revenue-agent-api/analytics/summary → /analytics/summary here
  GET /api/analytics/bandit-api/bandit/summary           → /bandit/summary here
"""
from __future__ import annotations

import os
import sys

# Add the project root to sys.path so that the agent/, api/, analytics/ packages
# are importable. The Dockerfile copies these to /app/, so ROOT = /app.
ROOT = os.path.abspath(os.path.dirname(__file__))
# When running locally from apps/agent-service/, ROOT is the monorepo root (2 levels up)
if not os.path.isdir(os.path.join(ROOT, "agent")):
    ROOT = os.path.abspath(os.path.join(ROOT, "../../"))
sys.path.insert(0, ROOT)

from flask import Flask, jsonify
from flask_cors import CORS

try:
    from api.analytics_routes import create_flask_blueprint as analytics_bp
    from api.bandit_routes import create_flask_blueprint as bandit_bp
except ImportError as exc:
    raise RuntimeError(
        f"Could not import agent API modules from {ROOT}. "
        f"Ensure agent/, api/, analytics/ directories are present. Error: {exc}"
    ) from exc

app = Flask(__name__)
CORS(app, origins="*")

# Register both route namespaces
app.register_blueprint(analytics_bp())   # mounts at /analytics/*
app.register_blueprint(bandit_bp())      # mounts at /bandit/*


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "agent-service"})


@app.get("/")
def root():
    return jsonify({
        "service": "T&S CRM Agent Service",
        "endpoints": [
            "/health",
            "/analytics/summary",
            "/analytics/trends",
            "/analytics/logs",
            "/bandit/summary",
            "/bandit/reward-trend",
            "/bandit/actions",
            "/bandit/exploration",
            "/bandit/revenue-impact",
            "/bandit/context-performance",
            "/bandit/regret",
        ],
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
