import { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { GameState } from "../../types/game";
import type { GoalNode } from "../../types/ai";
export function KnowledgeView({ gameState }: { gameState: GameState | null }) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof api.ai.reason>
  > | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    if (gameState)
      api.ai
        .reason(undefined, gameState)
        .then((d) => {
          if (alive) setData(d);
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    return () => {
      alive = false;
    };
  }, [gameState]);
  return (
    <section className="rules-view">
      <h2>Rules & requirements</h2>
      <p>
        What must be true before you can escape? This view explains the
        requirements using your current expedition.
      </p>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {gameState && !data && !error && (
        <p role="status">Checking requirements…</p>
      )}
      {data && (
        <>
          <h3>What needs attention</h3>
          {data.forward_chaining.recommendations.length ? (
            <ul className="recommendation-list">
              {data.forward_chaining.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          ) : (
            <p>
              No urgent rule warnings. Check the remaining escape requirements
              below.
            </p>
          )}
          <h3>Escape requirements</h3>
          <Goal node={data.backward_chaining.goal_tree} />
          <details>
            <summary>How the rules reached these conclusions</summary>
            <p>
              Forward chaining starts with known facts and applies rules.
              Backward chaining starts with the escape goal and checks its
              requirements.
            </p>
            {data.forward_chaining.triggered_rules.map((rule) => (
              <div className="rule-explanation" key={rule.rule_id}>
                <strong>{rule.description}</strong>
                <p>
                  If{" "}
                  {rule.antecedents
                    .map((s) => s.replaceAll("_", " "))
                    .join(" and ")}{" "}
                  → {rule.consequent.replaceAll("_", " ")}
                </p>
                <p>{rule.recommendation}</p>
              </div>
            ))}
            <details>
              <summary>
                All facts · {data.forward_chaining.all_facts.length}
              </summary>
              <ul>
                {data.forward_chaining.all_facts.map((f) => (
                  <li key={f}>{f.replaceAll("_", " ")}</li>
                ))}
              </ul>
            </details>
          </details>
        </>
      )}
    </section>
  );
}
function Goal({ node }: { node: GoalNode }) {
  return (
    <div className={`requirement-node ${node.satisfied ? "satisfied" : ""}`}>
      <strong>
        {node.satisfied ? "✓" : "○"}{" "}
        {node.description || node.name.replaceAll("_", " ")}
      </strong>
      {node.action_hint && !node.satisfied && (
        <small>
          Possible next action: {node.action_hint.replaceAll("_", " ")}
        </small>
      )}
      {node.subgoals?.length > 0 && (
        <details open={!node.satisfied}>
          <summary>
            {node.subgoals.filter((n) => n.satisfied).length}/
            {node.subgoals.length} requirements met
          </summary>
          {node.subgoals.map((n, i) => (
            <Goal key={i} node={n} />
          ))}
        </details>
      )}
    </div>
  );
}
