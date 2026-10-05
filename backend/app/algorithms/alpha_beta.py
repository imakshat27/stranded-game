"""Alpha-Beta Pruning implementation for Rival Survivor Adversarial Mode.

Prunes suboptimal game tree subtrees while preserving optimal minimax decision values.
"""

from typing import Any, Dict, List, Optional, Tuple
import time
from app.algorithms.minimax import RivalState, RIVAL_ACTIONS, apply_rival_action


def alpha_beta_minimax(
    state: RivalState,
    depth: int,
    alpha: float,
    beta: float,
    is_maximizing: bool,
    node_id: str,
    tracker: Dict[str, int],
    tree_nodes: List[Dict],
    tree_edges: List[Dict]
) -> Tuple[float, Optional[str]]:
    """Minimax with Alpha-Beta pruning."""
    tracker["nodes_explored"] += 1

    if depth == 0 or state.is_terminal():
        val = state.evaluate()
        if len(tree_nodes) < 50:
            tree_nodes.append({
                "id": node_id,
                "label": f"Eval: {val}",
                "value": val,
                "is_max": is_maximizing,
                "depth": depth,
                "pruned": False
            })
        return val, None

    best_action = None

    if is_maximizing:
        max_eval = float("-inf")
        for i, act in enumerate(RIVAL_ACTIONS):
            child_id = f"{node_id}-M{i}"
            next_state = apply_rival_action(state, act.id)

            eval_val, _ = alpha_beta_minimax(
                next_state, depth - 1, alpha, beta, False, child_id, tracker, tree_nodes, tree_edges
            )

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

            alpha = max(alpha, eval_val)
            if beta <= alpha:
                tracker["pruned_branches"] += 1
                break  # Beta cut-off

        if len(tree_nodes) < 50:
            tree_nodes.append({
                "id": node_id,
                "label": f"MAX (U={max_eval}, α={round(alpha,1)})",
                "value": max_eval,
                "is_max": True,
                "depth": depth,
                "pruned": False
            })
        return max_eval, best_action

    else:
        min_eval = float("inf")
        for i, act in enumerate(RIVAL_ACTIONS):
            child_id = f"{node_id}-R{i}"
            next_state = apply_rival_action(state, act.id)

            eval_val, _ = alpha_beta_minimax(
                next_state, depth - 1, alpha, beta, True, child_id, tracker, tree_nodes, tree_edges
            )

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

            beta = min(beta, eval_val)
            if beta <= alpha:
                tracker["pruned_branches"] += 1
                break  # Alpha cut-off

        if len(tree_nodes) < 50:
            tree_nodes.append({
                "id": node_id,
                "label": f"MIN (U={min_eval}, β={round(beta,1)})",
                "value": min_eval,
                "is_max": False,
                "depth": depth,
                "pruned": False
            })
        return min_eval, best_action


def run_alpha_beta(initial_state: Optional[RivalState] = None, depth: int = 3) -> Dict[str, Any]:
    """Execute Alpha-Beta pruning search."""
    start_time = time.time()
    state = initial_state or RivalState()
    tracker = {"nodes_explored": 0, "pruned_branches": 0}
    tree_nodes: List[Dict] = []
    tree_edges: List[Dict] = []

    best_val, best_action = alpha_beta_minimax(
        state, depth, float("-inf"), float("inf"), True, "Root", tracker, tree_nodes, tree_edges
    )
    exec_time = (time.time() - start_time) * 1000.0

    return {
        "algorithm": "Alpha-Beta Pruning",
        "best_action": best_action,
        "best_value": best_val,
        "nodes_explored": tracker["nodes_explored"],
        "pruned_branches": tracker["pruned_branches"],
        "depth": depth,
        "execution_time_ms": round(exec_time, 2),
        "tree_nodes": tree_nodes,
        "tree_edges": tree_edges
    }
