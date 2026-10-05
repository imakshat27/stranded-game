import React from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, MapPin, Target, History, AlertTriangle } from 'lucide-react';
import { GameState } from '../../types/game';

interface SituationCardProps {
  state: GameState;
}

export const SituationCard: React.FC<SituationCardProps> = ({ state }) => {
  const getWeatherIcon = (weather: string) => {
    switch (weather) {
      case 'sunny':
      case 'clear':
        return <Sun className="w-5 h-5 text-amber-400" />;
      case 'cloudy':
        return <Cloud className="w-5 h-5 text-slate-300" />;
      case 'rainy':
        return <CloudRain className="w-5 h-5 text-cyan-400" />;
      case 'stormy':
        return <CloudLightning className="w-5 h-5 text-rose-400 animate-bounce" />;
      default:
        return <Sun className="w-5 h-5 text-amber-400" />;
    }
  };

  const latestLog = state.log_messages.length > 0
    ? state.log_messages[state.log_messages.length - 1]
    : { message: "You survey the shoreline. You must scavenge supplies and construct an escape catamaran." };

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6 relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
            {getWeatherIcon(state.weather)}
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-mono">Current Conditions</div>
            <div className="text-sm font-semibold text-white capitalize flex items-center gap-2">
              <span>{state.weather} Weather</span>
              <span className="text-xs text-slate-400 font-mono font-normal">• Island Sector:</span>
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono">
                <MapPin className="w-3.5 h-3.5" />
                {state.location.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Current Objective */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/25 max-w-md">
          <Target className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-200 truncate">
            {state.current_objective}
          </span>
        </div>
      </div>

      {/* Narrative Situation */}
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider font-mono text-slate-400 mb-1 flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-teal-400" />
          <span>Island Chronicle • Day {state.day}</span>
        </div>
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm text-slate-200 leading-relaxed font-sans shadow-inner">
          <p className="whitespace-pre-line">{latestLog.message}</p>
        </div>
      </div>

      {/* Recent Log History toggle/preview */}
      {state.log_messages.length > 1 && (
        <details className="text-xs text-slate-400 group">
          <summary className="cursor-pointer hover:text-emerald-400 transition-colors select-none font-mono py-1">
            ▸ View Prior Turn Logs ({state.log_messages.length - 1} entries)
          </summary>
          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {state.log_messages.slice(0, -1).reverse().map((log, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-900/40 border border-slate-800/50 text-slate-300 text-[11px] font-mono">
                <strong className="text-emerald-400">Day {log.day}:</strong> {log.message}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Terminal Game Status Banner */}
      {state.game_status !== 'ACTIVE' && (
        <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${
          state.game_status === 'WON'
            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
            : 'bg-rose-950/80 border-rose-500 text-rose-200'
        }`}>
          <AlertTriangle className={`w-6 h-6 ${state.game_status === 'WON' ? 'text-emerald-400' : 'text-rose-400'}`} />
          <div>
            <h4 className="font-bold text-sm tracking-wide">
              {state.game_status === 'WON' ? 'VICTORY ACHIEVED!' : 'SURVIVAL FAILED'}
            </h4>
            <p className="text-xs mt-0.5">{state.status_reason}</p>
          </div>
        </div>
      )}
    </div>
  );
};
