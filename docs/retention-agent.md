# Retention Agent Implementation

> **Superseded for the live CRM path.** The CRM no longer decides retention
> actions from ML-style thresholds — see
> [`docs/retention-agent-rule-llm-redesign.md`](./retention-agent-rule-llm-redesign.md)
> for the current Rule Engine → LLM → Validation pipeline that backs
> `CustomersService.getStatusSummary()` and the admin dashboard today. This
> document remains accurate for the standalone Python agents
> (`agent/retention_agent.py`, `services/ai/agents/retention_agent.py`), which
> are unchanged and still useful as a reference for a future ML-backed
> replacement of the rule engine.

This document records how the Retention Agent is implemented in this system, how its model-backed Python version works, and how the same retention decision behavior is surfaced in the CRM and admin dashboard.

## Purpose

The Retention Agent evaluates a customer and recommends whether the business should make a retention-oriented offer.

Current retention actions are:

- `premium_contract_offer`
- `discount_retention_offer`
- `maintenance_plan_offer`
- `no_action`

The agent combines conversion likelihood, predicted lifetime value, churn probability, repair frequency, and contact-channel preference into a structured retention recommendation.

---

## How the bandit optimizes decisions

### What it is

`RetentionBandit` in `agent/retention_bandit.py` is an **epsilon-greedy contextual multi-armed bandit**. The bandit **is the policy** for this agent — all churn-prevention strategy decisions flow through it directly. It maintains a Q-table of average incremental revenue rewards per `(state_context, action)` pair and steers future decisions toward the interventions that historically produce the most revenue lift per customer context bucket.

### State representation

Continuous and categorical state is discretized into a 4-tuple key:

```
churn_bucket    = clamp(int(churn_risk × 10), 0, 10)              # 11 buckets: 0.0–1.0
ltv_bucket      = clamp(int(ltv / 500), 0, 20)                    # 21 buckets: every $500
attempts_bucket = min(5, num_previous_retention_attempts)         # capped at 5
segment         = str(customer_segment).lower()                   # premium | standard | budget
```

Dimensions were chosen because they capture the strongest retention signals: urgency of intervention (churn risk), how much revenue is at stake (LTV), contact fatigue (attempts), and preferred strategy type (segment).

### Learnable actions

```python
RETENTION_ACTIONS = ("discount_10", "discount_20", "call_customer", "send_maintenance_offer", "no_action")
```

`no_action` is included so the bandit learns when proactive outreach costs more than it recovers — for instance, customers who are too far gone to save, or those who have been over-contacted.

### Action selection — epsilon-greedy

A hard safety gate fires before any stochastic choice:

```
If num_previous_retention_attempts > 5 → return no_action unconditionally
```

This prevents repeated contact that erodes customer trust regardless of what the Q-table has learned.

When the gate does not fire:

```
With probability ε  (0.20) → explore: pick a random strategy
With probability 1−ε (0.80) → exploit: pick argmax Q[state_key]
```

### Learning — incremental running average

After each run the bandit updates using the Welford incremental mean:

```
N[state][action] += 1
Q[state][action] += (reward − Q[state][action]) / N[state][action]
```

The reward signal is **incremental revenue** (`actual_revenue − baseline_revenue`):

```
baseline_revenue = (ltv / 24) × (1 − churn_risk)
                   (expected monthly revenue if no action is taken)

actual_revenue   = (ltv / 24) × discount_factor   if customer is retained
                   0.0                              if customer churns

reward           = actual_revenue − baseline_revenue
```

Discount factors penalise over-discounting: `discount_20` earns a lower reward than a `call_customer` that retains at full LTV. A negative reward means the intervention cost more (via discount margin) than it recovered relative to the no-action baseline.

### Decision flow in `retention_agent.py`

```
1. Build state from CRM signals
2. Load persisted bandit   (models/retention_bandit.pkl)
3. bandit.select_action(state)                 ← safety gate → ε-greedy
4. execute_retention_action(action, ...)       ← discount / call / maintenance offer
5. Observe retention outcome                   ← retained = True / False
6. baseline_revenue = monthly_ltv × (1 − churn_risk)
7. actual_revenue   = monthly_ltv × discount_factor  (if retained, else 0.0)
8. reward           = actual_revenue − baseline_revenue
9. bandit.update(state, action, reward)        ← Welford update
10. save_bandit()  →  models/retention_bandit.pkl
```

In batch mode (`run_batch`) the bandit is loaded and saved after each customer so every subsequent customer in the batch benefits from all learning accumulated by prior ones.

### Persistence

The bandit is serialized to `models/retention_bandit.pkl` via `joblib` after every run. `load_bandit()` restores it at the start of the next run. If the file is missing or corrupt, a fresh `RetentionBandit` is initialized automatically.

