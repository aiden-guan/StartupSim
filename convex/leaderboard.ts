import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { LeaderboardEntry, LeaderboardFilter } from "../src/leaderboard/types";
import {
  leaderboardEntryValidator,
  leaderboardEntryWithRankValidator,
  leaderboardFilterValidator,
} from "./validators";

const MAX_ROWS = 5000;
const MAX_VALUATION = 50_000_000_000_000;

const listResultValidator = v.object({
  entries: v.array(leaderboardEntryWithRankValidator),
  total: v.number(),
});

function finite(value: number): boolean {
  return Number.isFinite(value);
}

function isSafeEntry(entry: LeaderboardEntry): boolean {
  return (
    entry.id.length > 0 &&
    entry.id.length <= 64 &&
    /^[A-Z0-9_-]+$/.test(entry.handle) &&
    entry.handle.length <= 16 &&
    entry.companyName.length > 0 &&
    entry.companyName.length <= 32 &&
    !/[\u0000-\u001f\u007f]/.test(entry.companyName) &&
    entry.founderName.length > 0 &&
    entry.founderName.length <= 32 &&
    !/[\u0000-\u001f\u007f]/.test(entry.founderName) &&
    entry.quote.length <= 90 &&
    !/[\u0000-\u001f\u007f]/.test(entry.quote) &&
    entry.verified === true &&
    finite(entry.score) &&
    entry.score >= 0 &&
    finite(entry.valuation) &&
    entry.valuation >= 0 &&
    entry.valuation <= MAX_VALUATION &&
    finite(entry.cash) &&
    finite(entry.arr) &&
    entry.arr >= 0 &&
    Number.isSafeInteger(entry.year) &&
    entry.year >= 2022 &&
    Number.isSafeInteger(entry.daysElapsed) &&
    entry.daysElapsed >= 1 &&
    Number.isInteger(entry.productsCount) &&
    entry.productsCount >= 0 &&
    entry.productsCount <= 1000 &&
    Number.isInteger(entry.employeesCount) &&
    entry.employeesCount >= 0 &&
    entry.employeesCount <= 100000 &&
    finite(entry.createdAt)
  );
}

function toEntry(row: {
  id: string;
  handle: string;
  companyName: string;
  founderName: string;
  score: number;
  tier: LeaderboardEntry["tier"];
  endingId: string;
  endingTitle: string;
  valuation: number;
  cash: number;
  arr: number;
  year: number;
  daysElapsed: number;
  productsCount: number;
  employeesCount: number;
  achievements: string[];
  quote: string;
  verified: boolean;
  createdAt: number;
}): LeaderboardEntry {
  return {
    id: row.id,
    handle: row.handle,
    companyName: row.companyName,
    founderName: row.founderName,
    score: row.score,
    tier: row.tier,
    endingId: row.endingId,
    endingTitle: row.endingTitle,
    valuation: row.valuation,
    cash: row.cash,
    arr: row.arr,
    year: row.year,
    daysElapsed: row.daysElapsed,
    productsCount: row.productsCount,
    employeesCount: row.employeesCount,
    achievements: row.achievements,
    quote: row.quote,
    verified: row.verified,
    createdAt: row.createdAt,
  };
}

function rankEntries(entries: LeaderboardEntry[], limit: number): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function mergeRows<T extends { id: string }>(...groups: T[][]): T[] {
  const rows = new Map<string, T>();
  for (const group of groups) {
    for (const row of group) rows.set(row.id, row);
  }
  return [...rows.values()];
}

async function readRows(ctx: QueryCtx | MutationCtx, filter: LeaderboardFilter) {
  switch (filter) {
    case "unicorn": {
      const byEnding = await ctx.db
        .query("leaderboardEntries")
        .withIndex("by_ending_id", (q) => q.eq("endingId", "unicorn"))
        .order("desc")
        .take(MAX_ROWS);
      const byValuation = await ctx.db
        .query("leaderboardEntries")
        .withIndex("by_valuation", (q) =>
          q.gte("valuation", 1_000_000_000).lte("valuation", MAX_VALUATION),
        )
        .order("desc")
        .take(MAX_ROWS);
      return mergeRows(byEnding, byValuation);
    }
    case "ipo":
      return await ctx.db
        .query("leaderboardEntries")
        .withIndex("by_ending_id", (q) => q.eq("endingId", "ipo"))
        .order("desc")
        .take(MAX_ROWS);
    case "monopoly":
      return await ctx.db
        .query("leaderboardEntries")
        .withIndex("by_ending_id", (q) => q.eq("endingId", "monopoly"))
        .order("desc")
        .take(MAX_ROWS);
    case "quiet-profit":
      return await ctx.db
        .query("leaderboardEntries")
        .withIndex("by_ending_id", (q) => q.eq("endingId", "quiet-profit"))
        .order("desc")
        .take(MAX_ROWS);
    case "bootstrapped":
      return await ctx.db
        .query("leaderboardEntries")
        .withIndex("by_bootstrapped", (q) => q.eq("bootstrapped", true))
        .order("desc")
        .take(MAX_ROWS);
    case "all":
      return await ctx.db
        .query("leaderboardEntries")
        .withIndex("by_score")
        .order("desc")
        .take(MAX_ROWS);
  }
}

export const listInternal = internalQuery({
  args: {
    filter: leaderboardFilterValidator,
    limit: v.number(),
  },
  returns: listResultValidator,
  handler: async (ctx, args) => {
    const limit = Math.min(MAX_ROWS, Math.max(1, Math.floor(args.limit)));
    const rows = await readRows(ctx, args.filter);
    const entries = rankEntries(rows.map(toEntry), limit);
    return { entries, total: rows.length };
  },
});

export const submitInternal = internalMutation({
  args: { entry: leaderboardEntryValidator },
  returns: v.object({
    success: v.boolean(),
    entry: v.optional(leaderboardEntryValidator),
    rank: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const entry = args.entry as LeaderboardEntry;
    if (!isSafeEntry(entry)) {
      return { success: false, error: "Leaderboard entry failed server validation" };
    }

    const existing = await ctx.db
      .query("leaderboardEntries")
      .withIndex("by_run_id", (q) => q.eq("id", entry.id))
      .unique();

    if (!existing || entry.score > existing.score) {
      const stored = {
        ...entry,
        createdAt: existing?.createdAt ?? entry.createdAt,
        bootstrapped: entry.achievements.includes("bootstrapped"),
      };
      if (existing) {
        await ctx.db.patch(existing._id, stored);
      } else {
        await ctx.db.insert("leaderboardEntries", stored);
      }
    }

    const allRows = await readRows(ctx, "all");
    const ranked = rankEntries(allRows.map(toEntry), MAX_ROWS);
    const saved = ranked.find((candidate) => candidate.id === entry.id) ?? toEntry(existing ?? entry);
    const savedEntry = { ...saved };
    delete savedEntry.rank;
    return {
      success: true,
      entry: savedEntry,
      rank: saved.rank ?? ranked.length + 1,
    };
  },
});
