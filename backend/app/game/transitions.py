"""Centralized Game State Transitions for STRANDED.

Implements the authoritative single transition function `apply_action`
governing action execution, costs, consequences, event triggers, day advances,
and terminal state determination.
"""

from typing import Any, Dict, Optional
import random
from app.core.config import ConfigLoader
from app.game.state import GameState, StateTransition
from app.game.actions import Action, ActionManager
from app.game.events import EventManager


def advance_day(state: GameState, rng: Optional[random.Random] = None) -> list[str]:
    """Advance the game clock by 1 full day and apply overnight survival degradation."""
    _rng = rng or random
    res_cfg = ConfigLoader.get_resources()
    decay_cfg = res_cfg.get("decay", {})
    penalties_cfg = res_cfg.get("penalties", {})

    state.day += 1
    state.actions_remaining = res_cfg.get("initial", {}).get("actions_per_day", 2)
    state.turn_in_day = 1
    overnight_logs: list[str] = [f"--- Day {state.day} Dawn ---"]

    # Hint cooldown ticks down each day
    if state.hint_cooldown > 0:
        state.hint_cooldown -= 1

    # Night energy recovery boosted by shelter level
    base_recovery = decay_cfg.get("energy_night_rest", 30.0)
    shelter_bonus = state.shelter_level * decay_cfg.get("energy_night_shelter_bonus_per_level", 8.0)
    total_energy_gain = min(100.0 - state.energy, base_recovery + shelter_bonus)
    state.energy = min(100.0, state.energy + total_energy_gain)
    overnight_logs.append(f"Rested under shelter (Level {state.shelter_level}), recovering {total_energy_gain:.0f} energy.")

    # Water & Food Daily Consumption
    water_decay = decay_cfg.get("water_daily", 16.0)
    food_decay = decay_cfg.get("food_daily", 14.0)

    # Scarcity difficulty modifier affects consumption slightly
    scarcity_mod = state.difficulty_profile.get("resource_scarcity", 0.5)
    water_decay *= (0.8 + scarcity_mod * 0.4)
    food_decay *= (0.8 + scarcity_mod * 0.4)

    state.water = max(0.0, state.water - water_decay)
    state.food = max(0.0, state.food - food_decay)
    overnight_logs.append(f"Consumed daily provisions (-{water_decay:.0f} Water, -{food_decay:.0f} Food).")

    # Starvation / Dehydration health penalties
    if state.water <= 0.0:
        dehydr_dmg = penalties_cfg.get("dehydration_health_damage", 18.0)
        state.health = max(0.0, state.health - dehydr_dmg)
        overnight_logs.append(f"Severe dehydration! Took {dehydr_dmg:.0f} health damage.")

    if state.food <= 0.0:
        starv_dmg = penalties_cfg.get("starvation_health_damage", 14.0)
        state.health = max(0.0, state.health - starv_dmg)
        overnight_logs.append(f"Starvation weakness! Took {starv_dmg:.0f} health damage.")

    # Weather shifts
    weather_options = ["clear", "cloudy", "rainy", "stormy"]
    # Probability depends on current season/day and environmental risk
    env_risk = state.difficulty_profile.get("environmental_risk", 0.4)
    weights = [
        max(0.1, 0.45 - (env_risk * 0.2)),  # clear
        0.30,                                # cloudy
        0.15 + (env_risk * 0.1),            # rainy
        0.10 + (env_risk * 0.1)             # stormy
    ]
    state.weather = _rng.choices(weather_options, weights=weights, k=1)[0]
    overnight_logs.append(f"Weather forecast for today: {state.weather.upper()}.")

    # Exposure damage if stormy and shelter is 0
    if state.weather == "stormy" and state.shelter_level == 0:
        exposure_dmg = penalties_cfg.get("exposure_health_damage_bad_weather", 15.0)
        state.health = max(0.0, state.health - exposure_dmg)
        overnight_logs.append(f"Exposed to nocturnal storm without shelter! Took {exposure_dmg:.0f} damage.")

    return overnight_logs


def update_player_profile(state: GameState, action: Action) -> None:
    """Incrementally analyze player behavior and update classification profile."""
    prof = state.player_profile
    prof["total_actions"] = prof.get("total_actions", 0) + 1
    total = prof["total_actions"]

    if action.category == "EXPLORATION":
        prof["exploration_actions"] = prof.get("exploration_actions", 0) + 1
    elif action.category == "REST":
        prof["rest_actions"] = prof.get("rest_actions", 0) + 1
    elif action.category == "CRAFTING":
        prof["crafting_actions"] = prof.get("crafting_actions", 0) + 1

    if action.risk >= 0.25:
        prof["risky_actions"] = prof.get("risky_actions", 0) + 1

    # Ratios
    expl_freq = prof["exploration_actions"] / total
    risk_tol = prof["risky_actions"] / total
    rest_freq = prof["rest_actions"] / total

    prof["exploration_score"] = round(expl_freq, 2)
    prof["risk_score"] = round(risk_tol, 2)
    prof["resource_score"] = round((state.water + state.food + state.health) / 300.0, 2)

    # Classification logic
    if expl_freq >= 0.45 and risk_tol >= 0.35:
        prof["profile_type"] = "Explorer"
    elif risk_tol >= 0.50:
        prof["profile_type"] = "Risk Taker"
    elif rest_freq >= 0.40 or (state.wood >= 6 and state.food >= 60 and state.water >= 60):
        prof["profile_type"] = "Conservative"
    else:
        prof["profile_type"] = "Balanced"


