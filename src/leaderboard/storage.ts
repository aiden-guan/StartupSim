import type { LeaderboardEntry, LeaderboardFilter, LeaderboardQueryResponse, LeaderboardSubmitResponse } from "./types.js";

const MAX_ROWS = 5000;

interface ProcessLike {
  env?: Record<string, string | undefined>;
}

interface ConvexConfig {
  siteUrl: string;
  token: string;
}

let memoryEntries: LeaderboardEntry[] = [];

function getConvexConfig(): ConvexConfig | null {
  const processLike = (globalThis as { process?: ProcessLike }).process;
  const siteUrl = processLike?.env?.CONVEX_SITE_URL?.trim().replace(/\/$/, "");
  const token = processLike?.env?.STARTUPSIM_LEADERBOARD_TOKEN?.trim();

  if (!siteUrl || !token) return null;
  return { siteUrl, token };
}

export function isDurableLeaderboardConfigured(): boolean {
  return getConvexConfig() !== null;
}

async function convexRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getConvexConfig();
  if (!config) throw new Error("Convex leaderboard storage is not configured");

  const response = await fetch(`${config.siteUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "x-startupsim-token": config.token,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240);
    throw new Error(`Convex leaderboard request failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }

  return (await response.json()) as T;
}

function filterEntries(entries: LeaderboardEntry[], filter: LeaderboardFilter): LeaderboardEntry[] {
  if (filter === "all") return entries;

  switch (filter) {
    case "unicorn":
      return entries.filter((entry) => entry.valuation >= 1_000_000_000 || entry.endingId === "unicorn");
    case "ipo":
      return entries.filter((entry) => entry.endingId === "ipo");
    case "monopoly":
      return entries.filter((entry) => entry.endingId === "monopoly");
    case "quiet-profit":
      return entries.filter((entry) => entry.endingId === "quiet-profit");
    case "bootstrapped":
      return entries.filter((entry) => entry.achievements.includes("bootstrapped"));
  }
}

function rankEntries(entries: LeaderboardEntry[], limit: number): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => b.score - a.score || a.createdAt - b.createdAt)
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function normalizedLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return 50;
  return Math.min(MAX_ROWS, Math.max(1, Math.floor(limit)));
}

async function getRemoteEntries(filter: LeaderboardFilter, limit: number): Promise<LeaderboardEntry[]> {
  const response = await convexRequest<LeaderboardQueryResponse>(
    `/api/leaderboard?filter=${encodeURIComponent(filter)}&limit=${normalizedLimit(limit)}`,
  );
  return Array.isArray(response.entries) ? response.entries : [];
}

export async function getLeaderboardEntries(options?: {
  filter?: LeaderboardFilter;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const filter = options?.filter ?? "all";
  const limit = normalizedLimit(options?.limit);

  if (isDurableLeaderboardConfigured()) {
    return getRemoteEntries(filter, limit);
  }

  return rankEntries(filterEntries(memoryEntries, filter), limit);
}

export async function saveLeaderboardEntry(entry: LeaderboardEntry): Promise<{ rank: number }> {
  if (isDurableLeaderboardConfigured()) {
    const response = await convexRequest<LeaderboardSubmitResponse>("/api/leaderboard", {
      method: "POST",
      body: JSON.stringify({ entry }),
    });

    if (!response.success) {
      throw new Error(response.error || "Convex rejected the leaderboard entry");
    }

    return { rank: response.rank ?? 1 };
  }

  const existing = memoryEntries.find((candidate) => candidate.id === entry.id);
  if (!existing || entry.score > existing.score) {
    memoryEntries = [...memoryEntries.filter((candidate) => candidate.id !== entry.id), entry];
  }

  const ranked = rankEntries(memoryEntries, MAX_ROWS);
  const saved = ranked.find((candidate) => candidate.id === entry.id);
  return { rank: saved?.rank ?? ranked.length + 1 };
}
