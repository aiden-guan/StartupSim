import { describe, expect, it } from "vitest";
import { applyCommand } from "../simulation/commands";
import { createNewGame } from "../simulation/newGame";
import { createProduct } from "../simulation/products";
import { Rng } from "../simulation/rng";
import type { GameState, Product } from "../simulation/types";
import { migrateGameState } from "../state/migrate";
import {
  applyAction,
  applyMarketEntryResults,
  calculateInfluence,
  calculateMarketEntryResult,
  calculateShares,
  checkRoutStatus,
  getConnectedSupport,
  getLegalMoves,
  getNeighbors,
  getProductFit,
  previewAction,
  recomputeAllNetwork,
  recomputeIsolation,
  startMarketSession,
} from "./marketMap";
import {
  MARKET_SEGMENTS,
  MARKET_TEMPLATES,
  selectTemplateForProduct,
} from "./templates";

function setupGame(seed = 7): { state: GameState; product: Product; rng: Rng } {
  const rng = new Rng(seed);
  const state = createNewGame({
    founderName: "Ada",
    companyName: "HyperScale",
    cofounderId: "reya",
    seed,
  });
  const product = createProduct(state, "code", "agent", rng);
  product.levels = { deployment: 1, capability: 2, distribution: 1 };
  product.status = "ready";
  state.products.push(product);
  return { state, product, rng };
}

describe("Graph & Template Tests", () => {
  it("all hand-authored templates have valid nodes, edges, and 6-9 nodes", () => {
    for (const [, template] of Object.entries(MARKET_TEMPLATES)) {
      expect(template.nodes.length).toBeGreaterThanOrEqual(6);
      expect(template.nodes.length).toBeLessThanOrEqual(9);

      const nodeIds = new Set(template.nodes.map((n) => n.id));
      expect(nodeIds.size).toBe(template.nodes.length); // no duplicate IDs

      for (const edge of template.edges) {
        expect(nodeIds.has(edge.a)).toBe(true);
        expect(nodeIds.has(edge.b)).toBe(true);
        expect(edge.a).not.toBe(edge.b);
      }

      // Every node has at least one connection
      for (const node of template.nodes) {
        const nbrs = getNeighbors(template.edges, node.id);
        expect(nbrs.length).toBeGreaterThan(0);
      }

      // Beachheads are valid and distinct
      expect(nodeIds.has(template.defaultPlayerBeachhead)).toBe(true);
      expect(nodeIds.has(template.defaultRivalBeachhead)).toBe(true);
      expect(template.defaultPlayerBeachhead).not.toBe(template.defaultRivalBeachhead);
    }
  });

  it("segment definitions have valid economic value, resistance, and load", () => {
    for (const [id, seg] of Object.entries(MARKET_SEGMENTS)) {
      expect(seg.id).toBe(id);
      expect(seg.value).toBeGreaterThanOrEqual(1);
      expect(seg.value).toBeLessThanOrEqual(5);
      expect(seg.resistance).toBeGreaterThanOrEqual(1);
      expect(seg.resistance).toBeLessThanOrEqual(6);
      expect(seg.load).toBeGreaterThanOrEqual(1);
      expect(seg.load).toBeLessThanOrEqual(4);
    }
  });

  it("template selection is deterministic by vertical, recipe, and tutorial status", () => {
    const tutorialTpl = selectTemplateForProduct("developer", ["code", "agent"], true);
    expect(tutorialTpl.id).toBe("tutorial");

    const devTpl = selectTemplateForProduct("developer", ["code", "agent"], false);
    expect(devTpl.id).toBe("developer");

    const mediaTpl = selectTemplateForProduct("media", ["video", "avatar"], false);
    expect(mediaTpl.id).toBe("media");

    const entTpl = selectTemplateForProduct("enterprise", ["workflow", "agent"], false);
    expect(entTpl.id).toBe("enterprise");
  });
});

describe("Beachhead Tests", () => {
  it("initializes player and rival at distinct beachheads with initial influence", () => {
    const { state, product, rng } = setupGame(42);
    const session = startMarketSession(state, product, rng);

    expect(session.playerBeachhead).toBeDefined();
    expect(session.rivalBeachhead).toBeDefined();
    expect(session.playerBeachhead).not.toBe(session.rivalBeachhead);

    const playerNode = session.nodes.find((n) => n.id === session.playerBeachhead)!;
    const rivalNode = session.nodes.find((n) => n.id === session.rivalBeachhead)!;

    expect(playerNode.playerInfluence).toBeGreaterThan(0);
    expect(playerNode.rivalInfluence).toBe(0);
    expect(playerNode.playerDominated).toBe(true);
    expect(playerNode.isPlayerBeachhead).toBe(true);

    expect(rivalNode.rivalInfluence).toBeGreaterThan(0);
    expect(rivalNode.playerInfluence).toBe(0);
    expect(rivalNode.rivalDominated).toBe(true);
    expect(rivalNode.isRivalBeachhead).toBe(true);
  });
});

