# Automatic Follow-up Agent Implementation

This document records how the Automatic Follow-up Agent is implemented in this system, from decision-making through queue delivery and admin UI controls.

## Purpose

The Automatic Follow-up Agent identifies customers and leads that need outreach, decides the follow-up reason, records an audit attempt, and queues a communication job.

Current production actions are:

- `LEAD_FOLLOWUP`: lead has remained cold long enough to need outreach.
- `QUOTE_FOLLOWUP`: a sent quote has gone unanswered for too long.
- `RETENTION`: a maintenance agreement has expired.
- `REENGAGEMENT`: customer is inactive or has not had a recent confirmed service.

The shared payload type also supports `UPSELL`, which is produced by the Upsell Recommendation Agent and consumed by the same follow-up queue worker.

---

## How the Rule-Based + LLM Decision Engine Works

**As of this revision, the follow-up decision no longer depends on the churn-prediction ML model.** There wasn't enough historical data yet to trust `churn_probability > 0.7` as a signal, so the decision path was replaced with a hybrid: deterministic business rules decide **whether** a follow-up is needed, and an LLM only refines **how** to deliver it. `churn-service` and `ChurnClient` still exist and are still used elsewhere (the customer status-summary widget) — they're just no longer part of this decision.

```
Rule Engine  →  Context Builder  →  LLM recommendation  →  Validation  →  same queue call as before
```

### 1. Rule Engine — `apps/crm-service/src/followup/rules/followup-rule-engine.ts`

Pure, synchronous, no I/O. Decides ONLY whether an entity needs follow-up, and why — never channel, timing, or message. Safety gates run first and short-circuit everything else:

1. `automaticFollowupEnabled === false` → no follow-up (this is the existing customer/company toggle column — it doubles as the opt-out signal, no new column needed).
2. `previousFollowupAttempts > 5` → no follow-up (spam prevention).
3. No contact channel at all → no follow-up.

Then, first match wins:

| Rule | Condition | Action | Reason code |
|---|---|---|---|
| Cold lead | `leadStatus` in NEW/CONTACTED/QUALIFIED, created > 3 days ago | `LEAD_FOLLOWUP` | `COLD_LEAD` |
| Quote pending | latest quote status SENT or VIEWED, sent > 3 days ago | `QUOTE_FOLLOWUP` | `QUOTE_PENDING` |
| Agreement expired | `ServiceAgreement.status = EXPIRED`, or an ACTIVE agreement whose `endDate` has passed | `RETENTION` | `AGREEMENT_EXPIRED` |
| Re-engagement | `engagementStatus = INACTIVE`, or no service in > 90 days | `REENGAGEMENT` | `CUSTOMER_INACTIVE` |

Unit tests: `followup-rule-engine.spec.ts` (17 cases — every rule, both safety gates, priority ordering).

### 2. Context Builder — `apps/crm-service/src/followup/context/followup-context-builder.ts`

Turns raw Prisma rows into the structured `FollowupCustomerProfile` the LLM is allowed to see (the LLM never receives database rows directly). `customerSegment` (premium/standard/budget/lead) is a derived heuristic bucket from average monthly agreement spend — there's no stored segment field.

### 3. LLM Decision Layer — `apps/crm-service/src/ai/followup-llm.client.ts` + `followup-llm.prompt.ts`

The LLM is told the rule engine has already decided a follow-up is needed and must not second-guess that. It returns **only**:

```json
{
  "channel": "SMS" | "EMAIL",
  "priority": "Low" | "Medium" | "High",
  "followupWithin": "Today" | "Within 2 days" | "This week",
  "reason": "...",
  "message": "...",
  "confidence": 0.0-1.0
}
```

Uses OpenAI (`OPENAI_API_KEY`, model from `OPENAI_MODEL_FOLLOWUP`, default `gpt-4o-mini`) via the same pattern `apps/chat-service/src/llm/llm.provider.ts` already uses elsewhere in this codebase. `response_format: json_object`, output is shape-validated before being trusted. Any failure — missing API key, timeout, malformed JSON — returns `null`, and the agent falls back to a rule-only decision with the worker's canned copy. The LLM call is skipped entirely when the rule engine found no reason to follow up.

### 4. Validation Layer — `apps/crm-service/src/followup/validation/followup-validation.service.ts`

Never trusts the LLM response directly. Re-checks, independent of what the LLM said:

- `NO_CONTACT_CHANNEL` / `NO_DELIVERABLE_CHANNEL`
- `ATTEMPT_LIMIT_EXCEEDED` (> 5, re-checked as a second gate)
- `OPTED_OUT`
- `INTERVAL_NOT_SATISFIED` (48h duplicate-suppression window)
- `CHANNEL_UNAVAILABLE` — if the LLM recommends a channel with no corresponding contact info, falls back to whichever channel IS available instead of failing outright
- Message length/safety, `followupWithin` → concrete `scheduledFor` timestamp

