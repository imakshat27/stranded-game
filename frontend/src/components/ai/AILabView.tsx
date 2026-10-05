import React, { useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Cpu,
  Layers,
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { GameState } from '../../types/game';
import { SearchResult, VisStep } from '../../types/ai';
import { api } from '../../services/api';

interface AILabViewProps {
  gameState: GameState | null;
}

export const AILabView: React.FC<AILabViewProps> = ({ gameState }) => {
  const [selectedAlgo, setSelectedAlgo] = useState<string>('astar');
  const [maxNodes, setMaxNodes] = useState<number>(800);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<SearchResult | null>(null);

  // Playback animation controls
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(400); // ms per step
  const timerRef = useRef<any>(null);

  const algorithms = [
    { id: 'astar', name: 'A* Search', desc: 'Optimal f(n) = g(n) + h(n)' },
    { id: 'ucs', name: 'Uniform Cost (UCS)', desc: 'Lowest path cost g(n)' },
    { id: 'bfs', name: 'Breadth-First (BFS)', desc: 'Level-by-level shortest depth' },
    { id: 'best_first', name: 'Best-First Search', desc: 'Greedy heuristic h(n)' },
    { id: 'dfs', name: 'Depth-First (DFS)', desc: 'Deep branch exploration' },
    { id: 'ids', name: 'Iterative Deepening', desc: 'Successive depth-limited search' },
    { id: 'hill_climbing', name: 'Hill Climbing', desc: 'Local steepest ascent gradient' }
  ];

  // Fetch or re-run search visualization
  const handleRunSearch = async () => {
    setLoading(true);
    setIsPlaying(false);
    try {
      const data = await api.ai.visualize({
        gameId: gameState?.game_id,
        state: gameState || undefined,
        algorithm: selectedAlgo,
        maxNodes: maxNodes
      });
      setSearchData(data);
      setCurrentStepIdx(0);
    } catch (err) {
      console.error('Search visualization failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRunSearch();
  }, [selectedAlgo]);

  // Handle Play/Pause timer
  useEffect(() => {
    if (isPlaying && searchData?.visualization_steps && searchData.visualization_steps.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => {
          if (prev >= searchData.visualization_steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, searchData]);

  const currentStep: VisStep | null =
    searchData?.visualization_steps && searchData.visualization_steps.length > 0
      ? searchData.visualization_steps[currentStepIdx]
      : null;

  // Build React Flow Nodes & Edges layout
  const flowNodes: Node[] = (searchData?.tree_nodes || []).map((tn, idx) => {
    const isCurrent = currentStep?.current_node === tn.id;
    const isGoal = tn.is_goal;
    const isPath = searchData?.path && tn.label && searchData.path.some((p) => tn.label.toLowerCase().includes(p.replace(/_/g, ' ')));

    // Hierarchical layout based on depth and sibling spread
    const depth = tn.depth || 0;
    const x = (idx % 5) * 220 + (depth * 25);
    const y = depth * 110 + 40;

    return {
      id: tn.id,
      position: { x, y },
      data: {
        label: (
          <div className={`p-2.5 rounded-xl border text-xs transition-all shadow-md ${
            isCurrent
              ? 'bg-amber-950/90 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105'
              : isGoal
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200 ring-1 ring-emerald-400'
              : isPath
              ? 'bg-teal-950/80 border-teal-400 text-teal-200'
              : 'bg-slate-900/90 border-slate-800 text-slate-300'
          }`}>
            <div className="font-bold flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-slate-400">{tn.id}</span>
              {isGoal && <Award className="w-3.5 h-3.5 text-emerald-400" />}
            </div>
            <div className="text-[11px] font-medium truncate mt-0.5 max-w-[160px]">{tn.label}</div>
            <div className="flex items-center gap-2 mt-1 font-mono text-[9px] text-slate-400 border-t border-slate-800/80 pt-1">
              {tn.g_cost !== undefined && <span>g: {tn.g_cost}</span>}
              {tn.h_cost !== undefined && <span>h: {tn.h_cost}</span>}
              {tn.f_cost !== undefined && <span className="text-emerald-400 font-bold">f: {tn.f_cost}</span>}
            </div>
          </div>
        )
      },
      style: { background: 'transparent', border: 'none', padding: 0 }
    };
  });

  const flowEdges: Edge[] = (searchData?.tree_edges || []).map((te) => ({
    id: te.id,
    source: te.source,
    target: te.target,
    label: te.label,
    labelStyle: { fill: '#94a3b8', fontSize: 9, fontFamily: 'monospace' },
    labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
    style: { stroke: '#334155', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#334155', width: 14, height: 14 }
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner & Control HUD */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                AI Search & State Space Visualizer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Instrumented state-space exploration across BFS, DFS, IDS, UCS, Best-First, and A*.
            </p>
          </div>

          {/* Algorithm Selector & Run Trigger */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedAlgo}
              onChange={(e) => setSelectedAlgo(e.target.value)}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 font-medium focus:ring-1 focus:ring-emerald-400 focus:outline-none"
            >
              {algorithms.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.desc})
                </option>
              ))}
            </select>

            <button
              onClick={handleRunSearch}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Solving...' : 'Re-Run Search'}</span>
            </button>
          </div>
        </div>

        {/* Live Search Metrics HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Nodes Explored</div>
            <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
              {searchData?.nodes_explored || 0}
            </div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Solution Cost</div>
            <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
              {searchData?.cost !== undefined ? searchData.cost : 'N/A'}
            </div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Tree Depth</div>
            <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
              {searchData?.depth || 0}
            </div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Max Frontier</div>
            <div className="text-base font-mono font-bold text-purple-400 mt-0.5">
              {searchData?.max_frontier_size || 0}
            </div>
          </div>
          <div className="glass-card rounded-xl p-3 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400 font-mono uppercase">Execution Time</div>
            <div className="text-base font-mono font-bold text-slate-200 mt-0.5">
              {searchData?.execution_time_ms || 0} ms
            </div>
          </div>
        </div>

        {/* Step-by-Step Playback Controls */}
        {searchData?.visualization_steps && searchData.visualization_steps.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white transition active:scale-95"
                title={isPlaying ? 'Pause Animation' : 'Play Step-by-Step'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setCurrentStepIdx((prev) => Math.min((searchData.visualization_steps.length - 1), prev + 1))}
                disabled={currentStepIdx >= searchData.visualization_steps.length - 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-40"
                title="Next Step"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setCurrentStepIdx(0); setIsPlaying(false); }}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Restart Steps"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-slate-400 ml-2">
                Step <strong className="text-emerald-400">{currentStepIdx + 1}</strong> of {searchData.visualization_steps.length}
              </span>
            </div>

            {/* Step Timeline Slider */}
            <div className="w-full md:w-1/2 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={searchData.visualization_steps.length - 1}
                value={currentStepIdx}
                onChange={(e) => setCurrentStepIdx(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                {playbackSpeed}ms/step
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Visual Canvas & Open/Closed Sets Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* React Flow Graph Area */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-2 h-[520px] relative overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 text-xs font-mono text-slate-400">
            <span>State Tree View (React Flow Interactive)</span>
            <span>Pan & Zoom enabled</span>
          </div>

          <div className="flex-1 w-full h-full">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.2}
              maxZoom={1.5}
            >
              <Background color="#1e293b" gap={16} />
              <Controls className="bg-slate-900 border-slate-700 text-white rounded-lg" />
              <MiniMap
                nodeColor={(n) => (n.id.includes('S0') ? '#10b981' : '#3b82f6')}
                maskColor="rgba(15, 23, 42, 0.7)"
                className="bg-slate-950 border border-slate-800 rounded-lg"
              />
            </ReactFlow>
          </div>
        </div>

        {/* Frontier (Open Set) & Closed Set Panels */}
        <div className="lg:col-span-4 space-y-4">
          {/* Solution Path Card */}
          {searchData?.action_names && searchData.action_names.length > 0 && (
            <div className="glass-panel rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Synthesized Strategy Path ({searchData.action_names.length} steps)
                </h4>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {searchData.action_names.map((act, i) => (
                  <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-slate-900/60 border border-slate-800 text-xs">
                    <span className="w-4 h-4 rounded-full bg-emerald-950 text-emerald-400 font-mono text-[10px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-slate-200 truncate">{act}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Node Inspection */}
          {currentStep && (
            <div className="glass-panel rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Current Frontier Node
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {currentStep.current_node}
                </span>
              </div>
              <div className="space-y-1 text-xs font-mono text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Action:</span>
                  <span className="text-white font-medium">{currentStep.action || 'Initial State'}</span>
                </div>
                {currentStep.g_cost !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Path Cost g(n):</span>
                    <span>{currentStep.g_cost}</span>
                  </div>
                )}
                {currentStep.h_cost !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Heuristic h(n):</span>
                    <span>{currentStep.h_cost}</span>
                  </div>
                )}
                {currentStep.f_cost !== undefined && (
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-500">Total Eval f(n):</span>
                    <span className="text-emerald-400 font-bold">{currentStep.f_cost}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Frontier Open Set Preview */}
          <div className="glass-panel rounded-2xl p-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
              Frontier Queue (Open Set)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(currentStep?.frontier || ['S1', 'S2', 'S3']).map((fNode, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300"
                >
                  {fNode}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
