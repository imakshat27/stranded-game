import React, { useState } from 'react';
import {
  Compass,
  MapPin,
  Eye,
  Shield,
  Layers,
  Sparkles,
  Lock,
  Anchor,
  Flame,
  Droplets,
  Trees,
  Mountain,
  Navigation
} from 'lucide-react';
import { GameState } from '../../types/game';

interface RealisticTreasureMapProps {
  gameState: GameState;
  selectedSector: string | null;
  onSelectSector: (sectorId: string | null) => void;
  onPerformAction?: (actionId: string) => void;
}

interface SectorWaypoint {
  id: string;
  name: string;
  coordinates: { x: number; y: number };
  category: 'CAMP' | 'WATER' | 'JUNGLE' | 'MOUNTAIN' | 'REEF' | 'ESCAPE';
  hazard: 'Low' | 'Moderate' | 'Perilous';
  description: string;
  resources: string;
  icon: any;
}

export const RealisticTreasureMap: React.FC<RealisticTreasureMapProps> = ({
  gameState,
  selectedSector,
  onSelectSector,
  onPerformAction
}) => {
  const [zoomLevel, setZoomLevel] = useState<'normal' | 'detailed'>('normal');

  const waypoints: SectorWaypoint[] = [
    {
      id: 'base_camp',
      name: 'Shipwreck Cove & Camp',
      coordinates: { x: 170, y: 340 },
      category: 'CAMP',
      hazard: 'Low',
      description: 'The white sand beach where your brigantine shattered. Home to your thatch shelter, signal hearth, and catamaran construction slipway.',
      resources: 'Driftwood • Flotsam • Shelter',
      icon: Anchor
    },
    {
      id: 'freshwater_stream',
      name: 'Widow’s Cascading Springs',
      coordinates: { x: 290, y: 260 },
      category: 'WATER',
      hazard: 'Low',
      description: 'Crystalline freshwater gushing from mossy volcanic basalt pools into a pristine mountain brook. The lifeblood of your survival.',
      resources: 'Potable Water • Clay Mud',
      icon: Droplets
    },
    {
      id: 'jungle',
      name: 'Serpent’s Mangrove & Jungle',
      coordinates: { x: 230, y: 190 },
      category: 'JUNGLE',
      hazard: 'Moderate',
      description: 'Impenetrable stands of ironwood, giant ferns, and coconut palms. Rich with vines for cordage and wild boar, but rife with viper hollows.',
      resources: 'Heavy Timber • Coir Vine • Wild Game',
      icon: Trees
    },
    {
      id: 'ridge',
      name: 'Mount Cinder & Obsidian Ridge',
      coordinates: { x: 380, y: 150 },
      category: 'MOUNTAIN',
      hazard: 'Perilous',
      description: 'A jagged volcanic crater summit towering over the entire archipelago. Harsh sulfur winds, sharp obsidian, but commands an infinite horizon vantage.',
      resources: 'Flint • Vantage Point • Signals',
      icon: Mountain
    },
    {
      id: 'barrier_reef',
      name: 'Dead Man’s Barrier Reef',
      coordinates: { x: 420, y: 320 },
      category: 'REEF',
      hazard: 'Moderate',
      description: 'Labyrinth of sharp coral shallows exposed at low tide. Teeming with parrotfish and reef mullet, but patrolled by tiger sharks in the deep channels.',
      resources: 'Reef Mullet • Coral Lime • Shells',
      icon: Navigation
    },
    {
      id: 'sunken_galleon',
      name: 'Sunken Galleon Shoals',
      coordinates: { x: 100, y: 210 },
      category: 'REEF',
      hazard: 'Perilous',
      description: 'The rotting keel of an 18th-century Spanish vessel wedged in coral rocks. Salvageable iron fittings, brass nails, and rusted cannons.',
      resources: 'Scrap Metal • Iron Bolts • Relics',
      icon: Sparkles
    },
    {
      id: 'escape_straits',
      name: 'The Great Pacific Passage',
      coordinates: { x: 490, y: 240 },
      category: 'ESCAPE',
      hazard: 'Moderate',
      description: 'The single navigable gap through the outer breaker reef into open trade wind currents. The departure gateway for your completed catamaran.',
      resources: 'Open Sea Channel • Rescue Corridor',
      icon: Compass
    }
  ];

  const currentSector = waypoints.find((w) => w.id === (selectedSector || gameState.location)) || waypoints[0];
  const isDiscovered = (id: string) => gameState.discovered_locations?.includes(id) || id === 'base_camp' || id === 'freshwater_stream';

  return (
    <div className="parchment-panel rounded-2xl p-5 lg:p-6 border-2 border-[#c29b38]/40 shadow-2xl relative overflow-hidden space-y-4">
      {/* Top Cartographic Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#c29b38]/30">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#2f2214] border border-[#c29b38]/50 flex items-center justify-center text-[#e6c35c] shrink-0">
            <Compass className="w-4 h-4 text-[#e6c35c] animate-compass" />
          </div>
          <div className="min-w-0">
            <h3 className="font-title text-sm sm:text-base text-[#fae5a5] font-bold tracking-wider leading-snug">
              Chart of Isla de la Muerte
            </h3>
            <span className="text-[11px] text-[#b8a287] font-serif italic block truncate">
              Surveyed in Uncharted Longitude • 18th-Century Admiralty Projection
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-serif text-[#dcd0bf]">
          <span className="px-2.5 py-1 rounded-md bg-[#221a12] border border-[#c29b38]/30 text-[#e5b85c] font-title">
            Sector: {currentSector.name}
          </span>
        </div>
      </div>

      {/* Main Authentic SVG Cartographic Chart */}
      <div className="relative rounded-xl overflow-hidden bg-[#18130d] border-2 border-[#c29b38]/35 shadow-inner">
        <svg
          viewBox="0 0 600 420"
          className="w-full h-auto select-none"
          style={{ maxHeight: '420px', background: 'radial-gradient(circle at 50% 50%, #201912 0%, #130f0a 100%)' }}
        >
          <defs>
            {/* Parchment Paper Filter */}
            <filter id="carto-texture" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
              <feColorMatrix type="matrix" values="0.3 0 0 0 0.1  0 0.25 0 0 0.08  0 0 0.2 0 0.05  0 0 0 0.15 0" />
            </filter>

            {/* Ocean Depth Gradient */}
            <radialGradient id="ocean-depth" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1b2326" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0c1216" stopOpacity="0.8" />
            </radialGradient>

            {/* Island Landmass Fill */}
            <linearGradient id="island-soil" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2c2217" />
              <stop offset="50%" stopColor="#241c13" />
              <stop offset="100%" stopColor="#1a140d" />
            </linearGradient>

            {/* Mountain Gradient */}
            <radialGradient id="volcano-glow" cx="65%" cy="35%" r="35%">
              <stop offset="0%" stopColor="#4d2218" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#2c1a14" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ocean Waves & Rhumb Navigation Lines */}
          <g stroke="#9e7b3a" strokeWidth="0.5" strokeOpacity="0.18">
            <line x1="0" y1="210" x2="600" y2="210" />
            <line x1="300" y1="0" x2="300" y2="420" />
            <line x1="0" y1="0" x2="600" y2="420" />
            <line x1="0" y1="420" x2="600" y2="0" />
            <circle cx="300" cy="210" r="140" fill="none" strokeDasharray="4 6" />
            <circle cx="300" cy="210" r="220" fill="none" strokeDasharray="3 8" />
          </g>

          {/* Bathymetric Depth Contours around Island */}
          <path
            d="M 60,190 C 80,100 220,60 360,70 C 470,80 540,160 520,280 C 500,380 340,410 180,390 C 90,370 40,290 60,190 Z"
            fill="none"
            stroke="#2f4a54"
            strokeWidth="1.2"
            strokeOpacity="0.35"
            strokeDasharray="4 4"
          />
          <path
            d="M 80,200 C 100,120 230,85 350,95 C 450,105 510,180 490,270 C 470,360 330,380 190,370 C 110,350 70,280 80,200 Z"
            fill="none"
            stroke="#2f4a54"
            strokeWidth="1.5"
            strokeOpacity="0.5"
          />

          {/* Island Coastline & Main Landmass */}
          <path
            d="M 120,210 Q 140,140 240,110 T 380,110 Q 460,150 450,230 T 430,310 Q 370,360 270,350 T 140,320 Q 110,270 120,210 Z"
            fill="url(#island-soil)"
            stroke="#c29b38"
            strokeWidth="2.2"
            filter="drop-shadow(0 6px 12px rgba(0,0,0,0.8))"
          />

          {/* Topographic Contour Ring 1 (Interior Hills) */}
          <path
            d="M 170,220 Q 190,160 260,140 T 360,140 Q 410,180 390,250 T 350,300 Q 280,320 220,300 T 170,220 Z"
            fill="#2c2116"
            stroke="#9e7b3a"
            strokeWidth="0.8"
            strokeOpacity="0.5"
          />

          {/* Topographic Contour Ring 2 (Volcanic Caldera Elevation) */}
          <path
            d="M 280,190 Q 330,140 390,150 Q 410,190 380,230 Q 330,240 280,190 Z"
            fill="url(#volcano-glow)"
            stroke="#b85d38"
            strokeWidth="1"
            strokeOpacity="0.7"
          />

          {/* Mountain Peak Hatching: Mount Cinder */}
          <g stroke="#d97706" strokeWidth="1" strokeOpacity="0.6">
            <path d="M 370,160 L 380,135 L 390,160 Z" fill="#3d1e15" />
            <path d="M 350,175 L 365,150 L 380,175 Z" fill="#351a13" />
            <path d="M 385,170 L 400,145 L 415,170 Z" fill="#351a13" />
            {/* Smoke Plume */}
            <path d="M 380,132 Q 385,115 378,105 Q 384,95 380,85" fill="none" stroke="#e08b26" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" />
          </g>

          {/* Tropical Jungle Palm Trees (Engraved SVG sketches) */}
          <g fill="#2d472c" stroke="#1f331e" strokeWidth="0.5" opacity="0.85">
            {/* Grove 1 */}
            <circle cx="215" cy="185" r="9" />
            <circle cx="230" cy="180" r="12" />
            <circle cx="245" cy="190" r="10" />
            <circle cx="225" cy="200" r="11" />
            {/* Grove 2 */}
            <circle cx="260" cy="210" r="11" />
            <circle cx="275" cy="225" r="13" />
            <circle cx="290" cy="215" r="10" />
          </g>

          {/* Freshwater Stream flowing to Beach */}
          <path
            d="M 360,195 Q 310,230 280,260 T 210,310 Q 180,325 150,335"
            fill="none"
            stroke="#3b82a6"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
            filter="drop-shadow(0 0 3px rgba(59,130,166,0.4))"
          />

          {/* Coral Barrier Reefs (Stippled coral flats) */}
          <g stroke="#9e7b3a" strokeWidth="1" strokeDasharray="1 3" fill="none" opacity="0.55">
            <ellipse cx="430" cy="330" rx="35" ry="18" />
            <ellipse cx="455" cy="310" rx="28" ry="15" />
            <ellipse cx="100" cy="210" rx="25" ry="14" />
          </g>

          {/* Sunken Galleon Silhouette */}
          <g transform="translate(95, 205) rotate(-25) scale(0.65)" stroke="#c29b38" fill="#2b1a10">
            <path d="M 0,15 Q 15,22 30,15 L 25,5 Q 15,8 5,5 Z" />
            <line x1="8" y1="5" x2="8" y2="-12" strokeWidth="1.2" />
            <line x1="18" y1="5" x2="18" y2="-16" strokeWidth="1.2" />
            <line x1="3" y1="-5" x2="13" y2="-5" strokeWidth="0.8" />
          </g>

          {/* Realistic 16-Point Brass Nautical Compass Rose */}
          <g transform="translate(510, 80) scale(0.85)">
            <circle cx="0" cy="0" r="38" fill="#1b150e" stroke="#c29b38" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="34" fill="none" stroke="#7a5f2e" strokeWidth="0.8" strokeDasharray="2 3" />
            {/* North Point with Fleur-de-lis */}
            <polygon points="0,-33 6,-10 0,0" fill="#e5b85c" />
            <polygon points="0,-33 -6,-10 0,0" fill="#8c6a28" />
            {/* South Point */}
            <polygon points="0,33 5,10 0,0" fill="#a87f30" />
            <polygon points="0,33 -5,10 0,0" fill="#664a18" />
            {/* East Point */}
            <polygon points="33,0 10,5 0,0" fill="#c29b38" />
            <polygon points="33,0 10,-5 0,0" fill="#7a5f2e" />
            {/* West Point */}
            <polygon points="-33,0 -10,5 0,0" fill="#c29b38" />
            <polygon points="-33,0 -10,-5 0,0" fill="#7a5f2e" />
            {/* Center Pivot */}
            <circle cx="0" cy="0" r="3.5" fill="#f5eedb" stroke="#33230c" strokeWidth="1" />
            <text x="0" y="-36" textAnchor="middle" fill="#fae5a5" fontSize="9" fontFamily="Cinzel" fontWeight="bold">N</text>
            <text x="38" y="3" textAnchor="middle" fill="#c29b38" fontSize="8" fontFamily="Cinzel">E</text>
            <text x="0" y="42" textAnchor="middle" fill="#c29b38" fontSize="8" fontFamily="Cinzel">S</text>
            <text x="-38" y="3" textAnchor="middle" fill="#c29b38" fontSize="8" fontFamily="Cinzel">W</text>
          </g>

          {/* Hand-Lettered Cartographic Calligraphy Labels */}
          <text x="145" y="365" fill="#e6c35c" fontSize="10" fontFamily="Cinzel" fontWeight="600" opacity="0.9">
            Shipwreck Cove
          </text>
          <text x="280" y="278" fill="#7dd3fc" fontSize="9" fontFamily="Cinzel" fontStyle="italic" opacity="0.85">
            Widow's Springs
          </text>
          <text x="210" y="165" fill="#86efac" fontSize="9" fontFamily="Cinzel" opacity="0.85">
            Serpent's Jungle
          </text>
          <text x="350" y="125" fill="#fdba74" fontSize="9" fontFamily="Cinzel" fontWeight="600" opacity="0.85">
            Mount Cinder
          </text>
          <text x="410" y="355" fill="#fde047" fontSize="8.5" fontFamily="Cinzel" opacity="0.75">
            Barrier Reef
          </text>
          <text x="65" y="195" fill="#e5b85c" fontSize="8.5" fontFamily="Cinzel" opacity="0.75">
            Sunken Galleon
          </text>

          {/* Dotted Expedition Trail linking visited sectors */}
          <path
            d="M 170,340 Q 230,300 290,260 T 230,190"
            fill="none"
            stroke="#e5b85c"
            strokeWidth="1.8"
            strokeDasharray="4 4"
            opacity="0.6"
          />

          {/* Interactive Waypoint Pins */}
          {waypoints.map((wp) => {
            const isSelected = selectedSector === wp.id;
            const isPlayerHere = gameState.location === wp.id || (wp.id === 'base_camp' && gameState.location === 'base_camp');
            const discovered = isDiscovered(wp.id);

            return (
              <g
                key={wp.id}
                transform={`translate(${wp.coordinates.x}, ${wp.coordinates.y})`}
                onClick={() => onSelectSector(wp.id)}
                className="cursor-pointer group"
              >
                {/* Selection Rings */}
                {isSelected && (
                  <circle
                    cx="0"
                    cy="0"
                    r="19"
                    fill="none"
                    stroke="#e5b85c"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin"
                    style={{ animationDuration: '10s' }}
                  />
                )}

                {/* Player Lantern Glow if at this position */}
                {isPlayerHere && (
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill="#e08b26"
                    fillOpacity="0.4"
                    className="animate-ping"
                    style={{ animationDuration: '3s' }}
                  />
                )}

                {/* Base Pin Circle */}
                <circle
                  cx="0"
                  cy="0"
                  r="11"
                  fill={isPlayerHere ? '#d4af37' : isSelected ? '#3d2b1a' : '#1c150e'}
                  stroke={isPlayerHere ? '#fff' : isSelected ? '#fae5a5' : '#c29b38'}
                  strokeWidth={isPlayerHere ? '2' : '1.5'}
                  filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))"
                />

                {/* Center Indicator */}
                {isPlayerHere ? (
                  <circle cx="0" cy="0" r="4.5" fill="#24160a" />
                ) : !discovered ? (
                  <circle cx="0" cy="0" r="3" fill="#8c765c" opacity="0.6" />
                ) : (
                  <circle cx="0" cy="0" r="3.5" fill="#e5b85c" />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Cartouche / Legend Box */}
        <div className="absolute bottom-2 left-2 p-2 rounded-lg bg-[#140f09]/90 border border-[#c29b38]/35 text-[10px] font-serif text-[#dcd0bf] hidden sm:flex items-center gap-3 backdrop-blur-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4af37] border border-white" />
            <span>Survivor Camp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#e5b85c]" />
            <span>Known Waypoint</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0 border-t-2 border-dashed border-[#e5b85c]" />
            <span>Trek Trail</span>
          </div>
        </div>
      </div>

      {/* Selected Sector Briefing Parchment Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#241a11] to-[#18110b] border border-[#c29b38]/40 shadow-lg space-y-2.5">
        <div className="flex items-center justify-between border-b border-[#c29b38]/20 pb-2">
          <div className="flex items-center gap-2">
            {React.createElement(currentSector.icon, { className: 'w-4 h-4 text-[#e5b85c]' })}
            <h4 className="font-title text-sm lg:text-base text-[#fae5a5] font-bold">
              {currentSector.name}
            </h4>
            <span className="text-[10px] font-serif px-2 py-0.5 rounded bg-[#332314] text-[#d4af37] border border-[#c29b38]/30">
              {currentSector.category}
            </span>
          </div>
          <span
            className={`text-[10px] font-title px-2 py-0.5 rounded border ${
              currentSector.hazard === 'Low'
                ? 'bg-[#1e2f1f] border-[#3d7a55] text-[#bbf7d0]'
                : currentSector.hazard === 'Moderate'
                ? 'bg-[#3b2b14] border-[#a16207] text-[#fef08a]'
                : 'bg-[#3d1814] border-[#8a3328] text-[#fecaca]'
            }`}
          >
            {currentSector.hazard.toUpperCase()} HAZARD
          </span>
        </div>

        <p className="text-xs text-[#eeddc5] font-serif leading-relaxed">
          {currentSector.description}
        </p>

        <div className="flex items-center justify-between text-xs font-serif text-[#b8a287] pt-1">
          <span>
            Yields: <strong className="text-[#fae5a5] font-medium">{currentSector.resources}</strong>
          </span>
          {gameState.location === currentSector.id && (
            <span className="text-[#e5b85c] font-title font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Survivor Is Currently Here
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
