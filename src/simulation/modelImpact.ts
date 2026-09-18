import { BALANCE } from "../config/balance";
import type { ModelDef } from "../data/models";

export const CONTEXT_HEAVY_PRIMITIVES = new Set([
  "writing",
  "retrieval",
  "memory",
  "agent",
  "code",
  "legal",
  "science",
  "biology",
  "workflow",
  "simulation",
  "auto-research",
]);

export const TOOL_HEAVY_PRIMITIVES = new Set([
  "agent",
  "computer-use",
  "browser",
  "security",
  "workflow",
  "auto-research",
  "self-improve",
]);

export const MULTIMODAL_PRIMITIVES = new Set([
  "image",
  "video",
  "avatar",
  "vision",
  "voice",
]);

export const SAFETY_SENSITIVE_PRIMITIVES = new Set([
  "health",
  "legal",
  "defense",
  "finance",
  "security",
  "robotics",
  "self-improve",
]);

export interface ModelImpactContext {
  model: ModelDef;
  product?: {
    combo?: [string, string];
    recipeId?: string;
    vertical?: string;
    levels?: { deployment?: number; capability?: number; distribution?: number };
    businessModel?: string;
    gtmStrategy?: string;
    points?: { engineering?: number; product?: number; growth?: number; research?: number };
  } | null;
  technologies?: string[];
  worldInferenceCostIndex?: number;
  users?: number;
}

export interface ModelImpactResult {
  modelId: string;
  modelName: string;
  devSpeedMultiplier: number;
  demandMultiplier: number;
  reliabilityContribution: number;
  estimatedReliability: number;
  retentionContribution: number;
  effectiveTokenPrice: number;
  contextFit: { applicable: boolean; hasFit: boolean; modifier: number; reason?: string };
  toolsFit: { applicable: boolean; hasFit: boolean; modifier: number; reason?: string };
  multimodalFit: { applicable: boolean; hasFit: boolean; modifier: number; reason?: string };
  safetyFit: { applicable: boolean; hasFit: boolean; modifier: number; reason?: string };
  openDiscount: number;
  reasons: string[];
  strengths: string[];
  tradeoffs: string[];
}

