import { BALANCE } from "../config/balance";
import { competitors as competitorDefs } from "../data/competitors";
import { GTM_STRATEGIES } from "../data/gtm";
import { gtmFitAnalysis } from "../simulation/gtm";
import { setPause } from "../simulation/pause";
import type { GameState, LaunchLevels, Product } from "../simulation/types";
import { recordTutorialEvent } from "../simulation/tutorial";
import type { Rng } from "../simulation/rng";
import {
  aiSelectMove,
  applyAction,
  applyMarketEntryResults,
  calculateInfluence,
  designCompetitorProductLevels,
  getLegalMoves,
  getNeighbors,
  recomputeAllNetwork,
  recomputeDominance,
  shouldEndSession,
  type MarketPowerContext,
} from "./marketMap";
import type { MarketActionResult, MarketSession, MarketTactic } from "./types";
import { uid } from "../simulation/rng";

export function productQualityScore(product: Product): number {
  const pts = product.points.engineering + product.points.product + product.points.growth + product.points.research;
  return Math.min(12, pts / 70);
}

export function launchStrength(product: Product, state: GameState): number {
  const levels = product.levels.capability * 1.25 + product.levels.distribution * 1.05 + product.levels.deployment * 0.85;
  const quality = productQualityScore(product);
  const hype = Math.sqrt(Math.max(0, state.company.hype)) * 0.16;
  const fit = product.gtmFit / 28;
  return levels + quality + hype + fit;
}

export function marketPowerFor(state: GameState, product: Product, session: MarketSession, side: "player" | "rival"): MarketPowerContext {
  const rival = state.competitors.find((c) => c.id === session.competitorId);
  const def = competitorDefs.find((c) => c.id === session.competitorId);
  if (side === "player") {
    const strategy = GTM_STRATEGIES[product.gtmStrategy];
    const fit = gtmFitAnalysis(state, product, product.gtmStrategy).score;
    return {
      productQuality: productQualityScore(product),
      launchCapability: product.levels.capability,
      launchDistribution: product.levels.distribution,
      launchDeployment: product.levels.deployment,
      brand: state.company.prestige / 12 + state.company.hype / 40,
      hype: state.company.hype,
      momentum: session.playerMomentum ?? 0,
      gtmFit: fit,
      pricingPower: strategy?.revenueMultiplier ?? 1,
    };
  }
  return {
    productQuality: (def?.difficulty ?? 1) * 1.4 + (rival?.capability ?? 8) / 10,
    launchCapability: (def?.difficulty ?? 1) + 1,
    launchDistribution: def?.skills.growth ?? 1,
    launchDeployment: def?.difficulty ?? 1,
    brand: (rival?.hype ?? 8) / 8,
    hype: rival?.hype ?? 8,
    momentum: session.rivalMomentum ?? 0,
    gtmFit: 50 + (def?.difficulty ?? 1) * 8,
    pricingPower: 1,
  };
}

function finishSession(state: GameState, session: MarketSession, rng: Rng): void {
  applyMarketEntryResults(state, session, rng);
  state.marketBattle = null;
  setPause(state, "market", false);
  setPause(state, "results", true);
  recordTutorialEvent(state, "completedFirstMarket");
}

function summarize(result: Omit<MarketActionResult, "summary"> & { nodeName: string }): string {
  if (result.action === "pass") return `${result.side === "player" ? "You" : "The competitor"} passed the window.`;
  if (result.tactic === "blitz") return `PR Blitz decisively captured traction in ${result.nodeName}!`;
  if (result.tactic === "fortify") return `Reinforced your position in ${result.nodeName}.`;
  if (result.tactic === "viral") return `Viral loop triggered in ${result.nodeName}, cascading to adjacent segments.`;
  if (result.tactic === "poach") return `Directly poached market share from competitor in ${result.nodeName}.`;
  if (result.dominated) return `${result.nodeName} flipped. Decisive control changed hands.`;
  if (result.action === "contest") return `Contested ${result.nodeName}. The hold is no longer safe.`;
  if (result.action === "reinforce") return `Reinforced ${result.nodeName}. Preference deepened.`;
  return `Expanded into ${result.nodeName}.`;
}

