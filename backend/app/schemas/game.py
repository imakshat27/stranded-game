"""API request and response schemas for game endpoints."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.game.state import GameState


class ApiResponse(BaseModel):
    """Canonical API envelope."""
    success: bool
    data: Optional[Any] = None
    error: Optional[Dict[str, str]] = None


class StartGameRequest(BaseModel):
    seed: Optional[str] = None


class ActionRequest(BaseModel):
    action_id: str


class HintResponseData(BaseModel):
    hint: Dict[str, Any]
    state: GameState
