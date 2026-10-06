"""API schemas for AI Search, Comparison, Planning, Replanning, and Probability."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.game.state import GameState


class SearchRequest(BaseModel):
    game_id: Optional[str] = None
    state: Optional[GameState] = None
    algorithm: str = "astar"  # astar, bfs, dfs, ids, ucs, best_first, hill_climbing
    max_depth: int = Field(default=15, ge=1, le=30)
    max_nodes: int = Field(default=1500, ge=1, le=4000)


class CompareRequest(BaseModel):
    game_id: Optional[str] = None
    state: Optional[GameState] = None
    algorithms: Optional[List[str]] = Field(default_factory=lambda: ["bfs", "dfs", "ids", "ucs", "best_first", "astar"])
    max_depth: int = Field(default=12, ge=1, le=30)
    max_nodes: int = Field(default=1000, ge=1, le=4000)
    include_traces: bool = False


class PlanRequest(BaseModel):
    game_id: Optional[str] = None
    state: Optional[GameState] = None


class ReplanRequest(BaseModel):
    game_id: Optional[str] = None
    state: Optional[GameState] = None
    current_plan: Optional[Dict[str, Any]] = None
    simulate_storm_damage: bool = False


class ProbabilityRequest(BaseModel):
    game_id: Optional[str] = None
    state: Optional[GameState] = None
    scenario: str = "storm"  # storm or salvage
    observed_signals: Optional[List[str]] = None


class RivalModeRequest(BaseModel):
    algorithm: str = "alpha_beta"  # minimax or alpha_beta
    depth: int = 3
    player_action: Optional[str] = None
