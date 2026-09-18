import type { Employee, GameState, SkillName, Task } from "./types";
import { SKILLS } from "./types";
import { communicationMultiplier } from "./overhead";
import { companySkill, idleWorkers, workerSkill } from "./workers";
import { managementRelief, workersFor } from "./tasks";

export const TASK_SKILLS: Record<Task["type"], SkillName[]> = {
  product: ["engineering", "product", "research", "growth", "productivity"],
  research: ["research", "engineering", "product"],
  promo: ["growth", "product", "productivity"],
  lobby: ["growth", "productivity"],
  special: ["research", "engineering", "product"],
  crisis: ["engineering", "research", "product"],
  training: ["research", "engineering", "product"],
  hiring: ["growth", "productivity"],
};

export function relevantSkillsFor(task: Task): SkillName[] {
  return TASK_SKILLS[task.type] ?? ["productivity"];
}

export function workerFit(state: GameState, worker: Employee, task: Task): number {
  const skills = relevantSkillsFor(task);
  const weighted = skills.reduce((sum, skill, i) => {
    const w = i === 0 ? 1.35 : i === 1 ? 1.1 : 0.85;
    return sum + workerSkill(worker, state, skill) * w;
  }, 0);
  return weighted / Math.max(1, skills.length);
}

export function dailyOutput(state: GameState, task: Task, workers: Employee[]): number {
  const active = workers.filter((w) => w.burnoutDays <= 0);
  if (!active.length) return 0;
  const efficiency = communicationMultiplier(active.length, managementRelief(state));
  const skills = relevantSkillsFor(task);
  if (task.type === "research") {
    return (companySkill(state, "engineering", active) + companySkill(state, "research", active) + companySkill(state, "product", active) / 3) * 0.22 * efficiency;
  }
  if (task.type === "lobby" || task.type === "hiring") {
    return companySkill(state, "growth", active, task.type === "lobby") * 0.22 * efficiency;
  }
  if (task.type === "special" || task.type === "training") {
    return ((companySkill(state, "research", active, true) + companySkill(state, "engineering", active, true) + companySkill(state, "product", active, true)) / 3) * 0.22 * efficiency;
  }
  return companySkill(state, skills.includes("productivity") ? "productivity" : skills[0]!, active) * 0.22 * efficiency;
}

export function departureImpact(state: GameState, worker: Employee): { fromTask: Task | null; lossPct: number } {
  const fromTask = worker.taskId ? state.tasks.find((t) => t.id === worker.taskId) ?? null : null;
  if (!fromTask) return { fromTask: null, lossPct: 0 };
  const current = workersFor(fromTask, state);
  const without = current.filter((w) => w.id !== worker.id);
  const before = dailyOutput(state, fromTask, current);
  const after = dailyOutput(state, fromTask, without);
  const lossPct = before <= 0 ? 0 : Math.round(((before - after) / before) * 100);
  return { fromTask, lossPct };
}

export function reassignmentImpact(state: GameState, worker: Employee, destination: Task): { fromTask: Task | null; lossPct: number; gainPct: number } {
  const fromTask = worker.taskId ? state.tasks.find((t) => t.id === worker.taskId) ?? null : null;
  if (!fromTask || fromTask.id === destination.id) return { fromTask, lossPct: 0, gainPct: 0 };
  const current = workersFor(fromTask, state);
  const without = current.filter((w) => w.id !== worker.id);
  const before = dailyOutput(state, fromTask, current);
  const after = dailyOutput(state, fromTask, without);
  const destNow = workersFor(destination, state);
  const destBefore = dailyOutput(state, destination, destNow);
  const destAfter = dailyOutput(state, destination, [...destNow.filter((w) => w.id !== worker.id), worker]);
  const lossPct = before <= 0 ? 0 : Math.round(((before - after) / before) * 100);
  const gainPct = destBefore <= 0 ? 100 : Math.round(((destAfter - destBefore) / Math.max(0.01, destBefore)) * 100);
  return { fromTask, lossPct, gainPct };
}

export function contributionOf(state: GameState, worker: Employee, task: Task): number {
  if (worker.burnoutDays > 0) return 0;
  return dailyOutput(state, task, [worker]);
}

export interface AutoAssignResult {
  assigned: { taskId: string; workerId: string; name: string; skill: SkillName; reason: string }[];
}

const MAX_AUTO_ASSIGN_TEAM_SIZE = 4;

