import { describe, expect, it } from "vitest";
import { createNewGame } from "./newGame";
import { applyCommand } from "./commands";
import { BALANCE } from "../config/balance";

function createTestGame() {
  const g = createNewGame({ founderName: "Aiden", companyName: "Acme AI", cofounderId: "casey", seed: 42 });
  // Skip tutorial to allow freely starting products
  g.onboarding.tutorialEnabled = false;
  return g;
}

describe("product renaming and character limit", () => {
  it("allows renaming an existing product", () => {
    let state = createTestGame();
    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product = state.products[0]!;
    expect(product.name).toBe("Copywright");

    state = applyCommand(state, { type: "renameProduct", productId: product.id, name: "OmniWriter" })!;
    expect(state.products[0]!.name).toBe("OmniWriter");
  });

  it("enforces character limit on renaming", () => {
    let state = createTestGame();
    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product = state.products[0]!;

    const longName = "A".repeat(BALANCE.MAX_PRODUCT_NAME_LENGTH + 15);
    state = applyCommand(state, { type: "renameProduct", productId: product.id, name: longName })!;

    expect(state.products[0]!.name.length).toBe(BALANCE.MAX_PRODUCT_NAME_LENGTH);
    expect(state.products[0]!.name).toBe("A".repeat(BALANCE.MAX_PRODUCT_NAME_LENGTH));
  });

  it("trims whitespace from renamed product name", () => {
    let state = createTestGame();
    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product = state.products[0]!;

    state = applyCommand(state, { type: "renameProduct", productId: product.id, name: "   Scribe AI   " })!;
    expect(state.products[0]!.name).toBe("Scribe AI");
  });

  it("rejects empty or whitespace-only rename", () => {
    let state = createTestGame();
    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product = state.products[0]!;

    state = applyCommand(state, { type: "renameProduct", productId: product.id, name: "   " })!;
    expect(state.products[0]!.name).toBe("Copywright");

    state = applyCommand(state, { type: "renameProduct", productId: product.id, name: "" })!;
    expect(state.products[0]!.name).toBe("Copywright");
  });

  it("updates the active build task name when renaming", () => {
    let state = createTestGame();
    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product = state.products[0]!;
    const task = state.tasks.find((t) => t.productId === product.id)!;
    expect(task.name).toBe("Build Copywright");

    state = applyCommand(state, { type: "renameProduct", productId: product.id, name: "PromptCraft" })!;
    const updatedTask = state.tasks.find((t) => t.productId === product.id)!;
    expect(updatedTask.name).toBe("Build PromptCraft");
  });

  it("migrates company.versions key when renaming an iterated product", () => {
    let state = createTestGame();
    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product = state.products[0]!;
    state = structuredClone(state);
    state.company.versions["Copywright"] = 2;

    state = applyCommand(state, { type: "renameProduct", productId: product.id, name: "Copywright Pro" })!;
    expect(state.company.versions["Copywright"]).toBeUndefined();
    expect(state.company.versions["Copywright Pro"]).toBe(2);
  });

  it("allows starting a product with a custom name", () => {
    let state = createTestGame();
    state = applyCommand(state, {
      type: "startProduct",
      a: "chat",
      b: "writing",
      name: "Custom Pen",
    })!;
    expect(state.products[0]!.name).toBe("Custom Pen");
    expect(state.tasks[0]!.name).toBe("Build Custom Pen");
  });

  it("clamps custom name to MAX_PRODUCT_NAME_LENGTH when starting product", () => {
    let state = createTestGame();
    const longName = "Super Long Revolutionary AI Assistant Product Name That Exceeds The Limit";
    state = applyCommand(state, {
      type: "startProduct",
      a: "chat",
      b: "writing",
      name: longName,
    })!;
    expect(state.products[0]!.name.length).toBe(BALANCE.MAX_PRODUCT_NAME_LENGTH);
    expect(state.products[0]!.name).toBe(longName.slice(0, BALANCE.MAX_PRODUCT_NAME_LENGTH));
  });

  it("falls back to default recipe name when starting with whitespace name", () => {
    let state = createTestGame();
    state = applyCommand(state, {
      type: "startProduct",
      a: "chat",
      b: "writing",
      name: "    ",
    })!;
    expect(state.products[0]!.name).toBe("Copywright");
  });
});
