import { primitiveById } from "../data/primitives";
import { inferenceCoverage } from "./derived";
import { isServiceProductStatus, type GameState, type Task } from "./types";

export const COMPUTE_TASK_TYPES = new Set(["product", "research", "special"]);

export function isComputeTask(task: Task): boolean {
  return COMPUTE_TASK_TYPES.has(task.type);
}

export function weeklyInferenceDemand(state: GameState): number {
  return state.products
    .filter((p) => isServiceProductStatus(p.status))
    .reduce((sum, p) => sum + p.weeklyInference, 0);
}

export function uncoveredInferenceDemand(state: GameState): number {
  return Math.max(0, weeklyInferenceDemand(state) - inferenceCoverage(state));
}

export function inferenceCreditDepleted(state: GameState): boolean {
  return state.compute.apiCredits <= 0 && uncoveredInferenceDemand(state) > 0;
}

/** GPU capacity leftover after live inference, expressed as a daily training budget. */
export function leftoverCapacityDaily(state: GameState): number {
  return Math.max(0, inferenceCoverage(state) - weeklyInferenceDemand(state)) / 7;
}

export function availableTrainingCompute(state: GameState): number {
  return Math.max(0, state.compute.apiCredits) + leftoverCapacityDaily(state);
}

export function taskComputeDemand(state: GameState, task: Task): number {
  if (!isComputeTask(task)) return 0;
  const workers = state.employees.filter((w) => w.taskId === task.id && w.burnoutDays <= 0);
  if (!workers.length) return 0;
  const product = task.productId ? state.products.find((p) => p.id === task.productId) : undefined;
  let weight = 1;
  if (product) {
    const pa = primitiveById[product.combo[0]];
    const pb = primitiveById[product.combo[1]];
    weight = (pa?.computeWeight ?? 1) * (pb?.computeWeight ?? 1);
  }
  const difficulty = product?.difficulty ?? (task.requiredProgress / 120);
  const base = task.type === "research" ? 22 : task.type === "special" ? 16 : 14 + difficulty * 7;
  const team = 1 + workers.length * 0.32;
  const concurrent = state.tasks.filter((t) => t.id !== task.id && isComputeTask(t) && state.employees.some((w) => w.taskId === t.id && w.burnoutDays <= 0)).length;
  return Math.max(4, Math.round(base * weight * team * (1 + concurrent * 0.22)));
}

export interface ComputeAllocation {
  demand: number;
  served: number;
  ratio: number;
  blocked: boolean;
  byTask: Map<string, { demand: number; served: number; ratio: number; blocked: boolean }>;
}

export function allocateTrainingCompute(state: GameState): ComputeAllocation {
  const active = state.tasks.filter((task) => isComputeTask(task) && taskComputeDemand(state, task) > 0);
  const byTask = new Map<string, { demand: number; served: number; ratio: number; blocked: boolean }>();
  const demand = active.reduce((sum, task) => sum + taskComputeDemand(state, task), 0);
  if (demand <= 0) {
    return { demand: 0, served: 0, ratio: 1, blocked: false, byTask };
  }
  const available = availableTrainingCompute(state);
  const served = Math.min(demand, available);
  const blocked = available <= 0;
  for (const task of active) {
    const need = taskComputeDemand(state, task);
    const share = demand > 0 ? (need / demand) * served : 0;
    const got = Math.min(need, share);
    const ratio = need > 0 ? got / need : 1;
    byTask.set(task.id, { demand: need, served: got, ratio, blocked: got <= 0 });
  }
  return { demand, served, ratio: demand > 0 ? served / demand : 1, blocked, byTask };
}

/** Spend credits to match the served training budget. GPU leftover is capacity, not a credit spend. */
export function consumeTrainingCompute(state: GameState, allocation: ComputeAllocation): number {
  const capacity = leftoverCapacityDaily(state);
  const creditSpend = Math.max(0, Math.min(state.compute.apiCredits, Math.round(allocation.served - capacity)));
  state.compute.apiCredits = Math.max(0, state.compute.apiCredits - creditSpend);
  state.compute.trainingReserved = allocation.served;
  state.stats.computeConsumed += creditSpend;
  return creditSpend;
}

export function computeBlockReason(state: GameState, task: Task): string | null {
  const allocation = allocateTrainingCompute(state);
  const row = allocation.byTask.get(task.id);
  if (!row?.blocked) return null;
  const name = task.name;
  return `${name} is blocked because available compute has been exhausted.`;
}
