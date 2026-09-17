export interface LobbyDef {
  id: string;
  name: string;
  cost: number;
  requiredProgress: number;
  description: string;
  effects: { type: string; value: number | Record<string, unknown> }[];
}

export const lobbies: LobbyDef[] = [
  { id: "rd-credit", name: "AI R&D Tax Credit", cost: 400_000, requiredProgress: 220, description: "Make research cheaper, as a matter of public interest.", effects: [{ type: "researchCost", value: -0.15 }] },
  { id: "dc-incentives", name: "Data Center Incentives", cost: 600_000, requiredProgress: 240, description: "A state would like your power bill.", effects: [{ type: "energyCost", value: -0.12 }] },
  { id: "procurement", name: "Government Procurement", cost: 800_000, requiredProgress: 260, description: "Become a vendor of record.", effects: [{ type: "govAccess", value: 1 }] },
  { id: "immigration", name: "Talent Policy", cost: 350_000, requiredProgress: 200, description: "Visas as a recruiting channel.", effects: [{ type: "wageMultiplier", value: -0.06 }] },
  { id: "liability", name: "Liability Shield", cost: 700_000, requiredProgress: 250, description: "When the model is wrong, the statute is gentle.", effects: [{ type: "backlash", value: -8 }] },
  { id: "opensource-rules", name: "Open-Source Rules", cost: 300_000, requiredProgress: 180, description: "Weights as speech, or as a weapon. Pick a slide.", effects: [{ type: "trust", value: 5 }] },
  { id: "safety-standards", name: "Safety Standards", cost: 450_000, requiredProgress: 210, description: "Write the test. Grade the industry.", effects: [{ type: "trust", value: 8 }, { type: "regulation", value: 4 }] },
  { id: "energy-permits", name: "Energy Permitting", cost: 900_000, requiredProgress: 280, description: "The substation will arrive before the protesters.", effects: [{ type: "energyCost", value: -0.18 }] },
];
