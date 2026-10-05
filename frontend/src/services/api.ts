/**
 * API service for communicating with the Python FastAPI backend.
 * Uses environment variables for seamless deployment on Vercel / Render.
 */

import { GameState, Action, StateTransition, HintExplanation } from '../types/game';
import {
  SearchResult, AlgorithmBenchmark, StrategicPlan,
  ReplanningResult, BayesianResult, ForwardChainingResult,
  BackwardChainingResult
} from '../types/ai';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const json: ApiResponse<T> = await response.json();

    if (!response.ok || !json.success) {
      const errMessage = json.error?.message || `HTTP error ${response.status}: ${response.statusText}`;
      throw new Error(errMessage);
    }

    return json.data;
  } catch (error: any) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Game Lifecycle
  game: {
    start: (seed?: string) =>
      request<{ state: GameState; valid_actions: Action[] }>('/api/game/start', {
        method: 'POST',
        body: JSON.stringify({ seed })
      }),

    get: (gameId: string) =>
      request<{ state: GameState; valid_actions: Action[] }>(`/api/game/${gameId}`),

    action: (gameId: string, actionId: string) =>
      request<{ transition: StateTransition; state: GameState; valid_actions: Action[] }>(
        `/api/game/${gameId}/action`,
        {
          method: 'POST',
          body: JSON.stringify({ action_id: actionId })
        }
      ),

    hint: (gameId: string) =>
      request<{ hint: HintExplanation; state: GameState }>(`/api/game/${gameId}/hint`, {
        method: 'POST'
      }),

    restart: (gameId: string) =>
      request<{ state: GameState; valid_actions: Action[] }>(`/api/game/${gameId}/restart`, {
        method: 'POST'
      })
  },

  // AI Algorithms & Reasoning
  ai: {
    search: (params: {
      gameId?: string;
      state?: GameState;
      algorithm: string;
      maxDepth?: number;
      maxNodes?: number;
    }) =>
      request<SearchResult>('/api/ai/search', {
        method: 'POST',
        body: JSON.stringify({
          game_id: params.gameId,
          state: params.state,
          algorithm: params.algorithm,
          max_depth: params.maxDepth || 15,
          max_nodes: params.maxNodes || 1500
        })
      }),

    visualize: (params: {
      gameId?: string;
      state?: GameState;
      algorithm: string;
      maxDepth?: number;
      maxNodes?: number;
    }) =>
      request<SearchResult>('/api/ai/search/visualize', {
        method: 'POST',
        body: JSON.stringify({
          game_id: params.gameId,
          state: params.state,
          algorithm: params.algorithm,
          max_depth: params.maxDepth || 15,
          max_nodes: params.maxNodes || 1500
        })
      }),

    compare: (params: {
      gameId?: string;
      state?: GameState;
      algorithms?: string[];
      maxDepth?: number;
      maxNodes?: number;
    }) =>
      request<{
        comparison_table: AlgorithmBenchmark[];
        benchmark_summary: {
          fastest_algorithm: string;
          least_nodes_explored: string;
          lowest_cost: string;
        };
      }>('/api/ai/compare', {
        method: 'POST',
        body: JSON.stringify({
          game_id: params.gameId,
          state: params.state,
          algorithms: params.algorithms,
          max_depth: params.maxDepth || 12,
          max_nodes: params.maxNodes || 1000
        })
      }),

    plan: (gameId?: string, state?: GameState) =>
      request<StrategicPlan>('/api/ai/plan', {
        method: 'POST',
        body: JSON.stringify({ game_id: gameId, state })
      }),

    replan: (params: {
      gameId?: string;
      state?: GameState;
      currentPlan?: StrategicPlan;
      simulateStormDamage?: boolean;
    }) =>
      request<ReplanningResult>('/api/ai/replan', {
        method: 'POST',
        body: JSON.stringify({
          game_id: params.gameId,
          state: params.state,
          current_plan: params.currentPlan,
          simulate_storm_damage: params.simulateStormDamage || false
        })
      }),

    reason: (gameId?: string, state?: GameState) =>
      request<{
        forward_chaining: ForwardChainingResult;
        backward_chaining: BackwardChainingResult;
      }>('/api/ai/reason', {
        method: 'POST',
        body: JSON.stringify({ game_id: gameId, state })
      }),

    probability: (params: {
      gameId?: string;
      state?: GameState;
      scenario: 'storm' | 'salvage';
      observedSignals?: string[];
    }) =>
      request<BayesianResult>('/api/ai/probability', {
        method: 'POST',
        body: JSON.stringify({
          game_id: params.gameId,
          state: params.state,
          scenario: params.scenario,
          observed_signals: params.observedSignals
        })
      }),

    rival: (params: { algorithm: 'minimax' | 'alpha_beta'; depth?: number; playerAction?: string }) =>
      request<{
        algorithm: string;
        best_action: string;
        best_value: number;
        nodes_explored: number;
        pruned_branches?: number;
        depth: number;
        execution_time_ms: number;
        tree_nodes: any[];
        tree_edges: any[];
      }>('/api/ai/rival', {
        method: 'POST',
        body: JSON.stringify({
          algorithm: params.algorithm,
          depth: params.depth || 3,
          player_action: params.playerAction
        })
      })
  },

  // Analytics & History
  analytics: {
    get: (gameId: string) => request<any>(`/api/analytics/${gameId}`),
    getHistory: (gameId: string) => request<any>(`/api/analytics/${gameId}/history`)
  },

  // Knowledge Base
  knowledge: {
    get: (gameId: string) => request<any>(`/api/knowledge/${gameId}`),
    getFacts: (gameId: string) => request<{ game_id: string; facts: string[] }>(`/api/knowledge/${gameId}/facts`),
    getRules: (gameId: string) => request<{ rules: any[] }>(`/api/knowledge/${gameId}/rules`)
  }
};
