import { describe, expect, it } from "vitest";
import { recruitingChannels } from "../data/recruiting";
import { officeAnnualBurden, offices } from "../data/offices";
import { applyCommand } from "./commands";
import { allocateTrainingCompute, consumeTrainingCompute, inferenceCreditDepleted, leftoverCapacityDaily, taskComputeDemand } from "./compute";
import { candidateQualityScore, generateEmployee, generateSkills } from "./candidates";
import { monthlyRent } from "./derived";
import { companyStage, scaleEventCash } from "./eventEconomy";
import { createNewGame } from "./newGame";
import { Rng } from "./rng";
import { applyAutoAssign, dailyOutput, departureImpact, planAutoAssign } from "./staffing";
import { developTask } from "./tasks";
import { exportSave, importSave } from "../state/save";
import { migrateGameState } from "../state/migrate";
import type { Employee, GameState } from "./types";

function boot(seed = 4): GameState {
  const g = createNewGame({ founderName: "Ada", companyName: "North", cofounderId: "reya", seed, skipTutorial: true });
  return structuredClone(applyCommand(g, { type: "setSpeed", speed: 1 })!);
}

function startNamedProduct(state: GameState, a: string, b: string): GameState {
  return structuredClone(applyCommand(state, { type: "startProduct", a, b })!);
}

describe("product completion pause", () => {
  it("sets productReady pause when a product finishes, and clears it on market launch", () => {
    let g = boot(12);
    g = startNamedProduct(g, "chat", "writing");
    const task = g.tasks[0]!;
    for (const w of g.employees) g = applyCommand(g, { type: "assign", taskId: task.id, workerId: w.id })!;
    for (let i = 0; i < 90 && g.products[0]?.status !== "ready"; i++) {
      g = applyCommand(g, { type: "tickDay" })!;
    }
    expect(g.products[0]?.status).toBe("ready");
    expect(g.clock.pauseReasons).toContain("productReady");
    expect(g.clock.paused).toBe(true);

    g = applyCommand(g, { type: "enterMarket", productId: g.products[0]!.id })!;
    expect(g.clock.pauseReasons).not.toContain("productReady");
    expect(g.clock.pauseReasons).toContain("market");
  });

  it("does not keep the ready-product pause after launching when another product is ready", () => {
    let g = boot(14);
    g = startNamedProduct(g, "chat", "writing");
    g = startNamedProduct(g, "search", "image");
    for (const product of g.products) product.status = "ready";
    g.clock.pauseReasons = ["productReady"];
    g.clock.paused = true;

    g = applyCommand(g, { type: "enterMarket", productId: g.products[0]!.id })!;

    expect(g.clock.pauseReasons).not.toContain("productReady");
    expect(g.clock.pauseReasons).toContain("market");
  });
});

describe("compute constraints", () => {
  it("does not report depleted credits when self-hosted capacity covers inference", () => {
    const g = boot(13);
    g.products.push({
      id: "hosted-product",
      name: "Hosted product",
      combo: ["chat", "writing"],
      recipeId: "chat.writing",
      description: "",
      status: "active",
      difficulty: 1,
      revenueScore: 1,
      points: { engineering: 0, product: 0, growth: 0, research: 0 },
      levels: { deployment: 0, capability: 0, distribution: 0 },
      version: 1,
      newDiscovery: false,
      vertical: "consumer",
      riskTags: [],
      businessModel: "freemium",
      gtmStrategy: "product-led",
      modelId: "claudius-instant",
      marketShare: 0,
      weeklyRevenue: 0,
      weeklyInference: 1_000,
      weeklyOperatingCost: 0,
      retentionRate: 0.97,
      gtmFit: 50,
      weeklyGrowthRate: 0,
      rampWeeks: 0,
      users: 1,
      reliability: 0.5,
      ageWeeks: 0,
      earnedRevenue: 0,
      technicalDebt: 0,
      competitorId: null,
    });
    g.compute.apiCredits = 0;
    g.compute.ownedCluster = 10;

    expect(inferenceCreditDepleted(g)).toBe(false);

    g.compute.ownedCluster = 1;
    expect(inferenceCreditDepleted(g)).toBe(true);
  });

  it("consumes training compute across concurrent projects and blocks progress at zero", () => {
    let g = boot(13);
    g = startNamedProduct(g, "chat", "writing");
    g = startNamedProduct(g, "search", "image");
    expect(g.tasks.length).toBeGreaterThanOrEqual(2);
    for (const task of g.tasks) {
      const worker = g.employees.find((w) => !w.taskId)!;
      g = applyCommand(g, { type: "assign", taskId: task.id, workerId: worker.id })!;
    }
    g = structuredClone(g);
    const allocation = allocateTrainingCompute(g);
    expect(allocation.demand).toBeGreaterThan(0);
    expect(g.tasks.reduce((sum, task) => sum + taskComputeDemand(g, task), 0)).toBe(allocation.demand);

    g.compute.apiCredits = 0;
    g.compute.rentedGpus = 0;
    g.compute.ownedCluster = 0;
    g.compute.dataCenters = 0;
    expect(leftoverCapacityDaily(g)).toBe(0);
    const empty = allocateTrainingCompute(g);
    expect(empty.blocked).toBe(true);
    const before = g.tasks.map((t) => t.progress);
    for (const task of g.tasks) {
      expect(developTask(g, task, empty)).toBe(false);
    }
    expect(g.tasks.map((t) => t.progress)).toEqual(before);

    g.compute.apiCredits = 50_000;
    const restored = allocateTrainingCompute(g);
    expect(restored.blocked).toBe(false);
    const progressed = g.tasks.some((task) => developTask(g, task, restored));
    expect(g.tasks.some((t, i) => t.progress > before[i]! ) || progressed).toBe(true);
    consumeTrainingCompute(g, restored);
    expect(g.compute.apiCredits).toBeLessThan(50_000);
  });
});

