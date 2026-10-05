"""Rule definitions for the propositional inference engine."""

from typing import List
from pydantic import BaseModel, Field


class Rule(BaseModel):
    """An IF-THEN propositional rule."""
    id: str
    antecedents: List[str]  # Required conditions (AND conjunction)
    consequent: str         # Inferred fact
    description: str
    recommendation: str
    priority: int = 1       # Higher priority rules take precedence


DEFAULT_RULES: List[Rule] = [
    Rule(
        id="R1_storm_damage",
        antecedents=["storm_active", "shelter_level_low"],
        consequent="weather_damage_risk_high",
        description="Active severe storm combined with low shelter poses acute physical peril.",
        recommendation="Fortify shelter or seek natural cave barrier to avoid severe exposure injuries.",
        priority=5
    ),
    Rule(
        id="R2_dehydration",
        antecedents=["water_critical"],
        consequent="dehydration_risk_imminent",
        description="Water reserves are at critical minimum threshold.",
        recommendation="Halt construction activities and immediately gather fresh water from inland stream.",
        priority=5
    ),
    Rule(
        id="R3_starvation",
        antecedents=["food_critical"],
        consequent="starvation_risk_imminent",
        description="Caloric reserves depleted to dangerous starvation levels.",
        recommendation="Forage for coastal fruits and coconuts before attempting strenuous labor.",
        priority=4
    ),
    Rule(
        id="R4_exhaustion_collapse",
        antecedents=["energy_exhausted", "health_critical"],
        consequent="collapse_hazard_severe",
        description="Critically low health paired with total physical exhaustion.",
        recommendation="Rest and recuperate under shelter immediately; further exertion will prove fatal.",
        priority=5
    ),
    Rule(
        id="R5_harvest_wood",
        antecedents=["hull_missing", "wood_insufficient_for_hull"],
        consequent="harvest_timber_required",
        description="Escape catamaran chassis requires additional structural timber.",
        recommendation="Collect driftwood and timber to reach the 6 wood required for the boat hull.",
        priority=3
    ),
    Rule(
        id="R6_scavenge_rope",
        antecedents=["rigging_missing", "rope_insufficient_for_rigging"],
        consequent="scavenge_rope_required",
        description="Vessel sails require marine cordage.",
        recommendation="Explore the eastern shore and search shipwreck wreckage to recover high-tensile rope.",
        priority=3
    ),
    Rule(
        id="R7_salvage_metal",
        antecedents=["rudder_missing", "materials_insufficient_for_rudder"],
        consequent="salvage_metal_required",
        description="Ocean rudder and keel stabilizer need forged metal fasteners.",
        recommendation="Pry into ship wreckage lockers or limestone caves to recover metal plates.",
        priority=3
    ),
    Rule(
        id="R8_secure_supplies",
        antecedents=["provisions_missing", "provisions_insufficient"],
        consequent="stockpile_provisions_required",
        description="Open sea crossing demands at least 35 water and 35 food rations stored in advance.",
        recommendation="Gather and preserve excess water and forage before attempting open-sea crossing.",
        priority=3
    ),
    Rule(
        id="R9_escape_ready",
        antecedents=["hull_built", "rigging_built", "rudder_built", "provisions_secured"],
        consequent="escape_vessel_ready_to_launch",
        description="All four critical vessel sub-assemblies are fully operational.",
        recommendation="Launch escape vessel into offshore trade winds to complete island escape!",
        priority=5
    )
]
