import type { BusinessModel } from "../simulation/types.js";

export interface PricingModelDef {
  id: BusinessModel;
  name: string;
  tagline: string;
  description: string;
  userMultiplier: number;
  tokenMultiplier: number;
  revenueMultiplier: number;
  costPlusMargin: number | null;
  hypeBonus: number;
  marginTarget: string;
  bestFor: string;
}

export const PRICING_MODELS: Record<BusinessModel, PricingModelDef> = {
  freemium: {
    id: "freemium",
    name: "Freemium",
    tagline: "Free tier + premium upgrade",
    description: "Broad reach with a free tier. Strict daily query caps on free users protect compute margins, while the paying 5-8% subsidize infrastructure.",
    userMultiplier: 1.0,
    tokenMultiplier: 0.45,
    revenueMultiplier: 1.25,
    costPlusMargin: null,
    hypeBonus: 2,
    marginTarget: "55-70%",
    bestFor: "Consumer & general productivity apps",
  },
  subscription: {
    id: "subscription",
    name: "Subscription",
    tagline: "Flat recurring seat license",
    description: "Full paywall ($20-$50/seat). Fewer casual signups, but high intent, predictable recurring revenue, and superior gross margins.",
    userMultiplier: 0.65,
    tokenMultiplier: 0.65,
    revenueMultiplier: 2.2,
    costPlusMargin: null,
    hypeBonus: 0,
    marginTarget: "70-85%",
    bestFor: "Prosumer, coding & specialized workflows",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Custom high-ACV contracts",
    description: "Direct B2B contracts with security SLAs. Low total seat count, but massive contract values that dwarf inference costs.",
    userMultiplier: 0.3,
    tokenMultiplier: 0.4,
    revenueMultiplier: 3.6,
    costPlusMargin: null,
    hypeBonus: 0,
    marginTarget: "75-90%",
    bestFor: "High-value enterprise, legal & security segments",
  },
  usage: {
    id: "usage",
    name: "Usage-Based",
    tagline: "Pay-as-you-go metered pricing",
    description: "Users pay per query or output token. Revenue is tied directly to usage with a guaranteed 65% cost-plus gross margin floor.",
    userMultiplier: 0.85,
    tokenMultiplier: 0.85,
    revenueMultiplier: 1.45,
    costPlusMargin: 0.65,
    hypeBonus: 1,
    marginTarget: "65% protected",
    bestFor: "Heavy compute workloads (agents, reasoning, tools)",
  },
  api: {
    id: "api",
    name: "API Platform",
    tagline: "Developer token endpoints",
    description: "Sell direct API endpoints to engineers and companies. High token consumption paired with scalable developer volume pricing.",
    userMultiplier: 0.75,
    tokenMultiplier: 1.1,
    revenueMultiplier: 1.85,
    costPlusMargin: null,
    hypeBonus: 3,
    marginTarget: "50-65%",
    bestFor: "Developer tools, backend infrastructure & APIs",
  },
  ads: {
    id: "ads",
    name: "Ad-Supported",
    tagline: "Free access monetized by sponsors",
    description: "Zero friction consumer access funded by ad impressions. Aggressive rate limits keep inference low enough to stay profitable with sponsors.",
    userMultiplier: 1.8,
    tokenMultiplier: 0.25,
    revenueMultiplier: 0.85,
    costPlusMargin: null,
    hypeBonus: 4,
    marginTarget: "35-50%",
    bestFor: "Mass consumer, media & entertainment",
  },
  free: {
    id: "free",
    name: "Free / Open Beta",
    tagline: "Viral growth loss leader",
    description: "Completely free open access to dominate market share and spike company hype (+10 Hype). Controlled compute caps prevent fatal cash burns.",
    userMultiplier: 2.2,
    tokenMultiplier: 0.35,
    revenueMultiplier: 0.15,
    costPlusMargin: null,
    hypeBonus: 10,
    marginTarget: "Negative (Hype investment)",
    bestFor: "Early category land-grab & buzz generation",
  },
};

export const PRICING_MODEL_LIST: PricingModelDef[] = Object.values(PRICING_MODELS);
