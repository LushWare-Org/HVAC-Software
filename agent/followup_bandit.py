from __future__ import annotations

import logging
import random
from pathlib import Path
from typing import Any, Mapping

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BANDIT_PATH = PROJECT_ROOT / "models" / "followup_bandit.pkl"

# Full learnable action set for follow-up channel selection.
# no_followup is included so the bandit can learn when silence is better
# than contact (e.g. customers who have already responded or converted).
FOLLOWUP_ACTIONS: tuple[str, ...] = ("call", "sms", "whatsapp", "email", "no_followup")

# Safety ceiling: customers who have received more than this many attempts
# are forced to no_followup regardless of Q-table values.
# Prevents the bandit from spamming customers during exploration.
MAX_ATTEMPTS_BEFORE_STOP: int = 5

# 20 % exploration keeps the policy fresh without sacrificing too much
# response rate. Decay toward 0.05 as the bandit accumulates history.
EPSILON: float = 0.2


class FollowUpBandit:
    """Epsilon-greedy contextual bandit for follow-up channel learning.

    Maps the customer context to a discrete 4-tuple state key
    (days_bucket, attempts_bucket, lead_stage, customer_segment) and
    maintains per-(state, action) running averages of the response reward.

    The design separates context representation, action selection, and
    learning so each can be upgraded independently:
      - get_state_key  → replace bucketing with embeddings later
      - select_action  → replace ε-greedy with Thompson Sampling later
      - update         → add time-decay weights for drift later
    """

    def __init__(self, epsilon: float = EPSILON) -> None:
        self.epsilon = epsilon

        # Q[(days, attempts, stage, segment)][action] = running average reward
        self.Q: dict[tuple[int, int, str, str], dict[str, float]] = {}

        # N[(days, attempts, stage, segment)][action] = visit count
        self.N: dict[tuple[int, int, str, str], dict[str, int]] = {}

    # ------------------------------------------------------------------
    # State representation
    # ------------------------------------------------------------------

    def get_state_key(self, state: Mapping[str, Any]) -> tuple[int, int, str, str]:
        """Reduce continuous/categorical state to a discrete 4-tuple.

        Bucketing collapses similar customers so the bandit generalises
        across them rather than requiring a separate cell per unique profile.

        Dimensions chosen because they capture the strongest follow-up signals:
          - days_since_last_contact → urgency; capped at 7 so week+ is one bucket
          - num_previous_attempts   → fatigue level; capped at 5 matching the safety gate
          - lead_stage              → pipeline position, directly affects conversion
          - customer_segment        → value tier, determines preferred channel
        """
        days_bucket = min(int(state.get("days_since_last_contact", 0)), 7)
        attempts_bucket = min(int(state.get("num_previous_attempts", 0)), 5)
        lead_stage = str(state.get("lead_stage", "unknown")).lower()
        customer_segment = str(state.get("customer_segment", "unknown")).lower()
        return (days_bucket, attempts_bucket, lead_stage, customer_segment)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _ensure_state(self, state_key: tuple[int, int, str, str]) -> None:
        """Lazily initialise Q and N tables for an unseen state bucket."""
        if state_key not in self.Q:
            self.Q[state_key] = {action: 0.0 for action in FOLLOWUP_ACTIONS}
            self.N[state_key] = {action: 0 for action in FOLLOWUP_ACTIONS}

    # ------------------------------------------------------------------
    # Core bandit interface
    # ------------------------------------------------------------------

    def select_action(self, state: Mapping[str, Any]) -> str:
        """Epsilon-greedy action selection with a hard safety gate.

        Safety gate (applied first, unconditionally):
          If num_previous_attempts > MAX_ATTEMPTS_BEFORE_STOP, return no_followup.
          This prevents spam regardless of what the Q-table has learned.

        Otherwise:
          With probability ε  → explore: pick a uniformly random action.
          With probability 1-ε → exploit: pick the highest-Q action seen so far.
        """
        # Hard safety gate — evaluated before any stochastic choice
        if int(state.get("num_previous_attempts", 0)) > MAX_ATTEMPTS_BEFORE_STOP:
            logger.debug(
                "Safety gate triggered: %d attempts exceeds %d; forcing no_followup",
                state.get("num_previous_attempts"),
                MAX_ATTEMPTS_BEFORE_STOP,
            )
            return "no_followup"

        state_key = self.get_state_key(state)
        self._ensure_state(state_key)

        if random.random() < self.epsilon:
            # Exploration: pick a random channel to discover untried combinations
            return random.choice(FOLLOWUP_ACTIONS)

        # Exploitation: return the channel with the highest average reward
        return max(self.Q[state_key], key=lambda a: self.Q[state_key][a])

    def update(self, state: Mapping[str, Any], action: str, reward: float) -> None:
        """Incremental running-average Q update (Welford formula).

            Q_new = Q_old + (reward − Q_old) / N

        Mathematically equivalent to a simple sample average without storing
        the full reward history. Converges to the true mean over time.
        """
        if action not in FOLLOWUP_ACTIONS:
            logger.debug("Bandit skipping update for unrecognized action '%s'", action)
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
        logger.info("FollowUpBandit saved → %s  stats=%s", dest, self.stats())

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

def save_bandit(bandit: FollowUpBandit, path: str | Path = DEFAULT_BANDIT_PATH) -> None:
    """Persist bandit state to disk."""
    bandit.save(path)


def load_bandit(path: str | Path = DEFAULT_BANDIT_PATH) -> FollowUpBandit:
    """Load a persisted bandit from disk, or return a fresh one if not found.

    Always returns a valid, runnable instance — callers never need to handle
    the missing-file case.
    """
    import joblib

    p = Path(path)
    if p.exists():
        try:
            bandit: FollowUpBandit = joblib.load(p)
            logger.info("FollowUpBandit loaded from %s  stats=%s", p, bandit.stats())
            return bandit
        except Exception as exc:
            logger.warning(
                "Bandit file at %s is corrupt or incompatible (%s); starting fresh",
                p,
                exc,
            )

    logger.info("No bandit found at %s — initialising fresh FollowUpBandit", p)
    return FollowUpBandit()
