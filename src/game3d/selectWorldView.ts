import { BALANCE } from "../config/balance";
import { offices } from "../data/offices";
import { perks as perkDefs } from "../data/perks";
import type { CharacterLook, CompanyBrand, DepartmentId, GameState, TaskType } from "../simulation/types";
import { deriveEnvironmentVisualState, type EnvironmentVisualState } from './environment/environmentVisualState';

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
  environment: EnvironmentVisualState;
}

export function selectWorldView(game: GameState): WorldView {
  const environment = deriveEnvironmentVisualState(game);
  const office = offices[game.company.officeLevel] ?? offices[0]!;
  const renderable = game.employees.filter((e) => !e.remote && e.role !== "ai");
  const cap = Math.round(BALANCE.RENDER_AGENT_CAP * (game.settings.npcDensity || 1));
  const selected = renderable.slice(0, cap);
  // Late robot hires should remain visible even after the ordinary NPC cap is full.
  for(const robot of renderable.filter(e=>e.role==='robot').slice(0,Math.max(1,Math.floor(cap/6)))) {
    if(selected.some(e=>e.id===robot.id))continue;
    let replace=-1;
    for(let i=selected.length-1;i>=0;i--)if(selected[i]?.role==='employee'){replace=i;break;}
    if(replace>=0)selected[replace]=robot;
  }
  const agents: AgentView[] = selected.map((e) => ({
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
    computeLoad: environment.computeLoad,
    hype: game.company.hype,
    cash: game.company.cash,
    runwayPressure: environment.runwayPressure,
    automation: environment.automationAverage,
    healthy: game.company.cash > 20_000 && game.company.trust > 40,
    environment,
  };
}
