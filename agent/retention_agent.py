from __future__ import annotations

import json
import logging
import os
import random
from argparse import ArgumentParser
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from threading import Thread
from typing import Any, Mapping

try:
    from .retention_bandit import RetentionBandit, load_bandit, save_bandit
    from .bandit_log import log_bandit_decision
except ImportError:  # Allows `python retention_agent.py` from inside agent/
    from retention_bandit import RetentionBandit, load_bandit, save_bandit
    from bandit_log import log_bandit_decision


DEFAULT_LOG_PATH = Path(__file__).resolve().parent / "logs" / "retention_agent_feedback.jsonl"
DEFAULT_MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DEFAULT_MONGO_DB = os.getenv("MONGO_DB_NAME", "hvac_software")
RETENTION_LOGS_COLLECTION = "retention_logs"

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RetentionState:
    """Snapshot of a customer's CRM context used for churn-prevention decisions."""

    customer_id: str
    churn_risk: float              # 0.0–1.0 from churn prediction model
    ltv: float                     # lifetime value in dollars
    last_service_days: int         # days since last service appointment
    num_previous_retention_attempts: int  # how many times we've tried to retain them
    customer_segment: str          # "premium" | "standard" | "budget"
    utilization: float             # 0.0–1.0 current service utilization
    expected_demand: float         # forecast demand units for this customer

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class RetentionResult:
    """Outcome record persisted to JSONL and MongoDB after each agent run."""

    customer_id: str
    state: dict[str, Any]
    action: str
    bandit_selected: bool
    retained: bool
    actual_revenue: float
    baseline_revenue: float
    reward: float
    timestamp: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ------------------------------------------------------------------
# State building
# ------------------------------------------------------------------

def build_retention_state(
    customer_id: str,
    overrides: dict[str, Any] | None = None,
) -> RetentionState:
    """Construct a RetentionState from CRM signals.

    In production: query Prisma/PostgreSQL for real customer data.
    Mocked defaults produce realistic HVAC churn-risk distributions
    so the agent runs end-to-end without a database connection.
    """
    defaults: dict[str, Any] = {
        "churn_risk": round(random.uniform(0.3, 0.95), 2),
        "ltv": round(random.uniform(500.0, 10000.0), 2),
        "last_service_days": random.randint(30, 365),
        "num_previous_retention_attempts": random.randint(0, 4),
        "customer_segment": random.choice(["premium", "standard", "budget"]),
        "utilization": round(random.uniform(0.2, 0.9), 2),
        "expected_demand": round(random.uniform(10.0, 100.0), 2),
    }
    if overrides:
        filtered = {k: v for k, v in overrides.items() if k != "customer_id"}
        defaults.update(filtered)

    return RetentionState(customer_id=customer_id, **defaults)


# ------------------------------------------------------------------
# Execution
# ------------------------------------------------------------------

def execute_retention_action(action: str, customer_id: str, state: Mapping[str, Any]) -> str:
    """Dispatch the retention intervention to the appropriate channel.

    In production: replace each branch with a real workflow trigger —
      discount_10/20         → CRM discount coupon + automated email
      call_customer          → CRM task creation (Twilio, RingCentral)
      send_maintenance_offer → Email/SMS campaign (SendGrid, Mailchimp)
      no_action              → no-op (log only)
    Returns a mock execution ID for audit logging.
    """
    messages = {
        "discount_10": f"Issued 10% discount offer to customer {customer_id}",
        "discount_20": f"Issued 20% discount offer to customer {customer_id}",
        "call_customer": f"Scheduled retention call for customer {customer_id}",
        "send_maintenance_offer": f"Sent maintenance offer to customer {customer_id}",
        "no_action": f"No retention action taken for customer {customer_id}",
    }
    message = messages.get(action, f"Unknown action {action} for customer {customer_id}")
    print(f"EXECUTE: [mock] {message}")
    logger.info(message)
    return f"{action}-mock-{customer_id}"


# ------------------------------------------------------------------
# Outcome simulation
# ------------------------------------------------------------------

