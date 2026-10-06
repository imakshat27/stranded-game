import type { GameState } from "./game";
import type { TreeNodeData } from "./ai";
export type Provenance = "actual" | "simulated";
export interface JourneyNode {
  id: string;
  label: string;
  turn: number;
  action_id?: string;
  parent_id?: string;
  provenance: Provenance;
  state: GameState;
}
export interface JourneyData {
  nodes: JourneyNode[];
  edges: GraphEdge[];
  alternatives: JourneyNode[];
  current_turn: number;
  missing_snapshots: number;
}
export interface GraphNode extends TreeNodeData {
  provenance: Provenance;
  turn?: number;
  traversal?: "current" | "visited" | "frontier" | "unvisited";
  state?: GameState;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  provenance?: Provenance;
}
