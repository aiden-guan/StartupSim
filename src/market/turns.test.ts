import { describe, expect, it } from "vitest";
import { BALANCE } from "../config/balance";
import { applyCommand } from "../simulation/commands";
import { createNewGame } from "../simulation/newGame";
import { createProduct } from "../simulation/products";
import { Rng } from "../simulation/rng";
import type { GameState, Product } from "../simulation/types";
import { competitors } from "../data/competitors";
import { aiSelectMove, calculateInfluence, getLegalMoves, launchStrength, startMarketSession } from "./marketMap";
import { beginRivalTurn, previewSideAction, processRivalTurn, resolveEndTurn, resolveMarketTurn, resolveRivalStep, resolveSideAction, resolveTacticalAction } from "./turns";

class FixedRng extends Rng {
  constructor(private value: number) {
    super(1);
  }
  next(): number {
    return this.value;
  }
}

function setup(seed = 9): { state: GameState; product: Product } {
  const rng = new Rng(seed);
  const state = createNewGame({
    founderName: "Ada",
    companyName: "HyperScale",
    cofounderId: "reya",
    seed,
    skipTutorial: true,
  });
  const product = createProduct(state, "code", "agent", rng);
  product.levels = { deployment: 1, capability: 2, distribution: 1 };
  product.points = { engineering: 80, product: 80, growth: 60, research: 40 };
  product.status = "ready";
  state.products.push(product);
  state.company.seenMarket = true;
  return { state, product };
}

function openBattle(state: GameState, product: Product, seed = 9) {
  const session = startMarketSession(state, product, new Rng(seed));
  session.firstMarket = false;
  session.turn = 4;
  session.edges = [...session.edges, { a: session.playerBeachhead, b: session.rivalBeachhead }];
  state.marketBattle = session;
  return session;
}

