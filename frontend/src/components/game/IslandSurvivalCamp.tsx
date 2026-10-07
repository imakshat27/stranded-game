import { useState } from "react";
import {
  Heart,
  Droplets,
  Utensils,
  Zap,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Compass,
  Ship,
  BookOpen,
  Backpack,
  Sparkles,
  ArrowRight,
  Lock,
  Check,
  Tent,
  TreePine,
  Cable,
  Wrench,
  Hammer,
  LoaderCircle,
  Map,
  Flag,
  Skull,
  Trophy,
  X,
} from "lucide-react";
import {
  GameState,
  ActionOption,
  HintExplanation,
  StateTransition,
} from "../../types/game";
import { Dialog } from "../ui/Dialog";
import { hotspots, locations } from "./world";

interface Props {
  gameState: GameState;
  actionOptions: ActionOption[];
  activeHint: HintExplanation | null;
  latestTransition: StateTransition | null;
  loading: boolean;
  onSelectAction: (id: string) => void;
  onRequestHint: () => void;
  onDismissHint: () => void;
  onRestart: () => void;
}
const vitals = [
  { key: "health", name: "Health", icon: Heart, color: "#f39a87" },
  { key: "water", name: "Water", icon: Droplets, color: "#86d5e8" },
  { key: "food", name: "Food", icon: Utensils, color: "#e9c57f" },
  { key: "energy", name: "Energy", icon: Zap, color: "#c2dc9b" },
] as const;
const inventory = [
  { key: "wood", name: "Timber", icon: TreePine },
  { key: "rope", name: "Rope", icon: Cable },
  { key: "metal", name: "Metal", icon: Wrench },
  { key: "tools", name: "Tools", icon: Hammer },
] as const;
const partNames = {
  hull: "Twin hulls",
  rigging: "Mast & rigging",
  rudder: "Rudder & keel",
  provisions: "Sea provisions",
};
type Panel = "map" | "inventory" | "journal" | "actions" | null;

