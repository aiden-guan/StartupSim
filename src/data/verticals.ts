export interface VerticalDef {
  id: string;
  name: string;
  cost: number;
  description: string;
  regulation: number;
  primitives: string[];
}

export const verticals: VerticalDef[] = [
  { id: "consumer", name: "Consumer", cost: 0, description: "People with phones and feelings.", regulation: 2, primitives: ["chat", "image", "social"] },
  { id: "enterprise", name: "Enterprise", cost: 80_000, description: "Procurement as a boss fight.", regulation: 3, primitives: ["workflow", "analytics"] },
  { id: "developer", name: "Developer Tools", cost: 40_000, description: "Sell picks. Sell shovels. Sell the mountain.", regulation: 1, primitives: ["code", "api"] },
  { id: "media", name: "Media", cost: 60_000, description: "Attention, packaged.", regulation: 2, primitives: ["video", "entertainment"] },
  { id: "education", name: "Education", cost: 50_000, description: "Learning outcomes, or at least logins.", regulation: 3, primitives: ["education"] },
  { id: "health", name: "Healthcare", cost: 180_000, description: "HIPAA is a personality.", regulation: 5, primitives: ["health"] },
  { id: "finance", name: "Finance", cost: 160_000, description: "Money that wants a model.", regulation: 5, primitives: ["finance"] },
  { id: "legal", name: "Legal", cost: 120_000, description: "Billable hours, disrupted, allegedly.", regulation: 4, primitives: ["legal"] },
  { id: "defense", name: "Defense", cost: 250_000, description: "A contract, a clearance, a headline.", regulation: 5, primitives: ["defense"] },
  { id: "robotics", name: "Robotics", cost: 300_000, description: "The physical world, finally on the roadmap.", regulation: 3, primitives: ["robotics"] },
  { id: "biotech", name: "Biotechnology", cost: 320_000, description: "Wet work with dry models.", regulation: 5, primitives: ["biology"] },
  { id: "hardware", name: "Hardware", cost: 400_000, description: "Atoms are slower than tokens.", regulation: 3, primitives: ["hardware"] },
  { id: "science", name: "Science", cost: 200_000, description: "Discovery as a business model.", regulation: 2, primitives: ["science"] },
];
