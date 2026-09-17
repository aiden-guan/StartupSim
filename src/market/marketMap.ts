import { BALANCE } from "../config/balance";
import { competitors as competitorDefs, type CompetitorDef } from "../data/competitors";
import { modelById } from "../data/models";
import { primitiveById } from "../data/primitives";
import { PRICING_MODELS } from "../data/pricing";
import { GTM_STRATEGIES } from "../data/gtm";
import type { GameState, LaunchLevels, Product } from "../simulation/types";
import { launchCosts, requiredFor } from "../simulation/products";
import { calculateWeeklyProductOperations, gtmExecutionMultiplier, gtmFitAnalysis, marketDemandMultiplier } from "../simulation/gtm";
import type { Rng } from "../simulation/rng";
import { uid } from "../simulation/rng";
import { MARKET_SEGMENTS, selectTemplateForProduct } from "./templates";
import type {
  MarketEdge,
  MarketEntryResult,
  MarketNodeState,
  MarketSession,
} from "./types";

export function getNeighbors(edges: MarketEdge[], nodeId: string): string[] {
  const res: string[] = [];
  for (const e of edges) {
    if (e.a === nodeId) res.push(e.b);
    else if (e.b === nodeId) res.push(e.a);
  }
  return res;
}

export function calculateShares(
  playerInfluence: number,
  rivalInfluence: number,
  resistance: number,
  playerDominated: boolean,
  rivalDominated: boolean,
): { playerShare: number; rivalShare: number; neutralShare: number } {
  if (playerDominated) {
    const denom = playerInfluence + Math.max(1, resistance * 0.5);
    const pShare = Math.min(100, Math.round((playerInfluence / denom) * 100));
    return { playerShare: pShare, rivalShare: 0, neutralShare: 100 - pShare };
  }
  if (rivalDominated) {
    const denom = rivalInfluence + Math.max(1, resistance * 0.5);
    const rShare = Math.min(100, Math.round((rivalInfluence / denom) * 100));
    return { playerShare: 0, rivalShare: rShare, neutralShare: 100 - rShare };
  }

  const denom = playerInfluence + rivalInfluence + resistance;
  if (denom <= 0) return { playerShare: 0, rivalShare: 0, neutralShare: 100 };

  let pShare = Math.round((playerInfluence / denom) * 100);
  let rShare = Math.round((rivalInfluence / denom) * 100);

  if (pShare + rShare > 100) {
    const scale = 100 / (pShare + rShare);
    pShare = Math.floor(pShare * scale);
    rShare = Math.floor(rShare * scale);
  }

  const nShare = Math.max(0, 100 - pShare - rShare);
  return { playerShare: pShare, rivalShare: rShare, neutralShare: nShare };
}

export function isMeaningfulFoothold(
  node: MarketNodeState,
  side: "player" | "rival",
): boolean {
  if (side === "player") {
    if (node.isPlayerBeachhead) return true;
    if (node.playerDominated) return true;
    return node.playerInfluence >= 2 && node.playerShare >= 20;
  } else {
    if (node.isRivalBeachhead) return true;
    if (node.rivalDominated) return true;
    return node.rivalInfluence >= 2 && node.rivalShare >= 20;
  }
}

export function recomputeScaleLoads(session: MarketSession): void {
  let pLoad = 0;
  let rLoad = 0;
  for (const node of session.nodes) {
    if (isMeaningfulFoothold(node, "player")) {
      pLoad += node.load;
    }
    if (isMeaningfulFoothold(node, "rival")) {
      rLoad += node.load;
    }
  }
  session.playerScaleUsed = pLoad;
  session.rivalScaleUsed = rLoad;
}

