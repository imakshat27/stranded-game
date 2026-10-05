import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  MarkerType,
  Position,
  Handle,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Cpu,
  Layers,
  Sparkles,
  Award,
  TreePine,
  Droplets,
  Utensils,
  Home,
  Wrench,
  Compass,
  Shield,
  Zap,
  Anchor,
  Eye,
  Maximize2,
  ChevronRight,
  Activity,
  CheckCircle2,
  Circle,
  ArrowRight,
  ListOrdered,
  Filter,
  Check,
  Package
} from 'lucide-react';
import { GameState } from '../../types/game';
import { SearchResult, VisStep, TreeNodeData } from '../../types/ai';
import { api } from '../../services/api';

// Helper: Map action category/name to vivid visual icons and theme badges
const getActionVisuals = (category?: string, actionName?: string) => {
  const cat = (category || '').toLowerCase();
  const name = (actionName || '').toLowerCase();

  if (name.includes('water') || cat.includes('water')) {
    return { icon: Droplets, color: 'text-cyan-400', bg: 'bg-cyan-950/80', border: 'border-cyan-500/40', label: 'Hydration' };
  }
  if (name.includes('food') || cat.includes('food') || name.includes('fish') || name.includes('hunt') || name.includes('ration')) {
    return { icon: Utensils, color: 'text-amber-400', bg: 'bg-amber-950/80', border: 'border-amber-500/40', label: 'Sustenance' };
  }
  if (name.includes('wood') || name.includes('timber') || cat.includes('wood') || cat.includes('resource')) {
    return { icon: TreePine, color: 'text-emerald-400', bg: 'bg-emerald-950/80', border: 'border-emerald-500/40', label: 'Timber' };
  }
  if (name.includes('boat') || name.includes('hull') || name.includes('sail') || name.includes('rudder') || name.includes('rigging') || cat.includes('escape')) {
    return { icon: Anchor, color: 'text-indigo-400', bg: 'bg-indigo-950/80', border: 'border-indigo-500/40', label: 'Escape Project' };
  }
  if (name.includes('shelter') || cat.includes('shelter')) {
    return { icon: Home, color: 'text-orange-400', bg: 'bg-orange-950/80', border: 'border-orange-500/40', label: 'Fortification' };
  }
  if (name.includes('craft') || name.includes('repair') || name.includes('tool') || cat.includes('craft')) {
    return { icon: Wrench, color: 'text-blue-400', bg: 'bg-blue-950/80', border: 'border-blue-500/40', label: 'Crafting' };
  }
  if (name.includes('explore') || name.includes('scout') || name.includes('search') || cat.includes('explore')) {
    return { icon: Compass, color: 'text-teal-400', bg: 'bg-teal-950/80', border: 'border-teal-500/40', label: 'Exploration' };
  }
  if (name.includes('rest') || cat.includes('rest')) {
    return { icon: Shield, color: 'text-purple-400', bg: 'bg-purple-950/80', border: 'border-purple-500/40', label: 'Recuperation' };
  }
  return { icon: Zap, color: 'text-slate-300', bg: 'bg-slate-900', border: 'border-slate-700', label: 'Action' };
};

