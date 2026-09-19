import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createNewGame } from "../simulation/newGame";
import { EndScreen } from "./EndScreen";

describe("EndScreen", () => {
  it("renders a scrollable revenue record with a valuation-based startup class", () => {
    const game = createNewGame({
      founderName: "Ada",
      companyName: "Northstar",
      cofounderId: "reya",
      seed: 44,
      skipTutorial: true,
    });
    game.endingId = "ipo";
    game.company.lifetimeRevenue = 4_275_400_000;
    game.company.lifetimeCosts = 2_910_800_000;
    game.company.valuation = 8_650_000_000;
    game.stats.peakValuation = 12_850_000_000;

    const markup = renderToStaticMarkup(<EndScreen game={game} />);

    expect(markup).toContain("h-full min-h-0 overflow-y-auto");
    expect(markup).toContain("Lifetime Revenue");
    expect(markup).toContain("$4.28B");
    expect(markup).toContain("Decacorn");
    expect(markup).toContain("Operating spend");
    expect(markup).not.toContain("Supreme Titan");
    expect(markup).not.toContain("Itemized Score Breakdown");
  });
});
