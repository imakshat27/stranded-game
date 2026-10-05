export interface GameState {
  game_id: string;
  day: number;
  actions_remaining: number;
  turn_in_day: number;

  health: number;
  water: number;
  food: number;
  energy: number;

  shelter_level: number;

  wood: number;
  rope: number;
  metal: number;
  tools: number;

  escape_progress: number;
  boat_parts: {
    hull: boolean;
    rigging: boolean;
    rudder: boolean;
    provisions: boolean;
  };

  location: string;
  weather: 'clear' | 'cloudy' | 'rainy' | 'stormy' | string;
  discovered_locations: string[];
  active_effects: string[];
  current_objective: string;

  hints_remaining: number;
  hint_cooldown: number;
  hints_used: number;
  hints_earned: number;

  player_profile: {
    profile_type: string;
    exploration_score: number;
    risk_score: number;
    resource_score: number;
    total_actions: number;
    exploration_actions: number;
    risky_actions: number;
    rest_actions: number;
    crafting_actions: number;
  };

  difficulty_profile: {
    resource_scarcity: number;
    environmental_risk: number;
    exploration_risk: number;
    escape_complexity: number;
  };

  game_status: 'ACTIVE' | 'WON' | 'LOST';
  status_reason?: string;
  seed?: string;
  recent_events: string[];
  log_messages: Array<{
    day: number;
    action: string;
    message: string;
  }>;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  category: 'SURVIVAL' | 'EXPLORATION' | 'CRAFTING' | 'ESCAPE' | 'REST' | string;
  energy_cost: number;
  water_cost: number;
  food_cost: number;
  risk: number;
  prerequisites: Record<string, any>;
  effects: Record<string, any>;
  escape_progress: number;
  tags: string[];
}

export interface StateTransition {
  action_id: string;
  action_name: string;
  success: boolean;
  state_before: GameState;
  state_after: GameState;
  event_occurred?: {
    id: string;
    name: string;
    category: string;
    description: string;
    risk_level: number;
    resource_effects: Record<string, any>;
  };
  resource_changes: Record<string, number>;
  message: string;
  day_advanced: boolean;
}

export interface HintExplanation {
  recommended_action_id: string;
  recommended_action_name: string;
  summary: string;
  supporting_factors: string[];
  negative_factors: string[];
  strategic_objective: string;
  hints_remaining: number;
  cooldown_turns: number;
}