# Retention probability matrix: action × segment.
# Values encode the business insight the bandit should independently rediscover:
#   premium → calls work best (relationship-oriented, high-touch preferred)
#   standard → moderate response across all strategies
#   budget → discounts work best (price-sensitive)
#   maintenance offers → strong for premium, weaker for budget
# The bandit will learn these patterns purely from reward signals.
_RETENTION_RATES: dict[str, dict[str, float]] = {
    "discount_10":            {"premium": 0.50, "standard": 0.55, "budget": 0.60},
    "discount_20":            {"premium": 0.60, "standard": 0.65, "budget": 0.70},
    "call_customer":          {"premium": 0.75, "standard": 0.55, "budget": 0.35},
    "send_maintenance_offer": {"premium": 0.65, "standard": 0.50, "budget": 0.30},
    "no_action":              {"premium": 0.25, "standard": 0.18, "budget": 0.12},
}

# Revenue multiplier applied to monthly LTV when a discount is issued.
# Captures the cost of the discount against the retained revenue.
_DISCOUNT_FACTORS: dict[str, float] = {
    "discount_10": 0.90,
    "discount_20": 0.80,
    "call_customer": 1.00,
    "send_maintenance_offer": 1.05,  # maintenance upsell creates slight revenue lift
    "no_action": 1.00,
}


def simulate_retention(action: str, state: Mapping[str, Any]) -> bool:
    """Simulate whether the customer is retained after the intervention.

    In production: poll CRM 30 days after action to check contract renewal
    or next service booking.  Here we simulate immediately to close the
    learning loop end-to-end.
    """
    segment = str(state.get("customer_segment", "standard")).lower()
    churn_risk = float(state.get("churn_risk", 0.5))

    base_rate = _RETENTION_RATES.get(action, {}).get(segment, 0.30)

    # High churn risk customers are harder to retain even with the best action.
    # Scale the base rate down proportionally to churn severity.
    adjusted_rate = base_rate * (1.0 - churn_risk * 0.4)

    return random.random() < adjusted_rate


# ------------------------------------------------------------------
# Revenue and reward computation
# ------------------------------------------------------------------

def compute_monthly_ltv(state: Mapping[str, Any]) -> float:
    """Monthly revenue value for this customer assuming no churn."""
    ltv = float(state.get("ltv", 0.0))
    # Amortise over a 24-month customer lifetime (standard HVAC contract window).
    return round(ltv / 24, 2)


def compute_baseline_revenue(state: Mapping[str, Any]) -> float:
    """Expected monthly revenue if no retention action is taken.

    Baseline = monthly LTV × probability of staying without intervention.
    Using churn_risk to discount the expected value captures the at-risk
    portion of revenue the agent is trying to protect.
    """
    monthly_ltv = compute_monthly_ltv(state)
    churn_risk = float(state.get("churn_risk", 0.5))
    return round(monthly_ltv * (1.0 - churn_risk), 2)


def compute_actual_revenue(
    action: str,
    retained: bool,
    state: Mapping[str, Any],
) -> float:
    """Revenue realised after the intervention.

    If retained: apply the discount factor to monthly LTV so over-discounting
    is penalised — discount_20 on a high-LTV customer earns less than a call
    that retains them at full rate.
    If not retained: revenue = 0 regardless of action taken.
    """
    if not retained:
        return 0.0

    monthly_ltv = compute_monthly_ltv(state)
    discount_factor = _DISCOUNT_FACTORS.get(action, 1.0)
    return round(monthly_ltv * discount_factor, 2)


def compute_reward(actual_revenue: float, baseline_revenue: float) -> float:
    """Incremental revenue reward: how much better (or worse) than doing nothing.

    reward > 0  → intervention recovered revenue above the no-action baseline
    reward < 0  → intervention cost more than it recovered (e.g. big discount, didn't retain)
    reward = 0  → no meaningful difference from doing nothing

    This formulation prevents the bandit from over-discounting high-LTV
    customers: a 20% discount that retains but at a large cost gets a lower
    reward than a free phone call that retains at full LTV.
    """
    return round(actual_revenue - baseline_revenue, 2)


# ------------------------------------------------------------------
# Feedback logging
# ------------------------------------------------------------------

def log_retention_feedback(
    result: RetentionResult,
    log_path: Path = DEFAULT_LOG_PATH,
    mongo_uri: str | None = DEFAULT_MONGO_URI,
    mongo_db: str = DEFAULT_MONGO_DB,
) -> None:
    """Persist the retention outcome to JSONL and MongoDB.

    JSONL is the source of truth for offline model retraining.
    MongoDB powers the real-time analytics dashboard.
    MongoDB writes are non-blocking to avoid slowing the agent loop.
    """
    record = result.to_dict()
    log_path.parent.mkdir(parents=True, exist_ok=True)

    with log_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, sort_keys=True) + "\n")

    print(f"LOG: feedback recorded at {log_path}")

    if mongo_uri:
        _insert_mongo_nonblocking(record, mongo_uri=mongo_uri, mongo_db=mongo_db)


