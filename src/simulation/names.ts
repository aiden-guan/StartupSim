import { randomLook } from "./look";
import { uid, type Rng } from "./rng";
import type { DepartmentId, Employee, Skills } from "./types";
import { traits } from "../data/traits";

const first = [
  "Maya", "James", "Priya", "Noah", "Elena", "Kai", "Sofia", "Marcus", "Amina", "Leo",
  "Hana", "Owen", "Zara", "Theo", "Mei", "Ibrahim", "Lucia", "Soren", "Asha", "Felix",
  "Nia", "Hugo", "Ines", "Ravi", "June", "Omar", "Vera", "Kenji", "Pia", "Andre",
];
const last = [
  "Chen", "Adeyemi", "Park", "Silva", "Nguyen", "Kowalski", "Patel", "Berg", "Okafor", "Rossi",
  "Khan", "Nakamura", "Duarte", "Larsen", "Mensah", "Cohen", "Iyer", "Novak", "Wahl", "Sato",
];

export const namesList = { first, last };

export function randomName(rng: Rng): string {
  return `${rng.pick(first)} ${rng.pick(last)}`;
}

export function generateEmployee(rng: Rng, scoreTarget: number, remote = false): Employee {
  const focus = rng.pick(["research", "engineering", "product", "growth"] as const);
  const skills: Skills = {
    research: rng.int(1, 4),
    engineering: rng.int(1, 4),
    product: rng.int(1, 4),
    growth: rng.int(1, 4),
    productivity: rng.int(4, 8),
  };
  skills[focus] += Math.max(2, Math.round(scoreTarget / 5));
  const leftover = Math.max(0, scoreTarget - Object.values(skills).reduce((a, b) => a + b, 0));
  skills.productivity += Math.floor(leftover / 2);
  const traitPool = traits.filter((t) => !["tireless", "unicorn"].includes(t.id));
  const picked = rng.chance(0.7) ? [rng.pick(traitPool).id] : rng.pickN(traitPool, 2).map((t) => t.id);
  if (rng.chance(0.04)) picked.push("unicorn");
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

