"""Unit tests for BFS, DFS, IDS, UCS, Best-First, A*, Hill Climbing, Minimax & Alpha-Beta."""

import pytest
from app.game.engine import GameEngine
from app.algorithms.base import SearchProblem
from app.algorithms.bfs import breadth_first_search
from app.algorithms.dfs import depth_first_search
from app.algorithms.ids import iterative_deepening_search
from app.algorithms.ucs import uniform_cost_search
from app.algorithms.best_first import best_first_search
from app.algorithms.astar import astar_search
from app.algorithms.hill_climbing import hill_climbing_search
from app.algorithms.minimax import run_minimax, RivalState
from app.algorithms.alpha_beta import run_alpha_beta


@pytest.fixture
def near_hull_state():
    """State where player already has 6 wood and sufficient energy to build hull."""
    state = GameEngine.create_new_game(seed="deterministic_search_seed")
    state.wood = 8
    state.energy = 80
    return state


def test_bfs_finds_solution(near_hull_state):
    problem = SearchProblem(
        initial_state=near_hull_state,
        goal_test_fn=lambda s: s.boat_parts["hull"] is True,
        max_depth=5,
        max_nodes=200
    )
    res = breadth_first_search(problem)
    assert res.success is True
    assert "build_boat_hull" in res.path
    assert res.nodes_explored >= 1


def test_dfs_finds_solution(near_hull_state):
    problem = SearchProblem(
        initial_state=near_hull_state,
        goal_test_fn=lambda s: s.boat_parts["hull"] is True,
        max_depth=5,
        max_nodes=200
    )
    res = depth_first_search(problem)
    assert res.success is True
    assert "build_boat_hull" in res.path


def test_ids_finds_solution(near_hull_state):
    problem = SearchProblem(
        initial_state=near_hull_state,
        goal_test_fn=lambda s: s.boat_parts["hull"] is True,
        max_depth=5,
        max_nodes=300
    )
    res = iterative_deepening_search(problem)
    assert res.success is True
    assert "build_boat_hull" in res.path


def test_ucs_finds_solution(near_hull_state):
    problem = SearchProblem(
        initial_state=near_hull_state,
        goal_test_fn=lambda s: s.boat_parts["hull"] is True,
        max_depth=5,
        max_nodes=200
    )
    res = uniform_cost_search(problem)
    assert res.success is True
    assert "build_boat_hull" in res.path
    assert res.cost > 0


def test_best_first_finds_solution(near_hull_state):
    problem = SearchProblem(
        initial_state=near_hull_state,
        goal_test_fn=lambda s: s.boat_parts["hull"] is True,
        max_depth=5,
        max_nodes=200
    )
    res = best_first_search(problem)
    assert res.success is True
    assert "build_boat_hull" in res.path


def test_astar_finds_solution(near_hull_state):
    problem = SearchProblem(
        initial_state=near_hull_state,
        goal_test_fn=lambda s: s.boat_parts["hull"] is True,
        max_depth=5,
        max_nodes=200
    )
    res = astar_search(problem)
    assert res.success is True
    assert "build_boat_hull" in res.path
    assert len(res.visualization_steps) > 0


def test_hill_climbing(near_hull_state):
    problem = SearchProblem(
        initial_state=near_hull_state,
        goal_test_fn=lambda s: s.boat_parts["hull"] is True,
        max_depth=10,
        max_nodes=50
    )
    res = hill_climbing_search(problem, max_steps=10)
    assert res.nodes_explored > 0
    assert len(res.path) >= 0


def test_minimax_and_alpha_beta():
    state = RivalState(round_num=1)
    res_mm = run_minimax(state, depth=2)
    res_ab = run_alpha_beta(state, depth=2)

    assert res_mm["best_action"] is not None
    assert res_ab["best_action"] is not None
    # Alpha-Beta must yield the identical game-theoretic value
    assert res_mm["best_value"] == res_ab["best_value"]
    # Alpha-Beta explores <= nodes than plain Minimax
    assert res_ab["nodes_explored"] <= res_mm["nodes_explored"]
