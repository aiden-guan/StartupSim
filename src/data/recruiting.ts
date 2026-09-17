export interface ChannelDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  targetScore: number;
  robots: boolean;
  prestige: number;
}

export const recruitingChannels: ChannelDef[] = [
  { id: "network", name: "Personal Network", description: "Text the group chat. Someone knows someone.", cost: 4_000, targetScore: 10, robots: false, prestige: 0 },
  { id: "board", name: "Job Board", description: "A listing among a thousand listings.", cost: 12_000, targetScore: 16, robots: false, prestige: 1 },
  { id: "university", name: "University", description: "Poster, pizza, a talk about scaling.", cost: 28_000, targetScore: 20, robots: false, prestige: 2 },
  { id: "recruiter", name: "Recruiter", description: "Someone else has the awkward conversations.", cost: 60_000, targetScore: 26, robots: false, prestige: 2 },
  { id: "exec", name: "Executive Search", description: "For people who already have a Wikipedia page.", cost: 180_000, targetScore: 34, robots: false, prestige: 4 },
  { id: "conference", name: "Research Conference", description: "Poster session, then a quiet offer.", cost: 90_000, targetScore: 32, robots: false, prestige: 3 },
  { id: "poach", name: "Poach Competitor", description: "The oldest talent strategy.", cost: 140_000, targetScore: 30, robots: false, prestige: 2 },
  { id: "acqui", name: "Acqui-hire", description: "Buy the team. Keep two of them.", cost: 400_000, targetScore: 36, robots: false, prestige: 3 },
  { id: "robots", name: "Robot Vendor", description: "A floor worker that does not ask about equity.", cost: 90_000, targetScore: 14, robots: true, prestige: 1 },
];
