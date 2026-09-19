import { describe, expect, it } from "vitest";
import { BALANCE } from "../config/balance";
import { applyCommand } from "./commands";
import {
  findReachableTerminalAllocations,
  optimizeProductLaunch,
  recommendLaunchConfiguration,
} from "./launchOptimization";
import { createNewGame } from "./newGame";
import { canAffordAnyStat, createProduct } from "./products";
import { Rng } from "./rng";
import type { GameState, Product } from "./types";

function setupReadyProduct(seed = 42): { state: GameState; product: Product } {
  const rng = new Rng(seed);
  const state = createNewGame({
    founderName: "Ada",
    companyName: "HyperScale",
    cofounderId: "dustin-moskovitz",
    skipTutorial: true,
  });
  const product = createProduct(state, "chat", "writing", rng);
  product.status = "ready";
  product.points = { engineering: 12, product: 10, growth: 8, research: 0 };
  state.products.push(product);
  return { state, product };
}

describe("Launch Optimization Engine", () => {
  it("allocates all spendable launch points without leaving affordable upgrades unspent", () => {
    const { product } = setupReadyProduct();
    product.points = { engineering: 40, product: 35, growth: 25, research: 0 };

    const terminalNodes = findReachableTerminalAllocations(product);
    expect(terminalNodes.length).toBeGreaterThan(0);

    for (const node of terminalNodes) {
      const mockProduct: Product = {
        ...product,
        points: { ...node.points },
        levels: { ...node.levels },
      };
      // In every terminal node, no further upgrades can be afforded
      expect(canAffordAnyStat(mockProduct)).toBe(false);
      // Total levels invested should be non-zero
      expect(node.levels.capability + node.levels.deployment + node.levels.distribution).toBeGreaterThan(0);
    }
  });

  it("selects valid available AI models and respects model availability", () => {
    const { state, product } = setupReadyProduct();
    state.ownedModels = ["claudius-instant", "openbrain-o3"];

    const recommendation = recommendLaunchConfiguration(state, product);
    expect(state.ownedModels).toContain(recommendation.modelId);
    expect(recommendation.allocatedLevels).toBeDefined();
    expect(recommendation.businessModel).toBeDefined();
    expect(recommendation.gtmStrategy).toBeDefined();
  });

  it("does not simply pick the most expensive model when a cheaper model provides better net economics", () => {
    const { state, product } = setupReadyProduct();
    // Give player both an ultra-expensive model and cost-effective models
    state.ownedModels = ["openbrain-o4", "claudius-instant", "metamind-34b"];

    const recommendation = recommendLaunchConfiguration(state, product);
    // Should choose a model that yields sustainable net contribution and healthy gross margin
    expect(recommendation.economics.grossMargin).toBeGreaterThanOrEqual(0.4);
    expect(recommendation.economics.netContribution).toBeGreaterThan(0);
  });

  it("recommends viable commercial business models and fitting GTM strategies", () => {
    const { state, product } = setupReadyProduct();
    const recommendation = recommendLaunchConfiguration(state, product);

    expect(recommendation.businessModel).not.toBe("free"); // Should recommend a monetizable model
    expect(["freemium", "subscription", "enterprise", "usage", "api", "ads"]).toContain(
      recommendation.businessModel,
    );
    expect(["product-led", "direct-consumer", "smb-sales", "enterprise-sales", "developer-first", "partnerships"]).toContain(
      recommendation.gtmStrategy,
    );
  });

  it("updates product configuration in-place during optimizeProductLaunch", () => {
    const { state, product } = setupReadyProduct();
    const result = optimizeProductLaunch(state, product);

    expect(product.levels).toEqual(result.allocatedLevels);
    expect(product.modelId).toBe(result.modelId);
    expect(product.businessModel).toBe(result.businessModel);
    expect(product.gtmStrategy).toBe(result.gtmStrategy);
    expect(product.gtmFit).toBe(result.economics.fitScore);
  });
});

describe("Optimize Launch Game Command & Auto-Delegate Interactions", () => {
  it("when Auto-Delegate is OFF: optimizes launch configuration, product remains ready, and player can launch manually", () => {
    const { state, product } = setupReadyProduct();
    state.settings.autoDelegate = false;

    const nextState = applyCommand(state, {
      type: "optimizeLaunch",
      productId: product.id,
      autoDelegate: false,
    });
    expect(nextState).not.toBeNull();
    const updated = nextState!.products.find((p) => p.id === product.id)!;

    // 1. Status remains ready
    expect(updated.status).toBe("ready");
    // 2. Points were invested
    expect(updated.levels.capability + updated.levels.deployment + updated.levels.distribution).toBeGreaterThan(0);
    // 3. Model, business model, and GTM strategy are assigned
    expect(updated.modelId).toBeTruthy();
    expect(updated.businessModel).toBeTruthy();
    expect(updated.gtmStrategy).toBeTruthy();
    // 4. Market was NOT entered automatically
    expect(nextState!.marketBattle).toBeNull();
    expect(nextState!.marketResult).toBeNull();

    // 5. Player can proceed to enter market manually
    const launchedState = applyCommand(nextState, {
      type: "enterMarket",
      productId: product.id,
    });
    expect(launchedState).not.toBeNull();
    expect(launchedState!.marketBattle).not.toBeNull();
  });

  it("when Auto-Delegate is ON: optimizes launch configuration and automatically executes market delegation", () => {
    const { state, product } = setupReadyProduct();
    // Enable autoDelegate and meet product threshold for delegation
    state.settings.autoDelegate = true;
    state.company.productsLaunched = BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE;

    const nextState = applyCommand(state, {
      type: "optimizeLaunch",
      productId: product.id,
      autoDelegate: true,
    });
    expect(nextState).not.toBeNull();
    const updated = nextState!.products.find((p) => p.id === product.id)!;

    // 1. Product becomes active
    expect(updated.status).toBe("active");
    // 2. Market results were generated
    expect(nextState!.marketResult).not.toBeNull();
    expect(nextState!.marketResult?.productId).toBe(product.id);
    expect(nextState!.marketResult?.delegated).toBe(true);
    // 3. Points and choices were preserved on the product
    expect(updated.levels.capability + updated.levels.deployment + updated.levels.distribution).toBeGreaterThan(0);
    expect(updated.modelId).toBeTruthy();
    expect(updated.businessModel).toBeTruthy();
    expect(updated.gtmStrategy).toBeTruthy();
  });

  it("when Auto-Delegate is ON but player has not reached MIN_PRODUCTS_BEFORE_DELEGATE: prepares product without delegation", () => {
    const { state, product } = setupReadyProduct();
    state.settings.autoDelegate = true;
    state.company.productsLaunched = 0; // Less than MIN_PRODUCTS_BEFORE_DELEGATE

    const nextState = applyCommand(state, {
      type: "optimizeLaunch",
      productId: product.id,
      autoDelegate: true,
    });
    expect(nextState).not.toBeNull();
    const updated = nextState!.products.find((p) => p.id === product.id)!;

    // Product is prepared with optimal choices
    expect(updated.status).toBe("ready");
    expect(updated.levels.capability + updated.levels.deployment + updated.levels.distribution).toBeGreaterThan(0);
    // But does not delegate because threshold is not yet met
    expect(nextState!.marketResult).toBeNull();
  });
});
