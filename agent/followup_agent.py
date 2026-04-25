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
    from .followup_bandit import FollowUpBandit, load_bandit, save_bandit
except ImportError:  # Allows `python followup_agent.py` from inside agent/
    from followup_bandit import FollowUpBandit, load_bandit, save_bandit


DEFAULT_LOG_PATH = Path(__file__).resolve().parent / "logs" / "followup_agent_feedback.jsonl"
DEFAULT_MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
DEFAULT_MONGO_DB = os.getenv("MONGO_DB_NAME", "hvac_software")
FOLLOWUP_LOGS_COLLECTION = "followup_logs"

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class FollowUpState:
    """Snapshot of a customer's CRM context used for follow-up decisions."""

    customer_id: str
    days_since_last_contact: int
    num_previous_attempts: int
    customer_segment: str    # "premium" | "standard" | "budget"
    lead_stage: str          # "new_lead" | "quote_sent" | "negotiation" | "churned"
    churn_risk: float        # 0.0–1.0 from churn model
    ltv: float               # lifetime value in dollars
    last_action: str         # channel used in the most recent follow-up
    response_history: int    # 0 = never responded, 1 = has responded before

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class FollowUpResult:
    """Outcome record persisted to JSONL and MongoDB after each agent run."""

    customer_id: str
    state: dict[str, Any]
    action: str
    bandit_selected: bool
    responded: bool
    booked: bool
    reward: float
    timestamp: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ------------------------------------------------------------------
# State building
# ------------------------------------------------------------------

def build_followup_state(
    customer_id: str,
    overrides: dict[str, Any] | None = None,
) -> FollowUpState:
    """Construct a FollowUpState from CRM signals.

    In production: query Prisma/PostgreSQL for real customer data.
    Mocked defaults are tuned to produce realistic signal distributions
    so the agent runs end-to-end without a database connection.
    """
    defaults: dict[str, Any] = {
        "days_since_last_contact": random.randint(1, 10),
        "num_previous_attempts": random.randint(0, 4),
        "customer_segment": random.choice(["premium", "standard", "budget"]),
        "lead_stage": random.choice(["new_lead", "quote_sent", "negotiation", "churned"]),
        "churn_risk": round(random.uniform(0.1, 0.9), 2),
        "ltv": round(random.uniform(500.0, 10000.0), 2),
        "last_action": random.choice(["call", "sms", "whatsapp", "email", "none"]),
        "response_history": random.randint(0, 1),
    }
    if overrides:
        # customer_id is an identifier, not a feature — strip it from overrides
        filtered = {k: v for k, v in overrides.items() if k != "customer_id"}
        defaults.update(filtered)

    return FollowUpState(customer_id=customer_id, **defaults)


# ------------------------------------------------------------------
# Execution
# ------------------------------------------------------------------

def execute_followup(action: str, customer_id: str, state: Mapping[str, Any]) -> str:
    """Dispatch the follow-up to the appropriate communication channel.

    In production: replace each branch with a real API call —
      call      → CRM task creation (Twilio, RingCentral)
      sms       → Twilio SMS or similar
      whatsapp  → WhatsApp Business API
      email     → SendGrid / Mailchimp
      no_followup → no-op
    Returns a mock execution ID for audit logging.
    """
    messages = {
        "call": f"Scheduled outbound call task for customer {customer_id}",
        "sms": f"Sent SMS to customer {customer_id}",
        "whatsapp": f"Sent WhatsApp message to customer {customer_id}",
        "email": f"Sent email to customer {customer_id}",
        "no_followup": f"No action taken for customer {customer_id}",
    }
    message = messages.get(action, f"Unknown action {action} for customer {customer_id}")
    print(f"EXECUTE: [mock] {message}")
    logger.info(message)
    return f"{action}-mock-{customer_id}"


# ------------------------------------------------------------------
# Response simulation
# ------------------------------------------------------------------