If validation fails, the entity is skipped exactly like today's "no contact channel" path — no new failure mode. Unit tests: `followup-validation.service.spec.ts` (10 cases).

### Orchestration — `apps/crm-service/src/followup/decision/followup-decision.service.ts`

`FollowupDecisionService.decide()` runs the four steps above in fixed order and returns either `null` (skip) or a `FollowupDecision` with the final action, channel, message, schedule, and a full audit trail. Unit tests: `followup-decision.service.spec.ts` (5 cases, including "LLM is never called when rules say no follow-up").

---

## Production Flow

1. `crm-service` starts `FollowupCron`.
2. `FollowupCron` runs every 6 hours.
3. `FollowupAgent` loads enabled companies, customer candidates, lead candidates, and the latest non-draft quote per customer (cross-schema read from `finance."Quote"` — same raw-SQL pattern `analytics-service` already uses for `finance."Payment"`; guarded, degrades gracefully if unreachable).
4. For each candidate, `FollowupDecisionService.decide()` runs Rule Engine → Context Builder → LLM → Validation.
5. If a decision is returned, the agent creates a `followup_attempts` row and queues the job. If not (rules say no follow-up, or validation blocks it), the candidate is skipped — same as before.
6. `FollowupProducer` publishes a BullMQ job to `followup-queue` (unchanged).
7. `comms-service` `FollowupWorker` consumes the job, preferring the LLM-recommended message/channel/timing when present, falling back to canned copy and phone-then-email otherwise.
8. The admin dashboard exposes company-level and customer-level controls (unchanged).

## Step 1: Churn Model (no longer part of follow-up decisioning)

The model-backed prediction service still lives in `apps/churn-service` (`main.py`, `churn.service.py`, `model_loader.py`, `*.pkl` artifacts) and still exposes `POST /predict/churn`. It is **no longer called by the follow-up agent** — there wasn't enough historical data to trust it yet. It is still used by `CustomersService.getStatusSummary` (`apps/crm-service/src/customers/customers.service.ts`) for the customer detail page's churn widget, via the same `ChurnClient` (`apps/crm-service/src/ai/churn.client.ts`).

### Standalone Retention Agent

There is also a standalone Python retention decision agent at `services/ai/agents/retention_agent.py`, and epsilon-greedy bandit prototypes at `agent/followup_bandit.py` / `agent/followup_agent.py`. Neither is in the production follow-up path — the production path is the NestJS `FollowupAgent` described in this document.

## Step 2: Database Schema

No new migrations were required. The follow-up implementation still depends on:

- `apps/crm-service/prisma/migrations/20260331143000_add_followup_attempts/migration.sql`
- `apps/crm-service/prisma/migrations/20260402101500_add_company_followup_toggle/migration.sql`
- `apps/crm-service/prisma/migrations/20260412120000_add_customer_followup_toggle/migration.sql`

`followup_attempts.action` is `TEXT` (not a Postgres enum), so the new `QUOTE_FOLLOWUP` action required no migration. `followup_attempts.metadata` is `JSONB`; it now carries a `decision` object alongside the existing `recipientName`/`recipientPhone`/`recipientEmail`:

```json
{
  "recipientName": "...",
  "recipientPhone": "...",
  "recipientEmail": "...",
  "decision": {
    "ruleResult": { "needsFollowup": true, "action": "REENGAGEMENT", "reasonCode": "CUSTOMER_INACTIVE", "reason": "...", "matchedRule": "reengagement.inactive" },
    "llmRecommendation": { "channel": "SMS", "priority": "High", "followupWithin": "Today", "reason": "...", "message": "...", "confidence": 0.82 },
    "llmModel": "gpt-4o-mini",
    "validation": { "passed": true, "failedChecks": [] },
    "finalAction": "REENGAGEMENT",
    "finalChannel": "SMS",
    "decidedAt": "2026-07-16T..."
  }
}
```

`churn_probability` on `followup_attempts` is still a valid column but is no longer populated by the automatic path (always `NULL` there now).

**Deferred, not built:** correlating a later customer reply, a booking, or a manager override back to a specific `followup_attempts` row for full closed-loop feedback (manager override / customer response / booking created / revenue generated). That needs hooks in booking/comms flows beyond the follow-up agent itself and is scoped as separate future work — once this decision layer is live and producing `metadata.decision` data to correlate against.

### Company / Customer toggles (unchanged)

```sql
ALTER TABLE "companies" ADD COLUMN "automaticFollowupEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "customers" ADD COLUMN "automaticFollowupEnabled" BOOLEAN NOT NULL DEFAULT true;
```

