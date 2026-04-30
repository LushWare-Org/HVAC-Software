# Automatic Follow-up Agent Implementation

This document records how the Automatic Follow-up Agent is implemented in this system, from ML model artifacts through CRM orchestration, queue delivery, and admin UI controls.

## Purpose

The Automatic Follow-up Agent identifies customers and leads that need outreach, decides the follow-up reason, records an audit attempt, and queues a communication job.

Current production actions are:

- `RETENTION`: customer has high churn probability.
- `REENGAGEMENT`: customer is inactive or has not had a recent confirmed service.
- `LEAD_FOLLOWUP`: lead has remained cold long enough to need outreach.

The shared payload type also supports `UPSELL`, which is produced by the Upsell Recommendation Agent and consumed by the same follow-up queue worker.

---

## How the bandit optimizes decisions

### What it is

`FollowUpBandit` in `agent/followup_bandit.py` is an **epsilon-greedy contextual multi-armed bandit**. Unlike the revenue agent where the bandit overrides a primary ML policy 20 % of the time, here the bandit **is the policy** — every channel selection decision flows through it directly. It maintains a Q-table of average response rewards per `(state_context, action)` pair and steers future decisions toward the channels that historically produce the most bookings.

### State representation

Continuous and categorical state is reduced to a discrete 4-tuple key:

```
days_bucket      = min(int(days_since_last_contact), 7)   # 8 buckets: 0–7 days
attempts_bucket  = min(int(num_previous_attempts), 5)     # 6 buckets: 0–5 attempts
lead_stage       = str(lead_stage).lower()                # new_lead | quote_sent | negotiation | churned
customer_segment = str(customer_segment).lower()          # premium | standard | budget
```

Bucketing collapses similar customers so the bandit generalises across them rather than requiring a separate cell per unique profile. Dimensions were chosen because they capture the strongest follow-up signals: urgency (days), fatigue (attempts), pipeline position (stage), and value tier (segment).

### Learnable actions

```python
FOLLOWUP_ACTIONS = ("call", "sms", "whatsapp", "email", "no_followup")
```

`no_followup` is included so the bandit can learn when silence is better than contact — for example, customers who have already responded or recently converted.

### Action selection — epsilon-greedy

A hard safety gate fires before any stochastic choice:

```
If num_previous_attempts > 5 → return no_followup unconditionally
```

This prevents the bandit from spamming customers during exploration regardless of what the Q-table has learned.

When the gate does not fire:

```
With probability ε  (0.20) → explore: pick a random channel
With probability 1−ε (0.80) → exploit: pick argmax Q[state_key]
```

### Learning — incremental running average

After each run the bandit updates using the Welford incremental mean:

```
N[state][action] += 1
Q[state][action] += (reward − Q[state][action]) / N[state][action]
```

The reward signal is engagement quality, not raw contact volume:

| Outcome | Reward |
|---------|--------|
| Customer books a service | 10.0 |
| Customer responds but does not book | 1.0 |
| No response | 0.0 |

Booking is weighted 10× higher than a response so the bandit prioritises channels that lead to actual revenue, not just engagement.

### Decision flow in `followup_agent.py`

```
1. Build state from CRM signals
2. Load persisted bandit   (models/followup_bandit.pkl)
3. bandit.select_action(state)           ← safety gate → ε-greedy
4. execute_followup(action, ...)         ← call / SMS / WhatsApp / email
5. Observe customer response window      ← responded, booked
6. reward = 10.0 if booked, 1.0 if responded, 0.0 otherwise
7. bandit.update(state, action, reward)  ← Welford update
8. save_bandit()  →  models/followup_bandit.pkl
```

In batch mode (`run_batch`) the bandit is loaded and saved after each customer so every subsequent customer in the batch benefits from the learning accumulated by all prior ones.

### Persistence

The bandit is serialized to `models/followup_bandit.pkl` via `joblib` after every run. `load_bandit()` restores it at the start of the next run. If the file is missing or corrupt, a fresh `FollowUpBandit` is initialized automatically.

### Observability

`bandit.stats()` returns a compact summary logged after every update:

