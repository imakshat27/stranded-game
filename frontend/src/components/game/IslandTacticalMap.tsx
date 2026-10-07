import React from 'react';
import {
  MapPin,
  Compass,
  Sun,
  CloudRain,
  CloudLightning,
  Cloud,
  Eye,
  Shield,
  Navigation
} from 'lucide-react';
import { GameState } from '../../types/game';

interface IslandTacticalMapProps {
  gameState: GameState;
  selectedSector: string | null;
  onSelectSector: (sectorId: string | null) => void;
}

interface SectorInfo {
  id: string;
  name: string;
  category: string;
  cx: number;
  cy: number;
  color: string;
  hazardLevel: 'low' | 'medium' | 'high';
  description: string;
  primaryYield: string;
}

export const IslandTacticalMap: React.FC<IslandTacticalMapProps> = ({
  gameState,
  selectedSector,
  onSelectSector
}) => {
  const sectors: SectorInfo[] = [
    {
      id: 'shoreline',
      name: 'Shipwreck Shoreline',
      category: 'BASE CAMP',
      cx: 140,
      cy: 280,
      color: '#10b981',
      hazardLevel: 'low',
      description: 'Tidal beach littered with driftwood, crates, and catamaran launch slipway.',
      primaryYield: 'Driftwood • Flotsam'
    },
    {
      id: 'freshwater_spring',
      name: 'Verdant Spring',
      category: 'WATER SOURCE',
      cx: 260,
      cy: 230,
      color: '#06b6d4',
      hazardLevel: 'low',
      description: 'Clear aquifer basin filtered through volcanic basalt.',
      primaryYield: 'Potable Water'
    },
    {
      id: 'dense_jungle',
      name: 'Ancient Canopy Jungle',
      category: 'FOREST BIOME',
      cx: 320,
      cy: 160,
      color: '#10b981',
      hazardLevel: 'medium',
      description: 'Dense ironwood, climbing vines, and wild fruit groves.',
      primaryYield: 'Timber • Vines • Fruit'
    },
    {
      id: 'rocky_ridge',
      name: 'Volcanic Caldera Ridge',
      category: 'HIGH ELEVATION',
      cx: 440,
      cy: 130,
      color: '#f59e0b',
      hazardLevel: 'high',
      description: 'Obsidian spires with exposed metallic ore and lookout vantage.',
      primaryYield: 'Metal Ore • Quartz'
    },
    {
      id: 'barrier_reef',
      name: 'Outer Reef & Wreck',
      category: 'OCEAN LAUNCH',
      cx: 480,
      cy: 270,
      color: '#6366f1',
      hazardLevel: 'high',
      description: 'Submerged coral shelves and iron cargo hull. Catamaran escape gateway.',
      primaryYield: 'Salvage • Sea Escape'
    }
  ];

  const currentLocationId = gameState.location.toLowerCase();

  return (
    <div className="game-panel rounded-2xl p-4 border border-slate-800/80 relative overflow-hidden">
      {/* Tactical Map Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-2 pb-2 border-b border-slate-800/80 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold text-white tracking-wider">ISLAND TACTICAL CHART</span>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            // SECTOR 08-S
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>08°24'S 142°51'W</span>
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-semibold">
            {gameState.discovered_locations.length}/5 Mapped
          </span>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-56 sm:h-64 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-900 shadow-inner">
        {/* Ocean Grids & Radar Rings */}
        <svg
          viewBox="0 0 600 340"
          className="w-full h-full select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>

            {/* Island Land Gradient */}
            <linearGradient id="islandLandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="50%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#09101d" />
            </linearGradient>

            {/* Reef Water Glow */}
            <radialGradient id="oceanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.12)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Grid Background */}
          <rect width="600" height="340" fill="url(#tacticalGrid)" />
          <circle cx="300" cy="170" r="160" fill="url(#oceanGlow)" />

          {/* Radar Circles */}
          <circle cx="300" cy="170" r="80" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" strokeDasharray="3 6" />
          <circle cx="300" cy="170" r="140" fill="none" stroke="rgba(16, 185, 129, 0.06)" strokeWidth="1" strokeDasharray="4 8" />
          <line x1="300" y1="10" x2="300" y2="330" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <line x1="10" y1="170" x2="590" y2="170" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Shallow Coral Shoal Ring */}
          <path
            d="M 100 280 C 130 190, 200 110, 310 90 C 440 70, 520 140, 530 240 C 540 310, 390 320, 250 310 Z"
            fill="rgba(6, 182, 212, 0.08)"
            stroke="rgba(6, 182, 212, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />

          {/* Island Landmass Contour */}
          <path
            d="M 120 280 C 150 200, 210 130, 310 110 C 420 90, 480 150, 490 230 C 500 290, 380 300, 240 295 Z"
            fill="url(#islandLandGrad)"
            stroke="rgba(52, 211, 153, 0.3)"
            strokeWidth="2"
          />

          {/* Elevation Topography Ridges */}
          <path
            d="M 270 170 C 330 140, 410 130, 440 150 C 460 170, 420 210, 350 220 Z"
            fill="rgba(245, 158, 11, 0.08)"
            stroke="rgba(245, 158, 11, 0.25)"
            strokeWidth="1"
          />
          <path
            d="M 390 140 C 420 120, 450 130, 460 145 C 440 160, 410 160, 390 140 Z"
            fill="rgba(239, 68, 68, 0.12)"
            stroke="rgba(239, 68, 68, 0.3)"
            strokeWidth="1"
          />

          {/* Freshwater Stream (Aquifer Vein) */}
          <path
            d="M 400 140 Q 330 180, 260 230 Q 200 260, 140 280"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="4 3"
            opacity="0.7"
          />

          {/* Sector Nodes */}
          {sectors.map((sec) => {
            const isDiscovered = gameState.discovered_locations.some(
              (loc) => loc.toLowerCase().includes(sec.id) || sec.id.includes(loc.toLowerCase())
            );
            const isCurrent = currentLocationId.includes(sec.id) || sec.id.includes(currentLocationId);
            const isSelected = selectedSector === sec.id;

            return (
              <g
                key={sec.id}
                onClick={() => onSelectSector(isSelected ? null : sec.id)}
                className="cursor-pointer transition-transform duration-200"
                style={{ transformOrigin: `${sec.cx}px ${sec.cy}px` }}
              >
                {/* Active sector pulse */}
                {isCurrent && (
                  <circle
                    cx={sec.cx}
                    cy={sec.cy}
                    r="22"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    className="animate-ping"
                    opacity="0.4"
                  />
                )}

                {/* Selection Ring */}
                {isSelected && (
                  <circle
                    cx={sec.cx}
                    cy={sec.cy}
                    r="18"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Outer Node Circle */}
                <circle
                  cx={sec.cx}
                  cy={sec.cy}
                  r="12"
                  fill={isCurrent ? '#064e3b' : isDiscovered ? '#1e293b' : '#0f172a'}
                  stroke={isCurrent ? '#10b981' : isDiscovered ? sec.color : '#475569'}
                  strokeWidth="2"
                />

                {/* Inner Center Dot */}
                <circle
                  cx={sec.cx}
                  cy={sec.cy}
                  r="4"
                  fill={isCurrent ? '#34d399' : isDiscovered ? '#f8fafc' : '#64748b'}
                />

                {/* Label Box */}
                <g transform={`translate(${sec.cx}, ${sec.cy + 22})`}>
                  <rect
                    x="-45"
                    y="-8"
                    width="90"
                    height="16"
                    rx="4"
                    fill="rgba(15, 23, 42, 0.85)"
                    stroke={isSelected ? '#38bdf8' : 'rgba(255,255,255,0.1)'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isCurrent ? '#34d399' : isDiscovered ? '#f1f5f9' : '#94a3b8'}
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight={isCurrent ? 'bold' : 'normal'}
                  >
                    {isCurrent ? `[YOU] ${sec.name.split(' ')[0]}` : sec.name.split(' ')[0]}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Selected Sector Telemetry Overlay Badge */}
        {selectedSector && (
          <div className="absolute bottom-2 left-2 right-2 p-2 rounded-lg bg-slate-900/95 border border-cyan-500/40 text-xs font-mono flex items-center justify-between gap-3 shadow-xl backdrop-blur-md">
            {(() => {
              const sec = sectors.find((s) => s.id === selectedSector);
              if (!sec) return null;
              return (
                <>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white">{sec.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300">
                        {sec.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{sec.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-400 font-bold block">{sec.primaryYield}</span>
                    <button
                      onClick={() => onSelectSector(null)}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