export function recomputeIsolation(session: MarketSession): void {
  const pBeach = session.nodes.find((n) => n.id === session.playerBeachhead);
  const rBeach = session.nodes.find((n) => n.id === session.rivalBeachhead);

  // Helper to find reachable nodes from starting seeds through friendly held nodes
  const findReachable = (
    seeds: string[],
    side: "player" | "rival",
  ): Set<string> => {
    const reachable = new Set<string>();
    const queue = [...seeds];
    for (const s of queue) reachable.add(s);

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const nbrId of getNeighbors(session.edges, current)) {
        if (!reachable.has(nbrId)) {
          const nbrNode = session.nodes.find((n) => n.id === nbrId);
          if (nbrNode && isMeaningfulFoothold(nbrNode, side)) {
            reachable.add(nbrId);
            queue.push(nbrId);
          }
        }
      }
    }
    return reachable;
  };

  // Player isolation
  let pConnected = new Set<string>();
  if (pBeach && !pBeach.rivalDominated && pBeach.playerInfluence > 0) {
    pConnected = findReachable([pBeach.id], "player");
  } else {
    // Beachhead was lost - find largest friendly cluster
    let bestCluster = new Set<string>();
    for (const node of session.nodes) {
      if (isMeaningfulFoothold(node, "player") && !bestCluster.has(node.id)) {
        const cluster = findReachable([node.id], "player");
        if (cluster.size > bestCluster.size) bestCluster = cluster;
      }
    }
    pConnected = bestCluster;
  }

  // Rival isolation
  let rConnected = new Set<string>();
  if (rBeach && !rBeach.playerDominated && rBeach.rivalInfluence > 0) {
    rConnected = findReachable([rBeach.id], "rival");
  } else {
    let bestCluster = new Set<string>();
    for (const node of session.nodes) {
      if (isMeaningfulFoothold(node, "rival") && !bestCluster.has(node.id)) {
        const cluster = findReachable([node.id], "rival");
        if (cluster.size > bestCluster.size) bestCluster = cluster;
      }
    }
    rConnected = bestCluster;
  }

  for (const node of session.nodes) {
    const hasPlayer = node.playerInfluence > 0;
    node.playerIsolated = hasPlayer && !pConnected.has(node.id);

    const hasRival = node.rivalInfluence > 0;
    node.rivalIsolated = hasRival && !rConnected.has(node.id);
  }
}

export function recomputeDominance(session: MarketSession, nodeId: string): void {
  const node = session.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const shares = calculateShares(
    node.playerInfluence,
    node.rivalInfluence,
    node.resistance,
    node.playerDominated,
    node.rivalDominated,
  );
  node.playerShare = shares.playerShare;
  node.rivalShare = shares.rivalShare;
  node.neutralShare = shares.neutralShare;

  // Dominance trigger condition
  // Player dominates rival
  if (
    node.playerShare >= 60 &&
    node.playerInfluence >= Math.max(3, node.resistance) &&
    (node.rivalInfluence === 0 || node.playerInfluence >= 2.5 * node.rivalInfluence)
  ) {
    node.playerDominated = true;
    node.rivalDominated = false;
    node.rivalInfluence = 0;
    const reShare = calculateShares(
      node.playerInfluence,
      0,
      node.resistance,
      true,
      false,
    );
    node.playerShare = reShare.playerShare;
    node.rivalShare = 0;
    node.neutralShare = reShare.neutralShare;
  } else if (
    node.rivalShare >= 60 &&
    node.rivalInfluence >= Math.max(3, node.resistance) &&
    (node.playerInfluence === 0 || node.rivalInfluence >= 2.5 * node.playerInfluence)
  ) {
    node.rivalDominated = true;
    node.playerDominated = false;
    node.playerInfluence = 0;
    const reShare = calculateShares(
      0,
      node.rivalInfluence,
      node.resistance,
      false,
      true,
    );
    node.playerShare = 0;
    node.rivalShare = reShare.rivalShare;
    node.neutralShare = reShare.neutralShare;
  } else {
    // If neither side meets full dominance ratio, remove dominance flag if lost
    if (node.playerDominated && node.playerShare < 50) {
      node.playerDominated = false;
    }
    if (node.rivalDominated && node.rivalShare < 50) {
      node.rivalDominated = false;
    }
  }
}

export function recomputeAllNetwork(session: MarketSession): void {
  for (const node of session.nodes) {
    recomputeDominance(session, node.id);
  }
  recomputeIsolation(session);
  recomputeScaleLoads(session);
}

export function getConnectedSupport(
  session: MarketSession,
  nodeId: string,
  side: "player" | "rival",
): number {
  let support = 0;
  const nbrs = getNeighbors(session.edges, nodeId);
  for (const nbrId of nbrs) {
    const nbrNode = session.nodes.find((n) => n.id === nbrId);
    if (!nbrNode) continue;
    const isFriendly = side === "player"
      ? (nbrNode.playerShare >= 48 || nbrNode.playerDominated) && !nbrNode.playerIsolated
      : (nbrNode.rivalShare >= 48 || nbrNode.rivalDominated) && !nbrNode.rivalIsolated;

    if (isFriendly) {
      support += 1;
      // Trait bonus: VIRAL gives +1 additional support when dominated
      if (
        nbrNode.trait === "viral" &&
        ((side === "player" && nbrNode.playerDominated) ||
          (side === "rival" && nbrNode.rivalDominated))
      ) {
        support += 1;
      }
    }
  }
  return Math.min(3, support);
}

export function getProductFit(
  node: MarketNodeState,
  combo: [string, string],
): number {
  const def = MARKET_SEGMENTS[node.segmentId];
  if (!def || !def.productAffinities) return 0;
  let score = 0;
  for (const part of combo) {
    if (def.productAffinities[part]) {
      score += def.productAffinities[part]!;
    }
  }
  return Math.max(-2, Math.min(2, score));
}

