import React from 'react';
import {
  Heart,
  Droplets,
  Utensils,
  Zap,
  Home,
  Shield,
  TreePine,
  Cable,
  Wrench,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { GameState } from '../../types/game';

interface SurvivalVitalsDeckProps {
  gameState: GameState;
}

export const SurvivalVitalsDeck: React.FC<SurvivalVitalsDeckProps> = ({ gameState }) => {
  const vitals = [
    {
      id: 'health',
      label: 'Health',
      val: Math.round(gameState.health),
      icon: Heart,
      color: '#f43f5e',
      textColor: 'text-rose-400',
      status: gameState.health <= 30 ? 'CRITICAL' : gameState.health <= 60 ? 'WOUNDED' : 'HEALTHY'
    },
    {
      id: 'water',
      label: 'Hydration',
      val: Math.round(gameState.water),
      icon: Droplets,
      color: '#06b6d4',
      textColor: 'text-cyan-400',
      status: gameState.water <= 30 ? 'PARCHED' : gameState.water <= 60 ? 'THIRSTY' : 'HYDRATED'
    },
    {
      id: 'food',
      label: 'Sustenance',
      val: Math.round(gameState.food),
      icon: Utensils,
      color: '#f59e0b',
      textColor: 'text-amber-400',
      status: gameState.food <= 30 ? 'STARVING' : gameState.food <= 60 ? 'HUNGRY' : 'NOURISHED'
    },
    {
      id: 'energy',
      label: 'Stamina',
      val: Math.round(gameState.energy),
      icon: Zap,
      color: '#eab308',
      textColor: 'text-yellow-400',
      status: gameState.energy <= 30 ? 'EXHAUSTED' : gameState.energy <= 60 ? 'WEARY' : 'ENERGETIC'
    }
  ];

  const materials = [
    { label: 'Timber', val: gameState.wood, icon: TreePine, color: 'text-amber-400', unit: 'logs' },
    { label: 'Rope', val: gameState.rope, icon: Cable, color: 'text-emerald-400', unit: 'coils' },
    { label: 'Metal', val: gameState.metal, icon: Shield, color: 'text-cyan-400', unit: 'plates' },
    { label: 'Tools', val: gameState.tools, icon: Wrench, color: 'text-indigo-400', unit: 'kits' }
  ];

  return (
    <div className="game-panel rounded-2xl p-4 border border-slate-800/80 space-y-3.5">
      {/* Vitals Header */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white uppercase tracking-wider">
            SURVIVOR VITALS & SUPPLIES
          </span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <Home className="w-3.5 h-3.5 text-teal-400" />
          <span>Shelter Lvl {gameState.shelter_level}/4</span>
          {gameState.weather === 'stormy' && gameState.shelter_level < 2 && (
            <span className="text-rose-400 ml-1 font-bold animate-pulse">(! Exposed)</span>
          )}
        </div>
      </div>

      {/* 4 Vitals Circular / Meter Pods */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {vitals.map((v) => {
          const Icon = v.icon;
          const isCritical = v.val <= 30;
          return (
            <div
              key={v.id}
              className={`p-2.5 rounded-xl border transition-all ${
                isCritical
                  ? 'bg-rose-950/25 border-rose-500/50 glow-rose'
                  : 'bg-slate-900/50 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="flex items-center gap-1 text-slate-300">
                  <Icon className={`w-3.5 h-3.5 ${v.textColor}`} />
                  <span className="font-medium text-[11px]">{v.label}</span>
                </span>
                <span className={`font-mono font-bold text-xs ${isCritical ? 'text-rose-400 font-extrabold animate-pulse' : 'text-slate-100'}`}>
                  {v.val}%
                </span>
              </div>

              {/* Progress gauge */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-900 mb-1">
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, Math.max(0, v.val))}%`,
                    backgroundColor: v.color
                  }}
                />
              </div>

              {/* Status indicator tag */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500">
                <span>STATUS:</span>
                <span className={isCritical ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                  {v.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scavenged Inventory Backpack */}
      <div className="pt-2 border-t border-slate-800/70">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
          <span className="uppercase tracking-wider font-semibold text-slate-300">
            Survival Cache Inventory
          </span>
          <span>{gameState.wood + gameState.rope + gameState.metal + gameState.tools} items stored</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {materials.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center hover:border-slate-700 transition"
              >
                <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${m.color}`} />
                <div className="text-base font-mono font-extrabold text-white leading-none mb-0.5">
                  {m.val}
                </div>
                <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
