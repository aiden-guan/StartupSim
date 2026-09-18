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
  assigned: { workerId: string; name: string; skill: SkillName; reason: string }[];
}

export function planAutoAssign(state: GameState, task: Task): AutoAssignResult {
  const open = idleWorkers(state).filter((w) => w.role !== "ai");
  const assigned: AutoAssignResult["assigned"] = [];
  const taken = new Set<string>();
  const needs = relevantSkillsFor(task);
  const current = [...workersFor(task, state)];
  const slots = Math.min(open.length, Math.max(1, 4 - current.filter((w) => w.burnoutDays <= 0).length));
  for (let n = 0; n < slots; n += 1) {
    let best: { worker: Employee; score: number; skill: SkillName } | null = null;
    const before = dailyOutput(state, task, current);
    for (const worker of open) {
      if (taken.has(worker.id) || worker.taskId) continue;
      const nextTeam = [...current, worker];
      const after = dailyOutput(state, task, nextTeam);
      const marginal = after - before;
      const fit = workerFit(state, worker, task);
      const score = marginal * 1.4 + fit * 0.35;
      const skill = needs.slice().sort((a, b) => workerSkill(worker, state, b) - workerSkill(worker, state, a))[0] ?? "productivity";
      if (!best || score > best.score) best = { worker, score, skill };
    }
    if (!best || best.score <= 0.05) break;
    taken.add(best.worker.id);
    current.push(best.worker);
    const label = best.skill === "productivity" ? "pace" : best.skill;
    assigned.push({
      workerId: best.worker.id,
      name: best.worker.name.split(" ")[0]!,
      skill: best.skill,
      reason: `Assigned ${best.worker.name.split(" ")[0]} to ${task.name} — strongest available ${label} fit.`,
    });
  }
  return { assigned };
}

export function applyAutoAssign(state: GameState, task: Task): AutoAssignResult {
  const plan = planAutoAssign(state, task);
  for (const row of plan.assigned) {
    const worker = state.employees.find((w) => w.id === row.workerId);
    if (!worker || worker.taskId || worker.burnoutDays > 0) continue;
    worker.taskId = task.id;
  }
  return plan;
}

export function overallScore(worker: Employee): number {
  return SKILLS.reduce((sum, skill) => sum + worker.skills[skill], 0);
}
