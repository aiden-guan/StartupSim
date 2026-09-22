import { BALANCE } from "../config/balance";
import { availableGtmStrategies, GTM_STRATEGIES } from "../data/gtm";
import { modelById, models } from "../data/models";
import { PRICING_MODELS } from "../data/pricing";
import { primitiveById } from "../data/primitives";
import { isModelAvailable } from "./effects";
import {
  calculateWeeklyProductOperations,
  gtmExecutionMultiplier,
  gtmFitAnalysis,
  marketDemandMultiplier,
} from "./gtm";
import { calculateModelImpact, calculateWeeklyProductInference } from "./modelImpact";
import {
  buyLaunchStat,
  canAffordStat,
  marketScaleMultiplier,
  refundLaunchStat,
} from "./products";
import { launchStrength } from "../market/marketMap";
import type {
  BusinessModel,
  DelegationStrategy,
  GameState,
  GtmStrategy,
  LaunchStat,
  Product,
  ProductPoints,
} from "./types";

const ALL_STATS: LaunchStat[] = ["capability", "deployment", "distribution"];
const ALL_MODELS: BusinessModel[] = [
  "freemium",
  "subscription",
  "enterprise",
  "usage",
  "api",
  "ads",
  "free",
];

export interface LaunchEconomicsProjection {
  estUsers: number;
  estRevenue: number;
  estInference: number;
  estOperations: number;
  grossProfit: number;
  grossMargin: number;
  netContribution: number;
  fitScore: number;
  demandMultiplier: number;
  reliability: number;
}

export interface LaunchOptimizationResult {
  allocatedLevels: { capability: number; deployment: number; distribution: number };
  remainingPoints: ProductPoints;
  modelId: string;
  businessModel: BusinessModel;
  gtmStrategy: GtmStrategy;
  delegationStrategy: DelegationStrategy;
  economics: LaunchEconomicsProjection;
  score: number;
}

interface CandidateEvaluationCache {
  gtmFits: Map<string, ReturnType<typeof gtmFitAnalysis>>;
  modelImpacts: Map<string, ReturnType<typeof calculateModelImpact>>;
}

/**
 * Evaluates projected launch economics using the same economic and gameplay formulas
 * found in products.ts and panels.tsx.
 */
function calculateCandidateEconomicsInternal(
  state: GameState,
  product: Product,
  businessModel: BusinessModel,
  gtmStrategy: GtmStrategy,
  modelId: string,
  levels: { capability: number; deployment: number; distribution: number },
  cache?: CandidateEvaluationCache,
): LaunchEconomicsProjection {
  const pricing = PRICING_MODELS[businessModel] ?? PRICING_MODELS.freemium;
  const strategy = GTM_STRATEGIES[gtmStrategy] ?? GTM_STRATEGIES["product-led"];

  // Clone a lightweight mock product for fit and impact calculations
  const mockProduct: Product = {
    ...product,
    businessModel,
    gtmStrategy,
    modelId,
    levels: { ...levels },
  };

  const fitKey = `${strategy.id}:${levels.capability},${levels.deployment},${levels.distribution}`;
  let fit = cache?.gtmFits.get(fitKey);
  if (!fit) {
    fit = gtmFitAnalysis(state, mockProduct, strategy.id);
    cache?.gtmFits.set(fitKey, fit);
  }
  const execution = gtmExecutionMultiplier(fit.score);
  const model = modelById[modelId];
  let modelImpact = model ? cache?.modelImpacts.get(modelId) : null;
  if (model && !modelImpact) {
    modelImpact = calculateModelImpact({
      model,
      product: mockProduct,
      technologies: state.company.technologies,
      worldInferenceCostIndex: state.world.inferenceCostIndex,
    });
    cache?.modelImpacts.set(modelId, modelImpact);
  }

  const demand = marketDemandMultiplier(state, mockProduct) * (modelImpact?.demandMultiplier ?? 1);
  const marketScale = marketScaleMultiplier(state);
  const scaleMult = 1 + levels.deployment * 0.15;
  const estUsers = Math.max(
    100,
    Math.round(
      7_000 *
        marketScale *
        pricing.userMultiplier *
        strategy.volumeMultiplier *
        strategy.rampMultiplier *
        execution *
        demand *
        scaleMult *
        0.8,
    ),
  );

  const pa = primitiveById[product.combo[0]];
  const pb = primitiveById[product.combo[1]];

  const estInference = model
    ? calculateWeeklyProductInference({
        users: estUsers,
        combo: product.combo,
        pricingTokenMultiplier: pricing.tokenMultiplier,
        model,
        hasEfficientInferenceTech: state.company.technologies.includes("efficient-inference"),
        worldInferenceCostIndex: state.world.inferenceCostIndex,
        computeWeightA: pa?.computeWeight ?? 1,
        computeWeightB: pb?.computeWeight ?? 1,
      })
    : 0;

  const baseRevenue =
    2.8 *
    0.6 *
    marketScale *
    (BALANCE.BASE_REVENUE_PER_SHARE + BALANCE.EXTRA_REVENUE_PER_DIFFICULTY * (product.difficulty - 2)) *
    product.revenueScore *
    (product.recipeId === "generic" ? 0.7 : 1.15);

  const hypeMult = 1 + Math.max(0, Math.sqrt(state.company.hype) * BALANCE.HYPE_MULTIPLIER_SCALE);
  const disc = product.newDiscovery ? BALANCE.NEW_PRODUCT_MULTIPLIER : 1;
  const loc = 1 + state.company.locations.length * BALANCE.LOCATION_MULTIPLIER;
  const trust = Math.max(0.6, state.company.trust / 70);

  let calculatedRev = Math.round(
    baseRevenue *
      pricing.revenueMultiplier *
      strategy.revenueMultiplier *
      strategy.rampMultiplier *
      execution *
      demand *
      hypeMult *
      disc *
      loc *
      trust *
      0.55 *
      0.85,
  );

  if (pricing.costPlusMargin !== null && estInference > 0) {
    const minCostPlus = Math.round(estInference / (1 - pricing.costPlusMargin));
    calculatedRev = Math.max(calculatedRev, minCostPlus);
  }

  const estRevenue = Math.max(0, calculatedRev);
  const estOperations = calculateWeeklyProductOperations(state, mockProduct, estUsers, estRevenue, fit.score);
  const grossProfit = estRevenue - estInference;
  const grossMargin = estRevenue > 0 ? grossProfit / estRevenue : 0;
  const netContribution = grossProfit - estOperations;
  const reliability = modelImpact?.estimatedReliability ?? 0.55;

  return {
    estUsers,
    estRevenue,
    estInference,
    estOperations,
    grossProfit,
    grossMargin,
    netContribution,
    fitScore: fit.score,
    demandMultiplier: modelImpact?.demandMultiplier ?? 1,
    reliability,
  };
}

