import { describe, expect, it } from "vitest";
import { applyCommand } from "./commands";
import { createNewGame } from "./newGame";
import { monthlyArr } from "./conditions";

describe("headless year", () => {
  it("keeps cash finite and can earn after a launch", () => {
    let g = createNewGame({ founderName: "Ada", companyName: "Northstar", cofounderId: "reya", seed: 2022, skipTutorial: true });
    g = applyCommand(g, { type: "setSpeed", speed: 1 })!;
    g = applyCommand(g, { type: "startProduct", a: "chat", b: "writing" })!;
    const task = g.tasks.find((t) => t.type === "product")!;
    for (const w of g.employees) {
      g = applyCommand(g, { type: "assign", taskId: task.id, workerId: w.id })!;
    }
    for (let i = 0; i < 80 && g.products[0]?.status !== "ready"; i++) {
      g = applyCommand(g, { type: "tickDay" })!;
      if (g.pendingMentor) g = applyCommand(g, { type: "setSpeed", speed: 1 })!;
    }
    expect(g.products[0]?.status).toBe("ready");
    const productId = g.products[0]!.id;
    g = applyCommand(g, { type: "buyStat", productId, stat: "deployment" })!;
    g = applyCommand(g, { type: "buyStat", productId, stat: "capability" })!;
    g = applyCommand(g, { type: "buyStat", productId, stat: "distribution" })!;
    g = applyCommand(g, { type: "enterMarket", productId })!;
    for (let i = 0; i < 14 && g.marketBattle; i++) {
      const node = g.marketBattle.nodes.find((n) => n.id === g.marketBattle!.selectedNodeId) || g.marketBattle.nodes[0];
      if (node) {
        g = applyCommand(g, { type: "selectMarketNode", nodeId: node.id })!;
        g = applyCommand(g, { type: "marketReinforce", nodeId: node.id })!;
      } else {
        g = applyCommand(g, { type: "marketEndTurn" })!;
      }
    }
    expect(g.marketBattle).toBeNull();
    expect(g.products[0]?.status).toBe("active");
    g = applyCommand(g, { type: "continueMarketResults" })!;
    g = applyCommand(g, { type: "setSpeed", speed: 1 })!;
    for (let i = 0; i < 365; i++) {
      g = applyCommand(g, { type: "tickDay" })!;
      if (g.pendingMentor) g = applyCommand(g, { type: "setSpeed", speed: 1 })!;
      if (g.endingId) break;
    }
    expect(g.clock.tick).toBeGreaterThan(300);
    expect(g.company.lifetimeRevenue).toBeGreaterThan(0);
    expect(Number.isFinite(g.company.cash)).toBe(true);
    expect(g.company.cash).not.toBe(Number.POSITIVE_INFINITY);
    expect(g.stats.productsLaunched).toBeGreaterThanOrEqual(1);
    expect(monthlyArr(g) + g.company.lifetimeRevenue).toBeGreaterThanOrEqual(0);
  });
});
