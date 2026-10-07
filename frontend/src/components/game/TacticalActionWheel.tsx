import React, { useState, useMemo } from 'react';
import {
  Compass,
  Hammer,
  Ship,
  Moon,
  LifeBuoy,
  Search,
  Sparkles,
  Zap,
  Droplets,
  Utensils,
  AlertTriangle,
  Lock,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { Action, GameState } from '../../types/game';

interface TacticalActionWheelProps {
  gameState: GameState;
  validActions: Action[];
  loading: boolean;
  onSelectAction: (actionId: string) => void;
  onRequestHint: () => void;
}

export const TacticalActionWheel: React.FC<TacticalActionWheelProps> = ({
  gameState,
  validActions,
  loading,
  onSelectAction,
  onRequestHint
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const categories = [
    { id: 'ALL', label: 'All Undertakings' },
    { id: 'SURVIVAL', label: 'Forage & Sustenance', icon: LifeBuoy },
    { id: 'EXPLORATION', label: 'Expedition & Scouting', icon: Compass },
    { id: 'CRAFTING', label: 'Craft & Fortify', icon: Hammer },
    { id: 'ESCAPE', label: 'Catamaran Assembly', icon: Ship },
    { id: 'REST', label: 'Rest & Firelight', icon: Moon }
  ];

  // Evaluate action prerequisites and usability
  const evaluatePrereqs = (action: Action): { canPerform: boolean; reason?: string } => {
    if (gameState.game_status !== 'ACTIVE') {
      return { canPerform: false, reason: `Game is ${gameState.game_status}` };
    }
    if (gameState.actions_remaining <= 0) {
      return { canPerform: false, reason: 'Exhausted: No daylight turns remaining today' };
    }
    if (action.energy_cost > 0 && gameState.energy < action.energy_cost) {
      return { canPerform: false, reason: `Requires ${action.energy_cost} Stamina (have ${Math.round(gameState.energy)})` };
    }
    const prereqs = action.prerequisites || {};
    if (prereqs.min_wood && gameState.wood < prereqs.min_wood) {
      return { canPerform: false, reason: `Requires ${prereqs.min_wood} Timber (have ${gameState.wood})` };
    }
    if (prereqs.min_rope && gameState.rope < prereqs.min_rope) {
      return { canPerform: false, reason: `Requires ${prereqs.min_rope} Rope (have ${gameState.rope})` };
    }
    if (prereqs.min_metal && gameState.metal < prereqs.min_metal) {
      return { canPerform: false, reason: `Requires ${prereqs.min_metal} Metal (have ${gameState.metal})` };
    }
    if (prereqs.min_tools && gameState.tools < prereqs.min_tools) {
      return { canPerform: false, reason: `Requires ${prereqs.min_tools} Tools` };
    }
    if (prereqs.min_food && gameState.food < prereqs.min_food) {
      return { canPerform: false, reason: `Requires ${prereqs.min_food} Caloric Provisions` };
    }
    return { canPerform: true };
  };

  // Filter actions
  const filteredActions = useMemo(() => {
    return validActions.filter((a) => {
      if (selectedCategory !== 'ALL' && a.category !== selectedCategory) {
        return false;
      }
      if (searchFilter.trim() !== '') {
        const query = searchFilter.toLowerCase();
        return (
          a.name.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.id.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [validActions, selectedCategory, searchFilter]);

  return (
    <div className="parchment-panel rounded-2xl p-6 lg:p-7 border-2 border-[#c29b38]/40 shadow-2xl space-y-5">
      {/* Header and Category Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#c29b38]/25 pb-4">
        <div>
          <h3 className="font-title text-base lg:text-lg text-[#fae5a5] font-bold tracking-wider flex items-center gap-2">
            <span>Tactical Undertakings & Survival Choices</span>
            <span className="text-xs font-serif italic text-[#c29b38]">
              ({gameState.actions_remaining} daylight turn{gameState.actions_remaining === 1 ? '' : 's'} remaining)
            </span>
          </h3>
          <p className="text-xs text-[#b8a287] font-serif italic mt-0.5">
            Select an action to advance the survivor's survival odyssey or construct the escape catamaran.
          </p>
        </div>

        {/* AI Mariner's Wisdom Button */}
        <button
          onClick={onRequestHint}
          disabled={loading || gameState.hints_remaining <= 0}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#382615] to-[#25190e] border border-[#c29b38]/50 text-[#fae5a5] hover:border-[#e5b85c] text-xs font-serif transition cursor-pointer shadow-md disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#e5b85c]" />
          <span>Consult Navigator's Almanac</span>
        </button>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif transition cursor-pointer ${
                isSelected
                  ? 'bg-[#3d2b1a] text-[#fae5a5] border border-[#c29b38]/70 font-semibold shadow-xs'
                  : 'bg-[#1b150e] text-[#a8947b] border border-[#c29b38]/20 hover:text-[#eeddc5]'
              }`}
            >
              {cat.icon && React.createElement(cat.icon, { className: 'w-3 h-3 text-[#e6c35c]' })}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        {filteredActions.length > 0 ? (
          filteredActions.map((action) => {
            const prereqCheck = evaluatePrereqs(action);
            const isEscape = action.category === 'ESCAPE';

            return (
              <div
                key={action.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  prereqCheck.canPerform
                    ? 'parchment-card hover:border-[#c29b38] cursor-pointer'
                    : 'bg-[#18130e]/80 border-[#c29b38]/15 opacity-60'
                }`}
                onClick={() => {
                  if (prereqCheck.canPerform && !loading) {
                    onSelectAction(action.id);
                  }
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-title text-sm font-bold text-[#fae5a5]">
                      {action.name}
                    </h4>
                    <span className="text-[10px] font-title px-2 py-0.5 rounded bg-[#2a1e13] text-[#d4af37] border border-[#c29b38]/30 shrink-0">
                      {action.category}
                    </span>
                  </div>

                  <p className="text-xs text-[#eeddc5] font-serif leading-relaxed">
                    {action.description}
                  </p>
                </div>

                {/* Bottom Costs & Undertake Button */}
                <div className="pt-3 mt-3 border-t border-[#c29b38]/15 flex items-center justify-between gap-2">
                  {/* Costs Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-serif text-[#b8a287]">
                    {action.energy_cost > 0 && (
                      <span className="flex items-center gap-1 text-[#facc15]">
                        <Zap className="w-3 h-3" />
                        -{action.energy_cost}
                      </span>
                    )}
                    {action.water_cost > 0 && (
                      <span className="flex items-center gap-1 text-[#67e8f9]">
                        <Droplets className="w-3 h-3" />
                        -{action.water_cost}
                      </span>
                    )}
                    {action.risk > 0.4 && (
                      <span className="flex items-center gap-1 text-[#f87171] font-title text-[10px]">
                        <AlertTriangle className="w-3 h-3" />
                        Hazard
                      </span>
                    )}
                    {action.escape_progress > 0 && (
                      <span className="text-[#e5b85c] font-title text-[10px]">
                        +{action.escape_progress}% Escape
                      </span>
                    )}
                  </div>

                  {/* Button or Prerequisite Reason */}
                  {prereqCheck.canPerform ? (
                    <button
                      disabled={loading}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#2e2013] hover:bg-[#422e1b] border border-[#c29b38]/50 text-[#fae5a5] text-xs font-serif transition shrink-0 shadow-xs cursor-pointer"
                    >
                      <span>Undertake</span>
                      <ArrowRight className="w-3 h-3 text-[#e6c35c]" />
                    </button>
                  ) : (
                    <span className="text-[11px] font-serif text-[#e05a47] italic text-right flex items-center gap-1">
                      <Lock className="w-3 h-3 shrink-0" />
                      {prereqCheck.reason}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-2 py-8 text-center text-xs text-[#8c765c] font-serif italic">
            No undertakings available under the chosen filter.
          </div>
        )}
      </div>
    </div>
  );
};
