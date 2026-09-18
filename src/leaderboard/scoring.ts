import { ACHIEVEMENT_MAP } from "../simulation/achievements.js";
import { monthlyArr } from "../simulation/conditions.js";
import type { GameState } from "../simulation/types.js";
import type { ScoreBreakdown, ScoreTier } from "./types.js";

const ENDING_BONUSES: Record<string, number> = {
  monopoly: 250_000,
  ipo: 175_000,
  "ai-science": 130_000,
  unicorn: 120_000,
  robotics: 110_000,
  "quiet-profit": 100_000,
  "open-source": 90_000,
  "automated-company": 85_000,
  "research-lab": 75_000,
  acquisition: 65_000,
  commoditization: 40_000,
  regulated: 35_000,
  "safety-crisis": 20_000,
  "board-out": 20_000,
  "automated-ceo": 70_000,
  unknown: 80_000,
  bankruptcy: 0,
};

export function getDaysElapsed(game: GameState): number {
  const start = { year: 2022, month: 11, day: 1 };
  const current = game.clock.date;
  const tStart = Date.UTC(start.year, start.month - 1, start.day);
  const tCurrent = Date.UTC(current.year, current.month - 1, current.day);
  const diff = Math.max(1, Math.round((tCurrent - tStart) / (1000 * 60 * 60 * 24)));
  return diff;
}

export function computeScoreTier(totalScore: number): ScoreTier {
  if (totalScore >= 1_200_000) return "SSS";
  if (totalScore >= 900_000) return "SS";
  if (totalScore >= 650_000) return "S";
  if (totalScore >= 400_000) return "A";
  if (totalScore >= 200_000) return "B";
  return "C";
}

export function calculateScoreFromComponents(params: {
  peakValuation: number;
  cash: number;
  arr: number;
  endingId: string;
  daysElapsed: number;
  productsLaunched: number;
  achievements: string[];
  trust: number;
  hype: number;
  scandals: number;
}): ScoreBreakdown {
  const {
    peakValuation,
    cash,
    arr,
    endingId,
    daysElapsed,
    productsLaunched,
    achievements,
    trust,
    hype,
    scandals,
  } = params;

  // 1. Valuation Points: Logarithmic base + bounded linear component
  const val = Math.max(0, peakValuation);
  const logVal = val > 0 ? Math.log10(val) : 0;
  // Valuation exponent scale: 10^6 ($1M) => ~36k, 10^9 ($1B) => ~270k, 10^10 ($10B) => ~380k
  const logPoints = Math.floor(Math.max(0, logVal - 5) * 65_000);
  const linearPoints = Math.floor(Math.min(250_000, val / 50_000));
  const valuationPoints = logPoints + linearPoints;

  // 2. Cash Points: Up to 100,000 pts for retained treasury
  const cashPoints = Math.floor(Math.min(100_000, Math.max(0, cash) / 20_000));

  // 3. ARR Points: Up to 250,000 pts for business top-line
  const arrPoints = Math.floor(Math.min(250_000, Math.max(0, arr) * 0.035));

  // 4. Ending Bonus
  const endingBonus = ENDING_BONUSES[endingId] ?? 40_000;

  // 5. Survival Bonus (encourages hanging on and shipping)
  const survivalBonus = Math.floor(
    Math.min(60_000, daysElapsed * 35 + productsLaunched * 4_000)
  );

  // 6. Achievement Points
  let achievementPoints = 0;
  for (const achId of achievements) {
    const def = ACHIEVEMENT_MAP.get(achId);
    if (def) achievementPoints += def.points;
  }

  // 7. Reputation
  const reputationPoints = Math.round(
    Math.max(0, Math.min(100, trust)) * 300 + Math.max(0, Math.min(100, hype)) * 200
  );

  // 8. Scandal Penalty
  const scandalPenalty = Math.max(0, scandals) * 25_000;

  // 9. Speed Multiplier (for elite scale achieved quickly)
  let speedMultiplier = 1.0;
  if (
    ["monopoly", "ipo", "unicorn", "quiet-profit", "ai-science"].includes(endingId) &&
    daysElapsed < 1200
  ) {
    speedMultiplier = 1 + Math.max(0, Math.min(0.35, (1200 - daysElapsed) / 2000));
  }

  const rawSum =
    valuationPoints +
    cashPoints +
    arrPoints +
    endingBonus +
    survivalBonus +
    achievementPoints +
    reputationPoints -
    scandalPenalty;

  const totalScore = Math.max(1_000, Math.round(rawSum * speedMultiplier));
  const tier = computeScoreTier(totalScore);

  return {
    totalScore,
    tier,
    valuationPoints,
    cashPoints,
    arrPoints,
    endingBonus,
    survivalBonus,
    achievementPoints,
    reputationPoints,
    scandalPenalty,
    speedMultiplier,
  };
}

export function calculateGameScore(game: GameState, unlockedAchievementIds: string[]): ScoreBreakdown {
  const daysElapsed = getDaysElapsed(game);
  const arr = monthlyArr(game) * 12;

  return calculateScoreFromComponents({
    peakValuation: Math.max(game.stats.peakValuation, game.company.valuation),
    cash: game.company.cash,
    arr,
    endingId: game.endingId ?? "unknown",
    daysElapsed,
    productsLaunched: game.stats.productsLaunched,
    achievements: unlockedAchievementIds,
    trust: game.company.trust,
    hype: game.company.hype,
    scandals: game.stats.scandals,
  });
}
