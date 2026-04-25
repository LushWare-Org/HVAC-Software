# Revenue Agent

An autonomous revenue optimization pipeline for HVAC service businesses. Each run reads live business context, selects the highest-value action, executes it, measures the outcome, and feeds the reward back into a contextual bandit so future decisions improve over time.

---

## How it works

The agent runs a fixed four-stage loop on every invocation:

```
build_state → decide → execute → log feedback
              ↑                        ↓
              └──── bandit update ─────┘
```

### Stage 1 — Build state (`state_builder.py`)

`build_state()` assembles a `RevenueState` snapshot from three sources:

| Source | What it provides |
|--------|-----------------|
| CRM client | Technician utilization, pending quote count, team size |
| Model client | Churn risk score, customer LTV, conversion rate |
| Three pkl models | Demand forecast, utilization forecast, optimal price |

If a live client or model is unavailable, the stage falls back gracefully to deterministic mock values so local runs and CI always produce a complete state.

The three prediction models run in sequence:

1. **`demand_forecast_model.pkl`** — predicts booking volume from time-of-day, day-of-week, month, and outdoor temperature (cyclic sine/cosine encodings). Output: `expected_demand` and `demand_gap` (forecast minus full capacity).
2. **`utilization_model.pkl`** — predicts technician workload from `expected_demand`, team size, average job duration, and the same time/weather features. Output: `utilization` (0–1).
3. **`pricing_model.pkl`** — scores six candidate prices (100, 120, 150, 180, 200, 250) against demand, utilization, churn risk, LTV, customer segment, and urgency. Returns the revenue-maximising `optimal_price` within pricing guardrails (max 20 % discount, max 35 % spike, minimum margin floor).

### Stage 2 — Decide (`decision_engine.py`)

`decide()` evaluates three policy layers in strict priority order:

```
capacity_aware.v1   (highest priority — never overridden by bandit)
       ↓ fallthrough if no trigger
action_effect_models.v1   (ML scoring via XGBoost)
       ↓ fallthrough on model error
rules.v1   (deterministic rule fallback)
```

**Capacity-aware policy** (`capacity_aware.v1`):
Fires first when forecast signals indicate an operational response is needed:

| Condition | Action |
|-----------|--------|
| `demand_gap < -20` and `utilization < 0.60` | `discount_with_price_override` (high priority) |
| `demand_gap < -20` and `utilization < 0.85` | `discount_10` (medium priority) |
| `utilization > 0.85` | `increase_price` (high if > 0.95, else medium) |
| Pricing model found a price ≥ 5 % better than current | `apply_dynamic_price` |

**ML policy** (`action_effect_models.v1`):
Scores all four learnable actions (`discount_10`, `discount_20`, `call`, `none`) using per-action XGBoost regression models trained on historical revenue outcomes. Selects `argmax(predicted_revenue − action_cost)`. Action costs penalise expensive interventions (discount_20: $800, call: $100, discount_10: $300, none: $0).

**Rule fallback** (`rules.v1`):
Fires when the ML models fail or are unavailable. Threshold-based rules cover churn risk, pending quote backlog, low utilization, and low conversion rate.

**Safety constraints** (`apply_constraints()`):
Applied on top of any policy output:
- `utilization > 0.95` → block all discounts, upgrade to `increase_price`
- `churn_risk ≥ 0.70` → override to `call`
- `ltv < 500` → downgrade discounts to `none`
- `ltv < 1000` → downgrade `discount_20` to `discount_10`

### Stage 3 — Execute (`executor.py`)

Routes the decision to an action handler. Current handlers are mock implementations that log the action and return an `ExecutionResult`. Each handler is a drop-in replacement point for real CRM, email/SMS, or pricing API integrations.

| Action | Handler |
|--------|---------|
| `discount_10` / `discount_20` | `send_discount_offer` |
| `call` | `create_call_task` |
| `increase_price` / `apply_dynamic_price` | `increase_price` / `execute_dynamic_price` |
| `discount_with_price_override` | `discount_with_price_override` |
| `trigger_campaign_low_demand` | `trigger_campaign_low_demand` |
| `geo_target_discount` / `same_day_offer` | dedicated mock handlers |
| `none` | `no_action` |

### Stage 4 — Log feedback (`feedback_logger.py`)

After execution the agent computes the outcome signals and writes a `FeedbackRecord` containing every input signal, the decision, the execution result, and the reward. Records are appended to a local JSONL file and inserted into MongoDB (non-blocking background thread, best-effort).

