import { BALANCE } from "../config/balance";
import { GTM_STRATEGIES } from "../data/gtm";
import { companySkill } from "./workers";
import type { GameState, GtmStrategy, Product } from "./types";

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export interface GtmFitAnalysis {
  score: number;
  label: "Strong fit" | "Workable" | "Execution stretch";
  strengths: string[];
  risks: string[];
}

export function gtmFitAnalysis(state: GameState, product: Product, strategy: GtmStrategy): GtmFitAnalysis {
  const engineering = companySkill(state, "engineering", state.employees);
  const productSkill = companySkill(state, "product", state.employees);
  const growth = companySkill(state, "growth", state.employees);
  const research = companySkill(state, "research", state.employees);
  const salesPeople = state.employees.filter((w) => w.department === "sales" && w.burnoutDays <= 0).length;
  const managers = state.employees.filter((w) => w.department === "management" && w.burnoutDays <= 0).length;
  const cashBuffer = clamp(state.company.cash / 750_000, 0, 1);
  const strengths: string[] = [];
  const risks: string[] = [];
  let score = 42;

  if (strategy === "product-led") {
    score += engineering * 0.55 + productSkill * 0.65 + product.levels.distribution * 5;
    if (engineering + productSkill > 30) strengths.push("Strong product team");
    if (product.reliability < 0.7) risks.push("Reliability will raise self-serve churn");
  } else if (strategy === "direct-consumer") {
    score += growth * 0.85 + productSkill * 0.35 + state.company.hype * 0.18;
    if (growth > 15) strengths.push("Strong growth execution");
    if (state.company.trust < 55) risks.push("Weak trust makes consumer acquisition brittle");
  } else if (strategy === "smb-sales") {
    score += growth * 0.7 + salesPeople * 12 + state.company.trust * 0.12 + cashBuffer * 8;
    if (salesPeople) strengths.push(`${salesPeople} dedicated sales operator${salesPeople > 1 ? "s" : ""}`);
    else risks.push("No dedicated sales team");
  } else if (strategy === "enterprise-sales") {
    score += growth * 0.45 + salesPeople * 15 + managers * 5 + state.company.trust * 0.18 + cashBuffer * 16;
    if (state.company.trust >= 70) strengths.push("Enterprise-grade reputation");
    if (cashBuffer < 0.45) risks.push("Cash reserves may not cover the sales cycle");
    if (!salesPeople) risks.push("No enterprise seller on the team");
  } else if (strategy === "developer-first") {
    score += engineering * 0.7 + research * 0.35 + productSkill * 0.25;
    if (product.vertical === "developer") strengths.push("Natural developer audience");
    if (state.world.openSourcePressure > 10) risks.push("Open-source alternatives are compressing pricing");
  } else {
    score += growth * 0.55 + managers * 7 + state.company.trust * 0.2 + state.company.prestige * 0.15;
    if (state.company.trust >= 65) strengths.push("Partners can sell the company credibly");
    if (state.company.prestige < 8) risks.push("Limited leverage with distribution partners");
  }

  if (product.recipeId === "generic") {
    score -= 8;
    risks.push("Undifferentiated product");
  }
  score = Math.round(clamp(score, 18, 95));
  const label = score >= 72 ? "Strong fit" : score >= 48 ? "Workable" : "Execution stretch";
  return { score, label, strengths: strengths.slice(0, 2), risks: risks.slice(0, 2) };
}

export function marketDemandMultiplier(state: GameState, product: Product): number {
  if (product.vertical === "developer") return state.world.developerDemandIndex;
  if (["enterprise", "legal", "finance", "health", "biotech", "defense"].includes(product.vertical)) return state.world.enterpriseDemandIndex;
  return state.world.consumerDemandIndex;
}

export function gtmExecutionMultiplier(fit: number): number {
  return clamp(0.68 + fit / 170, 0.78, 1.24);
}

export function calculateWeeklyProductOperations(
  state: GameState,
  product: Product,
  users: number,
  revenue: number,
  fit: number,
): number {
  const strategy = GTM_STRATEGIES[product.gtmStrategy] ?? GTM_STRATEGIES["product-led"];
  const fitPenalty = 1 + Math.max(0, 58 - fit) / 90;
  const support = users * strategy.supportPerUserWeek * fitPenalty;
  const acquisition = revenue * strategy.acquisitionRate * fitPenalty;
  const compliance = revenue * strategy.complianceRate * state.world.complianceCostIndex;
  const maintenance = (BALANCE.PRODUCT_MAINTENANCE_BASE / 4.33) * (1 + product.levels.deployment * 0.22 + product.ageWeeks * 0.015);
  const fixed = strategy.fixedMonthlyCost / 4.33;
  const activeProducts = state.products.filter((p) => ["active", "mature", "declining"].includes(p.status)).length;
  const scaleFriction = 1 + Math.max(0, activeProducts - 1) * 0.06 + Math.pow(Math.max(0, revenue * 52) / 10_000_000, 0.45) * 0.12;
  return Math.round((support + acquisition + compliance + maintenance + fixed) * scaleFriction);
}
