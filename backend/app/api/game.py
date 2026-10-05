"""Game lifecycle and gameplay API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.repository import GameRepository
from app.game.engine import GameEngine
from app.game.actions import ActionManager
from app.advisor.advisor import SurvivalAdvisor
from app.schemas.game import ApiResponse, StartGameRequest, ActionRequest

router = APIRouter(prefix="/api/game", tags=["game"])


@router.post("/start", response_model=ApiResponse)
def start_game(req: StartGameRequest = StartGameRequest(), db: Session = Depends(get_db)):
    """Initialize a new survival game session."""
    try:
        new_state = GameEngine.create_new_game(seed=req.seed)
        GameRepository.save_game(db, new_state)
        return ApiResponse(
            success=True,
            data={
                "state": new_state.model_dump(),
                "valid_actions": [a.model_dump() for a in ActionManager.get_valid_actions(new_state)]
            }
        )
    except Exception as e:
        return ApiResponse(
            success=False,
            error={"code": "START_GAME_FAILED", "message": str(e)}
        )


@router.get("/{game_id}", response_model=ApiResponse)
def get_game_state(game_id: str, db: Session = Depends(get_db)):
    """Retrieve current game state for a given session ID."""
    state = GameRepository.get_game(db, game_id)
    if not state:
        return ApiResponse(
            success=False,
            error={"code": "GAME_NOT_FOUND", "message": f"Game session '{game_id}' not found."}
        )
    return ApiResponse(
        success=True,
        data={
            "state": state.model_dump(),
            "valid_actions": [a.model_dump() for a in ActionManager.get_valid_actions(state)]
        }
    )


@router.post("/{game_id}/action", response_model=ApiResponse)
def perform_action(game_id: str, req: ActionRequest, db: Session = Depends(get_db)):
    """Apply an action to the active game session."""
    state = GameRepository.get_game(db, game_id)
    if not state:
        return ApiResponse(
            success=False,
            error={"code": "GAME_NOT_FOUND", "message": f"Game session '{game_id}' not found."}
        )

    transition = GameEngine.execute_action(state, req.action_id)
    if not transition.success:
        return ApiResponse(
            success=False,
            data={"state": state.model_dump()},
            error={"code": "INVALID_ACTION", "message": transition.message}
        )

    # Persist updated state and record action
    GameRepository.save_game(db, transition.state_after)
    action_obj = ActionManager.get_action(req.action_id)
    GameRepository.record_action(
        db,
        game_id=game_id,
        day=transition.state_before.day,
        action=req.action_id,
        details=action_obj.model_dump() if action_obj else {},
        state_before=transition.state_before,
        state_after=transition.state_after
    )

    if transition.event_occurred:
        GameRepository.record_event(
            db,
            game_id=game_id,
            day=transition.state_after.day,
            event_id=transition.event_occurred.get("id", "event"),
            event_name=transition.event_occurred.get("name", "Event"),
            category=transition.event_occurred.get("category", "SURVIVAL"),
            outcome=transition.event_occurred
        )

    return ApiResponse(
        success=True,
        data={
            "transition": transition.model_dump(),
            "state": transition.state_after.model_dump(),
            "valid_actions": [a.model_dump() for a in ActionManager.get_valid_actions(transition.state_after)]
        }
    )


@router.post("/{game_id}/hint", response_model=ApiResponse)
def request_hint(game_id: str, db: Session = Depends(get_db)):
    """Request an AI Survival Assistant recommendation."""
    state = GameRepository.get_game(db, game_id)
    if not state:
        return ApiResponse(
            success=False,
            error={"code": "GAME_NOT_FOUND", "message": f"Game session '{game_id}' not found."}
        )

    hint_exp, err = SurvivalAdvisor.generate_hint(state)
    if err or not hint_exp:
        return ApiResponse(
            success=False,
            error={"code": "HINT_UNAVAILABLE", "message": err or "Failed to generate hint."}
        )

    # Save state with decremented hint counter and active cooldown
    GameRepository.save_game(db, state)

    return ApiResponse(
        success=True,
        data={
            "hint": hint_exp.model_dump(),
            "state": state.model_dump()
        }
    )


@router.post("/{game_id}/restart", response_model=ApiResponse)
def restart_game(game_id: str, db: Session = Depends(get_db)):
    """Reset the session to day 1."""
    new_state = GameEngine.create_new_game()
    new_state.game_id = game_id  # Reuse same ID
    GameRepository.save_game(db, new_state)
    return ApiResponse(
        success=True,
        data={
            "state": new_state.model_dump(),
            "valid_actions": [a.model_dump() for a in ActionManager.get_valid_actions(new_state)]
        }
    )
