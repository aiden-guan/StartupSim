import { describe, expect, it } from "vitest";
import { BALANCE } from "../config/balance";
import { createNewGame } from "./newGame";
import { applyCommand } from "./commands";
import type { GameState } from "./types";

function bootGame(seed = 101): GameState {
  const g = createNewGame({ founderName: "Sarah", companyName: "HyperScale", cofounderId: "reya", seed, skipTutorial: true });
  return structuredClone(applyCommand(g, { type: "setSpeed", speed: 1 })!);
}

describe("Delegated Market Launch and Subsequent Product Lifecycle", () => {
  it("clears productReady on delegated launch and allows subsequent products to progress", () => {
    let state = bootGame(42);
    // Unpause manual pause from boot
    state = applyCommand(state, { type: "setPaused", paused: false })!;
    expect(state.clock.paused).toBe(false);

    // Satisfy MIN_PRODUCTS_BEFORE_DELEGATE so delegation is permitted
    state = structuredClone(state);
    state.company.productsLaunched = BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE;

    // Start a product
    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product = state.products[0]!;
    const task = state.tasks.find((t) => t.productId === product.id)!;
    expect(task).toBeDefined();

    // Assign employees
    for (const emp of state.employees) {
      state = applyCommand(state, { type: "assign", taskId: task.id, workerId: emp.id })!;
    }

    // Tick until development completes and product reaches ready
    for (let i = 0; i < 90 && state.products[0]?.status !== "ready"; i++) {
      state = applyCommand(state, { type: "tickDay" })!;
    }

    // 1. Confirm product is ready
    expect(state.products[0]?.status).toBe("ready");

    // 2. Confirm product-ready pause is active and game is paused
    expect(state.clock.pauseReasons).toContain("productReady");
    expect(state.clock.paused).toBe(true);

    // 3. Delegate the launch
    state = applyCommand(state, { type: "delegateMarket", productId: product.id, strategy: "balanced" })!;

    // 4. Verify product becomes active and market results are produced
    expect(state.products[0]?.status).toBe("active");
    expect(state.marketResult).not.toBeNull();
    expect(state.marketResult?.productId).toBe(product.id);

    // 5. Verify "productReady" is gone and "results" is active
    expect(state.clock.pauseReasons).not.toContain("productReady");
    expect(state.clock.pauseReasons).toContain("results");

    // 6. Dismiss / continue market results
    state = applyCommand(state, { type: "continueMarketResults" })!;
    expect(state.marketResult).toBeNull();
    expect(state.clock.pauseReasons).not.toContain("results");

    // 7. Resume normal time
    state = applyCommand(state, { type: "setPaused", paused: false })!;
    expect(state.clock.paused).toBe(false);
    expect(state.clock.pauseReasons).not.toContain("productReady");
    expect(state.clock.pauseReasons).not.toContain("market");
    expect(state.clock.pauseReasons).not.toContain("results");

    // 8. Create a NEW product
    state = applyCommand(state, { type: "startProduct", a: "search", b: "image" })!;
    expect(state.products.length).toBe(2);
    const newProduct = state.products[1]!;
    const newTask = state.tasks.find((t) => t.productId === newProduct.id)!;
    expect(newTask).toBeDefined();
    const initialProgress = newTask.progress;

    // 9. Assign a valid employee to the new task
    const worker = state.employees[0]!;
    state = applyCommand(state, { type: "assign", taskId: newTask.id, workerId: worker.id })!;
    expect(state.employees.find((e) => e.id === worker.id)?.taskId).toBe(newTask.id);

    // 10. Tick time and assert progress increases
    state = applyCommand(state, { type: "tickDay" })!;
    const updatedTask = state.tasks.find((t) => t.id === newTask.id)!;
    expect(updatedTask.progress).toBeGreaterThan(initialProgress);

    // 11. Assert worker is still attached
    expect(state.employees.find((e) => e.id === worker.id)?.taskId).toBe(newTask.id);

    // 12. Assert no stale locks survive
    expect(state.clock.pauseReasons).not.toContain("productReady");
    expect(state.clock.pauseReasons).not.toContain("market");
    expect(state.clock.pauseReasons).not.toContain("results");
  });

  it("preserves identical manual launch lifecycle behavior", () => {
    let state = bootGame(43);
    state = applyCommand(state, { type: "setPaused", paused: false })!;

    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product = state.products[0]!;
    const task = state.tasks.find((t) => t.productId === product.id)!;
    for (const emp of state.employees) {
      state = applyCommand(state, { type: "assign", taskId: task.id, workerId: emp.id })!;
    }

    for (let i = 0; i < 90 && state.products[0]?.status !== "ready"; i++) {
      state = applyCommand(state, { type: "tickDay" })!;
    }

    expect(state.products[0]?.status).toBe("ready");
    expect(state.clock.pauseReasons).toContain("productReady");

    // Enter market manually
    state = applyCommand(state, { type: "enterMarket", productId: product.id })!;
    expect(state.clock.pauseReasons).not.toContain("productReady");
    expect(state.clock.pauseReasons).toContain("market");
    expect(state.marketBattle).not.toBeNull();
  });
});
