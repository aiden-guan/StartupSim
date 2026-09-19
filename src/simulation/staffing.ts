import type { Employee, GameState, SkillName, Task } from "./types";
import { SKILLS } from "./types";
import { communicationMultiplier } from "./overhead";
import { companySkill, companyTraitBonus, idleWorkers, workerSelfBonus, workerSkill } from "./workers";
import { managementRelief, workersFor } from "./tasks";
import { locations } from "../data/locations";
import { offices } from "../data/offices";

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

  if (!open.length) {
    return { assigned: [] };
  }

  // --- Precompute company-wide constants once ---
  const traitBonuses: Record<SkillName, number> = {
    engineering: companyTraitBonus(state, "engineering"),
    research: companyTraitBonus(state, "research"),
    product: companyTraitBonus(state, "product"),
    growth: companyTraitBonus(state, "growth"),
    productivity: companyTraitBonus(state, "productivity"),
  };

  const relief = managementRelief(state);
  const bureau = 1 - Math.min(0.45, state.company.culture.bureaucracy / 200);
  const officeProd = 1 + (offices[state.company.officeLevel]?.productivity ?? 0) / 100;
  const bureauOffice = bureau * officeProd;
  const autoEng = state.company.automation.engineering ?? 0;

  const locBonuses: Record<SkillName, number> = {
    engineering: 0,
    research: 0,
    product: 0,
    growth: 0,
    productivity: 0,
  };
  for (const id of state.company.locations) {
    const def = locations.find((l) => l.id === id);
    if (def) {
      for (const s of SKILLS) {
        locBonuses[s] += (def.skills[s] ?? 0) / 8;
      }
    }
  }

  // Precompute worker skills for all involved workers
  const workerSkills = new Map<string, Record<SkillName, number>>();
  function getWorkerSkills(w: Employee): Record<SkillName, number> {
    let cached = workerSkills.get(w.id);
    if (!cached) {
      cached = {
        engineering: Math.max(0, w.skills.engineering + workerSelfBonus(w, "engineering") + traitBonuses.engineering),
        research: Math.max(0, w.skills.research + workerSelfBonus(w, "research") + traitBonuses.research),
        product: Math.max(0, w.skills.product + workerSelfBonus(w, "product") + traitBonuses.product),
        growth: Math.max(0, w.skills.growth + workerSelfBonus(w, "growth") + traitBonuses.growth),
        productivity: Math.max(0, w.skills.productivity + workerSelfBonus(w, "productivity") + traitBonuses.productivity),
      };
      workerSkills.set(w.id, cached);
    }
    return cached;
  }

  for (const w of open) {
    getWorkerSkills(w);
  }

  function fastCompanySkill(name: SkillName, activeWorkers: Employee[], scaleByProductivity = false): number {
    let total = 0;
    for (const w of activeWorkers) {
      const skills = getWorkerSkills(w);
      const s = skills[name];
      const prod = scaleByProductivity ? Math.max(0.3, skills.productivity / 8) : 1;
      total += Math.max(0, s * prod);
    }
    if (name === "engineering" || name === "research" || name === "productivity") {
      total *= 1 + autoEng / 200;
    }
    return Math.max(0, (total + locBonuses[name]) * bureauOffice);
  }

  function fastDailyOutput(task: Task, activeWorkers: Employee[]): number {
    if (!activeWorkers.length) return 0;
    const efficiency = communicationMultiplier(activeWorkers.length, relief);
    const skills = relevantSkillsFor(task);
    if (task.type === "research") {
      return (
        (fastCompanySkill("engineering", activeWorkers) +
          fastCompanySkill("research", activeWorkers) +
          fastCompanySkill("product", activeWorkers) / 3) *
        0.22 *
        efficiency
      );
    }
    if (task.type === "lobby" || task.type === "hiring") {
      return fastCompanySkill("growth", activeWorkers, task.type === "lobby") * 0.22 * efficiency;
    }
    if (task.type === "special" || task.type === "training") {
      return (
        ((fastCompanySkill("research", activeWorkers, true) +
          fastCompanySkill("engineering", activeWorkers, true) +
          fastCompanySkill("product", activeWorkers, true)) /
          3) *
        0.22 *
        efficiency
      );
    }
    return fastCompanySkill(skills.includes("productivity") ? "productivity" : skills[0]!, activeWorkers) * 0.22 * efficiency;
  }

  interface WorkerTaskMeta {
    worker: Employee;
    fit: number;
    skill: SkillName;
    soloScore: number;
  }

  const projectCandidates = new Map<string, WorkerTaskMeta[]>();
  const maxNeededPerProject = projects.length * MAX_AUTO_ASSIGN_TEAM_SIZE + 1;

  for (const task of projects) {
    const needs = relevantSkillsFor(task);
    const metas: WorkerTaskMeta[] = [];
    for (const worker of open) {
      const skills = getWorkerSkills(worker);
      const fit = needs.reduce((sum, skill, i) => {
        const w = i === 0 ? 1.35 : i === 1 ? 1.1 : 0.85;
        return sum + skills[skill] * w;
      }, 0) / Math.max(1, needs.length);

      let bestSkill = needs[0] ?? "productivity";
      let bestSkillVal = skills[bestSkill] ?? 0;
      for (let i = 1; i < needs.length; i++) {
        const s = needs[i]!;
        const val = skills[s] ?? 0;
        if (val > bestSkillVal) {
          bestSkillVal = val;
          bestSkill = s;
        }
      }

      const soloOutput = fastDailyOutput(task, [worker]);
      const soloScore = soloOutput * 1.4 + fit * 0.35;
      metas.push({ worker, fit, skill: bestSkill, soloScore });
    }

    metas.sort((a, b) => b.soloScore - a.soloScore);
    projectCandidates.set(task.id, metas.length > maxNeededPerProject ? metas.slice(0, maxNeededPerProject) : metas);
  }

  const assigned: AutoAssignResult["assigned"] = [];
  const taken = new Set<string>();

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
      const activeCurrent = current.filter((worker) => worker.burnoutDays <= 0);
      if (activeCurrent.length >= MAX_AUTO_ASSIGN_TEAM_SIZE || (coverageOnly && activeCurrent.length > 0)) continue;

      const before = fastDailyOutput(task, activeCurrent);
      const candidates = projectCandidates.get(task.id)!;

      for (const meta of candidates) {
        if (taken.has(meta.worker.id)) continue;
        const after = fastDailyOutput(task, [...activeCurrent, meta.worker]);
        const marginal = after - before;
        const score = marginal * 1.4 + meta.fit * 0.35;
        if (!best || score > best.score) {
          best = { task, worker: meta.worker, score, skill: meta.skill };
        }
      }
    }

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

  while (taken.size < open.length && projects.some((task) => (teams.get(task.id) ?? []).every((worker) => worker.burnoutDays > 0))) {
    if (!addBest(true)) break;
  }

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
