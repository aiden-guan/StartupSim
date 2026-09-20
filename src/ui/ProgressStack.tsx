import { taskEstimate } from "../simulation/tasks";
import type { GameState } from "../simulation/types";
import { useGame } from "../state/store";

function statusOf(game: GameState, estimate: ReturnType<typeof taskEstimate>) {
  if (estimate.computeBlocked) return { id: "compute", label: "Compute blocked" };
  if (estimate.understaffed) return { id: "staff", label: "Understaffed" };
  if (estimate.resting) return { id: "rest", label: "Team resting" };
  if (game.clock.paused) return { id: "paused", label: "Paused" };
  return { id: "active", label: "Active" };
}

export function ProgressStack({ game }: { game: GameState }) {
  const setDrawer = useGame((s) => s.setDrawer);
  const tasks = game.tasks;
  const ready = game.products.filter((p) => p.status === "ready");
  const primaryReady = ready[0];
  const primaryTask = tasks[0];

  if (!tasks.length && !ready.length) {
    return (
      <div className="progress-stack">
        <button className="progress-row" onClick={() => setDrawer("tasks")}>
          <span className="progress-kicker">Next action</span>
          <strong>{game.company.seenMarket ? "Choose your next product." : "Build your first product."}</strong>
          <em>Open product lab →</em>
        </button>
      </div>
    );
  }

  // The office should point to one useful decision, not reproduce every
  // project already available in Product lab. The rest remain one click away.
  if (primaryReady) {
    return (
      <div className="progress-stack" tabIndex={0} aria-label="Next product decision">
        <button className="progress-row is-ready" onClick={() => setDrawer("products")}>
          <span className="progress-kicker">Ready to launch</span>
          <strong>{primaryReady.name}</strong>
          <em>Open Launches →{ready.length > 1 ? ` · ${ready.length - 1} more ready` : ""}</em>
        </button>
      </div>
    );
  }

  if (primaryTask) {
    const estimate = taskEstimate(game, primaryTask);
    const status = statusOf(game, estimate);
    const pct = Math.min(100, (primaryTask.progress / Math.max(1, primaryTask.requiredProgress)) * 100);
    return (
      <div className="progress-stack" tabIndex={0} aria-label="Next project decision">
        <button
          className={`progress-row is-${status.id}`}
          onClick={() => setDrawer("tasks")}
          title={status.label}
        >
          <span className="progress-kicker">{status.label}{estimate.days ? ` · ~${estimate.days}d` : ""}</span>
          <strong>{primaryTask.name}</strong>
          <div className="progress-track"><i style={{ width: `${pct}%` }} /></div>
          <em>
            {status.id === "compute"
              ? "Buy capacity to continue →"
              : status.id === "staff"
                ? "Assign a team →"
                : `${Math.round(pct)}% complete${tasks.length > 1 ? ` · ${tasks.length - 1} more in Build` : ""}`}
          </em>
        </button>
      </div>
    );
  }

  return null;
}
