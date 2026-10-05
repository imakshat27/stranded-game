"""Player behavioral profiling and archetype classification for STRANDED.

Evaluates multi-dimensional telemetry (exploration, risk tolerance, hoarding, rest frequency)
and continuously updates the player's classification archetype.
"""

from typing import Any, Dict
from pydantic import BaseModel, Field
from app.game.state import GameState


class PlayerBehaviorMetrics(BaseModel):
    exploration_frequency: float = 0.0
    risk_tolerance: float = 0.0
    resource_efficiency: float = 0.5
    rest_frequency: float = 0.0
    escape_focus: float = 0.0
    profile_type: str = "Balanced"
    description: str = "Balanced strategic survivor allocating effort across all survival disciplines."


class PlayerProfiler:
    """Computes behavioral metrics and classifies player style."""

    @classmethod
    def evaluate(cls, state: GameState) -> PlayerBehaviorMetrics:
        prof = state.player_profile
        total_actions = max(1, prof.get("total_actions", 0))

        expl_freq = prof.get("exploration_actions", 0) / total_actions
        risk_tol = prof.get("risky_actions", 0) / total_actions
        rest_freq = prof.get("rest_actions", 0) / total_actions
        craft_freq = prof.get("crafting_actions", 0) / total_actions
        escape_focus = min(1.0, (state.escape_progress / 100.0) + (craft_freq * 0.5))

        avg_vitals = (state.health + state.water + state.food) / 300.0
        efficiency = min(1.0, max(0.1, avg_vitals + (state.wood + state.rope + state.metal) * 0.02))

        # Classification rules
        if expl_freq >= 0.40 and risk_tol >= 0.30:
            p_type = "Explorer"
            desc = "Bold pioneer aggressively surveying uncharted sectors and ruins at personal risk."
        elif risk_tol >= 0.45:
            p_type = "Risk Taker"
            desc = "High-stakes gambler pursuing rapid rewards despite harsh environmental hazards."
        elif rest_freq >= 0.35 or (state.shelter_level >= 2 and state.wood >= 6):
            p_type = "Conservative"
            desc = "Defensive pragmatist fortifying base shelters and stockpiling safety reserves."
        else:
            p_type = "Balanced"
            desc = "Methodical strategist allocating attention harmoniously across vitals and escape construction."

        return PlayerBehaviorMetrics(
            exploration_frequency=round(expl_freq, 2),
            risk_tolerance=round(risk_tol, 2),
            resource_efficiency=round(efficiency, 2),
            rest_frequency=round(rest_freq, 2),
            escape_focus=round(escape_focus, 2),
            profile_type=p_type,
            description=desc
        )
