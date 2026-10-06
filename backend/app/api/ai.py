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
from app.algorithms.minimax import run_minimax, RivalState, apply_rival_action
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


def _run_search(algorithm: str, state: GameState, max_depth: int, max_nodes: int) -> SearchResult:
    name = algorithm.lower().replace("-", "_").replace(" ", "_")
    problem = SearchProblem(initial_state=state, max_depth=max_depth, max_nodes=max_nodes)
    if name == "bfs":
        return breadth_first_search(problem, max_nodes=max_nodes)
    if name == "dfs":
        return depth_first_search(problem, max_depth=max_depth, max_nodes=max_nodes)
    if name == "ids":
        return iterative_deepening_search(problem, max_depth=max_depth, max_nodes=max_nodes)
    if name == "ucs":
        return uniform_cost_search(problem, max_nodes=max_nodes)
    if name in ("best_first", "greedy"):
        return best_first_search(problem, max_nodes=max_nodes)
    if name in ("hill_climbing", "hc"):
        return hill_climbing_search(problem, max_steps=min(max_depth, max_nodes))
    if name == "astar":
        return astar_search(problem, max_nodes=max_nodes)
    raise ValueError(f"Unknown search algorithm: {algorithm}")


def run_search(algorithm: str, state: GameState, max_depth: int, max_nodes: int) -> SearchResult:
    result = _run_search(algorithm, state, max_depth, max_nodes)
    if not result.tree_nodes:
        from app.algorithms.base import SearchNode
        result.tree_nodes = [SearchNode("S0", state.clone()).to_tree_node_dict(is_goal=state.escape_ready())]
    if not result.visualization_steps:
        result.visualization_steps = [{"step": 1, "current_node": result.tree_nodes[0]["id"], "explored_count": result.nodes_explored}]
    return result


@router.post("/search", response_model=ApiResponse)
def execute_search(req: SearchRequest, db: Session = Depends(get_db)):
    """Execute a single search algorithm on a state."""
    state = _resolve_state(req.game_id, req.state, db)
    try:
        res = run_search(req.algorithm, state, req.max_depth, req.max_nodes)
    except ValueError as exc:
        return ApiResponse(success=False, error={"code": "INVALID_ALGORITHM", "message": str(exc)})

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
    try:
        res = run_search(req.algorithm, state, req.max_depth, req.max_nodes)
    except ValueError as exc:
        return ApiResponse(success=False, error={"code": "INVALID_ALGORITHM", "message": str(exc)})

    return ApiResponse(
        success=True,
        data={
            "algorithm": res.algorithm,
            "success": res.success,
            "status": res.status,
            "steps": res.visualization_steps,
            "visualization_steps": res.visualization_steps,
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
    """Compare recorded traversals from one immutable scenario and equal budgets."""
    state = _resolve_state(req.game_id, req.state, db).clone()
    results = []
    traces = {}
    for name in dict.fromkeys(req.algorithms or ["bfs", "dfs", "ids", "ucs", "best_first", "astar"]):
        try:
            result = run_search(name, state, req.max_depth, req.max_nodes)
        except ValueError as exc:
            return ApiResponse(success=False, error={"code": "INVALID_ALGORITHM", "message": str(exc)})
        results.append({
            "algorithm": result.algorithm, "nodes_explored": result.nodes_explored,
            "cost": result.cost, "depth": result.depth,
            "route_length": len(result.path) if result.success else None,
            "execution_time_ms": result.execution_time_ms,
            "max_frontier": result.max_frontier_size, "success": result.success,
            "result": result.status,
            "completeness": "Subject to search limits",
            "optimality": "No guarantee under bounded search",
        })
        if req.include_traces:
            traces[name] = result.model_dump()
    solved = [r for r in results if r["success"]]
    return ApiResponse(success=True, data={
        "comparison_table": results,
        "benchmark_summary": {
            "fastest_algorithm": min(solved, key=lambda r: r["execution_time_ms"])["algorithm"] if solved else None,
            "least_nodes_explored": min(solved, key=lambda r: r["nodes_explored"])["algorithm"] if solved else None,
            "lowest_cost": min(solved, key=lambda r: r["cost"])["algorithm"] if solved else None,
        },
        "traces": traces,
        "limits": {"max_nodes": req.max_nodes, "max_depth": req.max_depth},
    })


@router.post("/plan", response_model=ApiResponse)
def generate_strategic_plan(req: PlanRequest, db: Session = Depends(get_db)):
    """Generate a multi-step strategic construction and escape plan."""
    state = _resolve_state(req.game_id, req.state, db)
    plan = StrategicPlanner.generate_plan(state)
    return ApiResponse(success=True, data=plan.model_dump())


@router.post("/replan", response_model=ApiResponse)
def replan(req: ReplanRequest, db: Session = Depends(get_db)):
    """Evaluate plan validity against current state and replan if interrupted."""
    state = _resolve_state(req.game_id, req.state, db).clone()

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
