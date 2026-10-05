"""Bayesian belief updating engine for STRANDED.

Implements rigorous probabilistic inference for environmental perils (storms, animal ambushes)
and resource discovery probabilities using Bayes' Theorem:
P(H | E) = [P(E | H) * P(H)] / P(E).
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.game.state import GameState


class EvidenceItem(BaseModel):
    """An observable piece of evidence with likelihood ratios."""
    id: str
    name: str
    description: str
    likelihood_if_true: float   # P(E | H)
    likelihood_if_false: float  # P(E | ~H)
    observed: bool = False


class BayesianHypothesis(BaseModel):
    """Hypothesis with prior, observed evidence items, and calculated posterior."""
    id: str
    name: str
    description: str
    prior: float
    evidence_list: List[EvidenceItem]

    def compute_posterior(self) -> Dict[str, Any]:
        """Apply sequential Bayesian updates across all observed evidence."""
        current_prior = self.prior
        update_steps: List[Dict[str, Any]] = []

        for ev in self.evidence_list:
            if not ev.observed:
                continue

            p_h = current_prior
            p_not_h = 1.0 - p_h
            p_e_given_h = ev.likelihood_if_true
            p_e_given_not_h = ev.likelihood_if_false

            # Total probability P(E) = P(E | H)*P(H) + P(E | ~H)*P(~H)
            p_e = (p_e_given_h * p_h) + (p_e_given_not_h * p_not_h)
            if p_e == 0:
                p_h_given_e = p_h
            else:
                p_h_given_e = (p_e_given_h * p_h) / p_e

            update_steps.append({
                "evidence_id": ev.id,
                "evidence_name": ev.name,
                "prior_before": round(current_prior, 3),
                "likelihood_h": ev.likelihood_if_true,
                "likelihood_not_h": ev.likelihood_if_false,
                "marginal_pe": round(p_e, 3),
                "posterior_after": round(p_h_given_e, 3)
            })
            current_prior = p_h_given_e

        return {
            "hypothesis_id": self.id,
            "hypothesis_name": self.name,
            "initial_prior": self.prior,
            "final_posterior": round(current_prior, 3),
            "percentage": round(current_prior * 100.0, 1),
            "update_steps": update_steps,
            "observed_count": sum(1 for e in self.evidence_list if e.observed)
        }


class BayesianEngine:
    """Manages domain Bayesian probability networks."""

    @classmethod
    def get_storm_forecast(cls, state: GameState, observed_signals: Optional[List[str]] = None) -> Dict[str, Any]:
        """Calculates storm probability incorporating weather, season, and atmospheric evidence."""
        # Prior derived from base difficulty
        env_risk = state.difficulty_profile.get("environmental_risk", 0.4)
        base_prior = 0.15 + (env_risk * 0.25)
        if state.weather == "stormy":
            base_prior = 0.65
        elif state.weather == "rainy":
            base_prior = 0.40

        evidence = [
            EvidenceItem(
                id="barometer_drop",
                name="Sharp Barometric Pressure Drop",
                description="Rapid atmospheric pressure plunge indicating an approaching oceanic depression.",
                likelihood_if_true=0.85,
                likelihood_if_false=0.15,
                observed="barometer_drop" in (observed_signals or ["barometer_drop"] if state.weather in ("rainy", "stormy") else [])
            ),
            EvidenceItem(
                id="cumulonimbus_buildup",
                name="Towering Cumulonimbus Wall",
                description="Dense anvil storm clouds gathering along the eastern horizon.",
                likelihood_if_true=0.90,
                likelihood_if_false=0.20,
                observed="cumulonimbus_buildup" in (observed_signals or ["cumulonimbus_buildup"] if state.weather == "stormy" else [])
            ),
            EvidenceItem(
                id="swell_intensity",
                name="Heavy Coastal Breaker Swell",
                description="High turbulent breaker sets crashing beyond the outer reef.",
                likelihood_if_true=0.75,
                likelihood_if_false=0.25,
                observed="swell_intensity" in (observed_signals or [])
            )
        ]

        hyp = BayesianHypothesis(
            id="severe_storm_imminent",
            name="Imminent Severe Storm Event",
            description="Probability that an acute tempest strikes the island within the next 24 hours.",
            prior=round(base_prior, 3),
            evidence_list=evidence
        )
        return hyp.compute_posterior()

    @classmethod
    def get_salvage_probability(cls, state: GameState, observed_signals: Optional[List[str]] = None) -> Dict[str, Any]:
        """Calculates likelihood of discovering intact salvage on next exploration."""
        base_prior = 0.35
        evidence = [
            EvidenceItem(
                id="low_tide_window",
                name="Spring Low Tide Window",
                description="Exposed submerged reefs and hull sections normally covered by 10 feet of surf.",
                likelihood_if_true=0.80,
                likelihood_if_false=0.30,
                observed="low_tide_window" in (observed_signals or ["low_tide_window"])
            ),
            EvidenceItem(
                id="iron_tools_equipped",
                name="Improvised Prying Tools Equipped",
                description="Metal chisels available to breach bolted locker seams.",
                likelihood_if_true=0.75,
                likelihood_if_false=0.40,
                observed=state.tools > 0 or ("iron_tools_equipped" in (observed_signals or []))
            ),
            EvidenceItem(
                id="wreck_debris_flotsam",
                name="Fresh Cargo Flotsam on Beach",
                description="Sealed wooden crates washed ashore over the last 12 hours.",
                likelihood_if_true=0.85,
                likelihood_if_false=0.20,
                observed="wreck_debris_flotsam" in (observed_signals or [])
            )
        ]

        hyp = BayesianHypothesis(
            id="salvage_success",
            name="Shipwreck Salvage Success",
            description="Probability of recovering metal plates, tools, or rope during wreck exploration.",
            prior=round(base_prior, 3),
            evidence_list=evidence
        )
        return hyp.compute_posterior()
