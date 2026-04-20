# Upsell Recommendation Agent Implementation

This document records how the Upsell Recommendation Agent is implemented in this system, from ML model artifacts through CRM orchestration, recommendation persistence, follow-up handoff, and admin UI display.

## Purpose

The Upsell Recommendation Agent identifies the best next commercial offer for an HVAC customer based on equipment age, service history, spend, failure signals, and churn/failure risk.

Current offer labels are:

- `maintenance_plan`
- `replacement`
- `service`

The agent can run as a daily batch, be triggered manually from the API, or run after customer/equipment profile changes.

## Production Flow

1. Upsell model artifacts are loaded by the Python inference service.
2. `crm-service` starts `UpsellCron`.
3. `UpsellCron` runs immediately on boot and then once per day.
4. `UpsellAgentService` loads active customer candidates.
5. The agent builds an upsell feature payload from CRM data.
6. The agent enriches the payload with churn/failure risk from `ChurnClient.predictRevenue()`.
7. The agent calls `UpsellClient.recommendOffer()`.
8. If the model service is unavailable, the agent falls back to local rules.
9. The recommendation is saved to `upsell_recommendations`.
10. If confidence is above `0.75`, the agent queues a follow-up job with action `UPSELL`.
11. Customer status UI reads the latest stored recommendation and falls back to inline rules when none exists.

## Step 1: ML Model Implementation

The current integrated upsell inference path lives in:

- `apps/churn-service/src/main.py`
- `apps/churn-service/src/services/upsell.service.py`
- `apps/churn-service/src/schemas/upsell.schema.py`
- `apps/churn-service/src/models/upsell_recommendation_model.pkl`

Optional artifacts supported by the service:

- `upsell_features.pkl`
- `upsell_label_encoder.pkl`

Default feature order:

```txt
equipment_age
failure_count
last_service_days
avg_spend
usage_hours_per_week
```

Default labels:

```txt
maintenance_plan
replacement
service
```

The service exposes the upsell endpoint through:

```txt
POST /recommend-offer
```

Example request:

```json
{
  "equipment_age": 9.4,
  "failure_count": 3,
  "last_service_days": 220,
  "avg_spend": 310,
  "usage_hours_per_week": 20,
  "churn_probability": 0.62,
  "failure_risk": 0.71
}
```

Example response:

```json
{
  "recommended_offer": "maintenance_plan",
  "confidence": 0.6812,
  "all_scores": {
    "maintenance_plan": 0.6812,
    "replacement": 0.1888,
    "service": 0.13
  },
  "rule_offer": "maintenance_plan",
  "model_offer": "replacement",
  "priority_score": 0.6945
}
```

## Step 2: Upsell Model Service Logic

The model service uses:

- `UpsellModelRegistry.load()` to load model artifacts.
- `extract_features()` to build a Pandas `DataFrame`.
- `model.predict_proba()` to score each offer class.
- `rule_engine()` to boost obvious rule matches.
- `priority_score` to combine recommendation confidence, churn probability, and failure risk.

Rule engine behavior:

- If `equipment_age > 8`, prefer `replacement`.
- If `failure_count > 2`, prefer `maintenance_plan`.
- If `last_service_days > 180`, prefer `service`.

Priority score calculation:

```txt
(confidence * 0.7) + (churn_probability * 0.15) + (failure_risk * 0.15)
```

The result is capped at `1.0`.

## Step 3: Standalone Legacy Upsell Agent

There is also a standalone FastAPI upsell service at:

- `Server/src/services/ai/upsell_agent.py`

It implements the same general behavior:

- loads `upsell_recommendation_model.pkl`
- optionally loads `upsell_features.pkl`
- optionally loads `upsell_label_encoder.pkl`
- exposes `GET /health`
- exposes `POST /recommend-offer`

Important distinction: the CRM client can call any compatible `/recommend-offer` endpoint, but the integrated runtime path is normally `apps/churn-service`, because `UpsellClient` falls back to `CHURN_SERVICE_URL` and `http://churn-service:8000`.

## Step 4: CRM Upsell Client

The CRM HTTP client lives in:

- `apps/crm-service/src/ai/upsell.client.ts`

Request type:

```ts
export interface UpsellRecommendationInput {
  equipment_age: number;
  failure_count: number;
  last_service_days: number;
  avg_spend: number;
  usage_hours_per_week: number;
  churn_probability?: number;
  failure_risk?: number;
}
```

