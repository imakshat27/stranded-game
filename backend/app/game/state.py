"""Canonical GameState model for STRANDED.

Represents the complete logical state of the player and environment at any turn.
Designed to be serializable, immutable during search, and validated via Pydantic.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import copy


class GameState(BaseModel):
    """Canonical game state schema."""
    game_id: str
    day: int = 1
    actions_remaining: int = 2
    turn_in_day: int = 1

    # Vital resources
    health: float = Field(default=100.0, ge=0.0, le=100.0)
    water: float = Field(default=80.0, ge=0.0, le=100.0)
    food: float = Field(default=75.0, ge=0.0, le=100.0)
    energy: float = Field(default=90.0, ge=0.0, le=100.0)

    # Base & shelter
    shelter_level: int = Field(default=0, ge=0, le=4)

    # Inventory materials
    wood: int = Field(default=2, ge=0)
    rope: int = Field(default=0, ge=0)
    metal: int = Field(default=0, ge=0)
    tools: int = Field(default=0, ge=0)

    # Escape progression
    escape_progress: float = Field(default=0.0, ge=0.0, le=100.0)
    boat_parts: Dict[str, bool] = Field(default_factory=lambda: {
        "hull": False,
        "rigging": False,
        "rudder": False,
        "provisions": False
    })

    # Location & environment
    location: str = "base_camp"
    weather: str = "clear"  # clear, cloudy, rainy, stormy
    discovered_locations: List[str] = Field(default_factory=lambda: ["base_camp", "freshwater_stream"])
    active_effects: List[str] = Field(default_factory=list)
    current_objective: str = "Scout island and gather materials to construct an escape vessel"

    # AI Hint system constraints
    hints_remaining: int = 3
    hint_cooldown: int = 0
    hints_used: int = 0
    hints_earned: int = 0

    # Behavioral & adaptive systems
    player_profile: Dict[str, Any] = Field(default_factory=lambda: {
        "profile_type": "Balanced",
        "exploration_score": 0.5,
        "risk_score": 0.3,
        "resource_score": 0.5,
        "total_actions": 0,
        "exploration_actions": 0,
        "risky_actions": 0,
        "rest_actions": 0,
        "crafting_actions": 0
    })

    difficulty_profile: Dict[str, float] = Field(default_factory=lambda: {
        "resource_scarcity": 0.5,
        "environmental_risk": 0.4,
        "exploration_risk": 0.45,
        "escape_complexity": 0.5
    })

    # Game status & narrative
    game_status: str = "ACTIVE"  # ACTIVE, WON, LOST
    status_reason: Optional[str] = None
    seed: Optional[str] = None
    recent_events: List[str] = Field(default_factory=list)
    log_messages: List[Dict[str, Any]] = Field(default_factory=list)

    def is_terminal(self) -> bool:
        """Check if game state has reached win or loss."""
        return self.game_status in ("WON", "LOST") or self.health <= 0

    def clone(self) -> "GameState":
        """Produce an exact deep-copied clone for AI search exploration."""
        return copy.deepcopy(self)

    def escape_ready(self) -> bool:
        """Check if all boat parts are built and vessel is ready for launch."""
        return all(self.boat_parts.values())


class StateTransition(BaseModel):
    """Result of applying an action to a GameState."""
    action_id: str
    action_name: str
    success: bool
    state_before: GameState
    state_after: GameState
    event_occurred: Optional[Dict[str, Any]] = None
    resource_changes: Dict[str, float] = Field(default_factory=dict)
    message: str
    day_advanced: bool = False