export function calculateModelImpact(context: ModelImpactContext): ModelImpactResult {
  const { model, product, technologies = [] } = context;

  // 1. Development speed modifier (applies to product task progress and ETA)
  const speedDiff = (model.speed ?? BALANCE.MODEL_BASELINE_SPEED) - BALANCE.MODEL_BASELINE_SPEED;
  const rawDevSpeed = 1 + speedDiff * BALANCE.MODEL_SPEED_DEV_COEFF;
  const devSpeedMultiplier = Math.max(0.75, Math.min(1.25, Number(rawDevSpeed.toFixed(3))));

  // 2. Base capability modifier on customer demand/quality
  const capDiff = (model.capability ?? BALANCE.MODEL_BASELINE_CAPABILITY) - BALANCE.MODEL_BASELINE_CAPABILITY;
  const capabilityModifier = 1 + capDiff * BALANCE.MODEL_CAPABILITY_COEFF;

  // 3. Workload fit checks based on product primitives and vertical
  const combo: string[] = product?.combo ? [...product.combo] : [];
  const vertical = product?.vertical ?? "";

  // Context fit
  const contextApplicable = combo.some((p) => CONTEXT_HEAVY_PRIMITIVES.has(p)) || vertical === "legal" || vertical === "science";
  let contextModifier = 0;
  let contextReason: string | undefined;
  let hasContextFit = false;
  if (contextApplicable) {
    if (model.context >= 8) {
      contextModifier = BALANCE.MODEL_CONTEXT_FIT_BONUS;
      hasContextFit = true;
      contextReason = `+${Math.round(contextModifier * 100)}% context fit for deep retrieval & workflows`;
    } else if (model.context <= 5) {
      contextModifier = -0.05;
      contextReason = `-5% bottleneck: compact context window limits long-document reasoning`;
    }
  }

  // Tools fit
  const toolsApplicable = combo.some((p) => TOOL_HEAVY_PRIMITIVES.has(p));
  let toolsModifier = 0;
  let toolsReason: string | undefined;
  let hasToolsFit = false;
  if (toolsApplicable) {
    if (model.tools) {
      toolsModifier = BALANCE.MODEL_TOOLS_FIT_BONUS;
      hasToolsFit = true;
      toolsReason = `+${Math.round(toolsModifier * 100)}% execution bonus: native tool-calling`;
    } else {
      toolsModifier = -0.06;
      toolsReason = `-6% execution friction: lacks native tool-calling`;
    }
  }

  // Multimodal fit
  const multiApplicable = combo.some((p) => MULTIMODAL_PRIMITIVES.has(p));
  let multiModifier = 0;
  let multiReason: string | undefined;
  let hasMultiFit = false;
  if (multiApplicable) {
    if (model.multimodal) {
      multiModifier = BALANCE.MODEL_MULTIMODAL_FIT_BONUS;
      hasMultiFit = true;
      multiReason = `+${Math.round(multiModifier * 100)}% media fidelity: native multimodal architecture`;
    } else {
      multiModifier = -BALANCE.MODEL_MULTIMODAL_PENALTY;
      multiReason = `-${Math.round(BALANCE.MODEL_MULTIMODAL_PENALTY * 100)}% fidelity penalty: text-only model on media task`;
    }
  }

  // Safety fit
  const safetyApplicable = combo.some((p) => SAFETY_SENSITIVE_PRIMITIVES.has(p)) || ["health", "legal", "defense", "finance"].includes(vertical);
  let safetyModifier = 0;
  let safetyReason: string | undefined;
  let hasSafetyFit = false;
  if (safetyApplicable) {
    if (model.safety >= 7) {
      safetyModifier = BALANCE.MODEL_SAFETY_TRUST_BONUS;
      hasSafetyFit = true;
      safetyReason = `+${Math.round(safetyModifier * 100)}% enterprise trust: strong alignment & safety score`;
    } else if (model.safety <= 4) {
      safetyModifier = -BALANCE.MODEL_SAFETY_RISK_PENALTY;
      safetyReason = `-${Math.round(BALANCE.MODEL_SAFETY_RISK_PENALTY * 100)}% compliance resistance: low safety score in regulated vertical`;
    }
  }

  // 4. Combined demand multiplier (bounded between 0.65 and 1.45)
  const totalDemandMod = capabilityModifier + contextModifier + toolsModifier + multiModifier + safetyModifier;
  const demandMultiplier = Math.max(0.65, Math.min(1.45, Number(totalDemandMod.toFixed(3))));

  // 5. Reliability and retention contribution
  const reliabilityContribution = Number(((model.reliability ?? 5) / BALANCE.MODEL_RELIABILITY_MODEL_DIVISOR).toFixed(3));
  const engPoints = product?.points?.engineering ?? 0;
  const estimatedReliability = Math.min(0.98, Number((BALANCE.MODEL_RELIABILITY_BASE + engPoints / BALANCE.MODEL_RELIABILITY_ENG_DIVISOR + reliabilityContribution).toFixed(3)));
  const retentionContribution = Number(((estimatedReliability - 0.7) * 0.02).toFixed(4));

  // 6. Token pricing & open model efficiency
  const openDiscount = model.open ? BALANCE.MODEL_OPEN_DISCOUNT : 0;
  const techDiscount = technologies.includes("efficient-inference") ? 0.12 : 0;
  const effectiveTokenPrice = Number((model.costPerMTok * (1 - openDiscount) * (1 - techDiscount)).toFixed(2));

  // 7. Human-readable explainable reasons, strengths, and trade-offs
  const reasons: string[] = [];
  const strengths: string[] = [];
  const tradeoffs: string[] = [];

  // Dev speed description
  if (devSpeedMultiplier > 1.02) {
    const pct = Math.round((devSpeedMultiplier - 1) * 100);
    reasons.push(`+${pct}% dev speed (Fast generation)`);
    strengths.push(`+${pct}% development speed`);
  } else if (devSpeedMultiplier < 0.98) {
    const pct = Math.round((1 - devSpeedMultiplier) * 100);
    reasons.push(`-${pct}% dev speed (Heavy compute weight)`);
    tradeoffs.push(`-${pct}% development speed`);
  }

  // Capability description
  if (model.capability >= 9) {
    strengths.push("Frontier reasoning & output quality");
    reasons.push(`+${Math.round((capabilityModifier - 1) * 100)}% base demand (Frontier intelligence)`);
  } else if (model.capability <= 5) {
    tradeoffs.push("Budget intelligence; lower conversion on complex tasks");
    reasons.push(`-${Math.round((1 - capabilityModifier) * 100)}% base demand (Budget capability)`);
  }

  // Pricing description
  if (model.costPerMTok <= 2.5) {
    strengths.push("High operating margin (Ultra-cheap tokens)");
    reasons.push(`Low inference cost: $${model.costPerMTok.toFixed(2)}/MTok`);
  } else if (model.costPerMTok >= 15) {
    tradeoffs.push(`High inference burn: $${model.costPerMTok.toFixed(2)}/MTok`);
  }

  // Workload reasons
  if (contextReason) reasons.push(contextReason);
  if (toolsReason) reasons.push(toolsReason);
  if (multiReason) reasons.push(multiReason);
  if (safetyReason) reasons.push(safetyReason);
  if (model.open) {
    strengths.push("Open weights: self-hosting efficiency discount");
    reasons.push(`10% open-weights inference discount`);
  }

  return {
    modelId: model.id,
    modelName: model.name,
    devSpeedMultiplier,
    demandMultiplier,
    reliabilityContribution,
    estimatedReliability,
    retentionContribution,
    effectiveTokenPrice,
    contextFit: { applicable: contextApplicable, hasFit: hasContextFit, modifier: contextModifier, reason: contextReason },
    toolsFit: { applicable: toolsApplicable, hasFit: hasToolsFit, modifier: toolsModifier, reason: toolsReason },
    multimodalFit: { applicable: multiApplicable, hasFit: hasMultiFit, modifier: multiModifier, reason: multiReason },
    safetyFit: { applicable: safetyApplicable, hasFit: hasSafetyFit, modifier: safetyModifier, reason: safetyReason },
    openDiscount,
    reasons,
    strengths,
    tradeoffs,
  };
}