function actionCalculation(
  state: GameState,
  session: MarketSession,
  side: "player" | "rival",
  action: "expand" | "reinforce" | "contest",
  nodeId: string,
  levels: LaunchLevels,
  combo: [string, string],
  tactic?: MarketTactic,
): {
  breakdown: ReturnType<typeof calculateInfluence>;
  power: MarketPowerContext;
} | null {
  const node = session.nodes.find((candidate) => candidate.id === nodeId);
  const product = state.products.find((candidate) => candidate.id === session.productId);
  if (!node || !product) return null;

  const power = marketPowerFor(state, product, session, side);
  const breakdown = calculateInfluence(
    session,
    nodeId,
    side,
    action === "contest" ? "expand" : action,
    levels.capability,
    combo,
    power,
    tactic,
  );
  return { breakdown, power };
}

function prepareSuccessfulAction(
  node: MarketSession["nodes"][number],
  side: "player" | "rival",
  action: "expand" | "reinforce" | "contest",
  tactic?: MarketTactic,
): void {
  if (action !== "contest" && tactic !== "poach") return;
  if (side === "player" && node.rivalDominated) {
    node.rivalDominated = false;
    node.rivalInfluence = Math.max(2, Math.round(node.rivalInfluence * 0.72));
  }
  if (side === "rival" && node.playerDominated) {
    node.playerDominated = false;
    node.playerInfluence = Math.max(2, Math.round(node.playerInfluence * 0.72));
  }
  if (tactic === "poach" && side === "player") {
    node.rivalInfluence = Math.max(0, Math.round(node.rivalInfluence * 0.65));
  }
}

function isLegalMarketAction(
  session: MarketSession,
  side: "player" | "rival",
  action: "expand" | "reinforce" | "contest",
  nodeId: string,
  distributionLevel: number,
): boolean {
  const legal = getLegalMoves(session, side, distributionLevel);
  return (action === "expand" && legal.expand.includes(nodeId))
    || (action === "reinforce" && legal.reinforce.includes(nodeId))
    || (action === "contest" && legal.contest.includes(nodeId));
}

export function previewSideAction(
  state: GameState,
  session: MarketSession,
  side: "player" | "rival",
  action: "expand" | "reinforce" | "contest",
  nodeId: string,
  levels: LaunchLevels,
  combo: [string, string],
  tactic?: MarketTactic,
): {
  projectedPlayerShare: number;
  projectedRivalShare: number;
  influenceToAdd: number;
  breakdown: ReturnType<typeof calculateInfluence>;
  willDominate: boolean;
} | null {
  if (!isLegalMarketAction(session, side, action, nodeId, levels.distribution)) return null;
  const calculation = actionCalculation(state, session, side, action, nodeId, levels, combo, tactic);
  if (!calculation) return null;

  const simulated: MarketSession = {
    ...session,
    nodes: session.nodes.map((node) => ({ ...node })),
    edges: session.edges.map((edge) => ({ ...edge })),
  };
  const node = simulated.nodes.find((candidate) => candidate.id === nodeId)!;
  const dominatedBefore = side === "player" ? node.playerDominated : node.rivalDominated;
  prepareSuccessfulAction(node, side, action, tactic);
  applyAction(
    simulated,
    nodeId,
    side,
    action === "contest" ? "expand" : action,
    levels.capability,
    combo,
    calculation.power,
    tactic,
  );
  const after = simulated.nodes.find((candidate) => candidate.id === nodeId)!;
  const dominatedAfter = side === "player" ? after.playerDominated : after.rivalDominated;
  return {
    projectedPlayerShare: after.playerShare,
    projectedRivalShare: after.rivalShare,
    influenceToAdd: calculation.breakdown.totalInfluence,
    breakdown: calculation.breakdown,
    willDominate: dominatedAfter && !dominatedBefore,
  };
}

