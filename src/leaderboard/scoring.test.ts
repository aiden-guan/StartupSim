import { describe, it, expect } from "vitest";
import { calculateScoreFromComponents, computeScoreTier } from "./scoring";

describe("Leaderboard Scoring System", () => {
  it("assigns appropriate score tiers based on thresholds", () => {
    expect(computeScoreTier(1_500_000)).toBe("SSS");
    expect(computeScoreTier(950_000)).toBe("SS");
    expect(computeScoreTier(700_000)).toBe("S");
    expect(computeScoreTier(450_000)).toBe("A");
    expect(computeScoreTier(250_000)).toBe("B");
    expect(computeScoreTier(150_000)).toBe("C");
  });

  it("calculates deterministic score breakdown for a unicorn company", () => {
    const score = calculateScoreFromComponents({
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

    expect(score.totalScore).toBeGreaterThan(600_000);
    expect(score.tier === "S" || score.tier === "SS" || score.tier === "SSS").toBe(true);
    expect(score.achievementPoints).toBe(5_000 + 20_000 + 15_000);
    expect(score.endingBonus).toBe(120_000);
    expect(score.scandalPenalty).toBe(0);
    expect(score.speedMultiplier).toBeGreaterThan(1.0);
  });

  it("penalizes scandals and rewards survival in bankruptcy", () => {
    const cleanBankruptcy = calculateScoreFromComponents({
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

    expect(cleanBankruptcy.totalScore).toBeGreaterThan(scandalousBankruptcy.totalScore);
    expect(scandalousBankruptcy.scandalPenalty).toBe(50_000);
  });
});
