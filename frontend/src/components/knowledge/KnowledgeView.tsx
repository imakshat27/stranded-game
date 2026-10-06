import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { ForwardChainingResult, BackwardChainingResult, GoalNode } from '../../types/ai';
import { GameState } from '../../types/game';
import { api } from '../../services/api';

interface KnowledgeViewProps {
  gameState: GameState | null;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({ gameState }) => {
  const [forwardData, setForwardData] = useState<ForwardChainingResult | null>(null);
  const [backwardData, setBackwardData] = useState<BackwardChainingResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchKnowledge = async () => {
    setLoading(true);
    try {
      const data = await api.ai.reason(gameState?.game_id, gameState || undefined);
      setForwardData(data.forward_chaining);
      setBackwardData(data.backward_chaining);
    } catch (err) {
      console.error('Failed to load reasoning state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge();
  }, [gameState?.day, gameState?.turn_in_day]);

  // Recursive Goal Tree renderer for backward chaining
  const renderGoalNode = (node: GoalNode, depth: number = 0) => {
    return (
      <div key={node.name} className="mt-2" style={{ paddingLeft: `${depth * 16}px` }}>
        <div className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
          node.satisfied
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
            : 'bg-slate-900/60 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center gap-2.5">
            {node.satisfied ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div>
              <span className="text-xs font-bold font-mono text-white">{node.name}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{node.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {node.action_hint && !node.satisfied && (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                Hint: {node.action_hint}
              </span>
            )}
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
              node.satisfied ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {node.satisfied ? 'Satisfied' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Subgoals */}
        {node.subgoals && node.subgoals.length > 0 && (
          <div className="border-l border-slate-800 ml-4 pl-1">
            {node.subgoals.map((sg) => renderGoalNode(sg, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Knowledge Representation & Propositional Logic
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspectable knowledge base demonstrating Forward Chaining rule propagation and Backward Chaining goal reduction.
              </p>
            </div>
          </div>

          <button
            onClick={fetchKnowledge}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium font-mono transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Re-evaluating...' : 'Refresh Inferences'}
          </button>
        </div>

        {/* Ground Facts Pills */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-mono text-slate-400 mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-400" />
            <span>Active Propositional State Facts ({forwardData?.initial_facts.length || 0})</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(forwardData?.initial_facts || []).map((fact) => (
              <span
                key={fact}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-xs font-mono text-emerald-300 shadow-sm"
              >
                ✓ {fact}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Forward Chaining & Triggered Rules */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Forward Chaining Derived Inferences</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {forwardData?.triggered_rules.length || 0} Rules Fired in {forwardData?.iterations || 0} Iterations
          </span>
        </div>

        <div className="space-y-3">
          {(forwardData?.triggered_rules || []).map((rule) => (
            <div key={rule.rule_id} className="glass-card rounded-xl p-4 border-l-4 border-l-emerald-500">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-emerald-400 font-bold">IF</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                    {rule.antecedents.join(' AND ')}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-teal-300 font-bold">THEN</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold">
                    {rule.consequent}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono uppercase bg-slate-900 px-2 py-0.5 rounded">
                  Priority {rule.priority}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-2">{rule.description}</p>
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2">
                <strong>Advisory:</strong>
                <span>{rule.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Backward Chaining Goal Decomposition */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Backward Chaining Goal Tree (Escape Island)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Goal reduction tree recursively proving prerequisites from target outcome down to primitive actions.
            </p>
          </div>
          {backwardData && (
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              {backwardData.completion_percentage}% Fulfilled
            </span>
          )}
        </div>

        {backwardData?.goal_tree && (
          <div className="p-2">{renderGoalNode(backwardData.goal_tree)}</div>
        )}
      </div>
    </div>
  );
};
