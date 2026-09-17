import { useState } from "react";
import { BALANCE } from "../../config/balance";
import { models } from "../../data/models";
import { primitives } from "../../data/primitives";
import { findRecipe } from "../../data/recipes";
import { currentTutorialSlide } from "../../simulation/tutorial";
import { canAffordStat, launchCosts } from "../../simulation/products";
import { workersFor } from "../../simulation/tasks";
import type { BusinessModel, GameState, LaunchStat } from "../../simulation/types";
import { useGame } from "../../state/store";
import { money, pct } from "../format";
import { GameButton } from "../shared/controls";

const STATS: LaunchStat[] = ["deployment", "capability", "distribution"];
const MODELS: BusinessModel[] = ["free", "freemium", "subscription", "usage", "enterprise", "api", "ads"];

export function TasksPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const owned = primitives.filter((p) => game.company.primitives.includes(p.id));
  const [a, setA] = useState(owned[0]?.id ?? "chat");
  const [b, setB] = useState(owned[1]?.id ?? owned[0]?.id ?? "writing");
  const recipe = findRecipe(a, b);
  const highlight = currentTutorialSlide(game)?.highlightUI;

  return (
    <div className="space-y-5">
      <section className="border border-white/10 p-3">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-gold">Workbench</h3>
        <p className="mt-1 text-[#9aa3b2]">Two primitives. Unknown pairs still ship, as junk with a name.</p>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <select
            data-tutorial="primitive-a"
            className={`bg-[#243044] px-2 py-3 ${highlight === "primitive-a" ? "tutorial-pulse" : ""}`}
            value={a}
            onChange={(e) => setA(e.target.value)}
          >
            {owned.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="font-display text-2xl text-copper">+</div>
          <select className="bg-[#243044] px-2 py-3" value={b} onChange={(e) => setB(e.target.value)}>
            {owned.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 border border-dashed border-white/15 p-3 text-center">
          <div className="font-display text-xl">{recipe?.name ?? "Unnamed combination"}</div>
          <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">{recipe ? "Known recipe" : "Unknown — it will still ship"}</div>
        </div>
        <GameButton
          tone="primary"
          data-tutorial="start-product"
          className={`mt-3 w-full ${highlight === "start-product" || highlight === "new-product" ? "tutorial-pulse" : ""}`}
          disabled={!a || !b}
          onClick={() => dispatch({ type: "startProduct", a, b })}
        >
          Start development
        </GameButton>
      </section>
      {game.tasks.length === 0 ? <p className="text-[#9aa3b2]">No active work. Combine two ideas.</p> : null}
      {game.tasks.map((task) => {
        const crew = workersFor(task, game);
        const idle = game.employees.filter((w) => !w.taskId && w.burnoutDays <= 0);
        return (
          <section key={task.id} data-tutorial="assign-crew" className="border border-white/10 p-3">
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-medium">{task.name}</div>
                <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">{task.type}</div>
              </div>
              <div className="font-mono text-xs">
                {task.progress.toFixed(0)}/{task.requiredProgress.toFixed(0)}
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-white/10">
              <div className="h-full bg-copper" style={{ width: `${Math.min(100, (task.progress / Math.max(1, task.requiredProgress)) * 100)}%` }} />
            </div>
            <div className="mt-2 text-xs text-[#d8d1c4]">Assigned: {crew.length ? crew.map((w) => w.name.split(" ")[0]).join(", ") : "nobody"}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {idle.map((w) => (
                <button key={w.id} type="button" className="border border-white/15 px-2 py-1 text-[11px]" onClick={() => dispatch({ type: "assign", taskId: task.id, workerId: w.id })}>
                  + {w.name.split(" ")[0]}
                </button>
              ))}
              {crew.map((w) => (
                <button key={w.id} type="button" className="border border-copper/50 px-2 py-1 text-[11px]" onClick={() => dispatch({ type: "unassign", workerId: w.id })}>
                  − {w.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ProductsPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const highlight = currentTutorialSlide(game)?.highlightUI;
  return (
    <div className="space-y-4">
      {game.products.length === 0 ? <p className="text-[#9aa3b2]">Nothing in the catalog yet.</p> : null}
      {game.products.map((p) => (
        <section key={p.id} className="border border-white/10 p-3">
          <div className="flex justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center bg-copper/20 font-mono text-[10px] uppercase">
                  {p.combo[0]!.slice(0, 2)}+{p.combo[1]!.slice(0, 2)}
                </span>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
                    {p.status} · {p.vertical} · {p.recipeId === "generic" ? "generic" : "named"}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <div>{money(p.weeklyRevenue)}/wk</div>
              <div className="text-[#9aa3b2]">inf {money(p.weeklyInference)}</div>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#d8d1c4]">{p.description}</p>
          {(p.status === "ready" || p.status === "development") && (
            <div data-tutorial="designer" className={`mt-3 space-y-2 ${highlight === "designer" ? "tutorial-pulse" : ""}`}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Designer</div>
              {STATS.map((stat) => {
                const cost = launchCosts(p)[stat];
                return (
                  <div key={stat} className="flex items-center justify-between gap-2">
                    <span className="capitalize">
                      {stat} {p.levels[stat]}
                    </span>
                    <span className="text-[11px] text-[#9aa3b2]">cost {cost.toFixed(0)}</span>
                    <div className="flex gap-1">
                      <button type="button" className="border border-white/20 px-2 py-0.5 disabled:opacity-30" disabled={!canAffordStat(p, stat) || p.levels[stat] >= BALANCE.MAX_LAUNCH_LEVEL} onClick={() => dispatch({ type: "buyStat", productId: p.id, stat })}>
                        +
                      </button>
                      <button type="button" className="border border-white/20 px-2 py-0.5" disabled={p.levels[stat] <= 0} onClick={() => dispatch({ type: "refundStat", productId: p.id, stat })}>
                        −
                      </button>
                    </div>
                  </div>
                );
              })}
              <label className="block text-xs">
                Business model
                <select className="mt-1 w-full bg-[#243044] px-2 py-1" value={p.businessModel} onChange={(e) => dispatch({ type: "setBusinessModel", productId: p.id, model: e.target.value as BusinessModel })}>
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Model
                <select className="mt-1 w-full bg-[#243044] px-2 py-1" value={p.modelId} onChange={(e) => dispatch({ type: "setModel", productId: p.id, modelId: e.target.value })}>
                  {game.ownedModels.map((id) => (
                    <option key={id} value={id}>
                      {models.find((m) => m.id === id)?.name ?? id}
                    </option>
                  ))}
                </select>
              </label>
              {p.status === "ready" ? (
                <div className="flex gap-2">
                  <GameButton tone="primary" data-tutorial="enter-market" className={highlight === "enter-market" ? "tutorial-pulse" : ""} onClick={() => dispatch({ type: "enterMarket", productId: p.id })}>
                    Enter market
                  </GameButton>
                  {game.company.productsLaunched >= BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE ? (
                    <GameButton onClick={() => dispatch({ type: "delegateMarket", productId: p.id })}>Delegate</GameButton>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
          {(p.status === "active" || p.status === "mature" || p.status === "declining") && (
            <div className="mt-2 font-mono text-[11px] text-[#9aa3b2]">
              Share {pct(p.marketShare)} · users {Math.round(p.users).toLocaleString()} · earned {money(p.earnedRevenue)}
              <button type="button" className="ml-2 underline" onClick={() => dispatch({ type: "killProduct", productId: p.id })}>
                sunset
              </button>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
