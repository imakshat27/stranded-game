"""Analytics and telemetry endpoints for STRANDED."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.repository import GameRepository
from app.adaptation.player_profile import PlayerProfiler
from app.adaptation.difficulty import DifficultyController
from app.schemas.game import ApiResponse

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/{game_id}", response_model=ApiResponse)
def get_analytics(game_id: str, db: Session = Depends(get_db)):
    """Retrieve summarized analytics for a session."""
    state = GameRepository.get_game(db, game_id)
    if not state:
        return ApiResponse(
            success=False,
            error={"code": "GAME_NOT_FOUND", "message": f"Game session '{game_id}' not found."}
        )

    behavior = PlayerProfiler.evaluate(state)
    diff_vector = DifficultyController.get_difficulty_vector(state)

    return ApiResponse(
        success=True,
        data={
            "game_id": game_id,
            "day": state.day,
            "status": state.game_status,
            "vitals": {
                "health": state.health,
                "water": state.water,
                "food": state.food,
                "energy": state.energy
            },
            "inventory": {
                "wood": state.wood,
                "rope": state.rope,
                "metal": state.metal,
                "tools": state.tools
            },
            "escape_progress": state.escape_progress,
            "player_profile": state.player_profile,
            "behavior_metrics": behavior.model_dump(),
            "difficulty_profile": diff_vector,
            "hints": {
                "remaining": state.hints_remaining,
                "used": state.hints_used,
                "earned": state.hints_earned,
                "cooldown": state.hint_cooldown
            }
        }
    )


@router.get("/{game_id}/history", response_model=ApiResponse)
def get_analytics_history(game_id: str, db: Session = Depends(get_db)):
    """Retrieve chronological history timeline for Recharts visualization."""
    history = GameRepository.get_game_history(db, game_id)
    return ApiResponse(success=True, data=history)