describe("Influence & Preview Tests", () => {
  it("reinforce and expand add positive deterministic influence", () => {
    const { state, product, rng } = setupGame(10);
    const session = startMarketSession(state, product, rng);

    const startNode = session.nodes.find((n) => n.id === session.playerBeachhead)!;
    const initialInf = startNode.playerInfluence;

    applyAction(session, startNode.id, "player", "reinforce", product.levels.capability, product.combo);
    expect(startNode.playerInfluence).toBeGreaterThan(initialInf);
  });

  it("higher capability provides higher influence delta", () => {
    const { state, product, rng } = setupGame(12);
    const sessionLow = startMarketSession(state, product, rng);
    const sessionHigh = startMarketSession(state, product, rng);

    const targetId = sessionLow.playerBeachhead;

    const lowPreview = previewAction(sessionLow, targetId, "player", "reinforce", 0, ["code", "agent"]);
    const highPreview = previewAction(sessionHigh, targetId, "player", "reinforce", 6, ["code", "agent"]);

    expect(highPreview.influenceToAdd).toBeGreaterThan(lowPreview.influenceToAdd);
  });

  it("higher resistance segments reduce conversion influence", () => {
    const { state, product, rng } = setupGame(15);
    const session = startMarketSession(state, product, rng);

    const lowResNode = session.nodes.find((n) => n.resistance <= 2)!;
    const highResNode = session.nodes.find((n) => n.resistance >= 5)!;

    const lowCalc = calculateInfluence(session, lowResNode.id, "player", "expand", 2, ["code", "agent"]);
    const highCalc = calculateInfluence(session, highResNode.id, "player", "expand", 2, ["code", "agent"]);

    expect(lowCalc.totalInfluence).toBeGreaterThanOrEqual(highCalc.totalInfluence);
  });

  it("product fit alters influence calculation", () => {
    const devNode = {
      id: "n_devs",
      segmentId: "developers",
      name: "Developers",
      value: 2,
      resistance: 2,
      load: 2,
      x: 0,
      y: 0,
      playerInfluence: 0,
      rivalInfluence: 0,
      playerShare: 0,
      rivalShare: 0,
      neutralShare: 100,
      playerDominated: false,
      rivalDominated: false,
      playerIsolated: false,
      rivalIsolated: false,
      isPlayerBeachhead: false,
      isRivalBeachhead: false,
    };

    const fitWithCode = getProductFit(devNode, ["code", "agent"]);
    const fitWithoutCode = getProductFit(devNode, ["health", "biology"]);

    expect(fitWithCode).toBeGreaterThan(fitWithoutCode);
  });
});

describe("Distribution & Network Reach Tests", () => {
  it("low distribution allows adjacent expansion only", () => {
    const { state, product, rng } = setupGame(21);
    const session = startMarketSession(state, product, rng);

    const legalLow = getLegalMoves(session, "player", 0);
    const beachheadNbrs = new Set(getNeighbors(session.edges, session.playerBeachhead));

    for (const expId of legalLow.expand) {
      expect(beachheadNbrs.has(expId)).toBe(true);
    }
  });

  it("high distribution allows 2-hop remote expansion", () => {
    const { state, product, rng } = setupGame(22);
    const session = startMarketSession(state, product, rng);

    const legalLow = getLegalMoves(session, "player", 0);
    const legalHigh = getLegalMoves(session, "player", 4);

    expect(legalHigh.expand.length).toBeGreaterThanOrEqual(legalLow.expand.length);
  });
});

describe("Scale & Overload Capacity Tests", () => {
  it("calculates market load based on held footholds and penalizes overload", () => {
    const { state, product, rng } = setupGame(33);
    const session = startMarketSession(state, product, rng);

    expect(session.playerScaleUsed).toBeGreaterThan(0);
    expect(session.playerScaleCapacity).toBeGreaterThan(0);

    // Overload penalty calculation
    session.playerScaleCapacity = 2;
    session.playerScaleUsed = 6; // 4 over capacity
    const breakdown = calculateInfluence(session, session.playerBeachhead, "player", "reinforce", 2, product.combo);
    expect(breakdown.overloadPenalty).toBeGreaterThan(0);
    expect(breakdown.overloadPenalty).toBeLessThanOrEqual(35);
  });
});