/**
 * Pure calculation for product weekly inference cost.
 * Shared across market map, product simulation, and forecast UI.
 */
export function calculateWeeklyProductInference(params: {
  users: number;
  combo?: string[];
  pricingTokenMultiplier?: number;
  model: ModelDef;
  hasEfficientInferenceTech?: boolean;
  worldInferenceCostIndex?: number;
  computeWeightA?: number;
  computeWeightB?: number;
}): number {
  const {
    users,
    combo = [],
    pricingTokenMultiplier = 1,
    model,
    hasEfficientInferenceTech = false,
    worldInferenceCostIndex = 1,
    computeWeightA = 1,
    computeWeightB = 1,
  } = params;

  if (users <= 0) return 0;
  const weight = computeWeightA * computeWeightB;
  const comboList: string[] = Array.isArray(combo) ? combo : [];
  const agenty = comboList.includes("agent") || comboList.includes("computer-use") ? 1.8 : 1;
  const baseTokensPerUser = BALANCE.BASE_TOKENS_PER_USER_WEEK ?? 7_000;
  const tokens = users * baseTokensPerUser * pricingTokenMultiplier * weight * agenty;

  const openDiscount = model.open ? BALANCE.MODEL_OPEN_DISCOUNT : 0;
  const price = model.costPerMTok * (1 - openDiscount);
  const efficiency = 1 + (hasEfficientInferenceTech ? -0.12 : 0);
  return Math.round(((tokens * price) / 1_000_000) * Math.max(0.35, efficiency) * worldInferenceCostIndex);
}