# Response probability matrix: channel × segment.
# Values are based on industry HVAC follow-up benchmarks.
# The bandit will independently rediscover these patterns through reward signals.
_RESPONSE_RATES: dict[str, dict[str, float]] = {
    "call":      {"premium": 0.70, "standard": 0.50, "budget": 0.35},
    "sms":       {"premium": 0.45, "standard": 0.55, "budget": 0.60},
    "whatsapp":  {"premium": 0.50, "standard": 0.60, "budget": 0.55},
    "email":     {"premium": 0.40, "standard": 0.35, "budget": 0.30},
}


def simulate_response(action: str, state: Mapping[str, Any]) -> tuple[bool, bool]:
    """Simulate customer response and booking outcome.

    In production: poll CRM for actual interaction within a configurable
    response window (e.g. 24 hours after the follow-up was sent).

    Returns (responded, booked):
      - responded: customer replied or engaged with the follow-up
      - booked:    customer scheduled a service appointment
    """
    if action == "no_followup":
        return False, False

    segment = str(state.get("customer_segment", "standard")).lower()
    churn_risk = float(state.get("churn_risk", 0.5))

    base_rate = _RESPONSE_RATES.get(action, {}).get(segment, 0.40)
    # High churn risk slightly depresses response: at-risk customers are less engaged
    adjusted_rate = base_rate * (1.0 - churn_risk * 0.3)

    responded = random.random() < adjusted_rate
    # 25 % of responders convert to a booking — rough HVAC industry conversion rate
    booked = responded and random.random() < 0.25

    return responded, booked


# ------------------------------------------------------------------
# Reward computation
# ------------------------------------------------------------------

def compute_reward(responded: bool, booked: bool) -> float:
    """Map the customer outcome to a scalar reward for the bandit.

    Scale chosen so booking (the primary business outcome) is 10×
    more valuable than simple engagement, which is 10× more than silence.
    This ratio shapes the bandit's exploitation priority toward bookings.
    """
    if booked:
        return 10.0    # service booked → strong positive signal
    if responded:
        return 1.0     # engaged but no booking → weak positive signal
    return 0.0         # no response → neutral (bandit learns to avoid this)


# ------------------------------------------------------------------
# Feedback logging
# ------------------------------------------------------------------

