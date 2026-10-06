import { useEffect, useRef, useState } from "react";
import { api } from "../../services/api";
import type { GameState } from "../../types/game";
import type { GraphNode, JourneyData } from "../../types/graph";
import { SurvivalGraph } from "./SurvivalGraph";
export function JourneyView({ gameState }: { gameState: GameState }) {
  const [data, setData] = useState<JourneyData | null>(null);
  const [turn, setTurn] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);
  useEffect(() => {
    const id = ++seq.current;
    setLoading(true);
    setError("");
    api.game
      .journey(gameState.game_id, turn ?? undefined)
      .then((result) => {
        if (id === seq.current) setData(result);
      })
      .catch((e) => {
        if (id === seq.current) setError(e.message);
      })
      .finally(() => {
        if (id === seq.current) setLoading(false);
      });
    return () => {
      seq.current++;
    };
  }, [gameState.game_id, gameState.player_profile.total_actions, turn]);
  const nodes: GraphNode[] = [
    ...(data?.nodes || []),
    ...(data?.alternatives || []),
  ].map((n) => ({
    ...n,
    action_name: n.label,
    is_goal: Object.values(n.state.boat_parts).every(Boolean),
    vitals: {
      health: n.state.health,
      water: n.state.water,
      food: n.state.food,
      energy: n.state.energy,
    },
    inventory: {
      wood: n.state.wood,
      rope: n.state.rope,
      metal: n.state.metal,
      tools: n.state.tools,
      shelter_level: n.state.shelter_level,
    },
    boat_parts: n.state.boat_parts,
  }));
  return (
    <div className="journey-view">
      <p>
        Your recorded moves stay on the solid teal path. Select a turn to
        explore alternatives; dashed branches are simulations.
      </p>
      <div className="graph-toolbar">
        <label>
          Inspect turn{" "}
          <select
            value={turn ?? ""}
            onChange={(e) =>
              setTurn(e.target.value === "" ? null : Number(e.target.value))
            }
          >
            <option value="">Current journey</option>
            {data?.nodes.map((n) => (
              <option key={n.id} value={n.turn}>
                {n.turn} · {n.label}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={loading || !data}
          onClick={() => setTurn(data?.current_turn ?? 0)}
        >
          Explore current choices
        </button>
        {loading && <span role="status">Loading states…</span>}
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}{" "}
          <button onClick={() => setTurn(null)}>Return to journey</button>
        </p>
      )}
      {!!data?.missing_snapshots && (
        <p>
          Some older turns have no saved snapshot. Gaps are left disconnected.
        </p>
      )}
      {data && (
        <SurvivalGraph
          nodes={nodes}
          edges={[
            ...data.edges,
            ...data.alternatives.map((n) => ({
              id: `edge-${n.id}`,
              source: n.parent_id!,
              target: n.id,
              provenance: "simulated" as const,
            })),
          ]}
          currentId={`actual-${turn ?? data.current_turn}`}
          onFocusCurrent={() => setTurn(data.current_turn)}
          onSelect={(n) => {
            if (n.provenance === "actual" && n.turn !== undefined)
              setTurn(n.turn);
          }}
        />
      )}
    </div>
  );
}
