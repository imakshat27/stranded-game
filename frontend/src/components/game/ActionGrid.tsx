import React, { useState } from 'react';
import {
  Compass,
  Hammer,
  Ship,
  Moon,
  LifeBuoy,
  Zap,
  Droplets,
  Utensils,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Action, GameState } from '../../types/game';

interface ActionGridProps {
  actions: Action[];
  gameState: GameState;
  onSelectAction: (actionId: string) => void;
  loading: boolean;
}

export const ActionGrid: React.FC<ActionGridProps> = ({
  actions,
  gameState,
  onSelectAction,
  loading
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Actions' },
    { id: 'SURVIVAL', label: 'Survival', icon: LifeBuoy },
    { id: 'EXPLORATION', label: 'Exploration', icon: Compass },
    { id: 'CRAFTING', label: 'Crafting', icon: Hammer },
    { id: 'ESCAPE', label: 'Escape Project', icon: Ship },
    { id: 'REST', label: 'Recuperation', icon: Moon }
  ];

  // Helper to determine if an action can currently be performed
  const evaluateActionPrereqs = (action: Action): { canPerform: boolean; reason?: string } => {
    if (gameState.game_status !== 'ACTIVE') {
      return { canPerform: false, reason: `Game is already ${gameState.game_status}` };
    }
    if (gameState.actions_remaining <= 0) {
      return { canPerform: false, reason: 'No actions remaining today' };
    }
    if (action.energy_cost > 0 && gameState.energy < action.energy_cost) {
      return { canPerform: false, reason: `Needs ${action.energy_cost} Energy (have ${Math.round(gameState.energy)})` };
    }
    const prereqs = action.prerequisites || {};
    if (prereqs.min_wood && gameState.wood < prereqs.min_wood) {
      return { canPerform: false, reason: `Requires ${prereqs.min_wood} Wood (have ${gameState.wood})` };
    }
    if (prereqs.min_rope && gameState.rope < prereqs.min_rope) {
      return { canPerform: false, reason: `Requires ${prereqs.min_rope} Rope (have ${gameState.rope})` };
    }
    if (prereqs.min_metal && gameState.metal < prereqs.min_metal) {
      return { canPerform: false, reason: `Requires ${prereqs.min_metal} Metal (have ${gameState.metal})` };
    }
    if (prereqs.min_water && gameState.water < prereqs.min_water) {
      return { canPerform: false, reason: `Requires ${prereqs.min_water} Water in reserve` };
    }
    if (prereqs.min_food && gameState.food < prereqs.min_food) {
      return { canPerform: false, reason: `Requires ${prereqs.min_food} Food in reserve` };
    }
    if (prereqs.discovered_locations) {
      for (const loc of prereqs.discovered_locations) {
        if (!gameState.discovered_locations.includes(loc)) {
          return { canPerform: false, reason: `Must discover ${loc.replace('_', ' ')} first` };
        }
      }
    }
    if (prereqs.boat_component_missing) {
      const comp = prereqs.boat_component_missing;
      if (gameState.boat_parts[comp as keyof typeof gameState.boat_parts]) {
        return { canPerform: false, reason: `${comp.toUpperCase()} already completed` };
      }
    }
    if (prereqs.escape_ready && !Object.values(gameState.boat_parts).every(Boolean)) {
      return { canPerform: false, reason: 'All 4 vessel components must be completed first' };
    }
    return { canPerform: true };
  };

  const filteredActions = actions.filter((act) =>
    selectedCategory === 'ALL' ? true : act.category === selectedCategory
  );

  const getRiskBadge = (risk: number) => {
    if (risk <= 0.05) return <span className="text-[10px] text-emerald-400 font-mono">Safe (5%)</span>;
    if (risk <= 0.15) return <span className="text-[10px] text-teal-400 font-mono">Low Risk ({Math.round(risk * 100)}%)</span>;
    if (risk <= 0.25) return <span className="text-[10px] text-amber-400 font-mono">Medium Risk ({Math.round(risk * 100)}%)</span>;
    return <span className="text-[10px] text-rose-400 font-mono font-semibold">High Risk ({Math.round(risk * 100)}%)</span>;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Action Directives</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({gameState.actions_remaining} actions left today)
            </span>
          </h3>
          <p className="text-xs text-slate-400">Choose actions wisely; every choice consumes vital stamina and shapes island events.</p>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                selectedCategory === c.id
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-semibold'
                  : 'bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {filteredActions.map((action) => {
          const { canPerform, reason } = evaluateActionPrereqs(action);
          return (
            <div
              key={action.id}
              className={`glass-card rounded-xl p-4 flex flex-col justify-between transition-all duration-200 ${
                canPerform
                  ? 'hover:border-emerald-500/40 hover:-translate-y-0.5 cursor-pointer group'
                  : 'opacity-60 bg-slate-950/40 border-slate-900/80 cursor-not-allowed'
              }`}
            >
              <div>
                {/* Header: Name & Risk */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className={`text-sm font-semibold transition ${canPerform ? 'text-white group-hover:text-emerald-300' : 'text-slate-400'}`}>
                    {action.name}
                  </h4>
                  <div className="shrink-0">{getRiskBadge(action.risk)}</div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300/80 leading-relaxed mb-3">
                  {action.description}
                </p>
              </div>

              {/* Resource Cost Badges & Action Trigger */}
              <div className="pt-2 border-t border-slate-800/60">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center gap-2.5">
                    {action.energy_cost !== 0 && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Zap className="w-3 h-3" />
                        {action.energy_cost > 0 ? `-${action.energy_cost}` : `+${Math.abs(action.energy_cost)}`}
                      </span>
                    )}
                    {action.water_cost > 0 && (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Droplets className="w-3 h-3" />
                        -{action.water_cost}
                      </span>
                    )}
                    {action.food_cost > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Utensils className="w-3 h-3" />
                        -{action.food_cost}
                      </span>
                    )}
                  </div>

                  <span className="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px] text-slate-400 uppercase">
                    {action.category}
                  </span>
                </div>

                {/* Button or Disabled Precondition Note */}
                {canPerform ? (
                  <button
                    onClick={() => onSelectAction(action.id)}
                    disabled={loading}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs shadow-md shadow-emerald-950/40 transition active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <span>Execute Action</span>
                  </button>
                ) : (
                  <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
                    <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{reason}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
