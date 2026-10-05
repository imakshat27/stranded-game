import React from 'react';
import { Heart, Droplets, Utensils, Zap, Home, Shield, Trees, Cable, Wrench, Hammer } from 'lucide-react';
import { GameState } from '../../types/game';

interface ResourceBarProps {
  state: GameState;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({ state }) => {
  const getResourceColor = (val: number) => {
    if (val > 60) return 'from-emerald-500 to-teal-500';
    if (val > 30) return 'from-amber-500 to-yellow-500';
    return 'from-rose-600 to-red-500 animate-pulse';
  };

  const vitals = [
    {
      id: 'health',
      label: 'Health',
      val: Math.round(state.health),
      max: 100,
      icon: Heart,
      iconColor: 'text-rose-400',
      unit: '%'
    },
    {
      id: 'water',
      label: 'Water',
      val: Math.round(state.water),
      max: 100,
      icon: Droplets,
      iconColor: 'text-cyan-400',
      unit: '%'
    },
    {
      id: 'food',
      label: 'Food',
      val: Math.round(state.food),
      max: 100,
      icon: Utensils,
      iconColor: 'text-amber-400',
      unit: '%'
    },
    {
      id: 'energy',
      label: 'Energy',
      val: Math.round(state.energy),
      max: 100,
      icon: Zap,
      iconColor: 'text-yellow-400',
      unit: '%'
    }
  ];

  const materials = [
    { label: 'Timber', val: state.wood, icon: Trees, color: 'text-amber-500' },
    { label: 'Rope', val: state.rope, icon: Cable, color: 'text-emerald-400' },
    { label: 'Metal', val: state.metal, icon: Shield, color: 'text-cyan-400' },
    { label: 'Tools', val: state.tools, icon: Wrench, color: 'text-purple-400' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
      {/* Vital Gauges */}
      <div className="lg:col-span-8 glass-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-mono text-emerald-400 font-semibold">
              Biological Vitals
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/50">
            <Home className="w-3.5 h-3.5 text-teal-400" />
            <span>Shelter: <strong className="text-white">Lvl {state.shelter_level}/4</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {vitals.map((v) => {
            const Icon = v.icon;
            const pct = Math.min(100, Math.max(0, (v.val / v.max) * 100));
            return (
              <div key={v.id} className="glass-card rounded-xl p-3 relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${v.iconColor}`} />
                    <span className="text-xs font-medium text-slate-300">{v.label}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${v.val <= 30 ? 'text-rose-400 font-extrabold' : 'text-slate-200'}`}>
                    {v.val}{v.unit}
                  </span>
                </div>
                {/* Progress bar track */}
                <div className="w-full bg-slate-900/80 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getResourceColor(v.val)} transition-all duration-500 ease-out`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory & Vessel Parts */}
      <div className="lg:col-span-4 glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest font-mono text-cyan-400 font-semibold">
              Scavenged Supplies
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Escape: <strong className="text-emerald-400 font-bold">{Math.round(state.escape_progress)}%</strong>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {materials.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="glass-card rounded-xl p-2 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${m.color}`} />
                  <div className="text-sm font-mono font-bold text-white">{m.val}</div>
                  <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vessel Component Status */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[11px] mb-1.5 text-slate-400 font-mono">
            <span>Catamaran Components:</span>
            <span>{Object.values(state.boat_parts).filter(Boolean).length}/4 Built</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono text-center">
            {Object.entries(state.boat_parts).map(([part, built]) => (
              <span
                key={part}
                className={`py-1 px-1 rounded border transition-colors ${
                  built
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                {part.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
