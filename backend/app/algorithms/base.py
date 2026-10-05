"""Base search problem abstraction and node tracking for STRANDED.

Provides a unified interface enabling BFS, DFS, IDS, UCS, Best-First, and A*
to operate across the identical state space with full step-by-step visual instrumentation.
"""

from typing import Any, Callable, Dict, List, Optional, Set
import time
from pydantic import BaseModel, Field
from app.game.state import GameState
from app.game.actions import Action, ActionManager
from app.game.transitions import apply_action


class SearchNode:
    """A node in the search tree."""
    def __init__(
        self,
        node_id: str,
        state: GameState,
        parent: Optional["SearchNode"] = None,
        action: Optional[Action] = None,
        g_cost: float = 0.0,
        h_cost: float = 0.0,
        depth: int = 0
    ):
        self.node_id = node_id
        self.state = state
        self.parent = parent
        self.action = action
        self.g_cost = g_cost  # Path cost from initial
        self.h_cost = h_cost  # Heuristic estimate to goal
        self.f_cost = g_cost + h_cost
        self.depth = depth

    def path(self) -> List[str]:
        """Reconstruct list of action IDs from root to this node."""
        actions = []
        curr = self
        while curr.parent and curr.action:
            actions.append(curr.action.id)
            curr = curr.parent
        actions.reverse()
        return actions

    def path_nodes(self) -> List["SearchNode"]:
        """Reconstruct path nodes from root to this node."""
        nodes = []
        curr = self
        while curr:
            nodes.append(curr)
            curr = curr.parent
        nodes.reverse()
        return nodes

    def state_signature(self) -> str:
        """Produce a hashable discrete signature for graph cycle/visited detection."""
        parts_tuple = tuple(sorted((k, v) for k, v in self.state.boat_parts.items()))
        # Discretize resources into bands to avoid infinite floating-point state space
        w_band = round(self.state.water / 15.0)
        f_band = round(self.state.food / 15.0)
        e_band = round(self.state.energy / 20.0)
        return f"{self.state.location}:{parts_tuple}:{self.state.wood}:{self.state.rope}:{self.state.metal}:{w_band}:{f_band}:{e_band}:{self.state.shelter_level}"


class SearchResult(BaseModel):
    """Standardized search execution result consumed by API and UI."""
    algorithm: str
    success: bool
    status: str = "COMPLETED"  # COMPLETED, LIMIT_REACHED, NO_SOLUTION
    path: List[str] = Field(default_factory=list)
    action_names: List[str] = Field(default_factory=list)
    cost: float = 0.0
    nodes_explored: int = 0
    max_frontier_size: int = 0
    execution_time_ms: float = 0.0
    depth: int = 0
    tree_nodes: List[Dict[str, Any]] = Field(default_factory=list)
    tree_edges: List[Dict[str, Any]] = Field(default_factory=list)
    visualization_steps: List[Dict[str, Any]] = Field(default_factory=list)


class SearchProblem:
    """Domain search problem encapsulating goals, transitions, costs, and heuristics."""

    def __init__(
        self,
        initial_state: GameState,
        goal_test_fn: Optional[Callable[[GameState], bool]] = None,
        max_depth: int = 25,
        max_nodes: int = 4000
    ):
        self.initial_state = initial_state.clone()
        self.goal_test_fn = goal_test_fn or self.default_goal_test
        self.max_depth = max_depth
        self.max_nodes = max_nodes

    def default_goal_test(self, state: GameState) -> bool:
        """Goal is achieved when escape vessel is fully constructed or launched."""
        return state.escape_ready() or state.game_status == "WON"

    def is_goal(self, state: GameState) -> bool:
        return self.goal_test_fn(state)

    def get_actions(self, state: GameState) -> List[Action]:
        """Generate legal actions from state."""
        if state.is_terminal():
            return []
        actions = ActionManager.get_valid_actions(state)
        # Avoid redundant rest if already full energy
        if state.energy >= 85.0:
            actions = [a for a in actions if a.id != "rest_and_recover"]
        return actions

    def transition(self, state: GameState, action: Action) -> GameState:
        """Deterministic transition for simulation."""
        state_copy = state.clone()
        # Guarantee enough actions remaining during search simulation
        if state_copy.actions_remaining <= 0:
            state_copy.actions_remaining = 2
            state_copy.day += 1

        trans = apply_action(state_copy, action, deterministic=True)
        return trans.state_after

    def step_cost(self, state: GameState, action: Action) -> float:
        """Calculate weighted action cost combining energy, vitals, and risk."""
        base_cost = action.energy_cost if action.energy_cost > 0 else 5.0
        vital_cost = (action.water_cost * 1.2) + (action.food_cost * 1.0)
        risk_penalty = action.risk * 25.0
        return max(1.0, round(base_cost + vital_cost + risk_penalty, 1))

    def heuristic(self, state: GameState) -> float:
        """Admissible heuristic estimating remaining cost to reach escape readiness."""
        if self.is_goal(state):
            return 0.0

        needed_actions = 0.0

        # Unbuilt boat components
        for part, built in state.boat_parts.items():
            if not built:
                needed_actions += 1.0  # Construction action
                if part == "hull":
                    wood_deficit = max(0, 6 - state.wood)
                    needed_actions += wood_deficit / 3.0
                elif part == "rigging":
                    rope_deficit = max(0, 4 - state.rope)
                    needed_actions += rope_deficit * 1.5
                elif part == "rudder":
                    wood_deficit = max(0, 3 - state.wood)
                    metal_deficit = max(0, 2 - state.metal)
                    needed_actions += (wood_deficit / 3.0) + (metal_deficit * 2.0)
                elif part == "provisions":
                    w_deficit = max(0.0, 35.0 - state.water)
                    f_deficit = max(0.0, 35.0 - state.food)
                    needed_actions += (w_deficit / 30.0) + (f_deficit / 25.0)

        # Average action step cost estimate
        return round(needed_actions * 18.0, 1)
