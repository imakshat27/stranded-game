"""Game Engine coordinator for STRANDED.

Orchestrates game lifecycle, new session instantiation, action dispatching,
hint request validation and cooldown handling.
"""

from typing import Any, Dict, Optional, Tuple
import uuid
import random
from app.core.config import ConfigLoader
from app.game.state import GameState, StateTransition
from app.game.actions import ActionManager
from app.game.transitions import apply_action


class GameEngine:
    """Core game engine coordinating sessions and transitions."""

    @classmethod
    def create_new_game(cls, seed: Optional[str] = None) -> GameState:
        """Create a fresh GameState initialized from resources.json defaults."""
        game_id = str(uuid.uuid4())
        res_cfg = ConfigLoader.get_resources()
        init = res_cfg.get("initial", {})
        game_seed = seed or str(uuid.uuid4())[:8]

        state = GameState(
            game_id=game_id,
            day=1,
            actions_remaining=init.get("actions_per_day", 2),
            turn_in_day=1,
            health=init.get("health", 100.0),
            water=init.get("water", 80.0),
            food=init.get("food", 75.0),
            energy=init.get("energy", 90.0),
            shelter_level=init.get("shelter_level", 0),
            wood=init.get("wood", 2),
            rope=init.get("rope", 0),
            metal=init.get("metal", 0),
            tools=init.get("tools", 0),
            escape_progress=0.0,
            boat_parts={
                "hull": False,
                "rigging": False,
                "rudder": False,
                "provisions": False
            },
            location="base_camp",
            weather="clear",
            discovered_locations=["base_camp", "freshwater_stream"],
            hints_remaining=3,
            hint_cooldown=0,
            hints_used=0,
            hints_earned=0,
            seed=game_seed,
            log_messages=[{
                "day": 1,
                "action": "init",
                "message": "You awaken on the shores of a remote uncharted island. Your ship has wrecked. You must survive, scavenge materials, and assemble an escape vessel."
            }]
        )
        return state

    @classmethod
    def execute_action(cls, state: GameState, action_id: str) -> StateTransition:
        """Execute an action by ID on the given GameState."""
        action = ActionManager.get_action(action_id)
        if not action:
            return StateTransition(
                action_id=action_id,
                action_name="Unknown Action",
                success=False,
                state_before=state.clone(),
                state_after=state.clone(),
                message=f"Action '{action_id}' does not exist in catalog."
            )

        rng = random.Random(state.seed + str(state.day) + str(state.turn_in_day)) if state.seed else None
        transition = apply_action(state, action, deterministic=False, rng=rng)
        return transition
