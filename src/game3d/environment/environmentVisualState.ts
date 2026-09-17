import { offices } from '../../data/offices';
import { verticals } from '../../data/verticals';
import { monthlyBurn, runwayMonths } from '../../simulation/derived';
import type { GameState } from '../../simulation/types';

export interface EnvironmentVisualState {
  officeLevel: number;
  employeeCount: number;
  officeCapacity: number;
  teamDensity: number;
  robotWorkers: number;
  burnedOutWorkers: number;
  computeLoad: number;
  computeTier: 0 | 1 | 2 | 3 | 4;
  rentedGpus: number;
  ownedCluster: number;
  dataCenters: number;
  customChips: number;
  hasGpuCluster: boolean;
  hasDataCenter: boolean;
  hasCustomChip: boolean;
  hasFoundationModel: boolean;
  hasResearchLab: boolean;
  hasAutonomousLab: boolean;
  roboticsTier: 0 | 1 | 2 | 3;
  hasAgents: boolean;
  hasComputerUse: boolean;
  automationAverage: number;
  automationTier: 0 | 1 | 2 | 3;
  ceoAutomated: boolean;
  prominentVerticals: string[];
  secondaryVerticals: string[];
  hypeTier: 0 | 1 | 2;
  runwayPressure: boolean;
  perks: { id: string; level: number }[];
}

/** Deterministic, transient presentation data. Nothing here is written to a save. */
export function deriveEnvironmentVisualState(game: GameState): EnvironmentVisualState {
  const projects = new Set(game.company.specialProjects);
  const techs = new Set(game.company.technologies);
  const employeeCount = game.employees.filter(e => !e.remote && e.role !== 'ai').length;
  const robotWorkers = game.employees.filter(e => !e.remote && e.role === 'robot').length;
  const burnedOutWorkers = game.employees.filter(e => !e.remote && e.burnoutDays > 0).length;
  const officeCapacity = offices[game.company.officeLevel]?.capacity ?? offices[0]!.capacity;
  const inference = game.products.filter(p => ['active', 'mature', 'declining'].includes(p.status)).reduce((sum, p) => sum + p.weeklyInference, 0);
  const capacity = Math.max(1, game.compute.rentedGpus * 800 + game.compute.ownedCluster * 120 + game.compute.dataCenters * 4000 + game.compute.apiCredits / 10);
  const computeLoad = Math.min(1, inference / capacity);
  const hasGpuCluster = projects.has('gpu-cluster');
  const hasDataCenter = projects.has('data-center') || game.compute.dataCenters > 0;
  const hasCustomChip = projects.has('custom-chip') || game.compute.customChips > 0;
  const hasRobotics = techs.has('robotics') || projects.has('robot-line') || projects.has('general-robot');
  const roboticsTier = (projects.has('general-robot') ? 3 : projects.has('robot-line') ? 2 : hasRobotics ? 1 : 0) as EnvironmentVisualState['roboticsTier'];
  const automationValues = Object.values(game.company.automation);
  const automationAverage = automationValues.reduce((sum, n) => sum + n, 0) / Math.max(1, automationValues.length);
  const ceoAutomated = game.company.ceoAutomated;
  const automationTier = (ceoAutomated || techs.has('autonomous-corp') ? 3 : automationAverage > 55 ? 2 : automationAverage >= 35 ? 1 : 0) as EnvironmentVisualState['automationTier'];
  const owned = new Set(game.company.verticals);
  const ranked = verticals.filter(v => owned.has(v.id)).map((v, index) => ({
    id: v.id,
    index,
    score: game.products.reduce((sum, p) => sum + (p.vertical === v.id ? (p.status === 'active' || p.status === 'mature' ? 3 : 1) : 0), 0) + (game.company.expertise[v.id] ?? 0),
  })).sort((a, b) => b.score - a.score || a.index - b.index);
  const prominentVerticals = ranked.slice(0, 2).map(v => v.id);
  const secondaryVerticals = ranked.slice(2).map(v => v.id);
  const computeTier = (hasDataCenter ? 4 : hasGpuCluster || game.compute.ownedCluster >= 8 ? 3 : game.compute.ownedCluster > 0 ? 2 : game.compute.rentedGpus > 0 ? 1 : 0) as EnvironmentVisualState['computeTier'];
  return {
    officeLevel: game.company.officeLevel,
    employeeCount, officeCapacity, teamDensity: Math.min(1, employeeCount / Math.max(1, officeCapacity)),
    robotWorkers, burnedOutWorkers, computeLoad, computeTier,
    rentedGpus: game.compute.rentedGpus, ownedCluster: game.compute.ownedCluster,
    dataCenters: game.compute.dataCenters, customChips: game.compute.customChips,
    hasGpuCluster, hasDataCenter, hasCustomChip,
    hasFoundationModel: projects.has('foundation-model'),
    hasResearchLab: projects.has('research-lab'),
    hasAutonomousLab: projects.has('autonomous-lab'),
    roboticsTier, hasAgents: techs.has('agents'), hasComputerUse: techs.has('computer-use'),
    automationAverage, automationTier, ceoAutomated,
    prominentVerticals, secondaryVerticals,
    hypeTier: game.company.hype >= 80 ? 2 : game.company.hype >= 55 ? 1 : 0,
    runwayPressure: monthlyBurn(game) > 0 && runwayMonths(game) < 3,
    perks: game.company.perks.map(p => ({ id: p.id, level: p.level })),
  };
}
