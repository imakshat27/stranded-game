import React, { useState } from 'react';
import { Swords, Shield, Droplets, Wrench, Zap, Play, Award, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../../services/api';

export const RivalModeView: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<'alpha_beta' | 'minimax'>('alpha_beta');
  const [depth, setDepth] = useState<number>(3);
  const [rivalData, setRivalData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Player state simulation in rival mode
  const [playerState, setPlayerState] = useState({
    health: 80,
    water: 60,
    food: 60,
    materials: 2,
    boat_progress: 0
  });

  const [rivalState, setRivalState] = useState({
    health: 80,
    water: 60,
    food: 60,
    materials: 2,
    boat_progress: 0
  });

  const [round, setRound] = useState<number>(1);
  const [actionLog, setActionLog] = useState<string[]>([
    'Rival survivor detected on the northern reef! Both survivors are competing for freshwater springs and tidal salvage.'
  ]);

  const handleRunRivalAlgorithm = async (playerAction?: string) => {
    setLoading(true);
    try {
      const data = await api.ai.rival({
        algorithm: algorithm,
        depth: depth,
        playerAction: playerAction
      });
      setRivalData(data);

      if (playerAction) {
        // Update local simulated round
        setActionLog((prev) => [
          ...prev,
          `Round ${round}: You executed [${playerAction}].`,
          `AI Rival responded with [${data.best_action}] via ${algorithm.toUpperCase()} (Eval: ${data.best_value}).`
        ]);
        setRound((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Rival algorithm failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-rose-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Rival Survivor Adversarial Mode (Minimax & Alpha-Beta)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Competitive game-theoretic state space where Player (MAX) competes against AI Rival (MIN) for island resources.
            </p>
          </div>

          {/* Algorithm Toggle & Search Depth */}
          <div className="flex items-center gap-2.5">
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono"
            >
              <option value="alpha_beta">Alpha-Beta Pruning (Optimal & Pruned)</option>
              <option value="minimax">Standard Minimax (Exhaustive Tree)</option>
            </select>

            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 font-mono"
            >
              <option value={2}>Depth 2</option>
              <option value={3}>Depth 3</option>
              <option value={4}>Depth 4</option>
            </select>

            <button
              onClick={() => handleRunRivalAlgorithm()}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-xs flex items-center gap-1.5 transition"
            >
              <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Analyze Tree</span>
            </button>
          </div>
        </div>

        {/* Duel Status Grid: Player vs Rival */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Player (MAX) Card */}
          <div className="glass-card rounded-xl p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-emerald-400">PLAYER (MAX)</span>
              <span className="text-xs font-mono text-slate-400">Vessel: {playerState.boat_progress}%</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-rose-400 block font-bold">{playerState.health}%</span>
                <span className="text-[10px] text-slate-500">Health</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 block font-bold">{playerState.water}%</span>
                <span className="text-[10px] text-slate-500">Water</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-amber-400 block font-bold">{playerState.food}%</span>
                <span className="text-[10px] text-slate-500">Food</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-purple-400 block font-bold">{playerState.materials}</span>
                <span className="text-[10px] text-slate-500">Salvage</span>
              </div>
            </div>

            {/* Turn Actions */}
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-mono block mb-2">Play Action Directive:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => handleRunRivalAlgorithm('claim_spring')}
                  disabled={loading}
                  className="p-1.5 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-200 transition text-left"
                >
                  Secure Water Spring
                </button>
                <button
                  onClick={() => handleRunRivalAlgorithm('salvage_wreck')}
                  disabled={loading}
                  className="p-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/30 text-amber-200 transition text-left"
                >
                  Raid Shipwreck Salvage
                </button>
                <button
                  onClick={() => handleRunRivalAlgorithm('build_vessel')}
                  disabled={loading}
                  className="p-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/30 text-emerald-200 transition text-left"
                >
                  Construct Vessel Ribs
                </button>
                <button
                  onClick={() => handleRunRivalAlgorithm('rest_and_guard')}
                  disabled={loading}
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition text-left"
                >
                  Fortify Base & Rest
                </button>
              </div>
            </div>
          </div>

          {/* AI Rival (MIN) Card */}
          <div className="glass-card rounded-xl p-4 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-rose-400">AI RIVAL SURVIVOR (MIN)</span>
              <span className="text-xs font-mono text-slate-400">Vessel: {rivalState.boat_progress}%</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono text-center">
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-rose-400 block font-bold">{rivalState.health}%</span>
                <span className="text-[10px] text-slate-500">Health</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-cyan-400 block font-bold">{rivalState.water}%</span>
                <span className="text-[10px] text-slate-500">Water</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-amber-400 block font-bold">{rivalState.food}%</span>
                <span className="text-[10px] text-slate-500">Food</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-purple-400 block font-bold">{rivalState.materials}</span>
                <span className="text-[10px] text-slate-500">Salvage</span>
              </div>
            </div>

            {/* AI Decision Card */}
            <div className="mt-3 pt-3 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">AI Strategic Intelligence:</span>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Optimal Action:</span>
                  <span className="text-rose-300 font-bold">{rivalData?.best_action || 'Evaluating...'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Minimax Utility:</span>
                  <span className="text-white font-bold">{rivalData?.best_value || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nodes Explored:</span>
                  <span className="text-emerald-400">{rivalData?.nodes_explored || '0'}</span>
                </div>
                {rivalData?.pruned_branches !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pruned Subtrees (α-β):</span>
                    <span className="text-cyan-400 font-bold">{rivalData.pruned_branches}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Duel History Narrative Log */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
          Encounter Chronicle
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-xs text-slate-300">
          {actionLog.map((log, i) => (
            <div key={i} className="p-2 rounded bg-slate-900/50 border border-slate-800/60">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