The customer-level column is what the rule engine's `OPTED_OUT` safety gate reads — there is no separate "opted out" flag.

## Step 3: Shared Types and Queue Name

Shared types are defined in `packages/types/src/index.ts`:

```ts
export type FollowupAction = 'RETENTION' | 'REENGAGEMENT' | 'LEAD_FOLLOWUP' | 'QUOTE_FOLLOWUP' | 'UPSELL';
export type FollowupChannel = 'SMS' | 'EMAIL'; // WhatsApp not wired in comms-service yet

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
  recommendedMessage?: string;
  recommendedSubject?: string;
  recommendedChannel?: FollowupChannel;
  scheduledFor?: string;
  llmConfidence?: number;
}
```

Plus `FollowupRuleFacts`, `FollowupRuleResult`, `FollowupCustomerProfile`, `FollowupLlmRecommendation`, and `FollowupDecisionAudit` for the decision engine internals (see the same file).

The BullMQ queue name is unchanged: `packages/queue/src/index.ts` → `FOLLOWUP = 'followup-queue'`.

## Step 4: Follow-up Agent Module Wiring

`apps/crm-service/src/followup/followup.module.ts` registers:

- `FollowupRuleEngine`, `FollowupContextBuilder`, `FollowupLlmClient`, `FollowupValidationService`, `FollowupDecisionService`
- `FollowupProducer` (or `NoopFollowupProducer` when Redis isn't configured)
- `FollowupAgent`, `FollowupCron`

`ChurnClient` is no longer provided here — `CustomersModule` provides its own instance independently for the status-summary widget.

## Step 5: Scheduled Agent Execution

Unchanged. `apps/crm-service/src/cron/followup.cron.ts` starts on module init, runs immediately, then every 6 hours, with an `isRunning` guard.

## Step 6: Candidate Selection

Core implementation: `apps/crm-service/src/agents/followup.agent.ts`, entry point `run(): Promise<FollowupRunSummary>` (`{ processed, queued, skipped, failures }`, unchanged shape).

- **Enabled companies / customer candidates / lead candidates**: same filters as before (`automaticFollowupEnabled`, `isActive`, portal-signup exclusion, lead status + 3-day age cutoff).
- **Quotes**: `loadLatestQuotesByCustomer()` — one guarded cross-schema query per run against `finance."Quote"`, keyed by customer ID, latest non-DRAFT quote only.
- Customer candidates now also select `equipment` (for equipment age) and `notes`, and `agreements` are no longer filtered to ACTIVE-only in the query (the rule engine needs to see EXPIRED ones too; the active-only sum for spend is now computed in code).

## Step 7: Duplicate Suppression

Unchanged: `hasRecentFollowup()` checks `followup_attempts` for a `PENDING`/`QUEUED` row on the same entity within 48 hours before any decisioning work happens (so the LLM is never called for an entity that's about to be skipped anyway).

A new `countFollowupAttempts()` counts **all-time** attempts for the entity, feeding the rule engine's `previousFollowupAttempts > 5` safety gate.

## Step 8: Decision

Replaces the old `determineCustomerAction()`. `processCustomer()` / `processLead()` now:

1. Check `hasRecentFollowup()` (unchanged short-circuit).
2. Compute days-since-last-service, average monthly spend, equipment age, recent service history, matched quote (customers) or days-since-created (leads).
3. Call `FollowupDecisionService.decide()`.
4. `null` → skip. Otherwise build the `FollowupJobPayload` with the decision's action, reason, `recommendedMessage`, `recommendedChannel`, `scheduledFor`, `llmConfidence`.

`runForCustomer()` (manual "run follow-up now" trigger from `CustomersService.executeFollowup`) goes through the same decision path. `triggerRetentionForCustomer()` (explicit manual retention action) is unchanged — it's a deliberate manual override, not automatic decisioning, so it still queues `RETENTION` directly.

## Step 9: Attempt Persistence

Unchanged mechanics (`createAttempt` → `PENDING`, `markAttemptQueued` → `QUEUED` + `queue_job_id`, `markAttemptFailed` → `FAILED` + `error_message`). `createAttempt()`'s `metadata` JSON now includes the `decision` audit object described in Step 2.

## Step 10: Queue Publishing

Unchanged: `apps/crm-service/src/queues/followup.producer.ts`, `followup-queue`, `attempts: 3`, exponential backoff, `REDIS_HOST`/`REDIS_PORT`.

## Step 11: Analytics Event Logging

Unchanged: `POST ${ANALYTICS_SERVICE_URL}/events`, event type `FOLLOWUP_TRIGGERED`, non-blocking. `churnProb` is no longer part of the metadata (always absent now).

## Step 12: Communication Worker

`apps/comms-service/src/workers/followup.worker.ts`:

1. `message = job.data.recommendedMessage ?? buildMessage(action)` (canned copy fallback, now includes a `QUOTE_FOLLOWUP` case).
2. `subject = job.data.recommendedSubject ?? buildSubject(action)`.
3. `scheduledAt = job.data.scheduledFor` (passed through to `NotificationsService.sendSms/sendEmail`, which already supported delayed delivery).
4. Channel selection: if `recommendedChannel` is present, use it (only if the corresponding contact field exists); otherwise fall back to the original phone-then-email default.
5. No channel available → `{ skipped: true }`, unchanged.

Unit tests: `followup.worker.spec.ts` (6 cases).

## Step 13/14: Admin UI Controls

Unchanged — company-level toggle (`apps/admin-dashboard/src/pages/Settings.tsx`) and customer-level toggle (`apps/admin-dashboard/src/pages/customers/Customers.tsx`) still gate `FollowupAgent`'s candidate queries exactly as before.

## Operational Configuration

- `OPENAI_API_KEY` — required for LLM recommendations; if unset, the agent still runs on rules alone with canned copy.
- `OPENAI_MODEL_FOLLOWUP` — default `gpt-4o-mini`.
- `CHURN_SERVICE_URL` — still used by `ChurnClient` elsewhere in `crm-service`, no longer read by the follow-up path.
- `ANALYTICS_SERVICE_URL`, `REDIS_HOST`, `REDIS_PORT` — unchanged.

## Failure Modes and Fallbacks

- Missing `companies` table / `automaticFollowupEnabled` columns / `followup_attempts` table: same graceful degradation as before.
- `finance.Quote` unreachable: Quote Follow-up rule is silently skipped for the run (checked via `information_schema.tables`, logged once, cached).
- LLM unavailable (no API key, timeout, malformed response): `FollowupLlmClient.recommend()` returns `null`; the rule engine's decision and validation's channel fallback still produce a valid follow-up using the worker's canned copy.
- Validation blocks the recommendation (e.g. LLM recommends a channel with no matching contact info): falls back to whatever channel IS deliverable rather than failing outright; only fails completely if no channel is deliverable at all.
- Queue publish failure / no contact channel: unchanged (`FAILED` status / skip + warning log).

## Verification Checklist

1. Run CRM migrations so `followup_attempts`, company toggle, and customer toggle exist (no new migrations for this revision).
2. `pnpm --filter crm-service test -- followup` — rule engine, context builder, LLM client, validation, decision service specs.
3. `pnpm --filter comms-service test -- followup` — worker specs.
4. `pnpm --filter crm-service type-check` and `pnpm --filter comms-service type-check`.
5. Set `OPENAI_API_KEY`, trigger a follow-up for a seeded INACTIVE customer, confirm `followup_attempts.metadata.decision.llmRecommendation` is populated and the sent message isn't the canned copy.
6. Unset `OPENAI_API_KEY`, confirm the same trigger still queues using canned copy (rule-only fallback).
7. Seed a customer with 6+ prior `followup_attempts` rows; confirm the safety gate suppresses it.
8. Seed a `finance.Quote` row (`status=SENT`, `sentAt` 4+ days ago); confirm a `QUOTE_FOLLOWUP` attempt is created.
9. Toggle company/customer settings off in Settings; confirm exclusion, same as before.

## Main Files

- `apps/crm-service/src/followup/rules/followup-rule-engine.ts`
- `apps/crm-service/src/followup/context/followup-context-builder.ts`
- `apps/crm-service/src/followup/validation/followup-validation.service.ts`
- `apps/crm-service/src/followup/decision/followup-decision.service.ts`
- `apps/crm-service/src/ai/followup-llm.client.ts`
- `apps/crm-service/src/ai/followup-llm.prompt.ts`
- `apps/crm-service/src/agents/followup.agent.ts`
- `apps/crm-service/src/cron/followup.cron.ts`
- `apps/crm-service/src/followup/followup.module.ts`
- `apps/crm-service/src/queues/followup.producer.ts`
- `apps/comms-service/src/workers/followup.worker.ts`
- `packages/types/src/index.ts`
- `packages/queue/src/index.ts`
- `apps/crm-service/src/ai/churn.client.ts` (still used by `CustomersService.getStatusSummary`, no longer by follow-up decisioning)
- `apps/admin-dashboard/src/pages/Settings.tsx`
- `apps/admin-dashboard/src/hooks/useSettings.ts`
- `apps/admin-dashboard/src/pages/customers/Customers.tsx`
- `apps/crm-service/src/company/company.service.ts`
