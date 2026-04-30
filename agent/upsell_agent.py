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
    from .upsell_bandit import UpsellBandit, load_bandit, save_bandit
    from .bandit_log import log_bandit_decision
except ImportError:  # Allows `python upsell_agent.py` from inside agent/
    from upsell_bandit import UpsellBandit, load_bandit, save_bandit
    from bandit_log import log_bandit_decision


DEFAULT_LOG_PATH = Path(__file__).resolve().parent / "logs" / "upsell_agent_feedback.jsonl"
DEFAULT_MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DEFAULT_MONGO_DB = os.getenv("MONGO_DB_NAME", "hvac_software")
UPSELL_LOGS_COLLECTION = "upsell_logs"

# Fraction of decisions driven by bandit exploration vs. rule-based prediction.
# At 0.2 the system tries new upsell strategies 1-in-5 runs while the rule
# policy dominates the remaining 80 %.  Reduce this as the bandit matures.
BANDIT_EXPLORE_RATE: float = 0.2

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class UpsellState:
    """Snapshot of a customer + job context used for upsell decisions."""

    customer_id: str
    service_type: str          # "repair" | "annual_service" | "installation" | "inspection"
    job_value: float           # current job revenue before upsell ($)
    customer_segment: str      # "premium" | "standard" | "budget"
    ltv: float                 # customer lifetime value in dollars
    churn_risk: float          # 0.0–1.0 from churn prediction model
    days_since_last_service: int
    utilization: float         # 0.0–1.0 technician utilization
    expected_demand: float     # forecast demand units
    num_previous_upsell_attempts: int  # recent upsell offers already presented

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class UpsellResult:
    """Outcome record persisted to JSONL and MongoDB after each agent run."""

    customer_id: str
    state: dict[str, Any]
    upsell: str
    bandit_selected: bool
    accepted: bool
    upsell_revenue: float
    offer_cost: float
    reward: float
    timestamp: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ------------------------------------------------------------------
# State building
# ------------------------------------------------------------------

def build_upsell_state(
    customer_id: str,
    overrides: dict[str, Any] | None = None,
) -> UpsellState:
    """Construct an UpsellState from CRM signals.

    In production: query Prisma/PostgreSQL for real customer + job data.
    Mocked defaults produce realistic HVAC upsell distributions
    so the agent runs end-to-end without a database connection.
    """
    defaults: dict[str, Any] = {
        "service_type": random.choice(["repair", "annual_service", "installation", "inspection"]),
        "job_value": round(random.uniform(80.0, 800.0), 2),
        "customer_segment": random.choice(["premium", "standard", "budget"]),
        "ltv": round(random.uniform(500.0, 10000.0), 2),
        "churn_risk": round(random.uniform(0.1, 0.8), 2),
        "days_since_last_service": random.randint(30, 365),
        "utilization": round(random.uniform(0.3, 0.9), 2),
        "expected_demand": round(random.uniform(10.0, 100.0), 2),
        "num_previous_upsell_attempts": random.randint(0, 3),
    }
    if overrides:
        filtered = {k: v for k, v in overrides.items() if k != "customer_id"}
        defaults.update(filtered)

    return UpsellState(customer_id=customer_id, **defaults)


# ------------------------------------------------------------------
# Rule-based upsell predictor (stands in for the ML model)
# ------------------------------------------------------------------

# Natural upsell affinities by service type.
# The bandit will independently learn and refine these through reward signals.
_SERVICE_UPSELL_AFFINITY: dict[str, str] = {
    "repair": "replacement_offer",        # repair visit is the natural replacement trigger
    "annual_service": "maintenance_plan", # service visit → subscription upsell
    "installation": "extended_warranty",  # new equipment → warranty is most relevant
    "inspection": "maintenance_plan",     # inspection reveals future maintenance need
}

# Segment overrides: premium customers are always shown upgrade-tier offers first.
_SEGMENT_UPSELL_OVERRIDE: dict[str, str] = {
    "premium": "premium_service_upgrade",
}