describe("rest assignment", () => {
  it("keeps the assignment, stops contribution, and resumes after rest", () => {
    let g = boot(14);
    g = startNamedProduct(g, "chat", "writing");
    const task = g.tasks[0]!;
    const worker = g.employees[0]!;
    g = applyCommand(g, { type: "assign", taskId: task.id, workerId: worker.id })!;
    g = structuredClone(g);
    const assigned = g.employees.find((w) => w.id === worker.id)!;
    expect(assigned.taskId).toBe(task.id);
    assigned.burnoutDays = 3;
    const restingOutput = dailyOutput(g, task, [assigned]);
    expect(restingOutput).toBe(0);
    const mid = g.tasks[0]!.progress;
    const alloc = allocateTrainingCompute(g);
    developTask(g, g.tasks[0]!, alloc);
    expect(g.employees.find((w) => w.id === worker.id)!.taskId).toBe(task.id);
    expect(g.tasks[0]!.progress).toBe(mid);
    assigned.burnoutDays = 0;
    developTask(g, g.tasks[0]!, allocateTrainingCompute(g));
    expect(g.employees.find((w) => w.id === worker.id)!.taskId).toBe(task.id);
    expect(g.tasks[0]!.progress).toBeGreaterThan(mid);
    assigned.burnoutDays = 2;
    g.tasks[0]!.progress = g.tasks[0]!.requiredProgress;
    expect(developTask(g, g.tasks[0]!, allocateTrainingCompute(g))).toBe(true);
    expect(g.employees.find((w) => w.id === worker.id)!.taskId).toBe(task.id);
  });
});

