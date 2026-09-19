import { describe, expect, it } from "vitest";
import { createNewGame } from "./newGame";
import { createProduct, harvestProduct } from "./products";
import { monthlyArr } from "./conditions";
import { monthlyBurn, monthlyExpenseBreakdown } from "./derived";
import { tickDay } from "./tick";
import { Rng } from "./rng";

function serviceProduct() {
  const game = createNewGame({
    founderName: "Ada",
    companyName: "North",
    cofounderId: "reya",
    seed: 41,
    skipTutorial: true,
  });
  const product = createProduct(game, "chat", "writing", new Rng(41));
  product.status = "declining";
  product.weeklyRevenue = 1_000;
  product.weeklyInference = 200;
  product.weeklyOperatingCost = 50;
  product.retentionRate = 0.5;
  product.rampWeeks = 0;
  game.products.push(product);
  return { game, product };
}

describe("finance tracking", () => {
  it("keeps declining products in the revenue and cost run rate", () => {
    const { game } = serviceProduct();
    const forecast = monthlyExpenseBreakdown(game);

    expect(monthlyArr(game)).toBeCloseTo(4_330, 5);
    expect(forecast.inference).toBeCloseTo(866, 5);
    expect(forecast.productOperations).toBeCloseTo(216.5, 5);
    expect(monthlyBurn(game)).toBe(0);
  });

  it("records the usage consumed before weekly product aging", () => {
    const { product } = serviceProduct();
    product.status = "active";
    const result = harvestProduct(product, new Rng(7));

    expect(result.inference).toBe(200);
    expect(product.weeklyInference).toBe(100);
    expect(result.operations).toBe(50);
  });

  it("reconciles the statement total with one-time cash movements", () => {
    const game = createNewGame({
      founderName: "Ada",
      companyName: "North",
      cofounderId: "reya",
      seed: 42,
      skipTutorial: true,
    });
    game.company.seenMarket = true;
    game.pendingMentor = null;
    game.company.cash -= 5_000;

    const next = tickDay(game);
    const breakdown = next.company.lastMonthlyBreakdown;
    const operatingNet = breakdown.revenue - breakdown.inference - breakdown.productOperations - breakdown.payroll - breakdown.office - breakdown.fixedCompute - breakdown.companyOperations;

    expect(next.clock.date).toEqual({ year: 2022, month: 12, day: 1 });
    expect(next.company.lastMonthlyCashChange).toBe(-7_600);
    expect(next.company.lastMonthlyCashChange! - operatingNet).toBe(-5_000);
    expect(next.company.cashAtLastStatement).toBe(next.company.cash);
  });
});
