import React, { useState } from 'react';
import {
  Compass,
  Cpu,
  Swords,
  Activity,
  RotateCcw,
  Sparkles,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  MapPin,
  ChevronDown
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 4 Core Destinations: Clean, purposeful, zero tab overflow
  const navItems = [
    {
      id: 'game',
      label: 'Survive',
      subtitle: 'Camp Command Center',
      icon: Compass
    },
    {
      id: 'ai-lab',
      label: 'AI Lab',
      subtitle: '5 Algorithm Systems',
      icon: Cpu
    },
    {
      id: 'rival',
      label: 'Rival Duel',
      subtitle: 'Minimax & Alpha-Beta',
      icon: Swords
    },
    {
      id: 'analytics',
      label: 'Intel & Docs',
      subtitle: 'Telemetry & Course Manual',
      icon: Activity
    }
  ];

  const getWeatherIcon = (weather?: string) => {
    switch (weather) {
      case 'stormy':
        return <CloudLightning className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />;
      case 'rainy':
        return <CloudRain className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />;
      case 'cloudy':
        return <Cloud className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />;
      default:
        return <Sun className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />;
    }
  };

  const activeItem = navItems.find((n) => n.id === activeTab) || navItems[0];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-2.5 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
            <svg
              className="w-4 h-4 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.25" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold tracking-tight text-white text-base">
                STRANDED
              </span>
              <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700/60">
                AI SIM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5 hidden sm:block">
              Adaptive Survival & Strategic Planning
            </p>
          </div>
        </div>

        {/* Consolidated Island Status (At-a-glance telemetry) */}
        {gameState && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/70 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="text-white font-semibold">Day {gameState.day}</span>
            <span className="text-slate-600">•</span>
            <span className={gameState.actions_remaining > 0 ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
              {gameState.actions_remaining}/2 actions
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 capitalize text-slate-300">
              {getWeatherIcon(gameState.weather)}
              {gameState.weather}
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="w-3 h-3 text-slate-500" aria-hidden="true" />
              {gameState.location.replace('_', ' ')}
            </span>
            {gameState.game_status !== 'ACTIVE' && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${
                  gameState.game_status === 'WON'
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500 text-rose-300'
                }`}
              >
                {gameState.game_status}
              </span>
            )}
          </div>
        )}

        {/* Desktop Primary Navigation: 4 High-Clarity Pillars */}
        <nav
          className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800"
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
                title={item.subtitle}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile View Switcher */}
        <div className="relative md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200"
          >
            {React.createElement(activeItem.icon, { className: 'w-3.5 h-3.5 text-emerald-400' })}
            <span>{activeItem.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {mobileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1 z-50">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left ${
                    activeTab === item.id
                      ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {React.createElement(item.icon, { className: 'w-3.5 h-3.5 text-emerald-400' })}
                  <div>
                    <div>{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Utility Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {gameState && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-mono"
              title={`${gameState.hints_remaining} advisor hints available`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>{gameState.hints_remaining}</span>
              {gameState.hint_cooldown > 0 && (
                <span className="text-[10px] text-amber-400">({gameState.hint_cooldown}cd)</span>
              )}
            </div>
          )}

          <button
            onClick={onRestart}
            disabled={loading}
            title="Reset Simulation Run"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
