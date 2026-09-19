import { lobbies, type LobbyDef } from "../../data/lobbies";
import { locations, type LocationDef } from "../../data/locations";
import { modelById } from "../../data/models";
import { primitiveById } from "../../data/primitives";
import { recipes } from "../../data/recipes";
import { specialProjects, type ProjectDef } from "../../data/specialProjects";
import { technologies, type TechDef } from "../../data/technologies";
import { verticals, type VerticalDef } from "../../data/verticals";
import { BALANCE } from "../../config/balance";
import { money } from "../format";

/** A short, already-presentable line for the Expansion cards. */
export interface InsightLine {
  label: string;
  value: string;
}

export interface VerticalUnlockSummary {
  verticalId: string;
  name: string;
  profile: string;
  primitives: string[];
  technologies: string[];
  projects: string[];
  productExamples: string[];
}

function findById<T extends { id: string }>(items: readonly T[], itemOrId: T | string): T | undefined {
  return typeof itemOrId === "string" ? items.find((item) => item.id === itemOrId) : itemOrId;
}

function titleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function signed(value: number, digits = 0): string {
  const rounded = digits ? value.toFixed(digits) : Math.round(value).toString();
  return value >= 0 ? `+${rounded}` : rounded;
}

function percent(value: number): string {
  return `${signed(value * 100)}%`;
}

function skillName(skill: string): string {
  return skill === "productivity" ? "Productivity" : titleCase(skill);
}

function regulationLabel(value: number): string {
  if (value <= 1) return "low";
  if (value <= 3) return "medium";
  return "high";
}

function primitiveName(id: string): string {
  return primitiveById[id]?.name ?? titleCase(id);
}

function technologyName(id: string): string {
  return technologies.find((technology) => technology.id === id)?.name ?? titleCase(id);
}

function verticalName(id: string): string {
  return verticals.find((vertical) => vertical.id === id)?.name ?? titleCase(id);
}

function meterName(id: string): string {
  const names: Record<string, string> = {
    aiCapability: "AI capability",
    aiAdoption: "AI adoption",
    automation: "Automation",
    publicTrust: "Public trust",
    regulation: "Regulation",
    computeDemand: "Compute demand",
    energyDemand: "Energy demand",
    scientificProgress: "Scientific progress",
    economicDisruption: "Economic disruption",
    systemicRisk: "Systemic risk",
    openSourcePressure: "Open-source pressure",
  };
  return names[id] ?? titleCase(id);
}

/** Technologies whose canonical definition requires this vertical. */
export function technologiesForVertical(vertical: VerticalDef | string): TechDef[] {
  const definition = findById(verticals, vertical);
  const id = definition?.id ?? (typeof vertical === "string" ? vertical : vertical.id);
  return technologies.filter((technology) => technology.requiredVertical === id);
}

function projectsForVertical(vertical: VerticalDef): ProjectDef[] {
  const relatedTechnologyIds = new Set(technologiesForVertical(vertical).map((technology) => technology.id));
  return specialProjects.filter((project) =>
    project.requiresTechs.some((technologyId) => relatedTechnologyIds.has(technologyId)) ||
    project.effects.some((effect) => effect.type === "unlockVertical" && effect.value === vertical.id),
  );
}

/**
 * Build the vertical's short progression brief from the canonical primitive,
 * technology, project, and recipe catalogs.
 */
export function describeVerticalUnlocks(vertical: VerticalDef | string): VerticalUnlockSummary {
  const definition = findById(verticals, vertical) ?? (typeof vertical === "string" ? undefined : vertical);
  const id = definition?.id ?? (typeof vertical === "string" ? vertical : vertical.id);
  const name = definition?.name ?? titleCase(id);
  const relatedTechnologies = definition ? technologiesForVertical(definition) : [];
  const relatedProjects = definition ? projectsForVertical(definition) : [];
  const productExamples = recipes.filter((recipe) => recipe.vertical === id).slice(0, 3).map((recipe) => recipe.name);

  return {
    verticalId: id,
    name,
    profile: definition ? `${name} · ${regulationLabel(definition.regulation)} regulation` : name,
    primitives: (definition?.primitives ?? []).map(primitiveName),
    technologies: relatedTechnologies.map((technology) => technology.name),
    projects: relatedProjects.map((project) => project.name),
    productExamples,
  };
}