// ---------------------------------------------------------------------------
// Hierarchical Tree Layout (Deterministic Top-to-Bottom Tidier Tree)
// ---------------------------------------------------------------------------
const computeHierarchicalTreeLayout = (
  nodes: TreeNodeData[],
  nodeWidth = 260,
  hGap = 44,
  vGap = 160
): Map<string, { x: number; y: number }> => {
  const positions = new Map<string, { x: number; y: number }>();
  if (!nodes || nodes.length === 0) return positions;

  const nodeMap = new Map<string, TreeNodeData>();
  const childrenMap = new Map<string, string[]>();
  const roots: string[] = [];

  for (const n of nodes) {
    nodeMap.set(n.id, n);
    childrenMap.set(n.id, []);
  }

  for (const n of nodes) {
    if (n.parent_id && nodeMap.has(n.parent_id)) {
      childrenMap.get(n.parent_id)!.push(n.id);
    } else {
      roots.push(n.id);
    }
  }

  // Ensure root S0 or first node is primary
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0].id);
  }

  // 1. Calculate subtree widths recursively
  const subtreeWidths = new Map<string, number>();
  const visited = new Set<string>();

  const calcSubtreeWidth = (id: string): number => {
    if (visited.has(id)) return nodeWidth + hGap;
    visited.add(id);

    const children = childrenMap.get(id) || [];
    if (children.length === 0) {
      const w = nodeWidth + hGap;
      subtreeWidths.set(id, w);
      return w;
    }

    let totalChildrenWidth = 0;
    for (const childId of children) {
      totalChildrenWidth += calcSubtreeWidth(childId);
    }

    const w = Math.max(nodeWidth + hGap, totalChildrenWidth);
    subtreeWidths.set(id, w);
    return w;
  };

  for (const root of roots) {
    calcSubtreeWidth(root);
  }

  // 2. Position nodes recursively
  const placed = new Set<string>();

  const placeSubtree = (id: string, leftX: number, depth: number) => {
    if (placed.has(id)) return;
    placed.add(id);

    const children = childrenMap.get(id) || [];
    const mySubtreeWidth = subtreeWidths.get(id) || (nodeWidth + hGap);
    const y = depth * vGap + 40;

    if (children.length === 0) {
      const x = leftX + (mySubtreeWidth - nodeWidth) / 2;
      positions.set(id, { x, y });
      return;
    }

    let curLeft = leftX;
    const childXCoords: number[] = [];

    for (const childId of children) {
      const childW = subtreeWidths.get(childId) || (nodeWidth + hGap);
      placeSubtree(childId, curLeft, depth + 1);
      const childPos = positions.get(childId);
      if (childPos) {
        childXCoords.push(childPos.x);
      }
      curLeft += childW;
    }

    // Center parent symmetrically above children
    const firstChildX = childXCoords[0] ?? (leftX + mySubtreeWidth / 2);
    const lastChildX = childXCoords[childXCoords.length - 1] ?? firstChildX;
    const x = (firstChildX + lastChildX) / 2;

    positions.set(id, { x, y });
  };

  let globalLeft = 40;
  for (const root of roots) {
    placeSubtree(root, globalLeft, nodeMap.get(root)?.depth || 0);
    globalLeft += (subtreeWidths.get(root) || (nodeWidth + hGap)) + hGap;
  }

  // Handle any orphan nodes safely
  let orphanIndex = 0;
  for (const n of nodes) {
    if (!positions.has(n.id)) {
      const depth = n.depth || 0;
      positions.set(n.id, {
        x: globalLeft + (orphanIndex % 4) * (nodeWidth + hGap),
        y: depth * vGap + 40,
      });
      orphanIndex++;
    }
  }

  return positions;
};

// ---------------------------------------------------------------------------
// Custom React Flow Node Component: SearchStateNode
// ---------------------------------------------------------------------------
interface SearchNodeData {
  nodeData: TreeNodeData;
  isCurrent: boolean;
  isGoal: boolean;
  isWinningPath: boolean;
  isFrontier: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: (nodeId: string) => void;
}