def _insert_mongo_nonblocking(record: dict[str, Any], mongo_uri: str, mongo_db: str) -> None:
    worker = Thread(
        target=_insert_mongo,
        args=(record, mongo_uri, mongo_db),
        daemon=True,
    )
    worker.start()


def _insert_mongo(record: dict[str, Any], mongo_uri: str, mongo_db: str) -> None:
    try:
        from pymongo import MongoClient

        document = dict(record)
        document["timestamp"] = datetime.fromisoformat(
            str(document["timestamp"]).replace("Z", "+00:00")
        )

        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=500)
        db = client[mongo_db]
        db[RETENTION_LOGS_COLLECTION].insert_one(document)
        client.close()
    except Exception as exc:
        logger.warning("Retention MongoDB feedback write skipped: %s", exc)


# ------------------------------------------------------------------
# Agent
# ------------------------------------------------------------------

class RetentionAgent:
    """Self-learning churn-prevention agent powered by contextual bandit.

    Every run executes the full learning loop:
      build_state → select_action → execute → simulate_retention
        → compute_reward → update_bandit → log_feedback

    The persisted Q-table means each run starts smarter than the last.
    The bandit IS the policy here: it learns which retention strategies
    maximise incremental revenue for each customer context bucket.

    Safety constraints are enforced before any action reaches a customer:
      - Customers with > 5 prior attempts are never contacted again (no_action forced).
      - This prevents brand damage from over-aggressive retention campaigns.
    """

    def __init__(self, feedback_log_path: str | Path = DEFAULT_LOG_PATH) -> None:
        self.feedback_log_path = Path(feedback_log_path)

    def run(
        self,
        customer_id: str,
        state_overrides: dict[str, Any] | None = None,
    ) -> RetentionResult:
        # ── Step 1: Build state from CRM signals ──────────────────────
        state_obj = build_retention_state(customer_id, overrides=state_overrides)
        state = state_obj.to_dict()

        print("\nSTATE:")
        print(json.dumps(state, indent=2, sort_keys=True))

        # ── Step 2: Load latest persisted bandit ───────────────────────
        # Reloading from disk each run ensures concurrent batch runs share
        # learning without requiring a shared in-memory bandit instance.
        bandit = load_bandit()

        # ── Step 3: Select retention action ────────────────────────────
        # Bandit applies: safety gate → ε-greedy exploration/exploitation.
        # Safety gate forces no_action when attempts > MAX_ATTEMPTS_BEFORE_STOP.
        action = bandit.select_action(state)
        print(f"\nACTION SELECTED: {action}")

        # ── Step 4: Execute retention intervention ─────────────────────
        execute_retention_action(action, customer_id, state)

        # ── Step 5: Observe whether customer was retained ─────────────
        # In production: check CRM 30 days later for contract renewal/booking.
        # Simulated immediately here to close the learning loop end-to-end.
        retained = simulate_retention(action, state)
        print(f"\nOUTCOME: retained={retained}")

        # ── Step 6: Compute revenues and reward ────────────────────────
        baseline_revenue = compute_baseline_revenue(state)
        actual_revenue = compute_actual_revenue(action, retained, state)
        reward = compute_reward(actual_revenue, baseline_revenue)
        print(
            f"REVENUE: actual={actual_revenue:.2f}  baseline={baseline_revenue:.2f}"
            f"  reward={reward:.2f}"
        )

        # ── Step 7: Update bandit Q-table and persist ──────────────────
        bandit.update(state, action, reward)
        save_bandit(bandit)
        print(
            f"BANDIT: updated  action={action}  reward={reward:.2f}"
            f"  stats={bandit.stats()}"
        )

        # Write to unified bandit_logs collection for the observability dashboard.
        log_bandit_decision(
            agent="retention",
            bandit=bandit,
            state=state,
            action=action,
            reward=reward,
            actual_revenue=actual_revenue,
            baseline_revenue=baseline_revenue,
            customer_id=customer_id,
        )

        # ── Step 8: Log outcome for training and analytics ─────────────
        result = RetentionResult(
            customer_id=customer_id,
            state=state,
            action=action,
            bandit_selected=True,
            retained=retained,
            actual_revenue=actual_revenue,
            baseline_revenue=baseline_revenue,
            reward=reward,
            timestamp=datetime.now(UTC).isoformat(),
        )
        log_retention_feedback(result, log_path=self.feedback_log_path)

        return result

    def run_batch(
        self,
        customer_ids: list[str],
        state_overrides_map: dict[str, dict[str, Any]] | None = None,
    ) -> list[RetentionResult]:
        """Process multiple at-risk customers sequentially, persisting after each.

        Sequential processing ensures each customer benefits from all learning
        accumulated by prior customers in the same batch.
        """
        results: list[RetentionResult] = []
        for customer_id in customer_ids:
            overrides = (state_overrides_map or {}).get(customer_id)
            result = self.run(customer_id, state_overrides=overrides)
            results.append(result)
        return results