export function resolveSideAction(
  state: GameState,
  session: MarketSession,
  _rng: Rng,
  side: "player" | "rival",
  action: "expand" | "reinforce" | "contest",
  nodeId: string,
  levels: LaunchLevels,
  combo: [string, string],
  tactic?: MarketTactic,
): MarketActionResult {
  const node = session.nodes.find((n) => n.id === nodeId);
  const empty: MarketActionResult = {
    success: false,
    action,
    tactic,
    nodeId,
    nodeName: node?.name ?? "Market",
    side,
    territoryChanged: false,
    dominated: false,
    influenceDelta: 0,
    momentumDelta: 0,
    cashCost: 0,
    factors: [],
    summary: "No legal target.",
  };
  if (!node) return empty;

  if (!isLegalMarketAction(session, side, action, nodeId, levels.distribution)) return empty;

  const calculation = actionCalculation(state, session, side, action, nodeId, levels, combo, tactic);
  if (!calculation) return empty;
  const { breakdown, power } = calculation;
  const defender = side === "player" ? node.rivalInfluence : node.playerInfluence;

  const factors = [
    { label: "Product strength", weight: power.productQuality },
    { label: "Launch capability", weight: power.launchCapability },
    { label: "Distribution", weight: power.launchDistribution },
    { label: "Existing position", weight: defender },
    { label: "Segment resistance", weight: node.resistance },
    { label: "Brand & momentum", weight: power.brand + power.momentum },
  ];
  if (tactic === "blitz") factors.push({ label: "PR Blitz momentum", weight: 8 });
  if (side === "rival" && node.fortified) factors.push({ label: "Customer moat", weight: 6 });
  if (side === "rival" && session.playerDefensivePosture) factors.push({ label: "Defensive posture", weight: 3 });
  factors.sort((a, b) => b.weight - a.weight);

  prepareSuccessfulAction(node, side, action, tactic);

  const beforeDom = side === "player" ? node.playerDominated : node.rivalDominated;
  applyAction(session, nodeId, side, action === "contest" ? "expand" : action, levels.capability, combo, power, tactic);
  const after = session.nodes.find((n) => n.id === nodeId)!;
  const dominated = side === "player" ? after.playerDominated && !beforeDom : after.rivalDominated && !beforeDom;
  if (side === "player") session.playerMomentum = (session.playerMomentum ?? 0) + (dominated ? 2 : 1);
  else session.rivalMomentum = (session.rivalMomentum ?? 0) + (dominated ? 2 : 1);

  if (tactic === "fortify" && side === "player") {
    node.fortified = true;
  }

  const result: MarketActionResult = {
    success: true,
    action,
    tactic,
    nodeId,
    nodeName: node.name,
    side,
    territoryChanged: true,
    dominated,
    influenceDelta: breakdown.totalInfluence,
    momentumDelta: dominated ? 2 : 1,
    cashCost: 0,
    factors,
    summary: "",
  };
  result.summary = summarize({ ...result, nodeName: node.name });
  return result;
}

export const OPS_COST: Record<MarketTactic, number> = {
  pitch: 1,
  fortify: 1,
  blitz: 2,
  viral: 1,
  poach: 2,
  pass: 0,
};

