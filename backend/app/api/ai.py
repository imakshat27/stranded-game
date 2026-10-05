"""AI Search, Benchmarking, Planning, Reasoning, and Adversarial Mode endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.repository import GameRepository
from app.game.state import GameState
from app.game.engine import GameEngine
from app.algorithms.base import SearchProblem, SearchResult
from app.algorithms.bfs import breadth_first_search
from app.algorithms.dfs import depth_first_search
from app.algorithms.ids import iterative_deepening_search
from app.algorithms.ucs import uniform_cost_search
from app.algorithms.best_first import best_first_search
from app.algorithms.astar import astar_search
from app.algorithms.hill_climbing import hill_climbing_search
from app.algorithms.minimax import run_minimax, RivalState
from app.algorithms.alpha_beta import run_alpha_beta
from app.planning.planner import StrategicPlanner, StrategicPlan
from app.planning.replanner import Replanner
from app.reasoning.forward_chaining import ForwardChainingEngine
from app.reasoning.backward_chaining import BackwardChainingEngine
from app.probability.bayesian import BayesianEngine
from app.schemas.game import ApiResponse
from app.schemas.ai import (
    SearchRequest, CompareRequest, PlanRequest,
    ReplanRequest, ProbabilityRequest, RivalModeRequest
)

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _resolve_state(req_game_id: str | None, req_state: GameState | None, db: Session) -> GameState:
    """Helper to extract state from DB or request payload, falling back to a fresh session."""
    if req_state:
        return req_state
    if req_game_id:
        found = GameRepository.get_game(db, req_game_id)
        if found:
            return found
    return GameEngine.create_new_game()


@router.post("/search", response_model=ApiResponse)
def execute_search(req: SearchRequest, db: Session = Depends(get_db)):
    """Execute a single search algorithm on a state."""
    state = _resolve_state(req.game_id, req.state, db)
    problem = SearchProblem(initial_state=state, max_depth=req.max_depth, max_nodes=req.max_nodes)

    algo = req.algorithm.lower().replace("-", "_").replace(" ", "_")
    if algo == "bfs":
        res = breadth_first_search(problem, max_nodes=req.max_nodes)
    elif algo == "dfs":
        res = depth_first_search(problem, max_depth=req.max_depth, max_nodes=req.max_nodes)
    elif algo == "ids":
        res = iterative_deepening_search(problem, max_depth=req.max_depth, max_nodes=req.max_nodes)
    elif algo == "ucs":
        res = uniform_cost_search(problem, max_nodes=req.max_nodes)
    elif algo in ("best_first", "greedy"):
        res = best_first_search(problem, max_nodes=req.max_nodes)
    elif algo in ("hill_climbing", "hc"):
        res = hill_climbing_search(problem, max_steps=req.max_depth)
    else:  # default to A*
        res = astar_search(problem, max_nodes=req.max_nodes)

    # Persist benchmark run if associated with a game session
    if req.game_id:
        GameRepository.record_algorithm_run(
            db,
            game_id=req.game_id,
            algorithm=res.algorithm,
            nodes_explored=res.nodes_explored,
            solution_cost=res.cost,
            execution_time_ms=res.execution_time_ms,
            depth=res.depth,
            result=res.status
        )

    return ApiResponse(success=True, data=res.model_dump())


@router.post("/search/visualize", response_model=ApiResponse)
def visualize_search(req: SearchRequest, db: Session = Depends(get_db)):
    """Return step-by-step search progression nodes and edges for React Flow animation."""
    state = _resolve_state(req.game_id, req.state, db)
    problem = SearchProblem(initial_state=state, max_depth=req.max_depth, max_nodes=req.max_nodes)

    algo = req.algorithm.lower()
    if algo == "bfs":
        res = breadth_first_search(problem, max_nodes=req.max_nodes)
    elif algo == "dfs":
        res = depth_first_search(problem, max_depth=req.max_depth, max_nodes=req.max_nodes)
    elif algo == "ucs":
        res = uniform_cost_search(problem, max_nodes=req.max_nodes)
    elif algo in ("best_first", "greedy"):
        res = best_first_search(problem, max_nodes=req.max_nodes)
    else:
        res = astar_search(problem, max_nodes=req.max_nodes)

    return ApiResponse(
        success=True,
        data={
            "algorithm": res.algorithm,
            "success": res.success,
            "status": res.status,
            "steps": res.visualization_steps,
            "tree_nodes": res.tree_nodes,
            "tree_edges": res.tree_edges,
            "path": res.path,
            "action_names": res.action_names,
            "nodes_explored": res.nodes_explored,
            "cost": res.cost,
            "depth": res.depth,
            "execution_time_ms": res.execution_time_ms
        }
    )


@router.post("/compare", response_model=ApiResponse)
def compare_algorithms(req: CompareRequest, db: Session = Depends(get_db)):
    """Run BFS, DFS, IDS, UCS, Best-First, and A* on the identical state space and return comparative metrics."""
    state = _resolve_state(req.game_id, req.state, db)

    results = []
    # 1. BFS
    prob_bfs = SearchProblem(initial_state=state, max_depth=req.max_depth, max_nodes=req.max_nodes)
    r_bfs = breadth_first_search(prob_bfs, max_nodes=req.max_nodes)
    results.append({
        "algorithm": "BFS",
        "nodes_explored": r_bfs.nodes_explored,
        "cost": r_bfs.cost,
        "depth": r_bfs.depth,
        "execution_time_ms": r_bfs.execution_time_ms,
        "max_frontier": r_bfs.max_frontier_size,
        "success": r_bfs.success,
        "result": r_bfs.status,
        "completeness": "Yes",
        "optimality": "Shallowest Path"
    })

    # 2. DFS
    prob_dfs = SearchProblem(initial_state=state, max_depth=req.max_depth, max_nodes=req.max_nodes)
    r_dfs = depth_first_search(prob_dfs, max_depth=req.max_depth, max_nodes=req.max_nodes)
    results.append({
        "algorithm": "DFS",
        "nodes_explored": r_dfs.nodes_explored,
        "cost": r_dfs.cost,
        "depth": r_dfs.depth,
        "execution_time_ms": r_dfs.execution_time_ms,
        "max_frontier": r_dfs.max_frontier_size,
        "success": r_dfs.success,
        "result": r_dfs.status,
        "completeness": "No (Depth-Bounded)",
        "optimality": "No"
    })

    # 3. IDS
    prob_ids = SearchProblem(initial_state=state, max_depth=req.max_depth, max_nodes=req.max_nodes)
    r_ids = iterative_deepening_search(prob_ids, max_depth=req.max_depth, max_nodes=req.max_nodes)
    results.append({
        "algorithm": "IDS",
        "nodes_explored": r_ids.nodes_explored,
        "cost": r_ids.cost,
        "depth": r_ids.depth,
        "execution_time_ms": r_ids.execution_time_ms,
        "max_frontier": r_ids.max_frontier_size,
        "success": r_ids.success,
        "result": r_ids.status,
        "completeness": "Yes",
        "optimality": "Shallowest Path"
    })

    # 4. UCS
    prob_ucs = SearchProblem(initial_state=state, max_depth=req.max_depth, max_nodes=req.max_nodes)
    r_ucs = uniform_cost_search(prob_ucs, max_nodes=req.max_nodes)
    results.append({
        "algorithm": "UCS",
        "nodes_explored": r_ucs.nodes_explored,
        "cost": r_ucs.cost,
        "depth": r_ucs.depth,
        "execution_time_ms": r_ucs.execution_time_ms,
        "max_frontier": r_ucs.max_frontier_size,
        "success": r_ucs.success,
        "result": r_ucs.status,
        "completeness": "Yes",
        "optimality": "Cost Optimal"
    })

    # 5. Best-First
    prob_bf = SearchProblem(initial_state=state, max_depth=req.max_depth, max_nodes=req.max_nodes)
    r_bf = best_first_search(prob_bf, max_nodes=req.max_nodes)
    results.append({
        "algorithm": "Best First",
        "nodes_explored": r_bf.nodes_explored,
        "cost": r_bf.cost,
        "depth": r_bf.depth,
        "execution_time_ms": r_bf.execution_time_ms,
        "max_frontier": r_bf.max_frontier_size,
        "success": r_bf.success,
        "result": r_bf.status,
        "completeness": "No (Greedy)",
        "optimality": "No"
    })

    # 6. A*
    prob_astar = SearchProblem(initial_state=state, max_depth=req.max_depth, max_nodes=req.max_nodes)
    r_astar = astar_search(prob_astar, max_nodes=req.max_nodes)
    results.append({
        "algorithm": "A*",
        "nodes_explored": r_astar.nodes_explored,
        "cost": r_astar.cost,
        "depth": r_astar.depth,
        "execution_time_ms": r_astar.execution_time_ms,
        "max_frontier": r_astar.max_frontier_size,
        "success": r_astar.success,
        "result": r_astar.status,
        "completeness": "Yes",
        "optimality": "Cost Optimal (Admissible Heuristic)"
    })

    return ApiResponse(
        success=True,
        data={
            "comparison_table": results,
            "benchmark_summary": {
                "fastest_algorithm": min(results, key=lambda x: x["execution_time_ms"])["algorithm"],
                "least_nodes_explored": min(results, key=lambda x: x["nodes_explored"])["algorithm"],
                "lowest_cost": min(results, key=lambda x: x["cost"] if x["cost"] > 0 else 9999)["algorithm"]
            }
        }
    )


@router.post("/plan", response_model=ApiResponse)
def generate_strategic_plan(req: PlanRequest, db: Session = Depends(get_db)):
    """Generate a multi-step strategic construction and escape plan."""
    state = _resolve_state(req.game_id, req.state, db)
    plan = StrategicPlanner.generate_plan(state)
    return ApiResponse(success=True, data=plan.model_dump())


@router.post("/replan", response_model=ApiResponse)
def replan(req: ReplanRequest, db: Session = Depends(get_db)):
    """Evaluate plan validity against current state and replan if interrupted."""
    state = _resolve_state(req.game_id, req.state, db)

    # If simulation requested: simulate storm destruction of wood or health damage
    if req.simulate_storm_damage:
        state.wood = max(0, state.wood - 4)
        state.health = max(15.0, state.health - 25.0)
        state.weather = "stormy"

    plan = StrategicPlan(**req.current_plan) if req.current_plan else StrategicPlanner.generate_plan(state)
    replan_res = Replanner.check_and_replan(state, plan)
    return ApiResponse(success=True, data=replan_res.to_dict())


@router.post("/reason", response_model=ApiResponse)
def run_reasoning(req: PlanRequest, db: Session = Depends(get_db)):
    """Execute Forward Chaining inferences and Backward Chaining goal breakdown."""
    state = _resolve_state(req.game_id, req.state, db)
    forward_res = ForwardChainingEngine.infer(state)
    backward_res = BackwardChainingEngine.decompose_escape_goal(state)

    return ApiResponse(
        success=True,
        data={
            "forward_chaining": forward_res,
            "backward_chaining": backward_res
        }
    )


@router.post("/probability", response_model=ApiResponse)
def compute_probability(req: ProbabilityRequest, db: Session = Depends(get_db)):
    """Execute Bayesian belief network update for storms or shipwreck salvage."""
    state = _resolve_state(req.game_id, req.state, db)
    if req.scenario == "salvage":
        res = BayesianEngine.get_salvage_probability(state, req.observed_signals)
    else:
        res = BayesianEngine.get_storm_forecast(state, req.observed_signals)

    return ApiResponse(success=True, data=res)


@router.post("/rival", response_model=ApiResponse)
def run_rival_mode(req: RivalModeRequest):
    """Run Minimax or Alpha-Beta pruning in Rival Survivor Adversarial Mode."""
    state = RivalState()
    if req.player_action:
        # Apply player's chosen action first
        state = apply_rival_action(state, req.player_action)

    if req.algorithm == "minimax":
        res = run_minimax(state, depth=req.depth)
    else:
        res = run_alpha_beta(state, depth=req.depth)

    return ApiResponse(success=True, data=res)