```json
{
  "states_explored": 8,
  "total_updates": 215,
  "best_actions_per_state": {
    "(3, 2, 'quote_sent', 'premium')": "call",
    "(7, 1, 'new_lead', 'budget')": "sms"
  }
}
```

`bandit.top_actions(n)` returns the most-visited `(state, action)` pairs with Q values and visit counts. Over time the Q-table converges to learned optima such as:

```
(*, *, *, 'premium') → call      (Q ≈ 2.1 — high-value customers respond to calls)
(*, *, *, 'budget')  → sms       (Q ≈ 1.8 — SMS converts best for budget segment)
(7, 5, *, *)         → call      (late follow-ups need a stronger touch)
```

---

## Production Flow

1. ML models are loaded by `apps/churn-service`.
2. `crm-service` starts `FollowupCron`.
3. `FollowupCron` runs every 6 hours.
4. `FollowupAgent` loads enabled companies, customer candidates, and lead candidates.
5. Customer candidates are scored using churn prediction.
6. The agent creates a `followup_attempts` row when a follow-up should be queued.
7. `FollowupProducer` publishes a BullMQ job to `followup-queue`.
8. `comms-service` `FollowupWorker` consumes the job.
9. The worker sends SMS first when a phone number is present, otherwise email.
10. The admin dashboard exposes company-level and customer-level controls.

## Step 1: ML Model Implementation

The model-backed prediction service lives in:

- `apps/churn-service/src/main.py`
- `apps/churn-service/src/services/churn.service.py`
- `apps/churn-service/src/services/failure.service.py`
- `apps/churn-service/src/services/revenue.service.py`
- `apps/churn-service/src/utils/model_loader.py`
- `apps/churn-service/src/models/*.pkl`

Model artifacts currently used by churn/failure scoring:

- `churn_model.pkl`
- `churn_features.pkl`
- `failure_model.pkl`
- `failure_features.pkl`

`ModelRegistry` in `model_loader.py` loads these artifacts with `joblib`. The FastAPI app preloads them during lifespan startup through `preload_models()`.

The model service exposes:

- `GET /health`
- `POST /predict/churn`
- `POST /predict/failure`
- `POST /predict/revenue`
- `POST /recommend-offer`

For the Automatic Follow-up Agent, the important endpoint is `POST /predict/churn`. It returns:

```json
{
  "churn_probability": 0.82
}
```

The revenue endpoint is used elsewhere in CRM customer status summaries and upsell enrichment, but the follow-up agent itself only calls churn prediction for customer action selection.

### Standalone Retention Agent

There is also a standalone Python retention decision agent at:

- `services/ai/agents/retention_agent.py`

It loads:

- `conversion_model.pkl`
- `ltv_model.pkl`
- `churn_model.pkl`

It produces richer decisions such as `premium_contract_offer`, `discount_retention_offer`, and `maintenance_plan_offer`.

Important distinction: this standalone `RetentionAgent` is not the runtime NestJS follow-up scheduler. The production automatic follow-up path is the NestJS `FollowupAgent` plus `apps/churn-service`.

## Step 2: CRM Churn Client

The CRM service talks to the ML service through:

- `apps/crm-service/src/ai/churn.client.ts`

`ChurnClient.predictChurn()` posts to `/predict/churn`. It resolves candidate base URLs from:

1. `CHURN_SERVICE_URL`
2. `http://localhost:8000`
3. `http://churn-service:8000`

The client keeps a `healthyBaseUrl` once a request succeeds and falls back across candidates on failure. If every candidate fails, it throws an error to the caller.

The follow-up agent catches churn service failures and continues without a model score. In that case, it can still choose `REENGAGEMENT` based on engagement status or service recency.

## Step 3: Database Schema

The follow-up implementation depends on these CRM migrations:

- `apps/crm-service/prisma/migrations/20260331143000_add_followup_attempts/migration.sql`
- `apps/crm-service/prisma/migrations/20260402101500_add_company_followup_toggle/migration.sql`
- `apps/crm-service/prisma/migrations/20260412120000_add_customer_followup_toggle/migration.sql`

### `followup_attempts`

