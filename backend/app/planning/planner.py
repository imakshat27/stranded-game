"""Strategic multi-step escape planner for STRANDED.

Generates structured multi-step survival and escape plans with explicit prerequisite tracking
and estimated resource consumption.
"""

from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, Field
from app.game.state import GameState
from app.game.actions import ActionManager
from app.algorithms.base import SearchProblem
from app.algorithms.astar import astar_search


class PlanStep(BaseModel):
    step_number: int
    action_id: str
    action_name: str
    category: str
    reason: str
    expected_energy_cost: float
    expected_water_cost: float
    expected_food_cost: float
    risk: float


class StrategicPlan(BaseModel):
    plan_id: str
    goal: str = "Escape Island"
    steps: List[PlanStep] = Field(default_factory=list)
    total_steps: int = 0
    estimated_total_cost: float = 0.0
    status: str = "ACTIVE"  # ACTIVE, INVALIDATED, COMPLETED
    invalidation_reason: Optional[str] = None


class StrategicPlanner:
    """Generates multi-step survival and construction sequences toward escape."""

    @classmethod
    def generate_plan(cls, state: GameState) -> StrategicPlan:
        # If already won
        if state.game_status == "WON":
            return StrategicPlan(
                plan_id=str(uuid.uuid4())[:8],
                goal="Escape Island",
                steps=[],
                total_steps=0,
                status="COMPLETED"
            )

        # Run A* to find optimal action path
        problem = SearchProblem(
            initial_state=state,
            goal_test_fn=lambda s: s.escape_ready() or s.game_status == "WON",
            max_depth=15,
            max_nodes=1200
        )
        search_res = astar_search(problem)

        plan_steps: List[PlanStep] = []
        sim_state = state.clone()
        step_idx = 1
        total_cost = 0.0

        if search_res.success and search_res.path:
            for act_id in search_res.path:
                action = ActionManager.get_action(act_id)
                if not action:
                    continue

                reason = cls._generate_step_reason(action, sim_state)
                plan_steps.append(PlanStep(
                    step_number=step_idx,
                    action_id=action.id,
                    action_name=action.name,
                    category=action.category,
                    reason=reason,
                    expected_energy_cost=action.energy_cost,
                    expected_water_cost=action.water_cost,
                    expected_food_cost=action.food_cost,
                    risk=action.risk
                ))
                step_idx += 1
                total_cost += problem.step_cost(sim_state, action)
                sim_state = problem.transition(sim_state, action)

        else:
            # Fallback heuristic sequence if search hits depth cutoff
            fallback_actions = cls._generate_heuristic_sequence(state)
            for act_id in fallback_actions:
                action = ActionManager.get_action(act_id)
                if not action:
                    continue
                plan_steps.append(PlanStep(
                    step_number=step_idx,
                    action_id=action.id,
                    action_name=action.name,
                    category=action.category,
                    reason=cls._generate_step_reason(action, sim_state),
                    expected_energy_cost=action.energy_cost,
                    expected_water_cost=action.water_cost,
                    expected_food_cost=action.food_cost,
                    risk=action.risk
                ))
                step_idx += 1
                total_cost += action.energy_cost

        # Add launch step if escape ready
        if plan_steps and not any(s.action_id == "launch_escape" for s in plan_steps):
            launch_act = ActionManager.get_action("launch_escape")
            if launch_act:
                plan_steps.append(PlanStep(
                    step_number=step_idx,
                    action_id="launch_escape",
                    action_name="Launch Escape Vessel",
                    category="ESCAPE",
                    reason="Catamaran is fully prepared for open ocean crossing.",
                    expected_energy_cost=30.0,
                    expected_water_cost=15.0,
                    expected_food_cost=10.0,
                    risk=0.1
                ))

        return StrategicPlan(
            plan_id=str(uuid.uuid4())[:8],
            goal="Escape Island via Seaworthy Catamaran",
            steps=plan_steps,
            total_steps=len(plan_steps),
            estimated_total_cost=round(total_cost, 1),
            status="ACTIVE"
        )

    @classmethod
    def _generate_step_reason(cls, action, state: GameState) -> str:
        if action.id == "gather_water":
            return "Replenish water reserves to sustain heavy construction."
        if action.id == "gather_food":
            return "Forage rations to prevent starvation during assembly."
        if action.id == "collect_wood":
            return f"Harvest timber (current {state.wood}/6 needed for hull)."
        if action.id == "explore_eastern_shore":
            return "Scout coastline for flotsam cordage and discover wreckage."
        if action.id == "search_wreckage":
            return "Salvage high-tensile rope and structural metal plates."
        if action.id == "build_boat_hull":
            return "Construct main vessel keel and ribs."
        if action.id == "rig_boat_sails":
            return "Mount mast and lash canvas rigging."
        if action.id == "craft_rudder_keel":
            return "Install steering rudder and stabilizing keel fin."
        if action.id == "stockpile_provisions":
            return "Seal survival rations for open sea voyage."
        if action.id == "launch_escape":
            return "Embark on ocean passage to safety."
        return action.description

    @classmethod
    def _generate_heuristic_sequence(cls, state: GameState) -> List[str]:
        seq = []
        if state.water < 35.0:
            seq.append("gather_water")
        if state.food < 35.0:
            seq.append("gather_food")

        if not state.boat_parts.get("hull", False):
            if state.wood < 6:
                seq.append("collect_wood")
            else:
                seq.append("build_boat_hull")

        if not state.boat_parts.get("rigging", False):
            if state.rope < 4:
                seq.append("explore_eastern_shore")
                seq.append("search_wreckage")
            else:
                seq.append("rig_boat_sails")

        if not state.boat_parts.get("rudder", False):
            if state.metal < 2:
                seq.append("search_wreckage")
            else:
                seq.append("craft_rudder_keel")

        if not state.boat_parts.get("provisions", False):
            seq.append("stockpile_provisions")

        return seq
