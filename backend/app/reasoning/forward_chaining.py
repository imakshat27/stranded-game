"""Forward Chaining inference engine for STRANDED.

Fires rules matching known state facts and iteratively deduces derived facts,
strategic risks, and actionable operational advisories.
"""

from typing import Any, Dict, List, Set
from app.game.state import GameState
from app.reasoning.facts import extract_facts
from app.reasoning.rules import Rule, DEFAULT_RULES


class ForwardChainingEngine:
    """Propagates facts forward through inference rules."""

    @classmethod
    def infer(cls, state: GameState, rules: List[Rule] = DEFAULT_RULES) -> Dict[str, Any]:
        known_facts: Set[str] = extract_facts(state)
        initial_facts = list(known_facts)
        triggered_rules: List[Dict[str, Any]] = []
        derived_facts: Set[str] = set()

        changed = True
        iterations = 0
        max_iterations = 15

        while changed and iterations < max_iterations:
            changed = False
            iterations += 1

            for rule in sorted(rules, key=lambda r: r.priority, reverse=True):
                # Check if all antecedents are present in known_facts
                if all(ant in known_facts for ant in rule.antecedents):
                    if rule.consequent not in known_facts:
                        known_facts.add(rule.consequent)
                        derived_facts.add(rule.consequent)
                        triggered_rules.append({
                            "rule_id": rule.id,
                            "antecedents": rule.antecedents,
                            "consequent": rule.consequent,
                            "description": rule.description,
                            "recommendation": rule.recommendation,
                            "priority": rule.priority
                        })
                        changed = True

        # Extract top recommendations
        recommendations = [
            tr["recommendation"] for tr in sorted(triggered_rules, key=lambda r: r["priority"], reverse=True)
        ]

        return {
            "initial_facts": initial_facts,
            "derived_facts": list(derived_facts),
            "all_facts": list(known_facts),
            "triggered_rules": triggered_rules,
            "recommendations": recommendations,
            "iterations": iterations
        }
