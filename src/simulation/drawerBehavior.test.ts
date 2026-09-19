import { describe, expect, it, vi } from "vitest";
import { createNewGame } from "./newGame";
import { createProduct } from "./products";
import { Rng } from "./rng";
import { useGame } from "../state/store";

vi.mock("../state/save", () => ({
  writeSave: vi.fn().mockResolvedValue(undefined),
  readSave: vi.fn().mockResolvedValue(null),
  listSaves: vi.fn().mockResolvedValue([]),
}));

describe("Product completion screen switching and onboarding", () => {
  it("does not automatically switch drawer to products when a product finishes during normal gameplay", () => {
    const game = createNewGame({
      founderName: "Sarah",
      companyName: "HyperScale",
      cofounderId: "reya",
      skipTutorial: true,
    });
    game.settings.autosave = false;

    const p = createProduct(game, "chat", "writing", new Rng(1));
    p.status = "development";
    game.products = [p];

    // Initialize store
    useGame.getState().loadGame(game);
    useGame.getState().setDrawer("tasks");
    expect(useGame.getState().drawer).toBe("tasks");

    // Manually create an artificial prev/next transition where product finishes
    // Dispatch a command that causes status to become ready
    const draft = structuredClone(useGame.getState().game!);
    draft.products[0]!.status = "ready";
    useGame.setState({ game: draft });

    // When a subsequent tick or command occurs with product ready
    useGame.getState().dispatch({ type: "pauseLock", reason: "settings", enabled: false });

    // Drawer should still be tasks, NOT switched to products
    expect(useGame.getState().drawer).toBe("tasks");
  });

  it("still properly sets drawer to products during onboarding when tutorial requires it", () => {
    // Fresh game with tutorial enabled
    const game = createNewGame({
      founderName: "Sarah",
      companyName: "HyperScale",
      cofounderId: "reya",
      skipTutorial: false,
    });
    game.settings.autosave = false;

    // Start first product
    useGame.getState().loadGame(game);

    // Progress through tutorial steps
    for (let i = 0; i < 4; i++) {
      useGame.getState().dispatch({ type: "advanceMentor" });
    }
    useGame.getState().dispatch({ type: "tutorialEvent", action: "openedProductLab" });
    useGame.getState().dispatch({ type: "advanceMentor" });
    useGame.getState().dispatch({ type: "selectPrimitive", slot: "a", primitive: "chat" });
    useGame.getState().dispatch({ type: "selectPrimitive", slot: "b", primitive: "writing" });
    useGame.getState().dispatch({ type: "startProduct", a: "chat", b: "writing" });

    // Assign founders
    const state = useGame.getState().game!;
    const task = state.tasks[0]!;
    for (const w of state.employees) {
      useGame.getState().dispatch({ type: "assign", workerId: w.id, taskId: task.id });
    }
    useGame.getState().dispatch({ type: "advanceMentor" });
    useGame.getState().dispatch({ type: "setSpeed", speed: 1 });

    // Progress until product is ready
    while (useGame.getState().game!.products[0]?.status === "development") {
      useGame.getState().dispatch({ type: "tickDay" });
    }

    const readyProduct = useGame.getState().game!.products[0]!;
    expect(readyProduct.status).toBe("ready");

    // During onboarding, the tutorial designer step requires 'products' workspace
    expect(useGame.getState().game!.pendingMentor).toBe("designer");
    expect(useGame.getState().drawer).toBe("products");
  });

  it("does not automatically switch drawer to tasks/product lab when purchasing research", () => {
    const game = createNewGame({
      founderName: "Sarah",
      companyName: "HyperScale",
      cofounderId: "dustin-moskovitz",
      skipTutorial: true,
    });
    game.company.cash = 100_000;
    game.unlocks.research = true;
    useGame.getState().loadGame(game);
    useGame.getState().setDrawer("research");
    expect(useGame.getState().drawer).toBe("research");

    useGame.getState().dispatch({ type: "startResearch", techId: "prompt-engineering" });

    expect(useGame.getState().drawer).toBe("research");
    expect(useGame.getState().game?.tasks.some((t) => t.techId === "prompt-engineering")).toBe(true);
  });
});
