import type { LeaderboardEntry, LeaderboardFilter } from "./types.js";

const MAX_ROWS = 5000;

interface ProcessLike {
  env?: Record<string, string | undefined>;
}

interface SupabaseRow {
  id: string;
  handle: string;
  company_name: string;
  founder_name: string;
  score: number | string;
  tier: LeaderboardEntry["tier"];
  ending_id: string;
  ending_title: string;
  valuation: number | string;
  cash: number | string;
  arr: number | string;
  year: number | string;
  days_elapsed: number | string;
  products_count: number | string;
  employees_count: number | string;
  achievements: unknown;
  quote: string;
  verified: boolean;
  created_at: string;
}

interface SupabaseConfig {
  functionUrl: string;
  token: string;
}

let memoryEntries: LeaderboardEntry[] = [];

function getSupabaseConfig(): SupabaseConfig | null {
  const processLike = (globalThis as { process?: ProcessLike }).process;
  const functionUrl = processLike?.env?.STARTUPSIM_LEADERBOARD_URL?.trim().replace(/\/$/, "");
  const token = processLike?.env?.STARTUPSIM_LEADERBOARD_TOKEN?.trim();

  if (!functionUrl || !token) return null;
  return { functionUrl, token };
}

export function isDurableLeaderboardConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

function finiteNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rowToEntry(row: SupabaseRow): LeaderboardEntry {
  const parsedCreatedAt = Date.parse(row.created_at);

  return {
    id: row.id,
    handle: row.handle,
    companyName: row.company_name,
    founderName: row.founder_name,
    score: finiteNumber(row.score),
    tier: row.tier,
    endingId: row.ending_id,
    endingTitle: row.ending_title,
    valuation: finiteNumber(row.valuation),
    cash: finiteNumber(row.cash),
    arr: finiteNumber(row.arr),
    year: finiteNumber(row.year),
    daysElapsed: finiteNumber(row.days_elapsed),
    productsCount: finiteNumber(row.products_count),
    employeesCount: finiteNumber(row.employees_count),
    achievements: Array.isArray(row.achievements)
      ? row.achievements.filter((id): id is string => typeof id === "string")
      : [],
    quote: row.quote,
    verified: row.verified === true,
    createdAt: Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : Date.now(),
  };
}

function entryToRow(entry: LeaderboardEntry): Record<string, unknown> {
  return {
    id: entry.id,
    handle: entry.handle,
    company_name: entry.companyName,
    founder_name: entry.founderName,
    score: Math.round(entry.score),
    tier: entry.tier,
    ending_id: entry.endingId,
    ending_title: entry.endingTitle,
    valuation: Math.round(entry.valuation),
    cash: Math.round(entry.cash),
    arr: Math.round(entry.arr),
    year: Math.round(entry.year),
    days_elapsed: Math.round(entry.daysElapsed),
    products_count: Math.round(entry.productsCount),
    employees_count: Math.round(entry.employeesCount),
    achievements: entry.achievements,
    quote: entry.quote,
    verified: true,
    created_at: new Date(entry.createdAt).toISOString(),
  };
}

async function supabaseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const config = getSupabaseConfig();
  if (!config) throw new Error("Supabase leaderboard storage is not configured");

  const response = await fetch(`${config.functionUrl}${path}`, {
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
    throw new Error(`Supabase leaderboard request failed (${response.status})${detail ? `: ${detail}` : ""}`);
  }

  if (response.status === 204) return undefined as T;
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

async function getRemoteEntries(): Promise<LeaderboardEntry[]> {
  const select = [
    "id",
    "handle",
    "company_name",
    "founder_name",
    "score",
    "tier",
    "ending_id",
    "ending_title",
    "valuation",
    "cash",
    "arr",
    "year",
    "days_elapsed",
    "products_count",
    "employees_count",
    "achievements",
    "quote",
    "verified",
    "created_at",
  ].join(",");
  const rows = await supabaseRequest<SupabaseRow[]>(
    `?select=${select}&order=score.desc,created_at.asc&limit=${MAX_ROWS}`,
  );
  return rows.map(rowToEntry);
}

export async function getLeaderboardEntries(options?: {
  filter?: LeaderboardFilter;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const filter = options?.filter ?? "all";
  const limit = normalizedLimit(options?.limit);
  const entries = isDurableLeaderboardConfigured() ? await getRemoteEntries() : memoryEntries;
  return rankEntries(filterEntries(entries, filter), limit);
}

async function getRemoteEntryById(id: string): Promise<LeaderboardEntry | null> {
  const rows = await supabaseRequest<SupabaseRow[]>(`?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
  return rows[0] ? rowToEntry(rows[0]) : null;
}

export async function saveLeaderboardEntry(entry: LeaderboardEntry): Promise<{ rank: number }> {
  if (!isDurableLeaderboardConfigured()) {
    const existing = memoryEntries.find((candidate) => candidate.id === entry.id);
    if (!existing || entry.score > existing.score) {
      memoryEntries = [...memoryEntries.filter((candidate) => candidate.id !== entry.id), entry];
    }
  } else {
    const existing = await getRemoteEntryById(entry.id);
    if (!existing || entry.score > existing.score) {
      await supabaseRequest<SupabaseRow[]>("?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(entryToRow(entry)),
      });
    }
  }

  const ranked = await getLeaderboardEntries({ limit: MAX_ROWS });
  const saved = ranked.find((candidate) => candidate.id === entry.id);
  return { rank: saved?.rank ?? ranked.length + 1 };
}
