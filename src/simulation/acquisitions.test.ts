import { describe, expect, it } from "vitest";
import { acquisitionCost, acquisitionMonthlyRevenue, totalAcquiredMonthlyRevenue } from "./acquisitions";
import { applyCommand } from "./commands";
import { monthlyArr } from "./conditions";
import { createNewGame } from "./newGame";

function game() {
  return createNewGame({
    founderName: "Ada",
    companyName: "Northstar",
    cofounderId: "reya",
    seed: 81,
    skipTutorial: true,
  });
}

describe("company acquisitions", () => {
  it("derives a visible cash price and monthly revenue projection", () => {
    const state = game();
    const competitor = state.competitors.find((candidate) => candidate.id === "openbrain")!;

    expect(acquisitionCost(competitor)).toBe(110_000_000);
    expect(acquisitionMonthlyRevenue(state, competitor)).toBeGreaterThan(0);
  });

  it("adds the acquired company's projected revenue to the company's run rate", () => {
    const state = game();
    state.unlocks.acquisitions = true;
    const competitor = state.competitors.find((candidate) => candidate.id === "glyph")!;
    const price = acquisitionCost(competitor);
    const startingCash = price + 1_000_000;
    state.company.cash = startingCash;
    const beforeArr = monthlyArr(state);
    const projectedRevenue = acquisitionMonthlyRevenue(state, competitor);

    const next = applyCommand(state, { type: "acquire", competitorId: competitor.id })!;
    const acquired = next.competitors.find((candidate) => candidate.id === competitor.id)!;

    expect(acquired.disabled).toBe(true);
    expect(next.company.acquisitions).toContain(competitor.id);
    expect(totalAcquiredMonthlyRevenue(next)).toBe(projectedRevenue);
    expect(monthlyArr(next)).toBe(beforeArr + projectedRevenue);
    expect(next.company.cash).toBe(startingCash - price + acquired.cash * 0.05);
  });

  it("does not complete an acquisition without enough cash", () => {
    const state = game();
    state.unlocks.acquisitions = true;
    const competitor = state.competitors.find((candidate) => candidate.id === "foundry")!;
    state.company.cash = acquisitionCost(competitor) - 1;

    const next = applyCommand(state, { type: "acquire", competitorId: competitor.id })!;

    expect(next.company.acquisitions).not.toContain(competitor.id);
    expect(next.competitors.find((candidate) => candidate.id === competitor.id)?.disabled).toBe(false);
  });
});
