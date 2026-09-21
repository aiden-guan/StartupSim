import { primitiveById } from "../data/primitives";
import { inferenceCoverage, RENTED_GPU_WEEKLY_COVERAGE } from "./derived";
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

/** Credits needed for the next inference bill stay out of the training pool. */
export function inferenceCreditsReserved(state: GameState): number {
  return Math.min(Math.max(0, state.compute.apiCredits), uncoveredInferenceDemand(state));
}

/** GPU capacity leftover after live inference, expressed as a daily training budget. */
export function leftoverCapacityDaily(state: GameState): number {
  return Math.max(0, inferenceCoverage(state) - weeklyInferenceDemand(state)) / 7;
}

export interface TrainingCapacityBreakdown {
  total: number;
  hostedCredits: number;
  gpuHeadroom: number;
  reservedForInference: number;
}

/**
 * Training can draw from two sources: the remaining hosted-credit buffer and
 * any owned/rented inference capacity left over after live products are served.
 * Keep this breakdown shared by the simulation and the Compute panel so a
 * player never sees a capacity number that disagrees with the actual tick.
 */
export function trainingCapacityBreakdown(state: GameState): TrainingCapacityBreakdown {
  const reservedForInference = inferenceCreditsReserved(state);
  const hostedCredits = Math.max(0, state.compute.apiCredits - reservedForInference);
  const gpuHeadroom = leftoverCapacityDaily(state);
  return {
    total: hostedCredits + gpuHeadroom,
    hostedCredits,
    gpuHeadroom,
    reservedForInference,
  };
}

export function availableTrainingCompute(state: GameState): number {
  return trainingCapacityBreakdown(state).total;
}

/**
 * Returns the smallest number of additional rented GPUs that would bring all
 * active training work to full speed, using the same coverage math as the
 * simulation. API credits are daily training capacity; GPU coverage is weekly
 * and only the portion left after live inference can train models.
 */
export function rentedGpusNeededForTraining(state: GameState): number {
  const demand = taskComputeDemandTotal(state);
  const credits = Math.max(0, state.compute.apiCredits - inferenceCreditsReserved(state));
  if (demand <= credits) return 0;

  const weeklyInference = weeklyInferenceDemand(state);
  const targetCoverage = weeklyInference + (demand - credits) * 7;
  return Math.max(0, Math.ceil((targetCoverage - inferenceCoverage(state)) / RENTED_GPU_WEEKLY_COVERAGE));
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

function taskComputeDemandTotal(state: GameState): number {
  return state.tasks
    .filter((task) => isComputeTask(task))
    .reduce((sum, task) => sum + taskComputeDemand(state, task), 0);
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
  const trainingCredits = Math.max(0, state.compute.apiCredits - inferenceCreditsReserved(state));
  const creditSpend = Math.max(0, Math.min(trainingCredits, Math.round(allocation.served - capacity)));
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
  const extraGpus = rentedGpusNeededForTraining(state);
  const uncovered = uncoveredInferenceDemand(state);
  if (uncovered > 0 && state.compute.apiCredits <= 0) {
    return `${name} is blocked: live products are using all owned and rented capacity, and hosted credits are empty. ${extraGpus > 0 ? `Add ${extraGpus} rented GPU${extraGpus === 1 ? "" : "s"} to restore training headroom.` : "Add more capacity to restore training headroom."}`;
  }
  if (state.compute.apiCredits <= 0) {
    return `${name} is blocked: there is no hosted credit buffer and no spare owned or rented capacity. ${extraGpus > 0 ? `Add ${extraGpus} rented GPU${extraGpus === 1 ? "" : "s"} to resume work.` : "Add capacity to resume work."}`;
  }
  return `${name} is blocked because all available training capacity is reserved or exhausted. Add more capacity to resume work.`;
}
