import { describe, expect, it } from "vitest";
import { BALANCE } from "../config/balance";
import { PRICING_MODELS, PRICING_MODEL_LIST } from "../data/pricing";
import { startMarketSession, calculateMarketEntryResult } from "../market/marketMap";
import { createNewGame } from "./newGame";
import { createProduct, harvestProduct } from "./products";
import { Rng } from "./rng";
import type { BusinessModel, GameState, Product } from "./types";

function setupProductGame(model: BusinessModel = "freemium", seed = 42): { state: GameState; product: Product; rng: Rng } {
  const rng = new Rng(seed);
  const state = createNewGame({
    founderName: "Ada",
    companyName: "HyperScale",
    cofounderId: "reya",
    seed,
  });
  const product = createProduct(state, "chat", "writing", rng);
  product.businessModel = model;
  product.levels = { deployment: 1, capability: 2, distribution: 1 };
  product.status = "ready";
  state.products.push(product);
  return { state, product, rng };
}

describe("Pricing Models Catalog", () => {
  it("defines all 7 business models with realistic parameters", () => {
    expect(PRICING_MODEL_LIST).toHaveLength(7);
    const requiredKeys: BusinessModel[] = [
      "freemium",
      "subscription",
      "enterprise",
      "usage",
      "api",
      "ads",
      "free",
    ];
    for (const key of requiredKeys) {
      const p = PRICING_MODELS[key];
      expect(p).toBeDefined();
      expect(p.name).toBeTruthy();
      expect(p.tagline).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.userMultiplier).toBeGreaterThan(0);
      expect(p.tokenMultiplier).toBeGreaterThan(0);
      expect(p.revenueMultiplier).toBeGreaterThan(0);
      expect(p.marginTarget).toBeTruthy();
      expect(p.bestFor).toBeTruthy();
    }
  });
});

describe("Pricing Models Economics in Market Launch", () => {
  it("generates positive gross margins for Freemium on competitive launches", () => {
    const { state, product, rng } = setupProductGame("freemium");
    const session = startMarketSession(state, product, rng);

    // Give player solid footholds
    session.nodes[0]!.playerShare = 80;
    session.nodes[1]!.playerShare = 55;
    session.nodes[2]!.playerShare = 40;

    const result = calculateMarketEntryResult(state, session, product);
    expect(result.revenue).toBeGreaterThan(result.inference);
    expect(result.grossProfit).toBeGreaterThan(0);
    const margin = (result.grossProfit / result.revenue) * 100;
    expect(margin).toBeGreaterThanOrEqual(45);
  });

  it("yields high gross margins (>70%) for Subscription pricing", () => {
    const { state, product, rng } = setupProductGame("subscription");
    const session = startMarketSession(state, product, rng);

    session.nodes[0]!.playerShare = 75;
    session.nodes[1]!.playerShare = 60;

    const result = calculateMarketEntryResult(state, session, product);
    expect(result.grossProfit).toBeGreaterThan(0);
    const margin = (result.grossProfit / result.revenue) * 100;
    expect(margin).toBeGreaterThanOrEqual(70);
  });

  it("yields very high revenue per user and high gross margins for Enterprise pricing", () => {
    const { state, product, rng } = setupProductGame("enterprise");
    const session = startMarketSession(state, product, rng);

    session.nodes[0]!.playerShare = 70;
    session.nodes[1]!.playerShare = 50;

    const result = calculateMarketEntryResult(state, session, product);
    expect(result.grossProfit).toBeGreaterThan(0);
    const margin = (result.grossProfit / result.revenue) * 100;
    expect(margin).toBeGreaterThanOrEqual(70);
  });

  it("guarantees a protected gross margin floor on Usage-Based pricing even with heavy compute", () => {
    const { state, product, rng } = setupProductGame("usage");
    // Simulate heavy compute primitive
    product.combo = ["agent", "reasoning"];
    const session = startMarketSession(state, product, rng);

    session.nodes[0]!.playerShare = 80;
    session.nodes[1]!.playerShare = 60;

    const result = calculateMarketEntryResult(state, session, product);
    expect(result.inference).toBeGreaterThan(0);
    expect(result.grossProfit).toBeGreaterThan(0);
    const margin = (result.grossProfit / result.revenue) * 100;
    expect(margin).toBeGreaterThanOrEqual(60);
  });

  it("awards bonus hype on Free open beta launch with bounded loss", () => {
    const { state, product, rng } = setupProductGame("free");
    const session = startMarketSession(state, product, rng);

    session.nodes[0]!.playerShare = 80;
    session.nodes[1]!.playerShare = 60;

    const result = calculateMarketEntryResult(state, session, product);
    expect(result.hype).toBeGreaterThanOrEqual(8);
    expect(result.users).toBeGreaterThan(0);
  });
});

describe("Symmetric Product Aging & Decay", () => {
  it("decays users and inference alongside revenue in harvestProduct", () => {
    const rng = new Rng(123);
    const { product } = setupProductGame("freemium");
    product.status = "active";
    product.weeklyRevenue = 2000;
    product.weeklyInference = 400;
    product.users = 5000;

    const initialRev = product.weeklyRevenue;
    const initialInf = product.weeklyInference;
    const initialUsers = product.users;

    harvestProduct(product, rng);

    expect(product.weeklyRevenue).toBeCloseTo(initialRev * BALANCE.REVENUE_DECAY, 1);
    expect(product.weeklyInference).toBeCloseTo(initialInf * BALANCE.REVENUE_DECAY, 1);
    expect(product.users).toBe(Math.round(initialUsers * BALANCE.REVENUE_DECAY));
  });
});
