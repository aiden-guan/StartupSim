import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

declare const process: { env: Record<string, string | undefined> };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-startupsim-token",
    },
  });
}

function authorized(request: Request): boolean {
  const expectedToken = process.env.STARTUPSIM_LEADERBOARD_TOKEN;
  return Boolean(expectedToken && request.headers.get("x-startupsim-token") === expectedToken);
}

function parseFilter(value: string | null) {
  const valid = ["all", "unicorn", "ipo", "monopoly", "quiet-profit", "bootstrapped"] as const;
  return valid.includes(value as (typeof valid)[number]) ? value : "all";
}

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(5000, Math.max(1, Math.floor(parsed))) : 50;
}

http.route({
  path: "/api/leaderboard",
  method: "OPTIONS",
  handler: httpAction(async () => json({ ok: true })),
});

http.route({
  path: "/api/leaderboard",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!authorized(request)) return json({ error: "Unauthorized" }, 401);

    const url = new URL(request.url);
    const filter = parseFilter(url.searchParams.get("filter"));
    const result = await ctx.runQuery(internal.leaderboard.listInternal, {
      filter: filter as "all" | "unicorn" | "ipo" | "monopoly" | "quiet-profit" | "bootstrapped",
      limit: parseLimit(url.searchParams.get("limit")),
    });
    return json(result);
  }),
});

http.route({
  path: "/api/leaderboard",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!authorized(request)) return json({ success: false, error: "Unauthorized" }, 401);

    try {
      const body = (await request.json()) as { entry?: unknown };
      if (!body || typeof body !== "object" || !body.entry) {
        return json({ success: false, error: "Invalid leaderboard payload" }, 400);
      }
      const result = await ctx.runMutation(internal.leaderboard.submitInternal, {
        entry: body.entry as never,
      });
      return json(result, result.success ? 200 : 400);
    } catch (error) {
      return json(
        { success: false, error: error instanceof Error ? error.message : "Invalid leaderboard payload" },
        400,
      );
    }
  }),
});

export default http;