export function resolveTacticalAction(
  state: GameState,
  rng: Rng,
  input: {
    nodeId: string;
    tactic: MarketTactic;
  },
): { ok: boolean; result?: MarketActionResult; reason?: string } {
  const session = state.marketBattle;
  if (!session || session.current !== "player" || session.busy) {
    return { ok: false, reason: "Session not active or busy" };
  }
  const product = state.products.find((p) => p.id === session.productId);
  if (!product) return { ok: false, reason: "Product not found" };

  const cost = OPS_COST[input.tactic] ?? 1;
  if (session.playerOps < cost) {
    return { ok: false, reason: `Not enough Ops (${session.playerOps}/${cost} required)` };
  }
  if (input.tactic === "blitz" && state.company.cash < BALANCE.PR_BLITZ_COST) {
    return { ok: false, reason: `Insufficient cash ($${BALANCE.PR_BLITZ_COST.toLocaleString()} required for PR Blitz)` };
  }

  session.busy = true;
  try {
    const node = session.nodes.find((n) => n.id === input.nodeId);
    if (!node) return { ok: false, reason: "Segment not found" };

    const legal = getLegalMoves(session, "player", product.levels.distribution);
    let action: "expand" | "reinforce" | "contest" = "expand";
    if (input.tactic === "fortify") {
      action = "reinforce";
    } else if (input.tactic === "poach") {
      action = "contest";
    } else if (input.tactic === "blitz") {
      action = legal.contest.includes(input.nodeId) ? "contest" : legal.reinforce.includes(input.nodeId) ? "reinforce" : "expand";
    } else if (input.tactic === "viral") {
      action = legal.reinforce.includes(input.nodeId) ? "reinforce" : "expand";
    } else {
      action = legal.contest.includes(input.nodeId) ? "contest" : legal.reinforce.includes(input.nodeId) ? "reinforce" : "expand";
    }

    const isLegal =
      (action === "expand" && legal.expand.includes(input.nodeId)) ||
      (action === "reinforce" && legal.reinforce.includes(input.nodeId)) ||
      (action === "contest" && legal.contest.includes(input.nodeId));

    if (!isLegal) {
      return { ok: false, reason: "Segment is not within network reach" };
    }

    if (input.tactic === "blitz") {
      state.company.cash -= BALANCE.PR_BLITZ_COST;
      state.company.hype = Math.max(0, state.company.hype + 2);
    }

    session.playerOps -= cost;

    const res = resolveSideAction(
      state,
      session,
      rng,
      "player",
      action,
      input.nodeId,
      product.levels,
      product.combo,
      input.tactic,
    );
    res.tactic = input.tactic;
    res.opsCost = cost;

    if (input.tactic === "blitz") {
      res.cashCost += BALANCE.PR_BLITZ_COST;
    }

    if (input.tactic === "fortify" && res.success) {
      node.fortified = true;
    }

    // Trait synergies: early adopter gives momentum on dominate
    if (res.success && res.dominated && node.trait === "early_adopter") {
      session.playerMomentum = (session.playerMomentum ?? 0) + 1;
    }

    // Viral loop ripple
    if (input.tactic === "viral" && res.success) {
      const nbrs = getNeighbors(session.edges, input.nodeId);
      for (const nbrId of nbrs) {
        const nbr = session.nodes.find((n) => n.id === nbrId);
        if (nbr && !nbr.rivalDominated) {
          nbr.playerInfluence += 2;
          recomputeDominance(session, nbrId);
        }
      }
      recomputeAllNetwork(session);
    }

    session.selectedNodeId = input.nodeId;
    session.lastResolution = res;
    session.turnNonce = (session.turnNonce ?? 0) + 1;

    // Log to action log
    session.actionLog.unshift({
      id: uid(rng, "log"),
      turn: session.turn,
      side: "player",
      tactic: input.tactic,
      nodeId: input.nodeId,
      nodeName: node.name,
      summary: res.summary,
      success: res.success,
    });
    if (session.actionLog.length > 20) session.actionLog = session.actionLog.slice(0, 20);

    recordTutorialEvent(state, "capturedMarketTile");

    if (shouldEndSession(session)) {
      finishSession(state, session, rng);
      return { ok: true, result: res };
    }

    return { ok: true, result: res };
  } finally {
    if (state.marketBattle) state.marketBattle.busy = false;
  }
}

export function resolveEndTurn(
  state: GameState,
  rng: Rng,
): { ok: boolean; ended: boolean; summaries: string[] } {
  const started = beginRivalTurn(state, rng);
  if (!started.ok || started.ended) return started;

  // Simulation callers (delegation and unit tests) still resolve a full round
  // synchronously. The manual UI uses marketRivalStep so every rival move can
  // land on the board before the next one begins.
  while (state.marketBattle?.current === "rival") {
    const step = resolveRivalStep(state, rng);
    started.summaries.push(...step.summaries);
    if (step.ended) return { ...started, ended: true };
  }
  return started;
}

