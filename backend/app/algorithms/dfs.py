"""Depth-First Search (DFS) implementation for STRANDED.

Explores deep strategic paths along survival branches, contrasting with BFS breadth.
"""

from typing import Dict, List, Set
import time
from app.algorithms.base import SearchProblem, SearchNode, SearchResult
from app.game.actions import ActionManager


def depth_first_search(problem: SearchProblem, max_depth: int = 15, max_nodes: int = 1500) -> SearchResult:
    """Execute Depth-First Search up to specified maximum depth."""
    start_time = time.time()
    root = SearchNode(
        node_id="S0",
        state=problem.initial_state,
        g_cost=0.0,
        depth=0
    )

    if problem.is_goal(root.state):
        return SearchResult(
            algorithm="DFS",
            success=True,
            status="COMPLETED",
            path=[],
            cost=0.0,
            nodes_explored=1,
            max_frontier_size=1,
            execution_time_ms=(time.time() - start_time) * 1000.0,
            depth=0
        )

    stack: List[SearchNode] = [root]
    visited: Set[str] = {root.state_signature()}
    explored_count = 0
    max_frontier = 1
    node_counter = 0

    tree_nodes: List[Dict] = [root.to_tree_node_dict(is_goal=problem.is_goal(root.state))]
    tree_edges: List[Dict] = []
    vis_steps: List[Dict] = []

    while stack:
        max_frontier = max(max_frontier, len(stack))
        current = stack.pop()
        explored_count += 1

        if len(vis_steps) < 45 or explored_count % 10 == 0:
            act_label = current.action.name if current.action else "Base Camp (Start)"
            vis_steps.append({
                "step": explored_count,
                "current_node": current.node_id,
                "depth": current.depth,
                "frontier": [n.node_id for n in stack[-8:]],
                "explored_count": explored_count,
                "action": act_label,
                "step_narrative": f"DFS deeply exploring '{act_label}' at Depth {current.depth}. LIFO branch traversal."
            })

        if problem.is_goal(current.state):
            path_actions = current.path()
            act_names = [act.name for a in path_actions if (act := ActionManager.get_action(a))]
            exec_time = (time.time() - start_time) * 1000.0
            return SearchResult(
                algorithm="DFS",
                success=True,
                status="COMPLETED",
                path=path_actions,
                action_names=act_names,
                cost=current.g_cost,
                nodes_explored=explored_count,
                max_frontier_size=max_frontier,
                execution_time_ms=round(exec_time, 2),
                depth=current.depth,
                tree_nodes=tree_nodes[:60],
                tree_edges=tree_edges[:60],
                visualization_steps=vis_steps
            )

        if explored_count >= max_nodes or current.depth >= max_depth:
            continue

        for action in reversed(problem.get_actions(current.state)):
            next_state = problem.transition(current.state, action)
            step_c = problem.step_cost(current.state, action)
            node_counter += 1
            child_id = f"S{node_counter}"

            child = SearchNode(
                node_id=child_id,
                state=next_state,
                parent=current,
                action=action,
                g_cost=current.g_cost + step_c,
                depth=current.depth + 1
            )

            sig = child.state_signature()
            if sig not in visited:
                visited.add(sig)
                stack.append(child)

                if len(tree_nodes) < 70:
                    tree_nodes.append(child.to_tree_node_dict(is_goal=problem.is_goal(next_state), step_cost=step_c))
                    tree_edges.append({
                        "id": f"e-{current.node_id}-{child_id}",
                        "source": current.node_id,
                        "target": child_id,
                        "label": f"{action.name} (+{round(step_c, 1)})"
                    })

    exec_time = (time.time() - start_time) * 1000.0
    return SearchResult(
        algorithm="DFS",
        success=False,
        status="LIMIT_REACHED" if explored_count >= max_nodes else "NO_SOLUTION",
        path=[],
        cost=0.0,
        nodes_explored=explored_count,
        max_frontier_size=max_frontier,
        execution_time_ms=round(exec_time, 2),
        depth=0,
        tree_nodes=tree_nodes[:60],
        tree_edges=tree_edges[:60],
        visualization_steps=vis_steps
    )
