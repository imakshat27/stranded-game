"""Greedy Best-First Search implementation for STRANDED.

Selects the next node solely by the heuristic estimate h(n) to rapidly
converge toward the escape goal.
"""

import heapq
from typing import Dict, List, Set, Tuple
import time
from app.algorithms.base import SearchProblem, SearchNode, SearchResult
from app.game.actions import ActionManager


def best_first_search(problem: SearchProblem, max_nodes: int = 1500) -> SearchResult:
    """Execute Greedy Best-First Search prioritized on heuristic h(n)."""
    start_time = time.time()
    h_root = problem.heuristic(problem.initial_state)
    root = SearchNode(
        node_id="S0",
        state=problem.initial_state,
        g_cost=0.0,
        h_cost=h_root,
        depth=0
    )

    if problem.is_goal(root.state):
        return SearchResult(
            algorithm="Best First",
            success=True,
            status="COMPLETED",
            path=[],
            cost=0.0,
            nodes_explored=1,
            max_frontier_size=1,
            execution_time_ms=(time.time() - start_time) * 1000.0,
            depth=0
        )

    counter = 0
    pq: List[Tuple[float, int, SearchNode]] = [(h_root, counter, root)]
    visited: Set[str] = {root.state_signature()}
    explored_count = 0
    max_frontier = 1
    node_counter = 0

    tree_nodes: List[Dict] = [{
        "id": root.node_id,
        "label": f"Root (h={round(h_root, 1)})",
        "depth": 0,
        "g_cost": 0.0,
        "is_goal": False
    }]
    tree_edges: List[Dict] = []
    vis_steps: List[Dict] = []

    while pq:
        max_frontier = max(max_frontier, len(pq))
        curr_h, _, current = heapq.heappop(pq)
        explored_count += 1

        if len(vis_steps) < 40 or explored_count % 10 == 0:
            vis_steps.append({
                "step": explored_count,
                "current_node": current.node_id,
                "h_cost": round(current.h_cost, 1),
                "depth": current.depth,
                "frontier": [item[2].node_id for item in pq[:8]],
                "explored_count": explored_count,
                "action": current.action.name if current.action else "Root"
            })

        if problem.is_goal(current.state):
            path_actions = current.path()
            act_names = [act.name for a in path_actions if (act := ActionManager.get_action(a))]
            exec_time = (time.time() - start_time) * 1000.0
            return SearchResult(
                algorithm="Best First",
                success=True,
                status="COMPLETED",
                path=path_actions,
                action_names=act_names,
                cost=round(current.g_cost, 1),
                nodes_explored=explored_count,
                max_frontier_size=max_frontier,
                execution_time_ms=round(exec_time, 2),
                depth=current.depth,
                tree_nodes=tree_nodes[:60],
                tree_edges=tree_edges[:60],
                visualization_steps=vis_steps
            )

        if explored_count >= max_nodes or current.depth >= problem.max_depth:
            continue

        for action in problem.get_actions(current.state):
            next_state = problem.transition(current.state, action)
            step_c = problem.step_cost(current.state, action)
            h_val = problem.heuristic(next_state)
            node_counter += 1
            child_id = f"S{node_counter}"

            child = SearchNode(
                node_id=child_id,
                state=next_state,
                parent=current,
                action=action,
                g_cost=current.g_cost + step_c,
                h_cost=h_val,
                depth=current.depth + 1
            )

            sig = child.state_signature()
            if sig not in visited:
                visited.add(sig)
                counter += 1
                heapq.heappush(pq, (h_val, counter, child))

                if len(tree_nodes) < 60:
                    tree_nodes.append({
                        "id": child_id,
                        "label": f"{action.name} (h={round(h_val, 1)})",
                        "depth": child.depth,
                        "g_cost": round(child.g_cost, 1),
                        "is_goal": problem.is_goal(next_state)
                    })
                    tree_edges.append({
                        "id": f"e-{current.node_id}-{child_id}",
                        "source": current.node_id,
                        "target": child_id,
                        "label": action.id
                    })

    exec_time = (time.time() - start_time) * 1000.0
    return SearchResult(
        algorithm="Best First",
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