describe("assignment", () => {
  it("refuses silent manual reassignment without confirm and single-task auto-assign does not steal", () => {
    let g = boot(15);
    g = startNamedProduct(g, "chat", "writing");
    g = startNamedProduct(g, "search", "image");
    const [a, b] = g.tasks;
    const founder = g.employees[0]!;
    const partner = g.employees[1]!;
    g = applyCommand(g, { type: "assign", taskId: a!.id, workerId: founder.id })!;
    g = applyCommand(g, { type: "assign", taskId: a!.id, workerId: partner.id })!;
    const stolen = applyCommand(g, { type: "assign", taskId: b!.id, workerId: founder.id })!;
    expect(stolen.employees.find((w) => w.id === founder.id)!.taskId).toBe(a!.id);
    const moved = structuredClone(applyCommand(g, { type: "assign", taskId: b!.id, workerId: founder.id, confirm: true })!);
    expect(moved.employees.find((w) => w.id === founder.id)!.taskId).toBe(b!.id);

    const extra: Employee = {
      ...structuredClone(partner),
      id: "free-1",
      name: "Maya Chen",
      taskId: null,
      burnoutDays: 0,
      skills: { ...partner.skills, research: 12, engineering: 11, product: 8, growth: 4, productivity: 8 },
    };
    moved.employees.push(extra);
    const singlePlan = planAutoAssign(moved, b);
    expect(singlePlan.assigned.every((row) => row.workerId === "free-1")).toBe(true);
    const after = structuredClone(moved);
    applyAutoAssign(after, b);
    expect(after.employees.find((w) => w.id === founder.id)!.taskId).toBe(b!.id);
    expect(after.employees.find((w) => w.id === partner.id)!.taskId).toBe(a!.id);
    expect(after.employees.find((w) => w.id === extra.id)!.taskId).toBe(b!.id);
  });

  it("auto-assign all automatically unassigns and reassigns people to appropriate positions across projects", () => {
    let g = boot(15);
    g = startNamedProduct(g, "chat", "writing");
    g = startNamedProduct(g, "search", "image");
    const [a, b] = g.tasks;
    const founder = g.employees[0]!;
    const partner = g.employees[1]!;
    // Assign entire team to project a initially
    g = applyCommand(g, { type: "assign", taskId: a!.id, workerId: founder.id })!;
    g = applyCommand(g, { type: "assign", taskId: a!.id, workerId: partner.id })!;
    expect(g.employees.every((w) => w.taskId === a!.id)).toBe(true);

    // Auto assign all ignores that the whole team was on project a and reassigns across projects
    const after = applyCommand(g, { type: "autoAssign" })!;
    expect(after.employees.some((w) => w.taskId === a!.id)).toBe(true);
    expect(after.employees.some((w) => w.taskId === b!.id)).toBe(true);
  });

  it("covers every project before adding extra available teammates", () => {
    let g = boot(18);
    g = startNamedProduct(g, "chat", "writing");
    g = startNamedProduct(g, "search", "image");
    const [first, second] = g.tasks;
    const template = g.employees[1]!;
    g.employees.push(
      {
        ...structuredClone(template),
        id: "free-coverage-1",
        name: "Maya Chen",
        taskId: null,
        skills: { ...template.skills, engineering: 12, research: 11, product: 9 },
      },
    );

    const plan = planAutoAssign(g);
    expect(plan.assigned).toHaveLength(3);
    expect(new Set(plan.assigned.map((row) => row.taskId))).toEqual(new Set([first!.id, second!.id]));

    const after = applyCommand(g, { type: "autoAssign" })!;
    expect(after.lastStaffing?.taskId).toBeNull();
    expect(after.employees.filter((worker) => worker.taskId === first!.id).length).toBeGreaterThanOrEqual(1);
    expect(after.employees.filter((worker) => worker.taskId === second!.id).length).toBeGreaterThanOrEqual(1);
  });
});

describe("hiring", () => {
  it("accepts an at-ask offer once and ignores a second click", () => {
    let g = boot(16);
    g.company.cash = 500_000;
    g.unlocks.hiring = true;
    g = applyCommand(g, { type: "recruit", channelId: "network" })!;
    const candidate = g.hiring.candidates[0]!;
    const salary = candidate.minSalary;
    g = applyCommand(g, { type: "hire", candidateId: candidate.employee.id, salary })!;
    expect(g.hiring.lastResult?.accepted).toBe(true);
    expect(g.employees.some((w) => w.id === candidate.employee.id)).toBe(true);
    const count = g.employees.length;
    g = applyCommand(g, { type: "hire", candidateId: candidate.employee.id, salary })!;
    expect(g.employees.length).toBe(count);
  });

  it("does not add an employee when the offer is declined", () => {
    let g = boot(17);
    g.company.cash = 500_000;
    g.unlocks.hiring = true;
    g = applyCommand(g, { type: "recruit", channelId: "board" })!;
    const candidate = g.hiring.candidates[0]!;
    const before = g.employees.length;
    g = applyCommand(g, { type: "hire", candidateId: candidate.employee.id, salary: 0 })!;
    expect(g.hiring.lastResult?.accepted).toBe(false);
    expect(g.employees.length).toBe(before);
    expect(g.hiring.lastResult?.reason).toBeTruthy();
  });
});

describe("recruiting quality", () => {
  it("gives premium channels better expected multi-stat quality without guaranteeing perfection", () => {
    const cheap = recruitingChannels.find((c) => c.id === "network")!;
    const premium = recruitingChannels.find((c) => c.id === "exec")!;
    const cheapScores: number[] = [];
    const premiumScores: number[] = [];
    let cheapMax = 0;
    let premiumPerfect = 0;
    let premiumNarrow = 0;
    for (let i = 0; i < 80; i++) {
      const cheapSkills = generateSkills(new Rng(1000 + i), cheap);
      const premiumSkills = generateSkills(new Rng(2000 + i), premium);
      cheapScores.push(candidateQualityScore(cheapSkills));
      premiumScores.push(candidateQualityScore(premiumSkills));
      cheapMax = Math.max(cheapMax, candidateQualityScore(cheapSkills));
      const core = [premiumSkills.research, premiumSkills.engineering, premiumSkills.product, premiumSkills.growth];
      if (core.every((n) => n >= 16)) premiumPerfect += 1;
      const sorted = [...core].sort((a, b) => b - a);
      if (sorted[0]! >= 14 && sorted[1]! < 5) premiumNarrow += 1;
    }
    const avg = (xs: number[]) => xs.reduce((s, n) => s + n, 0) / xs.length;
    expect(avg(premiumScores)).toBeGreaterThan(avg(cheapScores));
    expect(cheapMax).toBeGreaterThan(avg(cheapScores) * 1.15);
    expect(premiumPerfect).toBeLessThan(20);
    expect(premiumNarrow).toBeLessThan(8);
    const gem = generateEmployee(new Rng(3), cheap.targetScore, false, cheap.id);
    expect(gem.skills.engineering + gem.skills.research + gem.skills.product + gem.skills.growth).toBeGreaterThan(0);
  });
});

