import { validateRunIntegrity } from "../src/leaderboard/security";
import { getLeaderboardEntries, saveLeaderboardEntry } from "../src/leaderboard/storage";
import type { LeaderboardFilter, LeaderboardSubmission } from "../src/leaderboard/types";

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
      const filter = (req.query?.filter as LeaderboardFilter) || "all";
      const limit = Number(req.query?.limit) || 50;
      const entries = await getLeaderboardEntries({ filter, limit });
      res.status(200).json({
        entries,
        total: entries.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Internal server error" });
    }
    return;
  }

  if (req.method === "POST") {
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
