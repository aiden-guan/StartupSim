import { describe, it, expect } from "vitest";
import { produce } from "immer";
import { createNewGame } from "./newGame";
import { applyCommand } from "./commands";
import { ACHIEVEMENTS, evaluateAchievements } from "./achievements";
import { ACHIEVEMENTS as DISPLAY_ACHIEVEMENTS } from "../data/achievements";

describe("Achievements System", () => {
  it("detects no premature achievements on a fresh game start", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "dustin-moskovitz" });
    const unlocked = evaluateAchievements(game);
    // On day 1 fresh game, no achievements should be unlocked yet
    expect(unlocked.length).toBe(0);
  });

  it("unlocks first-ship when product is launched", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "dustin-moskovitz" });
    game.stats.productsLaunched = 1;
    const unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "first-ship")).toBe(true);
  });

  it("does not treat a ready-but-unlaunched product as shipped", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "dustin-moskovitz", skipTutorial: true });
    const withProduct = applyCommand(game, { type: "startProduct", a: "chat", b: "writing" })!;
    const readyState = produce(withProduct, (draft) => {
      draft.products[0]!.status = "ready";
    });

    expect(evaluateAchievements(readyState).some((a) => a.id === "first-ship")).toBe(false);
  });

  it("uses one catalog for scoring and presentation", () => {
    expect(DISPLAY_ACHIEVEMENTS.map((achievement) => achievement.id)).toEqual(
      ACHIEVEMENTS.map((achievement) => achievement.id),
    );
    expect(DISPLAY_ACHIEVEMENTS.map((achievement) => achievement.secret ?? false)).toEqual(
      ACHIEVEMENTS.map((achievement) => achievement.secret ?? false),
    );
  });

  it("keeps rare discoveries secret until they are unlocked", () => {
    expect(ACHIEVEMENTS.find((achievement) => achievement.id === "the-social-network")?.secret).toBe(true);
    expect(ACHIEVEMENTS.find((achievement) => achievement.id === "ring-the-bell")?.secret).toBe(true);
    expect(ACHIEVEMENTS.find((achievement) => achievement.id === "first-ship")?.secret).not.toBe(true);
  });

  it("records Eduardo dilution in ownership, morale, and achievements", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "eduardo-saverin", skipTutorial: true });
    const eduardo = game.employees.find((employee) => employee.role === "cofounder")!;
    const beforeEquity = eduardo.equity;
    const next = applyCommand(game, { type: "dilute", workerId: eduardo.id, percentage: 50 })!;

    const updated = next.employees.find((employee) => employee.id === eduardo.id)!;
    expect(updated.equity).toBeCloseTo(beforeEquity / 2);
    expect(updated.loyalty).toBeLessThan(10);
    expect(next.stats.dilutionsCount).toBe(1);
    expect(next.achievements).toEqual(expect.arrayContaining(["the-social-network", "founder-mode"]));
    expect(next.inbox[0]?.subject).toContain("LEGAL NOTICE");
  });

  it("does not mistake a hired capital connector for Eduardo", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "dustin-moskovitz", skipTutorial: true });
    game.stats.dilutionsCount = 1;

    const candidate = structuredClone(game.employees.find((employee) => employee.role === "cofounder")!);
    candidate.id = "emp-capital-connector";
    candidate.name = "Maya Chen";
    candidate.role = "employee";
    candidate.traits = ["capital-connector"];
    candidate.equity = 0;
    game.hiring.candidates = [{ employee: candidate, minSalary: 0, personality: "builder" }];

    const next = applyCommand(game, { type: "hire", candidateId: candidate.id, salary: 0 })!;

    expect(next.employees.some((employee) => employee.id === candidate.id)).toBe(true);
    expect(next.achievements).not.toContain("the-social-network");
    expect(evaluateAchievements(next).some((achievement) => achievement.id === "the-social-network")).toBe(false);
  });

  it("unlocks unicorn-club and decacorn correctly", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "dustin-moskovitz" });
    game.stats.peakValuation = 1_200_000_000;
    let unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "unicorn-club")).toBe(true);
    expect(unlocked.some((a) => a.id === "decacorn")).toBe(false);

    game.stats.peakValuation = 15_000_000_000;
    unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "unicorn-club")).toBe(true);
    expect(unlocked.some((a) => a.id === "decacorn")).toBe(true);
  });

  it("unlocks bootstrapped only when $1M ARR without VC funding", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "dustin-moskovitz" });
    game.products.push({
      id: "p1",
      name: "Prod",
      recipeId: "chat-search",
      description: "Test product",
      combo: ["chat", "search"],
      vertical: "consumer",
      status: "active",
      weeklyRevenue: 25_000,
      weeklyInference: 500,
      weeklyOperatingCost: 2_500,
      retentionRate: 0.95,
      gtmFit: 80,
      weeklyGrowthRate: 0.05,
      rampWeeks: 4,
      users: 10_000,
      reliability: 95,
      ageWeeks: 12,
      earnedRevenue: 300_000,
      technicalDebt: 5,
      competitorId: null,
      difficulty: 1,
      revenueScore: 80,
      points: { research: 0, engineering: 0, product: 0, growth: 0 },
      levels: { deployment: 1, capability: 1, distribution: 1 },
      version: 1,
      newDiscovery: false,
      riskTags: [],
      businessModel: "subscription",
      gtmStrategy: "product-led",
      modelId: "claudius-instant",
      marketShare: 10,
    });
    // monthlyRevenue 100_000 * 12 = 1.2M ARR
    game.funding.raisedTotal = 0;
    let unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "bootstrapped")).toBe(true);

    // If raised VC, not bootstrapped
    game.funding.raisedTotal = 1_000_000;
    unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "bootstrapped")).toBe(false);
  });

  it("unlocks deep tech achievements on special projects", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "dustin-moskovitz" });
    game.company.specialProjects = ["foundation-model", "gpu-cluster"];
    const unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "frontier-builder")).toBe(true);
    expect(unlocked.some((a) => a.id === "sovereign-silicon")).toBe(true);
    expect(unlocked.some((a) => a.id === "autonomous-frontier")).toBe(false);
  });

  it("unlocks ending achievements corresponding to specific endings", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "Hyperion", cofounderId: "dustin-moskovitz" });
    game.endingId = "ipo";
    let unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "ring-the-bell")).toBe(true);

    game.endingId = "monopoly";
    unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "infrastructure-monopoly")).toBe(true);

    game.endingId = "bankruptcy";
    game.stats.productsLaunched = 3;
    unlocked = evaluateAchievements(game);
    expect(unlocked.some((a) => a.id === "valiant-postmortem")).toBe(true);
  });
});
