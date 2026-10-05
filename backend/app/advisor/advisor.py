"""AI Survival Advisor implementation for STRANDED.

Enforces hint rationing (3 starting hints, cooldowns, earned hints) and
uses A* heuristic planning and forward chaining to deliver explainable recommendations.
"""

from typing import Optional, Tuple
from app.game.state import GameState
from app.game.actions import Action, ActionManager
from app.advisor.explanation import HintExplanation
from app.reasoning.forward_chaining import ForwardChainingEngine
from app.algorithms.base import SearchProblem
from app.algorithms.astar import astar_search


class SurvivalAdvisor:
    """Delivers contextual survival recommendations with transparent reasoning."""

    COOLDOWN_TURNS = 2

    @classmethod
    def can_request_hint(cls, state: GameState) -> Tuple[bool, Optional[str]]:
        if state.is_terminal():
            return False, f"Game is already {state.game_status}."

        if state.hints_remaining <= 0:
            return False, "You have depleted your available AI Hints. Construct escape vessel components to earn additional hints."

        if state.hint_cooldown > 0:
            return False, f"AI Survival Advisor is currently cooling down ({state.hint_cooldown} turns remaining)."

        return True, None

    @classmethod
    def generate_hint(cls, state: GameState) -> Tuple[Optional[HintExplanation], Optional[str]]:
        can_req, reason = cls.can_request_hint(state)
        if not can_req:
            return None, reason

        valid_actions = ActionManager.get_valid_actions(state)
        if not valid_actions:
            return None, "No valid actions currently available."

        # 1. Run Forward Chaining for immediate danger signals
        inference_res = ForwardChainingEngine.infer(state)
        derived = inference_res.get("derived_facts", [])

        # 2. Run A* search to identify the first step on the optimal escape path
        problem = SearchProblem(initial_state=state, max_depth=12, max_nodes=800)
        search_res = astar_search(problem)

        chosen_action: Optional[Action] = None
        supporting: list[str] = []
        negatives: list[str] = []

        # Check for immediate critical survival imperatives
        if "dehydration_risk_imminent" in derived:
            chosen_action = ActionManager.get_action("gather_water")
            supporting.append("Freshwater reserves are critically low; dehydration will cause severe health loss.")
            supporting.append("The stream provides guaranteed hydration with minimal risk.")
            negatives.append("Consumes 10 energy that could otherwise advance construction.")

        elif "starvation_risk_imminent" in derived:
            chosen_action = ActionManager.get_action("gather_food")
            supporting.append("Caloric deficit is reaching starvation thresholds.")
            supporting.append("Foraging restores food stability to preserve physical resilience.")
            negatives.append("Consumes 15 energy and slight water.")

        elif "weather_damage_risk_high" in derived and state.wood >= 3 and state.shelter_level < 4:
            chosen_action = ActionManager.get_action("improve_shelter")
            supporting.append("A severe storm is active and shelter protection is weak.")
            supporting.append("Upgrading shelter mitigates high incoming weather exposure damage.")
            negatives.append("Consumes 3 wood required for the escape catamaran.")

        elif "collapse_hazard_severe" in derived:
            chosen_action = ActionManager.get_action("rest_and_recover")
            supporting.append("Vitals are near complete physical collapse.")
            supporting.append("Resting safely restores health and replenishes energy stamina.")
            negatives.append("Consumes an action turn without progressing escape materials.")

        # Otherwise follow A* optimal escape trajectory
        elif search_res.success and search_res.path:
            top_act_id = search_res.path[0]
            chosen_action = ActionManager.get_action(top_act_id)

            if top_act_id == "build_boat_hull":
                supporting.append("All 6 required timber pieces have been harvested.")
                supporting.append("Building the hull completes 25% of the vessel project.")
                negatives.append("Consumes 30 energy and 12 water.")
            elif top_act_id == "rig_boat_sails":
                supporting.append("All 4 marine ropes are secured in inventory.")
                supporting.append("Rigging sails enables offshore steering capability.")
                negatives.append("Consumes 25 energy.")
            elif top_act_id == "craft_rudder_keel":
                supporting.append("Timber and structural metal are prepared.")
                supporting.append("Stabilizer keel prevents vessel capsize.")
                negatives.append("Consumes 25 energy and 2 metal.")
            elif top_act_id == "stockpile_provisions":
                supporting.append("Survival vitals are high enough to seal 10-day sea rations.")
                supporting.append("Completes final escape prerequisite.")
                negatives.append("Deducts 25 water and 25 food reserves.")
            elif top_act_id == "collect_wood":
                supporting.append(f"Timber needed for catamaran hull (current {state.wood}/6).")
                supporting.append("Harvesting timber has low environmental risk.")
                negatives.append("Consumes 20 energy.")
            elif top_act_id == "search_wreckage":
                supporting.append("Shipwreck hull holds vital marine rope and metal fasteners.")
                supporting.append("High probability of discovering required materials.")
                negatives.append("Moderate injury hazard from submerged metal debris (35% risk).")
            elif top_act_id == "explore_eastern_shore":
                supporting.append("Unlocks access to shipwreck salvage and deposits tidal cordage.")
                supporting.append("Expands discovered territory.")
                negatives.append("Consumes 22 energy and 10 water.")
            elif top_act_id == "launch_escape":
                supporting.append("Escape vessel is fully seaworthy and all prerequisites are met!")
                supporting.append("Optimal trade wind conditions.")
                negatives.append("Requires 30 energy to launch.")

        # Fallback to safest valid action
        if not chosen_action or not ActionManager.is_action_valid(state, chosen_action)[0]:
            chosen_action = valid_actions[0]
            supporting.append(f"Highest utility available action under current constraints.")
            negatives.append(f"Action cost: {chosen_action.energy_cost:.0f} energy.")

        # Apply hint consumption and cooldown to state
        state.hints_remaining -= 1
        state.hints_used += 1
        state.hint_cooldown = cls.COOLDOWN_TURNS

        summary = f"The AI Advisor recommends: {chosen_action.name}. {chosen_action.description}"

        explanation = HintExplanation(
            recommended_action_id=chosen_action.id,
            recommended_action_name=chosen_action.name,
            summary=summary,
            supporting_factors=supporting,
            negative_factors=negatives,
            strategic_objective=state.current_objective,
            hints_remaining=state.hints_remaining,
            cooldown_turns=state.hint_cooldown
        )

        return explanation, None
