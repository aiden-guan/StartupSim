import { describe, it, expect } from "vitest";
import handler from "../../api/leaderboard";
import { computeRunSeal } from "./security";
import type { LeaderboardSubmission } from "./types";

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: any) {
      res.data = payload;
      return res;
    },
    setHeader(key: string, val: any) {
      res.headers[key] = val;
      return res;
    },
  };
  return res;
}

describe("Leaderboard API Handler", () => {
  it("handles an empty GET request without inventing placements", async () => {
    const req: any = {
      method: "GET",
      query: { filter: "all", limit: "10" },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.entries)).toBe(true);
    expect(res.data.entries).toHaveLength(0);
    expect(res.data.source).toBe("local");
  });

  it("handles POST request with a valid run and publishes entry with rank", async () => {
    const runId = "run_endpoint_test_1";
    const seed = 999;
    const endingId = "unicorn";
    const daysElapsed = 520;
    const peakValuation = 2_000_000_000;
    const productsLaunched = 4;
    const scandals = 0;

    const seal = computeRunSeal({
      runId,
      seed,
      endingId,
      daysElapsed,
      peakValuation,
      productsLaunched,
      scandals,
    });

    const submission: LeaderboardSubmission = {
      runId,
      seed,
      handle: "EP_TESTER",
      companyName: "Endpoint Corp",
      founderName: "Alex Tester",
      quote: "Tested via API handler",
      endingId,
      stats: {
        productsLaunched,
        employeesHired: 15,
        acquisitions: 1,
        scandals,
        computeConsumed: 120_000,
        peakValuation,
        peakEmployees: 12,
      },
      company: {
        cash: 30_000_000,
        valuation: 2_000_000_000,
        hype: 75,
        trust: 85,
        raisedTotal: 40_000_000,
      },
      clock: {
        year: 2024,
        month: 5,
        day: 10,
        daysElapsed,
      },
      arr: 12_000_000,
      achievements: ["first-ship", "unicorn-club", "ten-m-arr"],
      seal,
    };

    const req: any = {
      method: "POST",
      body: submission,
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.entry.handle).toBe("EP_TESTER");
    expect(typeof res.data.rank).toBe("number");
    expect(res.data.rank).toBeGreaterThan(0);
  });

  it("rejects POST request with tampered seal", async () => {
    const req: any = {
      method: "POST",
      body: {
        runId: "tampered_run",
        seed: 123,
        handle: "HACKER",
        companyName: "Cheaters Inc",
        endingId: "unicorn",
        stats: { peakValuation: 999_999_999_999, productsLaunched: 1, scandals: 0 },
        clock: { daysElapsed: 10 },
        seal: "invalid_tampered_seal",
      },
    };
    const res = createMockRes();

    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.error).toContain("Tamper detection");
  });
});
