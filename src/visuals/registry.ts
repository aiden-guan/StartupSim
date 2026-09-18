import { competitors } from "../data/competitors";
import { models, type ModelDef } from "../data/models";
import { perks } from "../data/perks";
import { promos } from "../data/promos";
import { recruitingChannels } from "../data/recruiting";

export type CompanyIdentityKey =
  | "openbrain"
  | "claudius"
  | "macrosoft"
  | "metamind"
  | "xeno"
  | "coral"
  | "paladin"
  | "nestor"
  | "lumen"
  | "glyph"
  | "helix"
  | "foundry"
  | "you";

export interface CompanyIdentity {
  name: string;
  ink: string;
  paper: string;
  path: string;
  detail?: string;
}

export const companyIdentities: Record<CompanyIdentityKey, CompanyIdentity> = {
  openbrain: { name: "OpenBrain", ink: "#294a62", paper: "#c9d7dc", path: "M12 3a9 9 0 1 0 0 18 6 6 0 1 1 0-12 3 3 0 1 0 0 6" },
  claudius: { name: "Claudius Labs", ink: "#2b3e55", paper: "#ded3c3", path: "M5 19V5h14v14M8 16l4-8 4 8M8 16h8" },
  macrosoft: { name: "Macrosoft", ink: "#31586a", paper: "#c9d8d8", path: "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" },
  metamind: { name: "MetaMind Open", ink: "#506b55", paper: "#d6dfcc", path: "M4 17 8 7l4 10 4-10 4 10M6 17h12" },
  xeno: { name: "XenoAI", ink: "#263b49", paper: "#c8d1d4", path: "M5 4l7 8-7 8 14-8z" },
  coral: { name: "Coralzon", ink: "#9b5b3a", paper: "#ead2bd", path: "M4 15c4-8 12-8 16 0M6 18c3-5 9-5 12 0M12 4v5" },
  paladin: { name: "Paladin", ink: "#36475b", paper: "#d0d5d9", path: "M12 3 20 7v5c0 5-3 8-8 10-5-2-8-5-8-10V7zM8 11h8M12 7v9" },
  nestor: { name: "Nestor Robotics", ink: "#5f6251", paper: "#d9d8c9", path: "M7 8h10v9H7zM9 5h6v3M9 12h.1M15 12h.1M10 16h4" },
  lumen: { name: "Lumen Health", ink: "#3b6e69", paper: "#cfe0d9", path: "M12 3v18M3 12h18M6 6l12 12M18 6 6 18" },
  glyph: { name: "Glyph", ink: "#6d4f52", paper: "#dfd0ce", path: "M5 5h14v4H9v6h6v-3h4v7H5z" },
  helix: { name: "Helix Bio", ink: "#4a6755", paper: "#d5ddcf", path: "M7 4c8 4 2 12 10 16M17 4C9 8 15 16 7 20M8 8h8M8 16h8" },
  foundry: { name: "Foundry Cloud", ink: "#4c5964", paper: "#d2d7d8", path: "M5 18h14M7 18V8h10v10M9 8V5h6v3M10 12h4" },
  you: { name: "In-house", ink: "#9b5b35", paper: "#ead7bf", path: "M4 18h16M6 18V9l6-5 6 5v9M9 18v-5h6v5" },
};

export const providerIdentityKey: Record<string, CompanyIdentityKey> = {
  OpenBrain: "openbrain",
  "Claudius Labs": "claudius",
  Macrosoft: "macrosoft",
  "MetaMind Open": "metamind",
  XenoAI: "xeno",
  You: "you",
};

export const perkVisualIds = {
  coffee: "coffee",
  desks: "desks",
  food: "food",
  rest: "rest",
  play: "play",
  life: "life",
  transit: "transit",
  gym: "gym",
} as const;

export const promoVisualIds = {
  launch: "launch",
  "viral-demo": "viral-demo",
  benchmark: "benchmark",
  podcast: "podcast",
  conference: "conference",
  influencer: "influencer",
  keynote: "keynote",
  "agi-soon": "agi-soon",
} as const;

export const recruitingVisualIds = {
  network: "network",
  board: "board",
  university: "university",
  recruiter: "recruiter",
  exec: "exec",
  conference: "conference",
  poach: "poach",
  acqui: "acqui",
  robots: "robots",
} as const;

