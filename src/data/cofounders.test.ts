import { describe, expect, it } from "vitest";
import { cofounders, resolveCofounder } from "./cofounders";
import { traitById } from "./traits";
import { createNewGame } from "../simulation/newGame";
import { migrateGameState } from "../state/migrate";

const EXPECTED_IDS = [
  "steve-wozniak",
  "paul-allen",
  "larry-page",
  "sergey-brin",
  "dustin-moskovitz",
  "greg-brockman",
  "marc-randolph",
  "eduardo-saverin",
];

describe("cofounder roster", () => {
  it("contains exactly the approved eight cofounders with unique playable traits", () => {
    expect(cofounders.map((cofounder) => cofounder.id)).toEqual(EXPECTED_IDS);
    expect(new Set(cofounders.map((cofounder) => cofounder.trait)).size).toBe(cofounders.length);
    for (const cofounder of cofounders) expect(traitById[cofounder.trait]).toBeDefined();
  });

  it("does not include an option that is at least as good at everything and asks no more equity", () => {
    const baseValues = cofounders.map((cofounder) => Object.values(cofounder.skills));
    const effectiveValues = cofounders.map((cofounder) => {
      const bonuses = traitById[cofounder.trait]!.worker ?? {};
      return Object.entries(cofounder.skills).map(([skill, value]) => value + (bonuses[skill as keyof typeof bonuses] ?? 0));
    });
    for (const values of [baseValues, effectiveValues]) {
      for (let candidate = 0; candidate < cofounders.length; candidate += 1) {
        for (let other = 0; other < cofounders.length; other += 1) {
          if (candidate === other) continue;
          const dominatesSkills = values[candidate]!.every((value, index) => value >= values[other]![index]!);
          const asksNoMoreEquity = cofounders[candidate]!.equity <= cofounders[other]!.equity;
          expect(dominatesSkills && asksNoMoreEquity).toBe(false);
        }
      }
    }
  });

  it("resolves legacy setup IDs without restoring fictional roster options", () => {
    expect(resolveCofounder("reya").id).toBe("dustin-moskovitz");
    expect(resolveCofounder("arjun").id).toBe("larry-page");
    expect(resolveCofounder("casey").id).toBe("eduardo-saverin");
    expect(resolveCofounder("samir").id).toBe("marc-randolph");
  });

  it("keeps the employee snapshot in an existing save intact", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "North", cofounderId: "steve-wozniak", seed: 9 });
    const savedCofounder = game.employees.find((employee) => employee.id === game.cofounderId)!;
    savedCofounder.name = "Historical Cofounder";
    savedCofounder.title = "Original Role";
    savedCofounder.traits = ["ships-it", "tireless"];
    savedCofounder.look.top = "#123456";

    const migrated = migrateGameState(game);
    const migratedCofounder = migrated.employees.find((employee) => employee.id === migrated.cofounderId)!;
    expect(migratedCofounder.name).toBe("Historical Cofounder");
    expect(migratedCofounder.title).toBe("Original Role");
    expect(migratedCofounder.traits).toEqual(["ships-it", "tireless"]);
    expect(migratedCofounder.look.top).toBe("#123456");
  });
});
