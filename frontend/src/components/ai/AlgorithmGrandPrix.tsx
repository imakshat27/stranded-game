import { useRef, useState } from "react";
import { Play, LoaderCircle, Timer, Check, ArrowRight } from "lucide-react";
import { GameState } from "../../types/game";
import { AlgorithmBenchmark } from "../../types/ai";
import { api } from "../../services/api";

const strategies = [
  ["A*", "Cost plus estimated distance to the goal."],
  ["Greedy Best-First", "Prioritizes the estimated distance to the goal."],
  ["UCS", "Explores the lowest accumulated cost first."],
  ["BFS", "Explores the shallowest states first."],
  ["IDS", "Repeats depth-first search with increasing limits."],
  ["DFS", "Follows one branch before backtracking."],
];
const colors = [
  "#acd0b1",
  "#86c9d2",
  "#e5bd7a",
  "#b3a4cf",
  "#d7a1ad",
  "#8cafc8",
];
export function AlgorithmGrandPrix({
  gameState,
}: {
  gameState: GameState | null;
}) {
  const [results, setResults] = useState<AlgorithmBenchmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const run = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      const res = await api.ai.compare({
        gameId: gameState?.game_id,
        state: gameState || undefined,
        maxNodes: 300,
        maxDepth: 8,
      });
      setResults(
        [...res.comparison_table].sort(
          (a, b) => a.execution_time_ms - b.execution_time_ms,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The comparison failed. Try again.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };
  const fastest = Math.max(...results.map((r) => r.execution_time_ms), 1);
  return (
    <div className="field-panel p-5 space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="eyebrow">SIX STRATEGIES / ONE EXPEDITION</span>
          <h2 className="mt-2 mb-2">The algorithm race</h2>
          <p className="text-xs text-slate-400 max-w-lg">
            Compare measured search time, explored states, and path cost for
            your current expedition. Results are ordered by execution time.
          </p>
        </div>
        <button
          className="primary-button self-start"
          disabled={loading}
          onClick={run}
        >
          {loading ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Play size={16} />
          )}{" "}
          {loading
            ? "Running searches…"
            : results.length
              ? "Run again"
              : "Start comparison"}
        </button>
      </div>
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      {!results.length && (
        <div className="strategy-grid">
          {strategies.map(([name, detail], i) => (
            <article key={name} className="strategy-card">
              <span className="eyebrow">0{i + 1} / SEARCH STRATEGY</span>
              <h3>{name}</h3>
              <p>{detail}</p>
              <ArrowRight size={17} />
            </article>
          ))}
        </div>
      )}
      <div aria-live="polite" className="space-y-3">
        {results.map((r, i) => (
          <article key={r.algorithm} className="race-result">
            <div className="race-rank">{String(i + 1).padStart(2, "0")}</div>
            <div className="race-result-body">
              <div className="race-result-heading">
                <h3>{r.algorithm}</h3>
                <span className={r.success ? "gain" : "text-slate-400"}>
                  {r.success ? (
                    <>
                      <Check size={13} /> Escape path found
                    </>
                  ) : r.result === "LIMIT_REACHED" ? (
                    "Search limit reached"
                  ) : (
                    "No escape path found"
                  )}
                </span>
              </div>
              <div className="race-time-track">
                <span
                  style={{
                    width: `${Math.max(2, (r.execution_time_ms / fastest) * 100)}%`,
                    background: colors[i],
                  }}
                />
              </div>
              <div className="race-result-metrics">
                <span>
                  <Timer size={13} />
                  {r.execution_time_ms.toFixed(2)} ms
                </span>
                <span>{r.nodes_explored} states explored</span>
                <span>Path cost: {r.success ? r.cost : "—"}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <p className="panel-note">
        Requested search limits: 300 nodes and depth 8 per algorithm. A search
        that reaches its limit has not established an escape path. Timing can
        vary between runs.
      </p>
    </div>
  );
}