/** Public single-candidate evaluation. Batch callers use the internal cache. */
export function calculateCandidateEconomics(
  state: GameState,
  product: Product,
  businessModel: BusinessModel,
  gtmStrategy: GtmStrategy,
  modelId: string,
  levels: { capability: number; deployment: number; distribution: number },
): LaunchEconomicsProjection {
  return calculateCandidateEconomicsInternal(state, product, businessModel, gtmStrategy, modelId, levels);
}

/**
 * Evaluates the market battle strength and gameplay utility of a candidate allocation.
 */
export function calculateLaunchPerformanceScore(
  state: GameState,
  product: Product,
  levels: { capability: number; deployment: number; distribution: number },
  economics: LaunchEconomicsProjection,
): number {
  const mockProduct: Product = {
    ...product,
    levels: { ...levels },
    gtmFit: economics.fitScore,
  };

  // Base launch strength using the game's actual formula
  const strength = launchStrength(mockProduct, state);

  let score = strength * 10;

  // 4th action per turn milestone in market battle
  if (levels.distribution >= 3) {
    score += 8;
  }

  // Capability gives direct conversion and combat power
  score += levels.capability * 2.5;

  // Scale capacity headroom for capturing and maintaining nodes without overload penalty
  score += Math.min(levels.deployment, 4) * 2;

  // Net weekly economic contribution: reward positive sustainable profit, penalize cash burn
  if (economics.netContribution > 0) {
    score += Math.log10(economics.netContribution + 1) * 6;
  } else {
    score -= Math.log10(Math.abs(economics.netContribution) + 1) * 10;
  }

  // Gross margin health: penalize when compute inference wipes out revenue
  if (economics.grossMargin >= 0.5) {
    score += economics.grossMargin * 12;
  } else if (economics.grossMargin < 0.2) {
    score -= (0.2 - economics.grossMargin) * 35;
  }

  // Customer retention & reliability impact
  score += economics.reliability * 15;

  return score;
}

interface StatAllocationNode {
  levels: { capability: number; deployment: number; distribution: number };
  points: ProductPoints;
}

/**
 * Searches for all non-dominated terminal allocations reachable from the product's
 * total pooled launch points (where no further points can be spent on any stat).
 */
export function findReachableTerminalAllocations(product: Product): StatAllocationNode[] {
  // Pool all earned points by resetting levels back to 0
  const pooledProduct: Product = {
    ...product,
    points: { ...product.points },
    levels: { ...product.levels },
  };

  while (pooledProduct.levels.capability > 0) refundLaunchStat(pooledProduct, "capability");
  while (pooledProduct.levels.deployment > 0) refundLaunchStat(pooledProduct, "deployment");
  while (pooledProduct.levels.distribution > 0) refundLaunchStat(pooledProduct, "distribution");

  const results: StatAllocationNode[] = [];
  const visited = new Set<string>();

  function search(currentProduct: Product) {
    const key = `${currentProduct.levels.capability},${currentProduct.levels.deployment},${currentProduct.levels.distribution}`;
    if (visited.has(key)) return;
    visited.add(key);

    let canBuyAny = false;
    for (const stat of ALL_STATS) {
      if (currentProduct.levels[stat] < BALANCE.MAX_LAUNCH_LEVEL && canAffordStat(currentProduct, stat)) {
        canBuyAny = true;
        // Clone and buy
        const next: Product = {
          ...currentProduct,
          points: { ...currentProduct.points },
          levels: { ...currentProduct.levels },
        };
        buyLaunchStat(next, stat);
        search(next);
      }
    }

    if (!canBuyAny) {
      results.push({
        levels: { ...currentProduct.levels },
        points: { ...currentProduct.points },
      });
    }
  }

  search(pooledProduct);
  return results.length > 0 ? results : [{ levels: { capability: 0, deployment: 0, distribution: 0 }, points: { ...pooledProduct.points } }];
}

