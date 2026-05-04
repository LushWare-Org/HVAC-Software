FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (Docker layer caching — reinstall only when requirements change)
COPY apps/agent-service/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy Python agent code from the monorepo root
# These directories hold the bandit agents, API route blueprints, and metrics services
COPY agent/ ./agent/
COPY api/ ./api/
COPY analytics/ ./analytics/

# Copy the pre-trained model files used by the agents (bandit state, demand/pricing models)
COPY models/ ./models/

# Copy the Flask server entry point
COPY apps/agent-service/server.py ./server.py

ENV PORT=8080
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8080

# 2 workers: enough for a demo (each handles one request at a time; ML operations are fast)
# Increase to 4 if you see latency under concurrent load
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "--timeout", "60", "server:app"]
