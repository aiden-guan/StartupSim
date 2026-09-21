import { BALANCE } from "../config/balance.js";
import { primitiveById } from "../data/primitives.js";
import { findRecipe } from "../data/recipes.js";
import { modelById } from "../data/models.js";
import { calculateModelImpact, calculateWeeklyProductInference } from "./modelImpact.js";
import { PRICING_MODELS } from "../data/pricing.js";
import { GTM_STRATEGIES } from "../data/gtm.js";
import { isServiceProductStatus, type GameState, type LaunchStat, type Product, type ProductPoints } from "./types.js";
import { uid, type Rng } from "./rng.js";
import { calculateWeeklyProductOperations, gtmExecutionMultiplier, gtmFitAnalysis, marketDemandMultiplier } from "./gtm.js";
import { isModelAvailable } from "./effects.js";

const epsilon = 1e-12;

export function marketScaleMultiplier(state: GameState): number {
  const startMonth = BALANCE.START_YEAR * 12 + (BALANCE.START_MONTH - 1);
  const currentMonth = state.clock.date.year * 12 + (state.clock.date.month - 1);
  const elapsedYears = Math.max(0, (currentMonth - startMonth) / 12);
  return Math.min(BALANCE.MARKET_SCALE_CAP, Math.pow(BALANCE.MARKET_SCALE_ANNUAL_GROWTH, elapsedYears));
}

export function recipeNameKey(a: string, b: string): string {
  return [a, b].sort().join(".");
}

export function findProductByCombo(products: Product[], a: string, b: string): Product | undefined {
  const key = recipeNameKey(a, b);
  return products.find((product) => recipeNameKey(product.combo[0], product.combo[1]) === key);
}

export function requiredProgress(difficulty: number, first: boolean): number {
  const base = Math.exp(difficulty / 5) * BALANCE.PROGRESS_PER_DIFFICULTY;
  return first ? base / BALANCE.FIRST_PRODUCT_SPEED : base;
}

export function createProduct(state: GameState, a: string, b: string, rng: Rng): Product {
  const pa = primitiveById[a];
  const pb = primitiveById[b];
  if (!pa || !pb) throw new Error("unknown primitive");
  const recipe = findRecipe(a, b);
  const difficulty = pa.difficulty + pb.difficulty + (recipe?.difficultyMod ?? 0);
  const ea = state.company.expertise[a] ?? 0;
  const eb = state.company.expertise[b] ?? 0;
  const revenueScore =
    pa.difficulty * (ea + 1) + pb.difficulty * (eb + 1) * (recipe ? recipe.innovation : 0.55);
  const name = recipe?.name ?? `${pa.name} ${pb.name}`;
  const modelId = isModelAvailable(state, state.currentModelId)
    ? state.currentModelId
    : state.ownedModels.find((candidate) => isModelAvailable(state, candidate)) ?? state.currentModelId;
  return {
    id: uid(rng, "prd"),
    name,
    combo: [a, b].sort() as [string, string],
    recipeId: recipe?.id ?? "generic",
    description: recipe?.description ?? `A generic ${pa.name.toLowerCase()} / ${pb.name.toLowerCase()} mashup. The deck calls it a platform.`,
    status: "development",
    difficulty,
    revenueScore,
    points: { engineering: 0, product: 0, growth: 0, research: 0 },
    levels: { deployment: 0, capability: 0, distribution: 0 },
    version: 1,
    newDiscovery: false,
    vertical: recipe?.vertical ?? "consumer",
    riskTags: recipe?.riskTags ?? ["slop"],
    businessModel: "freemium",
    gtmStrategy: recipe?.vertical === "developer" ? "developer-first" : "product-led",
    modelId,
    marketShare: 0,
    weeklyRevenue: 0,
    weeklyInference: 0,
    weeklyOperatingCost: 0,
    retentionRate: BALANCE.REVENUE_DECAY,
    gtmFit: 50,
    weeklyGrowthRate: 0,
    rampWeeks: 0,
    users: 0,
    reliability: 0.55,
    ageWeeks: 0,
    earnedRevenue: 0,
    technicalDebt: 0,
    competitorId: null,
  };
}

