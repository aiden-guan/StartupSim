export type ScoreTier = "SSS" | "SS" | "S" | "A" | "B" | "C";

export type LeaderboardFilter =
  | "all"
  | "unicorn"
  | "ipo"
  | "monopoly"
  | "quiet-profit"
  | "bootstrapped";

export interface ScoreBreakdown {
  totalScore: number;
  tier: ScoreTier;
  valuationPoints: number;
  cashPoints: number;
  arrPoints: number;
  endingBonus: number;
  survivalBonus: number;
  achievementPoints: number;
  reputationPoints: number;
  scandalPenalty: number;
  speedMultiplier: number;
}

export interface LeaderboardEntry {
  id: string;
  rank?: number;
  handle: string;
  companyName: string;
  founderName: string;
  score: number;
  tier: ScoreTier;
  endingId: string;
  endingTitle: string;
  valuation: number;
  cash: number;
  arr: number;
  year: number;
  daysElapsed: number;
  productsCount: number;
  employeesCount: number;
  achievements: string[];
  quote: string;
  verified: boolean;
  createdAt: number;
}

export interface LeaderboardSubmissionStats {
  productsLaunched: number;
  employeesHired: number;
  acquisitions: number;
  scandals: number;
  computeConsumed: number;
  peakValuation: number;
  peakEmployees: number;
}

export interface LeaderboardSubmissionCompany {
  cash: number;
  valuation: number;
  hype: number;
  trust: number;
  raisedTotal: number;
}

export interface LeaderboardSubmissionClock {
  year: number;
  month: number;
  day: number;
  daysElapsed: number;
}

export interface LeaderboardSubmission {
  runId: string;
  seed: number;
  handle: string;
  companyName: string;
  founderName: string;
  quote?: string;
  endingId: string;
  endingNote?: string;
  stats: LeaderboardSubmissionStats;
  company: LeaderboardSubmissionCompany;
  clock: LeaderboardSubmissionClock;
  arr: number;
  achievements: string[];
  seal: string;
}

export interface LeaderboardQueryResponse {
  entries: LeaderboardEntry[];
  total: number;
  userRank?: number;
  source?: "global" | "local";
}

export interface LeaderboardSubmitResponse {
  success: boolean;
  entry?: LeaderboardEntry;
  rank?: number;
  error?: string;
}