function describeEffect(effect: { type: string; value: unknown }): string | null {
  const value = effect.value;
  switch (effect.type) {
    case "cash":
      return `${Number(value) >= 0 ? "Adds" : "Costs"} ${money(Math.abs(Number(value)))} cash`;
    case "hype":
      return `Hype ${signed(Number(value))}`;
    case "trust":
      return `Trust ${signed(Number(value))}`;
    case "backlash":
      return `Backlash ${signed(Number(value))}`;
    case "morale":
      return `Team morale ${signed(Number(value))}`;
    case "prestige":
      return `Prestige ${signed(Number(value))}`;
    case "computeCost":
      return `Compute costs ${percent(Number(value))}`;
    case "regulation":
      return `Regulation ${signed(Number(value))}`;
    case "ownedCluster":
      return `Adds ${Number(value)} owned GPU capacity`;
    case "dataCenters":
      return `Adds ${Number(value)} data center${Number(value) === 1 ? "" : "s"}`;
    case "customChips":
      return `Adds ${Number(value)} custom chip${Number(value) === 1 ? "" : "s"}`;
    case "unlockModel": {
      const model = typeof value === "string" ? modelById[value] : undefined;
      return model ? `Unlocks ${model.name}` : null;
    }
    case "unlockVertical":
      return typeof value === "string" ? `Unlocks the ${verticalName(value)} vertical` : null;
    case "special":
      if (value === "autoResearch") return "Enables autonomous research";
      if (value === "automateCeo") return "Automates the CEO";
      return null;
    case "wageMultiplier":
      return `Wage rate ${percent(Number(value))}`;
    case "energyCost":
      return `Energy costs ${percent(Number(value))}`;
    case "reliability":
      return `Product reliability ${signed(Number(value) * 100)}%`;
    case "researchSpeed":
      return `Research speed ${percent(Number(value))}`;
    case "overheadRelief":
      return `Coordination overhead relief ${signed(Number(value))}%`;
    case "world": {
      if (!value || typeof value !== "object") return null;
      const world = value as { meter?: unknown; amount?: unknown };
      if (typeof world.meter !== "string" || typeof world.amount !== "number") return null;
      return `${meterName(world.meter)} ${signed(world.amount)}`;
    }
    default:
      return null;
  }
}

export function describeLocationBenefits(location: LocationDef | string): string[] {
  const definition = findById(locations, location);
  if (!definition) return [];

  const strongestSkills = Object.entries(definition.skills)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([skill, value]) => `${skillName(skill)} +${(value / 8).toFixed(2)} team output before company modifiers`);
  return [
    ...strongestSkills,
    `Revenue reach +${(BALANCE.LOCATION_MULTIPLIER * 100).toFixed(0)}% per owned office`,
    ...(definition.effects ?? []).map((effect) => describeEffect(effect)).filter((line): line is string => Boolean(line)),
  ];
}

/** Short collapsed label for a city; exact /8 contributions stay in the expanded card. */
export function describeLocationProfile(location: LocationDef | string): string[] {
  const definition = findById(locations, location);
  if (!definition) return [];
  return Object.entries(definition.skills)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([skill]) => `${skillName(skill)} hub`);
}

export function describeProjectRequirements(project: ProjectDef | string): string[] {
  const definition = findById(specialProjects, project);
  if (!definition) return [];

  const lines: string[] = [];
  if (definition.requiresTechs.length) lines.push(`Research: ${definition.requiresTechs.map(technologyName).join(" · ")}`);
  const workTarget = Math.round((definition.required.research + definition.required.engineering + definition.required.product) / 3);
  lines.push(`Work target: ${workTarget} progress · Research ${definition.required.research} · Engineering ${definition.required.engineering} · Product ${definition.required.product}`);
  if (definition.requiresRecipes?.length) {
    const names = definition.requiresRecipes.map((id) => recipes.find((recipe) => recipe.id === id)?.name ?? titleCase(id));
    lines.push(`Products: ${names.join(" · ")}`);
  }
  return lines;
}

export function describeProjectEffects(project: ProjectDef | string): string[] {
  const definition = findById(specialProjects, project);
  return definition ? definition.effects.map(describeEffect).filter((line): line is string => Boolean(line)) : [];
}

export function describeLobbyEffects(lobby: LobbyDef | string): string[] {
  const definition = findById(lobbies, lobby);
  return definition ? definition.effects.map(describeEffect).filter((line): line is string => Boolean(line)) : [];
}

/** Exposed for tests and future presentation surfaces that need one effect line. */
export function describeEffectForUi(effect: { type: string; value: unknown }): string | null {
  return describeEffect(effect);
}
