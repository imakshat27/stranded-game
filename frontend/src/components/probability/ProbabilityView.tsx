import { useEffect, useState } from "react";
import type { GameState } from "../../types/game";
import type { BayesianResult } from "../../types/ai";
import { api } from "../../services/api";
const signals = {
  storm: [
    ["barometer_drop", "Falling air pressure"],
    ["cumulonimbus_buildup", "Dark clouds building"],
    ["swell_intensity", "Heavy ocean swell"],
  ],
  salvage: [
    ["low_tide_window", "Low tide"],
    ["iron_tools_equipped", "Prying tools available"],
    ["wreck_debris_flotsam", "Cargo debris on the shore"],
  ],
};
export function ProbabilityView({
  gameState,
}: {
  gameState: GameState | null;
}) {
  const [scenario, setScenario] = useState<"storm" | "salvage">("storm");
  const [observations, setObservations] = useState<string[]>([]);
  const [result, setResult] = useState<BayesianResult | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setResult(null);
    setError("");
    if (gameState)
      api.ai
        .probability({
          state: gameState,
          scenario,
          observedSignals: observations,
        })
        .then((d) => {
          if (alive) setResult(d);
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    return () => {
      alive = false;
    };
  }, [scenario, observations, gameState]);
  return (
    <section className="risk-view">
      <h2>Risk experiments</h2>
      <p>
        How would new evidence change your estimate? Toggle hypothetical
        observations to see Bayesian belief updating.
      </p>
      <div className="graph-toolbar">
        <label>
          Question{" "}
          <select
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value as typeof scenario);
              setObservations([]);
            }}
          >
            <option value="storm">How likely is a storm?</option>
            <option value="salvage">How likely is useful salvage?</option>
          </select>
        </label>
      </div>
      <div className="signal-options">
        {signals[scenario].map(([id, label]) => {
          const equipped =
            id === "iron_tools_equipped" && (gameState?.tools ?? 0) > 0;
          return (
            <label key={id}>
              <input
                type="checkbox"
                checked={equipped || observations.includes(id)}
                disabled={equipped}
                onChange={() =>
                  setObservations((old) =>
                    old.includes(id)
                      ? old.filter((x) => x !== id)
                      : [...old, id],
                  )
                }
              />
              {label}
              {equipped && <small>From your bag</small>}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {gameState && !result && !error && (
        <p role="status">Updating estimate…</p>
      )}
      {result && (
        <>
          <div className="risk-result">
            <span>
              {scenario === "storm"
                ? "Storm estimate"
                : "Useful salvage estimate"}
            </span>
            <strong>{result.percentage.toFixed(1)}%</strong>
            <p>
              Before evidence: {(result.initial_prior * 100).toFixed(1)}% ·
              After evidence: {(result.final_posterior * 100).toFixed(1)}%
            </p>
          </div>
          <p>
            {scenario === "storm"
              ? "A higher estimate is a reason to check shelter and recovery supplies before exposed work."
              : "A higher estimate suggests more promising salvage conditions; action costs and requirements still apply."}
          </p>
          <p className="panel-note">
            This experiment does not change your weather, discoveries, or next
            random outcome.
          </p>
          <details>
            <summary>See the calculation</summary>
            <p>
              P(H | E) = P(E | H) × P(H) / P(E). Each observation updates the
              previous estimate.
            </p>
            {result.update_steps.map((step) => (
              <div className="rule-explanation" key={step.evidence_id}>
                <strong>{step.evidence_name}</strong>
                <p>
                  {(step.prior_before * 100).toFixed(1)}% →{" "}
                  {(step.posterior_after * 100).toFixed(1)}%
                </p>
                <p>
                  Likelihood if true: {step.likelihood_h} · Likelihood if false:{" "}
                  {step.likelihood_not_h}
                </p>
              </div>
            ))}
            {!result.update_steps.length && (
              <p>No evidence selected. The estimate remains at its prior.</p>
            )}
          </details>
        </>
      )}
    </section>
  );
}
