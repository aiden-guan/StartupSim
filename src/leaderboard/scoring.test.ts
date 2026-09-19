import { describe, it, expect } from "vitest";
import { calculateScoreFromComponents, computeScoreTier } from "./scoring";

describe("Leaderboard Scoring System", () => {
  it("assigns internal storage tiers from lifetime revenue", () => {
    expect(computeScoreTier(15_000_000_000)).toBe("SSS");
    expect(computeScoreTier(1_500_000_000)).toBe("SS");
    expect(computeScoreTier(150_000_000)).toBe("S");
    expect(computeScoreTier(15_000_000)).toBe("A");
    expect(computeScoreTier(1_500_000)).toBe("B");
    expect(computeScoreTier(150_000)).toBe("C");
  });

  it("uses lifetime revenue as the complete leaderboard score", () => {
    const score = calculateScoreFromComponents({
      lifetimeRevenue: 842_345_678,
      peakValuation: 1_500_000_000,
      cash: 25_000_000,
      arr: 15_000_000,
      endingId: "unicorn",
      daysElapsed: 600,
      productsLaunched: 4,
      achievements: ["first-ship", "unicorn-club", "ten-m-arr"],
      trust: 85,
      hype: 70,
      scandals: 0,
    });

    expect(score.totalScore).toBe(842_345_678);
    expect(score.tier).toBe("S");
    expect(score.achievementPoints).toBe(0);
    expect(score.endingBonus).toBe(0);
    expect(score.scandalPenalty).toBe(0);
    expect(score.speedMultiplier).toBe(1);
  });

  it("does not alter revenue for scandals or ending bonuses", () => {
    const cleanBankruptcy = calculateScoreFromComponents({
      lifetimeRevenue: 2_400_000,
      peakValuation: 2_000_000,
      cash: -10_000,
      arr: 0,
      endingId: "bankruptcy",
      daysElapsed: 300,
      productsLaunched: 2,
      achievements: ["first-ship"],
      trust: 50,
      hype: 20,
      scandals: 0,
    });

    const scandalousBankruptcy = calculateScoreFromComponents({
      lifetimeRevenue: 2_400_000,
      peakValuation: 2_000_000,
      cash: -10_000,
      arr: 0,
      endingId: "bankruptcy",
      daysElapsed: 300,
      productsLaunched: 2,
      achievements: ["first-ship"],
      trust: 50,
      hype: 20,
      scandals: 2,
    });

    expect(cleanBankruptcy.totalScore).toBe(2_400_000);
    expect(scandalousBankruptcy.totalScore).toBe(cleanBankruptcy.totalScore);
    expect(scandalousBankruptcy.scandalPenalty).toBe(0);
  });
});
