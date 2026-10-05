"""Knowledge Base and Propositional Reasoning API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.repository import GameRepository
from app.reasoning.facts import extract_facts
from app.reasoning.rules import DEFAULT_RULES
from app.reasoning.forward_chaining import ForwardChainingEngine
from app.reasoning.backward_chaining import BackwardChainingEngine
from app.schemas.game import ApiResponse

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("/{game_id}", response_model=ApiResponse)
def get_full_knowledge_state(game_id: str, db: Session = Depends(get_db)):
    """Retrieve active facts, fired rules, inferred recommendations, and backward goal tree."""
    state = GameRepository.get_game(db, game_id)
    if not state:
        return ApiResponse(
            success=False,
            error={"code": "GAME_NOT_FOUND", "message": f"Game session '{game_id}' not found."}
        )

    fwd = ForwardChainingEngine.infer(state)
    bwd = BackwardChainingEngine.decompose_escape_goal(state)

    return ApiResponse(
        success=True,
        data={
            "game_id": game_id,
            "forward_chaining": fwd,
            "backward_chaining": bwd
        }
    )


@router.get("/{game_id}/facts", response_model=ApiResponse)
def get_active_facts(game_id: str, db: Session = Depends(get_db)):
    """Retrieve only the propositional facts deduced from current state."""
    state = GameRepository.get_game(db, game_id)
    if not state:
        return ApiResponse(
            success=False,
            error={"code": "GAME_NOT_FOUND", "message": f"Game session '{game_id}' not found."}
        )

    facts = extract_facts(state)
    return ApiResponse(
        success=True,
        data={
            "game_id": game_id,
            "facts": list(facts)
        }
    )


@router.get("/{game_id}/rules", response_model=ApiResponse)
def get_rules_catalog(game_id: str):
    """Retrieve full catalog of inference rules and triggered status."""
    return ApiResponse(
        success=True,
        data={
            "rules": [r.model_dump() for r in DEFAULT_RULES]
        }
    )
