import { defineSchema, defineTable } from "convex/server";
import { leaderboardTableFields } from "./validators";
import { v } from "convex/values";

export default defineSchema({
  leaderboardEntries: defineTable({
    ...leaderboardTableFields,
    bootstrapped: v.boolean(),
  })
    .index("by_run_id", ["id"])
    .index("by_score", ["score"])
    .index("by_ending_id", ["endingId"])
    .index("by_valuation", ["valuation"])
    .index("by_bootstrapped", ["bootstrapped"]),
});
