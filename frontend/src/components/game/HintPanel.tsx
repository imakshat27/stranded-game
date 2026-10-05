import React from 'react';
import { Sparkles, Brain, PlusCircle, MinusCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { GameState, HintExplanation } from '../../types/game';

interface HintPanelProps {
  gameState: GameState;
  activeHint: HintExplanation | null;
  onRequestHint: () => void;
  loading: boolean;
  onExecuteRecommended?: (actionId: string) => void;
}

export const HintPanel: React.FC<HintPanelProps> = ({
  gameState,
  activeHint,
  onRequestHint,
  loading,
  onExecuteRecommended
}) => {
  const isCooldown = gameState.hint_cooldown > 0;
  const noHintsLeft = gameState.hints_remaining <= 0;
  const isTerminal = gameState.game_status !== 'ACTIVE';
  const canRequest = !isCooldown && !noHintsLeft && !isTerminal && !loading;

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6 relative overflow-hidden border border-emerald-500/20">
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner: Status & Action Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/30">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                AI Survival Advisor
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                A* & Knowledge Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rationed strategic intelligence • 3 initial hints • Earn bonus hints by completing vessel parts.
            </p>
          </div>
        </div>

        {/* Advisor Controls & Budget */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-300 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              <strong>{gameState.hints_remaining}</strong> remaining
            </span>
            {gameState.hint_cooldown > 0 && (
              <span className="flex items-center gap-1 text-amber-400 text-[11px] ml-1">
                <Clock className="w-3 h-3" />
                {gameState.hint_cooldown} turns cd
              </span>
            )}
          </div>

          <button
            onClick={onRequestHint}
            disabled={!canRequest}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md ${
              canRequest
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-900/40 active:scale-95 cursor-pointer'
                : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Consult Advisor'}</span>
          </button>
        </div>
      </div>

      {/* Advisor Content: Active Recommendation */}
      {activeHint ? (
        <div className="rounded-xl bg-slate-950/80 border border-emerald-500/30 p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-mono text-emerald-400">
                Recommended Course of Action
              </div>
              <h4 className="text-base font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{activeHint.recommended_action_name}</span>
              </h4>
            </div>

            {onExecuteRecommended && (
              <button
                onClick={() => onExecuteRecommended(activeHint.recommended_action_id)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition"
              >
                <span>Adopt Recommendation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {activeHint.summary}
          </p>

          {/* Rationale factors: Positive vs Negative Tradeoffs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Supporting Factors */}
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
              <div className="text-[11px] font-mono text-emerald-400 font-semibold mb-2 flex items-center gap-1.5">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supporting Rationale</span>
              </div>
              <ul className="space-y-1.5">
                {activeHint.supporting_factors.map((f, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Negative / Trade-off Factors */}
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
              <div className="text-[11px] font-mono text-amber-400 font-semibold mb-2 flex items-center gap-1.5">
                <MinusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Opportunity Costs & Risk Factors</span>
              </div>
              <ul className="space-y-1.5">
                {activeHint.negative_factors.map((f, i) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-center">
          <p className="text-xs text-slate-400">
            {isCooldown
              ? `AI Advisor is processing environmental telemetry. Cooldown active for ${gameState.hint_cooldown} turns.`
              : noHintsLeft
              ? 'All 3 free hints used. Complete vessel milestones (Hull, Rigging, Rudder, Provisions) to earn bonus hints.'
              : 'Press "Consult Advisor" above to generate an optimal A* heuristic recommendation and risk assessment.'}
          </p>
        </div>
      )}
    </div>
  );
};
