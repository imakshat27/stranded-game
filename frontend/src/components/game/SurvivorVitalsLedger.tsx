import React from 'react';
import {
  Heart,
  Droplets,
  Utensils,
  Zap,
  Home,
  Anchor,
  Ship,
  Compass,
  AlertCircle,
  CheckCircle2,
  Package,
  Wrench
} from 'lucide-react';
import { GameState } from '../../types/game';

interface SurvivorVitalsLedgerProps {
  gameState: GameState;
}

export const SurvivorVitalsLedger: React.FC<SurvivorVitalsLedgerProps> = ({ gameState }) => {
  // Determine survivor physical status description
  const getStatusCondition = (health: number, water: number, food: number, energy: number) => {
    if (health <= 25) return { label: 'Near Death', color: 'text-rose-400', badge: 'bg-rose-950/80 border-rose-800' };
    if (water <= 20) return { label: 'Severe Dehydration', color: 'text-amber-400', badge: 'bg-amber-950/80 border-amber-800' };
    if (food <= 20) return { label: 'Starving', color: 'text-amber-400', badge: 'bg-amber-950/80 border-amber-800' };
    if (energy <= 20) return { label: 'Exhausted', color: 'text-yellow-400', badge: 'bg-yellow-950/80 border-yellow-800' };
    if (health >= 80 && water >= 60 && food >= 60) return { label: 'Vigorous', color: 'text-emerald-400', badge: 'bg-emerald-950/80 border-emerald-800' };
    return { label: 'Enduring', color: 'text-[#e6c35c]', badge: 'bg-[#2a1d12] border-[#c29b38]/40' };
  };

  const condition = getStatusCondition(gameState.health, gameState.water, gameState.food, gameState.energy);

  // Vitals Array
  const vitals = [
    {
      label: 'Vigor / Health',
      value: Math.round(gameState.health),
      max: 100,
      icon: Heart,
      color: gameState.health < 30 ? 'bg-rose-700' : 'bg-[#a82828]',
      textColor: 'text-rose-300',
      description: 'Physical vitality. Depleted by starvation and island hazards.'
    },
    {
      label: 'Fresh Hydration',
      value: Math.round(gameState.water),
      max: 100,
      icon: Droplets,
      color: gameState.water < 30 ? 'bg-amber-700' : 'bg-[#1d6e8a]',
      textColor: 'text-cyan-300',
      description: 'Water reserves. Consumed daily and in tropical heat.'
    },
    {
      label: 'Sustenance / Calorie',
      value: Math.round(gameState.food),
      max: 100,
      icon: Utensils,
      color: gameState.food < 30 ? 'bg-amber-700' : 'bg-[#b86b28]',
      textColor: 'text-amber-300',
      description: 'Nourishment. Required daily to sustain muscular recovery.'
    },
    {
      label: 'Stamina / Energy',
      value: Math.round(gameState.energy),
      max: 100,
      icon: Zap,
      color: gameState.energy < 25 ? 'bg-rose-700' : 'bg-[#c29b38]',
      textColor: 'text-yellow-300',
      description: 'Physical stamina for foraging, exploration, and construction.'
    }
  ];

  // Catamaran Parts
  const parts = [
    { id: 'hull', name: 'Twin Outrigger Hulls', complete: gameState.boat_parts?.hull },
    { id: 'rigging', name: 'Bamboo Mast & Rigging', complete: gameState.boat_parts?.rigging },
    { id: 'rudder', name: 'Stern Hardwood Rudder', complete: gameState.boat_parts?.rudder },
    { id: 'provisions', name: 'Dried Sea Provisions', complete: gameState.boat_parts?.provisions }
  ];

  const completedPartsCount = parts.filter((p) => p.complete).length;

  return (
    <div className="space-y-4">
      {/* 1. Survivor Vitals Ledger */}
      <div className="parchment-panel rounded-2xl p-5 border-2 border-[#c29b38]/40 shadow-xl space-y-4">
        {/* Header with Condition */}
        <div className="flex items-center justify-between border-b border-[#c29b38]/25 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#e5b85c]" />
            <h3 className="font-title text-sm lg:text-base text-[#fae5a5] font-bold tracking-wider">
              Survivor's Vitals
            </h3>
          </div>
          <span className={`text-[11px] font-title px-2.5 py-0.5 rounded-full border ${condition.badge} ${condition.color}`}>
            {condition.label}
          </span>
        </div>

        {/* 4 Vitals Meters */}
        <div className="space-y-3.5">
          {vitals.map((v, i) => {
            const Icon = v.icon;
            const pct = Math.min(100, Math.max(0, (v.value / v.max) * 100));
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-serif">
                  <span className="flex items-center gap-1.5 text-[#eeddc5]">
                    <Icon className={`w-3.5 h-3.5 ${v.textColor}`} />
                    <span>{v.label}</span>
                  </span>
                  <span className="font-title font-semibold text-[#fae5a5]">
                    {v.value}%
                  </span>
                </div>
                {/* Vintage Inset Meter */}
                <div className="w-full h-2 rounded-full bg-[#16100a] border border-[#c29b38]/25 p-[1px] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${v.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Shelter Fortification Tier */}
        <div className="pt-2 border-t border-[#c29b38]/20 flex items-center justify-between text-xs font-serif text-[#b8a287]">
          <span className="flex items-center gap-1.5 text-[#eeddc5]">
            <Home className="w-3.5 h-3.5 text-[#e5b85c]" />
            <span>Camp Shelter:</span>
          </span>
          <span className="font-title text-[#fae5a5] font-semibold">
            {gameState.shelter_level === 0
              ? 'Exposed Sand (Tier 0)'
              : gameState.shelter_level === 1
              ? 'Thatch Lean-to (Tier 1)'
              : gameState.shelter_level === 2
              ? 'Palm Palisade (Tier 2)'
              : 'Watchtower Haven (Tier 3)'}
          </span>
        </div>
      </div>

      {/* 2. Ship's Hold / Scavenged Cache */}
      <div className="parchment-panel rounded-2xl p-5 border-2 border-[#c29b38]/40 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-[#c29b38]/25 pb-2.5">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#e5b85c]" />
            <h4 className="font-title text-sm text-[#fae5a5] font-bold tracking-wider">
              Scavenged Cache
            </h4>
          </div>
          <span className="text-[11px] text-[#8c765c] font-serif italic">Inventory</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <div className="p-2.5 rounded-xl bg-[#201810] border border-[#c29b38]/25 flex items-center justify-between">
            <span className="text-xs font-serif text-[#eeddc5] flex items-center gap-1.5">
              <span>🪵</span> Timber
            </span>
            <span className="font-title text-sm font-bold text-[#fae5a5]">{gameState.wood}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#201810] border border-[#c29b38]/25 flex items-center justify-between">
            <span className="text-xs font-serif text-[#eeddc5] flex items-center gap-1.5">
              <span>🧵</span> Coir Rope
            </span>
            <span className="font-title text-sm font-bold text-[#fae5a5]">{gameState.rope}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#201810] border border-[#c29b38]/25 flex items-center justify-between">
            <span className="text-xs font-serif text-[#eeddc5] flex items-center gap-1.5">
              <span>⚙️</span> Metal
            </span>
            <span className="font-title text-sm font-bold text-[#fae5a5]">{gameState.metal}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#201810] border border-[#c29b38]/25 flex items-center justify-between">
            <span className="text-xs font-serif text-[#eeddc5] flex items-center gap-1.5">
              <span>🪓</span> Tools
            </span>
            <span className="font-title text-sm font-bold text-[#fae5a5]">{gameState.tools}</span>
          </div>
        </div>
      </div>

      {/* 3. The Escape Catamaran Blueprint */}
      <div className="parchment-panel rounded-2xl p-5 border-2 border-[#c29b38]/40 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#c29b38]/25 pb-2.5">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-[#e5b85c]" />
            <h4 className="font-title text-sm text-[#fae5a5] font-bold tracking-wider">
              Escape Catamaran Blueprint
            </h4>
          </div>
          <span className="font-title text-xs font-bold text-[#fae5a5]">
            {Math.round(gameState.escape_progress)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#16100a] border border-[#c29b38]/25 p-[1px] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#9e7935] via-[#e5b85c] to-[#d4af37] transition-all duration-500 shadow-sm"
            style={{ width: `${Math.min(100, gameState.escape_progress)}%` }}
          />
        </div>

        {/* 4 Assembly Components Checkbox Grid */}
        <div className="space-y-2 pt-1">
          {parts.map((part) => (
            <div
              key={part.id}
              className={`p-2 rounded-lg border text-xs font-serif flex items-center justify-between transition ${
                part.complete
                  ? 'bg-[#1b2b1c] border-[#3d7a55] text-[#bbf7d0]'
                  : 'bg-[#1f1710] border-[#c29b38]/20 text-[#a8947b]'
              }`}
            >
              <div className="flex items-center gap-2">
                {part.complete ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-[#786144] ml-0.5" />
                )}
                <span className={part.complete ? 'font-medium text-[#fae5a5]' : ''}>
                  {part.name}
                </span>
              </div>
              <span className="text-[10px] font-title uppercase tracking-wider">
                {part.complete ? 'Fitted' : 'Pending'}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-[#8c765c] font-serif italic text-center pt-1">
          {completedPartsCount === 4
            ? '⭐ Vessel complete! Assemble crew & launch into the outer reef channel!'
            : `Assemble all 4 components (${completedPartsCount}/4 ready) to escape the island.`}
        </p>
      </div>
    </div>
  );
};