export function beginRivalTurn(
  state: GameState,
  rng: Rng,
): { ok: boolean; ended: boolean; summaries: string[] } {
  const session = state.marketBattle;
  if (!session || session.current !== "player" || session.busy) {
    return { ok: false, ended: false, summaries: [] };
  }
  session.busy = true;
  const summaries: string[] = [];
  recordTutorialEvent(state, "endedMarketTurn");

    // 1. Banked Ops & Defensive Posture
    if (session.playerOps > 0) {
      session.bankedOps = Math.min(2, session.bankedOps + 1);
      session.playerDefensivePosture = true;
      summaries.push(`Banked 1 Ops for next turn and assumed defensive posture (+25% resistance).`);
      session.actionLog.unshift({
        id: uid(rng, "log"),
        turn: session.turn,
        side: "player",
        tactic: "pass",
        nodeId: "",
        nodeName: "Network",
        summary: `Banked 1 Ops and fortified defensive posture.`,
        success: true,
      });
    }

    // 2. Connection momentum
    const beach = session.nodes.find((n) => n.id === session.playerBeachhead);
    const hasIsolated = session.nodes.some((n) => n.playerInfluence > 0 && n.playerIsolated);
    if (!hasIsolated && beach && !beach.rivalDominated && (session.playerMomentum ?? 0) < 4) {
      session.playerMomentum = (session.playerMomentum ?? 0) + 1;
    }

    // 3. Passive trait triggers (Viral propagation)
    for (const node of session.nodes) {
      if (node.trait === "viral" && (node.playerDominated || node.playerShare >= 50) && !node.playerIsolated) {
        const nbrs = getNeighbors(session.edges, node.id);
        let spreadCount = 0;
        for (const nbrId of nbrs) {
          const nbr = session.nodes.find((n) => n.id === nbrId);
          if (nbr && !nbr.rivalDominated && !nbr.playerDominated) {
            nbr.playerInfluence += 1;
            recomputeDominance(session, nbrId);
            spreadCount++;
          }
        }
        if (spreadCount > 0) {
          summaries.push(`Viral buzz from ${node.name} spread to adjacent markets.`);
          session.actionLog.unshift({
            id: uid(rng, "log"),
            turn: session.turn,
            side: "network",
            tactic: "viral",
            nodeId: node.id,
            nodeName: node.name,
            summary: `Viral buzz from ${node.name} spread to adjacent markets.`,
            success: true,
          });
        }
      }
    }
    recomputeAllNetwork(session);

  if (shouldEndSession(session)) {
    finishSession(state, session, rng);
    return { ok: true, ended: true, summaries };
  }

  const def = competitorDefs.find((c) => c.id === session.competitorId);
  const difficulty = session.firstMarket ? 0 : (def?.difficulty ?? 1);
  session.rivalOps = session.firstMarket
    ? (session.turn % 2 === 0 ? 0 : 1)
    : Math.max(1, Math.min(3, 1 + difficulty));
  session.current = "rival";
  session.lastRivalMove = null;
  session.turnNonce = (session.turnNonce ?? 0) + 1;
  return { ok: true, ended: false, summaries };
}

export function resolveRivalStep(
  state: GameState,
  rng: Rng,
): { ok: boolean; ended: boolean; summaries: string[] } {
  const session = state.marketBattle;
  if (!session || session.current !== "rival") {
    return { ok: false, ended: false, summaries: [] };
  }

  const summaries: string[] = [];
  if (session.rivalOps > 0 && !shouldEndSession(session)) {
    const rivalResult = processRivalTurn(state, session, rng);
    session.rivalOps -= 1;
    session.turnNonce = (session.turnNonce ?? 0) + 1;
    if (rivalResult) {
      summaries.push(rivalResult.summary);
      session.actionLog.unshift({
        id: uid(rng, "log"),
        turn: session.turn,
        side: "rival",
        tactic: rivalResult.action === "contest" ? "poach" : rivalResult.action === "reinforce" ? "fortify" : "pitch",
        nodeId: rivalResult.nodeId,
        nodeName: rivalResult.nodeName,
        summary: rivalResult.summary,
        success: rivalResult.success,
      });
    }
    if (session.actionLog.length > 20) session.actionLog = session.actionLog.slice(0, 20);
    return { ok: true, ended: false, summaries };
  }

  session.turnsLeft -= 1;
  session.turn += 1;
  session.turnNonce = (session.turnNonce ?? 0) + 1;

  const product = state.products.find((p) => p.id === session.productId);
  const baseDistributionOps = (product?.levels.distribution ?? 0) >= 3 ? 4 : 3;
  const hubBonus = session.nodes.filter((n) => n.trait === "platform_hub" && n.playerDominated && !n.playerIsolated).length;
  session.playerMaxOps = Math.min(5, baseDistributionOps + hubBonus);
  session.playerOps = Math.min(5, session.playerMaxOps + session.bankedOps);
  session.bankedOps = 0;
  session.playerDefensivePosture = false;

  for (const node of session.nodes) {
    if (node.fortified) node.fortified = false;
  }

  if (shouldEndSession(session)) {
    finishSession(state, session, rng);
    return { ok: true, ended: true, summaries };
  }

  session.current = "player";
  session.busy = false;
  return { ok: true, ended: false, summaries };
}

