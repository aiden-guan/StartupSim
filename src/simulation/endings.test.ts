import { describe, expect, it } from "vitest";
import { migrateGameState } from "../state/migrate";
import { createNewGame } from "./newGame";
import { detectEnding, ENDINGS } from "./endings";
import { applyCommand } from "./commands";

describe("automatic endings", () => {
  it("does not end a healthy company just because world AI capability crossed 90", () => {
    const game = createNewGame({
      founderName: "Ada",
      companyName: "Northstar",
      cofounderId: "reya",
      seed: 91,
      skipTutorial: true,
    });
    game.world.aiCapability = 100;
    game.company.cash = 860_000_000;
    game.company.valuation = 8_650_000_000;

    expect(detectEnding(game)?.id).not.toBe("unknown");
    game.clock.pauseReasons = [];
    game.clock.paused = false;
    const advanced = applyCommand(game, { type: "tickDay" })!;
    expect(advanced.endingId).toBeNull();
  });

  it("reopens saves that were stopped by the retired capability cutoff", () => {
    const game = createNewGame({
      founderName: "Ada",
      companyName: "Northstar",
      cofounderId: "reya",
      seed: 92,
      skipTutorial: true,
    });
    game.endingId = "unknown";
    game.endingNote = ENDINGS.unknown.line;
    game.clock.pauseReasons = ["ended"];
    game.clock.paused = true;

    const migrated = migrateGameState(game);

    expect(migrated.endingId).toBeNull();
    expect(migrated.endingNote).toBeNull();
    expect(migrated.clock.pauseReasons).not.toContain("ended");
  });
});
