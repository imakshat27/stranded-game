"""Replanning engine for STRANDED.

Detects when unexpected environmental crises (storms, resource loss, injury)
break preconditions of existing strategic plans and synthesizes updated recovery plans.
"""

from typing import Any, Dict, List, Optional
from app.game.state import GameState
from app.game.actions import ActionManager
from app.planning.planner import StrategicPlan, StrategicPlanner


class ReplanningResult:
    """Carries old plan, invalidation diagnosis, and new plan."""
    def __init__(
        self,
        old_plan: StrategicPlan,
        is_plan_valid: bool,
        invalidation_reason: Optional[str],
        broken_step_index: Optional[int],
        new_plan: StrategicPlan
    ):
        self.old_plan = old_plan
        self.is_plan_valid = is_plan_valid
        self.invalidation_reason = invalidation_reason
        self.broken_step_index = broken_step_index
        self.new_plan = new_plan

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_plan_valid": self.is_plan_valid,
            "invalidation_reason": self.invalidation_reason,
            "broken_step_index": self.broken_step_index,
            "old_plan": self.old_plan.model_dump(),
            "new_plan": self.new_plan.model_dump()
        }


class Replanner:
    """Verifies existing plan validity against current state and replans on divergence."""

    @classmethod
    def check_and_replan(cls, state: GameState, current_plan: StrategicPlan) -> ReplanningResult:
        if not current_plan.steps:
            new_plan = StrategicPlanner.generate_plan(state)
            return ReplanningResult(
                old_plan=current_plan,
                is_plan_valid=False,
                invalidation_reason="Existing plan was empty.",
                broken_step_index=0,
                new_plan=new_plan
            )

        # Inspect next pending step
        first_step = current_plan.steps[0]
        action = ActionManager.get_action(first_step.action_id)

        is_valid = True
        reason = None
        broken_idx = None

        if not action:
            is_valid = False
            reason = f"Action '{first_step.action_id}' no longer recognized in catalog."
            broken_idx = 0
        else:
            can_do, err = ActionManager.is_action_valid(state, action)
            if not can_do:
                is_valid = False
                reason = f"Preconditions for step 1 ({first_step.action_name}) broken: {err}"
                broken_idx = 0

        # Also verify if urgent life-threatening crises arose (critical water or storm damage)
        if state.health < 25.0 and first_step.action_id != "rest_and_recover":
            is_valid = False
            reason = f"Critical health emergency ({state.health:.0f} HP)! Must rest or recover before continuing construction."
            broken_idx = 0
        elif state.water < 15.0 and first_step.action_id != "gather_water":
            is_valid = False
            reason = f"Severe dehydration threat ({state.water:.0f} Water)! Gathering drinking water supersedes construction."
            broken_idx = 0

        if not is_valid:
            # Mark old plan invalidated
            current_plan.status = "INVALIDATED"
            current_plan.invalidation_reason = reason

            # Generate fresh adapted plan from the new state
            new_plan = StrategicPlanner.generate_plan(state)

            return ReplanningResult(
                old_plan=current_plan,
                is_plan_valid=False,
                invalidation_reason=reason,
                broken_step_index=broken_idx,
                new_plan=new_plan
            )

        # Plan remains valid
        return ReplanningResult(
            old_plan=current_plan,
            is_plan_valid=True,
            invalidation_reason=None,
            broken_step_index=None,
            new_plan=current_plan
        )
