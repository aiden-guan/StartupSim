import type { GtmStrategy, Product } from "../simulation/types";

export interface GtmStrategyDef {
  id: GtmStrategy;
  name: string;
  tagline: string;
  description: string;
  volumeMultiplier: number;
  revenueMultiplier: number;
  supportPerUserWeek: number;
  acquisitionRate: number;
  fixedMonthlyCost: number;
  complianceRate: number;
  weeklyRetention: number;
  rampMultiplier: number;
  rampWeeks: number;
  weeklyGrowthRate: number;
  revenuePotential: string;
  acquisitionCost: string;
  timeToRevenue: string;
  retention: string;
  scalePotential: string;
  salesComplexity: string;
  marginPressure: string;
  risk: string;
}

export const GTM_STRATEGIES: Record<GtmStrategy, GtmStrategyDef> = {
  "product-led": {
    id: "product-led", name: "Product-led", tagline: "Self-serve adoption", description: "Fast adoption with little sales overhead. Product quality and onboarding carry the load; support volume and churn rise with scale.",
    volumeMultiplier: 1.25, revenueMultiplier: 0.9, supportPerUserWeek: 0.015, acquisitionRate: 0.015, fixedMonthlyCost: 250, complianceRate: 0.003, weeklyRetention: 0.968, rampMultiplier: 1, rampWeeks: 3, weeklyGrowthRate: 0.025,
    revenuePotential: "High", acquisitionCost: "Low", timeToRevenue: "Fast", retention: "Medium", scalePotential: "Very high", salesComplexity: "Low", marginPressure: "Medium", risk: "Onboarding & churn",
  },
  "direct-consumer": {
    id: "direct-consumer", name: "Direct-to-consumer", tagline: "Brand + paid acquisition", description: "A large audience and fast feedback loop, bought with marketing spend. Viral upside is real; churn and reputation sensitivity are too.",
    volumeMultiplier: 1.65, revenueMultiplier: 0.72, supportPerUserWeek: 0.025, acquisitionRate: 0.12, fixedMonthlyCost: 3_500, complianceRate: 0.012, weeklyRetention: 0.945, rampMultiplier: 1.08, rampWeeks: 2, weeklyGrowthRate: 0.04,
    revenuePotential: "High", acquisitionCost: "High", timeToRevenue: "Fast", retention: "Low", scalePotential: "Very high", salesComplexity: "Low", marginPressure: "High", risk: "Churn & reputation",
  },
  "smb-sales": {
    id: "smb-sales", name: "SMB sales", tagline: "Inside sales motion", description: "Higher willingness to pay and steadier accounts, balanced against sales payroll, onboarding work, and a slower ramp.",
    volumeMultiplier: 0.72, revenueMultiplier: 1.38, supportPerUserWeek: 0.15, acquisitionRate: 0.08, fixedMonthlyCost: 8_000, complianceRate: 0.018, weeklyRetention: 0.982, rampMultiplier: 0.82, rampWeeks: 6, weeklyGrowthRate: 0.04,
    revenuePotential: "High", acquisitionCost: "Medium", timeToRevenue: "Medium", retention: "High", scalePotential: "High", salesComplexity: "Medium", marginPressure: "Medium", risk: "Sales execution",
  },
  "enterprise-sales": {
    id: "enterprise-sales", name: "Enterprise sales", tagline: "High-ACV contracts", description: "Large, durable contracts with long cycles, expensive sellers, implementation demands, security reviews, and customer concentration risk.",
    volumeMultiplier: 0.26, revenueMultiplier: 2.55, supportPerUserWeek: 1, acquisitionRate: 0.1, fixedMonthlyCost: 30_000, complianceRate: 0.065, weeklyRetention: 0.994, rampMultiplier: 0.52, rampWeeks: 10, weeklyGrowthRate: 0.075,
    revenuePotential: "Very high", acquisitionCost: "High", timeToRevenue: "Slow", retention: "Very high", scalePotential: "Medium", salesComplexity: "Very high", marginPressure: "Low", risk: "Concentration & compliance",
  },
  "developer-first": {
    id: "developer-first", name: "Developer-first", tagline: "Docs, APIs, community", description: "Organic technical adoption and ecosystem upside. Developers are price-sensitive and will leave quickly when reliability or documentation slips.",
    volumeMultiplier: 1.05, revenueMultiplier: 1.04, supportPerUserWeek: 0.07, acquisitionRate: 0.02, fixedMonthlyCost: 4_000, complianceRate: 0.008, weeklyRetention: 0.975, rampMultiplier: 0.96, rampWeeks: 4, weeklyGrowthRate: 0.025,
    revenuePotential: "Medium", acquisitionCost: "Low", timeToRevenue: "Fast", retention: "Medium", scalePotential: "Very high", salesComplexity: "Low", marginPressure: "Medium", risk: "Open-source pressure",
  },
  partnerships: {
    id: "partnerships", name: "Partnerships", tagline: "Distribution through allies", description: "Shared distribution lowers direct acquisition spend and improves retention, but revenue share and partner dependency limit control.",
    volumeMultiplier: 0.82, revenueMultiplier: 1.3, supportPerUserWeek: 0.1, acquisitionRate: 0.04, fixedMonthlyCost: 6_000, complianceRate: 0.014, weeklyRetention: 0.988, rampMultiplier: 0.74, rampWeeks: 5, weeklyGrowthRate: 0.05,
    revenuePotential: "High", acquisitionCost: "Low", timeToRevenue: "Medium", retention: "High", scalePotential: "High", salesComplexity: "Medium", marginPressure: "Medium", risk: "Partner dependency",
  },
};

export function availableGtmStrategies(product: Product): GtmStrategyDef[] {
  const ids = new Set<GtmStrategy>(["product-led", "smb-sales", "partnerships"]);
  if (["consumer", "media", "education"].includes(product.vertical)) ids.add("direct-consumer");
  if (["enterprise", "legal", "finance", "health", "biotech", "defense", "education"].includes(product.vertical) || product.riskTags.includes("regulation")) ids.add("enterprise-sales");
  if (product.vertical === "developer" || product.combo.some((id) => ["code", "agent", "computer-use", "search", "workflow"].includes(id))) ids.add("developer-first");
  return [...ids].map((id) => GTM_STRATEGIES[id]);
}