Key fields logged:

| Field | What it captures |
|-------|-----------------|
| `baseline_revenue` | Revenue if the agent had done nothing (`expected_demand × current_price`) |
| `realized_revenue` | Actual or estimated post-action revenue |
| `reward` | `realized_revenue − baseline_revenue` — the incremental lift |
| `bandit_selected` | Whether the bandit drove this decision |
| `applied_price` | Price actually used |
| `utilization_actual` | Realized technician utilization |

---

## How the bandit optimizes decisions

### What it is

`ContextualBandit` in `agent/bandit.py` is an **epsilon-greedy contextual multi-armed bandit**. It maintains a Q-table of average incremental revenue rewards per `(state_context, action)` pair and uses that table to steer future exploration toward the actions that historically produce the most lift.

### State representation

Continuous state is discretized into a `(util_bucket, demand_bucket)` key:

```
util_bucket   = clamp(int(utilization × 10), 0, 10)      # 11 buckets: 0.0–1.0
demand_bucket = clamp(int(demand_gap / 10), -10, 10)      # 21 buckets: ≈±100 gap
```

This collapses the infinite state space to 231 possible cells so each cell accumulates enough samples for reliable Q estimates within a reasonable deployment window.

### Learnable actions

The bandit learns over a deliberately small action set:

```python
BANDIT_ACTIONS = ("discount_10", "discount_20", "call", "none")
```

Capacity-aware actions (`increase_price`, `apply_dynamic_price`, `discount_with_price_override`) are excluded because they are governed by deterministic safety rules that must not be weakened by exploration data.

### Action selection — epsilon-greedy

On every `select_action()` call:

```
With probability ε  (0.20) → explore: pick a random action
With probability 1−ε (0.80) → exploit: pick argmax Q[state_key]
```

The random seed is intentionally not fixed so exploration remains stochastic across runs.

### Learning — incremental running average

After each run the bandit updates the Q-table using the Welford incremental mean:

```
N[state][action] += 1
Q[state][action] += (reward − Q[state][action]) / N[state][action]
```

This is mathematically equivalent to a simple sample average without storing the full reward history. Over time it converges to the true mean incremental revenue for each `(context, action)` pair.

The reward signal is **incremental revenue** (`realized − baseline`), not raw revenue. Using the difference removes seasonal bias so the bandit learns the action's causal lift, not the ambient revenue level.

### Hybrid decision flow in `revenue_agent.py`

The bandit does not replace the ML policy — it periodically overrides it to test alternative actions and accumulate learning signal:

```
1. ML/rules policy selects action                           (always runs)
2. If decision is capacity_aware.v1 → use it, skip bandit  (safety gate)
3. Draw random() < BANDIT_EXPLORE_RATE (0.20):
     True  → bandit.select_action() + apply_constraints()  (exploration)
     False → use ML/rules decision as-is                   (exploitation)
4. Execute chosen action
5. Compute reward = realized_revenue − baseline_revenue
6. bandit.update(state, action, reward)
7. save_bandit() → models/bandit.pkl
```

At 20 % exploration the system tests new strategies once in every five runs while the ML policy dominates the remaining 80 %. The `BANDIT_EXPLORE_RATE` constant can be decayed toward 0.05 as the bandit matures.

### Persistence

The bandit (Q-tables + visit counts) is serialized to `models/bandit.pkl` via `joblib` after every run. `load_bandit()` restores it at the start of the next run so every invocation benefits from all prior learning. If the file is corrupt or missing, a fresh `ContextualBandit` is initialized automatically.

### Observability

`bandit.stats()` returns a compact summary logged after every update:

```json
{
  "states_explored": 12,
  "total_updates": 340,
  "best_actions_per_state": {
    "(5, -3)": "discount_10",
    "(8, 1)": "none",
    ...
  }
}
```

`bandit.top_actions(n)` returns the most-visited `(state, action)` pairs with their Q values and visit counts — useful for human review of what the bandit has learned.

---

## Production Flow

The following steps describe the end-to-end journey of a single agent invocation from trigger to analytics, as it runs in production.

### Step 1 — Trigger

The agent is invoked by the application server on a scheduled interval or in response to a booking event. A minimal invocation passes the customer and job identifiers so every feedback record can be traced back to a specific transaction:

```bash
python agent/revenue_agent.py \
  --customer-id cust_123 \
  --job-id job_456
```

