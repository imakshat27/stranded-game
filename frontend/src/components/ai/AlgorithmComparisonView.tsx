import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  BarChart3,
  Play,
  Zap,
  CheckCircle2,
  ShieldAlert,
  Cpu,
} from "lucide-react";
import { AlgorithmBenchmark } from "../../types/ai";
import { GameState } from "../../types/game";
import { api } from "../../services/api";

interface AlgorithmComparisonViewProps {
  gameState: GameState | null;
}

export const AlgorithmComparisonView: React.FC<
  AlgorithmComparisonViewProps
> = ({ gameState }) => {
  const [benchmarks, setBenchmarks] = useState<AlgorithmBenchmark[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const runBenchmark = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.ai.compare({
        gameId: gameState?.game_id,
        state: gameState || undefined,
        maxNodes: 350,
        maxDepth: 8,
      });
      setBenchmarks(data.comparison_table);
      setSummary(data.benchmark_summary);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The request failed. Please try again.",
      );
      console.error("Benchmark execution failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  const barColors = [
    "#80ac8d",
    "#86c9d2",
    "#e5bd7a",
    "#b3a4cf",
    "#d7a1ad",
    "#8cafc8",
  ];

  return (
    <div className="space-y-6">
      {error && (
        <div className="inline-error" role="alert">
          {error}
        </div>
      )}
      {/* Top Banner */}
      <div className="field-panel rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Algorithm Benchmark Comparison Suite
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical evaluation of BFS, DFS, IDS, UCS, Best-First, and A* on
              the identical island state space.
            </p>
          </div>

          <button
            onClick={runBenchmark}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Play
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            <span>{loading ? "Evaluating..." : "Run All Algorithms"}</span>
          </button>
        </div>

        {/* Academic Highlights */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="field-card rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                Fastest Algorithm
              </div>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {summary.fastest_algorithm}
              </div>
            </div>
            <div className="field-card rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                Least Nodes Explored
              </div>
              <div className="text-sm font-bold text-cyan-400 mt-1">
                {summary.least_nodes_explored}
              </div>
            </div>
            <div className="field-card rounded-xl p-3 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-mono">
                Cost Optimal Leader
              </div>
              <div className="text-sm font-bold text-amber-400 mt-1">
                {summary.lowest_cost}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Matrix Table */}
      <div className="field-panel rounded-lg p-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-3">
          Empirical Search Matrix (Table View)
        </h3>
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
              <th className="py-2.5 px-3">Algorithm</th>
              <th className="py-2.5 px-3">Nodes Explored</th>
              <th className="py-2.5 px-3">Solution Cost</th>
              <th className="py-2.5 px-3">Depth</th>
              <th className="py-2.5 px-3">Max Frontier</th>
              <th className="py-2.5 px-3">Time (ms)</th>
              <th className="py-2.5 px-3">Completeness</th>
              <th className="py-2.5 px-3">Optimality</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {benchmarks.map((row) => (
              <tr
                key={row.algorithm}
                className="hover:bg-slate-800/30 transition"
              >
                <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{row.algorithm}</span>
                </td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">
                  {row.nodes_explored}
                </td>
                <td className="py-2.5 px-3 text-cyan-300">{row.cost}</td>
                <td className="py-2.5 px-3 text-slate-300">{row.depth}</td>
                <td className="py-2.5 px-3 text-purple-400">
                  {row.max_frontier}
                </td>
                <td className="py-2.5 px-3 text-slate-300">
                  {row.execution_time_ms} ms
                </td>
                <td className="py-2.5 px-3 text-slate-400">
                  {row.completeness}
                </td>
                <td className="py-2.5 px-3 text-slate-400">{row.optimality}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      row.success
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                        : "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {row.result}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Recharts Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Nodes Explored Chart */}
        <div className="field-panel rounded-lg p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Nodes Explored (Efficiency Metric)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={benchmarks}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#263a3c" />
                <XAxis dataKey="algorithm" stroke="#a9bab5" fontSize={11} />
                <YAxis stroke="#a9bab5" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#122326",
                    borderColor: "#3b5354",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="nodes_explored" radius={[4, 4, 0, 0]}>
                  {benchmarks.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Execution Time Chart */}
        <div className="field-panel rounded-lg p-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Execution Speed (ms)</span>
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={benchmarks}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#263a3c" />
                <XAxis dataKey="algorithm" stroke="#a9bab5" fontSize={11} />
                <YAxis stroke="#a9bab5" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "#122326",
                    borderColor: "#3b5354",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="execution_time_ms" radius={[4, 4, 0, 0]}>
                  {benchmarks.map((_, i) => (
                    <Cell
                      key={i}
                      fill={barColors[(i + 2) % barColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