export function processRivalTurn(state: GameState, session: MarketSession, rng: Rng): MarketActionResult | null {
  const product = state.products.find((p) => p.id === session.productId);
  if (!product) return null;
  const def = competitorDefs.find((c) => c.id === session.competitorId);
  const rivalLevels = designCompetitorProductLevels(product, session.firstMarket ? 0 : def?.difficulty ?? 1);
  const move = aiSelectMove(session, rng, def ?? {
    id: session.competitorId,
    name: "Competitor",
    founder: "Founder",
    description: "",
    archetype: "bigtech",
    personality: "opportunistic",
    skills: { product: 1, growth: 1, engineering: 1, research: 1 },
    focus: product.combo,
    difficulty: 1,
    startingShare: 10,
  }, rivalLevels, product, state);
  if (!move) {
    session.lastRivalMove = null;
    return null;
  }
  const result = resolveSideAction(state, session, rng, "rival", move.action, move.nodeId, rivalLevels, product.combo);
  session.lastRivalMove = {
    action: move.action,
    nodeId: move.nodeId,
    nodeName: result.nodeName,
    success: result.success,
    summary: result.summary,
  };
  return result;
}

export function resolveMarketTurn(
  state: GameState,
  rng: Rng,
  input: { kind: "act"; nodeId: string; action: "expand" | "reinforce" | "contest"; tactic?: MarketTactic } | { kind: "pass" },
): { ok: boolean; ended: boolean; player?: MarketActionResult; rival?: MarketActionResult | null } {
  const session = state.marketBattle;
  if (!session || session.current !== "player" || session.busy) return { ok: false, ended: false };

  if (input.kind === "pass") {
    const endRes = resolveEndTurn(state, rng);
    return { ok: endRes.ok, ended: endRes.ended, rival: session.lastResolution ?? null };
  }

  session.busy = true;
  try {
    const product = state.products.find((p) => p.id === session.productId);
    if (!product) return { ok: false, ended: false };

    const legal = getLegalMoves(session, "player", product.levels.distribution);
    const allowed =
      (input.action === "expand" && legal.expand.includes(input.nodeId)) ||
      (input.action === "reinforce" && legal.reinforce.includes(input.nodeId)) ||
      (input.action === "contest" && legal.contest.includes(input.nodeId));
    if (!allowed) return { ok: false, ended: false };

    const playerResult = resolveSideAction(
      state,
      session,
      rng,
      "player",
      input.action,
      input.nodeId,
      product.levels,
      product.combo,
      input.tactic,
    );
    session.selectedNodeId = input.nodeId;
    session.lastResolution = playerResult;
    recordTutorialEvent(state, "capturedMarketTile");

    if (shouldEndSession(session)) {
      finishSession(state, session, rng);
      return { ok: true, ended: true, player: playerResult };
    }

    const rival = processRivalTurn(state, session, rng);
    session.turnsLeft -= 1;
    session.turn += 1;
    session.turnNonce = (session.turnNonce ?? 0) + 1;

    const baseDistributionOps = (product.levels.distribution ?? 0) >= 3 ? 4 : 3;
    const hubBonus = session.nodes.filter((n) => n.trait === "platform_hub" && n.playerDominated && !n.playerIsolated).length;
    session.playerMaxOps = Math.min(5, baseDistributionOps + hubBonus);
    session.playerOps = session.playerMaxOps;

    if (shouldEndSession(session)) {
      finishSession(state, session, rng);
      return { ok: true, ended: true, player: playerResult, rival };
    }
    return { ok: true, ended: false, player: playerResult, rival };
  } finally {
    if (state.marketBattle) state.marketBattle.busy = false;
  }
}
