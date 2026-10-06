import {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { NavigationHeader } from "./components/common/NavigationHeader";
import { StorySurvival } from "./components/game/StorySurvival";
import { Dialog } from "./components/ui/Dialog";
import {
  GameState,
  ActionOption,
  HintExplanation,
  StateTransition,
  GameResponse,
} from "./types/game";
import { api, ApiError } from "./services/api";
import { AlertCircle, Compass, LoaderCircle, RotateCcw, X } from "lucide-react";

const AILabHub = lazy(() =>
  import("./components/ai/AILabHub").then((m) => ({ default: m.AILabHub })),
);
const RivalModeView = lazy(() =>
  import("./components/rival/RivalModeView").then((m) => ({
    default: m.RivalModeView,
  })),
);
const IntelligenceHub = lazy(() =>
  import("./components/analytics/IntelligenceHub").then((m) => ({
    default: m.IntelligenceHub,
  })),
);

export function App() {
  const [activeTab, setActiveTab] = useState("game");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [actionOptions, setActionOptions] = useState<ActionOption[]>([]);
  const [activeHint, setActiveHint] = useState<HintExplanation | null>(null);
  const [latestTransition, setLatestTransition] =
    useState<StateTransition | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const busy = useRef(false);
  const apply = useCallback((data: GameResponse) => {
    setGameState(data.state);
    setActionOptions(
      data.action_options ||
        data.valid_actions.map((action) => ({
          action,
          available: true,
          unavailable_reason: null,
        })),
    );
    localStorage.setItem("stranded_last_game_id", data.state.game_id);
  }, []);
  const initializeGame = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setErrorBanner(null);
    try {
      const saved = localStorage.getItem("stranded_last_game_id");
      let data: GameResponse;
      if (saved) {
        try {
          data = await api.game.get(saved);
        } catch (err) {
          if (!(err instanceof ApiError) || err.code !== "GAME_NOT_FOUND")
            throw err;
          data = await api.game.start();
        }
      } else data = await api.game.start();
      apply(data);
      setActiveHint(null);
      setLatestTransition(null);
    } catch (err) {
      setErrorBanner(
        err instanceof Error
          ? err.message
          : "The island could not be reached. Try again.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [apply]);
  useEffect(() => {
    void initializeGame();
  }, [initializeGame]);

  const handlePerformAction = async (id: string) => {
    if (!gameState || busy.current) return;
    const option = actionOptions.find((o) => o.action.id === id);
    if (!option?.available) {
      setErrorBanner(
        option?.unavailable_reason ||
          "This action is no longer available. Choose another move.",
      );
      return;
    }
    busy.current = true;
    setLoading(true);
    setErrorBanner(null);
    try {
      const res = await api.game.action(gameState.game_id, id);
      apply(res);
      setLatestTransition(res.transition);
      setActiveHint(null);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : "Action could not be completed.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };
  const handleRequestHint = async () => {
    if (
      !gameState ||
      busy.current ||
      gameState.hint_cooldown > 0 ||
      gameState.hints_remaining <= 0 ||
      gameState.game_status !== "ACTIVE"
    )
      return;
    busy.current = true;
    setLoading(true);
    setErrorBanner(null);
    try {
      const res = await api.game.hint(gameState.game_id);
      apply(res);
      setActiveHint(res.hint);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : "Your advisor is unavailable.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };
  const restart = async () => {
    if (!gameState || busy.current) return;
    busy.current = true;
    setLoading(true);
    setErrorBanner(null);
    setConfirmRestart(false);
    try {
      apply(await api.game.restart(gameState.game_id));
      setActiveHint(null);
      setLatestTransition(null);
      setActiveTab("game");
    } catch (err) {
      setErrorBanner(
        err instanceof Error
          ? err.message
          : "Could not restart the expedition.",
      );
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };
  return (
    <div
      className={`app-shell ${activeTab === "game" ? "island-mode" : "workbench-mode"}`}
    >
      <NavigationHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gameState={gameState}
        onRestart={() => setConfirmRestart(true)}
        loading={loading}
      />
      {errorBanner && (
        <div className="connection-banner" role="alert">
          <AlertCircle size={18} />
          <span>{errorBanner}</span>
          {!gameState && (
            <button
              className="text-button"
              onClick={initializeGame}
              disabled={loading}
            >
              Retry connection
            </button>
          )}
          {gameState && (
            <button
              className="icon-button"
              aria-label="Dismiss error"
              onClick={() => setErrorBanner(null)}
            >
              <X size={17} />
            </button>
          )}
        </div>
      )}
      <main className={activeTab === "game" ? "island-main" : "workbench-main"}>
        {activeTab === "game" && gameState && (
          <StorySurvival
            gameState={gameState}
            actionOptions={actionOptions}
            activeHint={activeHint}
            latestTransition={latestTransition}
            loading={loading}
            onSelectAction={handlePerformAction}
            onRequestHint={handleRequestHint}
            onDismissHint={() => setActiveHint(null)}
            onRestart={() => setConfirmRestart(true)}
          />
        )}
        {activeTab === "game" && !gameState && (
          <div className="arrival-screen">
            <Compass size={44} />
            <span className="eyebrow">AN UNCHARTED SHORE</span>
            <h1>Your expedition awaits.</h1>
            <p>
              {loading
                ? "Finding a passage to the island…"
                : "Reconnect to continue your expedition."}
            </p>
            {loading ? (
              <LoaderCircle className="animate-spin" size={24} />
            ) : (
              <button className="primary-button" onClick={initializeGame}>
                Retry connection
              </button>
            )}
          </div>
        )}
        <Suspense
          fallback={
            <div
              className="field-panel p-6 flex items-center gap-3"
              role="status"
            >
              <LoaderCircle size={18} className="animate-spin" /> Opening
              expedition tools…
            </div>
          }
        >
          {activeTab === "ai-lab" && (
            <AILabHub
              gameState={gameState}
              onSelectAction={handlePerformAction}
              onNavigateToGame={() => setActiveTab("game")}
            />
          )}
          {activeTab === "rival" && <RivalModeView />}
          {activeTab === "analytics" && (
            <IntelligenceHub gameState={gameState} />
          )}
        </Suspense>
      </main>
      {confirmRestart && (
        <Dialog
          title="Begin a new expedition?"
          onClose={() => setConfirmRestart(false)}
        >
          <p>
            Your current shelter, supplies, and boat progress will be reset.
            You’ll return to the shore on day one.
          </p>
          <div className="dialog-actions">
            <button
              className="secondary-button"
              onClick={() => setConfirmRestart(false)}
            >
              Keep exploring
            </button>
            <button
              className="primary-button"
              disabled={loading || !gameState}
              onClick={restart}
            >
              <RotateCcw size={16} /> Restart expedition
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
export default App;
