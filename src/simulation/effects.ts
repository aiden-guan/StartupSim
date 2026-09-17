import { techById } from "../data/technologies";
import { modelById } from "../data/models";
import type { Effect, GameState, WorldState } from "./types";

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
    case "inferenceMultiplier":
      for (const product of state.products) {
        if (["active", "mature", "declining"].includes(product.status)) product.weeklyInference *= Number(v);
      }
      break;
    case "demand": {
      const change = v as { verticals?: string[]; strategies?: string[]; riskTags?: string[]; multiplier: number };
      for (const product of state.products) {
        const exposed = (!change.verticals?.length || change.verticals.includes(product.vertical)) &&
          (!change.strategies?.length || change.strategies.includes(product.gtmStrategy)) &&
          (!change.riskTags?.length || change.riskTags.some((tag) => product.riskTags.includes(tag)));
        if (!exposed || !["active", "mature", "declining"].includes(product.status)) continue;
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
