import { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import { SurvivalGraph } from "../graph/SurvivalGraph";
const directives = [
  ["claim_spring", "Secure the water spring"],
  ["salvage_wreck", "Salvage the wreck"],
  ["build_vessel", "Build the vessel"],
  ["rest_and_guard", "Rest and guard"],
];
export function RivalModeView() {
  const [algorithm, setAlgorithm] = useState<"alpha_beta" | "minimax">(
    "alpha_beta",
  );
  const [depth, setDepth] = useState(3);
  const [action, setAction] = useState("claim_spring");
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof api.ai.rival>
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const seq = useRef(0);
  useEffect(
    () => () => {
      seq.current++;
    },
    [],
  );
  const run = async () => {
    if (loading) return;
    const id = ++seq.current;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const d = await api.ai.rival({ algorithm, depth, playerAction: action });
      if (id === seq.current) setResult(d);
    } catch (e) {
      if (id === seq.current)
        setError(e instanceof Error ? e.message : "Experiment failed");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  };
  return (
    <section className="rival-sandbox">
      <h2>Rival sandbox</h2>
      <p>
        How does an opponent respond to your choice? Each experiment starts from
        the same two-camp scenario. No ongoing match or expedition resources are
        changed.
      </p>
      <div className="graph-toolbar">
        <label>
          Your opening choice{" "}
          <select
            disabled={loading}
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setResult(null);
            }}
          >
            {directives.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Algorithm{" "}
          <select
            disabled={loading}
            value={algorithm}
            onChange={(e) => {
              setAlgorithm(e.target.value as typeof algorithm);
              setResult(null);
            }}
          >
            <option value="alpha_beta">Alpha-Beta</option>
            <option value="minimax">Minimax</option>
          </select>
        </label>
        <label>
          Depth{" "}
          <select
            disabled={loading}
            value={depth}
            onChange={(e) => {
              setDepth(Number(e.target.value));
              setResult(null);
            }}
          >
            {[2, 3, 4].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <button className="primary-button" disabled={loading} onClick={run}>
          {loading ? "Considering responses…" : "Test response"}
        </button>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="next-step">
          <small>Predicted response · {result.algorithm}</small>
          <h3>{result.best_action.replaceAll("_", " ")}</h3>
          <p>
            The search alternates between camps and evaluates the resulting
            advantage. Alpha-Beta can skip branches that cannot improve the
            decision.
          </p>
          <details>
            <summary>Search details</summary>
            <p>
              {result.nodes_explored} states examined ·{" "}
              {result.pruned_branches ?? 0} branches pruned · utility{" "}
              {result.best_value} · {result.execution_time_ms.toFixed(2)} ms
            </p>
            <p>
              The backend records a sample of this adversarial tree. It is not
              the complete survival search graph.
            </p>
            <SurvivalGraph
              nodes={result.tree_nodes.map((n) => ({
                ...n,
                provenance: "simulated",
                ai_commentary: `Utility: ${n.value ?? "unknown"}. ${n.is_max ? "Maximizing" : "Minimizing"} turn.`,
              }))}
              edges={result.tree_edges}
              currentId={result.tree_nodes.find((n) => n.id === "Root")?.id}
            />
          </details>
        </div>
      )}
    </section>
  );
}