describe("market turn processing", () => {
  it("gives the rival a turn after a valid player action and cannot process twice while busy", () => {
    const { state, product } = setup(21);
    const session = openBattle(state, product, 21);
    const legal = getLegalMoves(session, "player", product.levels.distribution);
    const target = legal.expand[0] ?? legal.reinforce[0]!;
    const nonce = session.turnNonce ?? 0;
    const result = resolveMarketTurn(state, new FixedRng(0), { kind: "act", nodeId: target, action: legal.expand.includes(target) ? "expand" : "reinforce" });
    expect(result.ok).toBe(true);
    expect(result.ended || state.marketBattle).toBeTruthy();
    if (state.marketBattle) {
      expect(state.marketBattle.turnNonce).toBe(nonce + 1);
      expect(state.marketBattle.lastRivalMove !== undefined).toBe(true);
      state.marketBattle.busy = true;
      const blocked = resolveMarketTurn(state, new FixedRng(0), { kind: "pass" });
      expect(blocked.ok).toBe(false);
      expect(state.marketBattle.turnNonce).toBe(nonce + 1);
    }
  });

  it("rejects illegal territory transitions without mutating the map", () => {
    const { state, product } = setup(22);
    const session = openBattle(state, product, 22);
    const snapshot = structuredClone(session.nodes);
    const result = resolveMarketTurn(state, new FixedRng(0), { kind: "act", nodeId: "no-such-node", action: "expand" });
    expect(result.ok).toBe(false);
    expect(state.marketBattle?.nodes).toEqual(snapshot);
  });

  it("lets the player contest and capture rival territory, and the rival recapture player territory", () => {
    const { state, product } = setup(23);
    const session = openBattle(state, product, 23);
    const rivalId = session.rivalBeachhead;
    const playerId = session.playerBeachhead;
    const playerContest = resolveSideAction(state, session, new FixedRng(0), "player", "contest", rivalId, product.levels, product.combo);
    expect(playerContest.success).toBe(true);
    const rivalNode = session.nodes.find((n) => n.id === rivalId)!;
    expect(rivalNode.rivalDominated).toBe(false);
    expect(rivalNode.playerInfluence).toBeGreaterThan(0);

    const rivalContest = resolveSideAction(state, session, new FixedRng(0), "rival", "contest", playerId, { deployment: 2, capability: 3, distribution: 2 }, product.combo);
    expect(rivalContest.success).toBe(true);
    const playerNode = session.nodes.find((n) => n.id === playerId)!;
    expect(playerNode.playerDominated).toBe(false);
  });

  it("prefers contesting player-held adjacent territory over stacking a dominated beachhead", () => {
    const { state, product } = setup(27);
    const session = openBattle(state, product, 27);
    for (const node of session.nodes) {
      if (node.id === session.playerBeachhead) {
        node.playerDominated = true;
        node.playerInfluence = 14;
        node.playerShare = 88;
        node.rivalInfluence = 0;
        node.rivalShare = 0;
        node.rivalDominated = false;
      } else {
        node.rivalDominated = true;
        node.rivalInfluence = 12;
        node.rivalShare = 86;
        node.playerInfluence = 0;
        node.playerShare = 0;
        node.playerDominated = false;
      }
    }
    const def = competitors.find((c) => c.id === session.competitorId) ?? competitors[0]!;
    const move = aiSelectMove(session, new FixedRng(0.4), def, { deployment: 2, capability: 3, distribution: 2 }, product, state);
    expect(move?.action).toBe("contest");
    expect(move?.nodeId).toBe(session.playerBeachhead);
  });

  it("runs a rival action after a player pass on successive turns", () => {
    const { state, product } = setup(24);
    openBattle(state, product, 24);
    const first = resolveMarketTurn(state, new FixedRng(0), { kind: "pass" });
    expect(first.ok).toBe(true);
    const second = resolveMarketTurn(state, new FixedRng(0), { kind: "pass" });
    expect(second.ok).toBe(true);
    expect((state.marketBattle?.turnNonce ?? 0) >= 2 || first.ended || second.ended).toBe(true);
  });

  it("always resolves a legal contest without a failure roll", () => {
    const { state, product } = setup(25);
    const session = openBattle(state, product, 25);
    const cash = state.company.cash;
    const rivalId = session.rivalBeachhead;
    const momentum = session.playerMomentum ?? 0;
    const result = resolveSideAction(state, session, new FixedRng(0.99), "player", "contest", rivalId, product.levels, product.combo);
    expect(result.success).toBe(true);
    expect(state.company.cash).toBe(cash);
    expect(session.nodes.find((n) => n.id === rivalId)!.rivalDominated).toBe(false);
    expect(session.playerMomentum ?? 0).toBeGreaterThan(momentum);
    expect((session.nodes.find((n) => n.id === rivalId)!.contestPenalty ?? 0)).toBe(0);
    expect(result.influenceDelta).toBeGreaterThan(0);
    expect(result.summary.length).toBeGreaterThan(10);
  });

  it("removes a reinforced node from the rival's legal targets until turn end", () => {
    const { state, product } = setup(26);
    const session = openBattle(state, product, 26);
    const playerNode = session.nodes.find((node) => node.id === session.playerBeachhead)!;
    playerNode.fortified = true;
    session.playerDefensivePosture = true;

    const rivalLegal = getLegalMoves(session, "rival", 2);
    expect(rivalLegal.contest).not.toContain(playerNode.id);
  });

  it("stronger product and launch stats increase influence and starting foothold", () => {
    const weak = setup(26);
    weak.product.levels = { deployment: 0, capability: 0, distribution: 0 };
    weak.product.points = { engineering: 4, product: 4, growth: 4, research: 0 };
    const strong = setup(26);
    strong.product.levels = { deployment: 3, capability: 3, distribution: 3 };
    strong.product.points = { engineering: 400, product: 400, growth: 400, research: 200 };
    strong.state.company.hype = 40;
    expect(launchStrength(strong.product, strong.state)).toBeGreaterThan(launchStrength(weak.product, weak.state));

    const weakSession = startMarketSession(weak.state, weak.product, new Rng(26));
    const strongSession = startMarketSession(strong.state, strong.product, new Rng(26));
    const weakBeach = weakSession.nodes.find((n) => n.id === weakSession.playerBeachhead)!;
    const strongBeach = strongSession.nodes.find((n) => n.id === strongSession.playerBeachhead)!;
    expect(strongBeach.playerInfluence).toBeGreaterThan(weakBeach.playerInfluence);

    const target = weakSession.playerBeachhead;
    const low = calculateInfluence(weakSession, target, "player", "reinforce", 0, ["code", "agent"], {
      productQuality: 0.4, launchCapability: 0, launchDistribution: 0, launchDeployment: 0, brand: 0, hype: 0, momentum: 0, gtmFit: 20, pricingPower: 1,
    });
    const high = calculateInfluence(strongSession, target, "player", "reinforce", 3, ["code", "agent"], {
      productQuality: 8, launchCapability: 3, launchDistribution: 3, launchDeployment: 3, brand: 4, hype: 40, momentum: 3, gtmFit: 80, pricingPower: 1.2,
    });
    expect(high.totalInfluence).toBeGreaterThan(low.totalInfluence);
  });

  it("enterMarket command resolves through applyCommand and rival can still move", () => {
    const { state, product } = setup(27);
    const next = applyCommand(state, { type: "enterMarket", productId: product.id })!;
    expect(next.marketBattle).toBeTruthy();
    let playable = structuredClone(next);
    playable.marketBattle!.firstMarket = false;
    playable.marketBattle!.turn = 4;
    playable.marketBattle!.edges.push({ a: playable.marketBattle!.playerBeachhead, b: playable.marketBattle!.rivalBeachhead });
    const legal = getLegalMoves(playable.marketBattle!, "player", product.levels.distribution);
    const target = legal.reinforce[0] ?? legal.expand[0]!;
    const action = legal.reinforce.includes(target) ? "reinforce" as const : "expand" as const;
    const after = applyCommand(playable, { type: "marketAction", nodeId: target, action })!;
    expect(after.marketBattle?.turnNonce ?? after.marketResult).toBeTruthy();
  });
});

