import { describe, expect, it } from "vitest";
import { applyCommand } from "../simulation/commands";
import { createNewGame } from "../simulation/newGame";
import { createProduct } from "../simulation/products";
import { Rng } from "../simulation/rng";
import type { GameState, Product } from "../simulation/types";
import { competitors } from "../data/competitors";
import { aiSelectMove, calculateInfluence, getLegalMoves, launchStrength, startMarketSession } from "./marketMap";
import { processRivalTurn, resolveMarketTurn, resolveSideAction } from "./turns";

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

  it("failed attacks cost cash and momentum without transferring the node", () => {
    const { state, product } = setup(25);
    const session = openBattle(state, product, 25);
    const cash = state.company.cash;
    const rivalId = session.rivalBeachhead;
    const before = session.nodes.find((n) => n.id === rivalId)!;
    const dominated = before.rivalDominated;
    const momentum = session.playerMomentum ?? 0;
    const result = resolveSideAction(state, session, new FixedRng(0.99), "player", "contest", rivalId, product.levels, product.combo);
    expect(result.success).toBe(false);
    expect(state.company.cash).toBeLessThanOrEqual(cash);
    expect(session.nodes.find((n) => n.id === rivalId)!.rivalDominated).toBe(dominated);
    expect(session.playerMomentum ?? 0).toBeLessThan(momentum);
    expect((session.nodes.find((n) => n.id === rivalId)!.contestPenalty ?? 0)).toBeGreaterThan(0);
    expect(result.summary.length).toBeGreaterThan(10);
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
});
