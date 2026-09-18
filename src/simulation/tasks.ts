import type { Employee, GameState, SkillName, Task } from "./types";
import { allocateTrainingCompute, isComputeTask } from "./compute";
import { communicationMultiplier } from "./overhead";
import { companySkill } from "./workers";
import { uid, type Rng } from "./rng";

const DAILY = 0.22;

export function workersFor(task: Task, state: GameState): Employee[] {
  return state.employees.filter((w) => w.taskId === task.id);
}

export function managementRelief(state: GameState): number {
  const managers = state.employees.filter((w) => w.traits.includes("great-manager") && w.burnoutDays <= 0)
    .length;
  const tech = state.company.technologies.includes("management-os") ? 2 : 0;
  return managers + tech;
}

export function developTask(state: GameState, task: Task, allocation?: ReturnType<typeof allocateTrainingCompute>): boolean {
  if (task.type !== "crisis" && task.progress >= task.requiredProgress) return true;
  const workers = workersFor(task, state);
  const n = workers.filter((w) => w.burnoutDays <= 0).length;
  if (!n && task.type !== "crisis") return false;
  let computeScale = 1;
  if (isComputeTask(task)) {
    const row = allocation?.byTask.get(task.id);
    if (row?.blocked || (allocation?.blocked && (row?.demand ?? 0) > 0)) return false;
    if (row) computeScale = row.ratio;
    if (computeScale <= 0) return false;
  }
  const mult = communicationMultiplier(n, managementRelief(state)) * computeScale;
  const productivity = companySkill(state, "productivity", workers) * DAILY * mult;
  const scale = (skill: SkillName, prodScale = true) => {
    const ticks = Math.max(1, task.requiredProgress / Math.max(0.4, productivity));
    return (companySkill(state, skill, workers, prodScale) / ticks) * 4 * mult;
  };

  switch (task.type) {
    case "product": {
      task.progress += productivity;
      const p = state.products.find((x) => x.id === task.productId);
      if (p) {
        p.points.product += scale("product");
        p.points.growth += scale("growth");
        p.points.engineering += scale("engineering");
        p.points.research += scale("research");
      }
      break;
    }
    case "promo":
      task.progress += productivity;
      task.skillVal = (task.skillVal ?? 0) + scale("growth") + scale("product") / 3;
      break;
    case "research":
      task.progress += (companySkill(state, "engineering", workers) + companySkill(state, "research", workers) + companySkill(state, "product", workers) / 3) * DAILY * mult;
      break;
    case "lobby":
      task.progress += companySkill(state, "growth", workers, true) * DAILY * mult;
      break;
    case "special":
    case "training":
      task.progress +=
        ((companySkill(state, "research", workers, true) +
          companySkill(state, "engineering", workers, true) +
          companySkill(state, "product", workers, true)) /
          3) *
        DAILY *
        mult;
      break;
    case "crisis":
      task.skillVal = (task.skillVal ?? 0) + scale(task.skillTarget ?? "engineering");
      break;
    case "hiring":
      task.progress += companySkill(state, "growth", workers) * DAILY * mult;
      break;
  }

  if (task.type === "crisis") {
    return (task.skillVal ?? 0) >= (task.skillNeed ?? 1) || (task.dueWeeks ?? 99) <= 0;
  }
  return task.progress >= task.requiredProgress;
}

export function assign(task: Task, worker: Employee): void {
  worker.taskId = task.id;
}

export function unassignAll(task: Task, state: GameState): void {
  for (const w of state.employees) {
    if (w.taskId === task.id) w.taskId = null;
  }
}

export function makeTask(
  rng: Rng,
  partial: Omit<Task, "id" | "progress" | "repeat"> & { repeat?: boolean },
): Task {
  return {
    id: uid(rng, "tsk"),
    progress: 0,
    repeat: partial.repeat ?? false,
    ...partial,
  };
}

/** Uses the same skill/overhead formula as development. No visual state enters the estimate. */
export function taskEstimate(state: GameState, task: Task) {
  const workers = workersFor(task,state);
  const active = workers.filter((w) => w.burnoutDays <= 0);
  const efficiency = communicationMultiplier(active.length,managementRelief(state));
  const skill = (name:SkillName,scale=false)=>companySkill(state,name,active,scale);
  const raw = task.type==='research' ? skill('engineering')+skill('research')+skill('product')/3 : task.type==='lobby'||task.type==='hiring' ? skill('growth',task.type==='lobby') : task.type==='special'||task.type==='training' ? (skill('research',true)+skill('engineering',true)+skill('product',true))/3 : skill('productivity');
  const allocation = allocateTrainingCompute(state);
  const compute = allocation.byTask.get(task.id);
  const computeScale = isComputeTask(task) ? (compute?.ratio ?? (taskComputeDemandFallback(state, task) > 0 ? allocation.ratio : 1)) : 1;
  const daily = active.length ? raw * DAILY * efficiency * computeScale : 0;
  return {
    workers,
    efficiency,
    daily,
    days:daily>0?Math.ceil(Math.max(0,task.requiredProgress-task.progress)/daily):null,
    computeBlocked: Boolean(isComputeTask(task) && compute?.blocked),
    resting: workers.length > 0 && active.length < workers.length,
    understaffed: active.length === 0,
  };
}

function taskComputeDemandFallback(state: GameState, task: Task): number {
  return isComputeTask(task) && workersFor(task, state).some((w) => w.burnoutDays <= 0) ? 1 : 0;
}
