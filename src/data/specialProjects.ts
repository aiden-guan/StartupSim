export interface ProjectDef {
  id: string;
  name: string;
  cost: number;
  description: string;
  required: { research: number; engineering: number; product: number };
  requiresTechs: string[];
  requiresRecipes?: string[];
  effects: { type: string; value: number | string | Record<string, unknown> }[];
}

export const specialProjects: ProjectDef[] = [
  { id: "foundation-model", name: "Train Foundation Model", cost: 2_500_000, description: "Train a frontier model for internal use.", required: { research: 400, engineering: 350, product: 120 }, requiresTechs: ["synthetic-data", "reasoning"], effects: [{ type: "unlockModel", value: "house-frontier" }, { type: "world", value: { meter: "aiCapability", amount: 8 } }] },
  { id: "gpu-cluster", name: "Private GPU Cluster", cost: 1_800_000, description: "Racks that belong to you, humming at 3am.", required: { research: 80, engineering: 400, product: 40 }, requiresTechs: ["efficient-inference"], effects: [{ type: "ownedCluster", value: 8 }] },
  { id: "research-lab", name: "Open Research Lab", cost: 900_000, description: "A building for people who would rather write papers.", required: { research: 300, engineering: 120, product: 80 }, requiresTechs: ["eval-science"], effects: [{ type: "researchSpeed", value: 0.15 }, { type: "prestige", value: 8 }] },
  { id: "data-center", name: "Build Data Center", cost: 12_000_000, description: "Concrete, cooling, and a power bill with a zip code.", required: { research: 100, engineering: 600, product: 80 }, requiresTechs: ["energy-systems"], effects: [{ type: "dataCenters", value: 1 }, { type: "world", value: { meter: "energyDemand", amount: 6 } }] },
  { id: "custom-chip", name: "Design Custom AI Chip", cost: 20_000_000, description: "Silicon with your logo in the metal.", required: { research: 280, engineering: 700, product: 60 }, requiresTechs: ["chip-design"], effects: [{ type: "customChips", value: 1 }, { type: "computeCost", value: -0.2 }] },
  { id: "robot-line", name: "Robotics Division", cost: 8_000_000, description: "A floor where software meets torque.", required: { research: 250, engineering: 500, product: 200 }, requiresTechs: ["robotics"], effects: [{ type: "unlockVertical", value: "robotics" }] },
  { id: "autonomous-lab", name: "Autonomous Research Lab", cost: 15_000_000, description: "Experiments that do not wait for humans.", required: { research: 700, engineering: 400, product: 150 }, requiresTechs: ["autonomous-research"], effects: [{ type: "special", value: "autoResearch" }, { type: "world", value: { meter: "scientificProgress", amount: 12 } }] },
  { id: "dev-platform", name: "Developer Platform", cost: 1_200_000, description: "An ecosystem that other people will build on, maybe.", required: { research: 80, engineering: 250, product: 300 }, requiresTechs: ["tool-use"], effects: [{ type: "productBonus", value: { attribute: "distribution", amount: 1 } }] },
  { id: "model-marketplace", name: "Model Marketplace", cost: 2_000_000, description: "A bazaar for weights.", required: { research: 150, engineering: 200, product: 250 }, requiresTechs: ["distillation"], effects: [{ type: "cash", value: 500_000 }] },
  { id: "general-robot", name: "General-Purpose Robot", cost: 25_000_000, description: "A body that can, in theory, do a job.", required: { research: 500, engineering: 700, product: 300 }, requiresTechs: ["robotics", "world-models"], effects: [{ type: "world", value: { meter: "automation", amount: 10 } }] },
  { id: "automate-ceo", name: "Automate CEO", cost: 50_000_000, description: "The last org-chart change.", required: { research: 800, engineering: 400, product: 200 }, requiresTechs: ["autonomous-corp"], effects: [{ type: "special", value: "automateCeo" }] },
];