export interface InfluenceBreakdown {
  base: number;
  fit: number;
  support: number;
  overloadPenalty: number;
  isolationPenalty: number;
  totalInfluence: number;
}

export function calculateInfluence(
  session: MarketSession,
  nodeId: string,
  side: "player" | "rival",
  action: "expand" | "reinforce",
  capabilityLevel: number,
  combo: [string, string],
): InfluenceBreakdown {
  const node = session.nodes.find((n) => n.id === nodeId);
  if (!node) {
    return {
      base: 0,
      fit: 0,
      support: 0,
      overloadPenalty: 0,
      isolationPenalty: 0,
      totalInfluence: 0,
    };
  }

  // Capability gives base conversion power
  const base = action === "reinforce"
    ? 3 + Math.round(capabilityLevel * 1.5)
    : 3 + Math.round(capabilityLevel * 1.2);

  const fit = getProductFit(node, combo);
  const support = getConnectedSupport(session, nodeId, side);

  const used = side === "player" ? session.playerScaleUsed : session.rivalScaleUsed;
  const cap = side === "player" ? session.playerScaleCapacity : session.rivalScaleCapacity;
  const excess = Math.max(0, used - cap);
  const overloadPen = Math.min(0.35, excess * 0.06);

  const isIso = side === "player" ? node.playerIsolated : node.rivalIsolated;
  const isoPen = isIso ? 0.25 : 0;

  // Resistance factor: high resistance slows down expansion
  const resFactor = Math.max(1, node.resistance * 0.35);

  let raw = (base + fit + support) * (1 - overloadPen) * (1 - isoPen);
  raw = Math.max(1, Math.round(raw / resFactor));

  return {
    base,
    fit,
    support,
    overloadPenalty: Math.round(overloadPen * 100),
    isolationPenalty: Math.round(isoPen * 100),
    totalInfluence: Math.max(1, raw),
  };
}

export function previewAction(
  session: MarketSession,
  nodeId: string,
  side: "player" | "rival",
  action: "expand" | "reinforce",
  capabilityLevel: number,
  combo: [string, string],
): {
  projectedPlayerShare: number;
  projectedRivalShare: number;
  influenceToAdd: number;
  breakdown: InfluenceBreakdown;
  willDominate: boolean;
} {
  const node = session.nodes.find((n) => n.id === nodeId);
  if (!node) {
    return {
      projectedPlayerShare: 0,
      projectedRivalShare: 0,
      influenceToAdd: 0,
      breakdown: {
        base: 0,
        fit: 0,
        support: 0,
        overloadPenalty: 0,
        isolationPenalty: 0,
        totalInfluence: 0,
      },
      willDominate: false,
    };
  }

  const breakdown = calculateInfluence(
    session,
    nodeId,
    side,
    action,
    capabilityLevel,
    combo,
  );

  const pInf = side === "player"
    ? node.playerInfluence + breakdown.totalInfluence
    : node.playerInfluence;
  const rInf = side === "rival"
    ? node.rivalInfluence + breakdown.totalInfluence
    : node.rivalInfluence;

  // Test dominance
  let pDom = node.playerDominated;
  let rDom = node.rivalDominated;
  let finalPInf = pInf;
  let finalRInf = rInf;

  const testShares = calculateShares(pInf, rInf, node.resistance, pDom, rDom);
  let willDominate = false;

  if (
    side === "player" &&
    testShares.playerShare >= 60 &&
    pInf >= Math.max(3, node.resistance) &&
    (rInf === 0 || pInf >= 2.5 * rInf)
  ) {
    willDominate = true;
    pDom = true;
    rDom = false;
    finalRInf = 0;
  } else if (
    side === "rival" &&
    testShares.rivalShare >= 60 &&
    rInf >= Math.max(3, node.resistance) &&
    (pInf === 0 || rInf >= 2.5 * pInf)
  ) {
    willDominate = true;
    rDom = true;
    pDom = false;
    finalPInf = 0;
  }

  const finalShares = calculateShares(
    finalPInf,
    finalRInf,
    node.resistance,
    pDom,
    rDom,
  );

  return {
    projectedPlayerShare: finalShares.playerShare,
    projectedRivalShare: finalShares.rivalShare,
    influenceToAdd: breakdown.totalInfluence,
    breakdown,
    willDominate,
  };
}