### Observability

`bandit.stats()` returns a compact summary logged after every update:

```json
{
  "states_explored": 14,
  "total_updates": 380,
  "best_actions_per_state": {
    "(8, 13, 1, 'premium')": "call_customer",
    "(6, 2, 0, 'budget')": "discount_20"
  }
}
```

`bandit.top_actions(n)` returns the most-visited `(state, action)` pairs with Q values and visit counts. Over time the Q-table converges to learned optima such as:

```
(*, high_ltv, *, 'premium') → call_customer  (Q ≈ 180 — high-touch preferred, retains at full rate)
(*, low_ltv,  *, 'budget')  → discount_20    (Q ≈ 25  — price sensitivity drives budget segment)
(*,       *,  5, *)         → no_action      (safety gate — exhausted customers are never contacted)
```

---

## Current Runtime Status

There are two retention implementations in the repo:

1. **Standalone Python Retention Agent**
   - File: `services/ai/agents/retention_agent.py`
   - Loads conversion, LTV, and churn model artifacts.
   - Produces a full `RetentionOutput`.
   - This is the model-backed implementation for batch or service integration.

2. **CRM Customer Status Retention Logic**
   - File: `apps/crm-service/src/customers/customers.service.ts`
   - Computes retention suggestions inline for customer status summaries.
   - Mirrors the same decision thresholds as the Python agent.
   - This is what currently feeds the admin dashboard retention suggestion UI.

Important distinction: the Automatic Follow-up Agent uses `RETENTION` and `REENGAGEMENT` operational follow-up actions. The Retention Agent documented here produces commercial retention offer suggestions such as `discount_retention_offer` and `premium_contract_offer`.

## Production Flow

Current CRM/UI flow:

1. Customer status summary loads customer service, agreement, equipment, review, churn, failure, and upsell signals.
2. CRM computes an upsell recommendation or uses the latest stored upsell recommendation.
3. CRM calls `computeRetentionPrediction()`.
4. The retention prediction is returned in the customer status summary.
5. The admin dashboard displays the retention suggestion in the customer preview and details sidebar.

Standalone Python flow:

1. Customer records are passed to `run_retention_pipeline()`.
2. `RetentionAgent` loads model artifacts.
3. The agent normalizes customer features.
4. The agent predicts conversion probability, LTV, and churn probability.
5. The agent selects a retention action.
6. The agent builds offer, priority, channel, trigger flag, and reason.

## Step 1: Model Artifacts

The standalone Python agent expects these model files:

- `conversion_model.pkl`
- `ltv_model.pkl`
- `churn_model.pkl`

The default model directory is resolved by `RetentionAgent._default_model_dir()`.

Resolution order:

1. `RETENTION_MODEL_DIR`, when set.
2. `services/ai/agents/models`
3. `services/ai/models`
4. `apps/churn-service/src/models`
5. `Server/src/services/ai/models`
6. current working directory plus `apps/churn-service/src/models`

The agent requires all three model artifacts to exist in a candidate directory before using that directory.

## Step 2: Input Contract

The Python input type is `CustomerRecord`.

Fields:

```py
class CustomerRecord(TypedDict, total=False):
    customer_id: str
    total_spend: float
    num_repairs: int
    avg_ticket_size: float
    days_since_last_service: int
    equipment_age: float
    preferred_channel: Channel
```

Supported channels:

```txt
whatsapp
email
call
```

If `preferred_channel` is missing or invalid, the agent defaults it to:

```txt
email
```

## Step 3: Feature Construction

The model feature order is fixed in `RetentionAgent.FEATURE_ORDER`:

```txt
total_spend
num_repairs
avg_ticket_size
days_since_last_service
equipment_age
```

`build_features()` normalizes the customer input and returns a one-row Pandas `DataFrame` using this exact column order.

Normalization behavior:

- missing numeric values become `0.0`
- invalid numeric values become `0.0`
- NaN values become `0.0`
- `num_repairs` is coerced to a non-negative integer
- `days_since_last_service` is coerced to a non-negative integer
- invalid preferred channel becomes `email`

## Step 4: Prediction

The Python `predict()` method returns:

```py
class Predictions(TypedDict):
    p_convert: float
    ltv: float
    churn_probability: float
```

Prediction sources:

- `conversion_model.predict_proba()` gives `p_convert`
- `ltv_model.predict()` gives `ltv`
- `churn_model.predict_proba()` gives `churn_probability`

`ltv` is clamped to a minimum of `0.0`.

Probabilities are clamped to the range `0.0` to `1.0`.

## Step 5: Positive Class Detection

The helper `_positive_class_index()` decides which `predict_proba()` class index represents the positive outcome.

It checks model `classes_` for these positive labels:

```txt
1
true
yes
convert
converted
churn
```

