import { offices } from "../data/offices";
import type { GameState } from "./types";
import { monthlyArr } from "./conditions";

export { monthlyArr };

export function monthlyPayroll(state: GameState): number {
  return state.employees.reduce((s, w) => s + w.salary / 12, 0);
}

export function monthlyRent(state: GameState): number {
  const office = offices[state.company.officeLevel];
  return office?.rent ?? 2200;
}

export function inferenceCoverage(state: GameState): number {
  return state.compute.rentedGpus * 800 + state.compute.ownedCluster * 120 + state.compute.dataCenters * 4000;
}
export function fixedComputeCost(state: GameState): number {
  return state.compute.rentedGpus * 2400 + state.compute.reservedCapacity * 6500 + state.compute.dataCenters * 180000 + state.compute.monthlyCloudBill;
}
export function monthlyCompute(state: GameState): number {
  const weekly = state.products.filter(p=>["active","mature","declining"].includes(p.status)).reduce((sum,p)=>sum+p.weeklyInference,0);
  return Math.max(0, weekly-inferenceCoverage(state))*4.33 + fixedComputeCost(state);
}

export function monthlyBurn(state: GameState): number {
  const costs = monthlyPayroll(state) + monthlyRent(state) + monthlyCompute(state);
  const rev = monthlyArr(state);
  return Math.max(0, costs - rev);
}

export function runwayMonths(state: GameState): number {
  const burn = monthlyBurn(state);
  if (burn <= 0) return 99;
  return state.company.cash / burn;
}

export function grossMargin(state: GameState): number {
  const rev = monthlyArr(state);
  const inf = state.products
    .filter((p) => p.status === "active" || p.status === "mature" || p.status === "declining")
    .reduce((s, p) => s + p.weeklyInference * 4.33, 0);
  if (rev <= 0) return 0;
  return (rev - inf) / rev;
}

export function eraFor(state: GameState): 1 | 2 | 3 | 4 | 5 {
  const cap = state.world.aiCapability;
  if (cap >= 75) return 5;
  if (cap >= 55) return 4;
  if (cap >= 38) return 3;
  if (cap >= 22 || state.clock.date.year >= 2025) return 2;
  return 1;
}

export function valuationOf(state: GameState): number {
  const arr = monthlyArr(state) * 12;
  const multiple =
    state.economy === "aiBubble" ? 28 : state.economy === "boom" ? 18 : state.economy === "recession" ? 6 : 12;
  const hype = 1 + state.company.hype / 80;
  const tech = 1 + state.company.technologies.length * 0.04;
  return Math.max(state.company.cash, arr * multiple * hype * tech + state.funding.raisedTotal * 0.4);
}
