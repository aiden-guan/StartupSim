import { offices } from "../data/offices";
import type { Effect, GameState } from "./types";
import { monthlyArr } from "./conditions";
import { monthlyBurn } from "./derived";
import type { Rng } from "./rng";

export type EventSeverity = "minor" | "moderate" | "major" | "critical";
export type CompanyStage = "garage" | "seed" | "growth" | "scale" | "mega";

const SEVERITY: Record<EventSeverity, number> = {
  minor: 0.38,
  moderate: 1,
  major: 2.35,
  critical: 4.8,
};

export function companyStage(state: GameState): CompanyStage {
  const people = state.employees.length;
  const arr = monthlyArr(state);
  const office = state.company.officeLevel;
  const cash = state.company.cash;
  if (office >= 4 || arr > 8_000_000 || people >= 250 || cash > 400_000_000) return "mega";
  if (office >= 3 || arr > 1_200_000 || people >= 80 || cash > 40_000_000) return "scale";
  if (office >= 2 || arr > 180_000 || people >= 22 || cash > 4_000_000) return "growth";
  if (office >= 1 || arr > 20_000 || people >= 8 || cash > 400_000) return "seed";
  return "garage";
}

export function companyScaleIndex(state: GameState): number {
  const office = offices[state.company.officeLevel];
  return (
    Math.max(0, state.company.cash) * 0.22 +
    monthlyArr(state) * 9 +
    state.employees.length * 75_000 +
    Math.max(0, state.company.valuation) * 0.018 +
    (office?.rent ?? 2200) * 7
  );
}

export function scaleEventCash(state: GameState, base: number, severity: EventSeverity, rng?: Rng): number {
  const sign = base < 0 ? -1 : 1;
  const abs = Math.abs(base);
  if (abs === 0) return 0;
  const size = Math.max(40_000, companyScaleIndex(state));
  const shaped = Math.pow(size / 240_000, 0.7) * abs * SEVERITY[severity];
  const jitter = rng ? rng.float(0.84, 1.18) : 1;
  let amount = shaped * jitter;
  const cash = Math.max(8_000, state.company.cash);
  const burn = Math.max(2_000, monthlyBurn(state));
  const arr = Math.max(0, monthlyArr(state));
  const activity = Math.max(burn, arr * 0.4, cash * 0.008);
  const cashCap =
    severity === "minor" ? cash * 0.045 :
    severity === "moderate" ? cash * 0.11 :
    severity === "major" ? cash * 0.22 :
    cash * 0.48;
  const burnCap =
    severity === "minor" ? activity * 0.9 :
    severity === "moderate" ? activity * 2.4 :
    severity === "major" ? activity * 6 :
    activity * 14;
  const floor =
    severity === "minor" ? Math.max(abs * 0.85, 1_200) :
    severity === "moderate" ? Math.max(abs, 8_000) :
    severity === "major" ? Math.max(abs * 1.2, 40_000) :
    Math.max(abs * 1.5, 180_000);
  amount = Math.min(Math.max(amount, floor), cashCap, burnCap, severity === "critical" ? cash * 0.62 : cashCap);
  return sign * Math.round(amount / 100) * 100;
}

export function severityForEvent(kind?: string, eventId?: string): EventSeverity {
  if (eventId === "copyright" || eventId === "safety-near-miss") return "major";
  if (kind === "crisis") return "major";
  if (kind === "cost" || kind === "outage") return "moderate";
  if (kind === "decision") return "moderate";
  if (kind === "people") return "minor";
  return "moderate";
}

export function scaleEffects(state: GameState, effects: Effect[] | undefined, severity: EventSeverity, rng: Rng): Effect[] | undefined {
  if (!effects) return effects;
  return effects.map((effect) => {
    if (effect.type !== "cash") return effect;
    return { ...effect, value: scaleEventCash(state, Number(effect.value), severity, rng) };
  });
}

export function eventFitsStage(eventId: string, stage: CompanyStage): boolean {
  const early = new Set(["runway-note", "contractor-invoice", "recruiter-fee", "poach"]);
  const growth = new Set(["api-hike", "provider-outage", "support-surge", "hallucination", "gpu-shortage", "viral"]);
  const large = new Set(["copyright", "enterprise-review", "regulation-talk", "safety-near-miss", "acquisition-inbound", "board-nudge", "agent-meetings", "security-incident"]);
  if (stage === "garage") return !large.has(eventId) || early.has(eventId);
  if (stage === "seed") return !new Set(["acquisition-inbound", "security-incident", "regulation-talk"]).has(eventId);
  if (stage === "growth") return !early.has(eventId) || growth.has(eventId) || eventId === "poach";
  return !new Set(["contractor-invoice", "recruiter-fee"]).has(eventId);
}