def update_difficulty(state: GameState) -> None:
    """Adaptive difficulty vector adjustment based on state resilience and player safety."""
    diff_cfg = ConfigLoader.get_difficulty()
    baseline = diff_cfg.get("baseline", {})
    min_b = diff_cfg.get("min_bounds", {})
    max_b = diff_cfg.get("max_bounds", {})
    rate = diff_cfg.get("adaptation_rate", 0.05)

    current = state.difficulty_profile

    # If player is in critical health/resources -> slightly decrease danger to allow recovery
    if state.health < 30.0 or (state.water < 20.0 and state.food < 20.0):
        current["environmental_risk"] = max(min_b.get("environmental_risk", 0.15), current["environmental_risk"] - rate)
        current["resource_scarcity"] = max(min_b.get("resource_scarcity", 0.15), current["resource_scarcity"] - rate)
    # If player is thriving with high resources -> slightly challenge them
    elif state.health > 80.0 and state.water > 60.0 and state.food > 60.0:
        current["environmental_risk"] = min(max_b.get("environmental_risk", 0.9), current["environmental_risk"] + (rate * 0.5))
        current["resource_scarcity"] = min(max_b.get("resource_scarcity", 0.95), current["resource_scarcity"] + (rate * 0.5))


def apply_action(
    state: GameState,
    action: Action,
    deterministic: bool = False,
    rng: Optional[random.Random] = None
) -> StateTransition:
    """The authoritative game state transition function.

    Validates, deducts costs, applies rewards, checks events,
    updates player profile and difficulty, advances day if needed,
    and returns a StateTransition.
    Search algorithms pass deterministic=True and work on cloned states.
    """
    _rng = rng or random
    state_before = state.clone()

    # 1. Validate action
    valid, reason = ActionManager.is_action_valid(state, action)
    if not valid:
        return StateTransition(
            action_id=action.id,
            action_name=action.name,
            success=False,
            state_before=state_before,
            state_after=state.clone(),
            message=reason or "Invalid action",
            day_advanced=False
        )

    resource_changes: Dict[str, float] = {}

    # 2. Apply Action Costs
    if action.energy_cost != 0.0:
        state.energy = max(0.0, min(100.0, state.energy - action.energy_cost))
        resource_changes["energy"] = -action.energy_cost

    if action.water_cost > 0.0:
        state.water = max(0.0, state.water - action.water_cost)
        resource_changes["water"] = -action.water_cost

    if action.food_cost > 0.0:
        state.food = max(0.0, state.food - action.food_cost)
        resource_changes["food"] = -action.food_cost

    # 3. Apply Action Effects
    effects = action.effects
    narrative_parts: list[str] = [f"Performed {action.name}."]

    # Wood costs & gains
    if "wood_cost" in effects:
        state.wood = max(0, state.wood - effects["wood_cost"])
        resource_changes["wood"] = -effects["wood_cost"]
    if "wood_min" in effects:
        w_gain = effects["wood_min"] if deterministic else _rng.randint(effects["wood_min"], effects.get("wood_max", effects["wood_min"]))
        state.wood += w_gain
        resource_changes["wood"] = resource_changes.get("wood", 0) + w_gain
        narrative_parts.append(f"Collected {w_gain} wood.")

    # Rope costs & gains
    if "rope_cost" in effects:
        state.rope = max(0, state.rope - effects["rope_cost"])
        resource_changes["rope"] = -effects["rope_cost"]
    if "rope_chance" in effects:
        found_rope = True if deterministic else (_rng.random() <= effects["rope_chance"])
        if found_rope:
            state.rope += 1
            resource_changes["rope"] = resource_changes.get("rope", 0) + 1
            narrative_parts.append("Found salvageable nautical rope.")

    # Metal costs & gains
    if "metal_cost" in effects:
        state.metal = max(0, state.metal - effects["metal_cost"])
        resource_changes["metal"] = -effects["metal_cost"]
    if "metal_min" in effects:
        m_gain = effects["metal_min"] if deterministic else _rng.randint(effects["metal_min"], effects.get("metal_max", effects["metal_min"]))
        state.metal += m_gain
        resource_changes["metal"] = resource_changes.get("metal", 0) + m_gain
        narrative_parts.append(f"Recovered {m_gain} pieces of structural metal.")

    # Tools
    if "tools_gain" in effects:
        state.tools += effects["tools_gain"]
        resource_changes["tools"] = resource_changes.get("tools", 0) + effects["tools_gain"]
        narrative_parts.append(f"Crafted {effects['tools_gain']} improved tool.")
    elif "tools_chance" in effects:
        found_tool = True if deterministic else (_rng.random() <= effects["tools_chance"])
        if found_tool:
            state.tools += 1
            resource_changes["tools"] = resource_changes.get("tools", 0) + 1
            narrative_parts.append("Salvaged a usable set of heavy tools.")

    # Water & Food gains
    if "water_min" in effects:
        w_gain = effects["water_min"] if deterministic else _rng.uniform(effects["water_min"], effects.get("water_max", effects["water_min"]))
        actual_gain = min(100.0 - state.water, w_gain)
        state.water = min(100.0, state.water + actual_gain)
        resource_changes["water"] = resource_changes.get("water", 0) + actual_gain
        narrative_parts.append(f"Gathered {actual_gain:.0f} fresh water.")

    if "food_min" in effects:
        f_gain = effects["food_min"] if deterministic else _rng.uniform(effects["food_min"], effects.get("food_max", effects["food_min"]))
        actual_gain = min(100.0 - state.food, f_gain)
        state.food = min(100.0, state.food + actual_gain)
        resource_changes["food"] = resource_changes.get("food", 0) + actual_gain
        narrative_parts.append(f"Foraged {actual_gain:.0f} food provisions.")

    # Health & Rest
    if "health_gain" in effects:
        h_gain = min(100.0 - state.health, effects["health_gain"])
        state.health = min(100.0, state.health + h_gain)
        resource_changes["health"] = resource_changes.get("health", 0) + h_gain
        narrative_parts.append(f"Restored {h_gain:.0f} health through rest.")

    # Shelter improvement
    if "shelter_level_gain" in effects:
        state.shelter_level = min(4, state.shelter_level + effects["shelter_level_gain"])
        resource_changes["shelter_level"] = effects["shelter_level_gain"]
        narrative_parts.append(f"Shelter fortified to Level {state.shelter_level}.")

    # Location discovery
    if "discover_location" in effects:
        loc = effects["discover_location"]
        if loc not in state.discovered_locations:
            state.discovered_locations.append(loc)
            state.location = loc
            narrative_parts.append(f"Discovered new area: {loc.replace('_', ' ').title()}!")

    # Boat building
    if "boat_part_built" in effects:
        part = effects["boat_part_built"]
        state.boat_parts[part] = True
        state.escape_progress = min(100.0, state.escape_progress + effects.get("escape_progress_gain", 25.0))
        narrative_parts.append(f"Constructed vessel component: {part.upper()}! Escape progress at {state.escape_progress:.0f}%.")

        # Earn bonus AI hint upon completing a major escape project component!
        state.hints_remaining += 1
        state.hints_earned += 1
        narrative_parts.append("Earned an additional AI Survival Hint for milestone progress!")

    # Escape win condition
    if effects.get("win") is True:
        state.game_status = "WON"
        state.status_reason = "You successfully launched your ocean catamaran and escaped the island!"
        narrative_parts.append("VICTORY! You sailed safely beyond the barrier reef into rescue waters!")

    # 4. Check for and resolve an adaptive event
    event_obj = EventManager.maybe_trigger_event(state, action_risk=action.risk, deterministic=deterministic, rng=_rng)
    if event_obj:
        state, ev_res_changes, ev_log = EventManager.resolve_event(state, event_obj)
        for k, v in ev_res_changes.items():
            resource_changes[k] = resource_changes.get(k, 0.0) + v
        narrative_parts.append(ev_log)

    # 5. Decrement action turns
    state.actions_remaining -= 1
    state.turn_in_day += 1

    # 6. Update player behavioral profile & difficulty
    update_player_profile(state, action)
    update_difficulty(state)

    # 7. Check terminal health condition
    if state.health <= 0.0:
        state.health = 0.0
        state.game_status = "LOST"
        state.status_reason = "You succumbed to island hazards and extreme exhaustion."
        narrative_parts.append("GAME OVER: Your health dropped to zero.")

    # 8. Check if day needs to advance
    day_advanced = False
    if state.actions_remaining <= 0 and state.game_status == "ACTIVE":
        overnight_logs = advance_day(state, rng=_rng)
        narrative_parts.extend(overnight_logs)
        day_advanced = True

        # Check health again after overnight decay
        if state.health <= 0.0:
            state.health = 0.0
            state.game_status = "LOST"
            state.status_reason = "You did not survive the night due to starvation or dehydration."
            narrative_parts.append("GAME OVER: Perished overnight.")

    # Combine narrative into state log messages
    full_message = " ".join(narrative_parts)
    state.log_messages.append({
        "day": state.day,
        "action": action.id,
        "message": full_message
    })

    return StateTransition(
        action_id=action.id,
        action_name=action.name,
        success=True,
        state_before=state_before,
        state_after=state.clone(),
        event_occurred=event_obj,
        resource_changes=resource_changes,
        message=full_message,
        day_advanced=day_advanced
    )
