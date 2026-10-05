"""Uniform Cost Search (UCS) implementation for STRANDED.

Expands nodes in order of cumulative path cost g(n) using a priority queue,
guaranteeing cost-optimal survival and escape strategies.
"""

import heapq
from typing import Dict, List, Set, Tuple
import time
from app.algorithms.base import SearchProblem, SearchNode, SearchResult
from app.game.actions import ActionManager


def uniform_cost_search(problem: SearchProblem, max_nodes: int = 1500) -> SearchResult:
    """Execute Uniform Cost Search using a priority queue on g_cost."""
    start_time = time.time()
    root = SearchNode(
        node_id="S0",
        state=problem.initial_state,
        g_cost=0.0,
        depth=0
    )

    if problem.is_goal(root.state):
        return SearchResult(
            algorithm="UCS",
            success=True,
            status="COMPLETED",
            path=[],
            cost=0.0,
            nodes_explored=1,
            max_frontier_size=1,
            execution_time_ms=(time.time() - start_time) * 1000.0,
            depth=0
        )

    # Priority queue: entries are (g_cost, counter, SearchNode)
    counter = 0
    pq: List[Tuple[float, int, SearchNode]] = [(0.0, counter, root)]
    visited_costs: Dict[str, float] = {root.state_signature(): 0.0}
    explored_count = 0
    max_frontier = 1
    node_counter = 0

    tree_nodes: List[Dict] = [root.to_tree_node_dict(is_goal=problem.is_goal(root.state))]
    tree_edges: List[Dict] = []
    vis_steps: List[Dict] = []

    while pq:
        max_frontier = max(max_frontier, len(pq))
        curr_cost, _, current = heapq.heappop(pq)
        explored_count += 1

        if len(vis_steps) < 45 or explored_count % 10 == 0:
            act_label = current.action.name if current.action else "Base Camp (Start)"
            vis_steps.append({
                "step": explored_count,
                "current_node": current.node_id,
                "g_cost": round(current.g_cost, 1),
                "depth": current.depth,
                "frontier": [item[2].node_id for item in pq[:8]],
                "explored_count": explored_count,
                "action": act_label,
                "step_narrative": f"UCS exploring '{act_label}' (Node {current.node_id}, Path Cost g={round(current.g_cost, 1)}). Lowest cost in queue."
            })

        if problem.is_goal(current.state):
            path_actions = current.path()
            act_names = [act.name for a in path_actions if (act := ActionManager.get_action(a))]
            exec_time = (time.time() - start_time) * 1000.0
            return SearchResult(
                algorithm="UCS",
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
            new_g = current.g_cost + step_c
            node_counter += 1
            child_id = f"S{node_counter}"

            child = SearchNode(
                node_id=child_id,
                state=next_state,
                parent=current,
                action=action,
                g_cost=new_g,
                depth=current.depth + 1
            )

            sig = child.state_signature()
            if sig not in visited_costs or new_g < visited_costs[sig]:
                visited_costs[sig] = new_g
                counter += 1
                heapq.heappush(pq, (new_g, counter, child))

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
        algorithm="UCS",
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
