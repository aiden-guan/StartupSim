export interface CompetitorDef {
  id: string;
  name: string;
  founder: string;
  description: string;
  archetype: string;
  personality: "aggressive" | "expansionist" | "defensive" | "opportunistic";
  skills: { product: number; growth: number; engineering: number; research: number };
  focus: string[];
  difficulty: number;
  startingShare: number;
}

export const competitors: CompetitorDef[] = [
  { id: "openbrain", name: "OpenBrain", founder: "Sam Bankless", description: "A frontier lab that treats capability like a moral duty.", archetype: "frontier", personality: "aggressive", skills: { product: 1.1, growth: 1.2, engineering: 1.4, research: 1.8 }, focus: ["chat", "reasoning", "api"], difficulty: 3, startingShare: 18 },
  { id: "claudius", name: "Claudius Labs", founder: "Daria Shore", description: "Constitutional, expensive, and somehow everywhere.", archetype: "frontier", personality: "defensive", skills: { product: 1.3, growth: 1.0, engineering: 1.3, research: 1.6 }, focus: ["chat", "writing", "safety"], difficulty: 2, startingShare: 12 },
  { id: "macrosoft", name: "Macrosoft", founder: "Satya N.", description: "Distribution wearing a lab coat.", archetype: "bigtech", personality: "expansionist", skills: { product: 1.1, growth: 1.7, engineering: 1.4, research: 1.1 }, focus: ["api", "workflow", "enterprise"], difficulty: 3, startingShare: 16 },
  { id: "metamind", name: "MetaMind Open", founder: "Mark C.", description: "They will open-source the thing you were going to charge for.", archetype: "opensource", personality: "opportunistic", skills: { product: 0.9, growth: 1.3, engineering: 1.4, research: 1.3 }, focus: ["opensource", "social", "image"], difficulty: 2, startingShare: 10 },
  { id: "xeno", name: "XenoAI", founder: "Elan", description: "Posts, ships, posts about shipping.", archetype: "agent", personality: "aggressive", skills: { product: 1.0, growth: 1.6, engineering: 1.2, research: 1.2 }, focus: ["chat", "agent", "social"], difficulty: 2, startingShare: 8 },
  { id: "coral", name: "Coralzon", founder: "Jeff Bezos-adjacent", description: "Compute, logistics, and a smile that is a warehouse.", archetype: "bigtech", personality: "expansionist", skills: { product: 1.0, growth: 1.4, engineering: 1.6, research: 1.0 }, focus: ["commerce", "cloud", "api"], difficulty: 2, startingShare: 9 },
  { id: "paladin", name: "Paladin", founder: "A. Karpish", description: "A defense contractor that learned to say platform.", archetype: "defense", personality: "defensive", skills: { product: 0.8, growth: 0.9, engineering: 1.7, research: 1.4 }, focus: ["defense", "analytics", "vision"], difficulty: 2, startingShare: 5 },
  { id: "nestor", name: "Nestor Robotics", founder: "Helen Kline", description: "They want the warehouse, then the street, then the rest.", archetype: "robotics", personality: "expansionist", skills: { product: 1.1, growth: 0.9, engineering: 1.5, research: 1.3 }, focus: ["robotics", "vision", "agent"], difficulty: 1, startingShare: 3 },
  { id: "lumen", name: "Lumen Health", founder: "Priya Shah", description: "Clinical AI with a compliance officer in every meeting.", archetype: "vertical", personality: "defensive", skills: { product: 1.3, growth: 1.0, engineering: 1.1, research: 1.2 }, focus: ["health", "retrieval"], difficulty: 1, startingShare: 2 },
  { id: "glyph", name: "Glyph", founder: "Jonah Reed", description: "A thin wrapper with a thick waitlist.", archetype: "wrapper", personality: "opportunistic", skills: { product: 1.2, growth: 1.5, engineering: 0.8, research: 0.7 }, focus: ["chat", "writing", "image"], difficulty: 0, startingShare: 4 },
  { id: "helix", name: "Helix Bio", founder: "Mina Park", description: "Molecules, models, and a very quiet lab.", archetype: "biotech", personality: "defensive", skills: { product: 1.0, growth: 0.8, engineering: 1.2, research: 1.7 }, focus: ["biology", "science"], difficulty: 1, startingShare: 2 },
  { id: "foundry", name: "Foundry Cloud", founder: "Adele Ng", description: "They will rent you the GPUs and then the power.", archetype: "compute", personality: "expansionist", skills: { product: 0.9, growth: 1.2, engineering: 1.6, research: 1.0 }, focus: ["api", "hardware"], difficulty: 2, startingShare: 6 },
];