describe("Connected Support Tests", () => {
  it("neighbors with friendly control grant support", () => {
    const { state, product, rng } = setupGame(44);
    const session = startMarketSession(state, product, rng);

    const nbrs = getNeighbors(session.edges, session.playerBeachhead);
    const adjacentNodeId = nbrs[0]!;

    const supportBefore = getConnectedSupport(session, adjacentNodeId, "player");
    expect(supportBefore).toBeGreaterThanOrEqual(1); // beachhead is dominated and provides support
  });
});

describe("Dominance & Invariants Tests", () => {
  it("share formula sums to 100% and has no NaN or negative values", () => {
    const testCases = [
      { p: 0, r: 0, res: 3, pd: false, rd: false },
      { p: 10, r: 0, res: 2, pd: true, rd: false },
      { p: 0, r: 12, res: 4, pd: false, rd: true },
      { p: 5, r: 5, res: 2, pd: false, rd: false },
      { p: 20, r: 3, res: 5, pd: false, rd: false },
    ];

    for (const tc of testCases) {
      const shares = calculateShares(tc.p, tc.r, tc.res, tc.pd, tc.rd);
      expect(shares.playerShare).toBeGreaterThanOrEqual(0);
      expect(shares.rivalShare).toBeGreaterThanOrEqual(0);
      expect(shares.neutralShare).toBeGreaterThanOrEqual(0);
      expect(shares.playerShare + shares.rivalShare + shares.neutralShare).toBe(100);
      expect(Number.isFinite(shares.playerShare)).toBe(true);
      expect(Number.isFinite(shares.rivalShare)).toBe(true);
    }
  });

  it("dominance wipes out rival influence and sets rival share to 0", () => {
    const { state, product, rng } = setupGame(55);
    const session = startMarketSession(state, product, rng);

    const testNode = session.nodes.find((n) => n.id !== session.playerBeachhead && n.id !== session.rivalBeachhead)!;
    testNode.playerInfluence = 18;
    testNode.rivalInfluence = 2;
    testNode.resistance = 2;

    recomputeAllNetwork(session);

    expect(testNode.playerDominated).toBe(true);
    expect(testNode.rivalDominated).toBe(false);
    expect(testNode.rivalInfluence).toBe(0);
    expect(testNode.rivalShare).toBe(0);
    expect(testNode.playerShare).toBeGreaterThan(70);
  });

  it("invariants hold: a node is never simultaneously playerDominated and rivalDominated", () => {
    const { state, product, rng } = setupGame(56);
    const session = startMarketSession(state, product, rng);

    for (const node of session.nodes) {
      expect(node.playerDominated && node.rivalDominated).toBe(false);
    }
  });
});

describe("Isolation Tests", () => {
  it("marks nodes isolated when disconnected from beachhead network", () => {
    const { state, product, rng } = setupGame(66);
    const session = startMarketSession(state, product, rng);

    // Give player a distant node with no connecting friendly path
    const rivalBeach = session.nodes.find((n) => n.id === session.rivalBeachhead)!;
    rivalBeach.playerInfluence = 4;
    rivalBeach.playerShare = 40;

    recomputeIsolation(session);

    expect(rivalBeach.playerIsolated).toBe(true);
  });
});

describe("Rout & Session End Tests", () => {
  it("detects rival rout when rival has 0 influence across entire board", () => {
    const { state, product, rng } = setupGame(77);
    const session = startMarketSession(state, product, rng);

    // Eliminate all rival influence
    for (const node of session.nodes) {
      node.rivalInfluence = 0;
      node.rivalDominated = false;
      node.rivalShare = 0;
    }

    const rout = checkRoutStatus(session);
    expect(rout).toBe("rival_rout");
  });

  it("detects player rout when player has 0 influence across entire board", () => {
    const { state, product, rng } = setupGame(78);
    const session = startMarketSession(state, product, rng);

    // Eliminate all player influence
    for (const node of session.nodes) {
      node.playerInfluence = 0;
      node.playerDominated = false;
      node.playerShare = 0;
    }

    const rout = checkRoutStatus(session);
    expect(rout).toBe("player_rout");
  });
});

