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
  if (!tasks.length && !ready.length) {
    return (
      <div className="progress-stack">
        <button className="progress-row" onClick={() => setDrawer("tasks")}>
          <span className="progress-kicker">Your next move</span>
          <strong>{game.company.seenMarket ? "What will you build next?" : "Your first product starts here."}</strong>
          <em>Open product lab →</em>
        </button>
      </div>
    );
  }
  return (
    <div className="progress-stack" tabIndex={0} aria-label="Active projects">
      {ready.map((product) => (
        <button key={product.id} className="progress-row is-ready" onClick={() => setDrawer("products")}>
          <span className="progress-kicker">Completed</span>
          <strong>{product.name}</strong>
          <div className="progress-track"><i style={{ width: "100%" }} /></div>
          <em>Configure launch →</em>
        </button>
      ))}
      {tasks.map((task) => {
        const estimate = taskEstimate(game, task);
        const status = statusOf(game, estimate);
        const pct = Math.min(100, (task.progress / Math.max(1, task.requiredProgress)) * 100);
        return (
          <button
            key={task.id}
            className={`progress-row is-${status.id}`}
            onClick={() => setDrawer("tasks")}
            title={status.label}
          >
            <span className="progress-kicker">{status.label}{estimate.days ? ` · ~${estimate.days}d` : ""}</span>
            <strong>{task.name}</strong>
            <div className="progress-track"><i style={{ width: `${pct}%` }} /></div>
            <em>
              {status.id === "compute"
                ? "Blocked by compute · buy capacity →"
                : status.id === "staff"
                  ? "No team assigned →"
                  : `${Math.round(pct)}%`}
            </em>
          </button>
        );
      })}
    </div>
  );
}
