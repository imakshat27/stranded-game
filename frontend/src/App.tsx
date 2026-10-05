import React, { useState, useEffect } from 'react';
import { NavigationHeader } from './components/common/NavigationHeader';
import { ResourceBar } from './components/game/ResourceBar';
import { SituationCard } from './components/game/SituationCard';
import { ActionGrid } from './components/game/ActionGrid';
import { HintPanel } from './components/game/HintPanel';
import { AILabView } from './components/ai/AILabView';
import { AlgorithmComparisonView } from './components/ai/AlgorithmComparisonView';
import { PlanningView } from './components/planning/PlanningView';
import { KnowledgeView } from './components/knowledge/KnowledgeView';
import { ProbabilityView } from './components/probability/ProbabilityView';
import { RivalModeView } from './components/rival/RivalModeView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { HelpView } from './components/help/HelpView';
import { GameState, Action, HintExplanation } from './types/game';
import { api } from './services/api';
import { AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('game');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [validActions, setValidActions] = useState<Action[]>([]);
  const [activeHint, setActiveHint] = useState<HintExplanation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Initialize or resume game session
  const initializeGame = async (seed?: string) => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const data = await api.game.start(seed);
      setGameState(data.state);
      setValidActions(data.valid_actions);
      setActiveHint(null);
      localStorage.setItem('stranded_last_game_id', data.state.game_id);
    } catch (err: any) {
      console.error('Initialization error:', err);
      setErrorBanner(`Failed to connect to game server: ${err.message}. Ensure backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeGame();
  }, []);

  // Action execution handler
  const handlePerformAction = async (actionId: string) => {
    if (!gameState) return;
    setLoading(true);
    setErrorBanner(null);
    try {
      const res = await api.game.action(gameState.game_id, actionId);
      setGameState(res.state);
      setValidActions(res.valid_actions);
    } catch (err: any) {
      console.error('Action error:', err);
      setErrorBanner(err.message || 'Action could not be executed.');
    } finally {
      setLoading(false);
    }
  };

  // AI Hint handler
  const handleRequestHint = async () => {
    if (!gameState) return;
    setLoading(true);
    setErrorBanner(null);
    try {
      const res = await api.game.hint(gameState.game_id);
      setActiveHint(res.hint);
      setGameState(res.state);
    } catch (err: any) {
      console.error('Hint error:', err);
      setErrorBanner(err.message || 'Hint advisor currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  // Restart handler
  const handleRestart = async () => {
    if (gameState) {
      setLoading(true);
      setErrorBanner(null);
      try {
        const res = await api.game.restart(gameState.game_id);
        setGameState(res.state);
        setValidActions(res.valid_actions);
        setActiveHint(null);
      } catch (err: any) {
        console.error('Restart error:', err);
        initializeGame();
      } finally {
        setLoading(false);
      }
    } else {
      initializeGame();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-slate-100">
      <div>
        {/* Navigation Bar */}
        <NavigationHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          gameState={gameState}
          onRestart={handleRestart}
          loading={loading}
        />

        {/* Global Error Banner */}
        {errorBanner && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-4">
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorBanner}</span>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 text-[11px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 pb-12">
          {/* TAB 1: Core Survival Gameplay */}
          {activeTab === 'game' && gameState && (
            <div className="space-y-6">
              <ResourceBar state={gameState} />
              <SituationCard state={gameState} />
              <HintPanel
                gameState={gameState}
                activeHint={activeHint}
                onRequestHint={handleRequestHint}
                loading={loading}
                onExecuteRecommended={handlePerformAction}
              />
              <ActionGrid
                actions={validActions}
                gameState={gameState}
                onSelectAction={handlePerformAction}
                loading={loading}
              />
            </div>
          )}

          {/* TAB 2: AI Search Laboratory */}
          {activeTab === 'ai-lab' && (
            <AILabView gameState={gameState} />
          )}

          {/* TAB 3: Algorithm Benchmark Matrix */}
          {activeTab === 'algorithms' && (
            <AlgorithmComparisonView gameState={gameState} />
          )}

          {/* TAB 4: Strategic Planner & Replanner */}
          {activeTab === 'planning' && (
            <PlanningView gameState={gameState} />
          )}

          {/* TAB 5: Knowledge Base & Propositional Reasoning */}
          {activeTab === 'knowledge' && (
            <KnowledgeView gameState={gameState} />
          )}

          {/* TAB 6: Bayesian Risk Engine */}
          {activeTab === 'probability' && (
            <ProbabilityView gameState={gameState} />
          )}

          {/* TAB 7: Rival Survivor Adversarial Mode */}
          {activeTab === 'rival' && (
            <RivalModeView />
          )}

          {/* TAB 8: Telemetry & Analytics */}
          {activeTab === 'analytics' && (
            <AnalyticsView gameState={gameState} />
          )}

          {/* TAB 9: Academic Course Manual & Guide */}
          {activeTab === 'help' && (
            <HelpView />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/70 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>STRANDED • An Adaptive AI Survival & Strategic Planning Simulation</span>
          <span className="text-[11px] text-slate-600">
            Backend: FastAPI + SQLAlchemy • Frontend: React + TypeScript + React Flow + Recharts
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
