import { v } from "convex/values";

export const scoreTierValidator = v.union(
  v.literal("SSS"),
  v.literal("SS"),
  v.literal("S"),
  v.literal("A"),
  v.literal("B"),
  v.literal("C"),
);

export const leaderboardFilterValidator = v.union(
  v.literal("all"),
  v.literal("unicorn"),
  v.literal("ipo"),
  v.literal("monopoly"),
  v.literal("quiet-profit"),
  v.literal("bootstrapped"),
);

export const leaderboardTableFields = {
  id: v.string(),
  handle: v.string(),
  companyName: v.string(),
  founderName: v.string(),
  score: v.number(),
  tier: scoreTierValidator,
  endingId: v.string(),
  endingTitle: v.string(),
  valuation: v.number(),
  cash: v.number(),
  arr: v.number(),
  year: v.number(),
  daysElapsed: v.number(),
  productsCount: v.number(),
  employeesCount: v.number(),
  achievements: v.array(v.string()),
  quote: v.string(),
  verified: v.boolean(),
  createdAt: v.number(),
};

export const leaderboardEntryValidator = v.object(leaderboardTableFields);

export const leaderboardEntryWithRankValidator = v.object({
  ...leaderboardTableFields,
  rank: v.optional(v.number()),
});