# ------------------------------------------------------------------
# CLI helpers
# ------------------------------------------------------------------

def load_state_overrides(path: str | Path | None) -> dict[str, Any] | None:
    if path is None:
        return None

    with Path(path).open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    if not isinstance(payload, dict):
        raise ValueError("State override file must contain a JSON object")

    return payload


def parse_args() -> Any:
    parser = ArgumentParser(description="Run the self-learning retention agent.")
    parser.add_argument(
        "--customer-id",
        default="cust-001",
        help="Customer ID to process (single-customer mode).",
    )
    parser.add_argument(
        "--state-file",
        help="Optional JSON file with state overrides for local testing.",
    )
    parser.add_argument(
        "--feedback-log",
        default=str(DEFAULT_LOG_PATH),
        help="Path to the JSONL feedback log.",
    )
    parser.add_argument(
        "--batch",
        nargs="+",
        metavar="CUSTOMER_ID",
        help="Process multiple customer IDs in one run.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    agent = RetentionAgent(feedback_log_path=args.feedback_log)

    if args.batch:
        results = agent.run_batch(args.batch)
        print(f"\n{'='*60}")
        print(f"BATCH COMPLETE: {len(results)} customers processed")
        for r in results:
            status = "retained" if r.retained else "churned"
            print(
                f"  {r.customer_id}: action={r.action:<24}"
                f"  outcome={status:<10}  reward={r.reward:.2f}"
            )
    else:
        state_overrides = load_state_overrides(args.state_file)
        result = agent.run(customer_id=args.customer_id, state_overrides=state_overrides)
        print(f"\n{'='*60}")
        print(
            f"RUN COMPLETE: {result.customer_id}"
            f"  action={result.action}"
            f"  retained={result.retained}"
            f"  reward={result.reward:.2f}"
        )


if __name__ == "__main__":
    main()


# ------------------------------------------------------------------
# Example run output (python agent/retention_agent.py --customer-id cust-099)
# ------------------------------------------------------------------
#
# STATE:
# {
#   "churn_risk": 0.82,
#   "customer_id": "cust-099",
#   "customer_segment": "premium",
#   "expected_demand": 55.3,
#   "last_service_days": 180,
#   "ltv": 6500.0,
#   "num_previous_retention_attempts": 1,
#   "utilization": 0.61
# }
#
# ACTION SELECTED: call_customer
# EXECUTE: [mock] Scheduled retention call for customer cust-099
#
# OUTCOME: retained=True
# REVENUE: actual=270.83  baseline=48.75  reward=222.08
# BANDIT: updated  action=call_customer  reward=222.08
#   stats={'states_explored': 1, 'total_updates': 1,
#          'best_actions_per_state': {"(8, 13, 1, 'premium')": 'call_customer'}}
# LOG: feedback recorded at agent/logs/retention_agent_feedback.jsonl
#
# ============================================================
# RUN COMPLETE: cust-099  action=call_customer  retained=True  reward=222.08
#
# After many runs the bandit converges to learned optima, for example:
#   (*, high_ltv, *, 'premium') → best_action = 'call_customer'      (Q ≈ 180)
#   (*, low_ltv,  *, 'budget')  → best_action = 'discount_20'        (Q ≈ 25)
#   (*, *,  5,   *)             → best_action = 'no_action'          (safety gate)
#   (*, *, *, 'premium')        → best_action = 'send_maintenance_offer' (after calls)
# ------------------------------------------------------------------
