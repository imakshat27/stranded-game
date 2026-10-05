"""Reasoning and Knowledge Representation package."""

from app.reasoning.facts import extract_facts
from app.reasoning.rules import Rule, DEFAULT_RULES
from app.reasoning.forward_chaining import ForwardChainingEngine
from app.reasoning.backward_chaining import BackwardChainingEngine

__all__ = [
    "extract_facts",
    "Rule",
    "DEFAULT_RULES",
    "ForwardChainingEngine",
    "BackwardChainingEngine",
]
