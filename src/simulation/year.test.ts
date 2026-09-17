import { describe, expect, it } from "vitest";
import { applyCommand } from "./commands";
import { createNewGame } from "./newGame";
import { monthlyArr } from "./conditions";

describe("headless year", () => {
  it("keeps cash finite and can earn after a launch", () => {
    let g = createNewGame({ founderName: "Ada", companyName: "Northstar", cofounderId: "reya", seed: 2022 });
    g = applyCommand(g, { type: "dismissMentor" })!;
    g = applyCommand(g, { type: "startProduct", a: "chat", b: "writing" })!;
    const task = g.tasks.find((t) => t.type === "product")!;
    for (const w of g.employees) {
      g = applyCommand(g, { type: "assign", taskId: task.id, workerId: w.id })!;
    }
    for (let i = 0; i < 80 && g.products[0]?.status !== "ready"; i++) {
      g = applyCommand(g, { type: "tickDay" })!;
      if (g.pendingMentor) g = applyCommand(g, { type: "dismissMentor" })!;
    }
    expect(g.products[0]?.status).toBe("ready");
    const productId = g.products[0]!.id;
    g = applyCommand(g, { type: "buyStat", productId, stat: "deployment" })!;
    g = applyCommand(g, { type: "buyStat", productId, stat: "capability" })!;
    g = applyCommand(g, { type: "buyStat", productId, stat: "distribution" })!;
    g = applyCommand(g, { type: "enterMarket", productId })!;
    for (let i = 0; i < 14 && g.marketBattle; i++) {
      const piece = g.marketBattle.pieces.find((p) => p.owner === "player" && p.moves > 0);
      if (piece) {
        g = applyCommand(g, { type: "selectPiece", pieceId: piece.id })!;
        g = applyCommand(g, { type: "marketCapture" })!;
      }
      g = applyCommand(g, { type: "marketEndTurn" })!;
    }
    expect(g.marketBattle).toBeNull();
    expect(g.products[0]?.status).toBe("active");
    for (let i = 0; i < 365; i++) {
      g = applyCommand(g, { type: "tickDay" })!;
      if (g.pendingMentor) g = applyCommand(g, { type: "dismissMentor" })!;
      if (g.endingId) break;
    }
    expect(Number.isFinite(g.company.cash)).toBe(true);
    expect(g.company.cash).not.toBe(Number.POSITIVE_INFINITY);
    expect(g.stats.productsLaunched).toBeGreaterThanOrEqual(1);
    expect(monthlyArr(g) + g.company.lifetimeRevenue).toBeGreaterThanOrEqual(0);
  });
});
