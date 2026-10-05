"""Search and Optimization Algorithms package."""

from app.algorithms.base import SearchProblem, SearchNode, SearchResult
from app.algorithms.bfs import breadth_first_search
from app.algorithms.dfs import depth_first_search
from app.algorithms.ids import iterative_deepening_search
from app.algorithms.ucs import uniform_cost_search
from app.algorithms.best_first import best_first_search
from app.algorithms.astar import astar_search
from app.algorithms.hill_climbing import hill_climbing_search
from app.algorithms.minimax import run_minimax, RivalState
from app.algorithms.alpha_beta import run_alpha_beta

__all__ = [
    "SearchProblem",
    "SearchNode",
    "SearchResult",
    "breadth_first_search",
    "depth_first_search",
    "iterative_deepening_search",
    "uniform_cost_search",
    "best_first_search",
    "astar_search",
    "hill_climbing_search",
    "run_minimax",
    "run_alpha_beta",
    "RivalState",
]
