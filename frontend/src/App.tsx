import React, { useState, useEffect } from 'react';
import { NavigationHeader } from './components/common/NavigationHeader';
import { CampCommandCenter } from './components/game/CampCommandCenter';
import { AILabHub } from './components/ai/AILabHub';
import { RivalModeView } from './components/rival/RivalModeView';
import { IntelligenceHub } from './components/analytics/IntelligenceHub';
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
    <div className="min-h-screen flex flex-col justify-between text-slate-100 bg-[#080c14]">
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
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
                <span>{errorBanner}</span>
              </div>
              <button
                onClick={() => setErrorBanner(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <main className="max-w-7xl mx-auto px-4 lg:px-8 pb-12">
          {/* PILLAR 1: Core Survival Camp Command Center */}
          {activeTab === 'game' && gameState && (
            <CampCommandCenter
              gameState={gameState}
              validActions={validActions}
              activeHint={activeHint}
              loading={loading}
              onSelectAction={handlePerformAction}
              onRequestHint={handleRequestHint}
              onRestart={handleRestart}
            />
          )}

          {/* PILLAR 2: Unified AI Algorithm Laboratory */}
          {activeTab === 'ai-lab' && (
            <AILabHub gameState={gameState} />
          )}

          {/* PILLAR 3: Rival Survivor Adversarial Duel */}
          {activeTab === 'rival' && (
            <RivalModeView />
          )}

          {/* PILLAR 4: Telemetry & Course Documentation */}
          {activeTab === 'analytics' && (
            <IntelligenceHub gameState={gameState} />
          )}
        </main>
      </div>

      {/* Minimal Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-3.5 px-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">STRANDED</span>
            <span>•</span>
            <span>Adaptive AI Survival Simulation</span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center gap-2">
            <span>FastAPI Backend</span>
            <span>•</span>
            <span>React + TypeScript + React Flow + Recharts</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
