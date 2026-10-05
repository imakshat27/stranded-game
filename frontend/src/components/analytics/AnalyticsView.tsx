import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';
import { Activity, UserCheck, ShieldAlert, Sparkles, TrendingUp, Compass } from 'lucide-react';
import { GameState } from '../../types/game';
import { api } from '../../services/api';

interface AnalyticsViewProps {
  gameState: GameState | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ gameState }) => {
  const [historyTimeline, setHistoryTimeline] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (gameState?.game_id) {
      setLoading(true);
      Promise.all([
        api.analytics.get(gameState.game_id),
        api.analytics.getHistory(gameState.game_id)
      ])
        .then(([overview, history]) => {
          setAnalyticsData(overview);
          setHistoryTimeline(history.timeline || []);
        })
        .catch((err) => console.error('Failed to fetch analytics:', err))
        .finally(() => setLoading(false));
    }
  }, [gameState?.game_id, gameState?.day]);

  // Fallback demo point if fresh session
  const timelineData = historyTimeline.length > 0 ? historyTimeline : [
    { day: 1, health: 100, water: 80, food: 75, energy: 90, escape_progress: 0, environmental_risk: 0.4 }
  ];

  const profile = gameState?.player_profile || {
    profile_type: 'Balanced',
    exploration_score: 0.5,
    risk_score: 0.3,
    resource_score: 0.5,
    total_actions: 0
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white tracking-wide">
            Telemetry, Profiling & Survival Analytics
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Chronological resource timelines, real-time behavioral classifier, and adaptive difficulty vector trends.
        </p>
      </div>

      {/* Behavioral Profile & Difficulty Vector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Player Profile Classification */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Player Behavioral Classification
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40">
              {profile.profile_type}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Exploration Frequency:</span>
                <span className="text-white font-bold">{Math.round((profile.exploration_score || 0) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.round((profile.exploration_score || 0) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Risk Tolerance Rating:</span>
                <span className="text-rose-400 font-bold">{Math.round((profile.risk_score || 0) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.round((profile.risk_score || 0) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Resource Preservation Efficiency:</span>
                <span className="text-cyan-400 font-bold">{Math.round((profile.resource_score || 0.5) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all"
                  style={{ width: `${Math.round((profile.resource_score || 0.5) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Adaptive Difficulty Vector */}
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Adaptive Difficulty Vector
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">4-Vector Matrix</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {gameState?.difficulty_profile && Object.entries(gameState.difficulty_profile).map(([key, val]) => (
              <div key={key}>
                <div className="flex justify-between text-slate-400 mb-1 capitalize">
                  <span>{key.replace('_', ' ')}:</span>
                  <span className="text-amber-300 font-bold">{Math.round(val * 100)}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-600 to-rose-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.round(val * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vital Timelines Chart */}
      <div className="glass-panel rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Biological Vitals History Across Days</span>
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="day" stroke="#94a3b8" label={{ value: 'Day', position: 'bottom', offset: 0, fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="health" name="Health" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="water" name="Water" stroke="#06b6d4" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="food" name="Food" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="energy" name="Energy" stroke="#eab308" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