def predict_upsell(state: Mapping[str, Any]) -> str:
    """Rule-based upsell predictor — the policy the bandit can override.

    Encodes the current business understanding of what upsell fits each
    service + segment combination.  The bandit explores alternatives and
    feeds back rewards so this rule set can be replaced with an ML model
    when enough training data accumulates.

    Returns no_upsell when safety constraints trip.
    """
    job_value = float(state.get("job_value", 0.0))
    if job_value < 100.0:
        return "no_upsell"

    attempts = int(state.get("num_previous_upsell_attempts", 0))
    if attempts > 3:
        return "no_upsell"

    segment = str(state.get("customer_segment", "standard")).lower()
    service = str(state.get("service_type", "annual_service")).lower()

    if segment in _SEGMENT_UPSELL_OVERRIDE:
        return _SEGMENT_UPSELL_OVERRIDE[segment]

    return _SERVICE_UPSELL_AFFINITY.get(service, "maintenance_plan")


# ------------------------------------------------------------------
# Execution
# ------------------------------------------------------------------

def execute_upsell(upsell: str, customer_id: str, state: Mapping[str, Any]) -> str:
    """Present the upsell offer through the appropriate channel.

    In production: replace each branch with a real CRM action —
      maintenance_plan       → email campaign + technician verbal script
      extended_warranty      → PDF quote + email follow-up
      premium_service_upgrade → in-app upgrade prompt + technician pitch
      replacement_offer      → scheduled assessment call + written estimate
      no_upsell              → no-op (log only)
    Returns a mock execution ID for audit logging.
    """
    messages = {
        "maintenance_plan": f"Presented maintenance plan offer to customer {customer_id}",
        "extended_warranty": f"Presented extended warranty offer to customer {customer_id}",
        "premium_service_upgrade": f"Presented premium upgrade offer to customer {customer_id}",
        "replacement_offer": f"Presented equipment replacement offer to customer {customer_id}",
        "no_upsell": f"No upsell presented to customer {customer_id}",
    }
    message = messages.get(upsell, f"Unknown upsell {upsell} for customer {customer_id}")
    print(f"EXECUTE: [mock] {message}")
    logger.info(message)
    return f"{upsell}-mock-{customer_id}"


# ------------------------------------------------------------------
# Outcome simulation
# ------------------------------------------------------------------

# Acceptance probability matrix: upsell × segment.
# Encodes business insight the bandit should independently rediscover:
#   premium → responds to service upgrades and warranties (value over price)
#   standard → responds to maintenance plans (practical ROI)
#   budget → mildly accepts maintenance plans; resistant to premium offers
# Service type modifiers are applied separately below.
_ACCEPTANCE_RATES: dict[str, dict[str, float]] = {
    "maintenance_plan":       {"premium": 0.55, "standard": 0.48, "budget": 0.38},
    "extended_warranty":      {"premium": 0.65, "standard": 0.40, "budget": 0.22},
    "premium_service_upgrade":{"premium": 0.70, "standard": 0.30, "budget": 0.12},
    "replacement_offer":      {"premium": 0.50, "standard": 0.28, "budget": 0.18},
    "no_upsell":              {"premium": 1.00, "standard": 1.00, "budget": 1.00},
}

# Service-type relevance modifier: 1.0 = neutral, >1.0 = natural fit boosts acceptance.
# A maintenance plan pitched during an annual service is more relevant than
# the same pitch during an emergency repair call.
_SERVICE_RELEVANCE: dict[str, dict[str, float]] = {
    "repair":          {"maintenance_plan": 0.85, "extended_warranty": 0.90, "premium_service_upgrade": 0.80, "replacement_offer": 1.25, "no_upsell": 1.0},
    "annual_service":  {"maintenance_plan": 1.30, "extended_warranty": 1.10, "premium_service_upgrade": 1.00, "replacement_offer": 0.70, "no_upsell": 1.0},
    "installation":    {"maintenance_plan": 1.00, "extended_warranty": 1.35, "premium_service_upgrade": 1.10, "replacement_offer": 0.50, "no_upsell": 1.0},
    "inspection":      {"maintenance_plan": 1.20, "extended_warranty": 0.90, "premium_service_upgrade": 0.85, "replacement_offer": 0.80, "no_upsell": 1.0},
}


