"""Adaptive multi-dimensional difficulty vector controller for STRANDED.

Avoids scalar difficulty numbers by tuning a 4-dimensional vector:
(resource_scarcity, environmental_risk, exploration_risk, escape_complexity).
"""

from typing import Dict
from app.game.state import GameState
from app.core.config import ConfigLoader


class DifficultyController:
    """Modulates difficulty vectors smoothly based on player resilience and style."""

    @classmethod
    def get_difficulty_vector(cls, state: GameState) -> Dict[str, float]:
        return {
            k: round(v, 3) for k, v in state.difficulty_profile.items()
        }

    @classmethod
    def adjust(cls, state: GameState) -> Dict[str, float]:
        diff_cfg = ConfigLoader.get_difficulty()
        min_b = diff_cfg.get("min_bounds", {})
        max_b = diff_cfg.get("max_bounds", {})
        rate = diff_cfg.get("adaptation_rate", 0.05)
        prof = state.difficulty_profile

        # If player is struggling (health < 35 or food/water depleted)
        if state.health < 35.0 or state.water < 20.0 or state.food < 20.0:
            prof["resource_scarcity"] = max(min_b.get("resource_scarcity", 0.15), prof["resource_scarcity"] - rate)
            prof["environmental_risk"] = max(min_b.get("environmental_risk", 0.15), prof["environmental_risk"] - rate)
        # If player is dominating effortlessly (high vitals and shelter)
        elif state.health > 85.0 and state.water > 70.0 and state.food > 70.0:
            prof["resource_scarcity"] = min(max_b.get("resource_scarcity", 0.95), prof["resource_scarcity"] + (rate * 0.4))
            prof["environmental_risk"] = min(max_b.get("environmental_risk", 0.90), prof["environmental_risk"] + (rate * 0.4))

        return {k: round(v, 3) for k, v in prof.items()}