export function planAutoAssign(state: GameState, target?: Task | string): AutoAssignResult {
  const targetTask = typeof target === "string" ? state.tasks.find((t) => t.id === target) : target;
  const isSingleTask = Boolean(targetTask);

  const projects = targetTask
    ? (targetTask.type === "crisis" || targetTask.progress < targetTask.requiredProgress ? [targetTask] : [])
    : state.tasks.filter((task) => task.type === "crisis" || task.progress < task.requiredProgress);

  if (!projects.length) {
    return { assigned: [] };
  }

  const open = isSingleTask
    ? idleWorkers(state)
    : state.employees.filter((w) => w.burnoutDays <= 0 && w.role !== "ai");

  const assigned: AutoAssignResult["assigned"] = [];
  const taken = new Set<string>();

  // Keep each project's simulated team in sync while planning so later picks
  // account for both team overhead and the people selected earlier in this plan.
  // For single task, keep workers already on the task in the team count.
  // For auto-assign all, clear active workers so everyone can be placed into the best position,
  // keeping only resting workers in place on their respective tasks.
  const teams = new Map(
    projects.map((task) => [
      task.id,
      isSingleTask
        ? [...workersFor(task, state)]
        : workersFor(task, state).filter((w) => w.burnoutDays > 0),
    ]),
  );

  function addBest(coverageOnly: boolean): boolean {
    let best: { task: Task; worker: Employee; score: number; skill: SkillName } | null = null;
    for (const task of projects) {
      const current = teams.get(task.id)!;
      const activeCount = current.filter((worker) => worker.burnoutDays <= 0).length;
      if (activeCount >= MAX_AUTO_ASSIGN_TEAM_SIZE || (coverageOnly && activeCount > 0)) continue;
      const needs = relevantSkillsFor(task);
      const before = dailyOutput(state, task, current);
      for (const worker of open) {
        if (taken.has(worker.id)) continue;
        const after = dailyOutput(state, task, [...current, worker]);
        const marginal = after - before;
        const fit = workerFit(state, worker, task);
        const score = marginal * 1.4 + fit * 0.35;
        const skill = needs.slice().sort((a, b) => workerSkill(worker, state, b) - workerSkill(worker, state, a))[0] ?? "productivity";
        if (!best || score > best.score) best = { task, worker, score, skill };
      }
    }

    // Coverage is the explicit priority, even when the only available fit is
    // weak. Once every project has a teammate, avoid adding zero-value depth.
    if (!best || (!coverageOnly && best.score <= 0.05)) return false;
    taken.add(best.worker.id);
    teams.get(best.task.id)!.push(best.worker);
    const label = best.skill === "productivity" ? "pace" : best.skill;
    const firstOnProject = teams.get(best.task.id)!.filter((worker) => worker.burnoutDays <= 0).length === 1;
    const prevTaskId = best.worker.taskId;
    const isReassignment = Boolean(prevTaskId && prevTaskId !== best.task.id);
    const verb = isReassignment ? "Reassigned" : "Assigned";
    assigned.push({
      taskId: best.task.id,
      workerId: best.worker.id,
      name: best.worker.name.split(" ")[0]!,
      skill: best.skill,
      reason: firstOnProject
        ? `${verb} ${best.worker.name.split(" ")[0]} to ${best.task.name} — covering the project with the strongest available ${label} fit.`
        : `${verb} ${best.worker.name.split(" ")[0]} to ${best.task.name} — strongest available ${label} fit for extra project depth.`,
    });
    return true;
  }

  // First give every uncovered project a teammate. This loop intentionally has
  // no quality threshold: one capable person is better than a stalled project.
  while (taken.size < open.length && projects.some((task) => (teams.get(task.id) ?? []).every((worker) => worker.burnoutDays > 0))) {
    if (!addBest(true)) break;
  }

  // With coverage satisfied, distribute any remaining capacity by marginal
  // output plus task fit, preserving the existing four-person team cap.
  while (taken.size < open.length) {
    if (!addBest(false)) break;
  }
  return { assigned };
}

export function applyAutoAssign(state: GameState, target?: Task | string): AutoAssignResult {
  const targetTask = typeof target === "string" ? state.tasks.find((t) => t.id === target) : target;
  const isSingleTask = Boolean(targetTask);
  const plan = planAutoAssign(state, targetTask);

  if (isSingleTask) {
    for (const row of plan.assigned) {
      const worker = state.employees.find((w) => w.id === row.workerId);
      const task = state.tasks.find((item) => item.id === row.taskId);
      if (!worker || !task || worker.taskId || worker.burnoutDays > 0) continue;
      worker.taskId = task.id;
    }
  } else {
    const assignedTaskByWorkerId = new Map(plan.assigned.map((row) => [row.workerId, row.taskId]));
    for (const worker of state.employees) {
      if (worker.burnoutDays > 0 || worker.role === "ai") continue;
      worker.taskId = assignedTaskByWorkerId.get(worker.id) ?? null;
    }
  }

  return plan;
}

export function overallScore(worker: Employee): number {
  return SKILLS.reduce((sum, skill) => sum + worker.skills[skill], 0);
}
