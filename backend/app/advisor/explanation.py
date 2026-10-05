"""AI Explanation generator for STRANDED Survival Advisor.

Formats transparent AI decision rationales with positive supporting factors
and negative risk trade-offs.
"""

from typing import List
from pydantic import BaseModel, Field


class HintExplanation(BaseModel):
    recommended_action_id: str
    recommended_action_name: str
    summary: str
    supporting_factors: List[str] = Field(default_factory=list)
    negative_factors: List[str] = Field(default_factory=list)
    strategic_objective: str
    hints_remaining: int
    cooldown_turns: int