export function getLegalMoves(
  session: MarketSession,
  side: "player" | "rival",
  distributionLevel: number,
): { expand: string[]; reinforce: string[] } {
  const expand: string[] = [];
  const reinforce: string[] = [];

  const friendlyFootholds = session.nodes.filter((n) =>
    side === "player"
      ? n.playerInfluence > 0 || n.isPlayerBeachhead
      : n.rivalInfluence > 0 || n.isRivalBeachhead
  );

  // If no footholds, allow beachhead
  if (!friendlyFootholds.length) {
    const bId = side === "player" ? session.playerBeachhead : session.rivalBeachhead;
    return { expand: [bId], reinforce: [] };
  }

  for (const node of session.nodes) {
    const hasPresence = side === "player" ? node.playerInfluence > 0 : node.rivalInfluence > 0;
    const isEnemyDominated = side === "player" ? node.rivalDominated : node.playerDominated;

    if (isEnemyDominated) {
      continue;
    }

    if (hasPresence) {
      reinforce.push(node.id);
    } else {
      // Check if reachable via adjacent friendly nodes
      const nbrs = getNeighbors(session.edges, node.id);
      const isAdjacentToFriendly = nbrs.some((nbrId) =>
        session.nodes.some((n) =>
          n.id === nbrId &&
          (side === "player" ? isMeaningfulFoothold(n, "player") : isMeaningfulFoothold(n, "rival"))
        )
      );

      if (isAdjacentToFriendly) {
        expand.push(node.id);
      } else if (distributionLevel >= 3) {
        // High Distribution allows 2-hop expansion
        const isTwoHops = nbrs.some((nbrId) => {
          const secondNbrs = getNeighbors(session.edges, nbrId);
          return secondNbrs.some((snId) =>
            session.nodes.some((n) =>
              n.id === snId &&
              (side === "player" ? isMeaningfulFoothold(n, "player") : isMeaningfulFoothold(n, "rival"))
            )
          );
        });
        if (isTwoHops) {
          expand.push(node.id);
        }
      }
    }
  }

  return { expand, reinforce };
}

export function applyAction(
  session: MarketSession,
  nodeId: string,
  side: "player" | "rival",
  action: "expand" | "reinforce",
  capabilityLevel: number,
  combo: [string, string],
): void {
  const node = session.nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const preview = previewAction(
    session,
    nodeId,
    side,
    action,
    capabilityLevel,
    combo,
  );

  if (side === "player") {
    node.playerInfluence += preview.influenceToAdd;
  } else {
    node.rivalInfluence += preview.influenceToAdd;
  }

  recomputeDominance(session, nodeId);
  recomputeAllNetwork(session);
}

export function designCompetitorProductLevels(
  product: Product,
  difficulty: number,
): LaunchLevels {
  const levels: LaunchLevels = { deployment: 0, capability: 0, distribution: 0 };
  const scale = 0.75 + difficulty * 0.25;
  const pts = {
    engineering: product.points.engineering * scale,
    product: product.points.product * scale,
    growth: product.points.growth * scale,
    research: product.points.research * scale,
  };

  const stats: ("deployment" | "capability" | "distribution")[] = [
    "capability",
    "deployment",
    "distribution",
  ];
  for (let i = 0; i < 18; i++) {
    const s = stats[i % stats.length]!;
    const mockP: Product = { ...product, levels: { ...levels }, points: { ...pts } };
    const cost = launchCosts(mockP)[s];
    if (levels[s] < 10 && requiredFor(s).every((k) => pts[k] >= cost)) {
      for (const k of requiredFor(s)) pts[k] -= cost;
      levels[s] += 1;
    }
  }
  return levels;
}