def log_followup_feedback(
    result: FollowUpResult,
    log_path: Path = DEFAULT_LOG_PATH,
    mongo_uri: str | None = DEFAULT_MONGO_URI,
    mongo_db: str = DEFAULT_MONGO_DB,
) -> None:
    """Persist the follow-up outcome to JSONL and MongoDB.

    JSONL is the source of truth for offline model training.
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
        db[FOLLOWUP_LOGS_COLLECTION].insert_one(document)
        client.close()
    except Exception as exc:
        logger.warning("FollowUp MongoDB feedback write skipped: %s", exc)


# ------------------------------------------------------------------
# Agent
# ------------------------------------------------------------------

class FollowUpAgent:
    """Self-learning follow-up optimization agent powered by contextual bandit.

    Every run executes the full learning loop:
      build_state → select_action → execute → observe_response
        → compute_reward → update_bandit → log_feedback

    The persisted Q-table means each run starts smarter than the last.
    Unlike the revenue agent (which uses the bandit for 20% exploration
    only), all follow-up decisions flow through the bandit — the bandit
    IS the policy here.
    """

    def __init__(self, feedback_log_path: str | Path = DEFAULT_LOG_PATH) -> None:
        self.feedback_log_path = Path(feedback_log_path)

    def run(
        self,
        customer_id: str,
        state_overrides: dict[str, Any] | None = None,
    ) -> FollowUpResult:
        # ── Step 1: Build state from CRM signals ──────────────────────
        state_obj = build_followup_state(customer_id, overrides=state_overrides)
        state = state_obj.to_dict()

        print("\nSTATE:")
        print(json.dumps(state, indent=2, sort_keys=True))

        # ── Step 2: Load latest persisted bandit ───────────────────────
        # Reloading from disk each run ensures we benefit from any concurrent
        # updates (e.g. parallel runs processing other customers).
        bandit = load_bandit()

        # ── Step 3: Select follow-up action ───────────────────────────
        # Bandit applies: safety gate → ε-greedy exploration/exploitation
        action = bandit.select_action(state)
        print(f"\nACTION SELECTED: {action}")

        # ── Step 4: Execute follow-up via appropriate channel ──────────
        execute_followup(action, customer_id, state)

        # ── Step 5: Observe customer response ─────────────────────────
        # In production: poll CRM after a response window (e.g. 24 hours).
        # Here we simulate immediately to close the learning loop end-to-end.
        responded, booked = simulate_response(action, state)
        print(f"\nRESPONSE: responded={responded}  booked={booked}")

        # ── Step 6: Compute reward ─────────────────────────────────────
        reward = compute_reward(responded, booked)
        print(f"REWARD: {reward:.2f}")

        # ── Step 7: Update bandit Q-table and persist ──────────────────
        bandit.update(state, action, reward)
        save_bandit(bandit)
        print(
            f"BANDIT: updated  action={action}  reward={reward:.2f}"
            f"  stats={bandit.stats()}"
        )

        # ── Step 8: Log outcome for training and analytics ─────────────
        result = FollowUpResult(
            customer_id=customer_id,
            state=state,
            action=action,
            bandit_selected=True,
            responded=responded,
            booked=booked,
            reward=reward,
            timestamp=datetime.now(UTC).isoformat(),
        )
        log_followup_feedback(result, log_path=self.feedback_log_path)

        return result

    def run_batch(
        self,
        customer_ids: list[str],
        state_overrides_map: dict[str, dict[str, Any]] | None = None,
    ) -> list[FollowUpResult]:
        """Process multiple customers sequentially, persisting after each run.

        Each run loads and saves the bandit so every customer benefits from
        the learning accumulated by all prior customers in the batch.
        """
        results: list[FollowUpResult] = []
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
    parser = ArgumentParser(description="Run the self-learning follow-up agent.")
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
    agent = FollowUpAgent(feedback_log_path=args.feedback_log)

    if args.batch:
        results = agent.run_batch(args.batch)
        print(f"\n{'='*60}")
        print(f"BATCH COMPLETE: {len(results)} customers processed")
        for r in results:
            status = "booked" if r.booked else ("responded" if r.responded else "ignored")
            print(
                f"  {r.customer_id}: action={r.action:<12}"
                f"  outcome={status:<10}  reward={r.reward:.2f}"
            )
    else:
        state_overrides = load_state_overrides(args.state_file)
        result = agent.run(customer_id=args.customer_id, state_overrides=state_overrides)
        print(f"\n{'='*60}")
        print(
            f"RUN COMPLETE: {result.customer_id}"
            f"  action={result.action}"
            f"  responded={result.responded}"
            f"  booked={result.booked}"
            f"  reward={result.reward:.2f}"
        )


if __name__ == "__main__":
    main()

# ------------------------------------------------------------------
# Example run output (python agent/followup_agent.py --customer-id cust-042)
# ------------------------------------------------------------------
#
# STATE:
# {
#   "churn_risk": 0.63,
#   "customer_id": "cust-042",
#   "customer_segment": "premium",
#   "days_since_last_contact": 3,
#   "last_action": "sms",
#   "lead_stage": "quote_sent",
#   "ltv": 3500.0,
#   "num_previous_attempts": 2,
#   "response_history": 0
# }
#
# ACTION SELECTED: call
# EXECUTE: [mock] Scheduled outbound call task for customer cust-042
#
# RESPONSE: responded=True  booked=False
# REWARD: 1.00
# BANDIT: updated  action=call  reward=1.00
#   stats={'states_explored': 1, 'total_updates': 1,
#          'best_actions_per_state': {"(3, 2, 'quote_sent', 'premium')": 'call'}}
# LOG: feedback recorded at agent/logs/followup_agent_feedback.jsonl
#
# ============================================================
# RUN COMPLETE: cust-042  action=call  responded=True  booked=False  reward=1.00
#
# After many runs the bandit converges to learned optima, e.g.:
#   (*, *, *, 'premium') → best_action = 'call'    (Q ≈ 2.1)
#   (*, *, *, 'budget')  → best_action = 'sms'     (Q ≈ 1.8)
#   (7, 5, *, *)         → best_action = 'call'    (late follow-ups need stronger touch)
# ------------------------------------------------------------------