The `followup_attempts` table stores duplicate suppression and audit history.

Important columns:

- `company_id`
- `entity_type`
- `entity_id`
- `customer_id`
- `lead_id`
- `action`
- `status`
- `churn_probability`
- `queue_job_id`
- `reason`
- `error_message`
- `metadata`
- `triggered_at`
- `queued_at`
- `failed_at`

Important indexes:

- `followup_attempts_company_entity_triggered_idx`
- `followup_attempts_company_status_triggered_idx`

### Toggles

Company-level toggle:

```sql
ALTER TABLE "companies"
ADD COLUMN "automaticFollowupEnabled" BOOLEAN NOT NULL DEFAULT true;
```

Customer-level toggle:

```sql
ALTER TABLE "customers"
ADD COLUMN "automaticFollowupEnabled" BOOLEAN NOT NULL DEFAULT true;
```

The implementation checks whether these columns exist before using them, so older local databases do not immediately break. When a column is missing, the service logs a warning and defaults to enabled behavior.

## Step 4: Shared Types and Queue Name

Shared follow-up payload types are defined in:

- `packages/types/src/index.ts`

Key types:

```ts
export type FollowupAction = 'RETENTION' | 'REENGAGEMENT' | 'LEAD_FOLLOWUP' | 'UPSELL';

export interface FollowupJobPayload {
  companyId: string;
  entityType: 'customer' | 'lead';
  entityId: string;
  customerId?: string;
  leadId?: string;
  recipientId: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  action: FollowupAction;
  churnProb?: number;
  reason: string;
  triggeredAt: string;
}
```

The BullMQ queue name is defined in:

- `packages/queue/src/index.ts`

```ts
FOLLOWUP = 'followup-queue'
```

## Step 5: Follow-up Agent Module Wiring

The NestJS module is:

- `apps/crm-service/src/followup/followup.module.ts`

It registers:

- `ChurnClient`
- `FollowupProducer`
- `FollowupAgent`
- `FollowupCron`

The CRM app imports the follow-up module from:

- `apps/crm-service/src/app.module.ts`

## Step 6: Scheduled Agent Execution

The scheduler is:

- `apps/crm-service/src/cron/followup.cron.ts`

Behavior:

- Starts on module initialization.
- Runs immediately once.
- Runs again every 6 hours.
- Uses an `isRunning` guard to avoid overlapping runs.
- Calls `prisma.ensureRequiredSchemaReady()` before agent execution.
- Logs summary output after completion.

Current interval:

```ts
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
```

## Step 7: Candidate Selection

The core implementation is:

- `apps/crm-service/src/agents/followup.agent.ts`

The public entry point is:

```ts
async run(): Promise<FollowupRunSummary>
```

Run summary shape:

```ts
{
  processed: number;
  queued: number;
  skipped: number;
  failures: number;
}
```

### Enabled Companies

`getEnabledCompanyIds()` loads companies from `companies`.

If `companies.automaticFollowupEnabled` exists, only companies where it is `TRUE` are included.

If the column does not exist, all companies are treated as enabled and a warning is logged.

### Customer Candidates

`loadCustomerCandidates()` filters customers by:

- `isActive: true`
- `companyId` in enabled company IDs
- `automaticFollowupEnabled: true` when the customer toggle column exists
- excludes portal-signup inactive customers

It selects:

- contact details
- engagement status
- creation/update dates
- recent confirmed/converted bookings
- active agreement values

### Lead Candidates

`loadLeadCandidates()` filters leads by:

- company is enabled
- status is `NEW`, `CONTACTED`, or `QUALIFIED`
- `createdAt` is at least 3 days old

Lead follow-up does not currently have a lead-level toggle.

## Step 8: Duplicate Suppression

Before processing a customer or lead, the agent calls:

```ts
hasRecentFollowup(companyId, entityType, entityId)
```

It checks `followup_attempts` for a matching entity where:

- status is `PENDING` or `QUEUED`
- `triggered_at >= NOW() - INTERVAL '48 hours'`

If a recent attempt exists, the entity is skipped.

If the `followup_attempts` table is missing, duplicate suppression is disabled and the agent logs a warning.

