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
  contestPenalty?: number;
  fortified?: boolean;
}

export type MarketTactic = "pitch" | "fortify" | "blitz" | "viral" | "poach" | "pass";

export interface MarketLogEntry {
  id: string;
  turn: number;
  side: "player" | "rival" | "network";
  tactic: MarketTactic;
  nodeId: string;
  nodeName: string;
  summary: string;
  success: boolean;
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
  playerOps: number;
  playerMaxOps: number;
  bankedOps: number;
  rivalOps: number;
  playerDefensivePosture?: boolean;
  actionLog: MarketLogEntry[];
  lastRivalMove?: {
    action: "expand" | "reinforce" | "contest";
    nodeId: string;
    nodeName: string;
    success?: boolean;
    summary?: string;
  } | null;
  lastResolution?: MarketActionResult | null;
  playerMomentum?: number;
  rivalMomentum?: number;
  busy?: boolean;
  turnNonce?: number;
  tutorialStep?: number;
  pieces?: { id: string; owner: "player" | "ai"; moves: number; health: number }[];
  tiles?: any[];
}

export interface MarketActionResult {
  success: boolean;
  action: "expand" | "reinforce" | "contest" | "pass";
  tactic?: MarketTactic;
  opsCost?: number;
  nodeId: string;
  nodeName: string;
  side: "player" | "rival";
  territoryChanged: boolean;
  dominated: boolean;
  influenceDelta: number;
  momentumDelta: number;
  cashCost: number;
  factors: { label: string; weight: number }[];
  summary: string;
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
  operatingCost: number;
  grossProfit: number;
  netContribution: number;
  hype: number;
  outcome: string;
  outcomeType: "routed" | "weak" | "foothold" | "competitive" | "strong" | "leader" | "market-rout";
  topSegment: string;
  rivalName: string;
  segments: MarketSegmentResult[];
}
