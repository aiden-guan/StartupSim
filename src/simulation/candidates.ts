import { recruitingChannels, type ChannelDef } from "../data/recruiting";
import { traits } from "../data/traits";
import { randomLook } from "./look";
import { randomName } from "./names";
import { uid, type Rng } from "./rng";
import type { DepartmentId, Employee, Skills } from "./types";
import { SKILLS } from "./types";

export interface ChannelQuality {
  mean: number;
  spread: number;
  floor: number;
  supportingFloor: number;
  eliteChance: number;
  gemChance: number;
  weaknessChance: number;
}

export function channelQuality(channel: ChannelDef): ChannelQuality {
  const t = channel.targetScore;
  return {
    mean: t,
    spread: Math.max(2.2, 11 - t * 0.22),
    floor: Math.max(1, t * 0.12),
    supportingFloor: Math.max(1, t * 0.16),
    eliteChance: Math.min(0.42, 0.03 + t * 0.01),
    gemChance: Math.max(0.008, 0.045 - t * 0.001),
    weaknessChance: Math.max(0.05, 0.48 - t * 0.012),
  };
}

function clampSkill(n: number): number {
  return Math.max(1, Math.min(18, n));
}

function sampleAround(rng: Rng, mean: number, spread: number, floor: number): number {
  const u = rng.next() + rng.next() + rng.next() - 1.5;
  return clampSkill(Math.max(floor, mean + u * spread));
}

export function generateSkills(rng: Rng, channel: ChannelDef, bonus = 0): Skills {
  const q = channelQuality(channel);
  const mean = q.mean + bonus;
  const gem = rng.chance(q.gemChance);
  const elite = gem || rng.chance(q.eliteChance);
  const focus = rng.pick(["research", "engineering", "product", "growth"] as const);
  const supportingFloor = gem ? Math.max(q.supportingFloor, 5) : q.supportingFloor;
  const skills: Skills = {
    research: sampleAround(rng, mean * 0.16, q.spread * 0.35, q.floor),
    engineering: sampleAround(rng, mean * 0.16, q.spread * 0.35, q.floor),
    product: sampleAround(rng, mean * 0.16, q.spread * 0.35, q.floor),
    growth: sampleAround(rng, mean * 0.16, q.spread * 0.35, q.floor),
    productivity: sampleAround(rng, 5 + mean * 0.08, q.spread * 0.25, 3),
  };

  if (elite) {
    skills[focus] = clampSkill(sampleAround(rng, 9 + mean * 0.18, q.spread * 0.2, 8));
    for (const skill of ["research", "engineering", "product", "growth"] as const) {
      if (skill === focus) continue;
      skills[skill] = clampSkill(Math.max(skills[skill], supportingFloor + rng.float(0, 3.2)));
    }
  } else {
    skills[focus] = clampSkill(skills[focus] + Math.max(1.4, mean * 0.12));
    for (const skill of ["research", "engineering", "product", "growth"] as const) {
      if (skill === focus) continue;
      skills[skill] = clampSkill(Math.max(skills[skill], supportingFloor * 0.75));
    }
  }

  if (!gem && rng.chance(q.weaknessChance)) {
    const weak = rng.pick((["research", "engineering", "product", "growth"] as const).filter((s) => s !== focus));
    skills[weak] = clampSkill(q.floor + rng.float(0, 1.8));
  }

  if (gem) {
    skills.productivity = clampSkill(Math.max(skills.productivity, 8));
  }

  return skills;
}

export function candidateQualityScore(skills: Skills): number {
  const core = SKILLS.filter((s) => s !== "productivity").map((s) => skills[s]);
  const sorted = [...core].sort((a, b) => b - a);
  const breadth = (sorted[1] ?? 0) + (sorted[2] ?? 0);
  return core.reduce((s, n) => s + n, 0) + skills.productivity * 0.45 + breadth * 0.2;
}

export function generateEmployee(rng: Rng, scoreTarget: number, remote = false, channelId?: string): Employee {
  const channel = recruitingChannels.find((c) => c.id === channelId) ??
    recruitingChannels.reduce((best, c) => Math.abs(c.targetScore - scoreTarget) < Math.abs(best.targetScore - scoreTarget) ? c : best);
  const skills = generateSkills(rng, { ...channel, targetScore: scoreTarget });
  const focus = (["research", "engineering", "product", "growth"] as const).slice().sort((a, b) => skills[b] - skills[a])[0]!;
  const traitPool = traits.filter((t) => !["tireless", "unicorn"].includes(t.id));
  const picked = rng.chance(0.7) ? [rng.pick(traitPool).id] : rng.pickN(traitPool, 2).map((t) => t.id);
  if (rng.chance(channelQuality(channel).gemChance + 0.01)) picked.push("unicorn");
  const dept: DepartmentId =
    focus === "growth" ? "sales" : focus === "research" ? "research" : focus === "product" ? "marketing" : "engineering";
  return {
    id: uid(rng, "emp"),
    name: randomName(rng),
    title: focus === "research" ? "Researcher" : focus === "growth" ? "Growth" : focus === "product" ? "Product" : "Engineer",
    role: "employee",
    look: randomLook(rng),
    skills,
    happiness: rng.int(6, 12),
    burnoutDays: 0,
    burnoutRisk: 0,
    loyalty: rng.int(4, 9),
    ambition: rng.int(3, 9),
    ethics: rng.int(3, 9),
    salary: 0,
    equity: 0,
    traits: picked,
    taskId: null,
    remote,
    tenureDays: 0,
    offMarketDays: 0,
    department: dept,
  };
}

export function evaluateHireOffer(
  rng: Rng,
  salary: number,
  minSalary: number,
): { accept: boolean; reason?: string } {
  if (salary >= minSalary) return { accept: true };
  const gap = (minSalary - salary) / Math.max(1, minSalary);
  const chance = Math.max(0, 1 - gap);
  if (rng.next() < chance) return { accept: true };
  if (gap >= 0.18) return { accept: false, reason: "Compensation too low" };
  return { accept: false, reason: "Better competing offer" };
}
