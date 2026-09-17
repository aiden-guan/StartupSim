import { BALANCE } from "../config/balance";
import { offices } from "../data/offices";
import { perks as perkDefs } from "../data/perks";
import { monthlyBurn, runwayMonths } from "../simulation/derived";
import type { CharacterLook, CompanyBrand, DepartmentId, GameState, TaskType } from "../simulation/types";

export interface AgentView {
  id: string;
  name: string;
  role: "founder" | "cofounder" | "employee" | "robot" | "ai";
  look: CharacterLook;
  burnoutDays: number;
  happiness: number;
  taskType: TaskType | null;
  department: DepartmentId;
  title: string;
  remote: boolean;
}

export interface WorldView {
  officeLevel: number;
  officeId: string;
  officeName: string;
  companyName: string;
  brand: CompanyBrand;
  agents: AgentView[];
  hiddenCount: number;
  departmentCounts: Record<string, number>;
  perks: { id: string; level: number; object: string }[];
  computeLoad: number;
  hype: number;
  cash: number;
  runwayPressure: boolean;
  automation: number;
  healthy: boolean;
}

export function selectWorldView(game: GameState): WorldView {
  const office = offices[game.company.officeLevel] ?? offices[0]!;
  const renderable = game.employees.filter((e) => !e.remote && e.role !== "ai");
  const cap = Math.round(BALANCE.RENDER_AGENT_CAP * (game.settings.npcDensity || 1));
  const agents: AgentView[] = renderable.slice(0, cap).map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    look: e.look,
    burnoutDays: e.burnoutDays,
    happiness: e.happiness,
    taskType: game.tasks.find((t) => t.id === e.taskId)?.type ?? null,
    department: e.department,
    title: e.title,
    remote: e.remote,
  }));
  const hiddenCount = Math.max(0, renderable.length - agents.length);
  const departmentCounts: Record<string, number> = {};
  for (const e of game.employees) {
    if (e.remote || e.role === "ai") continue;
    departmentCounts[e.department] = (departmentCounts[e.department] ?? 0) + 1;
  }
  const perks = game.company.perks.map((p) => {
    const def = perkDefs.find((d) => d.id === p.id);
    const object = def?.upgrades[Math.min(p.level, (def.upgrades.length || 1) - 1)]?.object ?? p.id;
    return { id: p.id, level: p.level, object };
  });
  const inference = game.products.reduce((s, p) => s + p.weeklyInference, 0);
  const capacity = Math.max(1, game.compute.rentedGpus * 800 + game.compute.ownedCluster * 4000 + game.compute.apiCredits / 10);
  const automation =
    Object.values(game.company.automation).reduce((s, n) => s + n, 0) / Math.max(1, Object.keys(game.company.automation).length);
  return {
    officeLevel: game.company.officeLevel,
    officeId: office.id,
    officeName: office.name,
    companyName: game.company.name,
    brand: game.company.brand,
    agents,
    hiddenCount,
    departmentCounts,
    perks,
    computeLoad: Math.min(1, inference / capacity),
    hype: game.company.hype,
    cash: game.company.cash,
    runwayPressure: runwayMonths(game) < 3 && monthlyBurn(game) > 0,
    automation,
    healthy: game.company.cash > 20_000 && game.company.trust > 40,
  };
}
