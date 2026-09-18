export interface ChannelDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  targetScore: number;
  robots: boolean;
  prestige: number;
  qualityLabel: string;
  eliteLabel: string;
  experience: string;
}

export const recruitingChannels: ChannelDef[] = [
  { id: "network", name: "Personal Network", description: "Text the group chat. Someone knows someone.", cost: 4_000, targetScore: 10, robots: false, prestige: 0, qualityLabel: "Uneven talent, wide variance", eliteLabel: "Rare hidden gem", experience: "Friends, classmates, and whoever answers." },
  { id: "board", name: "Job Board", description: "A listing among a thousand listings.", cost: 12_000, targetScore: 16, robots: false, prestige: 1, qualityLabel: "Broad pool, mixed fit", eliteLabel: "Uncommon standout", experience: "Typical early-career to mid-level applicants." },
  { id: "university", name: "University", description: "Poster, pizza, a talk about scaling.", cost: 28_000, targetScore: 20, robots: false, prestige: 2, qualityLabel: "Strong fundamentals", eliteLabel: "Occasional research standout", experience: "New graduates with supporting coursework." },
  { id: "recruiter", name: "Recruiter", description: "Someone else has the awkward conversations.", cost: 60_000, targetScore: 26, robots: false, prestige: 2, qualityLabel: "Balanced, hireable profiles", eliteLabel: "Solid specialists", experience: "People who have shipped something before." },
  { id: "exec", name: "Executive Search", description: "For people who already have a Wikipedia page.", cost: 180_000, targetScore: 34, robots: false, prestige: 4, qualityLabel: "Premium pool, multiple strong stats", eliteLabel: "Meaningful elite chance", experience: "Senior operators with supporting skills, not one-stat specialists." },
  { id: "conference", name: "Research Conference", description: "Poster session, then a quiet offer.", cost: 90_000, targetScore: 32, robots: false, prestige: 3, qualityLabel: "Research-heavy, well-supported", eliteLabel: "High specialist chance", experience: "Published researchers and applied scientists." },
  { id: "poach", name: "Poach Competitor", description: "The oldest talent strategy.", cost: 140_000, targetScore: 30, robots: false, prestige: 2, qualityLabel: "Battle-tested operators", eliteLabel: "Strong specialists", experience: "People who already know the category." },
  { id: "acqui", name: "Acqui-hire", description: "Buy the team. Keep two of them.", cost: 400_000, targetScore: 36, robots: false, prestige: 3, qualityLabel: "Highest average quality", eliteLabel: "Best elite odds, still not guaranteed", experience: "A small team with overlapping strengths." },
  { id: "robots", name: "Robot Vendor", description: "A floor worker that does not ask about equity.", cost: 90_000, targetScore: 14, robots: true, prestige: 1, qualityLabel: "Reliable, narrow", eliteLabel: "No hidden gems", experience: "Machines. They do not interview back." },
];
