import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, CheckCircle2, RotateCcw, Activity, Droplets } from 'lucide-react';
import { BayesianResult } from '../../types/ai';
import { GameState } from '../../types/game';
import { api } from '../../services/api';

interface ProbabilityViewProps {
  gameState: GameState | null;
}

export const ProbabilityView: React.FC<ProbabilityViewProps> = ({ gameState }) => {
  const [scenario, setScenario] = useState<'storm' | 'salvage'>('storm');
  const [observedSignals, setObservedSignals] = useState<string[]>(['barometer_drop']);
  const [bayesResult, setBayesResult] = useState<BayesianResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const availableSignals = scenario === 'storm' ? [
    { id: 'barometer_drop', name: 'Sharp Barometer Pressure Drop', desc: 'Sudden fall of 15 hPa recorded by mercury tube.' },
    { id: 'cumulonimbus_buildup', name: 'Towering Cumulonimbus Anvil', desc: 'Dark storm clouds rising 30,000 ft in the offshore sky.' },
    { id: 'swell_intensity', name: 'Outer Barrier Breaker Swell', desc: 'Turbulent ocean sets pounding the reef before winds arrive.' }
  ] : [
    { id: 'low_tide_window', name: 'Spring Low Tide Window', desc: 'Tidal retreat uncovers submerged coral shelves and hull seams.' },
    { id: 'iron_tools_equipped', name: 'Improvised Prying Tools Equipped', desc: 'Leverage available to breach rusted cargo bolts.' },
    { id: 'wreck_debris_flotsam', name: 'Fresh Cargo Flotsam on Beach', desc: 'Sealed waterproof casks recently washed ashore.' }
  ];

  const calculateBayes = async () => {
    setLoading(true);
    try {
      const data = await api.ai.probability({
        gameId: gameState?.game_id,
        state: gameState || undefined,
        scenario: scenario,
        observedSignals: observedSignals
      });
      setBayesResult(data);
    } catch (err) {
      console.error('Bayesian calculation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateBayes();
  }, [scenario, observedSignals]);

  const toggleSignal = (signalId: string) => {
    setObservedSignals((prev) =>
      prev.includes(signalId) ? prev.filter((s) => s !== signalId) : [...prev, signalId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Bayesian Probabilistic Belief Updater
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quantifies environmental risk and discovery likelihoods via rigorous Bayes' Theorem: P(H | E) = [P(E|H) × P(H)] / P(E).
            </p>
          </div>

          {/* Scenario Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setScenario('storm'); setObservedSignals(['barometer_drop']); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                scenario === 'storm'
                  ? 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Severe Storm Threat
            </button>
            <button
              onClick={() => { setScenario('salvage'); setObservedSignals(['low_tide_window']); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
                scenario === 'salvage'
                  ? 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Shipwreck Salvage
            </button>
          </div>
        </div>

        {/* Observable Evidence Toggle Panel */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-mono text-slate-400 mb-2">
            Toggle Observable Evidence Signals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableSignals.map((sig) => {
              const isChecked = observedSignals.includes(sig.id);
              return (
                <div
                  key={sig.id}
                  onClick={() => toggleSignal(sig.id)}
                  className={`glass-card rounded-xl p-3 cursor-pointer transition select-none flex items-start gap-2.5 ${
                    isChecked
                      ? 'border-emerald-500/50 bg-emerald-950/20'
                      : 'border-slate-800/80 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center ${
                    isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                  }`}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{sig.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">{sig.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Posterior Probability Result Meter */}
      {bayesResult && (
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
            <div>
              <div className="text-[11px] uppercase tracking-wider font-mono text-emerald-400">
                Calculated Bayesian Belief
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {bayesResult.hypothesis_name}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-2xl font-mono font-extrabold text-emerald-400">
                {bayesResult.percentage}%
              </span>
              <span className="text-xs text-slate-400 block font-mono">
                Posterior P(H | E)
              </span>
            </div>
          </div>

          {/* Progress bar comparison */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-mono text-slate-400 mb-1.5">
              <span>Prior Belief: {(bayesResult.initial_prior * 100).toFixed(1)}%</span>
              <span>Updated Posterior: {bayesResult.percentage}%</span>
            </div>
            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800 relative">
              {/* Prior marker */}
              <div
                className="absolute top-0 bottom-0 bg-slate-700/80 w-1 z-10"
                style={{ left: `${bayesResult.initial_prior * 100}%` }}
                title="Initial Prior"
              />
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${bayesResult.percentage}%` }}
              />
            </div>
          </div>

          {/* Step-by-Step Bayesian Update Math */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
              Sequential Bayesian Derivation Chain
            </h4>
            <div className="space-y-2">
              {bayesResult.update_steps.map((step, idx) => (
                <div key={idx} className="glass-card rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <strong className="text-white">{step.evidence_name}</strong>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-300">
                    <span>P(H) = {step.prior_before}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-teal-300">P(E|H) = {step.likelihood_h}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-amber-300">P(E|~H) = {step.likelihood_not_h}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">New P(H|E) = {step.posterior_after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