In production the scheduler supplies `--actual-revenue`, `--actual-demand`, and `--actual-utilization` from the previous run's realized outcomes, closing the feedback loop with ground-truth numbers rather than estimates.

**Environment required before this step:**
- `MONGO_URI` or `MONGODB_URI` set to the live database connection string
- `models/` directory populated with trained `.pkl` files
- `models/bandit.pkl` present (auto-created on first run if absent)

---

### Step 2 — Load persisted bandit state

Before any other work, `RevenueAgent.run()` calls `load_bandit()`. This deserializes the Q-tables and visit counts from `models/bandit.pkl` so the bandit starts the run with every reward signal it has accumulated across all previous invocations.

```
models/bandit.pkl  →  load_bandit()  →  ContextualBandit instance
                                         (Q-tables, N-tables, epsilon)
```

If the file is missing or corrupt, a fresh `ContextualBandit` is returned and the run continues normally. The bandit will begin learning from this run's reward.

---

### Step 3 — Assemble business state

`build_state()` constructs the `RevenueState` snapshot that every downstream stage reads from. It runs three sub-steps in sequence, each with its own fallback:

**3a. Read CRM signals**

The CRM client (or mock) provides the live operational picture:

| Signal | Example value | Meaning |
|--------|--------------|---------|
| `utilization` | `0.72` | Fraction of technician capacity currently booked |
| `pending_quotes` | `14` | Open quotes awaiting customer decision |
| `total_technicians` | `10` | Technicians on shift |
| `avg_jobs_per_tech` | `7.0` | Average jobs per technician per day |

**3b. Read model signals**

The model client (or mock) provides customer intelligence:

| Signal | Example value | Meaning |
|--------|--------------|---------|
| `churn_risk` | `0.42` | Probability customer does not rebook |
| `ltv` | `2450.00` | Predicted lifetime value of the customer |
| `conversion_rate` | `0.31` | Historical quote-to-booking conversion rate |

**3c. Run the three ML forecasts**

1. **Demand forecast** — `demand_forecast_model.pkl` predicts `expected_demand` from the current hour, day of week, month, and outdoor temperature. `demand_gap = expected_demand − capacity`. A negative gap means bookings are tracking below the team's capacity.

2. **Utilization forecast** — `utilization_model.pkl` refines the raw CRM utilization using the demand forecast, staffing levels, average job duration, and time/weather features. This predicted utilization is what all downstream decisions act on.

3. **Pricing optimization** — `pricing_model.pkl` scores six candidate prices and returns the `optimal_price` that maximises predicted revenue. Pricing guardrails enforce a maximum 20 % discount, a maximum 35 % spike over current price, and a minimum margin floor before the price is accepted.

At the end of this step `RevenueState` is fully populated with sourced values, fallback flags, and error strings for any model that failed.

---

### Step 4 — Evaluate the decision

`decide(state)` runs the three-layer policy stack and returns a `Decision` object containing the chosen action, reason, priority, expected revenue, and full policy metadata.

**4a. Capacity-aware check (highest priority)**

`decide_capacity_aware()` inspects `demand_gap` and `utilization` against fixed thresholds. If a capacity trigger fires, the decision is returned immediately and steps 4b and 4c are skipped entirely. This decision is tagged `policy: capacity_aware.v1` and **cannot be overridden by the bandit**.

```
demand_gap < -20 and utilization < 0.60  →  discount_with_price_override (high)
demand_gap < -20 and utilization < 0.85  →  discount_10 (medium)
utilization > 0.85                        →  increase_price (medium/high)
optimal_price differs from current ≥ 5 % →  apply_dynamic_price (low)
```

**4b. ML scoring (primary learnable policy)**

`evaluate_actions()` runs each of the four action-effect XGBoost models against the current state and returns a predicted gross revenue per action. `choose_best()` selects the action with the highest `predicted_revenue − action_cost`. The decision is tagged `policy: action_effect_models.v1`.

**4c. Rule fallback**

If the ML models fail for any reason (missing file, corrupt pkl, non-finite prediction), `decide_rule_based()` activates and evaluates simple business thresholds in order: churn risk → pending quotes → low utilization → low conversion. The decision is tagged `policy: rules.v1`.

**4d. Safety constraints**

`apply_constraints()` runs on the output of whichever policy fired. It can upgrade, downgrade, or replace the action based on real-time state values regardless of which policy produced the original choice.

---

### Step 5 — Bandit exploration gate

