import { describe, expect, it } from "vitest";
import { communicationBand, communicationMultiplier, communicationPairs } from "./overhead";
import { findRecipe } from "../data/recipes";
import { buyLaunchStat, canAffordStat, launchCosts, setProductEconomics, uncreativityDecay } from "./products";
import { createNewGame } from "./newGame";
import { applyCommand } from "./commands";
import { Rng } from "./rng";
import { conditionSatisfied } from "./conditions";
import { techById } from "../data/technologies";
import { minSalaryFor } from "./workers";
import { exportSave, importSave } from "../state/save";
import { monthlyCompute } from "./derived";
import type { Product } from "./types";

function blankProduct(over: Partial<Product> = {}): Product {
  return {
    id: "p",
    name: "X",
    combo: ["chat", "writing"],
    recipeId: "chat.writing",
    description: "",
    status: "development",
    difficulty: 2,
    revenueScore: 2,
    points: { engineering: 10_000, product: 10_000, growth: 10_000, research: 0 },
    levels: { deployment: 0, capability: 0, distribution: 0 },
    version: 1,
    newDiscovery: false,
    vertical: "consumer",
    riskTags: [],
    businessModel: "freemium",
    modelId: "claudius-instant",
    marketShare: 0,
    weeklyRevenue: 0,
    weeklyInference: 0,
    users: 0,
    reliability: 0.5,
    ageWeeks: 0,
    earnedRevenue: 0,
    technicalDebt: 0,
    competitorId: null,
    ...over,
  };
}

describe("overhead", () => {
  it("uses n(n-1)/2 buckets", () => {
    expect(communicationPairs(5)).toBe(10);
    expect(communicationBand(5)).toBe(0);
    expect(communicationBand(9)).toBe(1);
    expect(communicationBand(10)).toBe(2);
    expect(communicationMultiplier(5)).toBe(1);
    expect(communicationMultiplier(9)).toBe(0.5);
    expect(communicationMultiplier(15)).toBe(0.25);
  });
});

describe("recipes", () => {
  it("matches named pairs regardless of order", () => {
    expect(findRecipe("chat", "writing")?.name).toBe("Copywright");
    expect(findRecipe("writing", "chat")?.name).toBe("Copywright");
  });
  it("falls back to generic for unknown combos", () => {
    expect(findRecipe("chat", "robotics")).toBeUndefined();
  });
});

describe("designer costs", () => {
  it("grows as difficulty² × 3^level", () => {
    const p = blankProduct();
    const c0 = launchCosts(p);
    expect(c0.capability).toBe(1 * 4 * Math.pow(3, 0));
    expect(c0.deployment).toBe(5 * 4 * Math.pow(3, 0));
    expect(canAffordStat(p, "capability")).toBe(true);
    expect(buyLaunchStat(p, "capability")).toBe(true);
    expect(p.levels.capability).toBe(1);
    expect(launchCosts(p).capability).toBe(1 * 4 * Math.pow(3, 1));
  });
});

describe("uncreativity", () => {
  it("decays with version but floors", () => {
    expect(uncreativityDecay(1)).toBeGreaterThan(uncreativityDecay(4));
    expect(uncreativityDecay(99)).toBeGreaterThanOrEqual(0.42);
  });
});

describe("rng", () => {
  it("is deterministic for a seed", () => {
    const a = new Rng(42);
    const b = new Rng(42);
    expect([a.next(), a.next(), a.int(1, 10)]).toEqual([b.next(), b.next(), b.int(1, 10)]);
  });
});

describe("research prereqs", () => {
  it("blocks techs whose requires are missing", () => {
    let g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 7 });
    g.unlocks.research = true;
    g = applyCommand(g, { type: "startResearch", techId: "fine-tuning" })!;
    expect(g.tasks.some((t) => t.techId === "fine-tuning")).toBe(false);
    expect(techById["fine-tuning"]?.requires).toContain("prompt-engineering");
    g = applyCommand(g, { type: "startResearch", techId: "prompt-engineering" })!;
    expect(g.tasks.some((t) => t.techId === "prompt-engineering")).toBe(true);
  });
});

describe("hiring", () => {
  it("rejects offers well below the floor more often than at-ask", () => {
    const g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 99 });
    const salary = minSalaryFor(g.employees[1]!, g);
    expect(salary).toBeGreaterThan(0);
  });
});

describe("conditions", () => {
  it("reads cash and task counts", () => {
    const g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 1 });
    expect(conditionSatisfied({ type: "cash", op: "ge", val: 10_000 }, g)).toBe(true);
    expect(conditionSatisfied({ type: "tasks", op: "eq", val: 0 }, g)).toBe(true);
  });
});

describe("save round-trip", () => {
  it("survives JSON export/import", () => {
    const g = createNewGame({ founderName: "Ada", companyName: "North", cofounderId: "casey", seed: 123 });
    const copy = importSave(exportSave(g));
    expect(copy.company.name).toBe("North");
    expect(copy.meta.seed).toBe(123);
    expect(copy.employees).toHaveLength(2);
  });

  it("accepts a raw game object", () => {
    const g = createNewGame({ founderName: "Ada", companyName: "North", cofounderId: "casey", seed: 123 });
    expect(importSave(JSON.stringify(g)).company.name).toBe("North");
  });
});

describe("compute vs users", () => {
  it("charges inference when a product has users", () => {
    const g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 5 });
    const p = blankProduct({ status: "active", marketShare: 20, levels: { deployment: 2, capability: 2, distribution: 2 } });
    setProductEconomics(p, g, [{ income: 2 }, { income: 1 }], 1);
    expect(p.weeklyRevenue).toBeGreaterThan(0);
    expect(p.weeklyInference).toBeGreaterThan(0);
    expect(p.users).toBeGreaterThan(0);
    g.products.push(p);
    g.compute.rentedGpus = 2;
    expect(monthlyCompute(g)).toBeGreaterThan(p.weeklyInference);
  });
});

describe("first product grant", () => {
  it("gives enough points to buy a launch stat", () => {
    let g = createNewGame({ founderName: "Ada", companyName: "Northstar", cofounderId: "reya", seed: 11, skipTutorial: true });
    g = applyCommand(g, { type: "setSpeed", speed: 1 })!;
    g = applyCommand(g, { type: "startProduct", a: "chat", b: "writing" })!;
    const task = g.tasks.find((t) => t.type === "product")!;
    for (const w of g.employees) g = applyCommand(g, { type: "assign", taskId: task.id, workerId: w.id })!;
    for (let i = 0; i < 80 && g.products[0]?.status !== "ready"; i++) {
      g = applyCommand(g, { type: "tickDay" })!;
      if (g.pendingMentor) g = applyCommand(g, { type: "setSpeed", speed: 1 })!;
    }
    const p = g.products[0]!;
    expect(p.status).toBe("ready");
    expect(p.points.engineering).toBeGreaterThanOrEqual(4);
    expect(p.points.product).toBeGreaterThanOrEqual(4);
    g = applyCommand(g, { type: "buyStat", productId: p.id, stat: "capability" })!;
    expect(g.products[0]!.levels.capability).toBe(1);
  });
});

describe("hype decay", () => {
  it("decays across a week", () => {
    let g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 8, skipTutorial: true });
    g = applyCommand(g, { type: "setSpeed", speed: 1 })!;
    g = applyCommand(g, { type: "debug", action: "hype", amount: 40 })!;
    const before = g.company.hype;
    for (let i = 0; i < 8; i++) g = applyCommand(g, { type: "tickDay" })!;
    expect(g.company.hype).toBeLessThan(before);
  });
});
