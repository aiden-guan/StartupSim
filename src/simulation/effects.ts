import { techById } from "../data/technologies";
import { modelById } from "../data/models";
import type { Effect, GameState, WorldState } from "./types";

const SERVICE_PRODUCT_STATUSES = new Set(["active", "mature", "declining"]);
const MIGRATABLE_PRODUCT_STATUSES = new Set(["development", "ready", "active", "mature", "declining"]);

export function providerForModel(modelId: string): string | null {
  return modelById[modelId]?.provider ?? null;
}

export function providerOutageFor(state: GameState, provider: string) {
  return (state.providerOutages ?? []).find((outage) => outage.provider === provider && outage.untilTick > state.clock.tick);
}

export function isProviderAvailable(state: GameState, provider: string): boolean {
  return !providerOutageFor(state, provider);
}

export function isModelAvailable(state: GameState, modelId: string): boolean {
  const model = modelById[modelId];
  return Boolean(model && isProviderAvailable(state, model.provider));
}

export function applyEffects(state: GameState, effects: Effect[] | undefined): void {
  if (!effects) return;
  for (const e of effects) applyEffect(state, e);
}

export function applyEffect(state: GameState, effect: Effect): void {
  const v = effect.value;
  switch (effect.type) {
    case "cash":
      state.company.cash += Number(v);
      if (Number(v) > 0) state.company.lifetimeRevenue += Number(v);
      else state.company.lifetimeCosts += Math.abs(Number(v));
      break;
    case "hype":
      state.company.hype = Math.max(0, state.company.hype + Number(v));
      break;
    case "backlash":
      state.company.backlash = Math.max(0, state.company.backlash + Number(v));
      break;
    case "trust":
      state.company.trust = Math.max(0, Math.min(100, state.company.trust + Number(v)));
      state.world.publicTrust = Math.max(0, Math.min(100, state.world.publicTrust + Number(v) * 0.3));
      break;
    case "morale":
      for (const w of state.employees) w.happiness += Number(v) * 0.15;
      break;
    case "prestige":
      state.company.prestige += Number(v);
      break;
    case "computeCost":
      state.compute.monthlyCloudBill *= 1 + Number(v);
      break;
    case "providerOutage": {
      const outage = v as { provider?: string; durationDays?: number };
      if (!outage.provider) break;
      const durationDays = Math.max(1, Math.round(Number(outage.durationDays) || 21));
      const untilTick = state.clock.tick + durationDays;
      const current = (state.providerOutages ?? []).find((item) => item.provider === outage.provider);
      if (current) {
        current.untilTick = Math.max(current.untilTick, untilTick);
      } else {
        state.providerOutages ??= [];
        state.providerOutages.push({ provider: outage.provider, startedTick: state.clock.tick, untilTick });
      }
      break;
    }
    case "migrateProducts": {
      const migration = v as { fromProvider?: string; modelId?: string };
      const fallback = migration.modelId ? modelById[migration.modelId] : undefined;
      if (!migration.fromProvider || !fallback || !isModelAvailable(state, fallback.id)) break;
      for (const product of state.products) {
        if (!MIGRATABLE_PRODUCT_STATUSES.has(product.status)) continue;
        if (providerForModel(product.modelId) !== migration.fromProvider) continue;
        const previous = modelById[product.modelId];
        product.modelId = fallback.id;
        if (previous && previous.costPerMTok > 0) {
          product.weeklyInference = Math.max(0, Math.round(product.weeklyInference * fallback.costPerMTok / previous.costPerMTok));
          product.weeklyRevenue = Math.max(0, Math.round(product.weeklyRevenue * (1 + (fallback.capability - previous.capability) * 0.025)));
          product.reliability = Math.max(0.35, Math.min(0.98, product.reliability + (fallback.reliability - previous.reliability) * 0.025));
        }
      }
      if (providerForModel(state.currentModelId) === migration.fromProvider) state.currentModelId = fallback.id;
      break;
    }
    case "inferenceMultiplier":
      for (const product of state.products) {
        if (SERVICE_PRODUCT_STATUSES.has(product.status)) product.weeklyInference *= Number(v);
      }
      break;
    case "demand": {
      const change = v as { verticals?: string[]; strategies?: string[]; riskTags?: string[]; multiplier: number };
      for (const product of state.products) {
        const exposed = (!change.verticals?.length || change.verticals.includes(product.vertical)) &&
          (!change.strategies?.length || change.strategies.includes(product.gtmStrategy)) &&
          (!change.riskTags?.length || change.riskTags.some((tag) => product.riskTags.includes(tag)));
        if (!exposed || !SERVICE_PRODUCT_STATUSES.has(product.status)) continue;
        product.users *= change.multiplier;
        product.weeklyRevenue *= change.multiplier;
        product.weeklyInference *= change.multiplier;
        product.weeklyOperatingCost *= Math.max(0.75, change.multiplier);
      }
      break;
    }
    case "setSalary": {
      const salary = v as { employeeId: string; salary: number };
      const employee = state.employees.find((worker) => worker.id === salary.employeeId);
      if (employee && Number.isFinite(salary.salary)) employee.salary = Math.max(0, salary.salary);
      break;
    }
    case "researchCost":
    case "researchSpeed":
    case "energyCost":
    case "wageMultiplier":
    case "pricePressure":
    case "reliability":
    case "overheadRelief":
    case "govAccess":
    case "computeWaste":
    case "boardPressure":
    case "usersSpike":
      if (effect.type === "boardPressure" && state.board) {
        state.board.approval = Math.max(0, state.board.approval - Number(v));
      }
      if (effect.type === "usersSpike") {
        for (const p of state.products) if (p.status === "active") p.users *= Number(v);
      }
      if (effect.type === "reliability") {
        for (const p of state.products) p.reliability = Math.min(0.99, p.reliability + Number(v));
      }
      break;
    case "world": {
      const rec = v as { meter: keyof WorldState; amount: number };
      if (rec?.meter && rec.meter in state.world) {
        state.world[rec.meter] = Math.max(0, state.world[rec.meter] + rec.amount);
      }
      break;
    }
    case "unlockModel":
      if (typeof v === "string" && !state.ownedModels.includes(v) && modelById[v]) {
        state.ownedModels.push(v);
      }
      break;
    case "ownedCluster":
      state.compute.ownedCluster += Number(v);
      break;
    case "dataCenters":
      state.compute.dataCenters += Number(v);
      break;
    case "customChips":
      state.compute.customChips += Number(v);
      break;
    case "unlockVertical":
      if (typeof v === "string" && !state.company.verticals.includes(v)) state.company.verticals.push(v);
      break;
    case "unlockTech":
      if (typeof v === "string" && techById[v] && !state.company.technologies.includes(v)) {
        state.company.technologies.push(v);
      }
      break;
    case "loseEmployee": {
      const extra = typeof v === "string" ? state.employees.find((e) => e.id === v && e.role === "employee") : state.employees.find((e) => e.role === "employee");
      if (extra) {
        extra.offMarketDays = 21;
        state.employees = state.employees.filter((e) => e.id !== extra.id);
        state.stats.employeesFired += 1;
      }
      break;
    }
    case "competitorBoost": {
      const c = state.competitors.find((x) => !x.disabled);
      if (c) c.capability += 4;
      break;
    }
    case "special":
      if (v === "automateCeo") {
        state.company.ceoAutomated = true;
        state.endingId = state.endingId ?? "automated-ceo";
        state.endingNote = "The board preferred a system with fewer feelings.";
      }
      if (v === "autoResearch") {
        state.unlocks.automation = true;
      }
      break;
    case "ending":
      if (typeof v === "string") {
        state.endingId = v;
        state.clock.paused = true;
      }
      break;
    case "regulation":
      state.world.regulation += Number(v);
      break;
    default:
      break;
  }
}