/**
 * Determines the best-fitting delegation strategy for the product's configured strengths.
 */
export function recommendDelegationStrategy(
  levels: { capability: number; deployment: number; distribution: number },
  gtmStrategy: GtmStrategy,
): DelegationStrategy {
  if (levels.capability >= 2 && levels.distribution <= 1 && levels.deployment <= 1) {
    return "niche";
  }
  if (levels.distribution >= 2 && levels.deployment >= 2) {
    return "expansion";
  }
  if (gtmStrategy === "enterprise-sales" || (levels.capability >= 2 && levels.deployment >= 1)) {
    return "aggressive";
  }
  return "balanced";
}

/**
 * Recommends the optimal launch configuration for a ready-to-launch product.
 * Fully respects actual unlocks, model ownership, costs, product characteristics,
 * technologies, vertical, and existing game mechanics.
 */
export function recommendLaunchConfiguration(
  state: GameState,
  product: Product,
): LaunchOptimizationResult {
  // 1. Available owned AI models
  const availableModels = models.filter(
    (m) => state.ownedModels.includes(m.id) && isModelAvailable(state, m.id),
  );
  const candidateModelIds = availableModels.length > 0 ? availableModels.map((m) => m.id) : [product.modelId];

  // 2. Available GTM strategies for this product
  const candidateGtmStrategies = availableGtmStrategies(product).map((s) => s.id);

  // 3. Candidate business models (focusing on commercial models that generate sustainable returns)
  const candidateBusinessModels = ALL_MODELS.filter((m) => m !== "free"); // "free" is open-beta loss leader

  // 4. Reachable terminal stat allocations
  const statAllocations = findReachableTerminalAllocations(product);

  let bestResult: LaunchOptimizationResult | null = null;
  let highestScore = -Infinity;
  const evaluationCache: CandidateEvaluationCache = {
    gtmFits: new Map(),
    modelImpacts: new Map(),
  };

  for (const alloc of statAllocations) {
    for (const gtm of candidateGtmStrategies) {
      for (const biz of candidateBusinessModels) {
        for (const modelId of candidateModelIds) {
          const economics = calculateCandidateEconomicsInternal(state, product, biz, gtm, modelId, alloc.levels, evaluationCache);
          const score = calculateLaunchPerformanceScore(state, product, alloc.levels, economics);

          if (score > highestScore || !bestResult) {
            highestScore = score;
            const delegationStrategy = recommendDelegationStrategy(alloc.levels, gtm);
            bestResult = {
              allocatedLevels: alloc.levels,
              remainingPoints: alloc.points,
              modelId,
              businessModel: biz,
              gtmStrategy: gtm,
              delegationStrategy,
              economics,
              score,
            };
          }
        }
      }
    }
  }

  // Fallback guard if for any reason search yielded nothing
  if (!bestResult) {
    const defaultGtm = availableGtmStrategies(product)[0]?.id ?? "product-led";
    const defaultModelId = candidateModelIds[0] ?? product.modelId;
    const defaultBiz: BusinessModel = product.vertical === "developer" ? "api" : "freemium";
    const economics = calculateCandidateEconomics(state, product, defaultBiz, defaultGtm, defaultModelId, product.levels);
    bestResult = {
      allocatedLevels: { ...product.levels },
      remainingPoints: { ...product.points },
      modelId: defaultModelId,
      businessModel: defaultBiz,
      gtmStrategy: defaultGtm,
      delegationStrategy: "balanced",
      economics,
      score: 0,
    };
  }

  return bestResult;
}

/**
 * Optimizes the product launch configuration directly on the draft game state.
 * Returns the recommended delegation strategy so callers (like optimizeLaunch with auto-delegate)
 * can proceed directly into market delegation if desired.
 */
export function optimizeProductLaunch(
  state: GameState,
  product: Product,
): LaunchOptimizationResult {
  const recommendation = recommendLaunchConfiguration(state, product);

  // Apply stat levels and remaining points
  product.levels = { ...recommendation.allocatedLevels };
  product.points = { ...recommendation.remainingPoints };

  // Apply model, business model, and GTM strategy
  product.modelId = recommendation.modelId;
  product.businessModel = recommendation.businessModel;
  product.gtmStrategy = recommendation.gtmStrategy;
  product.gtmFit = recommendation.economics.fitScore;

  return recommendation;
}