export const modelVisualIds: Record<string, { provider: CompanyIdentityKey; tier: 1 | 2 }> = {
  "openbrain-o3": { provider: "openbrain", tier: 1 },
  "openbrain-o4": { provider: "openbrain", tier: 2 },
  "claudius-instant": { provider: "claudius", tier: 1 },
  "claudius-opus": { provider: "claudius", tier: 2 },
  "metamind-34b": { provider: "metamind", tier: 1 },
  "metamind-400b": { provider: "metamind", tier: 2 },
  "macrosoft-azure": { provider: "macrosoft", tier: 1 },
  "xeno-grok": { provider: "xeno", tier: 1 },
  "house-small": { provider: "you", tier: 1 },
  "house-frontier": { provider: "you", tier: 2 },
};

export function modelVisualFor(id: string): { provider: CompanyIdentityKey; tier: 1 | 2 } {
  const visual = modelVisualIds[id];
  if (!visual) throw new Error(`Missing model visual definition: ${id}`);
  return visual;
}

export function companyKeyForName(name: string): CompanyIdentityKey | undefined {
  return providerIdentityKey[name] ?? (Object.keys(companyIdentities) as CompanyIdentityKey[]).find((key) => companyIdentities[key].name === name);
}

export function promotionEffort(requiredProgress: number): "Small campaign" | "Medium campaign" | "Major campaign" {
  if (requiredProgress <= 80) return "Small campaign";
  if (requiredProgress <= 130) return "Medium campaign";
  return "Major campaign";
}

export function recruitingPoolLabel(targetScore: number): "Familiar pool" | "Broad pool" | "Strong pool" | "Elite pool" {
  if (targetScore < 16) return "Familiar pool";
  if (targetScore < 25) return "Broad pool";
  if (targetScore < 34) return "Strong pool";
  return "Elite pool";
}

export function modelTags(model: ModelDef): string[] {
  const tags: string[] = [];
  if (model.capability >= 9) tags.push("Frontier");
  if (model.speed >= 8) tags.push("Fast");
  if (model.reliability >= 8) tags.push("Reliable");
  if (model.context >= 9) tags.push("Long context");
  if (model.multimodal) tags.push("Multimodal");
  if (model.tools) tags.push("Tool use");
  if (model.open) tags.push("Open");
  if (model.costPerMTok >= 18) tags.push("Expensive");
  if (model.costPerMTok <= 4) tags.push("Budget");
  if (!tags.length) tags.push("Balanced");
  return tags.slice(0, 3);
}

export function conditionLabel(value: number, baseline = 50): string {
  const delta = value - baseline;
  if (delta >= 25) return "Surging";
  if (delta >= 8) return "Strong";
  if (delta <= -25) return "Quiet";
  if (delta <= -8) return "Soft";
  return "Steady";
}

export function worldConditionLabel(kind: "momentum" | "demand" | "pressure" | "climate", value: number, baseline: number): string {
  const delta = value - baseline;
  if (kind === "pressure") {
    if (delta >= 25) return "Very high";
    if (delta >= 8) return "Elevated";
    if (delta <= -25) return "Very low";
    if (delta <= -8) return "Easing";
    return "Steady";
  }
  if (kind === "climate") {
    if (delta >= 25) return "Enthusiastic";
    if (delta >= 8) return "Supportive";
    if (delta <= -25) return "Hostile";
    if (delta <= -8) return "Skeptical";
    return "Mixed";
  }
  if (kind === "momentum" && delta <= -25) return "Emerging";
  return conditionLabel(value, baseline);
}

export function archetypeLabel(value: string): string {
  if (value === "bigtech") return "Big tech";
  if (value === "opensource") return "Open source";
  return value;
}

export function assertVisualRegistryComplete(): void {
  const missing = [
    ...perks.filter((item) => !(item.id in perkVisualIds)).map((item) => `perk:${item.id}`),
    ...promos.filter((item) => !(item.id in promoVisualIds)).map((item) => `promo:${item.id}`),
    ...recruitingChannels.filter((item) => !(item.id in recruitingVisualIds)).map((item) => `recruiting:${item.id}`),
    ...models.filter((item) => !modelVisualIds[item.id] || modelVisualIds[item.id].provider !== providerIdentityKey[item.provider]).map((item) => `model:${item.id}`),
    ...competitors.filter((item) => !(item.id in companyIdentities)).map((item) => `company:${item.id}`),
  ];
  if (missing.length) throw new Error(`Missing visual definitions: ${missing.join(", ")}`);
}