describe("event scaling and offices", () => {
  it("scales event cash with company size, stays bounded, and keeps offices increasingly expensive", () => {
    const small = boot(18);
    const large = boot(18);
    large.company.cash = 80_000_000;
    large.company.valuation = 400_000_000;
    large.company.officeLevel = 3;
    large.company.monthlyRevenue = 4_000_000;
    const minorSmall = Math.abs(scaleEventCash(small, -8_000, "minor"));
    const minorLarge = Math.abs(scaleEventCash(large, -8_000, "minor"));
    const majorLarge = Math.abs(scaleEventCash(large, -40_000, "major"));
    expect(minorLarge).toBeGreaterThan(minorSmall);
    expect(minorLarge).toBeLessThan(large.company.cash * 0.05);
    expect(majorLarge).toBeGreaterThan(minorLarge);
    expect(majorLarge).toBeLessThan(large.company.cash * 0.25);
    expect(companyStage(small)).toBe("garage");
    expect(["scale", "mega"]).toContain(companyStage(large));
    for (let i = 1; i < offices.length; i++) {
      expect(officeAnnualBurden(offices[i]!)).toBeGreaterThan(officeAnnualBurden(offices[i - 1]!));
      expect(offices[i]!.rent).toBeGreaterThan(offices[i - 1]!.rent);
      expect(offices[i]!.capacity).toBeGreaterThan(offices[i - 1]!.capacity);
    }
    small.company.officeLevel = 2;
    expect(monthlyRent(small)).toBe(offices[2]!.rent);
  });
});

describe("save / load", () => {
  it("round-trips new fields and fills defaults for legacy saves", () => {
    let g = boot(19);
    g = startNamedProduct(g, "chat", "writing");
    g.employees[0]!.taskId = g.tasks[0]!.id;
    g.employees[0]!.burnoutDays = 4;
    g.compute.trainingReserved = 42;
    g.lastStaffing = { taskId: g.tasks[0]!.id, lines: ["Assigned Maya to model research — strongest available AI/research fit."], at: 3 };
    g.hiring.lastResult = { candidateId: "x", name: "Jordan", accepted: false, reason: "Compensation too low", at: 3 };
    g.news.push({ id: "n1", at: g.clock.date, headline: "Wire", body: "Hello", tone: "neutral", read: false, source: "The Wire" });
    const copy = importSave(exportSave(g));
    expect(copy.employees[0]!.taskId).toBe(g.tasks[0]!.id);
    expect(copy.employees[0]!.burnoutDays).toBe(4);
    expect(copy.compute.trainingReserved).toBe(42);
    expect(copy.lastStaffing?.lines[0]).toContain("Maya");
    expect(copy.hiring.lastResult?.reason).toBe("Compensation too low");
    expect(copy.news.some((n) => n.read === false)).toBe(true);

    const legacy = structuredClone(g) as GameState;
    delete legacy.hiring.lastResult;
    delete legacy.lastStaffing;
    delete (legacy.compute as { trainingReserved?: number }).trainingReserved;
    const migrated = migrateGameState(legacy);
    expect(migrated.hiring.lastResult).toBeNull();
    expect(migrated.lastStaffing).toBeNull();
    expect(migrated.compute.trainingReserved).toBe(0);
    expect(migrated.clock.pauseReasons).not.toContain("productReady");
  });
});

describe("departure impact", () => {
  it("reports a project hit when a contributing employee leaves", () => {
    let g = boot(20);
    g = startNamedProduct(g, "chat", "writing");
    const task = g.tasks[0]!;
    for (const w of g.employees) g = applyCommand(g, { type: "assign", taskId: task.id, workerId: w.id })!;
    const hit = departureImpact(g, g.employees[0]!);
    expect(hit.fromTask?.id).toBe(task.id);
    expect(hit.lossPct).toBeGreaterThan(0);
  });
});