After the policy decision is in hand, `_apply_bandit_override()` decides whether to replace it with a bandit-selected action:

```
Is the policy capacity_aware.v1?
  YES → pass the decision through unchanged, bandit_selected = False
  NO  → draw random float r

r >= 0.20 (80 % of runs)?
  YES → use the ML/rule decision as-is, bandit_selected = False

r < 0.20 (20 % of runs)?
  YES → bandit.select_action(state)   ← epsilon-greedy Q lookup
        apply_constraints(raw_action)  ← safety still enforced
        build a new Decision from the bandit's choice
        bandit_selected = True
```

When the bandit drives the decision, `bandit_raw_action` and `bandit_constrained_action` are recorded in the decision metadata so the JSONL log captures exactly what the bandit proposed and what constraints did to it.

---

### Step 6 — Execute the action

`execute_action(decision, state)` dispatches to the handler registered for the chosen action type. In production each handler calls the real integration:

| Integration | What gets called |
|-------------|-----------------|
| Discount offer | Email / SMS / WhatsApp campaign API |
| Call task | CRM task creation (ServiceTitan, HubSpot, etc.) |
| Price change | Catalog or pricing service API write |
| Campaign | Marketing automation trigger |
| No action | Logged and skipped |

The handler returns an `ExecutionResult` with a status, message, external system ID, and UTC timestamp.

---

### Step 7 — Compute outcome signals

Before logging, the agent derives the financial outcome of the run:

```
baseline_revenue  =  expected_demand × current_price
                      (what revenue would have been with no action)

applied_price     =  price implied by the chosen action
                      (optimal_price for pricing actions, discounted price for offers)

realized_revenue  =  actual_revenue arg  (if supplied by caller)
                     or  actual_demand × applied_price × action_lift_factor
                         (estimated when ground-truth is not yet available)

reward            =  realized_revenue − baseline_revenue
                      (incremental lift the action produced)
```

The action lift factors used in the estimate are conservative constants derived from historical lift data (e.g. `discount_10` → 1.08×, `discount_20` → 1.12×). When the caller supplies `--actual-revenue` from the previous run's true outcome, the estimate is bypassed and ground-truth is used directly.

---

### Step 8 — Update and save the bandit

```
bandit.update(state, action, reward)
```

The Welford incremental mean is applied to `Q[state_key][action]` and `N[state_key][action]` is incremented. Only learnable actions (`discount_10`, `discount_20`, `call`, `none`) are updated. Capacity-aware actions are silently skipped so safety logic is not distorted by exploration data.

```
save_bandit()  →  models/bandit.pkl
```

The updated Q and N tables are written to disk immediately so the next run starts with this run's reward baked in, even if the process restarts between invocations.

---

### Step 9 — Persist feedback

`log_feedback()` writes a complete `FeedbackRecord` to two destinations simultaneously:

**Local JSONL log** (`agent/logs/revenue_agent_feedback.jsonl`):
Appended synchronously. Every run produces exactly one line. This file is the ground-truth audit trail and is used as the fallback data source for analytics when MongoDB is unavailable.

**MongoDB** (`hvac_software.revenue_logs`):
Written in a background daemon thread so the agent does not block on network I/O. The write is best-effort — a connection failure is logged as a warning and the run completes normally.

The record written to both destinations contains:

```json
{
  "timestamp": "2026-04-25T08:14:22+00:00",
  "action": "discount_10",
  "bandit_selected": false,
  "applied_price": 135.00,
  "baseline_revenue": 5250.00,
  "actual_revenue": 5670.00,
  "reward": 420.00,
  "expected_demand": 35.0,
  "actual_demand": 38.0,
  "utilization_predicted": 0.72,
  "utilization_actual": 0.76,
  "optimal_price": 150.00,
  "demand_gap": -32.0,
  "capacity_status": "MEDIUM",
  "customer_id": "cust_123",
  "job_id": "job_456",
  "state": { ... },
  "decision": { ... },
  "execution": { ... }
}
```

---

### Step 10 — Analytics dashboard picks up the record

The analytics API reads from `hvac_software.revenue_logs` (or the JSONL fallback) to power the dashboard:

| Endpoint | What it computes |
|----------|-----------------|
| `GET /analytics/summary` | Revenue accuracy, demand accuracy, utilization accuracy, action success rate, pricing impact |
| `GET /analytics/trends` | Per-day time series of the same metrics |
| `GET /analytics/logs` | Raw paginated log records |

