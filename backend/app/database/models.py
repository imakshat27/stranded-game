"""SQLAlchemy database models for STRANDED.

Stores game sessions, state snapshots, actions, events, player behavioral profiles,
and AI algorithm benchmark metrics.
"""

from datetime import datetime
import json
from typing import Any, Dict, Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(String(36), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    status = Column(String(32), default="ACTIVE", index=True)  # ACTIVE, WON, LOST, ABANDONED
    current_day = Column(Integer, default=1)
    current_state_json = Column(Text, nullable=False)
    seed = Column(String(64), nullable=True)

    # Relationships
    states = relationship("GameStateRecord", back_populates="game", cascade="all, delete-orphan")
    action_history = relationship("ActionHistoryRecord", back_populates="game", cascade="all, delete-orphan")
    event_history = relationship("EventHistoryRecord", back_populates="game", cascade="all, delete-orphan")
    profile = relationship("PlayerProfileRecord", back_populates="game", uselist=False, cascade="all, delete-orphan")
    algorithm_runs = relationship("AlgorithmRunRecord", back_populates="game", cascade="all, delete-orphan")


class GameStateRecord(Base):
    __tablename__ = "game_states"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    day = Column(Integer, nullable=False)
    state_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    game = relationship("Game", back_populates="states")


class ActionHistoryRecord(Base):
    __tablename__ = "action_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    day = Column(Integer, nullable=False)
    action = Column(String(64), nullable=False)
    action_details_json = Column(Text, nullable=True)
    state_before_json = Column(Text, nullable=True)
    state_after_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    game = relationship("Game", back_populates="action_history")


class EventHistoryRecord(Base):
    __tablename__ = "event_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=False)
    day = Column(Integer, nullable=False)
    event_id = Column(String(64), nullable=False)
    event_name = Column(String(128), nullable=False)
    category = Column(String(64), nullable=False)
    outcome_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    game = relationship("Game", back_populates="event_history")


class PlayerProfileRecord(Base):
    __tablename__ = "player_profiles"

    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), primary_key=True)
    exploration_score = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0)
    resource_score = Column(Float, default=0.0)
    profile_type = Column(String(32), default="Balanced")
    actions_taken = Column(Integer, default=0)
    profile_data_json = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    game = relationship("Game", back_populates="profile")


class AlgorithmRunRecord(Base):
    __tablename__ = "algorithm_runs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    game_id = Column(String(36), ForeignKey("games.id", ondelete="CASCADE"), index=True, nullable=True)
    algorithm = Column(String(32), nullable=False)
    nodes_explored = Column(Integer, nullable=False)
    solution_cost = Column(Float, nullable=True)
    execution_time_ms = Column(Float, nullable=False)
    depth = Column(Integer, nullable=True)
    result = Column(String(32), nullable=False)  # SUCCESS, FAILURE, LIMIT_REACHED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    game = relationship("Game", back_populates="algorithm_runs")
