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
  { id: "network", name: "Personal Network", description: "Ask friends, classmates, and former colleagues.", cost: 4_000, targetScore: 10, robots: false, prestige: 0, qualityLabel: "Uneven talent, wide variance", eliteLabel: "Rare hidden gem", experience: "Friends, classmates, and former colleagues." },
  { id: "board", name: "Job Board", description: "Post a public listing.", cost: 12_000, targetScore: 16, robots: false, prestige: 1, qualityLabel: "Broad pool, mixed fit", eliteLabel: "Uncommon standout", experience: "Early-career to mid-level applicants." },
  { id: "university", name: "University", description: "Recruit from a university campus.", cost: 28_000, targetScore: 20, robots: false, prestige: 2, qualityLabel: "Strong fundamentals", eliteLabel: "Occasional research standout", experience: "New graduates with supporting coursework." },
  { id: "recruiter", name: "Recruiter", description: "Hire an external recruiter.", cost: 60_000, targetScore: 26, robots: false, prestige: 2, qualityLabel: "Balanced, hireable profiles", eliteLabel: "Solid specialists", experience: "People who have shipped something before." },
  { id: "exec", name: "Executive Search", description: "Search for senior operators.", cost: 180_000, targetScore: 34, robots: false, prestige: 4, qualityLabel: "Premium pool, multiple strong stats", eliteLabel: "Meaningful elite chance", experience: "Senior operators with supporting skills, not one-stat specialists." },
  { id: "conference", name: "Research Conference", description: "Recruit at a research conference.", cost: 90_000, targetScore: 32, robots: false, prestige: 3, qualityLabel: "Research-heavy, well-supported", eliteLabel: "High specialist chance", experience: "Published researchers and applied scientists." },
  { id: "poach", name: "Poach Competitor", description: "Recruit from a competing company.", cost: 140_000, targetScore: 30, robots: false, prestige: 2, qualityLabel: "Battle-tested operators", eliteLabel: "Strong specialists", experience: "People who already know the category." },
  { id: "acqui", name: "Acqui-hire", description: "Acquire a small team.", cost: 400_000, targetScore: 36, robots: false, prestige: 3, qualityLabel: "Highest average quality", eliteLabel: "Best elite odds, still not guaranteed", experience: "A small team with overlapping strengths." },
  { id: "robots", name: "Robot Vendor", description: "Buy a general-purpose service robot.", cost: 90_000, targetScore: 14, robots: true, prestige: 1, qualityLabel: "Reliable, narrow", eliteLabel: "No hidden gems", experience: "Machines with narrow, reliable skills." },
];