export function launchCosts(product: Product): Record<LaunchStat, number> {
  const d = Math.max(2, product.difficulty);
  const pow = (level: number, coeff: number) => coeff * d * d * Math.pow(3, level);
  return {
    deployment: pow(product.levels.deployment, 5),
    capability: pow(product.levels.capability, 1),
    distribution: pow(product.levels.distribution, 3),
  };
}

export function requiredFor(stat: LaunchStat): (keyof ProductPoints)[] {
  if (stat === "deployment") return ["engineering", "growth"];
  if (stat === "capability") return ["engineering", "product"];
  return ["growth", "product"];
}

export function canAffordStat(product: Product, stat: LaunchStat): boolean {
  const cost = launchCosts(product)[stat];
  return requiredFor(stat).every((s) => product.points[s] >= cost);
}

export function canAffordAnyStat(product: Product): boolean {
  return (["deployment", "capability", "distribution"] as const).some(
    (stat) => product.levels[stat] < BALANCE.MAX_LAUNCH_LEVEL && canAffordStat(product, stat),
  );
}

export function buyLaunchStat(product: Product, stat: LaunchStat): boolean {
  if (product.levels[stat] >= BALANCE.MAX_LAUNCH_LEVEL) return false;
  if (!canAffordStat(product, stat)) return false;
  const cost = launchCosts(product)[stat];
  for (const s of requiredFor(stat)) product.points[s] -= cost;
  product.levels[stat] += 1;
  return true;
}

export function refundLaunchStat(product: Product, stat: LaunchStat): boolean {
  if (product.levels[stat] <= 0) return false;
  product.levels[stat] -= 1;
  const cost = launchCosts(product)[stat];
  for (const s of requiredFor(stat)) product.points[s] += cost;
  return true;
}

export function uncreativityDecay(version: number): number {
  return Math.max(
    BALANCE.MIN_UNCREATIVITY,
    Math.log10(Math.max(0, -(version - 1) * BALANCE.UNCREATIVITY_STRENGTH + 10) + epsilon),
  );
}

export function shareToRevenue(incomeLevel: number, product: Product): number {
  const junk = product.recipeId === "generic" ? 0.55 : 1;
  return (
    Math.pow(incomeLevel + 1, 2) *
    Math.round(
      (BALANCE.BASE_REVENUE_PER_SHARE + BALANCE.EXTRA_REVENUE_PER_DIFFICULTY * (product.difficulty - 2)) *
        uncreativityDecay(product.version),
    ) *
    product.revenueScore *
    junk
  );
}

export function economyMult(state: GameState): number {
  switch (state.economy) {
    case "depression" as string:
    case "recession":
      return 0.55;
    case "slowdown":
    case "creditCrunch":
      return 0.75;
    case "boom":
      return 1.25;
    case "aiBubble":
      return 1.4;
    default:
      return 1;
  }
}

