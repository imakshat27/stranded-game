import { lazy, Suspense, useState } from "react";
import {
  Backpack,
  GitBranch,
  Ship,
  Sparkles,
  Heart,
  Droplets,
  Utensils,
  Zap,
  BookOpen,
  ArrowRight,
  Check,
  Lock,
} from "lucide-react";
import type {
  GameState,
  ActionOption,
  HintExplanation,
  StateTransition,
} from "../../types/game";
import { hotspots, locations } from "./world";
import { PaintedScene } from "./PaintedScene";
import { Dialog } from "../ui/Dialog";
import { HelpView } from "../help/HelpView";
const JourneyView = lazy(() =>
  import("../graph/JourneyView").then((m) => ({ default: m.JourneyView })),
);
const PlanningView = lazy(() =>
  import("../planning/PlanningView").then((m) => ({ default: m.PlanningView })),
);
const scenes: Record<string, { title: string; text: string }> = {
  camp: {
    title: "A foothold on the island",
    text: "The camp is your place to recover and prepare. Every day brings two chances to act. Decide what you need before venturing out.",
  },
  water: {
    title: "Follow the freshwater",
    text: "A narrow stream runs through the undergrowth. Drinking water will keep you going, but collecting it takes time and energy.",
  },
  jungle: {
    title: "Into the green",
    text: "Beyond the camp, the jungle offers food and timber. Gather what you need today, and leave enough strength for tomorrow.",
  },
  shore: {
    title: "What the tide left behind",
    text: "The eastern coast may hold the wreckage you need. Scout the shore, then salvage its scattered materials when the way is known.",
  },
  cave: {
    title: "Beyond the light",
    text: "The limestone entrance opens into darkness. Search the cave for metal and tools, weighing the supplies you could find against the risk.",
  },
  boat: {
    title: "Build a way home",
    text: "An escape takes more than a hull. Assemble the boat, rig its sails, fit a rudder, and set aside provisions before you launch.",
  },
};
function sceneForLocation(location: string) {
  return (
    (
      {
        base_camp: "camp",
        freshwater_stream: "water",
        eastern_shore: "shore",
        hidden_cave: "cave",
      } as Record<string, string>
    )[location] || "camp"
  );
}
export function StorySurvival({
  gameState: state,
  actionOptions,
  activeHint,
  latestTransition,
  loading,
  onSelectAction,
  onRequestHint,
  onDismissHint,
  onRestart,
}: {
  gameState: GameState;
  actionOptions: ActionOption[];
  activeHint: HintExplanation | null;
  latestTransition: StateTransition | null;
  loading: boolean;
  onSelectAction: (id: string) => void;
  onRequestHint: () => void;
  onDismissHint: () => void;
  onRestart: () => void;
}) {
  const [region, setRegion] = useState(sceneForLocation(state.location));
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [panel, setPanel] = useState<string | null>(null);
  const [dismissedResult, setDismissedResult] = useState<GameState | null>(
    null,
  );
  const spot = hotspots.find((h) => h.id === region)!;
  const choices = actionOptions.filter((o) =>
    (spot.actions as readonly string[]).includes(o.action.id),
  );
  const selected = choices.find((o) => o.action.id === selectedAction);
  const parts = Object.values(state.boat_parts).filter(Boolean).length;
  const terminal = state.game_status !== "ACTIVE";
  const preview = (id: string) => {
    setRegion(id);
    setSelectedAction(null);
  };
  const safe = Math.min(state.water, state.food) >= 25;
  const dayText =
    state.day === 1 && state.player_profile.total_actions === 0
      ? "You made it ashore. Now the first task is simple: stay alive long enough to find a way off this island."
      : state.water < 25
        ? "Your water is running low. The next move could be the difference between a productive day and a difficult night."
        : state.food < 25
          ? "The food supply is thinning. Find something to eat before putting more energy into the escape vessel."
          : state.weather === "stormy"
            ? "A storm is moving across the island. Check your shelter and supplies before committing to an exposed expedition."
            : `Day ${state.day} begins with ${parts} of four boat parts ready. ${safe ? "You have room to make progress, but every choice spends supplies." : "Stabilize your supplies before taking on more work."}`;
  const canHint =
    !loading &&
    !terminal &&
    state.hints_remaining > 0 &&
    state.hint_cooldown === 0;
  return (
    <section className="story-survival" aria-label="Survival expedition">
      <aside className="survival-sidebar">
        <div className="sidebar-heading">Condition</div>
        {[
          { key: "health", label: "Health", Icon: Heart },
          { key: "water", label: "Water", Icon: Droplets },
          { key: "food", label: "Food", Icon: Utensils },
          { key: "energy", label: "Energy", Icon: Zap },
        ].map(({ key, label, Icon }) => {
          const value = state[key as "health" | "water" | "food" | "energy"];
          return (
            <div
              className={`compact-vital ${value < 25 ? "critical" : ""}`}
              key={key}
            >
              <Icon size={17} />
              <span>{label}</span>
              <b>{Math.round(value)}</b>
              <meter
                min={0}
                max={100}
                value={value}
                aria-label={`${label}: ${Math.round(value)} of 100`}
              />
            </div>
          );
        })}
        <div className="sidebar-shelter">
          <span>Shelter</span>
          <b>{state.shelter_level} / 4</b>
        </div>
        <button onClick={() => setPanel("bag")}>
          <Backpack size={18} />
          Bag
        </button>
        <button onClick={() => setPanel("plan")}>
          <Ship size={18} />
          Escape plan <small>{parts}/4</small>
        </button>
        <button onClick={() => setPanel("advisor")}>
          <Sparkles size={18} />
          Advisor
        </button>
        <button onClick={() => setPanel("help")}>
          <BookOpen size={18} />
          How to play
        </button>
      </aside>
      <div className="story-body">
        <header className="story-day">
          <div>
            <span>YOUR EXPEDITION</span>
            <h1>Day {String(state.day).padStart(2, "0")}</h1>
            <p>
              {state.weather} skies · {state.actions_remaining}{" "}
              {state.actions_remaining === 1 ? "action" : "actions"} remaining
            </p>
          </div>
          <button className="journey-hero" onClick={() => setPanel("journey")}>
            <GitBranch size={20} />
            <span>
              Your journey<small>Moves & possible futures</small>
            </span>
            <ArrowRight size={17} />
          </button>
        </header>
        <div className="story-layout">
          <article className="day-narrative">
            <p className="day-intro">{dayText}</p>
            {latestTransition && (
              <div className="story-outcome" role="status">
                <small>Last choice · {latestTransition.action_name}</small>
                <p>{latestTransition.message}</p>
                <div>
                  {Object.entries(latestTransition.resource_changes)
                    .filter(([, v]) => v !== 0)
                    .map(([key, value]) => (
                      <span key={key}>
                        {key} {value > 0 ? "+" : ""}
                        {Math.round(value)}
                      </span>
                    ))}
                </div>
              </div>
            )}
            <div className="scene-copy">
              <small>
                {selected
                  ? "CHOICE PREVIEW · NO TURN SPENT"
                  : "EXPLORE YOUR OPTIONS"}
              </small>
              <h2>{selected ? selected.action.name : scenes[region].title}</h2>
              <p>
                {selected ? selected.action.description : scenes[region].text}
              </p>
            </div>
            <div className="choice-heading">
              <h3>What will you do?</h3>
              <span>Choose to preview</span>
            </div>
            <div className="story-choices">
              {choices.map(({ action, available, unavailable_reason }) => (
                <button
                  key={action.id}
                  className={`story-choice ${selectedAction === action.id ? "chosen" : ""} ${!available ? "locked" : ""}`}
                  aria-pressed={selectedAction === action.id}
                  onClick={() => setSelectedAction(action.id)}
                >
                  <div>
                    {available ? (
                      <span className="choice-dot" />
                    ) : (
                      <Lock size={14} />
                    )}
                    <strong>{action.name}</strong>
                    <ArrowRight size={15} />
                  </div>
                  <small>
                    Energy −{action.energy_cost} · Water −{action.water_cost} ·
                    Food −{action.food_cost}
                  </small>
                  {!available && (
                    <small className="blocked-reason">
                      {unavailable_reason}
                    </small>
                  )}
                </button>
              ))}
            </div>
            {selected && (
              <div className="commit-choice">
                <details>
                  <summary>Risk & requirements</summary>
                  <p>
                    Action risk: {Math.round(selected.action.risk * 100)}%.
                    Events and outcomes can vary.
                  </p>
                  <p>
                    {Object.entries(selected.action.prerequisites)
                      .map(
                        ([key, value]) =>
                          `${key.replaceAll("_", " ").replace("min ", "At least ").replace("requires ", "Requires ")}: ${
                            typeof value === "object"
                              ? Object.entries(value)
                                  .map(
                                    ([part, ready]) =>
                                      `${part} ${ready ? "ready" : "needed"}`,
                                  )
                                  .join(", ")
                              : typeof value === "boolean"
                                ? value
                                  ? "yes"
                                  : "no"
                                : String(value).replaceAll("_", " ")
                          }`,
                      )
                      .join(" · ") || "No additional requirements."}
                  </p>
                </details>
                <button
                  className="primary-button"
                  disabled={loading || !selected.available || terminal}
                  onClick={() => {
                    onSelectAction(selected.action.id);
                  }}
                >
                  {loading
                    ? "Taking action…"
                    : "Take this action · uses 1 turn"}
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
            {terminal && (
              <button
                className="primary-button"
                onClick={() => setDismissedResult(null)}
              >
                View expedition result
              </button>
            )}
          </article>
          <aside className="story-scene">
            <div className="scene-image">
              <PaintedScene
                scene={region}
                weather={state.weather}
                shelter={state.shelter_level}
                parts={parts}
              />
              <div className="scene-caption">
                <span>{spot.label}</span>
                <small>
                  Scene preview ·{" "}
                  {locations.find((l) => l.id === state.location)?.label ||
                    "Base camp"}{" "}
                  last explored
                </small>
              </div>
            </div>
            <nav className="scene-picker" aria-label="Preview island scenes">
              {hotspots.map((h) => (
                <button
                  key={h.id}
                  aria-pressed={region === h.id}
                  onClick={() => preview(h.id)}
                >
                  <h.icon size={16} />
                  {h.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      </div>
      <aside className="corner-map">
        <button className="map-heading" onClick={() => setPanel("map")}>
          <span>Island map</span>
          <small>{state.discovered_locations.length}/4 known ↗</small>
        </button>
        <DiscoveryMap state={state} onPreview={preview} />
        <p>Tap a marker to preview</p>
      </aside>
      {panel && (
        <Dialog
          title={
            (
              {
                bag: "Your bag",
                plan: "Escape plan",
                journey: "Your journey",
                advisor: "Survival advisor",
                help: "How to play",
                map: "Island discoveries",
              } as Record<string, string>
            )[panel]
          }
          eyebrow="EXPEDITION"
          onClose={() => {
            setPanel(null);
            if (panel === "advisor") onDismissHint();
          }}
          wide={panel === "journey"}
        >
          <Suspense fallback={<p role="status">Opening…</p>}>
            {panel === "journey" && <JourneyView gameState={state} />}
            {panel === "plan" && (
              <PlanningView
                gameState={state}
                actionOptions={actionOptions}
                onSelectAction={(id) => {
                  onSelectAction(id);
                  setPanel(null);
                }}
              />
            )}
            {panel === "bag" && (
              <>
                <p>Materials for your shelter, tools, and escape vessel.</p>
                <div className="bag-grid">
                  {["wood", "rope", "metal", "tools"].map((key) => (
                    <div key={key}>
                      <span>{key}</span>
                      <strong>
                        {state[key as "wood" | "rope" | "metal" | "tools"]}
                      </strong>
                    </div>
                  ))}
                </div>
                <h3>Escape vessel · {parts}/4 ready</h3>
                <div className="boat-checklist">
                  {Object.entries(state.boat_parts).map(([part, built]) => (
                    <div key={part}>
                      <span>
                        {built ? <Check size={15} /> : "○"} {part}
                      </span>
                      <small>{built ? "Ready" : "Needed"}</small>
                    </div>
                  ))}
                </div>
                <button
                  className="primary-button"
                  onClick={() => setPanel("plan")}
                >
                  View requirements & next step
                </button>
              </>
            )}
            {panel === "advisor" && (
              <>
                <p>
                  A limited hint recommends one next move and explains why.{" "}
                  {state.hints_remaining} hints remain
                  {state.hint_cooldown
                    ? ` · available after ${state.hint_cooldown} more actions`
                    : ""}
                  .
                </p>
                {activeHint ? (
                  <div className="next-step">
                    <h3>{activeHint.recommended_action_name}</h3>
                    <p>{activeHint.summary}</p>
                    <ul>
                      {activeHint.supporting_factors.map((factor, i) => (
                        <li key={i}>{factor}</li>
                      ))}
                    </ul>
                    <details>
                      <summary>Tradeoffs</summary>
                      <ul>
                        {activeHint.negative_factors.map((factor, i) => (
                          <li key={i}>{factor}</li>
                        ))}
                      </ul>
                    </details>
                    <button
                      className="primary-button"
                      disabled={
                        loading ||
                        !actionOptions.find(
                          (o) =>
                            o.action.id === activeHint.recommended_action_id,
                        )?.available ||
                        terminal
                      }
                      onClick={() => {
                        onSelectAction(activeHint.recommended_action_id);
                        setPanel(null);
                      }}
                    >
                      Take recommended action · uses 1 turn
                    </button>
                  </div>
                ) : (
                  <button
                    className="primary-button"
                    disabled={!canHint}
                    onClick={onRequestHint}
                  >
                    {loading ? "Consulting advisor…" : "Request a hint"}
                  </button>
                )}
              </>
            )}
            {panel === "help" && <HelpView />}
            {panel === "map" && (
              <>
                <p>
                  This map tracks discoveries. Inspecting a marker previews
                  choices without moving or spending a turn.
                </p>
                <DiscoveryMap
                  state={state}
                  onPreview={(id) => {
                    preview(id);
                    setPanel(null);
                  }}
                />
                {locations.map((l) => (
                  <p key={l.id}>
                    <b>
                      {state.discovered_locations.includes(l.id)
                        ? l.label
                        : "Uncharted · " + l.label}
                    </b>{" "}
                    — {l.description}
                  </p>
                ))}
              </>
            )}
          </Suspense>
        </Dialog>
      )}
      {terminal && dismissedResult !== state && (
        <Dialog
          title={
            state.game_status === "WON"
              ? "You made it off the island"
              : "Your expedition has ended"
          }
          eyebrow={`DAY ${state.day}`}
          onClose={() => setDismissedResult(state)}
        >
          <p>
            {state.status_reason ||
              (state.game_status === "WON"
                ? "Your vessel carried you to safety."
                : "Your health ran out before you could escape.")}
          </p>
          <p>
            {state.player_profile.total_actions} choices · {parts}/4 boat parts
            · {state.discovered_locations.length} discoveries
          </p>
          <div className="graph-toolbar">
            <button
              onClick={() => {
                setDismissedResult(state);
                setPanel("journey");
              }}
            >
              Review your journey
            </button>
            <button className="primary-button" onClick={onRestart}>
              Start again
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
function DiscoveryMap({
  state,
  onPreview,
}: {
  state: GameState;
  onPreview: (id: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 240 200"
      className="discovery-map"
      role="group"
      aria-label="Island discovery map"
    >
      <rect width="240" height="200" rx="14" fill="#243e43" />
      <path
        d="M74 28L115 18L153 40L165 72L191 102L176 137L139 163L94 175L65 151L39 114L48 76Z"
        fill="#769175"
        stroke="#b3c097"
        strokeWidth="5"
      />
      <path
        d="M103 51L75 82L80 112L110 141"
        stroke="#aaccc0"
        strokeWidth="5"
        fill="none"
      />
      <path
        d="M120 62L135 95L109 116L150 139"
        stroke="#b9b88a"
        strokeWidth="2"
        strokeDasharray="4 5"
        fill="none"
      />
      {locations.map((l) => {
        const known = state.discovered_locations.includes(l.id);
        const x = l.x * 2.05 + 14,
          y = l.y * 1.65 + 3;
        return (
          <g
            key={l.id}
            role="button"
            tabIndex={0}
            aria-label={`${l.label}: ${known ? "discovered" : "uncharted"}. Preview scene.`}
            onClick={() => onPreview(sceneForLocation(l.id))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPreview(sceneForLocation(l.id));
              }
            }}
          >
            <title>
              {l.label} · {known ? "Known" : "Uncharted"}
            </title>
            <circle cx={x} cy={y} r="17" fill="transparent" />
            <circle
              cx={x}
              cy={y}
              r="7"
              fill={known ? "#f4d590" : "#405c56"}
              stroke={known ? "#254c43" : "#c5cba9"}
              strokeWidth="2"
            />
            <text
              x={x}
              y={y + 3}
              textAnchor="middle"
              fontSize="9"
              fill="#203c38"
            >
              {known ? "•" : "?"}
            </text>
          </g>
        );
      })}
      <text x="216" y="24" fill="#d9dfc2" fontSize="10">
        N ↑
      </text>
    </svg>
  );
}
