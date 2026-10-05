"""Backward Chaining goal decomposition engine for STRANDED.

Reasons backwards from the ultimate objective (escape) through required sub-goals,
identifying currently satisfied prerequisites and unfulfilled dependencies grounded in state facts.
"""

from typing import Any, Dict, List, Optional
from app.game.state import GameState
from app.reasoning.facts import extract_facts


class GoalNode:
    """Represents a goal or subgoal in the backward chaining tree."""
    def __init__(self, name: str, description: str, satisfied: bool = False):
        self.name = name
        self.description = description
        self.satisfied = satisfied
        self.subgoals: List["GoalNode"] = []
        self.action_hint: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "satisfied": self.satisfied,
            "action_hint": self.action_hint,
            "subgoals": [sg.to_dict() for sg in self.subgoals]
        }


class BackwardChainingEngine:
    """Decomposes goals backward to ground state facts and actions."""

    @classmethod
    def decompose_escape_goal(cls, state: GameState) -> Dict[str, Any]:
        facts = extract_facts(state)

        # Root Goal: Escape
        root = GoalNode(
            "Escape Island",
            "Safely depart the island aboard a seaworthy catamaran.",
            state.game_status == "WON"
        )

        # Subgoal 1: Vessel Complete
        vessel_node = GoalNode(
            "Catamaran Construction",
            "All critical vessel components assembled.",
            "escape_ready" in facts
        )

        # Hull Subgoal
        hull_satisfied = "hull_built" in facts
        hull_node = GoalNode("Construct Boat Hull", "Solid wooden keel and ribs assembled.", hull_satisfied)
        hull_wood_req = GoalNode(
            "Acquire 6 Timber",
            f"Wood inventory: {state.wood}/6",
            "wood_sufficient_for_hull" in facts or hull_satisfied
        )
        hull_wood_req.action_hint = "collect_wood"
        hull_node.subgoals.append(hull_wood_req)
        if not hull_satisfied and "wood_sufficient_for_hull" in facts:
            hull_node.action_hint = "build_boat_hull"
        vessel_node.subgoals.append(hull_node)

        # Rigging Subgoal
        rigging_satisfied = "rigging_built" in facts
        rig_node = GoalNode("Rig Sails & Cordage", "Canvas and marine-grade rope rigged to mast.", rigging_satisfied)
        rig_rope_req = GoalNode(
            "Acquire 4 Marine Rope",
            f"Rope inventory: {state.rope}/4",
            "rope_sufficient_for_rigging" in facts or rigging_satisfied
        )
        rig_rope_req.action_hint = "search_wreckage"
        rig_node.subgoals.append(rig_rope_req)
        if not rigging_satisfied and "rope_sufficient_for_rigging" in facts:
            rig_node.action_hint = "rig_boat_sails"
        vessel_node.subgoals.append(rig_node)

        # Rudder Subgoal
        rudder_satisfied = "rudder_built" in facts
        rudder_node = GoalNode("Fashion Rudder & Keel", "Steering gear and metal stabilizers mounted.", rudder_satisfied)
        rudder_mat_req = GoalNode(
            "Acquire 3 Wood & 2 Metal",
            f"Materials: Wood {state.wood}/3, Metal {state.metal}/2",
            "materials_sufficient_for_rudder" in facts or rudder_satisfied
        )
        rudder_mat_req.action_hint = "search_wreckage"
        rudder_node.subgoals.append(rudder_mat_req)
        if not rudder_satisfied and "materials_sufficient_for_rudder" in facts:
            rudder_node.action_hint = "craft_rudder_keel"
        vessel_node.subgoals.append(rudder_node)

        # Provisions Subgoal
        prov_satisfied = "provisions_secured" in facts
        prov_node = GoalNode("Stockpile Sea Provisions", "Casks filled with 25 water and 25 rations.", prov_satisfied)
        prov_res_req = GoalNode(
            "Stockpile 35 Water & 35 Food",
            f"Vitals: Water {state.water:.0f}/35, Food {state.food:.0f}/35",
            "provisions_sufficient" in facts or prov_satisfied
        )
        prov_res_req.action_hint = "gather_water" if state.water < 35.0 else "gather_food"
        prov_node.subgoals.append(prov_res_req)
        if not prov_satisfied and "provisions_sufficient" in facts:
            prov_node.action_hint = "stockpile_provisions"
        vessel_node.subgoals.append(prov_node)

        root.subgoals.append(vessel_node)

        # Subgoal 2: Launch Action
        launch_node = GoalNode(
            "Launch Vessel",
            "Embark and navigate past the coastal reef barrier.",
            state.game_status == "WON"
        )
        if state.escape_ready() and state.energy >= 30.0:
            launch_node.action_hint = "launch_escape"
        root.subgoals.append(launch_node)

        # Compute summary
        total_subgoals = 0
        satisfied_subgoals = 0

        def count_goals(node: GoalNode):
            nonlocal total_subgoals, satisfied_subgoals
            total_subgoals += 1
            if node.satisfied:
                satisfied_subgoals += 1
            for child in node.subgoals:
                count_goals(child)

        count_goals(root)

        completion_pct = (
            round((satisfied_subgoals / total_subgoals) * 100.0, 1)
            if total_subgoals > 0
            else 0.0
        )

        return {
            "root_goal": "escape",
            "goal_tree": root.to_dict(),
            "total_subgoals": total_subgoals,
            "satisfied_subgoals": satisfied_subgoals,
            "completion_percentage": completion_pct,
            "next_logical_action": cls.find_first_unfulfilled_action(root)
        }

    @classmethod
    def find_first_unfulfilled_action(cls, node: GoalNode) -> Optional[str]:
        """Find the immediate deepest actionable step needed."""
        for child in node.subgoals:
            if not child.satisfied:
                res = cls.find_first_unfulfilled_action(child)
                if res:
                    return res
        if not node.satisfied and node.action_hint:
            return node.action_hint
        return None