export function setProductEconomics(
  product: Product,
  state: GameState,
  capturedIncome: { income: number }[],
  influencers: number,
): void {
  const pricing = PRICING_MODELS[product.businessModel] ?? PRICING_MODELS.freemium;
  const strategy = GTM_STRATEGIES[product.gtmStrategy] ?? GTM_STRATEGIES["product-led"];
  const fit = gtmFitAnalysis(state, product, strategy.id);
  const execution = gtmExecutionMultiplier(fit.score);
  const model = modelById[product.modelId];
  const modelImpact = model ? calculateModelImpact({
    model,
    product,
    technologies: state.company.technologies,
    worldInferenceCostIndex: state.world.inferenceCostIndex,
  }) : null;
  const demand = marketDemandMultiplier(state, product) * (modelImpact?.demandMultiplier ?? 1);
  const hypeMult = 1 + Math.max(0, Math.sqrt(state.company.hype) * BALANCE.HYPE_MULTIPLIER_SCALE);
  const infMult = 1 + influencers * 0.45;
  const disc = product.newDiscovery ? BALANCE.NEW_PRODUCT_MULTIPLIER : 1;
  const loc = 1 + state.company.locations.length * BALANCE.LOCATION_MULTIPLIER;
  const marketScale = marketScaleMultiplier(state);
  const base = capturedIncome.reduce((s, t) => s + shareToRevenue(t.income, product), 0) * marketScale;
  const trust = Math.max(0.6, state.company.trust / 70);

  const users = Math.max(
    0,
    Math.round((product.marketShare / 100) * 12_000 * marketScale * (1 + product.levels.deployment * 0.12) * pricing.userMultiplier * strategy.volumeMultiplier * strategy.rampMultiplier * execution * demand),
  );
  product.users = users;

  const pa = primitiveById[product.combo[0]];
  const pb = primitiveById[product.combo[1]];
  product.weeklyInference = model ? calculateWeeklyProductInference({
    users,
    combo: product.combo,
    pricingTokenMultiplier: pricing.tokenMultiplier,
    model,
    hasEfficientInferenceTech: state.company.technologies.includes("efficient-inference"),
    worldInferenceCostIndex: state.world.inferenceCostIndex,
    computeWeightA: pa?.computeWeight ?? 1,
    computeWeightB: pb?.computeWeight ?? 1,
  }) : 0;

  let calculatedRevenue = Math.round(
    (base / 3.2) * pricing.revenueMultiplier * strategy.revenueMultiplier * strategy.rampMultiplier * execution * demand * hypeMult * infMult * disc * economyMult(state) * loc * trust,
  );
  if (pricing.costPlusMargin !== null && product.weeklyInference > 0) {
    const minCostPlus = Math.round(product.weeklyInference / (1 - pricing.costPlusMargin));
    calculatedRevenue = Math.max(calculatedRevenue, minCostPlus);
  }
  product.weeklyRevenue = Math.max(0, calculatedRevenue);
  product.gtmFit = fit.score;
  product.reliability = modelImpact?.estimatedReliability ?? Math.min(
    0.98,
    0.5 + product.points.engineering / 400 + (model?.reliability ?? 5) / 20,
  );
  product.retentionRate = Math.min(0.998, strategy.weeklyRetention + (product.reliability - 0.7) * 0.02 + (state.company.trust - 60) / 10_000);
  product.weeklyGrowthRate = strategy.weeklyGrowthRate;
  product.rampWeeks = strategy.rampWeeks;
  product.weeklyOperatingCost = calculateWeeklyProductOperations(state, product, users, product.weeklyRevenue, fit.score);
}

export function harvestProduct(product: Product, rng: Rng, serviceMultiplier = 1): { revenue: number; inference: number; operations: number } {
  if (!isServiceProductStatus(product.status)) {
    return { revenue: 0, inference: 0, operations: 0 };
  }
  const range = product.weeklyRevenue * 0.1;
  const collected = Math.max(0, rng.float(product.weeklyRevenue - range, product.weeklyRevenue + range));
  const revenue = Math.round(collected * Math.max(0, Math.min(1, serviceMultiplier)));
  const inference = product.weeklyInference;
  const operations = product.weeklyOperatingCost;
  const change = product.ageWeeks < product.rampWeeks ? 1 + product.weeklyGrowthRate : product.retentionRate;
  product.weeklyRevenue *= change;
  product.users = Math.max(0, Math.round(product.users * change));
  product.weeklyInference *= change;
  product.weeklyOperatingCost *= change;
  product.earnedRevenue += revenue;
  product.ageWeeks += 1;
  if (product.ageWeeks > 16) product.status = "mature";
  if (product.weeklyRevenue < 400 && product.ageWeeks > 8) product.status = "declining";
  if (product.weeklyRevenue < 40 && product.ageWeeks > 12) product.status = "deprecated";
  return { revenue, inference, operations };
}