Response type:

```ts
export interface UpsellRecommendationResult {
  recommended_offer: string;
  confidence: number;
  all_scores: Record<string, number>;
  rule_offer?: string | null;
  model_offer?: string | null;
  priority_score: number;
}
```

`UpsellClient` resolves candidate base URLs from:

1. `UPSELL_SERVICE_URL`
2. `CHURN_SERVICE_URL`
3. `http://localhost:8000`
4. `http://churn-service:8000`

It posts to:

```txt
${baseUrl}/recommend-offer
```

It validates:

- `recommended_offer` is present
- `confidence` is numeric
- `priority_score` is numeric

It also normalizes `all_scores` into a numeric record.

## Step 5: Database Schema

The recommendation table is created by:

- `apps/crm-service/prisma/migrations/20260414120000_add_upsell_recommendations/migration.sql`

Table:

```txt
upsell_recommendations
```

Important columns:

- `id`
- `company_id`
- `customer_id`
- `recommended_offer`
- `confidence`
- `status`
- `all_scores`
- `rule_offer`
- `model_offer`
- `trigger_source`
- `priority_score`
- `input_payload`
- `created_at`
- `updated_at`

Indexes:

- `upsell_recommendations_company_id_customer_id_created_at_idx`
- `upsell_recommendations_company_id_status_priority_score_idx`

The table uses a foreign key to `customers(id)` with cascade delete.

## Step 6: NestJS Module Wiring

The module is:

- `apps/crm-service/src/upsell/upsell.module.ts`

It registers:

- `ChurnClient`
- `UpsellClient`
- `FollowupProducer`
- `UpsellAgentService`
- `UpsellCron`
- `UpsellController`

It exports:

- `UpsellAgentService`

`CustomersModule` imports `UpsellModule`, which lets customer updates and equipment changes trigger recommendation refreshes.

## Step 7: Scheduled Agent Execution

The scheduler is:

- `apps/crm-service/src/upsell/upsell.cron.ts`

Behavior:

- Starts on module initialization.
- Skips startup when `UPSELL_AGENT_ENABLED=false`.
- Runs immediately once.
- Runs again every 24 hours.
- Uses an `isRunning` guard to prevent overlapping cycles.
- Checks `prisma.ensureRequiredSchemaReady()` before running.
- Logs a summary after completion.

Current interval:

```ts
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
```

## Step 8: Agent Entry Points

The core service is:

- `apps/crm-service/src/upsell/upsell-agent.service.ts`

Public methods:

```ts
runDailyBatch(): Promise<UpsellRunSummary>
recommendForCustomer(companyId, customerId, triggerSource = 'manual')
processCustomerProfileUpdate(companyId, customerId): Promise<void>
processServiceCompletion(companyId, customerId): Promise<void>
listRecommendations(companyId, limit = 50)
```

Run summary shape:

```ts
{
  processed: number;
  recommended: number;
  skipped: number;
  failures: number;
}
```

Trigger sources:

- `daily_batch`
- `manual`
- `profile_update`
- `service_completion`

## Step 9: Batch Candidate Selection

`loadBatchCandidates()` selects active customers:

- `isActive: true`
- excludes portal-signup inactive customers
- ordered by `updatedAt DESC`
- limited by `UPSELL_BATCH_LIMIT`, default `250`

For each candidate, it includes:

- equipment ordered oldest first
- recent confirmed/converted bookings
- active agreements
- recent reviews
- equipment count

`loadCustomer()` is used for manual/profile/service triggers and scopes by:

- `companyId`
- `customerId`
- `isActive: true`

## Step 10: Duplicate Suppression

Before non-forced batch processing, the agent calls:

```ts
hasRecentRecommendation(companyId, customerId)
```

It checks `upsell_recommendations` for:

- same company
- same customer
- `status = 'pending'`
- `created_at >= NOW() - INTERVAL '7 days'`

If a pending recommendation already exists from the last 7 days, the batch skips that customer.

Manual/profile/service triggers pass `force = true`, so they can create a fresh recommendation even when a recent pending recommendation exists.

## Step 11: Feature Payload Construction

The agent builds payloads in:

```ts
buildPayload(customer)
```

Base features:

- `equipment_age`: oldest known equipment age in years.
- `failure_count`: number of recent reviews with rating `<= 2`.
- `last_service_days`: days since most recent confirmed/converted booking, falling back to customer creation date.
- `avg_spend`: active agreement value divided by 12.
- `usage_hours_per_week`: `60` for commercial customers, `20` for residential/non-commercial customers.

