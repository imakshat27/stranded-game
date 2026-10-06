import { useEffect, useRef, useState } from "react";
import type { StrategicPlan, ReplanningResult } from "../../types/ai";
import type { GameState, ActionOption } from "../../types/game";
import { api } from "../../services/api";
export function PlanningView({
  gameState,
  actionOptions,
  onSelectAction,
  onNavigateToGame,
}: {
  gameState: GameState | null;
  actionOptions?: ActionOption[];
  onSelectAction?: (id: string) => void;
  onNavigateToGame?: () => void;
}) {
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [preview, setPreview] = useState<ReplanningResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const sequence = useRef(0);
  useEffect(() => {
    const id = ++sequence.current;
    setLoading(true);
    setError("");
    setPlan(null);
    setPreview(null);
    if (!gameState) {
      setLoading(false);
      return;
    }
    api.ai
      .plan(undefined, gameState)
      .then((p) => {
        if (id === sequence.current) setPlan(p);
      })
      .catch((e) => {
        if (id === sequence.current) setError(e.message);
      })
      .finally(() => {
        if (id === sequence.current) setLoading(false);
      });
    return () => {
      sequence.current++;
    };
  }, [gameState]);
  const simulate = async () => {
    if (!gameState || !plan || loading) return;
    const id = ++sequence.current;
    setLoading(true);
    setError("");
    try {
      const result = await api.ai.replan({
        state: gameState,
        currentPlan: plan,
        simulateStormDamage: true,
      });
      if (id === sequence.current) setPreview(result);
    } catch (e) {
      if (id === sequence.current)
        setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  };
  const first = plan?.steps[0];
  const option = actionOptions?.find((o) => o.action.id === first?.action_id);
  return (
    <section className="escape-plan">
      <h2>Escape plan</h2>
      <p>
        Keep yourself alive while assembling all four boat parts. The next step
        adapts to your current supplies.
      </p>
      {gameState && (
        <div className="boat-checklist">
          {Object.entries(gameState.boat_parts).map(([part, built]) => (
            <div key={part} className={built ? "built" : ""}>
              <span>
                {built ? "✓" : "○"} {part}
              </span>
              <small>{built ? "Ready" : "Still needed"}</small>
            </div>
          ))}
        </div>
      )}
      {loading && <p role="status">Preparing your route…</p>}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {first && (
        <div className="next-step">
          <small>Next requirement</small>
          <h3>{first.action_name}</h3>
          <p>{first.reason}</p>
          <p className="choice-cost">
            Energy −{first.expected_energy_cost} · Water −
            {first.expected_water_cost} · Food −{first.expected_food_cost}
          </p>
          {option && !option.available && <p>{option.unavailable_reason}</p>}
          {onSelectAction && (
            <button
              className="primary-button"
              disabled={
                loading ||
                !option?.available ||
                gameState?.game_status !== "ACTIVE"
              }
              onClick={() => {
                onSelectAction(first.action_id);
                onNavigateToGame?.();
              }}
            >
              Take this action · uses 1 turn
            </button>
          )}
        </div>
      )}
      {plan && !first && (
        <p>
          {gameState?.game_status === "WON"
            ? "You escaped the island."
            : "Check your boat requirements and available actions."}
        </p>
      )}
      {plan && (
        <details>
          <summary>Full route · {plan.steps.length} steps</summary>
          <ol className="plan-list">
            {plan.steps.map((step, i) => (
              <li key={`${i}-${step.action_id}`}>
                <strong>{step.action_name}</strong>
                <p>{step.reason}</p>
              </li>
            ))}
          </ol>
          <p>
            Future steps are estimates. Resources, weather, and events may
            change the route.
          </p>
        </details>
      )}
      <details className="crisis-preview">
        <summary>What if a storm interrupts the plan?</summary>
        <p>
          Hypothetical experiment: remove up to 4 wood, reduce health, and
          simulate stormy weather. Your expedition remains unchanged.
        </p>
        <button disabled={loading || !plan} onClick={simulate}>
          Preview storm recovery
        </button>
        {preview && (
          <div>
            <strong>Simulation only</strong>
            <p>
              {preview.invalidation_reason ||
                "The next planned action remains possible in this scenario."}
            </p>
            <ol className="plan-list">
              {preview.new_plan.steps.map((step, i) => (
                <li key={i}>{step.action_name}</li>
              ))}
            </ol>
            <p>Return to the live plan above to take an action.</p>
          </div>
        )}
      </details>
    </section>
  );
}
