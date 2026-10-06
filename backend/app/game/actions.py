"""Action model and registry for STRANDED.

Defines first-class actions with preconditions, resource costs, risk ratings,
and state transformation effects.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.core.config import ConfigLoader
from app.game.state import GameState


class Action(BaseModel):
    """First-class action schema."""
    id: str
    name: str
    description: str
    category: str  # SURVIVAL, EXPLORATION, CRAFTING, ESCAPE, REST
    energy_cost: float = 15.0
    water_cost: float = 5.0
    food_cost: float = 5.0
    risk: float = 0.1
    prerequisites: Dict[str, Any] = Field(default_factory=dict)
    effects: Dict[str, Any] = Field(default_factory=dict)
    escape_progress: float = 0.0
    tags: List[str] = Field(default_factory=list)


class ActionManager:
    """Manages the catalog of actions and prerequisite validation."""
    _actions_cache: Optional[Dict[str, Action]] = None

    @classmethod
    def get_all_actions(cls) -> Dict[str, Action]:
        if cls._actions_cache is None:
            raw_actions = ConfigLoader.get_actions()
            cls._actions_cache = {item["id"]: Action(**item) for item in raw_actions}
        return cls._actions_cache

    @classmethod
    def get_action(cls, action_id: str) -> Optional[Action]:
        return cls.get_all_actions().get(action_id)

    @classmethod
    def is_action_valid(cls, state: GameState, action: Action) -> tuple[bool, Optional[str]]:
        """Validate if an action can be performed given current state."""
        if state.is_terminal():
            return False, f"Game is already {state.game_status}"

        if state.actions_remaining <= 0:
            return False, "No actions remaining for today. Day transition needed."

        # Vital energy requirement
        if action.energy_cost > 0 and state.energy < action.energy_cost:
            return False, f"Insufficient energy (requires {action.energy_cost:.0f}, current {state.energy:.0f})"

        # Vital water/food requirement if cost is strictly enforced
        if action.water_cost > 0 and state.water < (action.water_cost * 0.5):
            return False, f"Critically low water to attempt this action (current {state.water:.0f})"

        # Check preconditions dictionary
        prereqs = action.prerequisites
        if "min_energy" in prereqs and state.energy < prereqs["min_energy"]:
            return False, f"Requires at least {prereqs['min_energy']} energy"

        if "min_water" in prereqs and state.water < prereqs["min_water"]:
            return False, f"Requires at least {prereqs['min_water']} water"

        if "min_food" in prereqs and state.food < prereqs["min_food"]:
            return False, f"Requires at least {prereqs['min_food']} food"

        if "min_wood" in prereqs and state.wood < prereqs["min_wood"]:
            return False, f"Requires {prereqs['min_wood']} wood (current: {state.wood})"

        if "min_rope" in prereqs and state.rope < prereqs["min_rope"]:
            return False, f"Requires {prereqs['min_rope']} rope (current: {state.rope})"

        if "min_metal" in prereqs and state.metal < prereqs["min_metal"]:
            return False, f"Requires {prereqs['min_metal']} metal (current: {state.metal})"

        if "min_tools" in prereqs and state.tools < prereqs["min_tools"]:
            return False, f"Requires at least {prereqs['min_tools']} tools"

        if "max_shelter_level" in prereqs and state.shelter_level >= prereqs["max_shelter_level"]:
            return False, "Shelter is already at maximum fortification level"

        if "discovered_locations" in prereqs:
            for loc in prereqs["discovered_locations"]:
                if loc not in state.discovered_locations:
                    return False, f"Must discover location '{loc}' first"

        if "boat_component_missing" in prereqs:
            comp = prereqs["boat_component_missing"]
            if state.boat_parts.get(comp, False):
                return False, f"Boat component '{comp}' is already built"

        if prereqs.get("escape_ready") is True:
            if not state.escape_ready():
                return False, "All boat components (hull, rigging, rudder, provisions) must be completed first"

        return True, None

    @classmethod
    def get_action_options(cls, state: GameState) -> List[Dict[str, Any]]:
        """Expose the full catalog with authoritative availability for the HUD."""
        options = []
        for action in cls.get_all_actions().values():
            available, reason = cls.is_action_valid(state, action)
            options.append({
                "action": action.model_dump(),
                "available": available,
                "unavailable_reason": reason,
            })
        return options

    @classmethod
    def get_valid_actions(cls, state: GameState) -> List[Action]:
        """Returns all actions that can legally be taken from the current state."""
        valid: List[Action] = []
        for action in cls.get_all_actions().values():
            is_valid, _ = cls.is_action_valid(state, action)
            if is_valid:
                valid.append(action)
        return valid
