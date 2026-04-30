from __future__ import annotations

import logging
import random
from pathlib import Path
from typing import Any, Mapping

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BANDIT_PATH = PROJECT_ROOT / "models" / "bandit.pkl"

# Learnable action set — intentionally small so each (state, action) cell
# accumulates enough samples for reliable Q estimates within reasonable time.
# Capacity-aware overrides (increase_price, discount_with_price_override, etc.)
# are excluded because they are governed by deterministic safety rules that
# should not be weakened by exploration.
BANDIT_ACTIONS: tuple[str, ...] = ("discount_10", "discount_20", "call", "none")

# 20 % exploration keeps policy fresh without sacrificing too much revenue.
# Increase toward 0.5 in early deployment; decay toward 0.05 at maturity.
EPSILON: float = 0.2


class ContextualBandit:
    """Epsilon-greedy contextual bandit for revenue action learning.

    Maps the current business context to a discrete state key
    (util_bucket, demand_bucket) and maintains per-(state, action) running
    averages of the incremental revenue reward (actual − baseline).

    The design deliberately separates *context representation* (get_state_key),
    *action selection* (select_action), and *learning* (update) so that each
    can be upgraded independently:
      - get_state_key → replace bucketing with ML embeddings
      - select_action → replace ε-greedy with Thompson Sampling
      - update → replace incremental average with weighted decay for drift
    """

    def __init__(self, epsilon: float = EPSILON) -> None:
        self.epsilon = epsilon

        # Q[(util_bucket, demand_bucket)][action] = running average reward
        self.Q: dict[tuple[int, int], dict[str, float]] = {}

        # N[(util_bucket, demand_bucket)][action] = visit count
        self.N: dict[tuple[int, int], dict[str, int]] = {}

    # ------------------------------------------------------------------
    # State representation
    # ------------------------------------------------------------------

    def get_state_key(self, state: Mapping[str, Any]) -> tuple[int, int]:
        """Reduce continuous state to a discrete (util_bucket, demand_bucket) pair.

        Bucketing collapses similar situations so the bandit can generalise
        across them. The two chosen dimensions capture the most decision-relevant
        signals:
          - utilisation → whether capacity is scarce or plentiful
          - demand_gap  → whether bookings are tracking above or below forecast
        """
        util = float(state.get("utilization", 0.0))
        demand_gap = float(state.get("demand_gap", 0.0))

        # utilization 0.0–1.0 → buckets 0–10; clamp handles util == 1.0 → 10
        util_bucket = min(10, max(0, int(util * 10)))

        # demand_gap typically ranges ±100; divide by 10 → ±10 then clamp
        demand_bucket = min(10, max(-10, int(demand_gap / 10)))

        return (util_bucket, demand_bucket)

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _ensure_state(self, state_key: tuple[int, int]) -> None:
        """Lazily initialise Q and N tables for an unseen state bucket."""
        if state_key not in self.Q:
            self.Q[state_key] = {action: 0.0 for action in BANDIT_ACTIONS}
            self.N[state_key] = {action: 0 for action in BANDIT_ACTIONS}

    # ------------------------------------------------------------------
    # Core bandit interface
    # ------------------------------------------------------------------

    def select_action(self, state: Mapping[str, Any]) -> str:
        """Epsilon-greedy action selection.

        With probability ε  → explore: pick a random action.
        With probability 1−ε → exploit: pick the highest-Q action.

        The random seed is NOT fixed so that exploration stays stochastic
        across runs; callers that need reproducibility should seed externally.
        """
        state_key = self.get_state_key(state)
        self._ensure_state(state_key)

        if random.random() < self.epsilon:
            return random.choice(BANDIT_ACTIONS)

        return max(self.Q[state_key], key=lambda a: self.Q[state_key][a])

    def update(self, state: Mapping[str, Any], action: str, reward: float) -> None:
        """Incremental running-average Q update.

        Uses the Welford / incremental-mean formula:
            Q_new = Q_old + (reward − Q_old) / N

        Mathematically equivalent to a simple sample average without needing
        to store the full reward history. Converges to the true mean over time.
        """
        if action not in BANDIT_ACTIONS:
            # Capacity-aware and other safety actions are outside the learnable
            # set and must not be distorted by exploration data.
            logger.debug("Bandit skipping update for non-learnable action '%s'", action)
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
        logger.info("Bandit saved → %s  stats=%s", dest, self.stats())

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

def save_bandit(bandit: ContextualBandit, path: str | Path = DEFAULT_BANDIT_PATH) -> None:
    """Persist bandit state to disk."""
    bandit.save(path)


def load_bandit(path: str | Path = DEFAULT_BANDIT_PATH) -> ContextualBandit:
    """Load a persisted bandit from disk, or return a fresh one if not found.

    Always returns a valid, runnable instance — callers never need to handle
    the missing-file case.
    """
    import joblib

    p = Path(path)
    if p.exists():
        try:
            bandit: ContextualBandit = joblib.load(p)
            logger.info("Bandit loaded from %s  stats=%s", p, bandit.stats())
            return bandit
        except Exception as exc:
            logger.warning(
                "Bandit file at %s is corrupt or incompatible (%s); starting fresh",
                p,
                exc,
            )

    logger.info("No bandit found at %s — initialising fresh ContextualBandit", p)
    return ContextualBandit()
