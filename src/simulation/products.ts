import { BALANCE } from "../config/balance";
import { primitiveById } from "../data/primitives";
import { findRecipe } from "../data/recipes";
import { modelById } from "../data/models";
import type { GameState, LaunchStat, Product, ProductPoints } from "./types";
import { uid, type Rng } from "./rng";

const epsilon = 1e-12;

export function recipeNameKey(a: string, b: string): string {
  return [a, b].sort().join(".");
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
    modelId: state.currentModelId,
    marketShare: 0,
    weeklyRevenue: 0,
    weeklyInference: 0,
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
  const hypeMult = 1 + Math.max(0, Math.sqrt(state.company.hype) * BALANCE.HYPE_MULTIPLIER_SCALE);
  const infMult = 1 + influencers * 0.45;
  const disc = product.newDiscovery ? BALANCE.NEW_PRODUCT_MULTIPLIER : 1;
  const loc = 1 + state.company.locations.length * BALANCE.LOCATION_MULTIPLIER;
  const base = capturedIncome.reduce((s, t) => s + shareToRevenue(t.income, product), 0);
  const trust = Math.max(0.6, state.company.trust / 70);
  product.weeklyRevenue = Math.max(
    0,
    (base / 4) * hypeMult * infMult * disc * economyMult(state) * loc * trust,
  );
  const model = modelById[product.modelId];
  const users = Math.max(
    0,
    (product.marketShare / 100) * 12_000 * (1 + product.levels.deployment * 0.12) * (product.businessModel === "free" ? 1.6 : 1),
  );
  product.users = users;
  const pa = primitiveById[product.combo[0]];
  const pb = primitiveById[product.combo[1]];
  const weight = (pa?.computeWeight ?? 1) * (pb?.computeWeight ?? 1);
  const agenty = product.combo.includes("agent") || product.combo.includes("computer-use") ? 2.2 : 1;
  const tokens = users * 28_000 * weight * agenty;
  const price = model?.costPerMTok ?? 8;
  const efficiency = 1 + (state.company.technologies.includes("efficient-inference") ? -0.12 : 0);
  product.weeklyInference = (tokens * price) / 1_000_000 * Math.max(0.35, efficiency);
  product.reliability = Math.min(
    0.98,
    0.5 + product.points.engineering / 400 + (model?.reliability ?? 5) / 20,
  );
}

export function harvestProduct(product: Product, rng: Rng): { revenue: number; inference: number } {
  if (product.status !== "active" && product.status !== "mature" && product.status !== "declining") {
    return { revenue: 0, inference: 0 };
  }
  const range = product.weeklyRevenue * 0.1;
  const revenue = Math.max(0, rng.float(product.weeklyRevenue - range, product.weeklyRevenue + range));
  product.weeklyRevenue *= BALANCE.REVENUE_DECAY;
  product.earnedRevenue += revenue;
  product.ageWeeks += 1;
  if (product.ageWeeks > 16) product.status = "mature";
  if (product.weeklyRevenue < 400 && product.ageWeeks > 8) product.status = "declining";
  if (product.weeklyRevenue < 40 && product.ageWeeks > 12) product.status = "deprecated";
  return { revenue, inference: product.weeklyInference };
}
