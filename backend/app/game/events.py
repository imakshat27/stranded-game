"""Event generator and resolver for STRANDED.

Implements adaptive, context-aware event selection based on weather,
player behavioral profile, dynamic difficulty vector, and recent event history.
"""

from typing import Any, Dict, List, Optional
import random
from app.core.config import ConfigLoader
from app.game.state import GameState


class EventManager:
    """Calculates weighted event occurrences and applies resolution effects."""

    @classmethod
    def get_all_events(cls) -> List[Dict[str, Any]]:
        return ConfigLoader.get_events()

    @classmethod
    def get_event(cls, event_id: str) -> Optional[Dict[str, Any]]:
        for ev in cls.get_all_events():
            if ev["id"] == event_id:
                return ev
        return None

    @classmethod
    def is_event_eligible(cls, state: GameState, event: Dict[str, Any]) -> bool:
        """Check prerequisites, weather compatibility, and recent history."""
        # 1. Weather compatibility
        comp_weather = event.get("compatible_weather", [])
        if comp_weather and state.weather not in comp_weather:
            return False

        # 2. Incompatible recent events (avoid immediate repetition of severe storms/injuries)
        incomp = event.get("incompatible_events", [])
        for inc in incomp:
            if state.recent_events and state.recent_events[-1] == inc:
                return False

        if state.recent_events and state.recent_events[-1] == event["id"] and event.get("risk_level", 0) > 0.4:
            # Prevent consecutive high-risk events
            return False

        # 3. Prerequisites
        prereqs = event.get("prerequisites", {})
        if "min_food" in prereqs and state.food < prereqs["min_food"]:
            return False
        if "min_shelter_level" in prereqs and state.shelter_level < prereqs["min_shelter_level"]:
            return False

        return True

    @classmethod
    def compute_event_weight(cls, state: GameState, event: Dict[str, Any], rng: Optional[random.Random] = None) -> float:
        """Calculate weighted probability using difficulty, profile, and shelter modifiers."""
        weight = float(event.get("base_probability", 0.1))

        # Weather multiplier
        if state.weather in event.get("compatible_weather", []):
            weight *= 1.2

        # Difficulty vector modifiers
        env_risk = state.difficulty_profile.get("environmental_risk", 0.4)
        if event.get("category") in ("WEATHER", "DANGER"):
            weight *= (0.6 + env_risk)

        res_scarcity = state.difficulty_profile.get("resource_scarcity", 0.5)
        if event.get("category") == "RESOURCE":
            # Higher scarcity decreases resource discovery probability
            weight *= (1.4 - (res_scarcity * 0.8))

        # Shelter protection against weather events
        if event.get("id") == "heavy_storm":
            shelter_factor = max(0.2, 1.0 - (state.shelter_level * 0.2))
            weight *= shelter_factor

        # Player profile modifier
        profile_type = state.player_profile.get("profile_type", "Balanced")
        prof_mods = event.get("player_profile_modifiers", {})
        if profile_type in prof_mods:
            weight *= prof_mods[profile_type]

        # Recent frequency dampener
        if event["id"] in state.recent_events:
            weight *= 0.5

        return max(0.01, weight)

    @classmethod
    def maybe_trigger_event(
        cls,
        state: GameState,
        action_risk: float = 0.0,
        deterministic: bool = False,
        rng: Optional[random.Random] = None
    ) -> Optional[Dict[str, Any]]:
        """Select an event if eligible based on action risk and environment."""
        if deterministic:
            # Deterministic simulation for AI search: only trigger if high risk
            return None

        _rng = rng or random

        # Chance of an event occurring at all on an action:
        # Base event chance is 30% + action risk
        event_trigger_threshold = 0.25 + (action_risk * 0.4)
        if _rng.random() > event_trigger_threshold:
            return None

        eligible_events: List[Dict[str, Any]] = []
        weights: List[float] = []

        for ev in cls.get_all_events():
            if cls.is_event_eligible(state, ev):
                w = cls.compute_event_weight(state, ev, _rng)
                eligible_events.append(ev)
                weights.append(w)

        if not eligible_events:
            return None

        # Weighted choice
        selected_event = _rng.choices(eligible_events, weights=weights, k=1)[0]
        return selected_event

    @classmethod
    def resolve_event(cls, state: GameState, event: Dict[str, Any]) -> tuple[GameState, Dict[str, float], str]:
        """Apply an event's consequences onto the GameState."""
        res_changes: Dict[str, float] = {}
        effects = event.get("resource_effects", {})
        log_msg = f"Event occurred: {event['name']} - {event['description']}"

        # Shelter damage
        if "shelter_damage" in effects:
            prev_shelter = state.shelter_level
            state.shelter_level = max(0, state.shelter_level - effects["shelter_damage"])
            if state.shelter_level < prev_shelter:
                res_changes["shelter_level"] = state.shelter_level - prev_shelter

        # Health damage with shelter mitigation
        if "health_damage" in effects:
            raw_dmg = effects["health_damage"]
            mitigated = raw_dmg * max(0.2, 1.0 - (state.shelter_level * 0.2))
            state.health = max(0.0, state.health - mitigated)
            res_changes["health"] = -mitigated

        if "health_damage_without_shelter" in effects:
            if state.shelter_level == 0:
                dmg = effects["health_damage_without_shelter"]
                state.health = max(0.0, state.health - dmg)
                res_changes["health"] = -dmg
            else:
                mitigated = effects["health_damage_without_shelter"] * 0.25
                state.health = max(0.0, state.health - mitigated)
                res_changes["health"] = -mitigated

        # Energy loss / gain
        if "energy_loss" in effects:
            loss = effects["energy_loss"]
            state.energy = max(0.0, state.energy - loss)
            res_changes["energy"] = -loss

        if "energy_recovery" in effects:
            gain = min(100.0 - state.energy, effects["energy_recovery"])
            state.energy = min(100.0, state.energy + gain)
            res_changes["energy"] = gain

        # Water changes
        if "water_gain" in effects:
            gain = min(100.0 - state.water, effects["water_gain"])
            state.water = min(100.0, state.water + gain)
            res_changes["water"] = gain

        if "water_loss" in effects:
            loss = min(state.water, effects["water_loss"])
            state.water = max(0.0, state.water - loss)
            res_changes["water"] = -loss

        if "water_bonus" in effects:
            gain = min(100.0 - state.water, effects["water_bonus"])
            state.water = min(100.0, state.water + gain)
            res_changes["water"] = gain

        # Food loss
        if "food_loss" in effects:
            loss = min(state.food, effects["food_loss"])
            state.food = max(0.0, state.food - loss)
            res_changes["food"] = -loss

        # Materials
        if "wood_gain" in effects:
            state.wood += effects["wood_gain"]
            res_changes["wood"] = effects["wood_gain"]

        if "rope_gain" in effects:
            state.rope += effects["rope_gain"]
            res_changes["rope"] = effects["rope_gain"]

        if "metal_gain" in effects:
            state.metal += effects["metal_gain"]
            res_changes["metal"] = effects["metal_gain"]

        if "tools_gain" in effects:
            state.tools += effects["tools_gain"]
            res_changes["tools"] = effects["tools_gain"]

        # Track recent event
        state.recent_events.append(event["id"])
        if len(state.recent_events) > 5:
            state.recent_events.pop(0)

        return state, res_changes, log_msg
