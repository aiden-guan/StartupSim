import { offices } from "../data/offices.js";
import { BALANCE } from "../config/balance.js";
import { isServiceProductStatus, type FinancialBreakdown, type GameState } from "./types.js";
import { monthlyArr } from "./conditions.js";

export { monthlyArr };

export const RENTED_GPU_WEEKLY_COVERAGE = 800;
export const OWNED_COMPUTE_UNIT_WEEKLY_COVERAGE = 120;
export const RENTED_GPU_MONTHLY_COST = 2_400;
export const OWNED_COMPUTE_UNIT_COST = 100_000;
export const OWNED_COMPUTE_PURCHASE_OPTIONS = [4, 16, 64] as const;
export const MAX_RENTED_GPUS = 10_000;

export function monthlyPayroll(state: GameState): number {
  return state.employees.reduce((s, w) => s + w.salary / 12, 0);
}

export function monthlyRent(state: GameState): number {
  const office = offices[state.company.officeLevel];
  return office?.rent ?? 2200;
}

export function inferenceCoverage(state: GameState): number {
  return state.compute.rentedGpus * RENTED_GPU_WEEKLY_COVERAGE + state.compute.ownedCluster * OWNED_COMPUTE_UNIT_WEEKLY_COVERAGE + state.compute.dataCenters * 4000;
}
export function fixedComputeCost(state: GameState): number {
  return state.compute.rentedGpus * RENTED_GPU_MONTHLY_COST + state.compute.reservedCapacity * 6500 + state.compute.dataCenters * 180000 + state.compute.monthlyCloudBill;
}
export function monthlyCompute(state: GameState): number {
  const weekly = state.products.filter((p) => isServiceProductStatus(p.status)).reduce((sum, p) => sum + p.weeklyInference, 0);
  return Math.max(0, weekly-inferenceCoverage(state))*4.33 + fixedComputeCost(state);
}

export function monthlyProductOperations(state: GameState): number {
  return state.products
    .filter((p) => isServiceProductStatus(p.status))
    .reduce((sum, p) => sum + (p.weeklyOperatingCost ?? 0) * 4.33, 0);
}

export function monthlyCompanyOperations(state: GameState): number {
  const headcount = state.employees.length;
  const activeProducts = state.products.filter((p) => isServiceProductStatus(p.status)).length;
  const peopleComplexity = headcount <= 6 ? 0 : Math.pow(headcount - 6, 1.35) * BALANCE.COMPLEXITY_COST_PER_EMPLOYEE;
  const portfolioComplexity = activeProducts <= 1 ? 0 : Math.pow(activeProducts - 1, 1.45) * BALANCE.COMPLEXITY_COST_PER_PRODUCT;
  const managementRelief = state.employees.filter((w) => w.department === "management" && w.role === "employee").length * 0.08;
  return Math.round((peopleComplexity + portfolioComplexity) * Math.max(0.6, 1 - managementRelief));
}

export function monthlyBurn(state: GameState): number {
  const forecast = monthlyExpenseBreakdown(state);
  const costs = forecast.inference + forecast.fixedCompute + forecast.productOperations + forecast.payroll + forecast.office + forecast.companyOperations;
  return Math.max(0, costs - forecast.revenue);
}

export function monthlyExpenseBreakdown(state: GameState): FinancialBreakdown {
  const weeklyInference = state.products
    .filter((p) => isServiceProductStatus(p.status))
    .reduce((sum, p) => sum + p.weeklyInference, 0);
  const fixedCompute = fixedComputeCost(state);
  const inference = Math.max(0, weeklyInference - inferenceCoverage(state)) * 4.33;
  const breakdown: FinancialBreakdown = {
    revenue: monthlyArr(state),
    inference,
    productOperations: monthlyProductOperations(state),
    payroll: monthlyPayroll(state),
    office: monthlyRent(state),
    fixedCompute,
    companyOperations: monthlyCompanyOperations(state),
  };
  return breakdown;
}

export function runwayMonths(state: GameState): number {
  const burn = monthlyBurn(state);
  if (burn <= 0) return 99;
  return state.company.cash / burn;
}

export function grossMargin(state: GameState): number {
  const rev = monthlyArr(state);
  const inf = state.products
    .filter((p) => isServiceProductStatus(p.status))
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
  // Cash is a balance-sheet asset, not an operating valuation. Keep it out of
  // the company-value estimate so a well-funded but pre-revenue company does
  // not look like it has earned that value through the business itself.
  return Math.max(0, arr * multiple * hype * tech + state.funding.raisedTotal * 0.4);
}
