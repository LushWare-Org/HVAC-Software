from __future__ import annotations

import logging
import random
from pathlib import Path
from typing import Any, Mapping

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BANDIT_PATH = PROJECT_ROOT / "models" / "upsell_bandit.pkl"

# Full learnable action set for upsell strategy selection.
# no_upsell is included so the bandit learns when NOT upselling is better
# (e.g. low-value jobs, fatigued customers, or budget segments that reject offers).
UPSELL_ACTIONS: tuple[str, ...] = (
    "maintenance_plan",
    "extended_warranty",
    "premium_service_upgrade",
    "replacement_offer",
    "no_upsell",
)

# Safety ceiling: customers who have received more than this many upsell
# attempts in recent history are forced to no_upsell regardless of Q-table values.
# Prevents the bandit from alienating customers through repeated hard sells.
MAX_UPSELL_ATTEMPTS_BEFORE_STOP: int = 3

# Minimum job value below which upselling is always suppressed.
# A $75 repair call is not the right context for a $2,000 replacement pitch.
MIN_JOB_VALUE_FOR_UPSELL: float = 100.0

# 20 % exploration keeps the policy fresh without sacrificing too much
# conversion revenue. Decay toward 0.05 as the bandit matures.
EPSILON: float = 0.2


class UpsellBandit:
    """Epsilon-greedy contextual bandit for upsell strategy learning.

    Maps the customer + job context to a discrete 4-tuple state key
    (service_bucket, segment, ltv_bucket, job_bucket) and maintains
    per-(state, action) running averages of the net upsell revenue reward
    (upsell_revenue − cost_of_offer).

    The design separates context representation, action selection, and
    learning so each can be upgraded independently:
      - get_state_key  → replace bucketing with embeddings later
      - select_action  → replace ε-greedy with Thompson Sampling later
      - update         → add time-decay weights for concept drift later
    """

    def __init__(self, epsilon: float = EPSILON) -> None:
        self.epsilon = epsilon

        # Q[(service, segment, ltv_bucket, job_bucket)][action] = running avg reward
        self.Q: dict[tuple[str, str, int, int], dict[str, float]] = {}

        # N[(service, segment, ltv_bucket, job_bucket)][action] = visit count
        self.N: dict[tuple[str, str, int, int], dict[str, int]] = {}

    # ------------------------------------------------------------------
    # State representation
    # ------------------------------------------------------------------

    def get_state_key(self, state: Mapping[str, Any]) -> tuple[str, str, int, int]:
        """Reduce continuous/categorical state to a discrete 4-tuple.

        Bucketing collapses similar customers so the bandit generalises
        across them rather than requiring a separate cell per unique profile.

        Dimensions chosen because they are the strongest upsell signals:
          - service_type    → determines natural upsell affinity (repair→replacement)
          - customer_segment → value tier; premium accepts higher-priced upgrades
          - ltv             → overall customer value; every $500 = 1 bucket, capped at 20
          - job_value       → size of the current job; every $50 = 1 bucket, capped at 20
        """
        service = str(state.get("service_type", "unknown")).lower()
        segment = str(state.get("customer_segment", "unknown")).lower()
        ltv_bucket = min(20, max(0, int(float(state.get("ltv", 0.0)) / 500)))
        job_bucket = min(20, max(0, int(float(state.get("job_value", 0.0)) / 50)))
        return (service, segment, ltv_bucket, job_bucket)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _ensure_state(self, state_key: tuple[str, str, int, int]) -> None:
        """Lazily initialise Q and N tables for an unseen state bucket."""
        if state_key not in self.Q:
            self.Q[state_key] = {action: 0.0 for action in UPSELL_ACTIONS}
            self.N[state_key] = {action: 0 for action in UPSELL_ACTIONS}

    # ------------------------------------------------------------------
    # Core bandit interface
    # ------------------------------------------------------------------

    def select_action(self, state: Mapping[str, Any]) -> str:
        """Epsilon-greedy action selection with hard safety gates.

        Safety gates (applied first, unconditionally):
          1. job_value < MIN_JOB_VALUE_FOR_UPSELL → no_upsell.
             Small jobs signal the customer is already stretching their budget.
          2. num_previous_upsell_attempts > MAX_UPSELL_ATTEMPTS_BEFORE_STOP → no_upsell.
             Prevents aggressive upsell cadences that damage trust.

        Otherwise:
          With probability ε  → explore: pick a uniformly random action.
          With probability 1-ε → exploit: pick the highest-Q action.
        """
        job_value = float(state.get("job_value", 0.0))
        if job_value < MIN_JOB_VALUE_FOR_UPSELL:
            logger.debug(
                "Safety gate triggered: job_value=%.2f below minimum %.2f; forcing no_upsell",
                job_value,
                MIN_JOB_VALUE_FOR_UPSELL,
            )
            return "no_upsell"

        attempts = int(state.get("num_previous_upsell_attempts", 0))
        if attempts > MAX_UPSELL_ATTEMPTS_BEFORE_STOP:
            logger.debug(
                "Safety gate triggered: %d upsell attempts exceeds %d; forcing no_upsell",
                attempts,
                MAX_UPSELL_ATTEMPTS_BEFORE_STOP,
            )
            return "no_upsell"

        state_key = self.get_state_key(state)
        self._ensure_state(state_key)

        if random.random() < self.epsilon:
            # Exploration: try an untested upsell to discover hidden optima
            return random.choice(UPSELL_ACTIONS)

        # Exploitation: return the upsell with the highest average net reward
        return max(self.Q[state_key], key=lambda a: self.Q[state_key][a])

    def update(self, state: Mapping[str, Any], action: str, reward: float) -> None:
        """Incremental running-average Q update (Welford formula).

            Q_new = Q_old + (reward − Q_old) / N

        Mathematically equivalent to a simple sample average without storing
        the full reward history.  Converges to the true mean over time.
        """
        if action not in UPSELL_ACTIONS:
            logger.debug("Bandit skipping update for unrecognised action '%s'", action)
            return

        state_key = self.get_state_key(state)
        self._ensure_state(state_key)

        self.N[state_key][action] += 1
        n = self.N[state_key][action]
        self.Q[state_key][action] += (reward - self.Q[state_key][action]) / n

        logger.debug(
            "Bandit updated  state=%s  action=%s  reward=%.2f  Q=%.4f  N=%d",
            state_key,
            action,
            reward,
            self.Q[state_key][action],
            n,
        )

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def save(self, path: str | Path = DEFAULT_BANDIT_PATH) -> None:
        """Persist the entire bandit instance (Q + N tables) using joblib."""
        import joblib

        dest = Path(path)
        dest.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, dest)
        logger.info("UpsellBandit saved → %s  stats=%s", dest, self.stats())

    # ------------------------------------------------------------------
    # Observability
    # ------------------------------------------------------------------

    def stats(self) -> dict[str, Any]:
        """Compact summary for logging and health-check endpoints."""
        total_updates = sum(sum(counts.values()) for counts in self.N.values())
        best_actions: dict[str, str] = {
            str(sk): max(q, key=lambda a: q[a])
            for sk, q in self.Q.items()
        }
        return {
            "states_explored": len(self.Q),
            "total_updates": total_updates,
            "best_actions_per_state": best_actions,
        }

    def top_actions(self, top_n: int = 5) -> list[dict[str, Any]]:
        """Return the most-visited (state, action) pairs for human review."""
        rows: list[dict[str, Any]] = [
            {
                "state_key": sk,
                "action": action,
                "Q": round(self.Q[sk][action], 4),
                "N": n,
            }
            for sk, counts in self.N.items()
            for action, n in counts.items()
            if n > 0
        ]
        rows.sort(key=lambda r: r["N"], reverse=True)
        return rows[:top_n]


# ------------------------------------------------------------------
# Module-level convenience wrappers
# ------------------------------------------------------------------

def save_bandit(bandit: UpsellBandit, path: str | Path = DEFAULT_BANDIT_PATH) -> None:
    """Persist bandit state to disk."""
    bandit.save(path)


def load_bandit(path: str | Path = DEFAULT_BANDIT_PATH) -> UpsellBandit:
    """Load a persisted bandit from disk, or return a fresh one if not found.

    Always returns a valid, runnable instance — callers never need to handle
    the missing-file case.
    """
    import joblib

    p = Path(path)
    if p.exists():
        try:
            bandit: UpsellBandit = joblib.load(p)
            logger.info("UpsellBandit loaded from %s  stats=%s", p, bandit.stats())
            return bandit
        except Exception as exc:
            logger.warning(
                "Bandit file at %s is corrupt or incompatible (%s); starting fresh",
                p,
                exc,
            )

    logger.info("No bandit found at %s — initialising fresh UpsellBandit", p)
    return UpsellBandit()
