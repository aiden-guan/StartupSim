import { offices } from "../data/offices";
import { BALANCE } from "../config/balance";
import { locations } from "../data/locations";
import { traitById } from "../data/traits";
import type { Employee, GameState, SkillName, Skills } from "./types";
import { SKILLS } from "./types";
import type { Rng } from "./rng";

export function emptySkills(): Skills {
  return { research: 0, engineering: 0, product: 0, growth: 0, productivity: 0 };
}

export function addSkills(a: Skills, b: Partial<Skills>): Skills {
  return {
    research: a.research + (b.research ?? 0),
    engineering: a.engineering + (b.engineering ?? 0),
    product: a.product + (b.product ?? 0),
    growth: a.growth + (b.growth ?? 0),
    productivity: a.productivity + (b.productivity ?? 0),
  };
}

export function workerSelfBonus(worker: Employee, skill: SkillName | "happiness" | "burnoutRate" | "minSalary"): number {
  let sum = 0;
  let minSal = 1;
  for (const id of worker.traits) {
    const t = traitById[id];
    const v = t?.worker?.[skill as SkillName];
    if (skill === "minSalary") {
      const m = t?.worker?.minSalary;
      if (m) minSal *= m;
    } else if (typeof v === "number") {
      sum += v;
    }
  }
  if (skill === "minSalary") return minSal;
  return sum;
}

export function companyTraitBonus(state: GameState, skill: SkillName | "happiness" | "burnoutRate"): number {
  let sum = 0;
  for (const w of state.employees) {
    if (w.burnoutDays > 0) continue;
    for (const id of w.traits) {
      const t = traitById[id];
      const v = t?.company?.[skill as SkillName];
      if (typeof v === "number") sum += v;
    }
  }
  return sum;
}

export function workerSkill(worker: Employee, state: GameState, name: SkillName): number {
  const raw = worker.skills[name] + workerSelfBonus(worker, name) + companyTraitBonus(state, name);
  return Math.max(0, raw);
}

export function workerHappiness(worker: Employee, state: GameState): number {
  const base = worker.happiness + workerSelfBonus(worker, "happiness") + companyTraitBonus(state, "happiness");
  const fairness = worker.salary <= 0 ? 1 : Math.min(1.2, worker.salary / Math.max(60_000, worker.salary));
  const office = offices[state.company.officeLevel];
  const officeBonus = 1 + (office?.morale ?? state.company.officeLevel * 4) / 100;
  const backlash = Math.max(0.4, 1 - state.company.backlash / 200);
  return Math.max(0, base * officeBonus * backlash * (0.7 + 0.3 * fairness));
}

export function companySkill(
  state: GameState,
  name: SkillName,
  workers: Employee[],
  scaleByProductivity = false,
): number {
  let total = 0;
  for (const w of workers) {
    if (w.burnoutDays > 0) continue;
    const s = workerSkill(w, state, name);
    const prod = scaleByProductivity ? Math.max(0.3, workerSkill(w, state, "productivity") / 8) : 1;
    total += Math.max(0, s * prod);
  }
  const auto = state.company.automation.engineering ?? 0;
  if (name === "engineering" || name === "research" || name === "productivity") {
    total *= 1 + auto / 200;
  }
  const loc = state.company.locations.reduce((s, id) => {
    const def = locations.find((l) => l.id === id);
    return s + (def?.skills[name] ?? 0) / 8;
  }, 0);
  const bureau = 1 - Math.min(0.45, state.company.culture.bureaucracy / 200);
  const officeProd = 1 + (offices[state.company.officeLevel]?.productivity ?? 0) / 100;
  return Math.max(0, (total + loc) * bureau * officeProd);
}

export function idleWorkers(state: GameState): Employee[] {
  return state.employees.filter((w) => !w.taskId && w.burnoutDays <= 0 && w.role !== "ai");
}

export function updateBurnout(state: GameState, rng: Rng, worker: Employee): void {
  if (!state.company.seenMarket && (worker.role === "founder" || worker.role === "cofounder")) return;
  if (worker.traits.includes("tireless") || worker.role === "robot" || worker.role === "ai") return;
  if (worker.burnoutDays > 0) {
    worker.burnoutDays -= 1;
    return;
  }
  if (!worker.taskId) {
    worker.burnoutRisk = Math.max(0, worker.burnoutRisk - 0.01);
    return;
  }
  const happy = Math.max(0.4, workerHappiness(worker, state));
  const extra = workerSelfBonus(worker, "burnoutRate");
  const retention = 1 - (offices[state.company.officeLevel]?.retention ?? 0) / 220;
  worker.burnoutRisk += ((BALANCE.BASE_BURNOUT_RATE + extra) / Math.sqrt(happy)) * retention;
  if (rng.next() < worker.burnoutRisk + 0.008) {
    worker.burnoutDays = rng.int(BALANCE.MIN_BURNOUT_DAYS, BALANCE.MAX_BURNOUT_DAYS);
    worker.burnoutRisk = 0;
  }
}

export function growWorker(worker: Employee, rng: Rng): void {
  if (worker.burnoutDays > 0) return;
  for (const s of ["research", "engineering", "product", "growth"] as SkillName[]) {
    if (rng.next() < BALANCE.GROWTH_PROB) {
      worker.skills[s] += BALANCE.BASE_GROWTH + (s === "research" && worker.traits.includes("academic") ? 0.05 : 0);
    }
  }
  worker.tenureDays += 1;
}

export function employeeScore(worker: Employee): number {
  return SKILLS.reduce((s, k) => s + worker.skills[k], 0);
}

export function minSalaryFor(worker: Employee, state: GameState): number {
  const perkCut = state.company.perks.reduce((s, p) => s + (p.level + 1) * 0.01, 0);
  const econ =
    state.economy === "recession" || state.economy === "creditCrunch"
      ? 0.85
      : state.economy === "boom" || state.economy === "aiBubble"
        ? 1.15
        : 1;
  const self = workerSelfBonus(worker, "minSalary") || 1;
  const base = BALANCE.BASE_EMPLOYEE_SALARY + employeeScore(worker) * BALANCE.SALARY_PER_SCORE;
  return Math.round(base * econ * self * state.world.talentCostIndex * Math.max(0.6, 1 - perkCut) * (1 + state.company.prestige / 400));
}
