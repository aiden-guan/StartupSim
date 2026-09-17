export interface PromoDef {
  id: string;
  name: string;
  cost: number;
  power: number;
  requiredProgress: number;
  description: string;
}

export const promos: PromoDef[] = [
  { id: "launch", name: "Product Launch", cost: 8_000, power: 2, requiredProgress: 70, description: "A blog post, a demo, a thread." },
  { id: "viral-demo", name: "Viral Demo", cost: 15_000, power: 3, requiredProgress: 90, description: "A one-minute clip that overclaims politely." },
  { id: "benchmark", name: "Benchmark Announcement", cost: 20_000, power: 3, requiredProgress: 100, description: "SOTA, depending on the slide." },
  { id: "podcast", name: "Founder Podcast", cost: 6_000, power: 2, requiredProgress: 60, description: "You say 'agentic' with a straight face." },
  { id: "conference", name: "Developer Conference", cost: 80_000, power: 5, requiredProgress: 160, description: "Badges, hoodies, a keynote with fog." },
  { id: "influencer", name: "Influencer Campaign", cost: 40_000, power: 4, requiredProgress: 120, description: "People who review tools for a living." },
  { id: "keynote", name: "Massive Keynote", cost: 250_000, power: 7, requiredProgress: 220, description: "A stage. A logo. A claim about the future." },
  { id: "agi-soon", name: "AGI Soon", cost: 12_000, power: 5, requiredProgress: 80, description: "Investors remain extremely excited about the word." },
];
