import React, { useState, useMemo } from 'react';
import {
  Compass,
  Hammer,
  Ship,
  Moon,
  LifeBuoy,
  Heart,
  Droplets,
  Utensils,
  Zap,
  Home,
  Shield,
  TreePine,
  Cable,
  Wrench,
  Anchor,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  MapPin,
  Target,
  History,
  Lock,
  Search,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Brain,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  Clock,
  X,
  Trophy,
  Skull
} from 'lucide-react';
import { GameState, Action, HintExplanation } from '../../types/game';

interface CampCommandCenterProps {
  gameState: GameState;
  validActions: Action[];
  activeHint: HintExplanation | null;
  loading: boolean;
  onSelectAction: (actionId: string) => void;
  onRequestHint: () => void;
  onRestart: () => void;
}

export const CampCommandCenter: React.FC<CampCommandCenterProps> = ({
  gameState,
  validActions,
  activeHint,
  loading,
  onSelectAction,
  onRequestHint,
  onRestart
}) => {
  // Action filtering state
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [hintDismissed, setHintDismissed] = useState<boolean>(false);

  // Weather icon helper
  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'stormy':
        return <CloudLightning className="w-4 h-4 text-rose-400" aria-hidden="true" />;
      case 'rainy':
        return <CloudRain className="w-4 h-4 text-cyan-400" aria-hidden="true" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-slate-400" aria-hidden="true" />;
      default:
        return <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />;
    }
  };

  // Vitals metadata
  const vitals = [
    {
      id: 'health',
      label: 'Health',
      val: Math.round(gameState.health),
      icon: Heart,
      color: 'text-rose-400',
      barColor: gameState.health <= 30 ? 'bg-rose-500 animate-pulse' : 'bg-rose-500'
    },
    {
      id: 'water',
      label: 'Water',
      val: Math.round(gameState.water),
      icon: Droplets,
      color: 'text-cyan-400',
      barColor: gameState.water <= 30 ? 'bg-cyan-500 animate-pulse' : 'bg-cyan-500'
    },
    {
      id: 'food',
      label: 'Food',
      val: Math.round(gameState.food),
      icon: Utensils,
      color: 'text-amber-400',
      barColor: gameState.food <= 30 ? 'bg-amber-500 animate-pulse' : 'bg-amber-500'
    },
    {
      id: 'energy',
      label: 'Energy',
      val: Math.round(gameState.energy),
      icon: Zap,
      color: 'text-yellow-400',
      barColor: gameState.energy <= 30 ? 'bg-yellow-500 animate-pulse' : 'bg-yellow-500'
    }
  ];

  // Inventory materials
  const materials = [
    { label: 'Timber', val: gameState.wood, icon: TreePine, color: 'text-amber-400' },
    { label: 'Rope', val: gameState.rope, icon: Cable, color: 'text-emerald-400' },
    { label: 'Metal', val: gameState.metal, icon: Shield, color: 'text-cyan-400' },
    { label: 'Tools', val: gameState.tools, icon: Wrench, color: 'text-indigo-400' }
  ];

  // Catamaran vessel parts
  const boatParts = [
    { id: 'hull', label: 'Hull', built: gameState.boat_parts.hull },
    { id: 'rigging', label: 'Rigging', built: gameState.boat_parts.rigging },
    { id: 'rudder', label: 'Rudder', built: gameState.boat_parts.rudder },
    { id: 'provisions', label: 'Rations', built: gameState.boat_parts.provisions }
  ];
  const partsBuilt = boatParts.filter((p) => p.built).length;

  // Categories
  const categories = [
    { id: 'ALL', label: 'All' },
    { id: 'SURVIVAL', label: 'Survival', icon: LifeBuoy },
    { id: 'EXPLORATION', label: 'Explore', icon: Compass },
    { id: 'CRAFTING', label: 'Craft', icon: Hammer },
    { id: 'ESCAPE', label: 'Escape', icon: Ship },
    { id: 'REST', label: 'Rest', icon: Moon }
  ];

  // Action prerequisite validation
  const evaluateActionPrereqs = (action: Action): { canPerform: boolean; reason?: string } => {
    if (gameState.game_status !== 'ACTIVE') {
      return { canPerform: false, reason: `Game is ${gameState.game_status}` };
    }
    if (gameState.actions_remaining <= 0) {
      return { canPerform: false, reason: 'No actions left today' };
    }
    if (action.energy_cost > 0 && gameState.energy < action.energy_cost) {
      return { canPerform: false, reason: `Needs ${action.energy_cost} Energy` };
    }
    const prereqs = action.prerequisites || {};
    if (prereqs.min_wood && gameState.wood < prereqs.min_wood) {
      return { canPerform: false, reason: `Requires ${prereqs.min_wood} Wood (${gameState.wood} avail)` };
    }
    if (prereqs.min_rope && gameState.rope < prereqs.min_rope) {
      return { canPerform: false, reason: `Requires ${prereqs.min_rope} Rope (${gameState.rope} avail)` };
    }
    if (prereqs.min_metal && gameState.metal < prereqs.min_metal) {
      return { canPerform: false, reason: `Requires ${prereqs.min_metal} Metal (${gameState.metal} avail)` };
    }
    if (prereqs.min_water && gameState.water < prereqs.min_water) {
      return { canPerform: false, reason: `Requires ${prereqs.min_water} Water reserve` };
    }
    if (prereqs.min_food && gameState.food < prereqs.min_food) {
      return { canPerform: false, reason: `Requires ${prereqs.min_food} Food reserve` };
    }
    if (prereqs.discovered_locations) {
      for (const loc of prereqs.discovered_locations) {
        if (!gameState.discovered_locations.includes(loc)) {
          return { canPerform: false, reason: `Discover ${loc.replace('_', ' ')} first` };
        }
      }
    }
    if (prereqs.boat_component_missing) {
      const comp = prereqs.boat_component_missing;
      if (gameState.boat_parts[comp as keyof typeof gameState.boat_parts]) {
        return { canPerform: false, reason: `${comp.toUpperCase()} completed` };
      }
    }
    if (prereqs.escape_ready && !Object.values(gameState.boat_parts).every(Boolean)) {
      return { canPerform: false, reason: 'Complete 4 vessel parts first' };
    }
    return { canPerform: true };
  };

  // Filter actions
  const filteredActions = useMemo(() => {
    return validActions.filter((act) => {
      if (selectedCategory !== 'ALL' && act.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = act.name.toLowerCase().includes(query);
        const matchesDesc = act.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      if (onlyAvailable) {
        const { canPerform } = evaluateActionPrereqs(act);
        if (!canPerform) return false;
      }
      return true;
    });
  }, [validActions, selectedCategory, searchQuery, onlyAvailable, gameState]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: validActions.length };
    validActions.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [validActions]);

  const latestLog = gameState.log_messages.length > 0
    ? gameState.log_messages[gameState.log_messages.length - 1]
    : { message: "You survey the windswept shoreline. Gather supplies, fortify shelter, and build an escape catamaran." };

  const isCooldown = gameState.hint_cooldown > 0;
  const noHintsLeft = gameState.hints_remaining <= 0;
  const isTerminal = gameState.game_status !== 'ACTIVE';
  const canRequestHint = !isCooldown && !noHintsLeft && !isTerminal && !loading;
  const showExpandedHint = activeHint && !hintDismissed;

  const getRiskBadge = (risk: number) => {
    if (risk <= 0.05) {
      return (
        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Safe
        </span>
      );
    }
    if (risk <= 0.15) {
      return (
        <span className="flex items-center gap-1 text-[10px] text-teal-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          {Math.round(risk * 100)}%
        </span>
      );
    }
    if (risk <= 0.25) {
      return (
        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {Math.round(risk * 100)}%
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        {Math.round(risk * 100)}% risk
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Situational HUD & AI Advisor (40% desktop)                   */}
      {/* ========================================================================= */}
      <div className="lg:col-span-5 space-y-4">
        {/* Card 1: Escape Vessel Blueprint & Progress (The Goal) */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Anchor className="w-4 h-4 text-indigo-400" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-white">
                Catamaran Escape Project
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {Math.round(gameState.escape_progress)}% Ready
            </span>
          </div>

          {/* Progress bar track */}
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-3 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${Math.round(gameState.escape_progress)}%` }}
            />
          </div>

          {/* 4 Vessel Modules */}
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {boatParts.map((part) => (
              <div
                key={part.id}
                className={`py-1.5 px-1 rounded-lg text-[10px] font-mono transition-all border ${
                  part.built
                    ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-semibold shadow-xs'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {part.built && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400 shrink-0" aria-hidden="true" />}
                  <span className="truncate">{part.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Survivor Vitals & Scavenged Supplies */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-3.5">
          {/* Biological Vitals */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="uppercase tracking-wider font-semibold text-slate-300">
                Biological Vitals
              </span>
              <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                <Home className="w-3 h-3 text-teal-400" aria-hidden="true" />
                <span>Shelter Lvl {gameState.shelter_level}/4</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {vitals.map((v) => {
                const Icon = v.icon;
                const isCritical = v.val <= 30;
                return (
                  <div
                    key={v.id}
                    className={`p-2 rounded-xl border transition-colors ${
                      isCritical
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : 'bg-slate-900/50 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Icon className={`w-3.5 h-3.5 ${v.color}`} aria-hidden="true" />
                        <span className="text-[11px] font-medium">{v.label}</span>
                      </span>
                      <span className={`font-mono font-bold text-xs ${isCritical ? 'text-rose-400' : 'text-slate-200'}`}>
                        {v.val}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${v.barColor}`}
                        style={{ width: `${v.val}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supplies */}
          <div className="pt-2 border-t border-slate-800/70">
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-slate-300 block mb-2">
              Inventory Supplies
            </span>
            <div className="grid grid-cols-4 gap-2">
              {materials.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="p-2 rounded-xl bg-slate-900/50 border border-slate-800/80 text-center">
                    <Icon className={`w-3.5 h-3.5 mx-auto mb-0.5 ${m.color}`} aria-hidden="true" />
                    <div className="text-sm font-mono font-bold text-white">{m.val}</div>
                    <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Island Narrative & Environment */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 capitalize">
                {getWeatherIcon(gameState.weather)}
                {gameState.weather}
              </span>
              <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/25">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="capitalize">{gameState.location.replace('_', ' ')}</span>
              </span>
            </div>
          </div>

          {/* Active Directive */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2 text-xs">
            <Target className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Directive</span>
              <span className="text-slate-200 font-medium text-[11px] leading-tight block mt-0.5">{gameState.current_objective}</span>
            </div>
          </div>

          {/* Island Chronicle Narrative */}
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              <History className="w-3 h-3 text-teal-400" aria-hidden="true" />
              <span>Day {gameState.day} • Turn {gameState.turn_in_day}/2 Chronicle</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {latestLog.message}
            </p>
          </div>

          {/* Expandable History */}
          {gameState.log_messages.length > 1 && (
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer hover:text-emerald-400 transition-colors select-none font-mono text-[11px] py-0.5">
                Prior Journal Entries ({gameState.log_messages.length - 1})
              </summary>
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {gameState.log_messages.slice(0, -1).reverse().map((log, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-900/40 border border-slate-800/50 text-[11px] font-mono text-slate-300">
                    <strong className="text-emerald-400">Day {log.day}:</strong> {log.message}
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Victory / Defeat Alert */}
          {gameState.game_status !== 'ACTIVE' && (
            <div
              role="alert"
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                gameState.game_status === 'WON'
                  ? 'bg-emerald-950/90 border-emerald-500/80 text-emerald-100'
                  : 'bg-rose-950/90 border-rose-500/80 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {gameState.game_status === 'WON' ? (
                  <Trophy className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
                ) : (
                  <Skull className="w-5 h-5 text-rose-400 shrink-0" aria-hidden="true" />
                )}
                <div>
                  <h4 className="font-bold text-xs">
                    {gameState.game_status === 'WON' ? 'Catamaran Launched — Escape Succeeded!' : 'Survivor Succumbed'}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">{gameState.status_reason}</p>
                </div>
              </div>
              <button
                onClick={onRestart}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium cursor-pointer"
              >
                Restart
              </button>
            </div>
          )}
        </div>

        {/* Card 4: Integrated AI Survival Advisor Co-Pilot */}
        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/25 bg-slate-900/60">
          {!showExpandedHint ? (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                  <Brain className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
                <div>
                  <span className="font-semibold text-slate-200 block text-xs">AI Survival Advisor</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {isCooldown ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                        Cooldown ({gameState.hint_cooldown} turns left)
                      </span>
                    ) : (
                      `${gameState.hints_remaining} hints remaining`
                    )}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeHint && hintDismissed && (
                  <button
                    onClick={() => setHintDismissed(false)}
                    className="text-[11px] text-slate-400 hover:text-emerald-300 font-mono cursor-pointer"
                  >
                    View Hint
                  </button>
                )}
                <button
                  onClick={() => {
                    setHintDismissed(false);
                    onRequestHint();
                  }}
                  disabled={!canRequestHint}
                  className={`px-3 py-1.5 rounded-lg font-medium text-xs transition cursor-pointer flex items-center gap-1.5 ${
                    canRequestHint
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Sparkles className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span>{loading ? 'Evaluating...' : 'Ask Advisor'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <div>
                    <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold tracking-wider">
                      Advisor Pick (A* Search)
                    </span>
                    <h3 className="text-xs font-bold text-white">{activeHint.recommended_action_name}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectAction(activeHint.recommended_action_id)}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Execute</span>
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setHintDismissed(true)}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                    title="Minimize hint"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 mb-2 leading-relaxed font-sans">{activeHint.summary}</p>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-emerald-400 font-bold block mb-1 flex items-center gap-1">
                    <PlusCircle className="w-2.5 h-2.5" aria-hidden="true" />
                    Pro Factors
                  </span>
                  <ul className="space-y-0.5 text-slate-300">
                    {activeHint.supporting_factors.map((f, i) => (
                      <li key={i} className="truncate">• {f}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1 flex items-center gap-1">
                    <MinusCircle className="w-2.5 h-2.5" aria-hidden="true" />
                    Risks
                  </span>
                  <ul className="space-y-0.5 text-slate-400">
                    {activeHint.negative_factors.map((f, i) => (
                      <li key={i} className="truncate">• {f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Action Command Deck (60% desktop)                           */}
      {/* ========================================================================= */}
      <div className="lg:col-span-7 glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/80">
        {/* Header: Title & Action Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Action Command Deck</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({filteredActions.length} available)
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select directives to advance island survival. Every action expends vital stamina and alters conditions.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <strong className={gameState.actions_remaining > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {gameState.actions_remaining}
              </strong>{' '}
              / 2 actions left
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
            {categories.map((c) => {
              const count = categoryCounts[c.id] || 0;
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                    isSelected
                      ? 'bg-slate-800 text-emerald-300 border-emerald-500/40 font-semibold shadow-xs'
                      : 'bg-slate-900/50 text-slate-400 border-slate-800/80 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search and Ready-Only toggle */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search action..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2 py-1 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 w-32 sm:w-36 font-sans"
              />
            </div>

            <button
              onClick={() => setOnlyAvailable(!onlyAvailable)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer border ${
                onlyAvailable
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Show only actions that have satisfied preconditions"
            >
              <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
              <span>Ready</span>
            </button>
          </div>
        </div>

        {/* Action Grid */}
        {filteredActions.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800/60 text-slate-400 text-xs">
            No actions match the active filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredActions.map((action) => {
              const { canPerform, reason } = evaluateActionPrereqs(action);
              const isRecommended = action.id === activeHint?.recommended_action_id;

              return (
                <div
                  key={action.id}
                  className={`rounded-xl p-3.5 flex flex-col justify-between transition-all duration-150 border ${
                    isRecommended
                      ? 'bg-emerald-950/20 border-emerald-500/50 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                      : canPerform
                      ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div>
                    {/* Top: Name, Pick badge, Risk */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={`text-xs font-semibold ${canPerform ? 'text-white' : 'text-slate-400'}`}>
                          {action.name}
                        </h3>
                        {isRecommended && (
                          <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-400" aria-hidden="true" />
                            Advisor Pick
                          </span>
                        )}
                      </div>
                      <div className="shrink-0">{getRiskBadge(action.risk)}</div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                      {action.description}
                    </p>
                  </div>

                  {/* Resource deltas & Action Trigger */}
                  <div className="pt-2 border-t border-slate-800/60">
                    <div className="flex items-center justify-between gap-2 mb-2 text-[10px] font-mono">
                      <div className="flex items-center gap-2 text-slate-400">
                        {action.energy_cost !== 0 && (
                          <span className="flex items-center gap-0.5 text-yellow-400">
                            <Zap className="w-3 h-3" aria-hidden="true" />
                            {action.energy_cost > 0 ? `-${action.energy_cost}` : `+${Math.abs(action.energy_cost)}`}
                          </span>
                        )}
                        {action.water_cost > 0 && (
                          <span className="flex items-center gap-0.5 text-cyan-400">
                            <Droplets className="w-3 h-3" aria-hidden="true" />
                            -{action.water_cost}
                          </span>
                        )}
                        {action.food_cost > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-400">
                            <Utensils className="w-3 h-3" aria-hidden="true" />
                            -{action.food_cost}
                          </span>
                        )}
                        {action.escape_progress > 0 && (
                          <span className="text-emerald-400 font-semibold">
                            +{Math.round(action.escape_progress)}%
                          </span>
                        )}
                      </div>

                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {action.category}
                      </span>
                    </div>

                    {canPerform ? (
                      <button
                        onClick={() => onSelectAction(action.id)}
                        disabled={loading}
                        className={`w-full py-1.5 px-3 rounded-lg font-medium text-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 ${
                          isRecommended
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60'
                        }`}
                      >
                        <span>Execute Action</span>
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </button>
                    ) : (
                      <div className="w-full py-1 px-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] text-slate-500 flex items-center justify-center gap-1.5 font-mono">
                        <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
