import { describe, expect, it } from "vitest";
import { createNewGame } from "./newGame";
import { workerSkill } from "./workers";

describe("department automation", () => {
  it("amplifies employees in the configured department by up to 50%", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "dustin-moskovitz", skipTutorial: true });
    const worker = game.employees[0]!;
    const baseline = workerSkill(worker, game, "engineering");

    game.company.automation[worker.department] = 100;
    expect(workerSkill(worker, game, "engineering")).toBeCloseTo(baseline * 1.5, 8);

    game.company.automation[worker.department] = 0;
    const otherDepartment = worker.department === "legal" ? "finance" : "legal";
    game.company.automation[otherDepartment] = 100;
    expect(workerSkill(worker, game, "engineering")).toBeCloseTo(baseline, 8);
  });
});