Derived helper methods:

- `computeDaysSinceLastService()`
- `computeServiceCountLastYear()`
- `computeAverageMonthlySpend()`
- `computeEquipmentAgeDays()`
- `computeDaysBetween()`

## Step 12: Risk Enrichment

After base feature construction, the agent tries to enrich the payload through:

```ts
this.churnClient.predictRevenue({
  churn: { ... },
  failure: { ... },
})
```

The revenue prediction returns:

- `churn_probability`
- `failure_probability`
- `revenue_risk`
- `recommended_action`

The upsell payload stores:

```ts
payload.churn_probability = risk.churn_probability;
payload.failure_risk = risk.failure_probability;
```

If risk enrichment fails, the agent logs a warning and continues with the base upsell payload.

## Step 13: Recommendation Generation

The agent calls:

```ts
this.upsellClient.recommendOffer(payload)
```

If the model service succeeds, that result is used.

If the model service fails, the agent falls back to:

```ts
recommendWithLocalRules(payload)
```

Local rule scores start as:

```ts
maintenance_plan: 0.25
replacement: 0.2
service: 0.2
```

Local rule boosts:

- `equipment_age > 8`: replacement `+0.45`
- `failure_count > 2`: maintenance plan `+0.45`
- `last_service_days > 180`: service `+0.4`
- `failure_risk >= 0.5`: maintenance plan `+0.15`, replacement may also get `+0.1`
- `churn_probability >= 0.5`: maintenance plan `+0.1`, service `+0.1`
- `avg_spend >= 250`: maintenance plan `+0.08`

Scores are normalized and the highest score becomes `recommended_offer`.

## Step 14: Persistence

Recommendations are persisted by:

```ts
saveRecommendation(customer, recommendation, triggerSource, payload)
```

Inserted fields:

- generated UUID
- company ID
- customer ID
- recommended offer
- confidence
- `status = 'pending'`
- all scores JSON
- rule offer
- model offer
- trigger source
- priority score
- input payload JSON
- timestamps

If `upsell_recommendations` does not exist, the agent logs a warning and returns without persistence.

## Step 15: Automatic Follow-up Handoff

After persistence, the agent checks:

```ts
if (recommendation.confidence > 0.75)
```

When true, it calls:

```ts
triggerFollowUp(customer, recommendation)
```

That method queues a shared follow-up payload through:

- `apps/crm-service/src/queues/followup.producer.ts`

Payload action:

```txt
UPSELL
```

Reason format:

```txt
Recommended ${recommended_offer} with confidence ${confidence}
```

The communication is later consumed by:

- `apps/comms-service/src/workers/followup.worker.ts`

For `UPSELL`, the worker uses:

- subject: `A service recommendation is ready for your HVAC system`
- message: `Based on your service history, we have a recommendation to help keep your HVAC system reliable. Reply to schedule a quick review.`

If the customer has no phone or email, the upsell follow-up is skipped and a warning is logged.

## Step 16: API Endpoints

The controller is:

- `apps/crm-service/src/upsell/upsell.controller.ts`

Routes:

```txt
GET /crm/upsell/recommendations
POST /crm/upsell/customers/:customerId/recommendations
POST /crm/upsell/run
```

`GET /recommendations`:

- lists recommendations for the authenticated company
- default limit is `50`
- sorted by `priority_score DESC`, then `created_at DESC`

`POST /customers/:customerId/recommendations`:

- requires `COMPANY_ADMIN`, `OFFICE_MANAGER`, or `DISPATCHER`
- creates a manual recommendation for one customer

`POST /run`:

- requires `COMPANY_ADMIN` or `OFFICE_MANAGER`
- runs the batch immediately

## Step 17: Customer Profile Triggers

The customer service injects `UpsellAgentService` and triggers profile-update recommendations asynchronously.

Important paths:

- `apps/crm-service/src/customers/customers.service.ts`

Triggers currently happen after:

- customer update
- equipment create
- equipment update
- equipment delete

The code uses:

```ts
void this.upsellAgent.processCustomerProfileUpdate(companyId, customerId);
```

This avoids blocking the main customer/equipment API response while still refreshing recommendations in the background.

## Step 18: Customer Status Summary Integration

Customer status summary reads the latest stored recommendation from:

