"""Iterative Deepening Search (IDS) implementation for STRANDED.

Combines the space efficiency of DFS with the completeness and optimality of BFS
by performing successive depth-limited searches.
"""

from typing import Dict, List, Optional, Set, Tuple
import time
from app.algorithms.base import SearchProblem, SearchNode, SearchResult
from app.game.actions import ActionManager


def depth_limited_search(
    problem: SearchProblem,
    node: SearchNode,
    limit: int,
    visited: Set[str],
    explored_tracker: List[int],
    max_nodes: int,
    vis_steps: List[Dict],
    iteration_label: str
) -> Tuple[Optional[SearchNode], bool]:
    """Recursive Depth-Limited Search helper. Returns (goal_node, cutoff_occurred)."""
    explored_tracker[0] += 1

    if len(vis_steps) < 40 and explored_tracker[0] % 4 == 0:
        vis_steps.append({
            "step": explored_tracker[0],
            "iteration": iteration_label,
            "current_node": node.node_id,
            "depth": node.depth,
            "limit": limit,
            "action": node.action.name if node.action else "Root"
        })

    if problem.is_goal(node.state):
        return node, False

    if node.depth >= limit:
        return None, True  # Cutoff

    if explored_tracker[0] >= max_nodes:
        return None, False

    cutoff = False
    for action in problem.get_actions(node.state):
        next_state = problem.transition(node.state, action)
        child = SearchNode(
            node_id=f"{node.node_id}-{action.id[:3]}",
            state=next_state,
            parent=node,
            action=action,
            g_cost=node.g_cost + problem.step_cost(node.state, action),
            depth=node.depth + 1
        )
        sig = child.state_signature()
        if sig not in visited:
            visited.add(sig)
            result, child_cutoff = depth_limited_search(
                problem, child, limit, visited, explored_tracker, max_nodes, vis_steps, iteration_label
            )
            visited.remove(sig)
            if result is not None:
                return result, False
            if child_cutoff:
                cutoff = True

    return None, cutoff


def iterative_deepening_search(problem: SearchProblem, max_depth: int = 15, max_nodes: int = 2500) -> SearchResult:
    """Execute Iterative Deepening Search."""
    start_time = time.time()
    total_explored = [0]
    vis_steps: List[Dict] = []
    node_counter = 0

    root = SearchNode(
        node_id="S0",
        state=problem.initial_state,
        g_cost=0.0,
        depth=0
    )

    if problem.is_goal(root.state):
        return SearchResult(
            algorithm="IDS",
            success=True,
            status="COMPLETED",
            path=[],
            cost=0.0,
            nodes_explored=1,
            max_frontier_size=1,
            execution_time_ms=(time.time() - start_time) * 1000.0,
            depth=0
        )

    for depth_limit in range(1, max_depth + 1):
        visited: Set[str] = {root.state_signature()}
        iteration_label = f"Depth Limit {depth_limit}"

        goal_node, cutoff = depth_limited_search(
            problem, root, depth_limit, visited, total_explored, max_nodes, vis_steps, iteration_label
        )

        if goal_node:
            path_actions = goal_node.path()
            act_names = [ActionManager.get_action(a).name for a in path_actions if ActionManager.get_action(a)]
            exec_time = (time.time() - start_time) * 1000.0
            return SearchResult(
                algorithm="IDS",
                success=True,
                status="COMPLETED",
                path=path_actions,
                action_names=act_names,
                cost=goal_node.g_cost,
                nodes_explored=total_explored[0],
                max_frontier_size=depth_limit + 1,
                execution_time_ms=round(exec_time, 2),
                depth=goal_node.depth,
                visualization_steps=vis_steps
            )

        if not cutoff or total_explored[0] >= max_nodes:
            break

    exec_time = (time.time() - start_time) * 1000.0
    return SearchResult(
        algorithm="IDS",
        success=False,
        status="LIMIT_REACHED" if total_explored[0] >= max_nodes else "NO_SOLUTION",
        path=[],
        cost=0.0,
        nodes_explored=total_explored[0],
        max_frontier_size=max_depth,
        execution_time_ms=round(exec_time, 2),
        depth=0,
        visualization_steps=vis_steps
    )
