"""API schemas for analytics and knowledge endpoints."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AnalyticsResponseData(BaseModel):
    game_id: str
    survival_days: int
    health_history: List[Dict[str, Any]]
    resource_history: List[Dict[str, Any]]
    player_profile: Dict[str, Any]
    difficulty_profile: Dict[str, Any]
    hints_summary: Dict[str, int]
    algorithm_benchmarks: List[Dict[str, Any]]


class KnowledgeResponseData(BaseModel):
    game_id: str
    active_facts: List[str]
    derived_facts: List[str]
    triggered_rules: List[Dict[str, Any]]
    recommendations: List[str]
    goal_decomposition: Dict[str, Any]
