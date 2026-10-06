import React, { useState } from 'react';
import { Activity, BookOpen } from 'lucide-react';
import { GameState } from '../../types/game';
import { AnalyticsView } from './AnalyticsView';
import { HelpView } from '../help/HelpView';

interface IntelligenceHubProps {
  gameState: GameState | null;
  initialSubTab?: string;
}

export const IntelligenceHub: React.FC<IntelligenceHubProps> = ({ gameState, initialSubTab = 'telemetry' }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubTab);

  return (
    <div className="space-y-5">
      {/* Sub-Navigation Header */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400">
                Simulation Telemetry & Documentation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Review real-time behavioral telemetry, difficulty profiles, or read the AI academic course manual.
            </p>
          </div>

          <nav aria-label="Intelligence Navigation" className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveSubTab('telemetry')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSubTab === 'telemetry'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Telemetry & Profiling</span>
            </button>

            <button
              onClick={() => setActiveSubTab('guide')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                activeSubTab === 'guide'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Course Manual & Spec</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Active Sub-View Content */}
      <div>
        {activeSubTab === 'telemetry' ? (
          <AnalyticsView gameState={gameState} />
        ) : (
          <HelpView />
        )}
      </div>
    </div>
  );
};
