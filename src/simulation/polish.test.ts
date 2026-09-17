import { describe, expect, it } from "vitest";
import { availableGtmStrategies, GTM_STRATEGIES } from "../data/gtm";
import { NEWS_CHAINS } from "../data/news";
import { calculateMarketEntryResult, startMarketSession } from "../market/marketMap";
import { applyEffect } from "./effects";
import { monthlyCompanyOperations } from "./derived";
import { gtmFitAnalysis } from "./gtm";
import { createNewGame } from "./newGame";
import { createProduct } from "./products";
import { Rng } from "./rng";
import { buildPoachMail } from "./tick";

function readyProduct(verticalCombo: [string, string] = ["chat", "writing"]) {
  const state = createNewGame({ founderName: "Ada", companyName: "North", cofounderId: "reya", seed: 21, skipTutorial: true });
  const rng = new Rng(21);
  const product = createProduct(state, verticalCombo[0], verticalCombo[1], rng);
  product.status = "ready";
  product.levels = { deployment: 1, capability: 2, distribution: 1 };
  state.products.push(product);
  return { state, product, rng };
}

describe("GTM strategy depth", () => {
  it("offers product-dependent routes", () => {
    const consumer = readyProduct();
    const developer = readyProduct(["code", "agent"]);
    const consumerIds = availableGtmStrategies(consumer.product).map((item) => item.id);
    const developerIds = availableGtmStrategies(developer.product).map((item) => item.id);
    expect(consumerIds).toContain("direct-consumer");
    expect(developerIds).toContain("developer-first");
    expect(developerIds).not.toContain("direct-consumer");
  });

  it("makes company execution change enterprise fit", () => {
    const { state, product } = readyProduct();
    product.gtmStrategy = "enterprise-sales";
    const before = gtmFitAnalysis(state, product, "enterprise-sales").score;
    state.company.cash = 2_000_000;
    state.employees[1]!.department = "sales";
    state.company.trust = 82;
    const after = gtmFitAnalysis(state, product, "enterprise-sales").score;
    expect(after).toBeGreaterThan(before);
  });

  it("keeps a sound early product contribution-positive while charging operating costs", () => {
    const { state, product, rng } = readyProduct();
    const session = startMarketSession(state, product, rng);
    session.nodes[0]!.playerShare = 80;
    session.nodes[1]!.playerShare = 55;
    session.nodes[2]!.playerShare = 40;
    const result = calculateMarketEntryResult(state, session, product);
    expect(result.operatingCost).toBeGreaterThan(0);
    expect(result.netContribution).toBeGreaterThan(0);
  });

  it("gives strategies distinct retention, cost, and ramp identities", () => {
    expect(GTM_STRATEGIES["enterprise-sales"].weeklyRetention).toBeGreaterThan(GTM_STRATEGIES["direct-consumer"].weeklyRetention);
    expect(GTM_STRATEGIES["enterprise-sales"].fixedMonthlyCost).toBeGreaterThan(GTM_STRATEGIES["product-led"].fixedMonthlyCost);
    expect(GTM_STRATEGIES["enterprise-sales"].rampWeeks).toBeGreaterThan(GTM_STRATEGIES["product-led"].rampWeeks);
  });
});

describe("scaling pressure and event effects", () => {
  it("shows the real employee, offer, payroll change, and runway impact before a poaching decision", () => {
    const { state, rng } = readyProduct();
    state.company.cash = 50_000;
    const engineer = { ...structuredClone(state.employees[1]!), id: "eng-1", name: "Mina Patel", role: "employee" as const, salary: 150_000 };
    state.employees.push(engineer);
    const mail = buildPoachMail(state, rng, {
      id: "poach-test",
      at: { ...state.clock.date },
      from: "Mina Patel",
      subject: "Outside offer",
      body: "",
      read: false,
      requiresResponse: true,
    });
    expect(mail?.subject).toContain("Mina Patel");
    expect(mail?.context?.map((item) => item.label)).toEqual(["Current salary", "Competing offer", "Added payroll", "Runway impact"]);
    expect(mail?.choices?.[0]?.effects[0]).toMatchObject({ type: "setSalary", value: { employeeId: "eng-1", salary: 210_000 } });
    expect(mail?.warning).toContain("runway");
  });

  it("makes management complexity rise nonlinearly with scale", () => {
    const small = readyProduct().state;
    const large = structuredClone(small);
    const template = large.employees[1]!;
    for (let index = 0; index < 18; index += 1) large.employees.push({ ...structuredClone(template), id: `e-${index}`, role: "employee", department: "engineering" });
    expect(monthlyCompanyOperations(small)).toBe(0);
    expect(monthlyCompanyOperations(large)).toBeGreaterThan(10_000);
  });

  it("applies exposed demand shocks without touching unrelated products", () => {
    const consumer = readyProduct();
    consumer.product.status = "active";
    consumer.product.weeklyRevenue = 10_000;
    consumer.product.users = 1_000;
    applyEffect(consumer.state, { type: "demand", value: { verticals: ["developer"], multiplier: 0.8 } });
    expect(consumer.product.weeklyRevenue).toBe(10_000);
    applyEffect(consumer.state, { type: "demand", value: { verticals: ["consumer"], multiplier: 0.8 } });
    expect(consumer.product.weeklyRevenue).toBe(8_000);
  });

  it("defines multi-stage news with real simulation impacts", () => {
    expect(NEWS_CHAINS.some((chain) => chain.stages.length >= 3)).toBe(true);
    expect(NEWS_CHAINS.every((chain) => chain.stages.some((stage) => stage.effects?.length))).toBe(true);
    expect(NEWS_CHAINS.flatMap((chain) => chain.stages).some((stage) => stage.effects?.some((effect) => effect.type === "demand" || effect.type === "inferenceMultiplier"))).toBe(true);
  });
});