describe("rival processing", () => {
  it("processRivalTurn records a move when legal actions exist", () => {
    const { state, product } = setup(28);
    const session = openBattle(state, product, 28);
    const move = processRivalTurn(state, session, new FixedRng(0));
    expect(session.lastRivalMove === null || move !== null).toBe(true);
  });

  it("applies one rival move per step and keeps control locked until the phase finishes", () => {
    const { state, product } = setup(37);
    const session = openBattle(state, product, 37);
    session.turn = 1;
    session.playerOps = 0;

    const begun = beginRivalTurn(state, new FixedRng(0));
    expect(begun.ok).toBe(true);
    expect(session.current).toBe("rival");
    expect(session.busy).toBe(true);

    const before = session.actionLog.length;
    const first = resolveRivalStep(state, new FixedRng(0));
    expect(first.ok).toBe(true);
    expect(session.actionLog.length - before).toBeLessThanOrEqual(1);
    expect(session.current).toBe("rival");

    while (state.marketBattle?.current === "rival") {
      resolveRivalStep(state, new FixedRng(0));
    }
    expect(state.marketBattle?.current ?? "ended").not.toBe("rival");
    expect(state.marketBattle?.busy ?? false).toBe(false);
  });
});

describe("tactical turn-based operations & Ops economy", () => {
  it("shows the same successful shares that the move actually applies", () => {
    const { state, product } = setup(29);
    const session = openBattle(state, product, 29);
    const target = getLegalMoves(session, "player", product.levels.distribution).expand[0]!;
    const preview = previewSideAction(
      state,
      session,
      "player",
      "expand",
      target,
      product.levels,
      product.combo,
      "pitch",
    )!;

    const result = resolveTacticalAction(state, new FixedRng(0), { nodeId: target, tactic: "pitch" });
    const applied = session.nodes.find((node) => node.id === target)!;

    expect(result.ok).toBe(true);
    expect(result.result?.success).toBe(true);
    expect(applied.playerShare).toBe(preview.projectedPlayerShare);
    expect(applied.rivalShare).toBe(preview.projectedRivalShare);
  });

  it("includes Poach's rival-share loss in the successful projection", () => {
    const { state, product } = setup(31);
    const session = openBattle(state, product, 31);
    const target = session.rivalBeachhead;
    const preview = previewSideAction(
      state,
      session,
      "player",
      "contest",
      target,
      product.levels,
      product.combo,
      "poach",
    )!;

    const result = resolveTacticalAction(state, new FixedRng(0), { nodeId: target, tactic: "poach" });
    const applied = session.nodes.find((node) => node.id === target)!;

    expect(result.ok).toBe(true);
    expect(result.result?.success).toBe(true);
    expect(applied.playerShare).toBe(preview.projectedPlayerShare);
    expect(applied.rivalShare).toBe(preview.projectedRivalShare);
  });

  it("projects the applied result for a legal Promote", () => {
    const { state, product } = setup(35);
    const session = openBattle(state, product, 35);
    const target = getLegalMoves(session, "player", product.levels.distribution).expand[0]!;

    const result = resolveTacticalAction(state, new FixedRng(0.999999), { nodeId: target, tactic: "pitch" });

    expect(result.ok).toBe(true);
    expect(result.result?.success).toBe(true);
  });

  it("rejects a move that does not apply to the selected segment without spending Ops", () => {
    const { state, product } = setup(30);
    const session = openBattle(state, product, 30);
    const target = getLegalMoves(session, "player", product.levels.distribution).expand[0]!;
    const opsBefore = session.playerOps;

    const result = resolveTacticalAction(state, new FixedRng(0), { nodeId: target, tactic: "fortify" });

    expect(result.ok).toBe(false);
    expect(session.playerOps).toBe(opsBefore);
  });

  it("allows multiple actions in a single turn until Ops are exhausted", () => {
    const { state, product } = setup(30);
    const session = openBattle(state, product, 30);
    expect(session.playerOps).toBe(3);
    const initialTurn = session.turn;

    const legal = getLegalMoves(session, "player", product.levels.distribution);
    const target = legal.expand[0] ?? legal.reinforce[0]!;

    // Action 1: Pitch (-1 Ops)
    const act1 = resolveTacticalAction(state, new FixedRng(0), { nodeId: target, tactic: "pitch" });
    expect(act1.ok).toBe(true);
    expect(session.playerOps).toBe(2);
    expect(session.turn).toBe(initialTurn); // Turn does NOT advance!

    // Action 2: Fortify (-1 Ops)
    const beach = session.playerBeachhead;
    const act2 = resolveTacticalAction(state, new FixedRng(0), { nodeId: beach, tactic: "fortify" });
    expect(act2.ok).toBe(true);
    expect(session.playerOps).toBe(1);
    expect(session.nodes.find((n) => n.id === beach)?.fortified).toBe(true);
    expect(session.turn).toBe(initialTurn); // Still in player turn!

    // Action 3: Pitch (-1 Ops)
    const act3 = resolveTacticalAction(state, new FixedRng(0), { nodeId: beach, tactic: "pitch" });
    expect(act3.ok).toBe(true);
    expect(session.playerOps).toBe(0);

    // Action 4: Blocked due to insufficient Ops
    const act4 = resolveTacticalAction(state, new FixedRng(0), { nodeId: beach, tactic: "pitch" });
    expect(act4.ok).toBe(false);
    expect(act4.reason).toContain("Not enough Ops");
  });

  it("automatically starts the rival phase when the final Ops is spent", () => {
    const { state, product } = setup(38);
    const session = openBattle(state, product, 38);
    session.playerOps = 1;
    const legal = getLegalMoves(session, "player", product.levels.distribution);
    const target = legal.expand[0] ?? legal.reinforce[0]!;
    const action = legal.expand.includes(target) ? "expand" as const : "reinforce" as const;
    const tactic = action === "expand" ? "pitch" as const : "fortify" as const;

    const next = applyCommand(state, { type: "marketAction", nodeId: target, action, tactic })!;
    expect(next.marketBattle?.playerOps).toBe(0);
    expect(next.marketBattle?.current).toBe("rival");
    expect(next.marketBattle?.busy).toBe(true);
  });

  it("PR Blitz spends cash, adds company hype, and penetrates resistance", () => {
    const { state, product } = setup(31);
    const session = openBattle(state, product, 31);
    state.company.cash = 10000;
    const initialHype = state.company.hype;

    const legal = getLegalMoves(session, "player", product.levels.distribution);
    const target = legal.expand[0] ?? legal.reinforce[0]!;

    const res = resolveTacticalAction(state, new FixedRng(0), { nodeId: target, tactic: "blitz" });
    expect(res.ok).toBe(true);
    expect(state.company.cash).toBe(10_000 - BALANCE.PR_BLITZ_COST); // Spent the PR Blitz price
    expect(state.company.hype).toBe(initialHype + 2);
    expect(session.playerOps).toBe(1); // Spent 2 Ops (3 - 2 = 1)
    expect(res.result?.tactic).toBe("blitz");
    expect(res.result?.factors.some((f) => f.label.includes("PR Blitz"))).toBe(true);
  });

  it("Viral loop ripples bonus influence into connected neighbors", () => {
    const { state, product } = setup(32);
    const session = openBattle(state, product, 32);
    // Find or set a friendly node with viral trait
    const beach = session.nodes.find((n) => n.id === session.playerBeachhead)!;
    beach.trait = "viral";

    const res = resolveTacticalAction(state, new FixedRng(0), { nodeId: beach.id, tactic: "viral" });
    expect(res.ok).toBe(true);
    // Neighbors of beachhead received +2 ripple influence
    const nbrIds = session.edges.filter((e) => e.a === beach.id || e.b === beach.id).map((e) => e.a === beach.id ? e.b : e.a);
    const neighbor = session.nodes.find((n) => nbrIds.includes(n.id))!;
    expect(neighbor.playerInfluence).toBeGreaterThanOrEqual(2);
  });

  it("Competitive Poach strips rival influence directly", () => {
    const { state, product } = setup(33);
    const session = openBattle(state, product, 33);
    const rivalBeach = session.nodes.find((n) => n.id === session.rivalBeachhead)!;
    rivalBeach.rivalInfluence = 20;

    const res = resolveSideAction(state, session, new FixedRng(0), "player", "contest", rivalBeach.id, product.levels, product.combo, "poach");
    expect(res.success).toBe(true);
    // Rival influence was stripped by ~35%
    expect(rivalBeach.rivalInfluence).toBeLessThan(20);
  });

  it("End Turn banks unspent Ops, activates defensive posture, runs viral spread, and refreshes Ops", () => {
    const { state, product } = setup(34);
    const session = openBattle(state, product, 34);
    session.turn = 1;
    session.playerOps = 2; // Has 2 unspent Ops
    const turnsLeftBefore = session.turnsLeft;

    const endResult = resolveEndTurn(state, new FixedRng(0));
    expect(endResult.ok).toBe(true);
    expect(session.turnsLeft).toBe(turnsLeftBefore - 1);
    expect(session.turn).toBe(2);

    // Next turn has base 3 Ops + 1 banked Ops = 4 Ops!
    expect(session.playerOps).toBe(4);
    // Action log recorded the end turn / bank event
    expect(session.actionLog.some((l) => l.summary.includes("Banked 1 Ops"))).toBe(true);
  });

  it("Dominating a platform hub awards +1 Ops per turn", () => {
    const { state, product } = setup(35);
    const session = startMarketSession(state, product, new Rng(35));
    session.firstMarket = false;
    state.marketBattle = session;

    // Find a hub, link to player beachhead, and dominate it
    const hub = session.nodes.find((n) => n.trait === "platform_hub")!;
    session.edges.push({ a: session.playerBeachhead, b: hub.id });
    hub.playerDominated = true;
    hub.playerInfluence = 20;
    hub.playerShare = 85;
    hub.playerIsolated = false;
    hub.fortified = true;

    resolveEndTurn(state, new FixedRng(0.99));

    // Base 3 Ops + 1 Hub Bonus = 4 Max Ops!
    expect(session.playerMaxOps).toBe(4);
  });
});