If no matching class is found:

- returns index `1` when there are at least two classes
- returns index `0` for single-class models

This makes the agent tolerant of different model label formats.

## Step 6: Action Decision Rules

The Python action selection is implemented in:

```py
RetentionAgent.decide_action()
```

Rules:

1. If `p_convert > 0.75` and `ltv > 1500`, return `premium_contract_offer`.
2. Else if `churn_probability > 0.7`, return `discount_retention_offer`.
3. Else if `num_repairs >= 3`, return `maintenance_plan_offer`.
4. Else return `no_action`.

The CRM status-summary implementation uses the same thresholds in:

```ts
computeRetentionPrediction()
```

## Step 7: Scoring and Priority

The retention score is:

```txt
p_convert * ltv * (1 - churn_probability)
```

Priority mapping:

- `high`: score greater than `1500`
- `medium`: score between `500` and `1500`, inclusive
- `low`: score below `500`

This score favors customers who are likely to accept an offer, have meaningful value, and are not already too likely to churn.

## Step 8: Offer Mapping

Action-to-offer mapping:

```txt
premium_contract_offer     -> premium, 0% discount
discount_retention_offer   -> discounted, 20% discount
maintenance_plan_offer     -> standard, 10% discount
no_action                  -> none, 0% discount
```

Python implementation:

```py
RetentionAgent._build_offer()
```

CRM implementation:

```ts
retentionOffer()
```

## Step 9: Channel Recommendation

The standalone Python agent trusts the normalized `preferred_channel`.

The CRM status-summary implementation derives the channel from available contact fields:

1. `whatsapp` when mobile exists
2. `email` when email exists
3. `call` when phone exists
4. `email` as fallback

CRM method:

```ts
recommendedRetentionChannel()
```

## Step 10: Trigger Flag

The Python agent sets:

```py
trigger_immediately = normalized["num_repairs"] >= 3
```

The CRM implementation sets:

```ts
triggerImmediately: signals.failureHistory >= 3
```

This means repeated repair or failure history escalates the recommendation even if the selected action is not otherwise high priority.

## Step 11: Reason Generation

Reason messages:

- `premium_contract_offer`: `High conversion probability and high predicted lifetime value`
- `discount_retention_offer`: `High churn probability`
- `maintenance_plan_offer`: `High repair frequency`
- `maintenance_plan_offer` with high conversion: `High repair frequency and high conversion probability`
- `no_action` with repeated repairs: `High repair frequency requires immediate review`
- fallback: `Customer does not meet retention targeting thresholds`

CRM adds one extra operational reason:

- when automatic follow-up is paused: `Manual review because automatic follow-up is paused`

## Step 12: Output Contract

The Python output type is `RetentionOutput`.

```py
class RetentionOutput(TypedDict):
    customer_id: str
    p_convert: float
    ltv: float
    churn_probability: float
    score: float
    action: Action
    offer: Offer
    recommended_channel: Channel
    priority: Priority
    trigger_immediately: bool
    reason: str
```

Example output:

```json
{
  "customer_id": "cust_123",
  "p_convert": 0.812345,
  "ltv": 2400.0,
  "churn_probability": 0.21,
  "score": 1540.35,
  "action": "premium_contract_offer",
  "offer": {
    "type": "premium",
    "discount": 0
  },
  "recommended_channel": "email",
  "priority": "high",
  "trigger_immediately": false,
  "reason": "High conversion probability and high predicted lifetime value"
}
```

## Step 13: Batch Pipeline

The standalone batch entry point is:

```py
run_retention_pipeline(customers: list[CustomerRecord]) -> list[RetentionOutput]
```

Behavior:

1. Instantiates one `RetentionAgent`.
2. Iterates each customer.
3. Calls `generate_output()`.
4. Appends each output to the results list.
5. Logs and re-raises if any customer fails.

This function is useful for a future batch job or API wrapper around the Python agent.

## Step 14: CRM Customer Status Integration

The CRM service computes retention predictions inside:

- `apps/crm-service/src/customers/customers.service.ts`

The status summary builds signals from:

- customer profile
- average monthly spend
- churn probability
- failure history
- upsell recommendation confidence
- automatic follow-up toggle
- contact-channel availability

The CRM method:

```ts
computeRetentionPrediction(signals)
```

returns:

- customer ID
- conversion probability
- annual value / LTV
- churn probability
- score
- action
- offer
- recommended channel
- priority
- trigger flag
- reason

Important difference from the Python agent: CRM currently uses upsell confidence as `pConvert`.

```ts
const pConvert = this.clampProbability(signals.upsellConfidence);
```

Annual value is computed from average monthly spend:

```ts
const ltv = Number((signals.avgMonthlySpend * 12).toFixed(2));
```

## Step 15: Reasoning Output

