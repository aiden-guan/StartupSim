export interface LobbyDef {
  id: string;
  name: string;
  cost: number;
  requiredProgress: number;
  description: string;
  effects: { type: string; value: number | Record<string, unknown> }[];
}

export const lobbies: LobbyDef[] = [
  { id: "rd-credit", name: "AI R&D Tax Credit", cost: 12_000_000, requiredProgress: 220, description: "Reduce research costs.", effects: [{ type: "researchCost", value: -0.15 }] },
  { id: "dc-incentives", name: "Data Center Incentives", cost: 35_000_000, requiredProgress: 240, description: "Reduce energy costs for data centers.", effects: [{ type: "energyCost", value: -0.12 }] },
  { id: "procurement", name: "Government Procurement", cost: 50_000_000, requiredProgress: 260, description: "Become a vendor of record.", effects: [{ type: "govAccess", value: 1 }] },
  { id: "immigration", name: "Talent Policy", cost: 10_000_000, requiredProgress: 200, description: "Expand the recruiting pool through visa policy.", effects: [{ type: "wageMultiplier", value: -0.06 }] },
  { id: "liability", name: "Liability Shield", cost: 25_000_000, requiredProgress: 250, description: "Reduce backlash when products fail.", effects: [{ type: "backlash", value: -8 }] },
  { id: "opensource-rules", name: "Open-Source Rules", cost: 8_000_000, requiredProgress: 180, description: "Set policy for open model weights.", effects: [{ type: "trust", value: 5 }] },
  { id: "safety-standards", name: "Safety Standards", cost: 18_000_000, requiredProgress: 210, description: "Define and enforce industry safety tests.", effects: [{ type: "trust", value: 8 }, { type: "regulation", value: 4 }] },
  { id: "energy-permits", name: "Energy Permitting", cost: 60_000_000, requiredProgress: 280, description: "Accelerate approval for new power capacity.", effects: [{ type: "energyCost", value: -0.18 }] },
];
