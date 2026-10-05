"""Fact extraction from GameState for knowledge-based reasoning."""

from typing import List, Set
from app.game.state import GameState


def extract_facts(state: GameState) -> Set[str]:
    """Inspect GameState and derive discrete propositional facts."""
    facts: Set[str] = set()

    # Weather
    if state.weather == "stormy":
        facts.add("storm_active")
    elif state.weather == "rainy":
        facts.add("rain_active")
    elif state.weather == "clear":
        facts.add("weather_clear")

    # Shelter
    if state.shelter_level < 2:
        facts.add("shelter_level_low")
    else:
        facts.add("shelter_secure")

    # Vital levels
    if state.water < 20.0:
        facts.add("water_critical")
    elif state.water >= 45.0:
        facts.add("water_stable")

    if state.food < 20.0:
        facts.add("food_critical")
    elif state.food >= 45.0:
        facts.add("food_stable")

    if state.energy < 20.0:
        facts.add("energy_exhausted")
    elif state.energy >= 60.0:
        facts.add("energy_ample")

    if state.health < 30.0:
        facts.add("health_critical")
    elif state.health >= 70.0:
        facts.add("health_stable")

    # Materials for boat components
    if state.wood < 6:
        facts.add("wood_insufficient_for_hull")
    else:
        facts.add("wood_sufficient_for_hull")

    if state.rope < 4:
        facts.add("rope_insufficient_for_rigging")
    else:
        facts.add("rope_sufficient_for_rigging")

    if state.metal < 2 or state.wood < 3:
        facts.add("materials_insufficient_for_rudder")
    else:
        facts.add("materials_sufficient_for_rudder")

    if state.water < 35.0 or state.food < 35.0:
        facts.add("provisions_insufficient")
    else:
        facts.add("provisions_sufficient")

    # Boat parts
    if not state.boat_parts.get("hull", False):
        facts.add("hull_missing")
    else:
        facts.add("hull_built")

    if not state.boat_parts.get("rigging", False):
        facts.add("rigging_missing")
    else:
        facts.add("rigging_built")

    if not state.boat_parts.get("rudder", False):
        facts.add("rudder_missing")
    else:
        facts.add("rudder_built")

    if not state.boat_parts.get("provisions", False):
        facts.add("provisions_missing")
    else:
        facts.add("provisions_secured")

    if state.escape_ready():
        facts.add("escape_ready")
    else:
        facts.add("escape_not_ready")

    return facts