CRM builds explanation text in:

```ts
buildStatusReasoning()
```

The `retentionSuggestion` reasoning contains:

- `ruleBased`: threshold explanation
- `mlResult`: conversion probability, annual value, churn probability, and score
- `aiExplanation`: selected action, priority, recommended channel, and trigger immediacy

This reasoning is returned in the customer status summary and shown in the dashboard.

## Step 16: Admin Dashboard UI

Retention suggestions are displayed in:

- `apps/admin-dashboard/src/pages/customers/Customers.tsx`
- `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx`
- `apps/admin-dashboard/src/types/api.ts`

The customer status preview displays:

- action label
- priority
- conversion probability
- LTV
- score
- offer type
- discount
- recommended channel
- trigger-now flag
- reason

The customer details sidebar displays a `Retention Suggestion` reasoning card with:

- action and priority
- rule explanation
- model/result summary
- explanation text

The dashboard also includes `inlineRetentionPrediction()` as a UI fallback when the API does not return a retention prediction.

## Step 17: Relationship to Automatic Follow-up Agent

The Automatic Follow-up Agent is implemented separately in:

- `apps/crm-service/src/agents/followup.agent.ts`

It can queue operational follow-up actions:

- `RETENTION`
- `REENGAGEMENT`
- `LEAD_FOLLOWUP`

That agent uses churn probability and service-recency rules to decide whether to contact the customer. It does not currently call the standalone Python `RetentionAgent`.

The Retention Agent documented here answers a different question:

```txt
What retention offer should this customer receive?
```

The Automatic Follow-up Agent answers:

```txt
Should we automatically queue a follow-up message now?
```

## Step 18: Implementation Gaps and Future Integration

Current gaps:

- The standalone Python `RetentionAgent` is not exposed as a FastAPI endpoint.
- CRM does not call `services/ai/agents/retention_agent.py` directly.
- CRM mirrors retention decision rules inline instead of using the Python model-backed `p_convert` and `ltv` predictions.
- There is no `retention_recommendations` persistence table.
- There is no dedicated retention job queue; retention outreach currently goes through the Automatic Follow-up Agent.

Suggested future integration path:

1. Add a FastAPI endpoint for `RetentionAgent.generate_output()`.
2. Define request/response schemas for retention prediction.
3. Add a `RetentionClient` in `crm-service`.
4. Replace or augment `computeRetentionPrediction()` with the model-backed response.
5. Add persistence if historical retention recommendations are needed.
6. Reuse `FollowupProducer` for approved/high-priority retention outreach.

## Operational Configuration

Python agent environment variable:

- `RETENTION_MODEL_DIR`: explicit directory containing retention model artifacts.

Model/runtime dependencies:

- `joblib`
- `pandas`
- models that implement `predict_proba()` for conversion and churn
- an LTV model that implements `predict()`

CRM/UI dependencies:

- customer status summary endpoint
- churn/failure prediction service for risk inputs
- upsell recommendation confidence for CRM `pConvert`
- customer contact fields for channel selection

## Failure Modes

Standalone Python agent:

- Missing model artifact raises `RuntimeError`.
- Failed model load raises `RuntimeError`.
- Conversion or churn model without `predict_proba()` raises `RuntimeError`.
- LTV model without `predict()` raises `RuntimeError`.
- Invalid customer fields are normalized to safe defaults.

CRM inline retention logic:

- Missing upsell recommendation falls back to inline upsell recommendation first.
- Invalid probabilities are clamped.
- Missing contact fields fall back to `email` channel.
- Automatic follow-up paused changes the reason to manual review.

## Verification Checklist

Use this checklist after changing the Retention Agent.

1. Confirm `conversion_model.pkl`, `ltv_model.pkl`, and `churn_model.pkl` exist in a supported model directory.
2. If using a custom directory, set `RETENTION_MODEL_DIR`.
3. Instantiate `RetentionAgent()` and verify all three artifacts load.
4. Run `generate_output()` with a representative customer record.
5. Verify `p_convert`, `ltv`, and `churn_probability` are numeric.
6. Verify action thresholds produce expected outputs.
7. Verify score and priority mapping.
8. Verify invalid/missing customer values normalize safely.
9. In CRM, open a customer status summary and verify `retentionPrediction` is returned.
10. In the admin dashboard, verify the retention suggestion preview and details reasoning card render correctly.

## Main Files

- `services/ai/agents/retention_agent.py`
- `apps/crm-service/src/customers/customers.service.ts`
- `apps/admin-dashboard/src/pages/customers/Customers.tsx`
- `apps/admin-dashboard/src/pages/customers/CustomerDetailsSidebar.tsx`
- `apps/admin-dashboard/src/types/api.ts`
- `apps/crm-service/src/agents/followup.agent.ts`
