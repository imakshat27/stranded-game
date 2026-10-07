"""Database repository for STRANDED.

Provides transactional persistence for game sessions, state histories,
player profiles, and AI benchmark runs.
"""

from typing import Any, Dict, List, Optional
import json
from sqlalchemy.orm import Session
from app.database.models import (
    Game, GameStateRecord, ActionHistoryRecord,
    EventHistoryRecord, PlayerProfileRecord, AlgorithmRunRecord
)
from app.game.state import GameState


class GameRepository:
    """Persistence operations for game entities."""

    @classmethod
    def save_game(cls, db: Session, state: GameState) -> Game:
        """Persist or update a game session and append a historical state record."""
        state_dict = state.model_dump()
        state_json = json.dumps(state_dict)

        game = db.query(Game).filter(Game.id == state.game_id).first()
        if not game:
            game = Game(
                id=state.game_id,
                status=state.game_status,
                current_day=state.day,
                current_state_json=state_json,
                seed=state.seed
            )
            db.add(game)
        else:
            game.status = state.game_status
            game.current_day = state.day
            game.current_state_json = state_json

        # Append historical snapshot
        snapshot = GameStateRecord(
            game_id=state.game_id,
            day=state.day,
            state_json=state_json
        )
        db.add(snapshot)

        # Update or create player profile record
        prof_data = state.player_profile
        profile = db.query(PlayerProfileRecord).filter(PlayerProfileRecord.game_id == state.game_id).first()
        if not profile:
            profile = PlayerProfileRecord(
                game_id=state.game_id,
                exploration_score=prof_data.get("exploration_score", 0.0),
                risk_score=prof_data.get("risk_score", 0.0),
                resource_score=prof_data.get("resource_score", 0.0),
                profile_type=prof_data.get("profile_type", "Balanced"),
                actions_taken=prof_data.get("total_actions", 0),
                profile_data_json=json.dumps(prof_data)
            )
            db.add(profile)
        else:
            profile.exploration_score = prof_data.get("exploration_score", 0.0)
            profile.risk_score = prof_data.get("risk_score", 0.0)
            profile.resource_score = prof_data.get("resource_score", 0.0)
            profile.profile_type = prof_data.get("profile_type", "Balanced")
            profile.actions_taken = prof_data.get("total_actions", 0)
            profile.profile_data_json = json.dumps(prof_data)

        db.commit()
        db.refresh(game)
        return game

    @classmethod
    def get_game(cls, db: Session, game_id: str) -> Optional[GameState]:
        """Retrieve the latest GameState by game ID."""
        game = db.query(Game).filter(Game.id == game_id).first()
        if not game:
            return None
        data = json.loads(str(game.current_state_json))
        return GameState(**data)

    @classmethod
    def record_action(
        cls,
        db: Session,
        game_id: str,
        day: int,
        action: str,
        details: Dict[str, Any],
        state_before: GameState,
        state_after: GameState
    ) -> None:
        rec = ActionHistoryRecord(
            game_id=game_id,
            day=day,
            action=action,
            action_details_json=json.dumps(details),
            state_before_json=json.dumps(state_before.model_dump()),
            state_after_json=json.dumps(state_after.model_dump())
        )
        db.add(rec)
        db.commit()

    @classmethod
    def record_event(
        cls,
        db: Session,
        game_id: str,
        day: int,
        event_id: str,
        event_name: str,
        category: str,
        outcome: Dict[str, Any]
    ) -> None:
        rec = EventHistoryRecord(
            game_id=game_id,
            day=day,
            event_id=event_id,
            event_name=event_name,
            category=category,
            outcome_json=json.dumps(outcome)
        )
        db.add(rec)
        db.commit()

    @classmethod
    def record_algorithm_run(
        cls,
        db: Session,
        game_id: Optional[str],
        algorithm: str,
        nodes_explored: int,
        solution_cost: Optional[float],
        execution_time_ms: float,
        depth: Optional[int],
        result: str
    ) -> None:
        rec = AlgorithmRunRecord(
            game_id=game_id,
            algorithm=algorithm,
            nodes_explored=nodes_explored,
            solution_cost=solution_cost,
            execution_time_ms=execution_time_ms,
            depth=depth,
            result=result
        )
        db.add(rec)
        db.commit()

    @classmethod
    def get_game_history(cls, db: Session, game_id: str) -> Dict[str, Any]:
        """Fetch timeline of states, actions, events and metrics for Recharts."""
        states = db.query(GameStateRecord).filter(GameStateRecord.game_id == game_id).order_by(GameStateRecord.id.asc()).all()
        actions = db.query(ActionHistoryRecord).filter(ActionHistoryRecord.game_id == game_id).order_by(ActionHistoryRecord.id.asc()).all()
        events = db.query(EventHistoryRecord).filter(EventHistoryRecord.game_id == game_id).order_by(EventHistoryRecord.id.asc()).all()
        runs = db.query(AlgorithmRunRecord).filter(AlgorithmRunRecord.game_id == game_id).order_by(AlgorithmRunRecord.id.asc()).all()

        timeline = []
        for s in states:
            s_data = json.loads(str(s.state_json))
            timeline.append({
                "day": s.day,
                "health": s_data.get("health", 0),
                "water": s_data.get("water", 0),
                "food": s_data.get("food", 0),
                "energy": s_data.get("energy", 0),
                "escape_progress": s_data.get("escape_progress", 0),
                "environmental_risk": s_data.get("difficulty_profile", {}).get("environmental_risk", 0.4),
                "resource_scarcity": s_data.get("difficulty_profile", {}).get("resource_scarcity", 0.5)
            })

        return {
            "game_id": game_id,
            "timeline": timeline,
            "action_count": len(actions),
            "event_count": len(events),
            "algorithm_runs": [
                {
                    "algorithm": r.algorithm,
                    "nodes_explored": r.nodes_explored,
                    "solution_cost": r.solution_cost,
                    "execution_time_ms": r.execution_time_ms,
                    "depth": r.depth,
                    "result": r.result
                }
                for r in runs
            ]
        }
