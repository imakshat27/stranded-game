// Development-only visual fixtures. This entry is excluded from production builds.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { StorySurvival } from "../src/components/game/StorySurvival";
import { GameState } from "../src/types/game";
import "../src/index.css";

const initial: GameState = {
  game_id: "visual-qa-only",
  day: 6,
  actions_remaining: 2,
  turn_in_day: 1,
  health: 86,
  water: 64,
  food: 72,
  energy: 83,
  shelter_level: 0,
  wood: 6,
  rope: 4,
  metal: 2,
  tools: 1,
  escape_progress: 0,
  boat_parts: { hull: false, rigging: false, rudder: false, provisions: false },
  location: "base_camp",
  weather: "clear",
  discovered_locations: ["base_camp", "freshwater_stream", "eastern_shore"],
  active_effects: [],
  current_objective: "Construct an escape vessel and prepare for the crossing.",
  hints_remaining: 3,
  hint_cooldown: 0,
  hints_used: 0,
  hints_earned: 0,
  player_profile: {
    profile_type: "Balanced",
    exploration_score: 0.5,
    risk_score: 0.3,
    resource_score: 0.5,
    total_actions: 10,
    exploration_actions: 3,
    risky_actions: 1,
    rest_actions: 2,
    crafting_actions: 4,
  },
  difficulty_profile: {
    resource_scarcity: 0.5,
    environmental_risk: 0.4,
    exploration_risk: 0.45,
    escape_complexity: 0.5,
  },
  game_status: "ACTIVE",
  recent_events: [],
  log_messages: [],
};
function Fixtures() {
  const [state, setState] = useState(initial);
  return (
    <>
      <div
        className="game-header"
        style={{
          height: 76,
          padding: "0 16px",
          gap: 12,
          flexWrap: "wrap",
          fontSize: 11,
        }}
      >
        <strong>VISUAL QA</strong>
        <label>
          Shelter{" "}
          <select
            aria-label="Shelter stage"
            value={state.shelter_level}
            onChange={(e) =>
              setState({ ...state, shelter_level: Number(e.target.value) })
            }
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label>
          Weather{" "}
          <select
            aria-label="Weather"
            value={state.weather}
            onChange={(e) => setState({ ...state, weather: e.target.value })}
          >
            {["clear", "cloudy", "rainy", "stormy"].map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
        </label>
        {Object.keys(state.boat_parts).map((k) => (
          <label key={k}>
            <input
              type="checkbox"
              aria-label={k}
              checked={state.boat_parts[k as keyof typeof state.boat_parts]}
              onChange={(e) => {
                const parts = { ...state.boat_parts, [k]: e.target.checked };
                setState({
                  ...state,
                  boat_parts: parts,
                  escape_progress:
                    Object.values(parts).filter(Boolean).length * 25,
                });
              }}
            />
            {k}
          </label>
        ))}
        <label>
          Status{" "}
          <select
            aria-label="Game status"
            value={state.game_status}
            onChange={(e) =>
              setState({
                ...state,
                game_status: e.target.value as GameState["game_status"],
              })
            }
          >
            {["ACTIVE", "WON", "LOST"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <StorySurvival
        gameState={state}
        actionOptions={[]}
        activeHint={null}
        latestTransition={null}
        loading={false}
        onSelectAction={() => {}}
        onRequestHint={() => {}}
        onDismissHint={() => {}}
        onRestart={() => setState(initial)}
      />
    </>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<Fixtures />);
if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
