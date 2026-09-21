import { describe, expect, it } from "vitest";
import { applyCommand } from "./commands";
import { createNewGame } from "./newGame";

describe("funding offers", () => {
  it("keeps late-game term sheets meaningfully dilutive instead of rounding to free money", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "dustin-moskovitz", seed: 9, skipTutorial: true });
    game.funding.lastRound = "growth";
    game.funding.raisedTotal = 1_275_000_000_000_000;

    const withOffers = applyCommand(game, { type: "generateFunding" })!;
    expect(withOffers.funding.offers).toHaveLength(3);
    expect(withOffers.funding.offers.map((offer) => offer.dilution)).toEqual([
      expect.closeTo(0.02, 6),
      expect.closeTo(0.03, 6),
      expect.closeTo(0.04, 6),
    ]);

    const offer = withOffers.funding.offers[0]!;
    const founderBefore = withOffers.company.ownership.founder;
    const accepted = applyCommand(withOffers, { type: "acceptOffer", offerId: offer.id })!;
    expect(accepted.company.cash - withOffers.company.cash).toBe(offer.cash);
    expect(accepted.company.ownership.founder).toBeCloseTo(founderBefore * 0.98, 8);
    expect(accepted.company.ownership.investors).toBeCloseTo(offer.dilution, 8);
  });
});
