import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { api } from "../../services/api";
import type { GameState } from "../../types/game";
import type { SearchResult } from "../../types/ai";
import type { GraphNode } from "../../types/graph";
import { SurvivalGraph } from "../graph/SurvivalGraph";
const algorithms = [
  [
    "astar",
    "A*",
    "Balances the cost spent with an estimate of the work remaining.",
  ],
  [
    "bfs",
    "BFS",
    "Explores one depth at a time, seeking a route with fewer actions.",
  ],
  ["dfs", "DFS", "Follows one branch deeply before trying another."],
  [
    "ucs",
    "UCS",
    "Expands the route with the lowest accumulated survival cost.",
  ],
  [
    "best_first",
    "Greedy",
    "Prioritizes the estimated distance to a completed boat.",
  ],
  ["ids", "IDS", "Repeats depth-limited exploration with increasing depth."],
  [
    "hill_climbing",
    "Hill Climbing",
    "Chooses the locally best next state; may get stuck.",
  ],
];
export function SearchCompareView({
  gameState,
}: {
  gameState: GameState | null;
}) {
  const [algorithm, setAlgorithm] = useState("astar");
  const [other, setOther] = useState("bfs");
  const [compare, setCompare] = useState(false);
  const [budget, setBudget] = useState(150);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof api.ai.compare>
  > | null>(null);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(650);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<GameState | null>(null);
  const sequence = useRef(0);
  const selectedTraces = [
    result?.traces[algorithm],
    ...(compare ? [result?.traces[other]] : []),
  ].filter((r): r is SearchResult => !!r);
  const maxStep = Math.max(
    0,
    ...selectedTraces.map((r) => r.visualization_steps.length - 1),
  );
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(
      () =>
        setCursor((c) => {
          if (c >= maxStep) {
            setPlaying(false);
            return c;
          }
          return c + 1;
        }),
      speed,
    );
    return () => clearInterval(timer);
  }, [playing, speed, maxStep]);
  useEffect(() => {
    setCursor(0);
    setPlaying(false);
  }, [algorithm, other, compare]);
  useEffect(
    () => () => {
      sequence.current++;
    },
    [],
  );
  const run = async () => {
    if (!gameState || loading) return;
    const id = ++sequence.current;
    const frozen = structuredClone(gameState);
    setLoading(true);
    setError("");
    setPlaying(false);
    setResult(null);
    setSnapshot(frozen);
    setCursor(0);
    try {
      const data = await api.ai.compare({
        state: frozen,
        algorithms: algorithms.map(([key]) => key),
        maxNodes: budget,
        maxDepth: 12,
        includeTraces: true,
      });
      if (id === sequence.current) setResult(data);
    } catch (e) {
      if (id === sequence.current)
        setError(e instanceof Error ? e.message : "Search failed. Try again.");
    } finally {
      if (id === sequence.current) setLoading(false);
    }
  };
  const stale =
    snapshot &&
    gameState &&
    snapshot.player_profile.total_actions !==
      gameState.player_profile.total_actions;
  return (
    <section className="search-compare">
      <div className="tool-heading">
        <h2>Search & Compare</h2>
        <p>
          How do algorithms choose a route to escape? Each circle is a possible
          survival state, not a location.
        </p>
      </div>
      <div className="graph-toolbar">
        <label>
          Algorithm{" "}
          <select
            value={algorithm}
            onChange={(e) => {
              setAlgorithm(e.target.value);
              if (e.target.value === other) setOther(algorithm);
            }}
          >
            {algorithms.map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
          />{" "}
          Compare two
        </label>
        {compare && (
          <label>
            Compare with{" "}
            <select value={other} onChange={(e) => setOther(e.target.value)}>
              {algorithms
                .filter(([key]) => key !== algorithm)
                .map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
            </select>
          </label>
        )}
        <label>
          Node budget{" "}
          <select
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          >
            {[60, 150, 300, 600].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <button
          className="primary-button"
          disabled={loading || !gameState}
          onClick={run}
        >
          {loading
            ? "Recording searches…"
            : result
              ? "Run again"
              : "Run search"}
        </button>
      </div>
      <p className="panel-note">
        {algorithms.find(([key]) => key === algorithm)?.[2]} Searches use
        deterministic outcomes and cloned states. Your expedition is unchanged.
      </p>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {!result && !loading && (
        <div className="search-empty">
          <GitDemo />
          <h3>See the decisions behind the route</h3>
          <p>
            Run a search, then replay its node expansions. Switch algorithms to
            compare the order they explore.
          </p>
          <p>
            Goal: all four boat parts assembled. Every search uses the same
            state, depth limit of 12, and chosen node budget.
          </p>
        </div>
      )}
      {stale && (
        <p className="inline-error">
          This recording starts from an earlier turn. Run again to use your
          current expedition.
        </p>
      )}
      {result && (
        <>
          <div className="playback-controls">
            <button
              aria-label="Previous expansion"
              disabled={!cursor}
              onClick={() => {
                setPlaying(false);
                setCursor((c) => c - 1);
              }}
            >
              <SkipBack size={17} />
            </button>
            <button
              disabled={!maxStep}
              onClick={() => {
                if (cursor === maxStep) setCursor(0);
                setPlaying(!playing);
              }}
            >
              {playing ? <Pause size={17} /> : <Play size={17} />}
              {playing ? "Pause" : "Replay"}
            </button>
            <button
              aria-label="Next expansion"
              disabled={cursor >= maxStep}
              onClick={() => {
                setPlaying(false);
                setCursor((c) => c + 1);
              }}
            >
              <SkipForward size={17} />
            </button>
            <input
              aria-label="Search expansion"
              type="range"
              min={0}
              max={maxStep}
              value={Math.min(cursor, maxStep)}
              onChange={(e) => {
                setPlaying(false);
                setCursor(Number(e.target.value));
              }}
            />
            <span>
              Expansion {Math.min(cursor, maxStep) + 1} / {maxStep + 1}
            </span>
            <label>
              Speed{" "}
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={1200}>Slow</option>
                <option value={650}>Normal</option>
                <option value={200}>Fast</option>
              </select>
            </label>
          </div>
          <div className={`search-graphs ${compare ? "two-graphs" : ""}`}>
            {selectedTraces.map((trace) => (
              <TraceGraph key={trace.algorithm} trace={trace} cursor={cursor} />
            ))}
          </div>
          <details className="comparison-details">
            <summary>Compare results & understand the metrics</summary>
            <p>
              Replay is recorded traversal, not a live speed contest. No single
              algorithm wins every measure. A limit reached does not prove that
              escape is impossible.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>Goal reached</th>
                    <th title="States removed from the frontier and examined">
                      Explored states
                    </th>
                    <th>Route actions</th>
                    <th title="Energy + 1.2 × water + food + 25 × risk per action; minimum 1">
                      Survival cost
                    </th>
                    <th>Runtime</th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison_table.map((r) => (
                    <tr key={r.algorithm}>
                      <td>{r.algorithm}</td>
                      <td>
                        {r.success
                          ? "Yes"
                          : r.result.replaceAll("_", " ").toLowerCase()}
                      </td>
                      <td>{r.nodes_explored}</td>
                      <td>
                        {r.success
                          ? (result.traces[
                              algorithms.find(
                                ([, label]) =>
                                  label === r.algorithm ||
                                  (label === "Greedy" &&
                                    r.algorithm.includes("Best")),
                              )?.[0] || ""
                            ]?.path.length ?? r.depth)
                          : "—"}
                      </td>
                      <td>{r.success ? r.cost.toFixed(1) : "—"}</td>
                      <td>{r.execution_time_ms.toFixed(2)} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              <b>Frontier:</b> generated states waiting to be explored.{" "}
              <b>Visited:</b> states already examined. <b>g:</b> accumulated
              cost. <b>h:</b> estimated remaining cost. <b>f:</b> g + h.
            </p>
            <p>
              Runtime varies between runs. Optimality and completeness depend on
              the algorithm, heuristic, state representation, and search limits.
            </p>
          </details>
        </>
      )}
    </section>
  );
}
function TraceGraph({
  trace,
  cursor,
}: {
  trace: SearchResult;
  cursor: number;
}) {
  const index = Math.min(
    cursor,
    Math.max(0, trace.visualization_steps.length - 1),
  );
  const step = trace.visualization_steps[index];
  const visited = new Set(
    trace.visualization_steps.slice(0, index + 1).map((s) => s.current_node),
  );
  const frontier = new Set(step?.frontier || []);
  const nodes: GraphNode[] = trace.tree_nodes.map((n) => ({
    ...n,
    provenance: "simulated",
    traversal:
      n.id === step?.current_node
        ? "current"
        : visited.has(n.id)
          ? "visited"
          : frontier.has(n.id)
            ? "frontier"
            : "unvisited",
  }));
  // Show generated children of expanded nodes without displaying future branches before replay reaches them.
  const generated = new Set(
    nodes
      .filter(
        (n) => !n.parent_id || visited.has(n.parent_id) || frontier.has(n.id),
      )
      .map((n) => n.id),
  );
  return (
    <div className="trace-card">
      <h3>
        {trace.algorithm}{" "}
        <small>
          {trace.success
            ? "Escape route found"
            : trace.status.replaceAll("_", " ").toLowerCase()}
        </small>
      </h3>
      <p className="trace-narrative">{`Expansion ${index + 1} · ${nodes.find((n) => n.id === step?.current_node)?.action_name || "Starting state"} · Depth ${step?.depth ?? 0}`}</p>
      <SurvivalGraph
        nodes={nodes.filter((n) => generated.has(n.id))}
        edges={trace.tree_edges.filter(
          (e) => generated.has(e.source) && generated.has(e.target),
        )}
        currentId={step?.current_node}
        title={`${trace.algorithm} traversal`}
      />
    </div>
  );
}
function GitDemo() {
  return (
    <div className="graph-demo" aria-hidden="true">
      <span>○</span>
      <i>—</i>
      <span>◎</span>
      <i>—</i>
      <span>○</span>
    </div>
  );
}
