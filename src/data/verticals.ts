export interface VerticalDef {
  id: string;
  name: string;
  cost: number;
  description: string;
  regulation: number;
  primitives: string[];
}

export const verticals: VerticalDef[] = [
  { id: "consumer", name: "Consumer", cost: 0, description: "Broad demand with low regulation.", regulation: 2, primitives: ["chat", "image", "social"] },
  { id: "enterprise", name: "Enterprise", cost: 80_000, description: "Long sales cycles and higher willingness to pay.", regulation: 3, primitives: ["workflow", "analytics"] },
  { id: "developer", name: "Developer Tools", cost: 40_000, description: "Technical buyers; distribution follows developer adoption.", regulation: 1, primitives: ["code", "api"] },
  { id: "media", name: "Media", cost: 60_000, description: "Compete for attention.", regulation: 2, primitives: ["video", "entertainment"] },
  { id: "education", name: "Education", cost: 50_000, description: "Schools and learners; outcomes matter.", regulation: 3, primitives: ["education"] },
  { id: "health", name: "Healthcare", cost: 180_000, description: "Clinical workflows with strict regulation.", regulation: 5, primitives: ["health"] },
  { id: "finance", name: "Finance", cost: 160_000, description: "High-value workflows with strict regulation.", regulation: 5, primitives: ["finance"] },
  { id: "legal", name: "Legal", cost: 120_000, description: "Contracts and counsel for regulated buyers.", regulation: 4, primitives: ["legal"] },
  { id: "defense", name: "Defense", cost: 250_000, description: "Long procurement cycles and strict clearance.", regulation: 5, primitives: ["defense"] },
  { id: "robotics", name: "Robotics", cost: 300_000, description: "Physical systems with hardware and deployment risk.", regulation: 3, primitives: ["robotics"] },
  { id: "biotech", name: "Biotechnology", cost: 320_000, description: "Research-heavy products with strict regulation.", regulation: 5, primitives: ["biology"] },
  { id: "hardware", name: "Hardware", cost: 400_000, description: "Hardware supply chains and slower iteration.", regulation: 3, primitives: ["hardware"] },
  { id: "science", name: "Science", cost: 200_000, description: "Research products with long paths to revenue.", regulation: 2, primitives: ["science"] },
];