def simulate_upsell_acceptance(upsell: str, state: Mapping[str, Any]) -> bool:
    """Simulate whether the customer accepts the upsell offer.

    In production: check CRM 24–48 hours after the technician's visit for a
    signed order or accepted quote.  Simulated immediately here so the
    learning loop closes end-to-end without a real database.
    """
    if upsell == "no_upsell":
        return False

    segment = str(state.get("customer_segment", "standard")).lower()
    service = str(state.get("service_type", "annual_service")).lower()

    base_rate = _ACCEPTANCE_RATES.get(upsell, {}).get(segment, 0.25)
    relevance = _SERVICE_RELEVANCE.get(service, {}).get(upsell, 1.0)

    # High churn risk customers are distracted by the service issue and less
    # likely to engage with upsells — scale the rate down modestly.
    churn_risk = float(state.get("churn_risk", 0.5))
    adjusted_rate = base_rate * relevance * (1.0 - churn_risk * 0.3)

    return random.random() < adjusted_rate


# ------------------------------------------------------------------
# Revenue and cost computation
# ------------------------------------------------------------------

# Net upsell revenue per action (in addition to the base job value).
# Replacement offers generate 3× the job value because they represent
# a full equipment sale, not a service add-on.
_UPSELL_REVENUE_FACTORS: dict[str, tuple[float, float]] = {
    # (fixed_base, job_value_multiplier)
    "maintenance_plan":        (150.0, 0.30),
    "extended_warranty":       (200.0, 0.20),
    "premium_service_upgrade": (0.0,   0.50),
    "replacement_offer":       (0.0,   3.00),
    "no_upsell":               (0.0,   0.00),
}

# Cost of presenting each offer (materials, admin, technician script time).
# These costs penalise pushing expensive-to-present offers that rarely convert.
_OFFER_COSTS: dict[str, float] = {
    "maintenance_plan": 25.0,
    "extended_warranty": 35.0,
    "premium_service_upgrade": 15.0,
    "replacement_offer": 60.0,
    "no_upsell": 0.0,
}


def compute_upsell_revenue(upsell: str, accepted: bool, state: Mapping[str, Any]) -> float:
    """Gross revenue from an accepted upsell, zero if rejected."""
    if not accepted or upsell == "no_upsell":
        return 0.0

    job_value = float(state.get("job_value", 0.0))
    fixed_base, multiplier = _UPSELL_REVENUE_FACTORS.get(upsell, (0.0, 0.0))
    return round(fixed_base + job_value * multiplier, 2)


def compute_offer_cost(upsell: str) -> float:
    """Fixed cost of presenting the upsell, incurred regardless of acceptance."""
    return _OFFER_COSTS.get(upsell, 0.0)


def compute_reward(upsell_revenue: float, offer_cost: float) -> float:
    """Net reward: revenue generated minus the cost of presenting the offer.

    reward > 0  → upsell was worth presenting (net revenue positive)
    reward < 0  → offer cost exceeded conversion value (e.g. expensive pitch, no accept)
    reward = 0  → no_upsell or break-even

    This formulation prevents the bandit from over-presenting costly offers
    that only occasionally convert: a $60 replacement pitch that gets rejected
    costs more than a $25 maintenance plan that converts at a lower rate.
    """
    return round(upsell_revenue - offer_cost, 2)


# ------------------------------------------------------------------
# Feedback logging
# ------------------------------------------------------------------