export function startMarketSession(
  state: GameState,
  product: Product,
  rng: Rng,
): MarketSession {
  const first = !state.company.seenMarket;
  const template = selectTemplateForProduct(
    product.vertical,
    product.combo,
    first,
  );

  // Pick competitor
  const comp = rng.pick(state.competitors.filter((c) => !c.disabled)) ?? state.competitors[0]!;
  product.competitorId = comp.id;
  const def = competitorDefs.find((d) => d.id === comp.id);
  const rivalLevels = designCompetitorProductLevels(
    product,
    first ? 0 : def?.difficulty ?? 1,
  );

  const playerBeachhead = template.defaultPlayerBeachhead;
  const rivalBeachhead = template.defaultRivalBeachhead;

  const nodes: MarketNodeState[] = template.nodes.map((tn) => {
    const seg = MARKET_SEGMENTS[tn.segmentId] ?? {
      id: tn.segmentId,
      name: tn.segmentId,
      verticals: [],
      value: 2,
      resistance: 2,
      load: 2,
    };

    const isPlayerBeach = tn.id === playerBeachhead;
    const isRivalBeach = tn.id === rivalBeachhead;

    // Beachheads start with strong starting foothold
    const pInf = isPlayerBeach ? 6 + product.levels.capability : 0;
    const rInf = isRivalBeach ? 6 + rivalLevels.capability : 0;

    const shares = calculateShares(
      pInf,
      rInf,
      seg.resistance,
      isPlayerBeach && rInf === 0,
      isRivalBeach && pInf === 0,
    );

    return {
      id: tn.id,
      segmentId: seg.id,
      name: seg.name,
      value: seg.value,
      resistance: seg.resistance,
      load: seg.load,
      trait: seg.trait,
      x: tn.x,
      y: tn.y,
      playerInfluence: pInf,
      rivalInfluence: rInf,
      playerShare: shares.playerShare,
      rivalShare: shares.rivalShare,
      neutralShare: shares.neutralShare,
      playerDominated: isPlayerBeach,
      rivalDominated: isRivalBeach,
      playerIsolated: false,
      rivalIsolated: false,
      isPlayerBeachhead: isPlayerBeach,
      isRivalBeachhead: isRivalBeach,
    };
  });

  const session: MarketSession = {
    id: uid(rng, "ms"),
    productId: product.id,
    competitorId: comp.id,
    turn: 1,
    maxTurns: BALANCE.MARKET_MAX_TURNS,
    turnsLeft: BALANCE.MARKET_MAX_TURNS,
    totalTurns: BALANCE.MARKET_MAX_TURNS,
    templateId: template.id,
    nodes,
    edges: [...template.edges],
    playerBeachhead,
    rivalBeachhead,
    current: "player",
    selectedNodeId: playerBeachhead,
    playerScaleCapacity: 4 + product.levels.deployment * 2,
    rivalScaleCapacity: 4 + (first ? 0 : def?.difficulty ?? 1) * 2,
    playerScaleUsed: 0,
    rivalScaleUsed: 0,
    firstMarket: first,
    lastRivalMove: null,
    tutorialStep: first ? 0 : 99,
    pieces: [
      { id: playerBeachhead, owner: "player", moves: 1, health: 4 },
      { id: rivalBeachhead, owner: "ai", moves: 1, health: 4 },
    ],
    tiles: nodes.map((n) => ({
      id: n.id,
      owner: n.playerDominated ? "player" : n.rivalDominated ? "ai" : null,
      captured: n.playerInfluence,
    })),
  };

  recomputeAllNetwork(session);
  return session;
}

export function checkRoutStatus(
  session: MarketSession,
): "player_rout" | "rival_rout" | null {
  const totalPlayerInf = session.nodes.reduce((s, n) => s + n.playerInfluence, 0);
  const totalRivalInf = session.nodes.reduce((s, n) => s + n.rivalInfluence, 0);

  if (totalPlayerInf <= 0) return "player_rout";
  if (totalRivalInf <= 0) return "rival_rout";
  return null;
}

export function shouldEndSession(session: MarketSession): string | null {
  const rout = checkRoutStatus(session);
  if (rout === "rival_rout") {
    return "Market Rout! The competitor has been eliminated from the category.";
  }
  if (rout === "player_rout") {
    return "Launch Routed! Your product has been pushed out of the category.";
  }
  if (session.turnsLeft <= 0) {
    return "Market entry concluded. The window has closed.";
  }
  return null;
}

export function getOverallShares(session: MarketSession): {
  player: number;
  rival: number;
  neutral: number;
} {
  let totalWeight = 0;
  let pWeighted = 0;
  let rWeighted = 0;
  let nWeighted = 0;

  for (const node of session.nodes) {
    const w = Math.max(1, node.value);
    totalWeight += w;
    pWeighted += node.playerShare * w;
    rWeighted += node.rivalShare * w;
    nWeighted += node.neutralShare * w;
  }

  if (totalWeight <= 0) return { player: 0, rival: 0, neutral: 100 };
  return {
    player: Math.round(pWeighted / totalWeight),
    rival: Math.round(rWeighted / totalWeight),
    neutral: Math.round(nWeighted / totalWeight),
  };
}

