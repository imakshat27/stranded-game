"""Minimax game-tree search for Rival Survivor Adversarial Mode.

Models competitive island survival where the player (MAX) and an AI rival survivor (MIN)
vie for scarce freshwater streams, tidal timber, and ship salvage.
"""

from typing import Any, Dict, List, Optional, Tuple
import time
from pydantic import BaseModel, Field


class RivalState(BaseModel):
    """Adversarial survival state between Player and Rival Survivor."""
    turn: str = "MAX"  # "MAX" (Player) or "MIN" (Rival)
    round_num: int = 1
    player_health: float = 80.0
    player_water: float = 60.0
    player_food: float = 60.0
    player_materials: int = 2
    player_boat_progress: float = 0.0

    rival_health: float = 80.0
    rival_water: float = 60.0
    rival_food: float = 60.0
    rival_materials: int = 2
    rival_boat_progress: float = 0.0

    # Shared island pool
    island_water_reserve: float = 50.0
    island_salvage_cache: int = 6

    def is_terminal(self) -> bool:
        return (
            self.player_health <= 0 or self.rival_health <= 0 or
            self.player_boat_progress >= 100.0 or self.rival_boat_progress >= 100.0 or
            self.round_num > 10
        )

    def evaluate(self) -> float:
        """Utility evaluation function from Player (MAX) perspective."""
        if self.player_boat_progress >= 100.0:
            return 500.0
        if self.rival_boat_progress >= 100.0:
            return -500.0
        if self.rival_health <= 0:
            return 400.0
        if self.player_health <= 0:
            return -400.0

        p_score = (self.player_health * 1.0) + (self.player_water * 0.8) + (self.player_food * 0.8) + (self.player_materials * 15.0) + (self.player_boat_progress * 3.0)
        r_score = (self.rival_health * 1.0) + (self.rival_water * 0.8) + (self.rival_food * 0.8) + (self.rival_materials * 15.0) + (self.rival_boat_progress * 3.0)
        return round(p_score - r_score, 1)


class RivalAction(BaseModel):
    id: str
    name: str
    description: str


RIVAL_ACTIONS = [
    RivalAction(id="claim_spring", name="Secure Water Spring", description="Drink and secure freshwater reserve before the rival."),
    RivalAction(id="salvage_wreck", name="Scavenge Ship Salvage", description="Raid the shoreline flotsam for timber and metal."),
    RivalAction(id="build_vessel", name="Work on Escape Vessel", description="Convert collected salvage into catamaran components."),
    RivalAction(id="rest_and_guard", name="Fortify & Rest", description="Rest under shelter to heal and safeguard collected supplies.")
]


def apply_rival_action(state: RivalState, action_id: str) -> RivalState:
    """Transition state for rival survivor mode."""
    s = state.model_copy(deep=True)
    is_max = (s.turn == "MAX")

    if action_id == "claim_spring":
        gained = min(s.island_water_reserve, 25.0)
        s.island_water_reserve = max(0.0, s.island_water_reserve - gained)
        if is_max:
            s.player_water = min(100.0, s.player_water + gained)
        else:
            s.rival_water = min(100.0, s.rival_water + gained)

    elif action_id == "salvage_wreck":
        salv = min(s.island_salvage_cache, 2)
        s.island_salvage_cache = max(0, s.island_salvage_cache - salv)
        if is_max:
            s.player_materials += salv
            s.player_health = max(0.0, s.player_health - 5.0)
        else:
            s.rival_materials += salv
            s.rival_health = max(0.0, s.rival_health - 5.0)

    elif action_id == "build_vessel":
        if is_max and s.player_materials >= 2:
            s.player_materials -= 2
            s.player_boat_progress = min(100.0, s.player_boat_progress + 25.0)
        elif not is_max and s.rival_materials >= 2:
            s.rival_materials -= 2
            s.rival_boat_progress = min(100.0, s.rival_boat_progress + 25.0)

    elif action_id == "rest_and_guard":
        if is_max:
            s.player_health = min(100.0, s.player_health + 15.0)
        else:
            s.rival_health = min(100.0, s.rival_health + 15.0)

    # Alternate turn
    if s.turn == "MAX":
        s.turn = "MIN"
    else:
        s.turn = "MAX"
        s.round_num += 1

    return s


def minimax(
    state: RivalState,
    depth: int,
    is_maximizing: bool,
    node_id: str,
    nodes_tracker: List[int],
    tree_nodes: List[Dict],
    tree_edges: List[Dict]
) -> Tuple[float, Optional[str]]:
    """Recursive Minimax algorithm constructing visualization game tree."""
    nodes_tracker[0] += 1

    if depth == 0 or state.is_terminal():
        val = state.evaluate()
        if len(tree_nodes) < 50:
            tree_nodes.append({
                "id": node_id,
                "label": f"Eval: {val}",
                "value": val,
                "is_max": is_maximizing,
                "depth": depth
            })
        return val, None

    best_action = None

    if is_maximizing:
        max_eval = float("-inf")
        for i, act in enumerate(RIVAL_ACTIONS):
            child_id = f"{node_id}-M{i}"
            next_state = apply_rival_action(state, act.id)
            eval_val, _ = minimax(next_state, depth - 1, False, child_id, nodes_tracker, tree_nodes, tree_edges)

            if len(tree_edges) < 50:
                tree_edges.append({
                    "id": f"e-{node_id}-{child_id}",
                    "source": node_id,
                    "target": child_id,
                    "label": act.id
                })

            if eval_val > max_eval:
                max_eval = eval_val
                best_action = act.id

        if len(tree_nodes) < 50:
            tree_nodes.append({
                "id": node_id,
                "label": f"MAX (U={max_eval})",
                "value": max_eval,
                "is_max": True,
                "depth": depth
            })
        return max_eval, best_action

    else:
        min_eval = float("inf")
        for i, act in enumerate(RIVAL_ACTIONS):
            child_id = f"{node_id}-R{i}"
            next_state = apply_rival_action(state, act.id)
            eval_val, _ = minimax(next_state, depth - 1, True, child_id, nodes_tracker, tree_nodes, tree_edges)

            if len(tree_edges) < 50:
                tree_edges.append({
                    "id": f"e-{node_id}-{child_id}",
                    "source": node_id,
                    "target": child_id,
                    "label": act.id
                })

            if eval_val < min_eval:
                min_eval = eval_val
                best_action = act.id

        if len(tree_nodes) < 50:
            tree_nodes.append({
                "id": node_id,
                "label": f"MIN (U={min_eval})",
                "value": min_eval,
                "is_max": False,
                "depth": depth
            })
        return min_eval, best_action


def run_minimax(initial_state: Optional[RivalState] = None, depth: int = 3) -> Dict[str, Any]:
    """Execute Minimax decision process for rival mode."""
    start_time = time.time()
    state = initial_state or RivalState()
    nodes_tracker = [0]
    tree_nodes: List[Dict] = []
    tree_edges: List[Dict] = []

    best_val, best_action = minimax(state, depth, True, "Root", nodes_tracker, tree_nodes, tree_edges)
    exec_time = (time.time() - start_time) * 1000.0

    return {
        "algorithm": "Minimax",
        "best_action": best_action,
        "best_value": best_val,
        "nodes_explored": nodes_tracker[0],
        "depth": depth,
        "execution_time_ms": round(exec_time, 2),
        "tree_nodes": tree_nodes,
        "tree_edges": tree_edges
    }
