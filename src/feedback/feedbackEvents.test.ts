import { describe, expect, it } from "vitest";
import { produce } from "immer";
import { applyCommand } from "../simulation/commands";
import { createNewGame } from "../simulation/newGame";
import { deriveFeedbackEvents } from "./feedbackEvents";
import { feedbackMotionPolicy } from "./feedbackPolicy";

const fresh = () => createNewGame({ founderName: "Ada", companyName: "Compounding", cofounderId: "dustin-moskovitz", skipTutorial: true, seed: 41 });

describe("semantic feedback derivation", () => {
  it("does not present feedback for a command that leaves state unchanged", () => {
    const game = fresh();
    expect(deriveFeedbackEvents(game, game, { type: "setModel", productId: "missing", modelId: "missing" })).toEqual([]);
  });

  it("emits a product-ready reward for development to ready", () => {
    const before = applyCommand(fresh(), { type: "startProduct", a: "chat", b: "writing" })!;
    const after = produce(before, (draft) => { draft.products[0]!.status = "ready"; });
    expect(deriveFeedbackEvents(before, after, { type: "tickDay" })).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "product.ready", tier: 3, id: after.products[0]!.id }),
    ]));
  });

  it("recognizes office upgrades and completed research from actual state changes", () => {
    const before = fresh();
    const after = produce(before, (draft) => {
      draft.company.officeLevel = 1;
      draft.stats.researchCompleted++;
    });
    const events = deriveFeedbackEvents(before, after, { type: "tickDay" });
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "office.upgraded", tier: 4 }),
      expect.objectContaining({ type: "research.completed", tier: 3 }),
    ]));
  });

  it("makes a large commanded cash movement an action and ignores passive daily cash", () => {
    const before = fresh();
    const after = produce(before, (draft) => { draft.company.cash += 150_000; });
    expect(deriveFeedbackEvents(before, after, { type: "startPromo", promoId: "test" })).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "money.gained", amount: 150_000 }),
    ]));
    expect(deriveFeedbackEvents(before, after, { type: "tickDay" }).some((event) => event.type.startsWith("money."))).toBe(false);
    const small = produce(before, (draft) => { draft.company.cash += 250; });
    expect(deriveFeedbackEvents(before, small, { type: "startPromo", promoId: "test" }).some((event) => event.type.startsWith("money."))).toBe(false);
  });

  it("removes high-motion reactions in reduced motion", () => {
    const event = { type: "office.upgraded" as const, tier: 4 as const };
    expect(feedbackMotionPolicy(event, { reducedMotion: false, graphics: "high" }).camera).toBe(true);
    expect(feedbackMotionPolicy(event, { reducedMotion: true, graphics: "high" }).camera).toBe(false);
    expect(feedbackMotionPolicy({ type: "funding.closed", tier: 4 }, { reducedMotion: true, graphics: "low" }).characterReaction).toBe(false);
  });
});
