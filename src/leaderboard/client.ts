import { openDB } from "idb";
import { evaluateAchievements } from "../simulation/achievements";
import { monthlyArr } from "../simulation/conditions";
import type { GameState } from "../simulation/types";
import { computeRunSeal, sanitizeHandle, sanitizeQuote } from "./security";
import { computeScoreTier, getDaysElapsed } from "./scoring";
import type {
  LeaderboardEntry,
  LeaderboardFilter,
  LeaderboardQueryResponse,
  LeaderboardSubmission,
  LeaderboardSubmitResponse,
} from "./types";

const LOCAL_DB = "compounding";
const LOCAL_LEADERBOARD_STORE = "leaderboard_runs";

async function getLocalDb() {
  return openDB(LOCAL_DB, 2, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("saves")) {
        database.createObjectStore("saves");
      }
      if (!database.objectStoreNames.contains(LOCAL_LEADERBOARD_STORE)) {
        database.createObjectStore(LOCAL_LEADERBOARD_STORE, { keyPath: "id" });
      }
    },
  });
}

export async function saveRunLocally(entry: LeaderboardEntry): Promise<void> {
  try {
    const db = await getLocalDb();
    await db.put(LOCAL_LEADERBOARD_STORE, entry);
  } catch {
    // Local persistence is best effort
  }
}

export async function getLocalRuns(): Promise<LeaderboardEntry[]> {
  try {
    const db = await getLocalDb();
    const runs = await db.getAll(LOCAL_LEADERBOARD_STORE);
    return Array.isArray(runs) ? runs : [];
  } catch {
    return [];
  }
}

export async function fetchLeaderboard(
  filter: LeaderboardFilter = "all",
  limit: number = 50
): Promise<LeaderboardQueryResponse> {
  try {
    const res = await fetch(`/api/leaderboard?filter=${encodeURIComponent(filter)}&limit=${limit}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data = (await res.json()) as LeaderboardQueryResponse;
      if (Array.isArray(data.entries)) {
        return { ...data, source: data.source ?? "global" };
      }
    }
  } catch {
    // Network or API failure fallback to the player's local archive.
  }

  // Offline or network fallback
  const local = await getLocalRuns();
  let merged = [...local];

  if (filter !== "all") {
    switch (filter) {
      case "unicorn":
        merged = merged.filter((e) => e.valuation >= 1_000_000_000 || e.endingId === "unicorn");
        break;
      case "ipo":
        merged = merged.filter((e) => e.endingId === "ipo");
        break;
      case "monopoly":
        merged = merged.filter((e) => e.endingId === "monopoly");
        break;
      case "quiet-profit":
        merged = merged.filter((e) => e.endingId === "quiet-profit");
        break;
      case "bootstrapped":
        merged = merged.filter((e) => e.achievements.includes("bootstrapped"));
        break;
    }
  }

  merged.sort((a, b) => b.score - a.score);
  const sliced = merged.slice(0, limit).map((e, idx) => ({ ...e, rank: idx + 1 }));

  return {
    entries: sliced,
    total: merged.length,
    source: "local",
  };
}

export async function submitRunToLeaderboard(
  game: GameState,
  handle: string,
  quote?: string
): Promise<LeaderboardSubmitResponse> {
  const runId = game.meta.runId || `run_${Math.random().toString(36).slice(2, 10)}`;
  const seed = game.meta.seed;
  const endingId = game.endingId ?? "unknown";
  const daysElapsed = getDaysElapsed(game);
  const peakVal = Math.max(game.stats.peakValuation, game.company.valuation);
  const productsLaunched = game.stats.productsLaunched;
  const scandals = game.stats.scandals;
  const arr = monthlyArr(game) * 12;

  const unlocked = evaluateAchievements(game);
  const achievementIds = unlocked.map((a) => a.id);

  const seal = computeRunSeal({
    runId,
    seed,
    endingId,
    daysElapsed,
    peakValuation: peakVal,
    productsLaunched,
    scandals,
    lifetimeRevenue: game.company.lifetimeRevenue,
  });

  const submission: LeaderboardSubmission = {
    runId,
    seed,
    handle: sanitizeHandle(handle),
    companyName: game.company.name,
    founderName: game.founder.name,
    quote: sanitizeQuote(quote),
    endingId,
    endingNote: game.endingNote ?? undefined,
    stats: {
      productsLaunched,
      employeesHired: game.stats.employeesHired,
      acquisitions: game.stats.acquisitions,
      scandals,
      computeConsumed: game.stats.computeConsumed,
      peakValuation: peakVal,
      peakEmployees: game.stats.peakEmployees,
    },
    company: {
      cash: game.company.cash,
      valuation: game.company.valuation,
      lifetimeRevenue: game.company.lifetimeRevenue,
      hype: game.company.hype,
      trust: game.company.trust,
      raisedTotal: game.funding.raisedTotal,
    },
    clock: {
      year: game.clock.date.year,
      month: game.clock.date.month,
      day: game.clock.date.day,
      daysElapsed,
    },
    arr,
    achievements: achievementIds,
    seal,
  };

  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(submission),
    });

    const data = (await res.json()) as LeaderboardSubmitResponse;

    if (data.success && data.entry) {
      await saveRunLocally(data.entry);
      return data;
    }

    if (!data.success && data.error) {
      return data;
    }
  } catch (err: any) {
    // Network error: best effort local save
  }

  // If the network is unreachable, keep a local archive but do not pretend the run
  // was published to the global ledger.
  const localEntry: LeaderboardEntry = {
    id: runId,
    handle: submission.handle,
    companyName: submission.companyName,
    founderName: submission.founderName,
    score: Math.max(0, Math.round(game.company.lifetimeRevenue)),
    tier: computeScoreTier(game.company.lifetimeRevenue),
    endingId,
    endingTitle: endingId.toUpperCase(),
    valuation: peakVal,
    cash: game.company.cash,
    arr,
    year: game.clock.date.year,
    daysElapsed,
    productsCount: productsLaunched,
    employeesCount: game.stats.peakEmployees,
    achievements: achievementIds,
    quote: submission.quote || "",
    verified: true,
    createdAt: Date.now(),
  };

  await saveRunLocally(localEntry);
  return {
    success: false,
    entry: localEntry,
    error: "Leaderboard unavailable. Your run was saved locally, but it was not published.",
  };
}
