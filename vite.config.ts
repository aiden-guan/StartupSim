import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

function leaderboardDevPlugin(): Plugin {
  return {
    name: "leaderboard-dev-api",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith("/api/leaderboard")) {
          try {
            const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
            const query: Record<string, string> = {};
            urlObj.searchParams.forEach((val, key) => {
              query[key] = val;
            });
            (req as any).query = query;

            const sendJson = (data: any) => {
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            };
            (res as any).status = (code: number) => {
              res.statusCode = code;
              return res;
            };
            (res as any).json = sendJson;

            const { default: handler } = await import("./api/leaderboard.ts");

            if (req.method === "POST") {
              let body = "";
              req.on("data", (chunk) => {
                body += chunk;
              });
              req.on("end", async () => {
                try {
                  (req as any).body = body ? JSON.parse(body) : {};
                } catch {
                  (req as any).body = {};
                }
                await handler(req as any, res as any);
              });
            } else {
              await handler(req as any, res as any);
            }
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: e.message }));
          }
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), leaderboardDevPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
