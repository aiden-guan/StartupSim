import { describe, expect, it } from "vitest";
import { BALANCE } from "../config/balance";
import { lobbies } from "../data/lobbies";
import { locations } from "../data/locations";
import { offices } from "../data/offices";
import { perks } from "../data/perks";
import { promotionCost, promos } from "../data/promos";
import { recruitingChannels, recruitingCost } from "../data/recruiting";
import { specialProjects } from "../data/specialProjects";
import { technologies } from "../data/technologies";
import { verticals } from "../data/verticals";
import { money } from "../ui/format";
import { DATA_CENTER_MONTHLY_COST, DATA_CENTER_WEEKLY_COVERAGE, fixedComputeCost, inferenceCoverage, monthlyRent } from "./derived";
import { createNewGame } from "./newGame";
import { createProduct, marketScaleMultiplier, setProductEconomics } from "./products";
import { Rng } from "./rng";

function game() {
  return createNewGame({
    founderName: "Ada",
    companyName: "Northstar",
    cofounderId: "reya",
    seed: 420,
    skipTutorial: true,
  });
}

describe("long-form economy progression", () => {
  it("reserves the $1T cash target for the terminal CEO project", () => {
    const terminal = specialProjects.find((project) => project.id === "automate-ceo")!;
    const nonTerminalCosts = [
      ...offices.slice(1).map((office) => office.cost),
      ...specialProjects.filter((project) => project.id !== terminal.id).map((project) => project.cost),
      ...technologies.map((technology) => technology.cost),
      ...verticals.map((vertical) => vertical.cost),
      ...locations.map((location) => location.cost),
      ...lobbies.map((lobby) => lobby.cost),
      ...perks.flatMap((perk) => perk.upgrades.map((upgrade) => upgrade.cost)),
    ];
    const nonTerminalTotal = nonTerminalCosts.reduce((sum, cost) => sum + cost, 0);

    expect(terminal.cost).toBe(BALANCE.ENDGAME_CASH_TARGET);
    expect(Math.max(...nonTerminalCosts)).toBeLessThan(terminal.cost);
    expect(nonTerminalTotal).toBeGreaterThan(175_000_000_000);
    expect(nonTerminalTotal).toBeLessThan(250_000_000_000);
    expect(money(terminal.cost)).toBe("$1.00T");
  });

  it("keeps each research era financially distinct", () => {
    const ranges = [1, 2, 3, 4, 5].map((era) => {
      const costs = technologies.filter((technology) => technology.era === era).map((technology) => technology.cost);
      return { min: Math.min(...costs), max: Math.max(...costs) };
    });

    for (let index = 1; index < ranges.length; index += 1) {
      expect(ranges[index]!.min).toBeGreaterThan(ranges[index - 1]!.max);
    }
  });

  it("grows the addressable market over time without removing the ceiling", () => {
    const early = game();
    const product = createProduct(early, "chat", "writing", new Rng(420));
    product.status = "active";
    product.marketShare = 30;
    product.levels = { deployment: 3, capability: 3, distribution: 3 };
    const late = structuredClone(early);
    late.clock.date = { year: 2034, month: 8, day: 1 };
    const earlyProduct = structuredClone(product);
    const lateProduct = structuredClone(product);
    const captured = Array.from({ length: 12 }, (_, income) => ({ income: income % 4 }));

    setProductEconomics(earlyProduct, early, captured, 2);
    setProductEconomics(lateProduct, late, captured, 2);

    expect(marketScaleMultiplier(early)).toBe(1);
    expect(marketScaleMultiplier(late)).toBeGreaterThan(8);
    expect(lateProduct.weeklyRevenue).toBeGreaterThan(earlyProduct.weeklyRevenue * 8);
    expect(lateProduct.users).toBeGreaterThan(earlyProduct.users * 8);
    late.clock.date = { year: 2200, month: 1, day: 1 };
    expect(marketScaleMultiplier(late)).toBe(BALANCE.MARKET_SCALE_CAP);
  });

  it("lets a mature late-game product fund billion-dollar infrastructure without trivializing $1T", () => {
    const state = game();
    state.clock.date = { year: 2034, month: 8, day: 1 };
    state.company.technologies = technologies.map((technology) => technology.id);
    state.company.verticals = verticals.map((vertical) => vertical.id);
    state.company.locations = locations.map((location) => location.id);
    state.company.hype = 80;
    state.company.trust = 80;
    state.company.expertise["auto-research"] = 11;
    state.company.expertise["self-improve"] = 11;
    state.ownedModels.push("house-frontier");
    const product = createProduct(state, "auto-research", "self-improve", new Rng(421));
    product.status = "active";
    product.marketShare = 55;
    product.levels = { deployment: 5, capability: 5, distribution: 5 };
    product.businessModel = "enterprise";
    product.gtmStrategy = "enterprise-sales";
    product.modelId = "house-frontier";

    setProductEconomics(product, state, Array.from({ length: 12 }, () => ({ income: 3 })), 2);

    expect(product.weeklyRevenue).toBeGreaterThan(500_000_000);
    expect(product.weeklyRevenue).toBeLessThan(25_000_000_000);
    expect(BALANCE.ENDGAME_CASH_TARGET / (product.weeklyRevenue * 52)).toBeGreaterThan(1);
    expect(BALANCE.ENDGAME_CASH_TARGET / (product.weeklyRevenue * 52)).toBeLessThan(20);
  });

  it("keeps repeatable campaigns and recruiting meaningful as offices scale", () => {
    const keynote = promos.find((promo) => promo.id === "keynote")!;
    const executiveSearch = recruitingChannels.find((channel) => channel.id === "exec")!;

    expect(promotionCost(keynote, 0)).toBe(keynote.cost);
    expect(promotionCost(keynote, 5)).toBe(3_750_000_000);
    expect(recruitingCost(executiveSearch, 0)).toBe(executiveSearch.cost);
    expect(recruitingCost(executiveSearch, 5)).toBe(67_500_000);
  });

  it("charges the monthly rent advertised by purchased locations", () => {
    const state = game();
    state.company.officeLevel = 2;
    state.company.locations = ["sf", "bangalore"];

    expect(monthlyRent(state)).toBe(
      offices[2]!.rent + locations.find((location) => location.id === "sf")!.rent + locations.find((location) => location.id === "bangalore")!.rent,
    );
  });

  it("gives late infrastructure a multi-year payback instead of a decorative benefit", () => {
    const state = game();
    const baselineCoverage = inferenceCoverage(state);
    const baselineFixedCost = fixedComputeCost(state);
    state.compute.dataCenters = 1;
    const annualNetCoverage = (DATA_CENTER_WEEKLY_COVERAGE * 4.33 - DATA_CENTER_MONTHLY_COST) * 12;
    const projectCost = specialProjects.find((project) => project.id === "data-center")!.cost;

    expect(inferenceCoverage(state) - baselineCoverage).toBe(DATA_CENTER_WEEKLY_COVERAGE);
    expect(fixedComputeCost(state) - baselineFixedCost).toBe(DATA_CENTER_MONTHLY_COST);
    expect(projectCost / annualNetCoverage).toBeGreaterThan(2);
    expect(projectCost / annualNetCoverage).toBeLessThan(4);
  });
});
