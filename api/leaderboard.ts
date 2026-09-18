import { validateRunIntegrity } from "../src/leaderboard/security.js";
import {
  getLeaderboardEntries,
  isDurableLeaderboardConfigured,
  saveLeaderboardEntry,
} from "../src/leaderboard/storage.js";
import type { LeaderboardFilter, LeaderboardSubmission } from "../src/leaderboard/types.js";

interface VercelRequest {
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[]>;
  body: any;
  method?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: any) => void;
  setHeader: (name: string, value: string | string[]) => this;
}

const VALID_FILTERS: LeaderboardFilter[] = ["all", "unicorn", "ipo", "monopoly", "quiet-profit", "bootstrapped"];
const submissionBuckets = new Map<string, { startedAt: number; count: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 20;

function requestIdentity(req: VercelRequest): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || "anonymous";
}

function allowSubmission(req: VercelRequest): boolean {
  const now = Date.now();
  const key = requestIdentity(req);
  const current = submissionBuckets.get(key);

  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    submissionBuckets.set(key, { startedAt: now, count: 1 });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_SUBMISSIONS) return false;
  current.count += 1;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for API calls
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "GET") {
    try {
      const requestedFilter = req.query?.filter;
      const filterValue = Array.isArray(requestedFilter) ? requestedFilter[0] : requestedFilter;
      const filter = VALID_FILTERS.includes(filterValue as LeaderboardFilter)
        ? (filterValue as LeaderboardFilter)
        : "all";
      const requestedLimit = req.query?.limit;
      const limitValue = Array.isArray(requestedLimit) ? requestedLimit[0] : requestedLimit;
      const parsedLimit = Number(limitValue);
      const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, Math.floor(parsedLimit))) : 50;
      const entries = await getLeaderboardEntries({ filter, limit });
      res.status(200).json({
        entries,
        total: entries.length,
        source: isDurableLeaderboardConfigured() ? "global" : "local",
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Internal server error" });
    }
    return;
  }

  if (req.method === "POST") {
    if (!allowSubmission(req)) {
      res.status(429).json({ success: false, error: "Submission limit reached. Try again later." });
      return;
    }

    try {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch {
          res.status(400).json({ success: false, error: "Invalid JSON body" });
          return;
        }
      }

      const submission = body as LeaderboardSubmission;
      const validation = validateRunIntegrity(submission);

      if (!validation.valid || !validation.verifiedEntry) {
        res.status(400).json({
          success: false,
          error: validation.reason || "Integrity verification failed",
        });
        return;
      }

      const { rank } = await saveLeaderboardEntry(validation.verifiedEntry);

      res.status(200).json({
        success: true,
        entry: validation.verifiedEntry,
        rank,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || "Internal server error" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
}
