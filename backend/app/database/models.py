"""SQLAlchemy database models for STRANDED.

Stores game sessions, state snapshots, actions, events, player behavioral profiles,
and AI algorithm benchmark metrics.
"""

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional
from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Game(Base):
    __tablename__ = "games"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE", index=True)  # ACTIVE, WON, LOST, ABANDONED
    current_day: Mapped[int] = mapped_column(Integer, default=1)
    current_state_json: Mapped[str] = mapped_column(Text, nullable=False)
    seed: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationships
    states: Mapped[List["GameStateRecord"]] = relationship("GameStateRecord", back_populates="game", cascade="all, delete-orphan")
    action_history: Mapped[List["ActionHistoryRecord"]] = relationship("ActionHistoryRecord", back_populates="game", cascade="all, delete-orphan")
    event_history: Mapped[List["EventHistoryRecord"]] = relationship("EventHistoryRecord", back_populates="game", cascade="all, delete-orphan")
    profile: Mapped[Optional["PlayerProfileRecord"]] = relationship("PlayerProfileRecord", back_populates="game", uselist=False, cascade="all, delete-orphan")
    algorithm_runs: Mapped[List["AlgorithmRunRecord"]] = relationship("AlgorithmRunRecord", back_populates="game", cascade="all, delete-orphan")


class GameStateRecord(Base):
    __tablename__ = "game_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    state_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    game: Mapped["Game"] = relationship("Game", back_populates="states")


class ActionHistoryRecord(Base):
    __tablename__ = "action_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    action_details_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    state_before_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    state_after_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    game: Mapped["Game"] = relationship("Game", back_populates="action_history")


class EventHistoryRecord(Base):
    __tablename__ = "event_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    event_id: Mapped[str] = mapped_column(String(64), nullable=False)
    event_name: Mapped[str] = mapped_column(String(128), nullable=False)
    category: Mapped[str] = mapped_column(String(64), nullable=False)
    outcome_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    game: Mapped["Game"] = relationship("Game", back_populates="event_history")


class PlayerProfileRecord(Base):
    __tablename__ = "player_profiles"

    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id", ondelete="CASCADE"), primary_key=True)
    exploration_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    resource_score: Mapped[float] = mapped_column(Float, default=0.0)
    profile_type: Mapped[str] = mapped_column(String(32), default="Balanced")
    actions_taken: Mapped[int] = mapped_column(Integer, default=0)
    profile_data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    game: Mapped["Game"] = relationship("Game", back_populates="profile")


class AlgorithmRunRecord(Base):
    __tablename__ = "algorithm_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    game_id: Mapped[str] = mapped_column(String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    algorithm: Mapped[str] = mapped_column(String(32), nullable=False)
    nodes_explored: Mapped[int] = mapped_column(Integer, default=0)
    solution_cost: Mapped[float] = mapped_column(Float, default=0.0)
    execution_time_ms: Mapped[float] = mapped_column(Float, default=0.0)
    depth: Mapped[int] = mapped_column(Integer, default=0)
    result: Mapped[str] = mapped_column(String(32), default="SUCCESS")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, nullable=False)

    game: Mapped["Game"] = relationship("Game", back_populates="algorithm_runs")
