export interface TreeNodeData {
  id: string;
  label: string;
  action_id?: string;
  action_name?: string;
  action_category?: string;
  depth?: number;
  parent_id?: string | null;
  step_cost?: number;
  g_cost?: number;
  h_cost?: number;
  f_cost?: number;
  value?: number;
  is_goal?: boolean;
  is_max?: boolean;
  vitals?: {
    health: number;
    water: number;
    food: number;
    energy: number;
  };
  inventory?: {
    wood: number;
    rope: number;
    metal: number;
    tools: number;
    shelter_level: number;
  };
  boat_parts?: Record<string, boolean>;
  escape_progress?: number;
  vital_deltas?: Record<string, number>;
  ai_commentary?: string;
  path?: string[];
}

export interface TreeEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface VisStep {
  step: number;
  current_node?: string;
  depth?: number;
  g_cost?: number;
  h_cost?: number;
  f_cost?: number;
  limit?: number;
  iteration?: string;
  frontier?: string[];
  explored_count?: number;
  action?: string;
  step_narrative?: string;
}

export interface SearchResult {
  algorithm: string;
  success: boolean;
  status: string;
  path: string[];
  action_names: string[];
  cost: number;
  nodes_explored: number;
  max_frontier_size: number;
  execution_time_ms: number;
  depth: number;
  tree_nodes: TreeNodeData[];
  tree_edges: TreeEdgeData[];
  visualization_steps: VisStep[];
}

export interface AlgorithmBenchmark {
  algorithm: string;
  nodes_explored: number;
  cost: number;
  depth: number;
  execution_time_ms: number;
  max_frontier: number;
  success: boolean;
  result: string;
  completeness: string;
  optimality: string;
}

export interface PlanStep {
  step_number: number;
  action_id: string;
  action_name: string;
  category: string;
  reason: string;
  expected_energy_cost: number;
  expected_water_cost: number;
  expected_food_cost: number;
  risk: number;
}

export interface StrategicPlan {
  plan_id: string;
  goal: string;
  steps: PlanStep[];
  total_steps: number;
  estimated_total_cost: number;
  status: 'ACTIVE' | 'INVALIDATED' | 'COMPLETED' | string;
  invalidation_reason?: string;
}

export interface ReplanningResult {
  is_plan_valid: boolean;
  invalidation_reason?: string;
  broken_step_index?: number;
  old_plan: StrategicPlan;
  new_plan: StrategicPlan;
}

export interface BayesianStep {
  evidence_id: string;
  evidence_name: string;
  prior_before: number;
  likelihood_h: number;
  likelihood_not_h: number;
  marginal_pe: number;
  posterior_after: number;
}

export interface BayesianResult {
  hypothesis_id: string;
  hypothesis_name: string;
  initial_prior: number;
  final_posterior: number;
  percentage: number;
  update_steps: BayesianStep[];
  observed_count: number;
}

export interface TriggeredRule {
  rule_id: string;
  antecedents: string[];
  consequent: string;
  description: string;
  recommendation: string;
  priority: number;
}

export interface ForwardChainingResult {
  initial_facts: string[];
  derived_facts: string[];
  all_facts: string[];
  triggered_rules: TriggeredRule[];
  recommendations: string[];
  iterations: number;
}

export interface GoalNode {
  name: string;
  description: string;
  satisfied: boolean;
  action_hint?: string;
  subgoals: GoalNode[];
}

export interface BackwardChainingResult {
  root_goal: string;
  goal_tree: GoalNode;
  total_subgoals: number;
  satisfied_subgoals: number;
  completion_percentage: number;
  next_logical_action?: string;
}