## Step 9: Customer Decision Logic

Customer processing happens in:

```ts
processCustomer(customer)
```

The agent computes:

- days since last service
- service count in the last year
- average monthly spend
- customer tenure in days

It calls:

```ts
determineCustomerAction(customer, daysSinceLastService)
```

Decision rules:

1. Try to call `ChurnClient.predictChurn()`.
2. If `churnProb > 0.7`, return `RETENTION`.
3. If engagement status is `INACTIVE`, return `REENGAGEMENT`.
4. If days since last service is greater than `90`, return `REENGAGEMENT`.
5. Otherwise return `null` and skip the customer.

If churn prediction is unavailable, rules 3 and 4 still apply.

The follow-up reason is stored in the payload and attempt table. Example reasons:

- `High churn probability 0.812`
- `Customer engagement status is INACTIVE`
- `No recent service in 123 days`

## Step 10: Lead Decision Logic

Lead processing happens in:

```ts
processLead(lead)
```

Every eligible cold lead gets a `LEAD_FOLLOWUP` action unless:

- a recent follow-up already exists
- no phone, WhatsApp number, or email exists
- queue publishing fails

The recipient phone is selected as:

1. `whatsappNo`
2. `phone`

The reason is:

```ts
Cold lead in status ${lead.status}
```

## Step 11: Attempt Persistence

Before queue publishing, the agent calls:

```ts
createAttempt(...)
```

The attempt starts with status `PENDING`.

After a successful queue publish:

```ts
markAttemptQueued(attemptId, jobId)
```

The row is updated to:

- `status = QUEUED`
- `queue_job_id = jobId`
- `queued_at = NOW()`

After a queue failure:

```ts
markAttemptFailed(attemptId, errorMessage)
```

The row is updated to:

- `status = FAILED`
- `failed_at = NOW()`
- `error_message = failure reason`

## Step 12: Queue Publishing

Queue publishing is handled by:

- `apps/crm-service/src/queues/followup.producer.ts`

`enqueueFollowup()` adds a BullMQ job:

```ts
this.queue.add('followup-job', payload, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: {
    count: 500,
  },
  removeOnFail: {
    count: 1000,
  },
});
```

Redis config comes from:

- `REDIS_HOST`
- `REDIS_PORT`

Default values are `localhost` and `6379`.

## Step 13: Analytics Event Logging

After a job is queued, `FollowupAgent.logAnalyticsEvent()` posts to:

```txt
${ANALYTICS_SERVICE_URL}/events
```

Default analytics service URL:

```txt
http://analytics-service:3006
```

Event type:

```txt
FOLLOWUP_TRIGGERED
```

Metadata includes:

- action
- entity type
- entity ID
- customer ID
- lead ID
- churn probability
- reason
- triggered timestamp

Analytics logging failures are non-blocking. The follow-up remains queued even if analytics logging fails.

## Step 14: Communication Worker

The queue consumer is:

- `apps/comms-service/src/workers/followup.worker.ts`

It is registered through:

- `apps/comms-service/src/notifications/notifications.module.ts`

Processing behavior:

1. Build message copy from the action.
2. If `recipientPhone` exists, send SMS.
3. Otherwise, if `recipientEmail` exists, send email.
4. Otherwise, log and return `{ skipped: true }`.

Subjects:

- `RETENTION`: `Let us keep your HVAC system running smoothly`
- `REENGAGEMENT`: `Time to book your next HVAC service`
- `LEAD_FOLLOWUP`: `Ready to schedule your first HVAC visit?`
- `UPSELL`: `A service recommendation is ready for your HVAC system`

Messages:

- `RETENTION`: asks about a maintenance offer.
- `REENGAGEMENT`: prompts service scheduling after a long gap.
- `LEAD_FOLLOWUP`: asks the lead to book the first service visit.
- `UPSELL`: asks the customer to schedule a review based on service history.

Actual sending is delegated to:

- `apps/comms-service/src/notifications/notifications.service.ts`

## Step 15: Company-level UI Control

The admin settings UI lives in:

