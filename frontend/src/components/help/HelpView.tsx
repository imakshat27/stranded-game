import React from 'react';
import { HelpCircle, Cpu, GitBranch, ShieldAlert, Swords, BookOpen, Compass, CheckCircle } from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview Banner */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2.5 mb-2">
          <Compass className="w-6 h-6 text-emerald-400" />
          <h2 className="text-xl font-bold text-white tracking-wide">
            STRANDED: Architecture & AI Course Manual
          </h2>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          STRANDED is an adaptive AI survival strategy simulation built as an academic AI course project.
          Every feature represents a real mathematical or algorithmic implementation running authoritatively on the FastAPI backend.
        </p>
      </div>

      {/* Core AI Systems Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* State Space Search */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-emerald-400">
            <Cpu className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">1. State Space Search Engine</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            All search algorithms operate over a unified <code className="text-emerald-300">SearchProblem</code> abstraction without hard-coded state trees:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
            <li>• <strong>A* Search:</strong> Uses admissible heuristic <code className="text-emerald-400">f(n) = g(n) + h(n)</code> to guarantee cost-optimal escape.</li>
            <li>• <strong>Uniform Cost (UCS):</strong> Expands nodes in order of cumulative survival cost g(n).</li>
            <li>• <strong>BFS & DFS:</strong> Compare level-by-level shortest depth against deep branch exploration.</li>
            <li>• <strong>IDS:</strong> Iterative deepening combining DFS space economy with BFS optimality.</li>
            <li>• <strong>Hill Climbing:</strong> Steepest-ascent local search following utility gradients.</li>
          </ul>
        </div>

        {/* Knowledge & Propositional Logic */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-teal-400">
            <BookOpen className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">2. Knowledge & Inference Engine</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Pure logical reasoning operating on extracted propositional facts from the logical game state:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
            <li>• <strong>Forward Chaining:</strong> Fires IF-THEN rules iteratively to derive implicit perils (e.g. storm + low shelter → high exposure damage).</li>
            <li>• <strong>Backward Chaining:</strong> Starts at <code className="text-teal-300">GOAL: Escape</code> and decomposes requirements into component and material subgoals.</li>
          </ul>
        </div>

        {/* Bayesian Probability */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-cyan-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">3. Bayesian Belief Updating</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Handles environmental uncertainty via Bayes' Rule:
          </p>
          <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-cyan-300 mb-2 text-center">
            P(H | E) = [P(E | H) × P(H)] / P(E)
          </div>
          <p className="text-xs text-slate-400">
            Updates storm and salvage probabilities sequentially as atmospheric evidence (barometer drops, cloud builds) is observed.
          </p>
        </div>

        {/* Planning & Replanning */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3 text-amber-400">
            <GitBranch className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">4. Strategic Replanning</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Synthesizes multi-step construction paths toward vessel launch. When unexpected events (e.g. tropical storm) invalidate preconditions:
          </p>
          <div className="p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center justify-between">
            <span>OLD PLAN</span>
            <span>→</span>
            <span className="text-rose-400 font-bold">INVALIDATED</span>
            <span>→</span>
            <span className="text-emerald-400 font-bold">NEW PLAN</span>
          </div>
        </div>
      </div>

      {/* AI Survival Advisor Rules */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-3">
          AI Survival Advisor Rules & Constraints
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="glass-card rounded-xl p-3">
            <strong className="text-emerald-400 block mb-1">3 Free Hints Per Run</strong>
            <p className="text-slate-400">Hints are rationed. Construct vessel parts to earn bonus hints through gameplay.</p>
          </div>
          <div className="glass-card rounded-xl p-3">
            <strong className="text-amber-400 block mb-1">2-Turn Cooldown</strong>
            <p className="text-slate-400">After consulting the advisor, you must execute decisions autonomously during the cooldown window.</p>
          </div>
          <div className="glass-card rounded-xl p-3">
            <strong className="text-cyan-400 block mb-1">Explainable Reasoning</strong>
            <p className="text-slate-400">Every recommendation provides transparent positive factors and negative risk trade-offs.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