def log_upsell_feedback(
    result: UpsellResult,
    log_path: Path = DEFAULT_LOG_PATH,
    mongo_uri: str | None = DEFAULT_MONGO_URI,
    mongo_db: str = DEFAULT_MONGO_DB,
) -> None:
    """Persist the upsell outcome to JSONL and MongoDB.

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
        db[UPSELL_LOGS_COLLECTION].insert_one(document)
        client.close()
    except Exception as exc:
        logger.warning("Upsell MongoDB feedback write skipped: %s", exc)


# ------------------------------------------------------------------
# Agent
# ------------------------------------------------------------------

class UpsellAgent:
    """Self-learning upsell agent powered by a contextual bandit.

    Hybrid policy: 80 % driven by a rule-based predictor (standing in for a
    trained ML model), 20 % driven by bandit exploration.  The bandit updates
    after every run so each subsequent run starts with richer Q-estimates.

    Safety constraints are enforced before any offer reaches a customer:
      - Jobs under $100 receive no_upsell (low-value context).
      - Customers with > 3 recent upsell attempts receive no_upsell (fatigue gate).

    In production the rule predictor is replaced by an ML model trained on
    the accumulated JSONL feedback log.
    """

    def __init__(self, feedback_log_path: str | Path = DEFAULT_LOG_PATH) -> None:
        self.feedback_log_path = Path(feedback_log_path)

    def run(
        self,
        customer_id: str,
        state_overrides: dict[str, Any] | None = None,
    ) -> UpsellResult:
        # ── Step 1: Build state from CRM signals ──────────────────────
        state_obj = build_upsell_state(customer_id, overrides=state_overrides)
        state = state_obj.to_dict()

        print("\nSTATE:")
        print(json.dumps(state, indent=2, sort_keys=True))

        # ── Step 2: Load latest persisted bandit ───────────────────────
        # Reloading from disk each run ensures concurrent batch runs share
        # learning without requiring a shared in-memory bandit instance.
        bandit = load_bandit()

        # ── Step 3: Hybrid decision — rule predictor vs. bandit ────────
        # Rule-based prediction encodes current business knowledge.
        # Bandit exploration overrides it 20 % of the time to discover
        # strategies the rules might miss for specific customer segments.
        predicted_upsell = predict_upsell(state)
        if random.random() < BANDIT_EXPLORE_RATE:
            upsell = bandit.select_action(state)
            bandit_selected = True
            print(f"\nACTION SELECTED: {upsell}  (bandit exploration; rule predicted: {predicted_upsell})")
        else:
            upsell = predicted_upsell
            bandit_selected = False
            print(f"\nACTION SELECTED: {upsell}  (rule predictor)")

        # ── Step 4: Present the upsell offer ──────────────────────────
        execute_upsell(upsell, customer_id, state)

        # ── Step 5: Observe customer response ──────────────────────────
        # In production: poll CRM 24–48 hours post-visit for signed order.
        # Simulated immediately here to close the learning loop end-to-end.
        accepted = simulate_upsell_acceptance(upsell, state)
        print(f"\nOUTCOME: accepted={accepted}")

        # ── Step 6: Compute revenue, cost, and reward ──────────────────
        upsell_revenue = compute_upsell_revenue(upsell, accepted, state)
        offer_cost = compute_offer_cost(upsell)
        reward = compute_reward(upsell_revenue, offer_cost)
        print(
            f"REVENUE: upsell_revenue={upsell_revenue:.2f}"
            f"  offer_cost={offer_cost:.2f}"
            f"  reward={reward:.2f}"
        )

        # ── Step 7: Update bandit Q-table and persist ──────────────────
        # Always update regardless of which policy drove the decision.
        # The bandit learns from rule-driven outcomes too — this is how it
        # accumulates the data density needed to eventually outperform the rules.
        bandit.update(state, upsell, reward)
        save_bandit(bandit)
        print(
            f"BANDIT: updated  action={upsell}  reward={reward:.2f}"
            f"  stats={bandit.stats()}"
        )

        # Write to unified bandit_logs collection for the observability dashboard.
        # upsell_revenue maps to actual_revenue; upsell agent has no baseline concept.
        log_bandit_decision(
            agent="upsell",
            bandit=bandit,
            state=state,
            action=upsell,
            reward=reward,
            actual_revenue=upsell_revenue,
            baseline_revenue=None,
            customer_id=customer_id,
        )

        # ── Step 8: Log outcome for training and analytics ─────────────
        result = UpsellResult(
            customer_id=customer_id,
            state=state,
            upsell=upsell,
            bandit_selected=bandit_selected,
            accepted=accepted,
            upsell_revenue=upsell_revenue,
            offer_cost=offer_cost,
            reward=reward,
            timestamp=datetime.now(UTC).isoformat(),
        )
        log_upsell_feedback(result, log_path=self.feedback_log_path)

        return result

    def run_batch(
        self,
        customer_ids: list[str],
        state_overrides_map: dict[str, dict[str, Any]] | None = None,
    ) -> list[UpsellResult]:
        """Process multiple customers sequentially, persisting the bandit after each.

        Sequential processing ensures each customer benefits from all learning
        accumulated by prior customers in the same batch.
        """
        results: list[UpsellResult] = []
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
    parser = ArgumentParser(description="Run the self-learning upsell agent.")
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
    agent = UpsellAgent(feedback_log_path=args.feedback_log)

    if args.batch:
        results = agent.run_batch(args.batch)
        print(f"\n{'='*60}")
        print(f"BATCH COMPLETE: {len(results)} customers processed")
        for r in results:
            status = "accepted" if r.accepted else "rejected"
            print(
                f"  {r.customer_id}: upsell={r.upsell:<24}"
                f"  outcome={status:<10}  reward={r.reward:.2f}"
            )
    else:
        state_overrides = load_state_overrides(args.state_file)
        result = agent.run(customer_id=args.customer_id, state_overrides=state_overrides)
        print(f"\n{'='*60}")
        print(
            f"RUN COMPLETE: {result.customer_id}"
            f"  upsell={result.upsell}"
            f"  accepted={result.accepted}"
            f"  reward={result.reward:.2f}"
        )


if __name__ == "__main__":
    main()


# ------------------------------------------------------------------
# Example run output (python agent/upsell_agent.py --customer-id cust-007)
# ------------------------------------------------------------------
#
# STATE:
# {
#   "churn_risk": 0.23,
#   "customer_id": "cust-007",
#   "customer_segment": "premium",
#   "days_since_last_service": 120,
#   "expected_demand": 72.4,
#   "job_value": 350.0,
#   "ltv": 7200.0,
#   "num_previous_upsell_attempts": 1,
#   "service_type": "annual_service",
#   "utilization": 0.68
# }
#
# ACTION SELECTED: premium_service_upgrade  (rule predictor)
# EXECUTE: [mock] Presented premium upgrade offer to customer cust-007
#
# OUTCOME: accepted=True
# REVENUE: upsell_revenue=175.00  offer_cost=15.00  reward=160.00
# BANDIT: updated  action=premium_service_upgrade  reward=160.00
#   stats={'states_explored': 1, 'total_updates': 1,
#          'best_actions_per_state': {"('annual_service', 'premium', 14, 7)": 'premium_service_upgrade'}}
# LOG: feedback recorded at agent/logs/upsell_agent_feedback.jsonl
#
# ============================================================
# RUN COMPLETE: cust-007  upsell=premium_service_upgrade  accepted=True  reward=160.00
#
# After many runs the bandit converges to learned optima, for example:
#   ('repair',          'premium',  *, *)  → best_action = 'replacement_offer'     (Q ≈ 900)
#   ('annual_service',  'standard', *, *)  → best_action = 'maintenance_plan'      (Q ≈ 90)
#   ('installation',    *,          *, *)  → best_action = 'extended_warranty'     (Q ≈ 110)
#   (*,                 'budget',   *, *)  → best_action = 'maintenance_plan'      (Q ≈ 40)
#   (*,                 *,          *, 0)  → best_action = 'no_upsell' (safety: job_value < $100)
# ------------------------------------------------------------------