const SearchStateNode: React.FC<{ id: string; data: SearchNodeData }> = ({ id, data }) => {
  const { nodeData, isCurrent, isGoal, isWinningPath, isFrontier, isSelected, isDimmed, onSelect } = data;
  const visuals = getActionVisuals(nodeData.action_category, nodeData.action_name || nodeData.label);
  const Icon = visuals.icon;

  return (
    <div
      onClick={() => onSelect(id)}
      className={`group w-[260px] rounded-xl border p-3 cursor-pointer transition-all duration-200 select-none shadow-xl ${
        isDimmed ? 'opacity-25 hover:opacity-90' : 'opacity-100'
      } ${
        isSelected
          ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-400/80 shadow-cyan-950/70 scale-[1.03]'
          : isCurrent
          ? 'bg-amber-950/85 border-amber-400 ring-2 ring-amber-400/70 shadow-amber-950/70 animate-pulse'
          : isGoal
          ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/70 shadow-emerald-950/70'
          : isWinningPath
          ? 'bg-teal-950/75 border-teal-400/80 ring-1 ring-teal-400/50 shadow-teal-950/50'
          : isFrontier
          ? 'bg-indigo-950/60 border-indigo-500/60 ring-1 ring-indigo-500/30'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-slate-950/50'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-900"
      />

      {/* Header: Action Icon + Node ID + Status Tag */}
      <div className="flex items-center justify-between gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`p-1 rounded-lg ${visuals.bg} ${visuals.border} border shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${visuals.color}`} />
          </div>
          <span className="font-mono text-[11px] font-bold text-slate-300 truncate">
            {nodeData.id}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isGoal ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
              <Award className="w-2.5 h-2.5 text-emerald-400" /> GOAL
            </span>
          ) : isCurrent ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ACTIVE
            </span>
          ) : isWinningPath ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
              ★ PATH
            </span>
          ) : isFrontier ? (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              QUEUE
            </span>
          ) : null}
        </div>
      </div>

      {/* Action Title */}
      <div className="text-xs font-semibold text-slate-100 truncate mb-2" title={nodeData.action_name || nodeData.label}>
        {nodeData.action_name || nodeData.label}
      </div>

      {/* Vitals Summary Strip */}
      {nodeData.vitals && (
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mb-2 px-1.5 py-1 rounded bg-slate-950/60 border border-slate-800/80">
          <span title="Health" className="flex items-center gap-0.5 text-rose-300">
            ❤️ {Math.round(nodeData.vitals.health)}%
          </span>
          <span title="Water" className="flex items-center gap-0.5 text-cyan-300">
            💧 {Math.round(nodeData.vitals.water)}%
          </span>
          <span title="Energy" className="flex items-center gap-0.5 text-amber-300">
            ⚡ {Math.round(nodeData.vitals.energy)}%
          </span>
        </div>
      )}

      {/* Search Cost Equation Bar */}
      <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 pt-0.5">
        <div className="flex items-center gap-1.5">
          {nodeData.g_cost !== undefined && (
            <span title="Accumulated Path Cost g(n)">
              g: <span className="text-slate-200">{nodeData.g_cost}</span>
            </span>
          )}
          {nodeData.h_cost !== undefined && (
            <span title="Heuristic Cost to Escape h(n)">
              h: <span className="text-slate-200">{nodeData.h_cost}</span>
            </span>
          )}
        </div>
        {nodeData.f_cost !== undefined && (
          <div
            className="font-bold text-emerald-400 bg-emerald-950/70 px-1.5 py-0.2 rounded border border-emerald-500/30"
            title="Total Evaluation Score f(n) = g(n) + h(n)"
          >
            f: {nodeData.f_cost}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-900"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main AILabView Component
// ---------------------------------------------------------------------------
interface AILabViewProps {
  gameState: GameState | null;
}

export const AILabView: React.FC<AILabViewProps> = ({ gameState }) => {
  const [selectedAlgo, setSelectedAlgo] = useState<string>('astar');
  const [maxNodes, setMaxNodes] = useState<number>(500);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchData, setSearchData] = useState<SearchResult | null>(null);

  // Playback animation controls
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(500); // ms per step
  const timerRef = useRef<any>(null);

  // Cockpit view options
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [pathFilter, setPathFilter] = useState<'all' | 'winning'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeBottomTab, setActiveBottomTab] = useState<'frontier' | 'explored' | 'solution'>('solution');

  const algorithms = [
    { id: 'astar', name: 'A* Search', desc: 'Optimal f(n) = g(n) + h(n)' },
    { id: 'ucs', name: 'Uniform Cost (UCS)', desc: 'Lowest path cost g(n)' },
    { id: 'bfs', name: 'Breadth-First (BFS)', desc: 'Level-by-level shortest depth' },
    { id: 'best_first', name: 'Best-First Search', desc: 'Greedy heuristic h(n)' },
    { id: 'dfs', name: 'Depth-First (DFS)', desc: 'Deep branch exploration' },
    { id: 'ids', name: 'Iterative Deepening', desc: 'Successive depth-limited search' },
    { id: 'hill_climbing', name: 'Hill Climbing', desc: 'Local steepest ascent gradient' }
  ];

  // Fetch / re-run search visualization
  const handleRunSearch = useCallback(async () => {
    setLoading(true);
    setIsPlaying(false);
    setSelectedNodeId(null);
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
  }, [gameState, selectedAlgo, maxNodes]);

  useEffect(() => {
    handleRunSearch();
  }, [selectedAlgo, maxNodes, handleRunSearch]);

  // Handle Play/Pause playback timer
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

  // Track winning path node IDs with 100% precision by tracing back from goal
  const winningNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!searchData?.tree_nodes || searchData.tree_nodes.length === 0) return set;

    const nodeMap = new Map(searchData.tree_nodes.map((n) => [n.id, n]));
    const goalNode = searchData.tree_nodes.find((n) => n.is_goal);

    if (goalNode) {
      let curr: TreeNodeData | undefined = goalNode;
      while (curr) {
        set.add(curr.id);
        curr = curr.parent_id ? nodeMap.get(curr.parent_id) : undefined;
      }
    } else if (searchData.path && searchData.path.length > 0) {
      // Fallback matching by label keywords if goal flag wasn't set
      for (const tn of searchData.tree_nodes) {
        if (searchData.path.some((p) => (tn.action_id && tn.action_id === p) || (tn.label && tn.label.toLowerCase().includes(p.replace(/_/g, ' '))))) {
          set.add(tn.id);
        }
      }
    }
    // Always include root node S0
    if (searchData.tree_nodes.length > 0) {
      set.add(searchData.tree_nodes[0].id);
    }
    return set;
  }, [searchData]);

  // Determine currently inspected node in the Smart Cockpit
  const activeInspectedNode: TreeNodeData | null = useMemo(() => {
    if (!searchData?.tree_nodes || searchData.tree_nodes.length === 0) return null;

    // 1. Manually clicked node
    if (selectedNodeId) {
      const found = searchData.tree_nodes.find((n) => n.id === selectedNodeId);
      if (found) return found;
    }
    // 2. Currently stepped node in playback
    if (currentStep?.current_node) {
      const found = searchData.tree_nodes.find((n) => n.id === currentStep.current_node);
      if (found) return found;
    }
    // 3. Goal node if found
    const goal = searchData.tree_nodes.find((n) => n.is_goal);
    if (goal) return goal;

    // 4. Default to root node S0
    return searchData.tree_nodes[0] || null;
  }, [selectedNodeId, currentStep, searchData]);

  // Memoize custom React Flow node types
  const nodeTypes = useMemo(() => ({
    searchStateNode: SearchStateNode,
  }), []);

  // Compute clean hierarchical layout positions
  const nodePositions = useMemo(() => {
    return computeHierarchicalTreeLayout(searchData?.tree_nodes || []);
  }, [searchData?.tree_nodes]);

  // Construct React Flow Nodes
  const flowNodes: Node[] = useMemo(() => {
    return (searchData?.tree_nodes || []).map((tn) => {
      const pos = nodePositions.get(tn.id) || { x: 0, y: 0 };
      const isCurrent = currentStep?.current_node === tn.id;
      const isGoal = !!tn.is_goal;
      const isWinningPath = winningNodeIds.has(tn.id);
      const isFrontier = currentStep?.frontier ? currentStep.frontier.includes(tn.id) : false;
      const isSelected = activeInspectedNode?.id === tn.id;
      const isDimmed = pathFilter === 'winning' && !isWinningPath;

      return {
        id: tn.id,
        type: 'searchStateNode',
        position: pos,
        data: {
          nodeData: tn,
          isCurrent,
          isGoal,
          isWinningPath,
          isFrontier,
          isSelected,
          isDimmed,
          onSelect: (id: string) => setSelectedNodeId(id),
        },
      };
    });
  }, [searchData?.tree_nodes, nodePositions, currentStep, winningNodeIds, activeInspectedNode, pathFilter]);

  // Construct React Flow Edges
  const flowEdges: Edge[] = useMemo(() => {
    return (searchData?.tree_edges || []).map((te) => {
      const isPathEdge = winningNodeIds.has(te.source) && winningNodeIds.has(te.target);
      const isDimmed = pathFilter === 'winning' && !isPathEdge;

      return {
        id: te.id,
        source: te.source,
        target: te.target,
        label: te.label,
        className: isPathEdge ? 'winning-edge' : isDimmed ? 'dimmed-edge' : '',
        animated: isPathEdge,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isPathEdge ? '#10b981' : isDimmed ? '#1e293b' : '#475569',
          width: isPathEdge ? 16 : 12,
          height: isPathEdge ? 16 : 12,
        },
        labelStyle: {
          fill: isPathEdge ? '#34d399' : '#94a3b8',
          fontSize: 9,
          fontFamily: 'monospace',
          fontWeight: isPathEdge ? 'bold' : 'normal',
        },
        labelBgStyle: {
          fill: isPathEdge ? '#064e3b' : '#0f172a',
          fillOpacity: 0.85,
        },
      };
    });
  }, [searchData?.tree_edges, winningNodeIds, pathFilter]);

  // Trajectory breadcrumbs from root S0 down to active inspected node
  const trajectoryBreadcrumbs = useMemo(() => {
    if (!activeInspectedNode || !searchData?.tree_nodes) return [];
    const nodeMap = new Map(searchData.tree_nodes.map((n) => [n.id, n]));
    const trail: TreeNodeData[] = [];
    let curr: TreeNodeData | undefined = activeInspectedNode;

    while (curr) {
      trail.unshift(curr);
      curr = curr.parent_id ? nodeMap.get(curr.parent_id) : undefined;
    }
    return trail;
  }, [activeInspectedNode, searchData]);

  // Visual category info for active inspected node
  const activeVisuals = getActionVisuals(
    activeInspectedNode?.action_category,
    activeInspectedNode?.action_name || activeInspectedNode?.label
  );
  const ActiveIcon = activeVisuals.icon;

  return (
    <div className="space-y-5">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER & HUD BAR                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                AI Search & State Space Visualizer
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive state graph exploration with real-time heuristic inspection and step-by-step playback.
            </p>
          </div>

          {/* Controls: Algorithm selector & Re-run */}
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

            <select
              value={maxNodes}
              onChange={(e) => setMaxNodes(Number(e.target.value))}
              disabled={loading}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 font-mono focus:ring-1 focus:ring-emerald-400 focus:outline-none"
              title="Search node limit budget"
            >
              <option value={100}>Budget: 100</option>
              <option value={300}>Budget: 300</option>
              <option value={500}>Budget: 500</option>
              <option value={800}>Budget: 800</option>
            </select>

            <button
              onClick={handleRunSearch}
              disabled={loading}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Solving...' : 'Re-Run Search'}</span>
            </button>
          </div>
        </div>

        {/* Live Search Metrics HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
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

        {/* Step-by-Step Playback Controls & Speed */}
        {searchData?.visualization_steps && searchData.visualization_steps.length > 0 && (
          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white transition active:scale-95 cursor-pointer shadow-md shadow-emerald-950/40"
                  title={isPlaying ? 'Pause Playback' : 'Play Step-by-Step'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIdx((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentStepIdx <= 0}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-40 cursor-pointer"
                  title="Previous Step"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStepIdx((prev) => Math.min((searchData.visualization_steps.length - 1), prev + 1));
                  }}
                  disabled={currentStepIdx >= searchData.visualization_steps.length - 1}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-40 cursor-pointer"
                  title="Next Step"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCurrentStepIdx(0);
                    setIsPlaying(false);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  title="Reset to Step 1"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <span className="text-xs font-mono text-slate-400 ml-2">
                  Step <strong className="text-emerald-400">{currentStepIdx + 1}</strong> of {searchData.visualization_steps.length}
                </span>
              </div>

              {/* Step Timeline Slider + Speed */}
              <div className="w-full md:w-1/2 flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max={searchData.visualization_steps.length - 1}
                  value={currentStepIdx}
                  onChange={(e) => {
                    setIsPlaying(false);
                    setCurrentStepIdx(Number(e.target.value));
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-mono text-slate-300 focus:outline-none"
                  title="Animation Speed"
                >
                  <option value={1000}>1.0s</option>
                  <option value={500}>0.5s</option>
                  <option value={250}>0.25s</option>
                  <option value={100}>0.1s</option>
                </select>
              </div>
            </div>

            {/* Live Step Narrative Banner */}
            {currentStep && (
              <div className="flex items-start gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs text-slate-200">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono font-bold text-emerald-400">Step {currentStepIdx + 1} Reasoning</span>
                    {currentStep.current_node && (
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Node: {currentStep.current_node}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {currentStep.step_narrative ||
                      `Evaluating node ${currentStep.current_node || ''} with path cost g=${currentStep.g_cost ?? '?'}, heuristic h=${currentStep.h_cost ?? '?'}, and priority f=${currentStep.f_cost ?? '?'}.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SPLIT-SCREEN SMART COCKPIT: CANVAS + LIVE AI INSPECTOR     */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch h-[640px]">
        {/* LEFT PANE: Graph Canvas (65% width when open, 100% when collapsed) */}
        <div
          className={`transition-all duration-300 flex flex-col glass-panel rounded-2xl p-2 relative overflow-hidden ${
            isInspectorOpen ? 'w-full xl:w-[65%]' : 'w-full'
          }`}
        >
          {/* Canvas Toolbar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <span className="font-mono font-semibold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                State Exploration Tree
              </span>

              {/* Filter Toggle: All Branches vs Winning Path Only */}
              <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
                <button
                  onClick={() => setPathFilter('all')}
                  className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
                    pathFilter === 'all'
                      ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Branches ({searchData?.tree_nodes?.length || 0})
                </button>
                <button
                  onClick={() => setPathFilter('winning')}
                  className={`px-2.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
                    pathFilter === 'winning'
                      ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-3 h-3 text-emerald-400" />
                  Winning Path Only ({winningNodeIds.size})
                </button>
              </div>
            </div>

            {/* Right toolbar controls: Inspector toggle */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-slate-400 pr-2 border-r border-slate-800">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Active
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Goal
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span> Path
                </span>
              </div>

              <button
                onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition text-xs font-mono border border-slate-700/80 cursor-pointer"
                title={isInspectorOpen ? 'Collapse Inspector for Fullscreen Canvas' : 'Open Live AI Inspector'}
              >
                {isInspectorOpen ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Fullscreen Tree</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Open AI Inspector</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive React Flow Canvas */}
          <div className="flex-1 w-full h-full relative">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.15 }}
              attributionPosition="bottom-right"
              minZoom={0.1}
              maxZoom={1.6}
            >
              <Background color="#1e293b" gap={20} size={1} />
              <Controls className="bg-slate-900 border-slate-700 text-white rounded-lg" />
              <MiniMap
                nodeColor={(n) => {
                  if (n.id === activeInspectedNode?.id) return '#06b6d4';
                  if (n.id.includes('S0')) return '#10b981';
                  if (winningNodeIds.has(n.id)) return '#14b8a6';
                  return '#3b82f6';
                }}
                maskColor="rgba(15, 23, 42, 0.75)"
                className="bg-slate-950 border border-slate-800 rounded-lg"
              />
            </ReactFlow>
          </div>
        </div>

        {/* RIGHT PANE: Persistent Live AI Inspector (35% width when open, 0% when collapsed) */}
        {isInspectorOpen && (
          <div className="w-full xl:w-[35%] glass-panel rounded-2xl p-4 flex flex-col h-full overflow-hidden transition-all duration-300">
            {/* Inspector Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Live AI Node Inspector
                </h3>
              </div>

              {selectedNodeId && (
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-[10px] font-mono text-slate-400 hover:text-emerald-400 transition underline cursor-pointer"
                  title="Snap back to current playback step"
                >
                  Follow Playback
                </button>
              )}
            </div>

            {/* Scrollable Content inside Inspector */}
            {activeInspectedNode ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* Node Identity Card */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${activeVisuals.bg} ${activeVisuals.border} border`}>
                        <ActiveIcon className={`w-5 h-5 ${activeVisuals.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-emerald-400">
                            {activeInspectedNode.id}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            (Depth: {activeInspectedNode.depth || 0})
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white leading-tight mt-0.5">
                          {activeInspectedNode.action_name || activeInspectedNode.label}
                        </h4>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {activeInspectedNode.is_goal ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          🏆 VICTORY
                        </span>
                      ) : winningNodeIds.has(activeInspectedNode.id) ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          ★ WINNING PATH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          {activeVisuals.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Survivor Vitals At This State */}
                {activeInspectedNode.vitals && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Survivor Vitals</span>
                      <span className="text-[10px] text-slate-500">Node State</span>
                    </div>

                    <div className="space-y-2">
                      {/* Health */}
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-slate-300 flex items-center gap-1">❤️ Health</span>
                          <span className="text-rose-400 font-bold">
                            {Math.round(activeInspectedNode.vitals.health)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              activeInspectedNode.vitals.health > 70
                                ? 'bg-emerald-500'
                                : activeInspectedNode.vitals.health > 35
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, activeInspectedNode.vitals.health))}%` }}
                          />
                        </div>
                      </div>

                      {/* Water */}
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-slate-300 flex items-center gap-1">💧 Water</span>
                          <span className="text-cyan-400 font-bold">
                            {Math.round(activeInspectedNode.vitals.water)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              activeInspectedNode.vitals.water > 50
                                ? 'bg-cyan-500'
                                : activeInspectedNode.vitals.water > 25
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, activeInspectedNode.vitals.water))}%` }}
                          />
                        </div>
                      </div>

                      {/* Food */}
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-slate-300 flex items-center gap-1">🍖 Food</span>
                          <span className="text-amber-400 font-bold">
                            {Math.round(activeInspectedNode.vitals.food)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              activeInspectedNode.vitals.food > 50
                                ? 'bg-amber-500'
                                : activeInspectedNode.vitals.food > 25
                                ? 'bg-orange-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, activeInspectedNode.vitals.food))}%` }}
                          />
                        </div>
                      </div>

                      {/* Energy */}
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-slate-300 flex items-center gap-1">⚡ Energy</span>
                          <span className="text-yellow-400 font-bold">
                            {Math.round(activeInspectedNode.vitals.energy)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              activeInspectedNode.vitals.energy > 50
                                ? 'bg-yellow-500'
                                : activeInspectedNode.vitals.energy > 25
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, activeInspectedNode.vitals.energy))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Impact Deltas (What changed to reach this node) */}
                {activeInspectedNode.vital_deltas && Object.keys(activeInspectedNode.vital_deltas).length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Action Consequence (Deltas)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(activeInspectedNode.vital_deltas).map(([key, val]) => {
                        const isGain = val > 0;
                        return (
                          <span
                            key={key}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold border ${
                              isGain
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {isGain ? `+${val}` : val} {key}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Inventory Snapshot */}
                {activeInspectedNode.inventory && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Inventory Stores</span>
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                      <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">🪵 Wood</span>
                        <span className="text-emerald-400 font-bold">{activeInspectedNode.inventory.wood}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">🪢 Rope</span>
                        <span className="text-teal-400 font-bold">{activeInspectedNode.inventory.rope}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">⚙️ Metal</span>
                        <span className="text-cyan-400 font-bold">{activeInspectedNode.inventory.metal}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">🔨 Tools</span>
                        <span className="text-amber-400 font-bold">{activeInspectedNode.inventory.tools}</span>
                      </div>
                      <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between col-span-2">
                        <span className="text-slate-400">⛺ Shelter Level</span>
                        <span className="text-orange-400 font-bold">Lv. {activeInspectedNode.inventory.shelter_level}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Catamaran Escape Project Progress */}
                {activeInspectedNode.boat_parts && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Anchor className="w-3.5 h-3.5 text-indigo-400" />
                        Catamaran Assembly
                      </span>
                      <span className="text-emerald-400">
                        {Math.round(activeInspectedNode.escape_progress || 0)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, activeInspectedNode.escape_progress || 0))}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                      {Object.entries(activeInspectedNode.boat_parts).map(([part, built]) => (
                        <div
                          key={part}
                          className={`p-1.5 rounded border flex items-center justify-between ${
                            built
                              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="capitalize">{part}</span>
                          {built ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Circle className="w-3 h-3 text-slate-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Commentary & Decision Rationale */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    AI Decision Commentary
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {activeInspectedNode.ai_commentary ||
                      'State evaluated as part of search progression toward escape goal.'}
                  </p>
                </div>

                {/* Search Heuristic Formula Breakdown */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Evaluation Formula: f(n) = g(n) + h(n)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <div className="text-[9px] text-slate-500">Path Cost g(n)</div>
                      <div className="text-sm font-bold text-slate-200 mt-0.5">
                        {activeInspectedNode.g_cost ?? 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                      <div className="text-[9px] text-slate-500">Heuristic h(n)</div>
                      <div className="text-sm font-bold text-cyan-400 mt-0.5">
                        {activeInspectedNode.h_cost ?? 'N/A'}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-emerald-950/60 border border-emerald-500/40">
                      <div className="text-[9px] text-emerald-400">Total Score f(n)</div>
                      <div className="text-sm font-bold text-emerald-300 mt-0.5">
                        {activeInspectedNode.f_cost ?? 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trajectory Breadcrumbs from Root S0 */}
                {trajectoryBreadcrumbs.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Path Trajectory ({trajectoryBreadcrumbs.length} Steps)
                    </div>
                    <div className="space-y-1">
                      {trajectoryBreadcrumbs.map((node, i) => (
                        <div
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer transition ${
                            node.id === activeInspectedNode.id
                              ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-200'
                              : 'bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                            {i}
                          </span>
                          <span className="font-mono text-emerald-400 font-bold shrink-0">{node.id}</span>
                          <span className="truncate">{node.action_name || node.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs font-mono text-slate-500 text-center p-4">
                Click any node in the exploration tree to inspect full vitals, inventory, deltas, and AI decision rationale.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. BOTTOM TABBED PANELS: SOLUTION PATH, FRONTIER & EXPLORED   */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel rounded-2xl p-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveBottomTab('solution')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'solution'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              Synthesized Escape Plan ({searchData?.action_names?.length || 0} Steps)
            </button>

            <button
              onClick={() => setActiveBottomTab('frontier')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'frontier'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Frontier Queue (Open Set: {currentStep?.frontier?.length || 0})
            </button>

            <button
              onClick={() => setActiveBottomTab('explored')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'explored'
                  ? 'bg-teal-950 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Explored Set ({searchData?.nodes_explored || 0} Nodes)
            </button>
          </div>
        </div>

        {/* Tab 1: Synthesized Winning Solution Path */}
        {activeBottomTab === 'solution' && (
          <div>
            {searchData?.action_names && searchData.action_names.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {searchData.action_names.map((act, i) => {
                  const visuals = getActionVisuals(undefined, act);
                  const Icon = visuals.icon;
                  return (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex items-center gap-2.5 text-xs shadow-sm"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono text-[10px] flex items-center justify-center font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className={`p-1 rounded-md ${visuals.bg} ${visuals.border} border shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${visuals.color}`} />
                      </div>
                      <span className="text-slate-200 font-medium truncate">{act}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 py-3 text-center">
                No solution path synthesized for this search run.
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Frontier Open Set Chips */}
        {activeBottomTab === 'frontier' && (
          <div>
            {currentStep?.frontier && currentStep.frontier.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentStep.frontier.map((nodeId) => {
                  const nodeObj = searchData?.tree_nodes?.find((n) => n.id === nodeId);
                  const isSelected = activeInspectedNode?.id === nodeId;
                  return (
                    <button
                      key={nodeId}
                      onClick={() => setSelectedNodeId(nodeId)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-2 transition cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                          : 'bg-slate-900/90 border-slate-800 hover:border-indigo-400 text-slate-300'
                      }`}
                    >
                      <span className="font-bold text-indigo-400">{nodeId}</span>
                      <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
                        {nodeObj?.action_name || nodeObj?.label || 'Node'}
                      </span>
                      {nodeObj?.f_cost !== undefined && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-950 text-emerald-400 font-bold text-[10px]">
                          f:{nodeObj.f_cost}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs font-mono text-slate-500 py-3 text-center">
                Frontier queue is empty (or search completed).
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Explored Set (Closed Set) */}
        {activeBottomTab === 'explored' && (
          <div className="text-xs font-mono text-slate-400 leading-relaxed">
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(searchData?.tree_nodes || []).slice(0, currentStepIdx + 1).map((node, i) => (
                <button
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition cursor-pointer ${
                    activeInspectedNode?.id === node.id
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                      : winningNodeIds.has(node.id)
                      ? 'bg-teal-950/60 border-teal-500/40 text-teal-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={`${node.id}: ${node.action_name || node.label}`}
                >
                  {node.id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