export function aiSelectMove(
  session: MarketSession,
  rng: Rng,
  rivalDef: CompetitorDef,
  rivalLevels: LaunchLevels,
): { action: "expand" | "reinforce"; nodeId: string } | null {
  const legal = getLegalMoves(session, "rival", rivalLevels.distribution);
  const allMoves: { action: "expand" | "reinforce"; nodeId: string }[] = [
    ...legal.expand.map((id) => ({ action: "expand" as const, nodeId: id })),
    ...legal.reinforce.map((id) => ({ action: "reinforce" as const, nodeId: id })),
  ];

  if (!allMoves.length) return null;

  const personality = session.firstMarket ? "opportunistic" : rivalDef.personality;

  // Score candidate moves
  let bestMove: (typeof allMoves)[0] | null = null;
  let bestScore = -9999;

  for (const move of allMoves) {
    const node = session.nodes.find((n) => n.id === move.nodeId);
    if (!node) continue;

    const preview = previewAction(
      session,
      move.nodeId,
      "rival",
      move.action,
      rivalLevels.capability,
      ["chat", "api"],
    );

    let score = 0;

    // 1. Dominance opportunity
    if (preview.willDominate) {
      score += 55;
    }

    // 2. Prevent player from dominating this node
    if (
      node.playerInfluence > node.rivalInfluence &&
      node.playerShare >= 50 &&
      !node.playerDominated
    ) {
      score += 35;
    }

    // 3. Reconnect an isolated rival node
    if (node.rivalIsolated && move.action === "reinforce") {
      score += 30;
    }

    // 4. Value of node
    score += node.value * 7;

    // 5. Cheap expansion bonus
    if (move.action === "expand") {
      score += Math.max(0, 15 - node.resistance * 2);
    }

    // 6. Connected support & Hub control
    const support = getConnectedSupport(session, move.nodeId, "rival");
    score += support * 6;
    if (node.trait === "platform_hub") {
      score += 12;
    }

    // 7. Scale overload management
    const wouldAddLoad = move.action === "expand" ? node.load : 0;
    const projectedLoad = session.rivalScaleUsed + wouldAddLoad;
    if (projectedLoad > session.rivalScaleCapacity) {
      const excess = projectedLoad - session.rivalScaleCapacity;
      score -= excess * 10;
    }

    // Personality adjustments
    if (personality === "aggressive") {
      if (node.playerInfluence > 0) score += 20;
      if (preview.willDominate) score += 25;
      if (projectedLoad > session.rivalScaleCapacity) score += 5; // Tolerates overload
    } else if (personality === "expansionist") {
      if (move.action === "expand") score += 22;
      if (node.trait === "platform_hub") score += 15;
    } else if (personality === "defensive") {
      if (move.action === "reinforce") score += 25;
      if (node.id === session.rivalBeachhead) score += 30;
      if (projectedLoad > session.rivalScaleCapacity) score -= 25; // Strongly avoids overload
    } else if (personality === "opportunistic") {
      if (node.playerIsolated) score += 30;
      if (node.resistance <= 2) score += 15;
    }

    // Tie-breaking with small deterministic seeded float
    score += rng.float(0, 1);

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

export function executeRivalTurn(
  session: MarketSession,
  rng: Rng,
  rivalLevels: LaunchLevels,
): void {
  const def = competitorDefs.find((d) => d.id === session.competitorId) ?? {
    id: session.competitorId,
    name: "Competitor",
    founder: "Founder",
    description: "",
    archetype: "bigtech",
    personality: "opportunistic" as const,
    skills: { product: 1, growth: 1, engineering: 1, research: 1 },
    focus: [],
    difficulty: 1,
    startingShare: 10,
  };

  const move = aiSelectMove(session, rng, def, rivalLevels);
  if (move) {
    const targetNode = session.nodes.find((n) => n.id === move.nodeId);
    applyAction(
      session,
      move.nodeId,
      "rival",
      move.action,
      rivalLevels.capability,
      ["chat", "api"],
    );
    session.lastRivalMove = {
      action: move.action,
      nodeId: move.nodeId,
      nodeName: targetNode?.name ?? "Market",
    };
  } else {
    session.lastRivalMove = null;
  }
}

export function calculateMarketEntryResult(
  state: GameState,
  session: MarketSession,
  product: Product,
): MarketEntryResult {
  const overall = getOverallShares(session);
  const penetration = overall.player / 100;
  const rout = checkRoutStatus(session);

  let outcomeType: MarketEntryResult["outcomeType"] = "competitive";
  let outcomeText = "Competitive launch. Footholds established.";

  if (rout === "rival_rout") {
    outcomeType = "market-rout";
    outcomeText = "Market Rout. Competitor eliminated from category.";
  } else if (rout === "player_rout" || overall.player <= 5) {
    outcomeType = "routed";
    outcomeText = "Launch Routed. The market adopted the alternative.";
  } else if (penetration >= 0.7) {
    outcomeType = "leader";
    outcomeText = "Category Leader. Decisive dominance across segments.";
  } else if (penetration >= 0.5) {
    outcomeType = "strong";
    outcomeText = "Strong Entry. Majority customer distribution secured.";
  } else if (penetration >= 0.35) {
    outcomeType = "competitive";
    outcomeText = "Competitive Entry. Solid foothold in core markets.";
  } else if (penetration >= 0.2) {
    outcomeType = "foothold";
    outcomeText = "Foothold Established. Niche position achieved.";
  } else {
    outcomeType = "weak";
    outcomeText = "Weak Entry. Struggling for traction.";
  }

  // Segment breakdown
  const segments = session.nodes.map((n) => {
    const segDef = MARKET_SEGMENTS[n.segmentId];
    const userPot = segDef?.userPotential ?? (n.load * 4000);
    return {
      id: n.id,
      name: n.name,
      playerShare: n.playerShare,
      rivalShare: n.rivalShare,
      value: n.value,
      userPotential: userPot,
    };
  });

  // Sort by playerShare descending to find top segment
  const sortedSegments = [...segments].sort((a, b) => b.playerShare - a.playerShare);
  const topSegment = sortedSegments[0]?.name ?? "Developers";

  // Scale by strategic launch outcome
  let outcomeMult = 1;
  let userOutcomeMult = 1;
  switch (outcomeType) {
    case "market-rout":
      outcomeMult = 1.4;
      userOutcomeMult = 1.3;
      break;
    case "leader":
      outcomeMult = 1.2;
      userOutcomeMult = 1.15;
      break;
    case "strong":
      outcomeMult = 1.0;
      userOutcomeMult = 1.0;
      break;
    case "competitive":
      outcomeMult = 0.8;
      userOutcomeMult = 0.8;
      break;
    case "foothold":
      outcomeMult = 0.45;
      userOutcomeMult = 0.5;
      break;
    case "weak":
      outcomeMult = 0.1;
      userOutcomeMult = 0.15;
      break;
    case "routed":
      outcomeMult = 0.02;
      userOutcomeMult = 0.05;
      break;
  }

  // Pricing model
  const pricing = PRICING_MODELS[product.businessModel] ?? PRICING_MODELS.freemium;
  const strategy = GTM_STRATEGIES[product.gtmStrategy] ?? GTM_STRATEGIES["product-led"];
  const fit = gtmFitAnalysis(state, product, strategy.id);
  const execution = gtmExecutionMultiplier(fit.score);
  const demand = marketDemandMultiplier(state, product);

  // Economics: Users
  const rawUsers = segments.reduce((sum, seg) => {
    return sum + seg.userPotential * (seg.playerShare / 100);
  }, 0);
  const scaleMult = 1 + product.levels.deployment * 0.15;
  const users = Math.max(0, Math.round(rawUsers * pricing.userMultiplier * strategy.volumeMultiplier * strategy.rampMultiplier * execution * demand * scaleMult * userOutcomeMult));

  // Inference cost
  const model = modelById[product.modelId];
  const pa = primitiveById[product.combo[0]];
  const pb = primitiveById[product.combo[1]];
  const weight = (pa?.computeWeight ?? 1) * (pb?.computeWeight ?? 1);
  const agenty = product.combo.includes("agent") || product.combo.includes("computer-use") ? 1.8 : 1;
  const baseTokensPerUser = BALANCE.BASE_TOKENS_PER_USER_WEEK ?? 7_000;
  const tokens = users * baseTokensPerUser * pricing.tokenMultiplier * weight * agenty;
  const price = model?.costPerMTok ?? 8;
  const efficiency = 1 + (state.company.technologies.includes("efficient-inference") ? -0.12 : 0);
  const weeklyInference = Math.round(((tokens * price) / 1_000_000) * Math.max(0.35, efficiency) * state.world.inferenceCostIndex);

  // Economics: Revenue
  const baseRevenue = segments.reduce((sum, seg) => {
    const shareFraction = seg.playerShare / 100;
    const segValMultiplier = Math.pow(seg.value, 1.5);
    return (
      sum +
      segValMultiplier *
        shareFraction *
        (BALANCE.BASE_REVENUE_PER_SHARE +
          BALANCE.EXTRA_REVENUE_PER_DIFFICULTY * (product.difficulty - 2)) *
        product.revenueScore *
        (product.recipeId === "generic" ? 0.7 : 1.15)
    );
  }, 0);

  const hypeMult = 1 + Math.max(0, Math.sqrt(state.company.hype) * BALANCE.HYPE_MULTIPLIER_SCALE);
  const disc = product.newDiscovery ? BALANCE.NEW_PRODUCT_MULTIPLIER : 1;
  const loc = 1 + state.company.locations.length * BALANCE.LOCATION_MULTIPLIER;
  const trust = Math.max(0.6, state.company.trust / 70);

  let econMultiplier = 1;
  switch (state.economy) {
    case "recession":
      econMultiplier = 0.55;
      break;
    case "slowdown":
    case "creditCrunch":
      econMultiplier = 0.75;
      break;
    case "boom":
      econMultiplier = 1.25;
      break;
    case "aiBubble":
      econMultiplier = 1.4;
      break;
  }

  // Base outcome normalization factor
  const outcomeNorm = 0.55;
  let calculatedRevenue = Math.round(
    baseRevenue * pricing.revenueMultiplier * strategy.revenueMultiplier * strategy.rampMultiplier * execution * demand * hypeMult * disc * econMultiplier * loc * trust * outcomeNorm * outcomeMult,
  );

  // If usage-based, enforce guaranteed cost-plus gross margin floor over inference
  if (pricing.costPlusMargin !== null && weeklyInference > 0) {
    const minCostPlusRevenue = Math.round(weeklyInference / (1 - pricing.costPlusMargin));
    calculatedRevenue = Math.max(calculatedRevenue, minCostPlusRevenue);
  }

  const weeklyRevenue = Math.max(0, calculatedRevenue);
  const operatingCost = calculateWeeklyProductOperations(state, product, users, weeklyRevenue, fit.score);
  const grossProfit = weeklyRevenue - weeklyInference;
  const netContribution = grossProfit - operatingCost;

  // Hype change
  let hype = pricing.hypeBonus;
  if (outcomeType === "market-rout") hype += 14;
  else if (outcomeType === "leader") hype += 10;
  else if (outcomeType === "strong") hype += 6;
  else if (outcomeType === "competitive") hype += 3;
  else if (outcomeType === "weak") hype += -2;
  else if (outcomeType === "routed") hype += -5;

  const comp = competitorDefs.find((c) => c.id === session.competitorId);

  return {
    productId: product.id,
    share: overall.player,
    penetration,
    rivalRemainingShare: overall.rival,
    users,
    revenue: weeklyRevenue,
    inference: weeklyInference,
    operatingCost,
    grossProfit,
    netContribution,
    hype,
    outcome: outcomeText,
    outcomeType,
    topSegment,
    rivalName: comp?.name ?? "Competitor",
    segments,
  };
}

export function applyMarketEntryResults(
  state: GameState,
  session: MarketSession,
  _rng: Rng,
): void {
  const product = state.products.find((p) => p.id === session.productId);
  if (!product) return;

  const result = calculateMarketEntryResult(state, session, product);

  product.marketShare = result.share;
  product.users = result.users;
  product.weeklyRevenue = result.revenue;
  product.weeklyInference = result.inference;
  product.weeklyOperatingCost = result.operatingCost;
  product.status = "active";
  product.competitorId = session.competitorId;

  // Reliability calculation
  const model = modelById[product.modelId];
  product.reliability = Math.min(
    0.98,
    0.5 + product.points.engineering / 400 + (model?.reliability ?? 5) / 20,
  );
  const strategy = GTM_STRATEGIES[product.gtmStrategy] ?? GTM_STRATEGIES["product-led"];
  const fit = gtmFitAnalysis(state, product, strategy.id);
  product.gtmFit = fit.score;
  product.retentionRate = Math.min(0.998, strategy.weeklyRetention + (product.reliability - 0.7) * 0.02 + (state.company.trust - 60) / 10_000);
  product.weeklyGrowthRate = strategy.weeklyGrowthRate;
  product.rampWeeks = strategy.rampWeeks;

  // Store compact market segment distribution on product
  product.marketSegments = result.segments.map((s) => ({
    id: s.id,
    name: s.name,
    share: s.playerShare,
    value: s.value,
  }));

  state.company.seenMarket = true;
  state.firstLaunchTick ??= state.clock.tick;
  state.company.productsLaunched += 1;
  state.stats.productsLaunched += 1;

  // Hype and Discovery
  state.company.hype = Math.max(0, state.company.hype + result.hype);
  if (
    product.recipeId !== "generic" &&
    !state.company.discoveredRecipes.includes(product.recipeId)
  ) {
    state.company.discoveredRecipes.push(product.recipeId);
    product.newDiscovery = true;
    state.company.hype += 8;
  }

  // Company expertise increments
  for (const part of product.combo) {
    state.company.expertise[part] = Math.min(
      11,
      (state.company.expertise[part] ?? 0) + 1,
    );
  }

  // Product version increment
  const v = (state.company.versions[product.name] ?? 0) + 1;
  state.company.versions[product.name] = v;
  product.version = v;
  if (v > 1) {
    product.name = `${product.name.replace(/ \d+$/, "")} ${v}`;
  }

  // Competitor consequence
  const comp = state.competitors.find((c) => c.id === session.competitorId);
  if (comp) {
    if (result.outcomeType === "market-rout") {
      comp.marketShare = Math.max(1, comp.marketShare - 3);
      comp.hype = Math.max(0, comp.hype - 15);
    } else if (result.outcomeType === "leader") {
      comp.marketShare = Math.max(1, comp.marketShare - 1.5);
      comp.hype = Math.max(0, comp.hype - 8);
    }
  }

  // Populate state.marketResult
  state.marketResult = {
    productId: product.id,
    share: result.share,
    penetration: result.penetration,
    capturedTiles: result.segments.filter((s) => s.playerShare >= 50).length,
    tileValue: result.segments.reduce((acc, s) => acc + (s.playerShare >= 50 ? s.value : 0), 0),
    revenue: result.revenue,
    inference: result.inference,
    users: result.users,
    hype: result.hype,
    outcome: result.outcome,
    outcomeType: result.outcomeType,
    topSegment: result.topSegment,
    rivalShare: result.rivalRemainingShare,
    rivalName: result.rivalName,
    segments: result.segments,
  };
}
