import React, { useState } from 'react';
import {
  GitBranch,
  Cpu,
  BarChart3,
  BookOpen,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { GameState } from '../../types/game';
import { AILabView } from './AILabView';
import { PlanningView } from '../planning/PlanningView';
import { AlgorithmComparisonView } from './AlgorithmComparisonView';
import { KnowledgeView } from '../knowledge/KnowledgeView';
import { ProbabilityView } from '../probability/ProbabilityView';

interface AILabHubProps {
  gameState: GameState | null;
  initialSubTab?: string;
}

export const AILabHub: React.FC<AILabHubProps> = ({ gameState, initialSubTab = 'tree' }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialSubTab);

  const subTabs = [
    {
      id: 'tree',
      label: 'Search Tree (A* / BFS)',
      shortLabel: 'Search Tree',
      icon: Cpu,
      description: 'Interactive state-space graph & step playback'
    },
    {
      id: 'planner',
      label: 'Strategic Planner & Replan',
      shortLabel: 'Planner',
      icon: GitBranch,
      description: 'Goal-directed action trajectories & crisis replanning'
    },
    {
      id: 'benchmarks',
      label: 'Algorithm Benchmark Matrix',
      shortLabel: 'Benchmarks',
      icon: BarChart3,
      description: 'Empirical comparison of all 6 search algorithms'
    },
    {
      id: 'knowledge',
      label: 'Propositional Logic & Rules',
      shortLabel: 'Knowledge Base',
      icon: BookOpen,
      description: 'Forward chaining peril inference & backward chaining goal trees'
    },
    {
      id: 'probability',
      label: 'Bayesian Belief Engine',
      shortLabel: 'Bayesian Risk',
      icon: ShieldAlert,
      description: 'Probabilistic evidence updates via Bayes rule'
    }
  ];

  return (
    <div className="space-y-5">
      {/* AI Lab Sub-Navigation Header */}
      <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-400">
                AI Algorithm Laboratory
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                5 Academic Systems
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect, benchmark, and simulate the mathematical engines operating on the island state space.
            </p>
          </div>

          {/* Sub-tab Pill Switcher */}
          <nav
            aria-label="AI Laboratory Navigation"
            className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none bg-slate-900/80 p-1 rounded-xl border border-slate-800"
          >
            {subTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                  }`}
                  title={tab.description}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} aria-hidden="true" />
                  <span>{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Active Sub-View Content */}
      <div className="transition-opacity duration-200">
        {activeSubTab === 'tree' && <AILabView gameState={gameState} />}
        {activeSubTab === 'planner' && <PlanningView gameState={gameState} />}
        {activeSubTab === 'benchmarks' && <AlgorithmComparisonView gameState={gameState} />}
        {activeSubTab === 'knowledge' && <KnowledgeView gameState={gameState} />}
        {activeSubTab === 'probability' && <ProbabilityView gameState={gameState} />}
      </div>
    </div>
  );
};
