"""Unit tests for core game state, actions, transitions, and day cycle."""

import pytest
from app.game.state import GameState
from app.game.actions import ActionManager
from app.game.engine import GameEngine
from app.game.transitions import apply_action


def test_game_initialization():
    state = GameEngine.create_new_game(seed="test_seed_123")
    assert state.day == 1
    assert state.actions_remaining == 2
    assert state.health == 100.0
    assert state.water == 80.0
    assert state.food == 75.0
    assert state.energy == 90.0
    assert state.hints_remaining == 3
    assert state.hint_cooldown == 0
    assert state.game_status == "ACTIVE"
    assert state.boat_parts["hull"] is False


def test_action_validation():
    state = GameEngine.create_new_game()
    water_act = ActionManager.get_action("gather_water")
    assert water_act is not None
    is_valid, reason = ActionManager.is_action_valid(state, water_act)
    assert is_valid is True

    # Hull requires 6 wood; initial has only 2 wood
    hull_act = ActionManager.get_action("build_boat_hull")
    assert hull_act is not None
    is_valid, reason = ActionManager.is_action_valid(state, hull_act)
    assert is_valid is False
    assert "wood" in reason.lower()


def test_action_execution_and_day_advance():
    state = GameEngine.create_new_game(seed="test_advance")
    init_day = state.day
    assert state.actions_remaining == 2

    # Step 1: Gather water
    trans1 = GameEngine.execute_action(state, "gather_water")
    assert trans1.success is True
    assert state.actions_remaining == 1
    assert state.day == init_day

    # Step 2: Forage food (triggers day advance when actions_remaining hits 0)
    trans2 = GameEngine.execute_action(state, "gather_food")
    assert trans2.success is True
    assert trans2.day_advanced is True
    assert state.day == 2
    assert state.actions_remaining == 2


def test_boat_building_and_win_condition():
    state = GameEngine.create_new_game()
    # Provide required materials directly for testing escape
    state.wood = 20
    state.rope = 10
    state.metal = 10
    state.food = 80
    state.water = 80
    state.energy = 100

    # Build hull
    trans_hull = GameEngine.execute_action(state, "build_boat_hull")
    assert trans_hull.success is True
    assert state.boat_parts["hull"] is True

    # Build rigging
    state.energy = 90
    trans_rig = GameEngine.execute_action(state, "rig_boat_sails")
    assert trans_rig.success is True
    assert state.boat_parts["rigging"] is True

    # Build rudder
    state.energy = 90
    trans_rudder = GameEngine.execute_action(state, "craft_rudder_keel")
    assert trans_rudder.success is True
    assert state.boat_parts["rudder"] is True

    # Stockpile provisions (requires min 35 water and 35 food)
    state.energy = 90
    state.water = 80
    state.food = 80
    trans_prov = GameEngine.execute_action(state, "stockpile_provisions")
    assert trans_prov.success is True
    assert state.boat_parts["provisions"] is True
    assert state.escape_ready() is True

    # Launch escape
    state.energy = 90
    state.actions_remaining = 2
    trans_launch = GameEngine.execute_action(state, "launch_escape")
    assert trans_launch.success is True
    assert state.game_status == "WON"
