import { competitors as competitorDefs } from "../data/competitors";
import { GTM_STRATEGIES } from "../data/gtm";
import { offices } from "../data/offices";
import { scaleEventCash } from "../simulation/eventEconomy";
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
  previewAction,
  recomputeAllNetwork,
  shouldEndSession,
  type MarketPowerContext,
} from "./marketMap";
import type { MarketActionResult, MarketSession } from "./types";

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
  if (!result.success) {
    const top = result.factors[0]?.label ?? "market position";
    return `Expansion failed. ${top} outweighed the attempt on ${result.nodeName}.`;
  }
  if (result.dominated) return `${result.nodeName} flipped. Decisive control changed hands.`;
  if (result.action === "contest") return `Contested ${result.nodeName}. The hold is no longer safe.`;
  if (result.action === "reinforce") return `Reinforced ${result.nodeName}. Preference deepened.`;
  return `Expanded into ${result.nodeName}.`;
}

function failCost(state: GameState, rng: Rng): number {
  return Math.min(state.company.cash * 0.08, scaleEventCash(state, 1_400, "minor", rng));
}

export function resolveSideAction(
  state: GameState,
  session: MarketSession,
  rng: Rng,
  side: "player" | "rival",
  action: "expand" | "reinforce" | "contest",
  nodeId: string,
  levels: LaunchLevels,
  combo: [string, string],
): MarketActionResult {
  const node = session.nodes.find((n) => n.id === nodeId);
  const empty: MarketActionResult = {
    success: false,
    action,
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

  const power = marketPowerFor(state, state.products.find((p) => p.id === session.productId)!, session, side);
  const breakdown = calculateInfluence(session, nodeId, side, action === "contest" ? "expand" : action, levels.capability, combo, power);
  const preview = previewAction(session, nodeId, side, action === "contest" ? "expand" : action, levels.capability, combo, power);
  const defender = side === "player" ? node.rivalInfluence : node.playerInfluence;
  const defense = defender + node.resistance + (action === "contest" ? 4 : 0) + (side === "player" ? node.rivalShare : node.playerShare) * 0.04;
  const attack = breakdown.totalInfluence + power.productQuality + power.momentum * 0.35 + (offices[state.company.officeLevel]?.prestige ?? 0) * 0.02;
  let chance = 0.3 + (attack / Math.max(1, attack + defense)) * 0.6;
  if (action === "reinforce") chance = Math.min(0.97, chance + 0.2);
  if (action === "contest") chance *= 0.82;
  if ((session.playerMomentum ?? 0) < 0 && side === "player") chance *= 0.9;
  chance = Math.max(0.14, Math.min(0.93, chance));

  const factors = [
    { label: "Product strength", weight: power.productQuality },
    { label: "Launch capability", weight: power.launchCapability },
    { label: "Distribution", weight: power.launchDistribution },
    { label: "Existing position", weight: defender },
    { label: "Segment resistance", weight: node.resistance },
    { label: "Brand & momentum", weight: power.brand + power.momentum },
  ].sort((a, b) => b.weight - a.weight);

  const success = rng.next() < chance;
  if (!success) {
    const cashCost = side === "player" && action !== "reinforce" ? Math.max(0, Math.round(failCost(state, rng))) : 0;
    if (side === "player") {
      state.company.cash -= cashCost;
      session.playerMomentum = (session.playerMomentum ?? 0) - (action === "contest" ? 2 : 1);
      node.contestPenalty = (node.contestPenalty ?? 0) + 1;
      if (action === "contest") node.rivalInfluence += 1;
    } else {
      session.rivalMomentum = (session.rivalMomentum ?? 0) - 1;
      if (action === "contest") node.playerInfluence += 1;
    }
    recomputeAllNetwork(session);
    const rivalName = competitorDefs.find((c) => c.id === session.competitorId)?.name ?? "the incumbent";
    return {
      success: false,
      action,
      nodeId,
      nodeName: node.name,
      side,
      territoryChanged: false,
      dominated: false,
      influenceDelta: 0,
      momentumDelta: action === "contest" ? -2 : -1,
      cashCost,
      factors,
      summary: side === "player"
        ? `Expansion failed. Your product was competitive, but ${rivalName}'s existing position on ${node.name} outweighed it.`
        : `${rivalName} failed to take ${node.name}.`,
    };
  }

  if (action === "contest") {
    if (side === "player" && node.rivalDominated) {
      node.rivalDominated = false;
      node.rivalInfluence = Math.max(2, Math.round(node.rivalInfluence * 0.72));
    }
    if (side === "rival" && node.playerDominated) {
      node.playerDominated = false;
      node.playerInfluence = Math.max(2, Math.round(node.playerInfluence * 0.72));
    }
  }

  const beforeDom = side === "player" ? node.playerDominated : node.rivalDominated;
  applyAction(session, nodeId, side, action === "contest" ? "expand" : action, levels.capability, combo, power);
  const after = session.nodes.find((n) => n.id === nodeId)!;
  const dominated = side === "player" ? after.playerDominated && !beforeDom : after.rivalDominated && !beforeDom;
  if (side === "player") session.playerMomentum = (session.playerMomentum ?? 0) + (dominated ? 2 : 1);
  else session.rivalMomentum = (session.rivalMomentum ?? 0) + (dominated ? 2 : 1);

  const result: MarketActionResult = {
    success: true,
    action,
    nodeId,
    nodeName: node.name,
    side,
    territoryChanged: true,
    dominated,
    influenceDelta: preview.influenceToAdd,
    momentumDelta: dominated ? 2 : 1,
    cashCost: 0,
    factors,
    summary: "",
  };
  result.summary = summarize({ ...result, nodeName: node.name });
  return result;
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
  input: { kind: "act"; nodeId: string; action: "expand" | "reinforce" | "contest" } | { kind: "pass" },
): { ok: boolean; ended: boolean; player?: MarketActionResult; rival?: MarketActionResult | null } {
  const session = state.marketBattle;
  if (!session || session.current !== "player" || session.busy) return { ok: false, ended: false };
  session.busy = true;
  try {
    const product = state.products.find((p) => p.id === session.productId);
    if (!product) return { ok: false, ended: false };

    let playerResult: MarketActionResult | undefined;
    if (input.kind === "act") {
      const legal = getLegalMoves(session, "player", product.levels.distribution);
      const allowed =
        (input.action === "expand" && legal.expand.includes(input.nodeId)) ||
        (input.action === "reinforce" && legal.reinforce.includes(input.nodeId)) ||
        (input.action === "contest" && legal.contest.includes(input.nodeId));
      if (!allowed) return { ok: false, ended: false };
      playerResult = resolveSideAction(state, session, rng, "player", input.action, input.nodeId, product.levels, product.combo);
      session.selectedNodeId = input.nodeId;
      session.lastResolution = playerResult;
      recordTutorialEvent(state, "capturedMarketTile");
      if (shouldEndSession(session)) {
        finishSession(state, session, rng);
        return { ok: true, ended: true, player: playerResult };
      }
    } else {
      recordTutorialEvent(state, "endedMarketTurn");
    }

    const rival = processRivalTurn(state, session, rng);
    session.turnsLeft -= 1;
    session.turn += 1;
    session.turnNonce = (session.turnNonce ?? 0) + 1;
    if (shouldEndSession(session)) {
      finishSession(state, session, rng);
      return { ok: true, ended: true, player: playerResult, rival };
    }
    return { ok: true, ended: false, player: playerResult, rival };
  } finally {
    if (state.marketBattle) state.marketBattle.busy = false;
  }
}
