import "@supabase/functions-js/edge-runtime.d.ts";

const TABLE_NAME = "startupsim_leaderboard_entries";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function serviceHeaders(): HeadersInit {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) throw new Error("Supabase service role key is not available");

  return {
    Accept: "application/json",
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };
}

function isAuthorized(request: Request): boolean {
  const expectedToken = Deno.env.get("STARTUPSIM_LEADERBOARD_TOKEN");
  return Boolean(expectedToken && request.headers.get("x-startupsim-token") === expectedToken);
}

Deno.serve(async (request) => {
  // JWT verification is disabled for this internal proxy; the shared token is
  // stored in Supabase/Vercel secrets and is never shipped to the browser.
  if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return json({ error: "Supabase URL is not configured" }, 500);

  const requestUrl = new URL(request.url);
  const upstreamUrl = `${supabaseUrl}/rest/v1/${TABLE_NAME}${requestUrl.search}`;
  const headers: HeadersInit = {
    ...serviceHeaders(),
    ...(request.method === "POST" ? { "Content-Type": "application/json" } : {}),
    ...(request.headers.get("prefer") ? { Prefer: request.headers.get("prefer")! } : {}),
  };

  if (request.method !== "GET" && request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "POST" ? await request.text() : undefined,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
  });
});
