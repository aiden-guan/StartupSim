import type { GameState } from "../simulation/types.js";
import type { ScoreBreakdown, ScoreTier } from "./types.js";

export function getDaysElapsed(game: GameState): number {
  const start = { year: 2022, month: 11, day: 1 };
  const current = game.clock.date;
  const tStart = Date.UTC(start.year, start.month - 1, start.day);
  const tCurrent = Date.UTC(current.year, current.month - 1, current.day);
  const diff = Math.max(1, Math.round((tCurrent - tStart) / (1000 * 60 * 60 * 24)));
  return diff;
}

export function computeScoreTier(totalScore: number): ScoreTier {
  if (totalScore >= 10_000_000_000) return "SSS";
  if (totalScore >= 1_000_000_000) return "SS";
  if (totalScore >= 100_000_000) return "S";
  if (totalScore >= 10_000_000) return "A";
  if (totalScore >= 1_000_000) return "B";
  return "C";
}

export function calculateScoreFromComponents(params: {
  lifetimeRevenue: number;
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
  // The leaderboard has one legible metric: dollars of revenue collected over
  // the life of the company. The legacy fields remain zeroed in the response so
  // stored clients can still deserialize the familiar shape during rollout.
  const totalScore = Math.max(0, Math.round(params.lifetimeRevenue));
  const tier = computeScoreTier(totalScore);

  return {
    totalScore,
    tier,
    valuationPoints: 0,
    cashPoints: 0,
    arrPoints: 0,
    endingBonus: 0,
    survivalBonus: 0,
    achievementPoints: 0,
    reputationPoints: 0,
    scandalPenalty: 0,
    speedMultiplier: 1,
  };
}

export function calculateGameScore(game: GameState, unlockedAchievementIds: string[]): ScoreBreakdown {
  const daysElapsed = getDaysElapsed(game);

  return calculateScoreFromComponents({
    lifetimeRevenue: game.company.lifetimeRevenue,
    peakValuation: Math.max(game.stats.peakValuation, game.company.valuation),
    cash: game.company.cash,
    arr: 0,
    endingId: game.endingId ?? "unknown",
    daysElapsed,
    productsLaunched: game.stats.productsLaunched,
    achievements: unlockedAchievementIds,
    trust: game.company.trust,
    hype: game.company.hype,
    scandals: game.stats.scandals,
  });
}
