import { describe, expect, it } from "vitest";
import { applyCommand } from "./commands";
import { createNewGame } from "./newGame";
import { normalizeLook, lookFromSeed } from "./look";
import { currentTutorialSlide } from "./tutorial";
import { migrateGameState } from "../state/migrate";
import { selectWorldView } from "../game3d/selectWorldView";
import { claimPoint, occupancyReset } from "../game3d/navigation/occupancy";

describe("character looks", () => {
  it("migrates legacy shaved hair and missing kit ids", () => {
    const look = normalizeLook({
      skin: "#f6e0c8",
      hair: "#1a1a1a",
      hairStyle: "shaved",
      top: "#111",
      pants: "#222",
      shoes: "#000",
      glasses: true,
      accessory: "badge",
      body: "slim",
      archetype: "hoodie",
    });
    expect(look.hairStyle).toBe("bald");
    expect(look.topId).toBe("hoodie");
    expect(look.glassesId).toBe("rect");
  });

  it("persists founder look and brand on new game", () => {
    const look = normalizeLook({
      skin: "#8d5524",
      hair: "#c45c26",
      hairStyle: "messy",
      top: "#1d4e3a",
      pants: "#2c2c34",
      shoes: "#ffffff",
      glasses: false,
      accessory: "headphones",
      body: "broad",
      archetype: "founder",
      topId: "hoodie",
    });
    const g = createNewGame({
      founderName: "Ada",
      companyName: "North",
      cofounderId: "reya",
      seed: 3,
      founderLook: look,
      companyBrand: { color: "#1f6b4a", mark: "spark" },
    });
    expect(g.founder.look.hairStyle).toBe("messy");
    expect(g.founder.look.topId).toBe("hoodie");
    expect(g.company.brand.mark).toBe("spark");
    expect(g.meta.schemaVersion).toBe(6);
  });

  it("lookFromSeed is deterministic", () => {
    expect(lookFromSeed("openbrain", "frontier")).toEqual(lookFromSeed("openbrain", "frontier"));
  });
});

describe("tutorial engine", () => {
  it("shows one intro slide at a time and advances", () => {
    let g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 1 });
    expect(g.pendingMentor).toBe("intro");
    expect(currentTutorialSlide(g)?.id).toBe("intro-1");
    g = applyCommand(g, { type: "advanceMentor" })!;
    expect(currentTutorialSlide(g)?.id).toBe("intro-2");
  });

  it("skipTutorial finishes all steps", () => {
    const g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 1, skipTutorial: true });
    expect(g.onboarding.tutorialEnabled).toBe(false);
    expect(g.pendingMentor).toBeNull();
    expect(g.onboarding.finished).toContain("intro");
  });

  it("can skip mid-game via command", () => {
    let g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 2 });
    g = applyCommand(g, { type: "skipTutorial" })!;
    expect(g.onboarding.tutorialEnabled).toBe(false);
    expect(g.pendingMentor).toBeNull();
  });
});

describe("world view", () => {
  it("caps rendered agents and hides remote/ai", () => {
    const g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 4 });
    g.employees[1]!.remote = true;
    const view = selectWorldView(g);
    expect(view.agents.every((a) => !a.remote)).toBe(true);
    expect(view.officeId).toBe("apartment");
  });

  it("does not let occupancy affect assignment", () => {
    occupancyReset();
    expect(claimPoint("desk-a", "visual-npc", 1)).toBe(true);
    let g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 5, skipTutorial: true });
    g = applyCommand(g, { type: "startProduct", a: "chat", b: "writing" })!;
    const task = g.tasks[0]!;
    g = applyCommand(g, { type: "assign", taskId: task.id, workerId: g.employees[0]!.id })!;
    expect(g.employees[0]!.taskId).toBe(task.id);
  });

  it("maps perk catalog objects onto the view model", () => {
    let g = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 8, skipTutorial: true });
    g = applyCommand(g, { type: "debug", action: "perk", id: "coffee" })!;
    const view = selectWorldView(g);
    expect(view.perks.some((p) => p.object === "coffee" || p.id === "coffee")).toBe(true);
  });
});

describe("save migrate", () => {
  it("fills brand and look kit fields", () => {
    const g = createNewGame({ founderName: "Ada", companyName: "North", cofounderId: "casey", seed: 9 });
    const raw = JSON.parse(JSON.stringify(g)) as typeof g;
    delete (raw.company as { brand?: unknown }).brand;
    raw.founder.look = { ...raw.founder.look, topId: undefined as never };
    const migrated = migrateGameState(raw);
    expect(migrated.company.brand.color).toBeTruthy();
    expect(migrated.founder.look.topId).toBeTruthy();
    expect(migrated.settings.graphics).toBe("high");
  });
});