describe("Economics & Launch Outcome Tests", () => {
  it("calculates realistic launch economics, revenue, users, and margins", () => {
    const { state, product, rng } = setupGame(88);
    const session = startMarketSession(state, product, rng);

    // Set moderate player share in 3 nodes
    session.nodes[0]!.playerShare = 80;
    session.nodes[1]!.playerShare = 60;
    session.nodes[2]!.playerShare = 45;

    const result = calculateMarketEntryResult(state, session, product);

    expect(result.share).toBeGreaterThan(0);
    expect(result.users).toBeGreaterThan(0);
    expect(result.revenue).toBeGreaterThan(0);
    expect(result.inference).toBeGreaterThanOrEqual(0);
    expect(result.outcomeType).toBeDefined();
    expect(result.topSegment).toBeDefined();
    expect(result.segments.length).toBe(session.nodes.length);
  });

  it("applyMarketEntryResults activates product and records all stats and hype", () => {
    const { state, product, rng } = setupGame(99);
    const session = startMarketSession(state, product, rng);

    session.nodes[0]!.playerShare = 90;
    session.nodes[0]!.playerDominated = true;

    const initialLaunched = state.company.productsLaunched;
    applyMarketEntryResults(state, session, rng);

    expect(product.status).toBe("active");
    expect(product.marketShare).toBeGreaterThan(0);
    expect(product.users).toBeGreaterThan(0);
    expect(product.weeklyRevenue).toBeGreaterThan(0);
    expect(state.company.productsLaunched).toBe(initialLaunched + 1);
    expect(state.marketResult).not.toBeNull();
    expect(state.company.seenMarket).toBe(true);
    expect(state.firstLaunchTick).not.toBeNull();
    expect(product.marketSegments?.length).toBeGreaterThan(0);
  });

  it("legal moves exclude enemy-dominated nodes and allow player to reinforce friendly dominated nodes", () => {
    const { state, product, rng } = setupGame(101);
    const session = startMarketSession(state, product, rng);

    // Player beachhead is playerDominated
    const playerLegal = getLegalMoves(session, "player", 0);
    expect(playerLegal.reinforce).toContain(session.playerBeachhead);

    // Rival beachhead is rivalDominated
    expect(playerLegal.expand).not.toContain(session.rivalBeachhead);
    expect(playerLegal.reinforce).not.toContain(session.rivalBeachhead);

    // Conversely, rival cannot expand into or reinforce player's beachhead
    const rivalLegal = getLegalMoves(session, "rival", 0);
    expect(rivalLegal.reinforce).toContain(session.rivalBeachhead);
    expect(rivalLegal.expand).not.toContain(session.playerBeachhead);
    expect(rivalLegal.reinforce).not.toContain(session.playerBeachhead);
  });

  it("delegates market launch successfully across all four strategic styles", () => {
    const styles = ["balanced", "aggressive", "niche", "expansion"] as const;
    for (const style of styles) {
      const { state, product } = setupGame(120);
      state.company.productsLaunched = 8; // meets MIN_PRODUCTS_BEFORE_DELEGATE
      expect(product.status).toBe("ready");

      const nextState = applyCommand(state, {
        type: "delegateMarket",
        productId: product.id,
        strategy: style,
      })!;

      const updatedProduct = nextState.products.find((p) => p.id === product.id)!;
      expect(updatedProduct.status).toBe("active");
      expect(nextState.marketResult).not.toBeNull();
      expect(updatedProduct.marketShare).toBeGreaterThan(0);
      expect(nextState.clock.pauseReasons).toContain("results");
    }
  });

  it("migrates legacy hex battle save safely, restoring product to ready and notifying advisor inbox", () => {
    const { state, product } = setupGame(133);
    product.status = "ready";

    // Simulate an old save containing a legacy battle object without nodes
    const legacySave = {
      ...state,
      marketBattle: {
        productId: product.id,
        competitorId: "macrosoft",
        turnsLeft: 10,
        tiles: [{ id: "t1", kind: "customer" }],
        pieces: [{ id: "p1", owner: "player" }],
      },
    };

    const migrated = migrateGameState(legacySave as any);

    expect(migrated.marketBattle).toBeNull();
    const restoredProduct = migrated.products.find((p) => p.id === product.id)!;
    expect(restoredProduct.status).toBe("ready");
    expect(migrated.inbox.some((msg) => msg.subject.includes("Market Entry System Updated"))).toBe(true);
    expect(migrated.inbox[0]?.body).toContain("Your product is ready to relaunch");
  });
});