export function IslandSurvivalCamp({
  gameState: state,
  actionOptions,
  activeHint,
  latestTransition,
  loading,
  onSelectAction,
  onRequestHint,
  onDismissHint,
  onRestart,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dismissedResult, setDismissedResult] = useState<GameState | null>(
    null,
  );
  const [panel, setPanel] = useState<Panel>(null);
  const [inspect, setInspect] = useState("base_camp");
  const [dismissedTransition, setDismissedTransition] =
    useState<StateTransition | null>(null);
  const outcomeVisible =
    !!latestTransition && dismissedTransition !== latestTransition;
  const [artFailed, setArtFailed] = useState(false);
  const [category, setCategory] = useState("ALL");
  const spot = hotspots.find((h) => h.id === selected);
  const Weather =
    state.weather === "stormy"
      ? CloudLightning
      : state.weather === "rainy"
        ? CloudRain
        : state.weather === "cloudy"
          ? Cloud
          : Sun;
  const partsDone = Object.values(state.boat_parts).filter(Boolean).length;
  const canHint =
    !loading &&
    state.game_status === "ACTIVE" &&
    state.hints_remaining > 0 &&
    state.hint_cooldown === 0;
  const selectSpot = (id: string) => {
    setSelected(id);
    setPanel(null);
  };
  const act = (id: string) => {
    onSelectAction(id);
    setSelected(null);
    setPanel(null);
  };
  const showActions = (options: ActionOption[]) => (
    <div className="action-list">
      {options.map(({ action, available, unavailable_reason }) => (
        <article
          className={`action-option ${!available ? "action-locked" : ""}`}
          key={action.id}
        >
          <div className="action-option-heading">
            <h3>{action.name}</h3>
            {!available && <Lock size={15} aria-label="Locked" />}
          </div>
          <p>{action.description}</p>
          <div className="action-costs">
            <span>
              <Zap size={13} />
              {action.energy_cost < 0 ? "+" : "−"}
              {Math.abs(action.energy_cost)} energy
            </span>
            {action.water_cost > 0 && (
              <span>
                <Droplets size={13} />−{action.water_cost} water
              </span>
            )}
            {action.food_cost > 0 && (
              <span>
                <Utensils size={13} />−{action.food_cost} food
              </span>
            )}
            <span className={action.risk >= 0.3 ? "risk-high" : ""}>
              {Math.round(action.risk * 100)}% risk
            </span>
          </div>
          <div className="action-effects">
            {expectedEffects(action.effects)}
            {action.escape_progress > 0 && (
              <span>Escape progress +{action.escape_progress}%</span>
            )}
          </div>
          {!available ? (
            <div className="locked-reason">
              <Lock size={12} />
              {unavailable_reason}
            </div>
          ) : (
            <button
              className="primary-button action-execute"
              disabled={loading}
              onClick={() => act(action.id)}
            >
              {" "}
              {action.id === "launch_escape" ? "Set sail" : "Take action"}
              <ArrowRight size={16} />
            </button>
          )}
        </article>
      ))}
      {options.length === 0 && <p>No actions in this category.</p>}
    </div>
  );
  return (
    <section
      className={`survival-screen weather-${state.weather}`}
      aria-label="Island survival"
    >
      <div
        className={`island-scene ${artFailed ? "scene-fallback" : ""}`}
        aria-hidden="true"
      >
        <picture>
          <source
            media="(max-width: 700px)"
            srcSet="/art/island-cove-mobile.webp"
          />
          <img
            className="scene-background"
            src="/art/island-cove.webp"
            alt=""
            onError={() => setArtFailed(true)}
            fetchPriority="high"
          />
        </picture>
        <div className="ocean-shimmer" />
        {state.shelter_level > 0 && (
          <div
            className="shelter-sprite"
            style={{
              backgroundPosition: `${((Math.min(4, state.shelter_level) - 1) * 100) / 3}% 50%`,
            }}
          />
        )}
        <div
          className={`boat-project ${state.boat_parts.hull ? "hull-built" : "parts-staged"}`}
        >
          {state.boat_parts.hull && (
            <AtlasPart className="boat-sprite boat-hull" x={0} width={720} />
          )}
          {state.boat_parts.rigging && (
            <AtlasPart
              className="boat-sprite boat-rigging"
              x={720}
              width={490}
            />
          )}
          {state.boat_parts.rudder && (
            <AtlasPart
              className="boat-sprite boat-rudder"
              x={1210}
              width={540}
            />
          )}
          {state.boat_parts.provisions && (
            <AtlasPart
              className="boat-sprite boat-provisions"
              x={1750}
              width={422}
            />
          )}
        </div>
        <div className="scene-weather" />
        <div className="scene-vignette" />
      </div>
      <div className="survival-top">
        <div className="vitals-hud" aria-label="Survival resources">
          {vitals.map(({ key, name, icon: Icon, color }) => (
            <div
              className={`vital ${state[key] <= 30 ? "vital-critical" : ""}`}
              key={key}
              style={{ "--vital-color": color } as React.CSSProperties}
            >
              <div className="vital-label">
                <Icon size={15} />
                <span>{name}</span>
                <strong>{Math.round(state[key])}</strong>
              </div>
              <div
                className="vital-track"
                role="meter"
                aria-label={name}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={state[key]}
              >
                <div style={{ width: `${state[key]}%` }} />
              </div>
              {state[key] <= 30 && <small>Low {name.toLowerCase()}</small>}
            </div>
          ))}
        </div>
        <div className="day-hud">
          <span className="eyebrow">THE EXPEDITION</span>
          <strong>Day {String(state.day).padStart(2, "0")}</strong>
          <div>
            <Weather size={15} />
            <span className="capitalize">{state.weather}</span>
            <i /> <span>{state.actions_remaining} actions left</span>
          </div>
        </div>
        <div className="objective-hud">
          <span className="eyebrow">
            <Flag size={12} /> YOUR WAY HOME
          </span>
          <p>{state.current_objective}</p>
          <div className="objective-progress">
            <div>
              <span style={{ width: `${state.escape_progress}%` }} />
            </div>
            <strong>{Math.round(state.escape_progress)}%</strong>
          </div>
          <span className="objective-note">
            {partsDone}/4 vessel components ready
          </span>
        </div>
      </div>
      <div className="scene-title">
        <span className="eyebrow">YOUR HOME FOR NOW</span>
        <h1>Shipwreck Cove</h1>
        <p>The island gives. The island takes.</p>
      </div>
      <div className="scene-hotspots" aria-label="Camp activities">
        {hotspots.map(({ id, label, icon: Icon, x, y }) => (
          <button
            key={id}
            className={`hotspot hotspot-${id}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => selectSpot(id)}
            aria-label={`Inspect ${label}`}
            disabled={state.game_status !== "ACTIVE"}
          >
            <span className="hotspot-pin">
              <Icon size={18} />
            </span>
            <span className="hotspot-label">
              {label}
              <small>Explore actions</small>
            </span>
          </button>
        ))}
      </div>
      <div className="island-bottom">
        {outcomeVisible && latestTransition && (
          <div className="outcome-toast" role="status">
            <div className="outcome-icon">
              <Check size={19} />
            </div>
            <div>
              <span className="eyebrow">
                {latestTransition.day_advanced
                  ? "A NEW DAY BEGINS"
                  : latestTransition.action_name}
              </span>
              <p>{latestTransition.message}</p>
              <div className="resource-deltas">
                {Object.entries(latestTransition.resource_changes)
                  .filter(([, v]) => v !== 0)
                  .map(([key, v]) => (
                    <span key={key} className={v > 0 ? "gain" : "loss"}>
                      {v > 0 ? "+" : ""}
                      {Number(v.toFixed(1))} {key.replaceAll("_", " ")}
                    </span>
                  ))}
              </div>
              {latestTransition.event_occurred && (
                <p className="event-message">
                  {latestTransition.event_occurred.name}:{" "}
                  {latestTransition.event_occurred.description}
                </p>
              )}
            </div>
            <button
              className="icon-button"
              aria-label="Dismiss outcome"
              onClick={() => setDismissedTransition(latestTransition)}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="camp-status-line">
          <span>
            <Tent size={14} /> Shelter {state.shelter_level}/4
          </span>
          <span className="camp-status-location">
            <Compass size={14} /> Last explored:{" "}
            {locations.find((l) => l.id === state.location)?.label || "Island"}
          </span>
          {loading && (
            <span role="status">
              <LoaderCircle size={14} className="animate-spin" /> Working…
            </span>
          )}
        </div>
        <nav className="survival-dock" aria-label="Survival tools">
          <button
            className="dock-primary"
            onClick={() => {
              if (state.game_status !== "ACTIVE") setDismissedResult(null);
              else {
                setPanel("actions");
                setSelected(null);
              }
            }}
          >
            <Compass size={20} />
            <span>
              {state.game_status === "ACTIVE"
                ? "Take action"
                : "Expedition results"}
              <small>
                {state.game_status === "ACTIVE"
                  ? "Make this turn count"
                  : "Review your journey"}
              </small>
            </span>
            <ArrowRight size={17} />
          </button>
          <div className="dock-divider" />
          <button onClick={() => setPanel("map")}>
            <Map size={20} />
            <span>Island map</span>
          </button>
          <button onClick={() => setPanel("inventory")}>
            <Backpack size={20} />
            <span>Inventory</span>
          </button>
          <button onClick={() => setPanel("journal")}>
            <BookOpen size={20} />
            <span>Journal</span>
          </button>
          <div className="dock-divider" />
          <button
            onClick={onRequestHint}
            disabled={!canHint}
            title={
              state.hint_cooldown > 0
                ? `Ready in ${state.hint_cooldown} turns`
                : `${state.hints_remaining} hints remaining`
            }
          >
            <Sparkles size={20} />
            <span>
              Advisor
              <small>
                {state.hint_cooldown > 0
                  ? `${state.hint_cooldown} turn cooldown`
                  : `${state.hints_remaining} hints left`}
              </small>
            </span>
          </button>
        </nav>
        <div className="mobile-hotspots" aria-label="Island activity list">
          {hotspots.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectSpot(id)}
              disabled={state.game_status !== "ACTIVE"}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
        <div className="island-footnote">
          <span>UNEXPLORED HORIZONS. ONE WAY HOME.</span>
          <span>TURN-BASED SURVIVAL</span>
        </div>
      </div>
      {spot && (
        <Dialog
          title={spot.label}
          eyebrow={spot.detail.toUpperCase()}
          onClose={() => setSelected(null)}
        >
          {showActions(
            actionOptions.filter((o) =>
              (spot.actions as readonly string[]).includes(o.action.id),
            ),
          )}
        </Dialog>
      )}
      {panel === "actions" && (
        <Dialog
          title="What’s your next move?"
          eyebrow={`${state.actions_remaining} ACTIONS REMAINING TODAY`}
          onClose={() => setPanel(null)}
          wide
        >
          <div className="category-tabs">
            {[
              "ALL",
              "SURVIVAL",
              "EXPLORATION",
              "CRAFTING",
              "ESCAPE",
              "REST",
            ].map((c) => (
              <button
                key={c}
                className={category === c ? "selected" : ""}
                aria-pressed={category === c}
                onClick={() => setCategory(c)}
              >
                {c.toLowerCase()}
              </button>
            ))}
          </div>
          {showActions(
            actionOptions.filter(
              (o) => category === "ALL" || o.action.category === category,
            ),
          )}
        </Dialog>
      )}
      {panel === "inventory" && (
        <Dialog title="Your supplies" onClose={() => setPanel(null)}>
          <div className="inventory-grid">
            {inventory.map(({ key, name, icon: Icon }) => (
              <div key={key}>
                <Icon size={24} />
                <strong>{state[key]}</strong>
                <span>{name}</span>
              </div>
            ))}
          </div>
          <h3 className="section-label">Escape vessel</h3>
          <div className="vessel-checklist">
            {Object.entries(partNames).map(([key, label]) => (
              <div key={key}>
                <span
                  className={
                    state.boat_parts[key as keyof GameState["boat_parts"]]
                      ? "part-complete"
                      : ""
                  }
                >
                  {state.boat_parts[key as keyof GameState["boat_parts"]] ? (
                    <Check size={16} />
                  ) : (
                    <Ship size={16} />
                  )}
                </span>
                <span>{label}</span>
                <small>
                  {state.boat_parts[key as keyof GameState["boat_parts"]]
                    ? "Built"
                    : "Not assembled"}
                </small>
              </div>
            ))}
          </div>
          <p className="panel-note">
            {partsDone === 4
              ? "All components are assembled. Check launch requirements at the boat slipway."
              : "Build all four components to prepare for the crossing."}
          </p>
          <button
            className="secondary-button"
            onClick={() => selectSpot("boat")}
          >
            <Ship size={16} /> Open boat slipway
          </button>
        </Dialog>
      )}
      {panel === "map" && (
        <Dialog
          title="The uncharted island"
          eyebrow="ISLAND CHART / DISCOVERIES"
          onClose={() => setPanel(null)}
          wide
        >
          <div className="island-chart">
            <svg viewBox="0 0 600 350" aria-hidden="true">
              <defs>
                <linearGradient id="land" x2="0" y2="1">
                  <stop stopColor="#5d7452" />
                  <stop offset="1" stopColor="#283f31" />
                </linearGradient>
              </defs>
              <path
                d="M110 230 Q60 120 190 85 Q260 30 370 60 Q530 90 490 180 Q550 240 425 285 Q300 325 225 290 Q135 300 110 230Z"
                fill="none"
                stroke="#6d9c9b"
                strokeOpacity=".3"
                strokeWidth="24"
              />
              <path
                d="M110 230 Q60 120 190 85 Q260 30 370 60 Q530 90 490 180 Q550 240 425 285 Q300 325 225 290 Q135 300 110 230Z"
                fill="url(#land)"
                stroke="#c9bb88"
                strokeWidth="5"
              />
              <path
                d="M325 100 Q230 120 180 220"
                stroke="#7eb7b2"
                strokeWidth="6"
                fill="none"
              />
              <path
                d="M340 65 L290 138 L400 137Z"
                fill="#758471"
                opacity=".5"
              />
              <path
                d="M180 220 Q320 250 450 215"
                stroke="#c9bb88"
                strokeDasharray="4 7"
                fill="none"
                opacity=".35"
              />
              <text x="535" y="40" fill="#c9bb88" fontSize="18">
                N ↑
              </text>
            </svg>
            {locations.map((l) => {
              const known = state.discovered_locations.includes(l.id);
              return (
                <button
                  key={l.id}
                  style={{ left: `${l.x}%`, top: `${l.y}%` }}
                  className={`chart-marker ${known ? "discovered" : ""} ${inspect === l.id ? "inspected" : ""}`}
                  onClick={() => setInspect(l.id)}
                  aria-pressed={inspect === l.id}
                >
                  <span>
                    {known ? <Compass size={16} /> : <Lock size={14} />}
                  </span>
                  <strong>{l.label}</strong>
                  <small>{known ? "Discovered" : "Unexplored"}</small>
                </button>
              );
            })}
          </div>
          <div className="map-inspection">
            <h3>{locations.find((l) => l.id === inspect)?.label}</h3>
            <p>{locations.find((l) => l.id === inspect)?.description}</p>
            <span className="eyebrow">
              {state.discovered_locations.includes(inspect)
                ? "DISCOVERED"
                : "TAKE AN EXPLORATION ACTION TO DISCOVER"}
            </span>
          </div>
          <p className="panel-note">
            Inspecting the chart uses no actions. Explore through camp
            activities to discover new places.
          </p>
          <div className="category-tabs">
            {locations.map((l) => (
              <button
                key={l.id}
                aria-pressed={inspect === l.id}
                className={inspect === l.id ? "selected" : ""}
                onClick={() => setInspect(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {panel === "journal" && (
        <Dialog
          title="Expedition journal"
          eyebrow={`DAY ${state.day} / FIELD NOTES`}
          onClose={() => setPanel(null)}
        >
          <div className="journal-intro">
            <p>
              You washed ashore with a few supplies and an open horizon. Keep
              yourself alive. Build a vessel. Find your way home.
            </p>
          </div>
          {[...state.log_messages].reverse().map((log, i) => (
            <article className="journal-entry" key={i}>
              <span className="eyebrow">
                DAY {log.day} / {log.action.replaceAll("_", " ")}
              </span>
              <p>{log.message}</p>
            </article>
          ))}
          {state.active_effects.length > 0 && (
            <div className="journal-entry">
              <h3>Active effects</h3>
              <p>{state.active_effects.join(", ")}</p>
            </div>
          )}
        </Dialog>
      )}
      {activeHint && (
        <Dialog
          title="A little guidance"
          eyebrow="SURVIVAL ADVISOR"
          onClose={onDismissHint}
        >
          <span className="eyebrow">RECOMMENDED NEXT MOVE</span>
          <h3 className="hint-title">{activeHint.recommended_action_name}</h3>
          <p>{activeHint.summary}</p>
          <h3 className="section-label">Why it helps</h3>
          <ul className="hint-factors">
            {activeHint.supporting_factors.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {activeHint.negative_factors.length > 0 && (
            <>
              <h3 className="section-label">Trade-offs</h3>
              <ul className="hint-factors">
                {activeHint.negative_factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </>
          )}
          <button
            className="primary-button"
            disabled={
              loading ||
              !actionOptions.some(
                (o) =>
                  o.action.id === activeHint.recommended_action_id &&
                  o.available,
              )
            }
            onClick={() => {
              act(activeHint.recommended_action_id);
              onDismissHint();
            }}
          >
            Take suggested action
            <ArrowRight size={16} />
          </button>
        </Dialog>
      )}
      {state.game_status !== "ACTIVE" && dismissedResult !== state && (
        <Dialog
          title="Expedition complete"
          eyebrow={`DAY ${state.day} / YOUR JOURNEY`}
          onClose={() => setDismissedResult(state)}
        >
          <div className="terminal-card">
            {state.game_status === "WON" ? (
              <Trophy size={40} />
            ) : (
              <Skull size={40} />
            )}
            <span className="eyebrow">
              EXPEDITION COMPLETE / DAY {state.day}
            </span>
            <h2>
              {state.game_status === "WON"
                ? "Beyond the horizon."
                : "The island endured."}
            </h2>
            <p>
              {state.status_reason ||
                (state.game_status === "WON"
                  ? "You survived the island and found your passage home."
                  : "Your expedition has come to an end.")}
            </p>
            <div className="terminal-stats">
              <span>
                <strong>{state.day}</strong> Days survived
              </span>
              <span>
                <strong>{Math.round(state.escape_progress)}%</strong> Escape
                progress
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="secondary-button"
                onClick={() => {
                  setDismissedResult(state);
                  setPanel("journal");
                }}
              >
                Read journal
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  setDismissedResult(state);
                  onRestart();
                }}
              >
                New expedition
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </section>
  );
}

function expectedEffects(effects: Record<string, any>) {
  const gains: string[] = [];
  for (const key of ["water", "food", "wood", "metal"]) {
    if (effects[`${key}_min`] !== undefined)
      gains.push(`+${effects[`${key}_min`]}–${effects[`${key}_max`]} ${key}`);
  }
  for (const [key, label] of [
    ["health_gain", "health"],
    ["energy_gain", "energy"],
    ["tools_gain", "tools"],
    ["shelter_level_gain", "shelter level"],
  ]) {
    if (effects[key]) gains.push(`+${effects[key]} ${label}`);
  }
  for (const key of ["wood", "rope", "metal"])
    if (effects[`${key}_cost`])
      gains.push(`Uses ${effects[`${key}_cost`]} ${key}`);
  for (const key of ["rope", "tools"])
    if (effects[`${key}_chance`])
      gains.push(
        `${Math.round(effects[`${key}_chance`] * 100)}% chance of ${key}`,
      );
  return gains.map((g) => <span key={g}>{g}</span>);
}

function AtlasPart({
  className,
  x,
  width,
}: {
  className: string;
  x: number;
  width: number;
}) {
  return (
    <svg className={className} viewBox={`0 0 ${width} 724`} aria-hidden="true">
      <image href="/art/boat-parts.webp" x={-x} width="2172" height="724" />
    </svg>
  );
}