- `apps/admin-dashboard/src/pages/Settings.tsx`
- `apps/admin-dashboard/src/hooks/useSettings.ts`

The settings page shows an `Automatic Follow-up Agent` control. It explains that disabling the toggle stops CRM from queuing automatic follow-up messages.

The hook calls:

- `GET /crm/company`
- `PATCH /crm/company`

The API implementation is:

- `apps/crm-service/src/company/company.controller.ts`
- `apps/crm-service/src/company/company.service.ts`

`CompanyService.update()` persists `automaticFollowupEnabled` when the column exists. `FollowupAgent.getEnabledCompanyIds()` uses that value during scheduled runs.

## Step 16: Customer-level UI Control

The customer table UI lives in:

- `apps/admin-dashboard/src/pages/customers/Customers.tsx`

Each customer row includes an `Auto Follow-up` toggle.

When toggled, the UI calls the customer update mutation with:

```ts
{
  automaticFollowupEnabled: boolean
}
```

The CRM implementation updates the customer record through the existing customer update path. `FollowupAgent.loadCustomerCandidates()` excludes customers where this flag is `false`, as long as the column exists.

The customer status summary also uses the same flag to show manual-review messaging when automatic follow-up is paused.

## Operational Configuration

Important environment variables:

- `CHURN_SERVICE_URL`: preferred URL for the churn model service.
- `ANALYTICS_SERVICE_URL`: analytics event endpoint base URL.
- `REDIS_HOST`: Redis host for BullMQ.
- `REDIS_PORT`: Redis port for BullMQ.

There is no feature flag in the current `FollowupCron`; it starts automatically with the CRM service when the module is loaded. Use the company-level UI toggle to disable automatic queuing per company.

## Failure Modes and Fallbacks

- Missing `companies` table: agent skips automatic follow-up.
- Missing `companies.automaticFollowupEnabled`: all companies are treated as enabled.
- Missing `customers.automaticFollowupEnabled`: customer-level toggles are ignored.
- Missing `followup_attempts`: duplicate suppression and attempt audit are disabled.
- Churn service unavailable: customer retention scoring is skipped, but recency and inactive-status re-engagement rules still run.
- Analytics service unavailable: queueing still succeeds; only analytics logging is skipped.
- Queue publish failure: attempt is marked `FAILED` when `followup_attempts` exists.
- No contact channel: entity is skipped and a warning is logged.

## Verification Checklist

Use this checklist after changing the agent.

1. Run CRM migrations so `followup_attempts`, company toggle, and customer toggle exist.
2. Confirm `apps/churn-service` starts and `GET /health` returns `ok`.
3. Confirm model artifacts exist under `apps/churn-service/src/models`.
4. Confirm Redis is reachable by CRM and comms services.
5. Start `crm-service` and check logs for `Starting follow-up cycle`.
6. Confirm `followup_attempts` receives `PENDING`, then `QUEUED`, rows for eligible customers/leads.
7. Confirm `followup-queue` jobs are consumed by `comms-service`.
8. Confirm SMS or email notification rows/messages are created.
9. Toggle the company setting off in Settings and verify new automatic attempts are not created for that company.
10. Toggle an individual customer off and verify that customer is excluded from future customer candidate scans.

## Main Files

- `apps/churn-service/src/main.py`
- `apps/churn-service/src/services/churn.service.py`
- `apps/churn-service/src/utils/model_loader.py`
- `services/ai/agents/retention_agent.py`
- `apps/crm-service/src/ai/churn.client.ts`
- `apps/crm-service/src/agents/followup.agent.ts`
- `apps/crm-service/src/cron/followup.cron.ts`
- `apps/crm-service/src/followup/followup.module.ts`
- `apps/crm-service/src/queues/followup.producer.ts`
- `apps/comms-service/src/workers/followup.worker.ts`
- `packages/types/src/index.ts`
- `packages/queue/src/index.ts`
- `apps/admin-dashboard/src/pages/Settings.tsx`
- `apps/admin-dashboard/src/hooks/useSettings.ts`
- `apps/admin-dashboard/src/pages/customers/Customers.tsx`
- `apps/crm-service/src/company/company.service.ts`
