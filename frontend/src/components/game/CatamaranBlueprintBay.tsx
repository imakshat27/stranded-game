import React from 'react';
import {
  Anchor,
  CheckCircle2,
  AlertCircle,
  Ship,
  Sparkles,
  Shield,
  Layers
} from 'lucide-react';
import { GameState } from '../../types/game';

interface CatamaranBlueprintBayProps {
  gameState: GameState;
  onSelectAction?: (actionId: string) => void;
}

export const CatamaranBlueprintBay: React.FC<CatamaranBlueprintBayProps> = ({
  gameState,
  onSelectAction
}) => {
  const parts = [
    {
      id: 'hull',
      label: 'Twin Pontoons & Hull',
      shortLabel: 'Hull Chassis',
      built: gameState.boat_parts.hull,
      actionId: 'build_boat_hull',
      requires: '6 Wood • 30 Energy',
      canBuild: !gameState.boat_parts.hull && gameState.wood >= 6 && gameState.energy >= 30,
      desc: 'Carved cedar floats tied with lashings'
    },
    {
      id: 'rigging',
      label: 'Bamboo Mast & Rigging',
      shortLabel: 'Sails & Rigging',
      built: gameState.boat_parts.rigging,
      actionId: 'rig_boat_sails',
      requires: '4 Rope • 25 Energy',
      canBuild: !gameState.boat_parts.rigging && gameState.rope >= 4 && gameState.energy >= 25,
      desc: 'Woven canvas sail & marine halyards'
    },
    {
      id: 'rudder',
      label: 'Reinforced Rudder & Oar',
      shortLabel: 'Rudder & Keel',
      built: gameState.boat_parts.rudder,
      actionId: 'craft_rudder_keel',
      requires: '3 Wood • 2 Metal • 25 Energy',
      canBuild: !gameState.boat_parts.rudder && gameState.wood >= 3 && gameState.metal >= 2 && gameState.energy >= 25,
      desc: 'Directional steering fin & keel'
    },
    {
      id: 'provisions',
      label: 'Voyage Rations & Casks',
      shortLabel: 'Sea Provisions',
      built: gameState.boat_parts.provisions,
      actionId: 'stockpile_provisions',
      requires: '25 Water • 25 Food • 20 Energy',
      canBuild: !gameState.boat_parts.provisions && gameState.water >= 35 && gameState.food >= 35 && gameState.energy >= 20,
      desc: 'Desalinated water & preserved rations'
    }
  ];

  const totalBuilt = parts.filter((p) => p.built).length;
  const isEscapeReady = totalBuilt === 4;

  return (
    <div className="game-panel rounded-2xl p-4 border border-slate-800/80 space-y-3">
      {/* Blueprint Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Ship className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                CATAMARAN SCHEMATIC
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                {totalBuilt}/4 Modules
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Escape Vessel Construction Workshop
            </p>
          </div>
        </div>

        <div className="text-right font-mono">
          <span className="text-sm font-bold text-emerald-400 block">
            {Math.round(gameState.escape_progress)}%
          </span>
          <span className="text-[10px] text-slate-500">READINESS</span>
        </div>
      </div>

      {/* SVG Nautical Vessel Schematic Display */}
      <div className="relative w-full h-32 bg-slate-950/70 rounded-xl overflow-hidden border border-slate-900 flex items-center justify-center p-2">
        <svg
          viewBox="0 0 320 120"
          className="w-full h-full max-w-sm select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Blueprint Grid Lines */}
          <line x1="0" y1="60" x2="320" y2="60" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />
          <line x1="160" y1="0" x2="160" y2="120" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 4" />

          {/* HULL: Left Pontoon */}
          <path
            d="M 60 30 C 50 40, 50 80, 60 90 L 110 88 C 115 80, 115 40, 110 32 Z"
            fill={gameState.boat_parts.hull ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.4)'}
            stroke={gameState.boat_parts.hull ? '#10b981' : '#475569'}
            strokeWidth="2"
            strokeDasharray={gameState.boat_parts.hull ? 'none' : '3 3'}
          />

          {/* HULL: Right Pontoon */}
          <path
            d="M 210 30 C 205 40, 205 80, 210 90 L 260 88 C 270 80, 270 40, 260 32 Z"
            fill={gameState.boat_parts.hull ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.4)'}
            stroke={gameState.boat_parts.hull ? '#10b981' : '#475569'}
            strokeWidth="2"
            strokeDasharray={gameState.boat_parts.hull ? 'none' : '3 3'}
          />

          {/* Crossbeams Connecting Pontoons */}
          <rect
            x="100"
            y="45"
            width="120"
            height="6"
            rx="2"
            fill={gameState.boat_parts.hull ? '#10b981' : '#334155'}
          />
          <rect
            x="100"
            y="70"
            width="120"
            height="6"
            rx="2"
            fill={gameState.boat_parts.hull ? '#10b981' : '#334155'}
          />

          {/* RIGGING & MAST: Central Mast + Triangular Sail */}
          <line
            x1="160"
            y1="60"
            x2="160"
            y2="15"
            stroke={gameState.boat_parts.rigging ? '#38bdf8' : '#475569'}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <polygon
            points="160,18 200,55 160,55"
            fill={gameState.boat_parts.rigging ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.2)'}
            stroke={gameState.boat_parts.rigging ? '#38bdf8' : '#475569'}
            strokeWidth="1.5"
            strokeDasharray={gameState.boat_parts.rigging ? 'none' : '2 3'}
          />

          {/* RUDDER: Stern Steering Fin */}
          <path
            d="M 156 80 L 164 80 L 166 108 L 154 108 Z"
            fill={gameState.boat_parts.rudder ? 'rgba(245, 158, 11, 0.3)' : 'rgba(30, 41, 59, 0.2)'}
            stroke={gameState.boat_parts.rudder ? '#f59e0b' : '#475569'}
            strokeWidth="1.5"
          />

          {/* PROVISIONS: Center Deck Storage Cask */}
          <circle
            cx="160"
            cy="60"
            r="8"
            fill={gameState.boat_parts.provisions ? 'rgba(167, 139, 250, 0.5)' : 'rgba(30, 41, 59, 0.3)'}
            stroke={gameState.boat_parts.provisions ? '#a78bfa' : '#475569'}
            strokeWidth="1.5"
          />

          {/* Blueprint Labels */}
          <text x="160" y="116" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">
            {isEscapeReady ? 'ALL MODULES OPERATIONAL — READY TO SAIL' : 'CATAMARAN ESCAPE PLATFORM'}
          </text>
        </svg>

        {isEscapeReady && (
          <div className="absolute inset-0 bg-emerald-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center border border-emerald-500/60 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-300 font-mono font-bold text-xs">
              <Ship className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>VESSEL ASSEMBLY 100% COMPLETE</span>
            </div>
            <p className="text-[10px] text-slate-300 max-w-xs">
              All 4 seaworthy modules are locked. The escape slipway is cleared for open ocean transit.
            </p>
            {onSelectAction && (
              <button
                onClick={() => onSelectAction('launch_escape')}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition cursor-pointer shadow-lg shadow-emerald-950/60 glow-emerald"
              >
                Launch Catamaran & Escape
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4 Interactive Part Modules Cards */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        {parts.map((p) => (
          <div
            key={p.id}
            className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
              p.built
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : p.canBuild
                ? 'bg-slate-900 border-cyan-500/50 shadow-xs'
                : 'bg-slate-900/50 border-slate-800/80 text-slate-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white text-[11px] truncate">{p.shortLabel}</span>
                {p.built ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Built
                  </span>
                ) : p.canBuild ? (
                  <span className="text-[9px] text-cyan-300 font-bold uppercase animate-pulse">Ready</span>
                ) : (
                  <span className="text-[9px] text-amber-400 font-semibold uppercase">Pending</span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight truncate">{p.requires}</p>
            </div>

            {!p.built && p.canBuild && onSelectAction && (
              <button
                onClick={() => onSelectAction(p.actionId)}
                className="mt-2 w-full py-1 rounded-md bg-cyan-600/80 hover:bg-cyan-500 text-white text-[10px] font-semibold transition cursor-pointer"
              >
                Assemble Now
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
