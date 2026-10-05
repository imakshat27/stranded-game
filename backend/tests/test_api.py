"""Comprehensive integration tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

    res_h = client.get("/health")
    assert res_h.status_code == 200
    assert res_h.json()["status"] == "healthy"


def test_game_lifecycle_api():
    # 1. Start Game
    start_res = client.post("/api/game/start", json={"seed": "api_test_seed"})
    assert start_res.status_code == 200
    start_data = start_res.json()
    assert start_data["success"] is True
    game_state = start_data["data"]["state"]
    game_id = game_state["game_id"]
    assert game_id is not None
    assert game_state["day"] == 1

    # 2. Get Game State
    get_res = client.get(f"/api/game/{game_id}")
    assert get_res.status_code == 200
    assert get_res.json()["data"]["state"]["game_id"] == game_id

    # 3. Perform Action (Gather Water)
    act_res = client.post(f"/api/game/{game_id}/action", json={"action_id": "gather_water"})
    assert act_res.status_code == 200
    act_data = act_res.json()
    assert act_data["success"] is True
    assert act_data["data"]["state"]["actions_remaining"] == 1

    # 4. Request AI Hint
    hint_res = client.post(f"/api/game/{game_id}/hint")
    assert hint_res.status_code == 200
    hint_data = hint_res.json()
    assert hint_data["success"] is True
    assert "recommended_action_name" in hint_data["data"]["hint"]
    assert len(hint_data["data"]["hint"]["supporting_factors"]) > 0

    # 5. Subsequent immediate hint request should be blocked by cooldown
    hint_res_2 = client.post(f"/api/game/{game_id}/hint")
    assert hint_res_2.json()["success"] is False
    msg = hint_res_2.json()["error"]["message"].lower()
    assert "cooling down" in msg or "cooldown" in msg


def test_ai_search_and_compare_api():
    start_res = client.post("/api/game/start")
    game_id = start_res.json()["data"]["state"]["game_id"]

    # Search endpoint
    search_res = client.post("/api/ai/search", json={"game_id": game_id, "algorithm": "astar", "max_nodes": 300})
    assert search_res.status_code == 200
    assert search_res.json()["data"]["algorithm"] == "A*"

    # Compare endpoint
    comp_res = client.post("/api/ai/compare", json={"game_id": game_id, "max_nodes": 200})
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["success"] is True
    assert len(comp_data["data"]["comparison_table"]) == 6


def test_ai_planning_and_replanning_api():
    start_res = client.post("/api/game/start")
    game_id = start_res.json()["data"]["state"]["game_id"]

    # Plan
    plan_res = client.post("/api/ai/plan", json={"game_id": game_id})
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    assert plan_data["success"] is True
    assert len(plan_data["data"]["steps"]) > 0

    # Replan with simulated storm damage
    replan_res = client.post("/api/ai/replan", json={
        "game_id": game_id,
        "current_plan": plan_data["data"],
        "simulate_storm_damage": True
    })
    assert replan_res.status_code == 200
    replan_data = replan_res.json()
    assert replan_data["success"] is True
    assert "new_plan" in replan_data["data"]


def test_ai_probability_and_rival_api():
    start_res = client.post("/api/game/start")
    game_id = start_res.json()["data"]["state"]["game_id"]

    # Bayesian probability
    prob_res = client.post("/api/ai/probability", json={
        "game_id": game_id,
        "scenario": "storm",
        "observed_signals": ["barometer_drop"]
    })
    assert prob_res.status_code == 200
    assert "final_posterior" in prob_res.json()["data"]

    # Rival survivor mode (without and with player action)
    rival_res = client.post("/api/ai/rival", json={"algorithm": "alpha_beta", "depth": 2})
    assert rival_res.status_code == 200
    assert rival_res.json()["data"]["best_action"] is not None

    rival_action_res = client.post("/api/ai/rival", json={
        "algorithm": "minimax",
        "depth": 2,
        "player_action": "claim_spring"
    })
    assert rival_action_res.status_code == 200
    assert rival_action_res.json()["data"]["best_action"] is not None


def test_analytics_and_knowledge_api():
    start_res = client.post("/api/game/start")
    game_id = start_res.json()["data"]["state"]["game_id"]

    # Analytics
    analytics_res = client.get(f"/api/analytics/{game_id}")
    assert analytics_res.status_code == 200
    assert analytics_res.json()["data"]["player_profile"] is not None

    # Knowledge
    knowledge_res = client.get(f"/api/knowledge/{game_id}")
    assert knowledge_res.status_code == 200
    assert "forward_chaining" in knowledge_res.json()["data"]
    assert "backward_chaining" in knowledge_res.json()["data"]
