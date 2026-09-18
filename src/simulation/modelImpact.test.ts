import { describe, expect, it } from "vitest";
import { models, modelById } from "../data/models";
import { calculateModelImpact, calculateWeeklyProductInference } from "./modelImpact";
import { createProduct } from "./products";
import { Rng } from "./rng";
import { createNewGame } from "./newGame";
import { makeTask, taskEstimate } from "./tasks";

describe("Model Impact Layer", () => {
  it("computes deterministic impact results for any model", () => {
    const model = modelById["claudius-opus"];
    expect(model).toBeDefined();

    const res1 = calculateModelImpact({ model: model! });
    const res2 = calculateModelImpact({ model: model! });

    expect(res1).toEqual(res2);
    expect(res1.devSpeedMultiplier).toBeGreaterThan(0.75);
    expect(res1.demandMultiplier).toBeGreaterThan(1.0);
  });

  it("rewards tool-heavy primitives with native tool calling models", () => {
    const opus = modelById["claudius-opus"]!; // tools: true
    const meta34b = modelById["metamind-34b"]!; // tools: false

    const opusImpact = calculateModelImpact({
      model: opus,
      product: { combo: ["agent", "workflow"] },
    });

    const metaImpact = calculateModelImpact({
      model: meta34b,
      product: { combo: ["agent", "workflow"] },
    });

    expect(opusImpact.toolsFit.hasFit).toBe(true);
    expect(opusImpact.toolsFit.modifier).toBeGreaterThan(0);

    expect(metaImpact.toolsFit.hasFit).toBe(false);
    expect(metaImpact.toolsFit.modifier).toBeLessThan(0);
  });

  it("rewards long-context models for retrieval and legal workloads", () => {
    const frontier = modelById["house-frontier"]!; // context: 10
    const local = modelById["house-small"]!; // context: 5

    const frontierImpact = calculateModelImpact({
      model: frontier,
      product: { combo: ["retrieval", "writing"], vertical: "legal" },
    });

    const localImpact = calculateModelImpact({
      model: local,
      product: { combo: ["retrieval", "writing"], vertical: "legal" },
    });

    expect(frontierImpact.contextFit.hasFit).toBe(true);
    expect(frontierImpact.contextFit.modifier).toBeGreaterThan(0);

    expect(localImpact.contextFit.hasFit).toBe(false);
    expect(localImpact.contextFit.modifier).toBeLessThan(0);
  });

  it("keeps multipliers within strict sanity bounds", () => {
    for (const model of models) {
      const impact = calculateModelImpact({
        model,
        product: { combo: ["agent", "vision"], vertical: "developer" },
      });

      expect(impact.devSpeedMultiplier).toBeGreaterThanOrEqual(0.75);
      expect(impact.devSpeedMultiplier).toBeLessThanOrEqual(1.25);

      expect(impact.demandMultiplier).toBeGreaterThanOrEqual(0.6);
      expect(impact.demandMultiplier).toBeLessThanOrEqual(1.7);

      expect(impact.estimatedReliability).toBeGreaterThanOrEqual(0.5);
      expect(impact.estimatedReliability).toBeLessThanOrEqual(1.0);
    }
  });

  it("gives open-weights / self-hosted models massive inference margin advantage", () => {
    const cloudFlagship = modelById["openbrain-o4"]!; // $28.0 / MTok
    const openWeights = modelById["metamind-34b"]!; // $1.2 / MTok

    const cloudCost = calculateWeeklyProductInference({ model: cloudFlagship, users: 1000 });
    const openCost = calculateWeeklyProductInference({ model: openWeights, users: 1000 });

    expect(openCost).toBeLessThan(cloudCost * 0.2);
  });

  it("matches devSpeedMultiplier between taskEstimate and developTask", () => {
    const g = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "marcus" });
    const fastModel = modelById["claudius-instant"]!; // speed: 8
    const slowModel = modelById["openbrain-o4"]!; // speed: 4

    const fastImpact = calculateModelImpact({ model: fastModel });
    const slowImpact = calculateModelImpact({ model: slowModel });

    expect(fastImpact.devSpeedMultiplier).toBeGreaterThan(slowImpact.devSpeedMultiplier);

    const prod = createProduct(g, "chat", "code", new Rng(1));
    prod.modelId = fastModel.id;
    g.products.push(prod);

    const task = makeTask(new Rng(1), {
      type: "product",
      name: "Chat App",
      requiredProgress: 30,
      productId: prod.id,
    });
    g.tasks.push(task);
    g.employees[0]!.taskId = task.id;

    const estFast = taskEstimate(g, task);

    // Switch to slow model
    prod.modelId = slowModel.id;
    const estSlow = taskEstimate(g, task);

    expect(estFast.daily).toBeGreaterThan(estSlow.daily);
    expect(estFast.days!).toBeLessThan(estSlow.days!);
  });

  it("shows expensive frontier model is a rational performance choice for complex products", () => {
    const frontier = modelById["claudius-opus"]!; // capability: 8, reliability: 8, tools: true, multimodal: true
    const budget = modelById["metamind-34b"]!; // capability: 6, reliability: 6, tools: false

    const frontierImpact = calculateModelImpact({
      model: frontier,
      product: { combo: ["agent", "code"], vertical: "developer" },
    });
    const budgetImpact = calculateModelImpact({
      model: budget,
      product: { combo: ["agent", "code"], vertical: "developer" },
    });

    // Frontier model delivers significantly higher demand, reliability, and retention
    expect(frontierImpact.demandMultiplier).toBeGreaterThan(budgetImpact.demandMultiplier);
    expect(frontierImpact.estimatedReliability).toBeGreaterThan(budgetImpact.estimatedReliability);
    expect(frontierImpact.retentionContribution).toBeGreaterThan(budgetImpact.retentionContribution);
  });
});