The `reward` field on each record is the primary signal for evaluating whether an action improved revenue. The `bandit_selected` flag lets analysts separate bandit-driven runs from ML-policy-driven runs to assess exploration quality.

---

### Full production flow at a glance

```
Scheduler / booking event
        │
        ▼
Step 1  Trigger agent with customer_id, job_id, and prior run's actual outcomes
        │
        ▼
Step 2  load_bandit()  ←  models/bandit.pkl  (or fresh if missing)
        │
        ▼
Step 3  build_state()
          3a  CRM client  →  utilization, pending_quotes, team size
          3b  Model client →  churn_risk, ltv, conversion_rate
          3c  demand_forecast_model.pkl  →  expected_demand, demand_gap
              utilization_model.pkl     →  utilization (refined)
              pricing_model.pkl         →  optimal_price, expected_revenue
        │
        ▼
Step 4  decide(state)
          4a  capacity_aware.v1    →  fires on demand/utilization thresholds
          4b  action_effect_models.v1  →  ML argmax over action costs
          4c  rules.v1 (fallback)  →  threshold rules
          4d  apply_constraints()  →  safety overrides
        │
        ▼
Step 5  _apply_bandit_override()
          capacity_aware? → skip bandit
          random ≥ 0.20?  → keep ML decision
          random < 0.20?  → bandit.select_action() + apply_constraints()
        │
        ▼
Step 6  execute_action()  →  CRM / pricing API / email / campaign
        │
        ▼
Step 7  Compute baseline_revenue, applied_price, realized_revenue, reward
        │
        ▼
Step 8  bandit.update(state, action, reward)
        save_bandit()  →  models/bandit.pkl
        │
        ▼
Step 9  log_feedback()
          →  agent/logs/revenue_agent_feedback.jsonl  (sync)
          →  MongoDB revenue_logs collection           (async)
        │
        ▼
Step 10 Analytics dashboard reads revenue_logs
          /analytics/summary  /analytics/trends  /analytics/logs
```

---

## File structure

```
agent/
├── revenue_agent.py     # Orchestrator — run this
├── state_builder.py     # CRM + model signals → RevenueState
├── decision_engine.py   # Capacity rules + ML scoring + rule fallback
├── bandit.py            # Epsilon-greedy contextual bandit
├── executor.py          # Action execution (currently mock)
├── feedback_logger.py   # JSONL + MongoDB feedback persistence
├── logs/
│   └── revenue_agent_feedback.jsonl
└── requirements.txt
```

```
models/
├── action_effect_models.pkl   # Per-action XGBoost revenue regressors
├── demand_forecast_model.pkl  # Booking demand forecaster
├── utilization_model.pkl      # Technician utilization forecaster
├── pricing_model.pkl          # Dynamic pricing optimizer
└── bandit.pkl                 # Persisted bandit Q-tables (auto-created)
```

---

## Running the agent

```bash
# Single run with mock state
python agent/revenue_agent.py

# Override specific state fields for testing
python agent/revenue_agent.py --state-file overrides.json

# Supply realized outcomes so the bandit reward is accurate
python agent/revenue_agent.py \
  --actual-revenue 1850.00 \
  --actual-demand 42 \
  --actual-utilization 0.73 \
  --customer-id cust_123 \
  --job-id job_456

# Write feedback to a custom log
python agent/revenue_agent.py --feedback-log /data/logs/agent.jsonl
```

## Dependencies

```
joblib>=1.3      # Bandit serialization
pandas>=2.0      # Feature frames for sklearn/XGBoost models
xgboost>=2.0     # Action-effect and forecasting models
pymongo>=4.6     # Optional feedback persistence to MongoDB
```

MongoDB is opt-in. Set `MONGO_URI` (or `MONGODB_URI`) in the environment to enable it. If unset, feedback is written only to the local JSONL log.

---

## Design principles

- **Isolated stages** — state, decision, execution, and feedback are separate modules. Any stage can be replaced (e.g. swap mock executor for a real CRM client) without touching the others.
- **Safety before learning** — capacity-aware decisions and constraint enforcement always take precedence. The bandit only operates within the boundaries of already-safe actions.
- **Incremental reward** — reward measures lift over doing nothing, not raw revenue, so the bandit is not confused by seasonal or volume variation.
- **Graceful degradation** — every model, client, and external write has a fallback so the agent always completes a run and logs a record even when forecasting or integrations fail.
