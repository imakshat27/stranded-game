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
    iteration_label: str,
    tree_nodes: Optional[List[Dict]] = None,
    tree_edges: Optional[List[Dict]] = None
) -> Tuple[Optional[SearchNode], bool]:
    """Recursive Depth-Limited Search helper. Returns (goal_node, cutoff_occurred)."""
    if explored_tracker[0] >= max_nodes:
        return None, True
    explored_tracker[0] += 1

    if explored_tracker[0] <= max_nodes:
        act_label = node.action.name if node.action else "Base Camp (Start)"
        vis_steps.append({
            "step": explored_tracker[0],
            "iteration": iteration_label,
            "current_node": node.node_id,
            "depth": node.depth,
            "limit": limit,
            "action": act_label,
            "step_narrative": f"IDS iteration ({iteration_label}): evaluating '{act_label}' at Depth {node.depth}/{limit}."
        })

    if problem.is_goal(node.state):
        return node, False

    if node.depth >= limit:
        return None, True  # Cutoff

    if explored_tracker[0] >= max_nodes:
        return None, False

    cutoff = False
    for action in problem.get_actions(node.state):
        if explored_tracker[0] >= max_nodes:
            return None, True
        next_state = problem.transition(node.state, action)
        step_c = problem.step_cost(node.state, action)
        child = SearchNode(
            node_id=f"{node.node_id}-{action.id}",
            state=next_state,
            parent=node,
            action=action,
            g_cost=node.g_cost + step_c,
            depth=node.depth + 1
        )

        if tree_nodes is not None and len(tree_nodes) < max_nodes * 15 + 1 and not any(tn["id"] == child.node_id for tn in tree_nodes):
            tree_nodes.append(child.to_tree_node_dict(is_goal=problem.is_goal(next_state), step_cost=step_c))
            if tree_edges is not None:
                tree_edges.append({
                    "id": f"e-{node.node_id}-{child.node_id}",
                    "source": node.node_id,
                    "target": child.node_id,
                    "label": f"{action.name} (+{round(step_c, 1)})"
                })

        sig = child.state_signature()
        if sig not in visited:
            visited.add(sig)
            result, child_cutoff = depth_limited_search(
                problem, child, limit, visited, explored_tracker, max_nodes, vis_steps, iteration_label,
                tree_nodes, tree_edges
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

    tree_nodes: List[Dict] = [root.to_tree_node_dict(is_goal=problem.is_goal(root.state))]
    tree_edges: List[Dict] = []

    for depth_limit in range(1, max_depth + 1):
        visited: Set[str] = {root.state_signature()}
        iteration_label = f"Depth Limit {depth_limit}"

        goal_node, cutoff = depth_limited_search(
            problem, root, depth_limit, visited, total_explored, max_nodes, vis_steps, iteration_label,
            tree_nodes, tree_edges
        )

        if goal_node:
            path_actions = goal_node.path()
            act_names = [act.name for a in path_actions if (act := ActionManager.get_action(a))]
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
                tree_nodes=tree_nodes,
                tree_edges=tree_edges,
                visualization_steps=vis_steps
            )

        if not cutoff or total_explored[0] >= max_nodes:
            break

    exec_time = (time.time() - start_time) * 1000.0
    return SearchResult(
        algorithm="IDS",
        success=False,
        status="LIMIT_REACHED" if total_explored[0] >= max_nodes or cutoff else "NO_SOLUTION",
        path=[],
        cost=0.0,
        nodes_explored=total_explored[0],
        max_frontier_size=max_depth,
        execution_time_ms=round(exec_time, 2),
        depth=0,
        tree_nodes=tree_nodes,
        tree_edges=tree_edges,
        visualization_steps=vis_steps
    )
