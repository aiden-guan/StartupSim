export type MarketTrait =
  | "early_adopter"
  | "platform_hub"
  | "viral"
  | "enterprise"
  | "high_value"
  | "community_driven"
  | "regulated";

export interface MarketSegmentDefinition {
  id: string;
  name: string;
  verticals: string[];
  value: number; // 1-5 economic value ($)
  resistance: number; // 1-6 adoption difficulty
  load: number; // 1-4 scale capacity consumed
  trait?: MarketTrait;
  productAffinities?: Record<string, number>; // -2 to +2
  userPotential?: number; // base users per point of share
}

export interface MarketTemplateNode {
  id: string;
  segmentId: string;
  x: number;
  y: number;
}

export interface MarketEdge {
  a: string;
  b: string;
}

export interface MarketTemplate {
  id: string;
  name: string;
  verticals: string[];
  nodes: MarketTemplateNode[];
  edges: MarketEdge[];
  defaultPlayerBeachhead: string;
  defaultRivalBeachhead: string;
}

export interface MarketNodeState {
  id: string;
  segmentId: string;
  name: string;
  value: number;
  resistance: number;
  load: number;
  trait?: MarketTrait;
  x: number;
  y: number;
  playerInfluence: number;
  rivalInfluence: number;
  playerShare: number; // 0 - 100
  rivalShare: number; // 0 - 100
  neutralShare: number; // 0 - 100
  playerDominated: boolean;
  rivalDominated: boolean;
  playerIsolated: boolean;
  rivalIsolated: boolean;
  isPlayerBeachhead: boolean;
  isRivalBeachhead: boolean;
}

export interface MarketSession {
  id: string;
  productId: string;
  competitorId: string;
  turn: number;
  maxTurns: number;
  turnsLeft: number;
  totalTurns: number;
  templateId: string;
  nodes: MarketNodeState[];
  edges: MarketEdge[];
  playerBeachhead: string;
  rivalBeachhead: string;
  current: "player" | "rival";
  selectedNodeId: string | null;
  playerScaleCapacity: number;
  rivalScaleCapacity: number;
  playerScaleUsed: number;
  rivalScaleUsed: number;
  firstMarket: boolean;
  lastRivalMove?: {
    action: "expand" | "reinforce";
    nodeId: string;
    nodeName: string;
  } | null;
  tutorialStep?: number;
  pieces?: { id: string; owner: "player" | "ai"; moves: number; health: number }[];
  tiles?: any[];
}

export interface MarketSegmentResult {
  id: string;
  name: string;
  playerShare: number;
  rivalShare: number;
  value: number;
  userPotential: number;
}

export interface MarketEntryResult {
  productId: string;
  share: number; // 0-100% weighted penetration
  penetration: number; // 0.0 - 1.0
  rivalRemainingShare: number;
  users: number;
  revenue: number;
  inference: number;
  grossProfit: number;
  hype: number;
  outcome: string;
  outcomeType: "routed" | "weak" | "foothold" | "competitive" | "strong" | "leader" | "market-rout";
  topSegment: string;
  rivalName: string;
  segments: MarketSegmentResult[];
}
