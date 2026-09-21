import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createNewGame } from "../../simulation/newGame";
import { ComputePanel } from "./Compute";

describe("ComputePanel automation", () => {
  it("explains the production effect, staffing boundary, and agent cost", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "dustin-moskovitz", skipTutorial: true });
    game.unlocks.automation = true;
    game.company.automation.engineering = 100;

    const markup = renderToStaticMarkup(<ComputePanel game={game} />);
    expect(markup).toContain("Every 10% adds 5% to the skill contribution");
    expect(markup).toContain("It does not replace staffing");
    expect(markup).toContain("+50% output");
    expect(markup).toContain("$1,800/month");
  });
});
