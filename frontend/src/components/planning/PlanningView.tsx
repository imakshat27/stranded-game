import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  CloudLightning,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Zap,
  Droplets,
  Utensils
} from 'lucide-react';
import { StrategicPlan, ReplanningResult } from '../../types/ai';
import { GameState } from '../../types/game';
import { api } from '../../services/api';

interface PlanningViewProps {
  gameState: GameState | null;
}

export const PlanningView: React.FC<PlanningViewProps> = ({ gameState }) => {
  const [currentPlan, setCurrentPlan] = useState<StrategicPlan | null>(null);
  const [replanningData, setReplanningData] = useState<ReplanningResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);

  const fetchPlan = async () => {
    setLoading(true);
    setReplanningData(null);
    try {
      const plan = await api.ai.plan(gameState?.game_id, gameState || undefined);
      setCurrentPlan(plan);
    } catch (err) {
      console.error('Plan generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateCrisisAndReplan = async () => {
    setSimulating(true);
    try {
      const result = await api.ai.replan({
        gameId: gameState?.game_id,
        state: gameState || undefined,
        currentPlan: currentPlan || undefined,
        simulateStormDamage: true
      });
      setReplanningData(result);
      if (!result.is_plan_valid) {
        setCurrentPlan(result.new_plan);
      }
    } catch (err) {
      console.error('Replanning simulation failed:', err);
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Strategic Escape Planner & Adaptive Replanner
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Generates goal-directed multi-step action trajectories and autonomously replans when environmental crises disrupt preconditions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchPlan}
              disabled={loading || simulating}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Generate Fresh Plan</span>
            </button>

            <button
              onClick={handleSimulateCrisisAndReplan}
              disabled={loading || simulating}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-700 to-amber-700 hover:from-rose-600 hover:to-amber-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/40 transition active:scale-95"
            >
              <CloudLightning className={`w-3.5 h-3.5 ${simulating ? 'animate-bounce' : ''}`} />
              <span>Simulate Crisis & Trigger Replanner</span>
            </button>
          </div>
        </div>

        {/* Plan Header Info */}
        {currentPlan && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="glass-card rounded-xl p-3">
              <span className="text-slate-400 block text-[10px] uppercase">Strategic Objective</span>
              <span className="text-emerald-400 font-bold mt-0.5 truncate block">{currentPlan.goal}</span>
            </div>
            <div className="glass-card rounded-xl p-3">
              <span className="text-slate-400 block text-[10px] uppercase">Plan Sequence Length</span>
              <span className="text-cyan-300 font-bold mt-0.5 block">{currentPlan.total_steps} sequential steps</span>
            </div>
            <div className="glass-card rounded-xl p-3">
              <span className="text-slate-400 block text-[10px] uppercase">Est. Cumulative Cost</span>
              <span className="text-amber-400 font-bold mt-0.5 block">{currentPlan.estimated_total_cost} Energy Units</span>
            </div>
            <div className="glass-card rounded-xl p-3">
              <span className="text-slate-400 block text-[10px] uppercase">Plan Integrity Status</span>
              <span className={`font-bold mt-0.5 block ${currentPlan.status === 'ACTIVE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentPlan.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Replanning Diagnosis Banner */}
      {replanningData && !replanningData.is_plan_valid && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-200">
                CRISIS OCCURRED: Preconditions Invalidated by Tropical Storm
              </h4>
              <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">
                <strong>Failure Diagnosis:</strong> {replanningData.invalidation_reason}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs font-mono text-emerald-400">
                <span>Autonomous Replanning Active:</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span className="underline">Synthesized new recovery sequence below</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Step Timeline Cards */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center justify-between">
          <span>Sequential Action Blueprint</span>
          <span className="text-xs text-slate-400 font-normal">Order of Execution</span>
        </h3>

        <div className="space-y-3">
          {currentPlan?.steps.map((step) => (
            <div
              key={step.step_number}
              className="glass-card rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-500/40 transition"
            >
              <div className="flex items-start gap-3.5">
                <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-md">
                  {step.step_number}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{step.action_name}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-slate-800 text-slate-300">
                      {step.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{step.reason}</p>
                </div>
              </div>

              {/* Resource Cost Badges */}
              <div className="flex items-center gap-3 font-mono text-xs text-slate-400 shrink-0 self-end md:self-center">
                {step.expected_energy_cost > 0 && (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <Zap className="w-3.5 h-3.5" />
                    {step.expected_energy_cost}
                  </span>
                )}
                {step.expected_water_cost > 0 && (
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Droplets className="w-3.5 h-3.5" />
                    {step.expected_water_cost}
                  </span>
                )}
                {step.expected_food_cost > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Utensils className="w-3.5 h-3.5" />
                    {step.expected_food_cost}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
