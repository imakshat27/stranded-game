import React from 'react';
import {
  Compass,
  Cpu,
  BarChart3,
  BookOpen,
  GitBranch,
  ShieldAlert,
  Swords,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Activity
} from 'lucide-react';
import { GameState } from '../../types/game';

interface NavigationHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gameState: GameState | null;
  onRestart: () => void;
  loading: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  activeTab,
  setActiveTab,
  gameState,
  onRestart,
  loading
}) => {
  const navItems = [
    { id: 'game', label: 'Survival Camp', icon: Compass },
    { id: 'ai-lab', label: 'AI Search Lab', icon: Cpu },
    { id: 'algorithms', label: 'Benchmarks', icon: BarChart3 },
    { id: 'planning', label: 'Planner & Replan', icon: GitBranch },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'probability', label: 'Bayesian Risk', icon: ShieldAlert },
    { id: 'rival', label: 'Rival Mode', icon: Swords },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'help', label: 'Guide', icon: HelpCircle }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3 mb-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Island Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 text-lg">
              🏝️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-lg">
                  STRANDED
                </span>
                <span className="text-[10px] uppercase tracking-widest font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  AI Strategy
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {gameState ? `Day ${gameState.day} • Actions Left: ${gameState.actions_remaining}/2` : 'Session Initializing...'}
              </p>
            </div>
          </div>

          {gameState && (
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-700/60 pl-4 ml-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                gameState.game_status === 'WON'
                  ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300 animate-pulse'
                  : gameState.game_status === 'LOST'
                  ? 'bg-rose-950/70 border-rose-500 text-rose-300'
                  : 'bg-slate-800/70 border-slate-700 text-slate-300'
              }`}>
                {gameState.game_status === 'ACTIVE' ? `Weather: ${gameState.weather.toUpperCase()}` : gameState.game_status}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden md:inline">
                Loc: {gameState.location.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {gameState && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-emerald-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{gameState.hints_remaining} Hints</span>
              {gameState.hint_cooldown > 0 && (
                <span className="text-[10px] text-amber-400 ml-1">({gameState.hint_cooldown}t cd)</span>
              )}
            </div>
          )}

          <button
            onClick={onRestart}
            disabled={loading}
            title="Restart Run"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs transition"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
