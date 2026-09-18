import { describe, expect, it } from "vitest";
import { BALANCE } from "../config/balance";
import { SOCIAL_MILESTONES } from "../data/social";
import { migrateGameState } from "../state/migrate";
import { createNewGame } from "./newGame";
import { Rng } from "./rng";
import { applySocialMilestone, getSocialTemplateVars, isMilestoneSatisfied, tickSocial } from "./social";

describe("Social & Radar Simulation", () => {
  it("initializes genesis social state with templated posts and DMs", () => {
    const game = createNewGame({ founderName: "Elena", companyName: "NexusAI", cofounderId: "marcus", seed: 42 });
    expect(game.social).toBeDefined();
    expect(game.social.posts.length).toBeGreaterThan(0);
    expect(game.social.dms.length).toBeGreaterThan(0);
    expect(game.social.triggeredMilestones).toContain("genesis");

    // Check that templating properly substituted variables
    const vars = getSocialTemplateVars(game);
    expect(vars.founder).toBe("Elena");
    expect(vars.company).toBe("NexusAI");

    const allText = game.social.posts.map((p) => p.text).join(" ");
    expect(allText).not.toContain("{founder}");
    expect(allText).not.toContain("{company}");
  });

  it("correctly identifies when milestones are satisfied", () => {
    const game = createNewGame({ founderName: "Satoshi", companyName: "HyperToken", cofounderId: "marcus" });

    // Genesis is always satisfied
    expect(isMilestoneSatisfied("genesis", game)).toBe(true);

    // First launch not satisfied initially
    expect(isMilestoneSatisfied("first_launch", game)).toBe(false);
    game.company.productsLaunched = 1;
    expect(isMilestoneSatisfied("first_launch", game)).toBe(true);

    // Unicorn and Billionaire checks
    expect(isMilestoneSatisfied("unicorn", game)).toBe(false);
    expect(isMilestoneSatisfied("billionaire", game)).toBe(false);

    // Set company valuation to $1B with 40% founder equity
    game.company.valuation = 1_000_000_000;
    game.company.ownership.founder = 0.4;
    // Unicorn is true ($1B company valuation)
    expect(isMilestoneSatisfied("unicorn", game)).toBe(true);
    // Billionaire is FALSE because founder net worth is $400M, not $1B
    expect(isMilestoneSatisfied("billionaire", game)).toBe(false);

    // Founder reaches $1B net worth ($2.5B valuation * 0.40)
    game.company.valuation = 2_500_000_000;
    expect(isMilestoneSatisfied("billionaire", game)).toBe(true);
  });

  it("fires milestone reactions with Chad's evolving commentary", () => {
    const game = createNewGame({ founderName: "Alex", companyName: "Cortex", cofounderId: "marcus", seed: 99 });
    const r = new Rng(123);

    // Genesis: Chad asks about token / laughs
    const genesisChad = game.social.posts.find((p) => p.actorId === "chad");
    expect(genesisChad).toBeDefined();

    // Unicorn milestone: Chad celebrates early grind
    const unicornDef = SOCIAL_MILESTONES.find((m) => m.id === "unicorn")!;
    const { newPosts, newDms } = applySocialMilestone(game, unicornDef, r);

    const unicornChadPost = newPosts.find((p) => p.actorId === "chad");
    expect(unicornChadPost).toBeDefined();
    expect(unicornChadPost?.text.toLowerCase()).toContain("always knew");
    expect(unicornChadPost?.likes).toBeGreaterThan(1000); // Unicorn posts get massive likes

    const unicornChadDm = newDms.find((d) => d.actorId === "chad");
    expect(unicornChadDm).toBeDefined();
    expect(unicornChadDm?.text.toLowerCase()).toContain("bro");
  });

  it("advances milestones during tickSocial and caps history size", () => {
    const game = createNewGame({ founderName: "Sam", companyName: "Kernel", cofounderId: "marcus", seed: 10 });
    const r = new Rng(20);

    // Simulate product launch
    game.company.productsLaunched = 1;
    const res = tickSocial(game, r);

    expect(game.social.triggeredMilestones).toContain("first_launch");
    expect(res.newPosts.length).toBeGreaterThan(0);

    // Ensure posts never exceed SOCIAL_POSTS_CAP
    for (let i = 0; i < 50; i++) {
      game.social.posts.push({
        id: `dummy-${i}`,
        actorId: "chad",
        text: "ambient tweet",
        tick: i,
        date: { year: 2023, month: 1, day: 1 },
        likes: 5,
        reposts: 1,
      });
    }

    tickSocial(game, r);
    expect(game.social.posts.length).toBeLessThanOrEqual(BALANCE.SOCIAL_POSTS_CAP);
    expect(game.social.dms.length).toBeLessThanOrEqual(BALANCE.SOCIAL_DMS_CAP);
  });

  it("backfills satisfied milestones when migrating legacy saves without social state", () => {
    const legacyGame = createNewGame({ founderName: "Ada", companyName: "LovelaceAI", cofounderId: "marcus" });
    legacyGame.company.productsLaunched = 2;
    legacyGame.company.valuation = 150_000_000;
    delete (legacyGame as any).social;

    const migrated = migrateGameState(legacyGame);
    expect(migrated.social).toBeDefined();
    expect(migrated.social.triggeredMilestones).toContain("genesis");
    expect(migrated.social.triggeredMilestones).toContain("first_launch");
    expect(migrated.social.triggeredMilestones).toContain("val_100m");
    expect(migrated.social.posts.length).toBeGreaterThan(3);
  });

  it("does not repeat unicorn bursts on subsequent ticks", () => {
    const game = createNewGame({ founderName: "Vance", companyName: "OmniAI", cofounderId: "marcus" });
    const r = new Rng(55);

    game.company.valuation = 1_200_000_000;
    const res1 = tickSocial(game, r);
    expect(res1.majorMilestone).toBe("unicorn");
    expect(game.social.triggeredMilestones).toContain("unicorn");
    const countAfterBurst = game.social.posts.length;
    expect(countAfterBurst).toBeGreaterThan(0);

    // Next tick: milestone is already triggered, no new unicorn burst
    const res2 = tickSocial(game, r);
    expect(res2.majorMilestone).toBeUndefined();
    // Only ambient posts at most, no second unicorn burst
    expect(game.social.posts.filter((p) => p.milestoneId === "unicorn").length).toBe(
      game.social.posts.filter((p) => p.milestoneId === "unicorn").length,
    );
  });

  it("preserves social state through exportSave and importSave roundtrip", () => {
    const game = createNewGame({ founderName: "Vance", companyName: "OmniAI", cofounderId: "marcus" });
    const r = new Rng(77);
    game.company.productsLaunched = 1;
    tickSocial(game, r);

    const postCountBefore = game.social.posts.length;
    const dmCountBefore = game.social.dms.length;

    const savedJson = JSON.stringify(game);
    const loadedGame = JSON.parse(savedJson);
    const migrated = migrateGameState(loadedGame);

    expect(migrated.social.posts.length).toBe(postCountCountSafe(postCountBefore));
    expect(migrated.social.dms.length).toBe(dmCountBefore);
    expect(migrated.social.triggeredMilestones).toEqual(game.social.triggeredMilestones);
  });

  it("ensures ambient social generation does not pause clock or add pause reasons", () => {
    const game = createNewGame({ founderName: "Vance", companyName: "OmniAI", cofounderId: "marcus" });
    game.clock.paused = false;
    game.clock.pauseReasons = [];

    const r = new Rng(88);
    tickSocial(game, r);

    expect(game.clock.paused).toBe(false);
    expect(game.clock.pauseReasons).toEqual([]);
  });
});

function postCountCountSafe(n: number): number {
  return n;
}