```ts
getLatestUpsellRecommendation(companyId, customerId)
```

If no stored recommendation exists, CRM computes an inline fallback using:

```ts
computeInlineUpsellRecommendation(signals)
```

The inline fallback mirrors the local rule engine:

- maintenance plan
- replacement
- service
- confidence
- priority score
- status `generated`
- trigger source `status_summary`

This means the UI can still display an upsell recommendation even before the batch has persisted one.

## Step 19: Admin Dashboard UI

Upsell recommendation display is currently part of the customer status and details UI.

Important files:

- `apps/admin-dashboard/src/pages/customers/Customers.tsx`
- `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx`
- `apps/admin-dashboard/src/types/api.ts`

The customer row/status preview displays:

- offer label
- confidence
- priority
- stored status or `live estimate`

The customer details sidebar displays an `Upsell Recommendation` reasoning card with:

- recommendation result
- confidence percentage
- reasoning text from the status summary, or fallback reasoning when missing

The dashboard also contains an inline fallback implementation for display resilience when the API does not return a stored recommendation.

## Operational Configuration

Important environment variables:

- `UPSELL_AGENT_ENABLED`: set to `false` to disable the daily cron.
- `UPSELL_BATCH_LIMIT`: max daily batch customer count, default `250`.
- `UPSELL_SERVICE_URL`: preferred upsell inference service URL.
- `CHURN_SERVICE_URL`: fallback service URL and risk enrichment service URL.
- `REDIS_HOST`: Redis host for follow-up queue handoff.
- `REDIS_PORT`: Redis port for follow-up queue handoff.

## Failure Modes and Fallbacks

- Missing `upsell_recommendations` table: recommendations can be generated but are not persisted.
- Recent pending recommendation exists: daily batch skips the customer.
- Manual/profile/service trigger: bypasses recent-recommendation suppression.
- Risk enrichment unavailable: agent logs a warning and continues without churn/failure risk.
- Upsell model unavailable: agent uses local rules.
- No customer contact channel: high-confidence follow-up is skipped.
- Queue failure during follow-up handoff: error propagates from `FollowupProducer` because `triggerFollowUp()` does not catch queue failures.
- Cron overlap: `UpsellCron` skips a cycle when the previous one is still running.
- CRM schema not ready: `UpsellCron` skips the cycle.

## Verification Checklist

Use this checklist after changing the Upsell Recommendation Agent.

1. Run CRM migrations and confirm `upsell_recommendations` exists.
2. Confirm `apps/churn-service` starts successfully.
3. Confirm `POST /recommend-offer` returns a valid recommendation.
4. Confirm `UPSELL_SERVICE_URL` or `CHURN_SERVICE_URL` points CRM at the inference service.
5. Start `crm-service` and check logs for `Starting upsell recommendation cycle`.
6. Confirm `upsell_recommendations` receives rows with `status = pending`.
7. Confirm `all_scores`, `input_payload`, `trigger_source`, and `priority_score` are populated.
8. Run `POST /crm/upsell/customers/:customerId/recommendations` and verify a manual row is inserted.
9. Update a customer or equipment item and verify a `profile_update` recommendation is generated.
10. For a confidence above `0.75`, verify an `UPSELL` job appears in `followup-queue`.
11. Confirm `comms-service` consumes the follow-up job and sends SMS or email.
12. Open a customer in the admin dashboard and verify the upsell recommendation card displays the stored recommendation.

## Main Files

- `apps/churn-service/src/main.py`
- `apps/churn-service/src/services/upsell.service.py`
- `apps/churn-service/src/schemas/upsell.schema.py`
- `Server/src/services/ai/upsell_agent.py`
- `apps/crm-service/src/ai/upsell.client.ts`
- `apps/crm-service/src/ai/churn.client.ts`
- `apps/crm-service/src/upsell/upsell-agent.service.ts`
- `apps/crm-service/src/upsell/upsell.controller.ts`
- `apps/crm-service/src/upsell/upsell.cron.ts`
- `apps/crm-service/src/upsell/upsell.module.ts`
- `apps/crm-service/src/customers/customers.service.ts`
- `apps/crm-service/src/queues/followup.producer.ts`
- `apps/comms-service/src/workers/followup.worker.ts`
- `apps/crm-service/prisma/migrations/20260414120000_add_upsell_recommendations/migration.sql`
- `apps/admin-dashboard/src/pages/customers/Customers.tsx`
- `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx`
