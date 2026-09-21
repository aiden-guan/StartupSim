import { describe, it, expect } from "vitest";
import { computeRunSeal, validateRunIntegrity, sanitizeHandle } from "./security";
import type { LeaderboardSubmission } from "./types";

describe("Leaderboard Anti-Cheat & Security", () => {
  function validSubmissionFixture(): LeaderboardSubmission {
    const runId = "run_test_123";
    const seed = 42;
    const endingId = "unicorn";
    const daysElapsed = 450;
    const peakValuation = 1_200_000_000;
    const productsLaunched = 3;
    const scandals = 0;
    const lifetimeRevenue = 86_400_000;

    const seal = computeRunSeal({
      runId,
      seed,
      endingId,
      daysElapsed,
      peakValuation,
      productsLaunched,
      scandals,
      lifetimeRevenue,
    });

    return {
      runId,
      seed,
      handle: "founder_sam",
      companyName: "HyperScale AI",
      founderName: "Sam Rivera",
      quote: "Built in public from day one.",
      endingId,
      stats: {
        productsLaunched,
        employeesHired: 12,
        acquisitions: 0,
        scandals,
        computeConsumed: 250_000,
        peakValuation,
        peakEmployees: 10,
      },
      company: {
        cash: 18_000_000,
        valuation: 1_200_000_000,
        lifetimeRevenue,
        hype: 65,
        trust: 80,
        raisedTotal: 25_000_000,
      },
      clock: {
        year: 2024,
        month: 2,
        day: 15,
        daysElapsed,
      },
      arr: 8_500_000,
      achievements: ["first-ship", "unicorn-club"],
      seal,
    };
  }

  it("accepts a fully compliant, verified run submission", () => {
    const sub = validSubmissionFixture();
    const result = validateRunIntegrity(sub);
    expect(result.valid).toBe(true);
    expect(result.verifiedEntry).toBeDefined();
    expect(result.verifiedEntry?.handle).toBe("FOUNDER_SAM");
    expect(result.verifiedEntry?.verified).toBe(true);
    expect(result.verifiedEntry?.score).toBe(86_400_000);
  });

  it("accepts long runs without an elapsed-day ceiling", () => {
    const sub = validSubmissionFixture();
    sub.clock = { year: 4762, month: 8, day: 21, daysElapsed: 1_000_000 };
    sub.seal = computeRunSeal({
      runId: sub.runId,
      seed: sub.seed,
      endingId: sub.endingId,
      daysElapsed: sub.clock.daysElapsed,
      peakValuation: sub.stats.peakValuation,
      productsLaunched: sub.stats.productsLaunched,
      scandals: sub.stats.scandals,
      lifetimeRevenue: sub.company.lifetimeRevenue,
    });

    const result = validateRunIntegrity(sub);

    expect(result.valid).toBe(true);
    expect(result.verifiedEntry?.daysElapsed).toBe(1_000_000);
  });

  it("accepts peak valuations above the former economy cap", () => {
    const sub = validSubmissionFixture();
    sub.stats.peakValuation = 60_000_000_000_000;
    sub.company.valuation = sub.stats.peakValuation;
    sub.seal = computeRunSeal({
      runId: sub.runId,
      seed: sub.seed,
      endingId: sub.endingId,
      daysElapsed: sub.clock.daysElapsed,
      peakValuation: sub.stats.peakValuation,
      productsLaunched: sub.stats.productsLaunched,
      scandals: sub.stats.scandals,
      lifetimeRevenue: sub.company.lifetimeRevenue,
    });

    const result = validateRunIntegrity(sub);

    expect(result.valid).toBe(true);
    expect(result.verifiedEntry?.valuation).toBe(60_000_000_000_000);
  });

  it("rejects run submission when seal does not match (tamper detection)", () => {
    const sub = validSubmissionFixture();
    sub.seal = "fake_tampered_hash_value";
    const result = validateRunIntegrity(sub);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("seal mismatch");
  });

  it("seals the lifetime revenue used for leaderboard rank", () => {
    const sub = validSubmissionFixture();
    sub.company.lifetimeRevenue += 1_000_000_000;

    const result = validateRunIntegrity(sub);

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("seal mismatch");
  });

  it("rejects impossible valuation with zero products and zero funding", () => {
    const sub = validSubmissionFixture();
    sub.stats.productsLaunched = 0;
    sub.company.raisedTotal = 0;
    // Recompute seal so seal check passes, to test the invariant check
    sub.seal = computeRunSeal({
      runId: sub.runId,
      seed: sub.seed,
      endingId: sub.endingId,
      daysElapsed: sub.clock.daysElapsed,
      peakValuation: sub.stats.peakValuation,
      productsLaunched: sub.stats.productsLaunched,
      scandals: sub.stats.scandals,
      lifetimeRevenue: sub.company.lifetimeRevenue,
    });

    const result = validateRunIntegrity(sub);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Impossible valuation");
  });

  it("rejects invalid ending condition (e.g. unicorn claimed with $5M valuation)", () => {
    const sub = validSubmissionFixture();
    sub.stats.peakValuation = 5_000_000;
    sub.company.valuation = 5_000_000;
    sub.seal = computeRunSeal({
      runId: sub.runId,
      seed: sub.seed,
      endingId: sub.endingId,
      daysElapsed: sub.clock.daysElapsed,
      peakValuation: sub.stats.peakValuation,
      productsLaunched: sub.stats.productsLaunched,
      scandals: sub.stats.scandals,
      lifetimeRevenue: sub.company.lifetimeRevenue,
    });

    const result = validateRunIntegrity(sub);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Unicorn ending requires");
  });

  it("strips unearned achievements during validation", () => {
    const sub = validSubmissionFixture();
    // Claim decacorn ($10B) even though valuation is only $1.2B
    sub.achievements.push("decacorn");
    const result = validateRunIntegrity(sub);
    expect(result.valid).toBe(true);
    expect(result.verifiedEntry?.achievements.includes("decacorn")).toBe(false);
    expect(result.verifiedEntry?.achievements.includes("unicorn-club")).toBe(true);
  });

  it("sanitizes handle and quote", () => {
    expect(sanitizeHandle("  <script>alert(1)</script> aiden_123 ")).toBe("SCRIPTALERT1SCRI");
    expect(sanitizeHandle("")).toBe("FOUNDER");
  });
});
