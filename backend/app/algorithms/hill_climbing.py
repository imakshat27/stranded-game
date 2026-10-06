"""Hill Climbing local search implementation for STRANDED.

Evaluates local neighboring action transitions and advances along the steepest
heuristic gradient toward survival stability and escape.
"""

from typing import Dict, List, Optional
import time
from app.algorithms.base import SearchProblem, SearchNode, SearchResult
from app.game.actions import ActionManager


def evaluate_state_utility(state) -> float:
    """Higher score means more advantageous state (vitally secure + progress made)."""
    if state.game_status == "WON":
        return 1000.0
    if state.health <= 0 or state.game_status == "LOST":
        return -1000.0

    vital_score = (state.health * 1.5) + state.water + state.food + (state.energy * 0.8)
    progress_score = (state.escape_progress * 5.0) + (state.wood * 4.0) + (state.rope * 8.0) + (state.metal * 10.0)
    shelter_score = state.shelter_level * 15.0
    return vital_score + progress_score + shelter_score


def hill_climbing_search(problem: SearchProblem, max_steps: int = 30) -> SearchResult:
    """Execute Steepest-Ascent Hill Climbing search."""
    start_time = time.time()
    current = SearchNode(
        node_id="S0",
        state=problem.initial_state,
        g_cost=0.0,
        depth=0
    )

    path_actions = []
    vis_steps: List[Dict] = []
    tree_nodes: List[Dict] = [current.to_tree_node_dict(is_goal=problem.is_goal(current.state))]
    tree_edges: List[Dict] = []
    step_count = 0
    total_explored = 1

    while step_count < max_steps and total_explored < problem.max_nodes:
        step_count += 1
        current_utility = evaluate_state_utility(current.state)

        if problem.is_goal(current.state):
            act_names = [act.name for a in path_actions if (act := ActionManager.get_action(a))]
            exec_time = (time.time() - start_time) * 1000.0
            return SearchResult(
                algorithm="Hill Climbing",
                success=True,
                status="COMPLETED",
                path=path_actions,
                action_names=act_names,
                cost=round(current.g_cost, 1),
                nodes_explored=total_explored,
                max_frontier_size=1,
                execution_time_ms=round(exec_time, 2),
                depth=step_count,
                tree_nodes=tree_nodes,
                tree_edges=tree_edges,
                visualization_steps=vis_steps
            )

        neighbors = []
        for action in problem.get_actions(current.state):
            if total_explored >= problem.max_nodes:
                break
            total_explored += 1
            next_state = problem.transition(current.state, action)
            utility = evaluate_state_utility(next_state)
            neighbors.append((utility, action, next_state))

        if not neighbors:
            break

        # Steepest ascent: select neighbor with maximum utility
        neighbors.sort(key=lambda x: x[0], reverse=True)
        best_util, best_action, best_next_state = neighbors[0]

        vis_steps.append({
            "step": step_count,
            "current_node": current.node_id,
            "current_utility": round(current_utility, 1),
            "best_neighbor_utility": round(best_util, 1),
            "chosen_action": best_action.name,
            "action": best_action.name
        })

        # If best neighbor is not strictly better -> local optimum / plateau reached
        if best_util <= current_utility:
            break

        step_cost = problem.step_cost(current.state, best_action)
        child_id = f"S{step_count}"
        child = SearchNode(
            node_id=child_id,
            state=best_next_state,
            parent=current,
            action=best_action,
            g_cost=current.g_cost + step_cost,
            depth=current.depth + 1
        )

        tree_nodes.append(child.to_tree_node_dict(is_goal=problem.is_goal(best_next_state), step_cost=step_cost))
        tree_edges.append({
            "id": f"e-{current.node_id}-{child_id}",
            "source": current.node_id,
            "target": child_id,
            "label": f"{best_action.name} (+{round(step_cost, 1)})"
        })

        path_actions.append(best_action.id)
        current = child

    exec_time = (time.time() - start_time) * 1000.0
    act_names = [act.name for a in path_actions if (act := ActionManager.get_action(a))]
    return SearchResult(
        algorithm="Hill Climbing",
        success=problem.is_goal(current.state),
        status=("COMPLETED" if problem.is_goal(current.state) else "LIMIT_REACHED" if total_explored >= problem.max_nodes or step_count >= max_steps else "LOCAL_OPTIMUM"),
        path=path_actions,
        action_names=act_names,
        cost=round(current.g_cost, 1),
        nodes_explored=total_explored,
        max_frontier_size=1,
        execution_time_ms=round(exec_time, 2),
        depth=step_count,
        tree_nodes=tree_nodes,
        tree_edges=tree_edges,
        visualization_steps=vis_steps
    )
