import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { GameState } from "../../types/game";
import type { JourneyData } from "../../types/graph";
import { api } from "../../services/api";
export function AnalyticsView({ gameState }: { gameState: GameState }) {
  const [data, setData] = useState<JourneyData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setError("");
    setData(null);
    api.game
      .journey(gameState.game_id)
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
  const timeline =
    data?.nodes.map((n) => ({
      turn: n.turn,
      health: n.state.health,
      water: n.state.water,
      food: n.state.food,
      energy: n.state.energy,
    })) || [];
  const weakest = Object.entries({
    water: gameState.water,
    food: gameState.food,
    energy: gameState.energy,
  }).sort((a, b) => a[1] - b[1])[0];
  return (
    <section className="expedition-report">
      <h2>Expedition report</h2>
      <p>
        Your actual choices and resource changes, ordered by turn. Simulated
        searches are excluded.
      </p>
      <div className="report-summary">
        <div>
          <strong>{gameState.player_profile.total_actions}</strong>
          <span>Choices made</span>
        </div>
        <div>
          <strong>
            {Object.values(gameState.boat_parts).filter(Boolean).length}/4
          </strong>
          <span>Boat parts ready</span>
        </div>
        <div>
          <strong>{gameState.discovered_locations.length}/4</strong>
          <span>Locations known</span>
        </div>
      </div>
      <div className="next-step">
        <h3>
          {gameState.game_status === "ACTIVE"
            ? "Before your next move"
            : "Expedition outcome"}
        </h3>
        <p>
          {gameState.game_status === "ACTIVE"
            ? weakest[1] < 25
              ? `Your ${weakest[0]} is down to ${Math.round(weakest[1])}. Prioritize recovery before expensive work.`
              : "Supplies are above the critical threshold. Check the next boat requirement while preserving enough for nightfall."
            : gameState.status_reason || gameState.game_status}
        </p>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Loading your record…</p>}
      {data && (
        <>
          <h3>Condition over your journey</h3>
          {timeline.length > 1 ? (
            <div className="report-chart">
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={timeline}>
                  <CartesianGrid stroke="#30474a" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="turn"
                    label={{
                      value: "Turn",
                      position: "insideBottomRight",
                      offset: -4,
                    }}
                    stroke="#a9bab5"
                  />
                  <YAxis domain={[0, 100]} stroke="#a9bab5" />
                  <Tooltip
                    contentStyle={{
                      background: "#193034",
                      borderColor: "#48615e",
                    }}
                  />
                  <Legend />
                  {[
                    ["health", "#e8a28e"],
                    ["water", "#8ac6d0"],
                    ["food", "#e5c58a"],
                    ["energy", "#9dc5a1"],
                  ].map(([key, color]) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={color}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p>Take your first action to begin the resource timeline.</p>
          )}
          {!!data.missing_snapshots && (
            <p>Some older turns have no recorded snapshot.</p>
          )}
          <details>
            <summary>Choice history · {data.current_turn} moves</summary>
            <ol className="plan-list">
              {data.nodes
                .filter((n) => n.action_id)
                .map((n) => (
                  <li key={n.id}>
                    <strong>{n.label}</strong>
                    <p>
                      Day {n.state.day} · Health {Math.round(n.state.health)} ·
                      Water {Math.round(n.state.water)} · Food{" "}
                      {Math.round(n.state.food)}
                    </p>
                  </li>
                ))}
            </ol>
          </details>
        </>
      )}
      <details>
        <summary>Behavior & adaptive difficulty</summary>
        <p>
          These are model classifications, not a score or a judgment of your
          play.
        </p>
        <p>Style: {gameState.player_profile.profile_type}</p>
        <p>
          Exploration:{" "}
          {Math.round((gameState.player_profile.exploration_score ?? 0) * 100)}%
          · Risk: {Math.round((gameState.player_profile.risk_score ?? 0) * 100)}
          % · Resource management:{" "}
          {Math.round((gameState.player_profile.resource_score ?? 0) * 100)}%
        </p>
        <p>
          {Object.entries(gameState.difficulty_profile)
            .map(
              ([key, value]) =>
                `${key.replaceAll("_", " ")}: ${Math.round(value * 100)}%`,
            )
            .join(" · ")}
        </p>
      </details>
    </section>
  );
}
