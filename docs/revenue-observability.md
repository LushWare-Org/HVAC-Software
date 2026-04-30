# Revenue Agent Observability

## MongoDB Schema

Collection: `revenue_logs`

Indexes recommended for dashboard reads:

```javascript
db.revenue_logs.createIndex({ timestamp: -1 })
db.revenue_logs.createIndex({ customer_id: 1, timestamp: -1 })
db.revenue_logs.createIndex({ job_id: 1 })
db.revenue_logs.createIndex({ action: 1, timestamp: -1 })
```

Document shape:

```json
{
  "timestamp": "2026-04-21T12:00:00+00:00",
  "expected_demand": 45,
  "actual_demand": 40,
  "utilization_predicted": 0.6,
  "utilization_actual": 0.55,
  "optimal_price": 200,
  "applied_price": 180,
  "action": "discount_10",
  "predicted_revenue": 4200,
  "actual_revenue": 3800,
  "baseline_revenue": 3000,
  "customer_id": "cus_123",
  "job_id": "job_456"
}
```

The logger also stores the full nested `state`, `decision`, and `execution` payloads for model debugging and future A/B testing or contextual bandit evaluation.

## API Responses

`GET /analytics/summary`

```json
{
  "revenue_accuracy": 0.87,
  "revenue_mean_error": 0.13,
  "demand_accuracy": 0.82,
  "utilization_accuracy": 0.85,
  "action_success_rate": 0.64,
  "pricing_impact": 1200,
  "sample_size": 250
}
```

`GET /analytics/trends`

```json
[
  {
    "date": "2026-04-21",
    "revenue_accuracy": 0.87,
    "demand_accuracy": 0.82,
    "utilization_accuracy": 0.85,
    "action_success_rate": 0.64,
    "pricing_impact": 1200,
    "sample_size": 25
  }
]
```

`GET /analytics/logs`

```json
[
  {
    "timestamp": "2026-04-21T12:00:00+00:00",
    "expected_demand": 45,
    "actual_demand": 40,
    "utilization_predicted": 0.6,
    "utilization_actual": 0.55,
    "optimal_price": 200,
    "applied_price": 180,
    "action": "discount_10",
    "predicted_revenue": 4200,
    "actual_revenue": 3800,
    "baseline_revenue": 3000
  }
]
```

## Local Usage

Run the agent:

```bash
python revenue_agent.py
```

Start the local analytics API:

```bash
python -m api.analytics_routes
```

Query:

```bash
curl http://127.0.0.1:8765/analytics/summary
curl http://127.0.0.1:8765/analytics/trends
curl http://127.0.0.1:8765/analytics/logs
```

MongoDB is enabled by setting `MONGO_URI` or `MONGODB_URI`. If no MongoDB URI is configured, metrics are computed from `agent/logs/revenue_agent_feedback.jsonl`.
