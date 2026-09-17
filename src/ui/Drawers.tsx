import { useState, type ReactNode } from "react";
import { BALANCE } from "../config/balance";
import { locations } from "../data/locations";
import { lobbies } from "../data/lobbies";
import { models } from "../data/models";
import { offices } from "../data/offices";
import { perks } from "../data/perks";
import { primitives } from "../data/primitives";
import { promos } from "../data/promos";
import { recruitingChannels } from "../data/recruiting";
import { specialProjects } from "../data/specialProjects";
import { technologies } from "../data/technologies";
import { verticals } from "../data/verticals";
import { formatDate } from "../simulation/date";
import { grossMargin, monthlyArr, monthlyBurn, monthlyCompute, monthlyPayroll, monthlyRent, valuationOf } from "../simulation/derived";
import { canAffordStat, launchCosts } from "../simulation/products";
import { workersFor } from "../simulation/tasks";
import type { BusinessModel, DepartmentId, GameState, LaunchStat } from "../simulation/types";
import { useGame } from "../state/store";
import { money, pct } from "./format";
import { SavePanel } from "./SavePanel";

const STATS: LaunchStat[] = ["deployment", "capability", "distribution"];
const MODELS: BusinessModel[] = ["free", "freemium", "subscription", "usage", "enterprise", "api", "ads"];
const DEPTS: DepartmentId[] = [
  "engineering",
  "support",
  "sales",
  "marketing",
  "finance",
  "recruiting",
  "legal",
  "research",
  "management",
];

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const setDrawer = useGame((s) => s.setDrawer);
  return (
    <aside className="pointer-events-auto absolute bottom-3 right-3 top-28 z-20 flex w-[min(420px,42vw)] flex-col border border-white/10 bg-[#1b2433]/96 text-[#efe8dc] shadow-2xl backdrop-blur-sm">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-xl">{title}</h2>
        <button type="button" className="font-mono text-xs text-[#9aa3b2]" onClick={() => setDrawer(null)}>
          close
        </button>
      </header>
      <div className="panel-scroll min-h-0 flex-1 overflow-auto p-4 text-sm">{children}</div>
    </aside>
  );
}

function TasksPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const owned = primitives.filter((p) => game.company.primitives.includes(p.id));
  const [a, setA] = useState(owned[0]?.id ?? "chat");
  const [b, setB] = useState(owned[1]?.id ?? owned[0]?.id ?? "writing");

  return (
    <div className="space-y-5">
      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">New product</h3>
        <p className="mt-1 text-[#9aa3b2]">Two primitives. Unknown pairs still ship, as junk with a name.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select className="bg-[#243044] px-2 py-2" value={a} onChange={(e) => setA(e.target.value)}>
            {owned.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select className="bg-[#243044] px-2 py-2" value={b} onChange={(e) => setB(e.target.value)}>
            {owned.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="mt-2 bg-[#c4622d] px-3 py-2 text-white disabled:opacity-40"
          disabled={!a || !b}
          onClick={() => dispatch({ type: "startProduct", a, b })}
        >
          Start development
        </button>
      </section>
      {game.tasks.length === 0 ? <p className="text-[#9aa3b2]">No active work. Combine two ideas.</p> : null}
      {game.tasks.map((task) => {
        const crew = workersFor(task, game);
        const idle = game.employees.filter((w) => !w.taskId && w.burnoutDays <= 0);
        return (
          <section key={task.id} className="border border-white/10 p-3">
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
              <div
                className="h-full bg-[#c4622d]"
                style={{ width: `${Math.min(100, (task.progress / Math.max(1, task.requiredProgress)) * 100)}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-[#d8d1c4]">
              Assigned: {crew.length ? crew.map((w) => w.name.split(" ")[0]).join(", ") : "nobody"}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {idle.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className="border border-white/15 px-2 py-1 text-[11px]"
                  onClick={() => dispatch({ type: "assign", taskId: task.id, workerId: w.id })}
                >
                  + {w.name.split(" ")[0]}
                </button>
              ))}
              {crew.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className="border border-[#c4622d]/50 px-2 py-1 text-[11px]"
                  onClick={() => dispatch({ type: "unassign", workerId: w.id })}
                >
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

function ProductsPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-4">
      {game.products.length === 0 ? <p className="text-[#9aa3b2]">Nothing in the catalog yet.</p> : null}
      {game.products.map((p) => (
        <section key={p.id} className="border border-white/10 p-3">
          <div className="flex justify-between">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
                {p.status} · {p.vertical} · {p.recipeId === "generic" ? "generic" : "named"}
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <div>{money(p.weeklyRevenue)}/wk</div>
              <div className="text-[#9aa3b2]">inf {money(p.weeklyInference)}</div>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#d8d1c4]">{p.description}</p>
          <div className="mt-2 grid grid-cols-4 gap-1 font-mono text-[10px]">
            {(["engineering", "product", "growth", "research"] as const).map((k) => (
              <div key={k}>
                {k.slice(0, 3)} {p.points[k].toFixed(0)}
              </div>
            ))}
          </div>
          {(p.status === "ready" || p.status === "development") && (
            <div className="mt-3 space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Designer</div>
              {STATS.map((stat) => {
                const cost = launchCosts(p)[stat];
                return (
                  <div key={stat} className="flex items-center justify-between gap-2">
                    <span className="capitalize">
                      {stat} {p.levels[stat]}
                    </span>
                    <span className="text-[11px] text-[#9aa3b2]">cost {cost.toFixed(0)}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="border border-white/20 px-2 py-0.5 disabled:opacity-30"
                        disabled={!canAffordStat(p, stat) || p.levels[stat] >= BALANCE.MAX_LAUNCH_LEVEL}
                        onClick={() => dispatch({ type: "buyStat", productId: p.id, stat })}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="border border-white/20 px-2 py-0.5"
                        disabled={p.levels[stat] <= 0}
                        onClick={() => dispatch({ type: "refundStat", productId: p.id, stat })}
                      >
                        −
                      </button>
                    </div>
                  </div>
                );
              })}
              <label className="block text-xs">
                Business model
                <select
                  className="mt-1 w-full bg-[#243044] px-2 py-1"
                  value={p.businessModel}
                  onChange={(e) => dispatch({ type: "setBusinessModel", productId: p.id, model: e.target.value as BusinessModel })}
                >
                  {MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Model
                <select
                  className="mt-1 w-full bg-[#243044] px-2 py-1"
                  value={p.modelId}
                  onChange={(e) => dispatch({ type: "setModel", productId: p.id, modelId: e.target.value })}
                >
                  {game.ownedModels.map((id) => (
                    <option key={id} value={id}>
                      {models.find((m) => m.id === id)?.name ?? id}
                    </option>
                  ))}
                </select>
              </label>
              {p.status === "ready" ? (
                <div className="flex gap-2">
                  <button type="button" className="bg-[#c4622d] px-3 py-2 text-white" onClick={() => dispatch({ type: "enterMarket", productId: p.id })}>
                    Enter market
                  </button>
                  {game.company.productsLaunched >= BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE ? (
                    <button type="button" className="border border-white/20 px-3 py-2" onClick={() => dispatch({ type: "delegateMarket", productId: p.id })}>
                      Delegate
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
          {(p.status === "active" || p.status === "mature" || p.status === "declining") && (
            <div className="mt-2 font-mono text-[11px] text-[#9aa3b2]">
              Share {pct(p.marketShare)} · users {Math.round(p.users).toLocaleString()} · earned {money(p.earnedRevenue)} ·
              reliability {pct(p.reliability * 100)}
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

function PeoplePanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const selected = useGame((s) => s.selectedEmployeeId);
  return (
    <div className="space-y-3">
      {game.employees.map((w) => (
        <section key={w.id} className={`border p-3 ${selected === w.id ? "border-[#c4622d]" : "border-white/10"}`}>
          <div className="flex justify-between">
            <div>
              <div className="font-medium">{w.name}</div>
              <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
                {w.title} · {w.role}
                {w.burnoutDays > 0 ? " · burned out" : ""}
                {w.remote ? " · remote" : ""}
              </div>
            </div>
            <div className="font-mono text-xs">{money(w.salary)}/yr</div>
          </div>
          <div className="mt-2 grid grid-cols-5 gap-1 font-mono text-[10px]">
            {(["research", "engineering", "product", "growth", "productivity"] as const).map((k) => (
              <div key={k}>
                {k.slice(0, 1).toUpperCase()} {w.skills[k].toFixed(1)}
              </div>
            ))}
          </div>
          <div className="mt-1 text-[11px] text-[#9aa3b2]">
            Happy {w.happiness.toFixed(0)} · loyalty {w.loyalty} · {w.traits.join(", ") || "no traits"}
          </div>
          {w.role !== "founder" ? (
            <button type="button" className="mt-2 text-[11px] text-[#e07a7a]" onClick={() => dispatch({ type: "fire", workerId: w.id })}>
              Let go
            </button>
          ) : null}
        </section>
      ))}
    </div>
  );
}

function HiringPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const [offers, setOffers] = useState<Record<string, number>>({});
  return (
    <div className="space-y-4">
      <p className="text-[#9aa3b2]">A channel costs cash and returns a short list. Lowball them and they walk.</p>
      {game.hiring.cooldownDays > 0 ? <p className="font-mono text-xs">Cooldown {game.hiring.cooldownDays}d</p> : null}
      <div className="grid gap-2">
        {recruitingChannels
          .filter((c) => !c.robots || game.company.technologies.includes("agents"))
          .map((c) => (
            <button
              key={c.id}
              type="button"
              className="border border-white/15 px-3 py-2 text-left disabled:opacity-40"
              disabled={game.hiring.cooldownDays > 0 || game.company.cash < c.cost}
              onClick={() => dispatch({ type: "recruit", channelId: c.id })}
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-[11px] text-[#9aa3b2]">
                {c.description} · {money(c.cost)}
              </div>
            </button>
          ))}
      </div>
      {game.hiring.candidates.map((c) => {
        const salary = offers[c.employee.id] ?? c.minSalary;
        return (
          <section key={c.employee.id} className="border border-white/10 p-3">
            <div className="font-medium">{c.employee.name}</div>
            <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
              {c.employee.title} · {c.personality} · {c.employee.traits.join(", ")}
            </div>
            <div className="mt-1 font-mono text-[11px]">
              R{c.employee.skills.research} E{c.employee.skills.engineering} P{c.employee.skills.product} G{c.employee.skills.growth}
            </div>
            <label className="mt-2 block text-xs">
              Offer
              <input
                type="number"
                className="ml-2 w-32 bg-[#243044] px-2 py-1"
                value={salary}
                onChange={(e) => setOffers({ ...offers, [c.employee.id]: Number(e.target.value) })}
              />
            </label>
            <div className="text-[11px] text-[#9aa3b2]">They want about {money(c.minSalary)}</div>
            <button
              type="button"
              className="mt-2 bg-[#c4622d] px-3 py-1 text-white"
              onClick={() => dispatch({ type: "hire", candidateId: c.employee.id, salary })}
            >
              Hire
            </button>
          </section>
        );
      })}
    </div>
  );
}

function ResearchPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-3">
      {technologies.map((t) => {
        const have = game.company.technologies.includes(t.id);
        const hidden = t.hiddenUntil?.some((id) => !game.company.technologies.includes(id));
        const locked = t.requires.some((id) => !game.company.technologies.includes(id));
        const busy = game.tasks.some((task) => task.techId === t.id);
        if (hidden) {
          return (
            <div key={t.id} className="border border-white/10 p-3 text-[#5d6573]">
              ???
            </div>
          );
        }
        return (
          <section key={t.id} className="border border-white/10 p-3">
            <div className="flex justify-between">
              <div className="font-medium">{t.name}</div>
              <div className="font-mono text-[10px]">era {t.era}</div>
            </div>
            <p className="mt-1 text-xs text-[#9aa3b2]">{t.description}</p>
            {have ? (
              <div className="mt-1 text-[11px] text-[#1f6b4a]">Complete</div>
            ) : (
              <button
                type="button"
                className="mt-2 border border-white/20 px-3 py-1 disabled:opacity-40"
                disabled={locked || busy || game.company.cash < t.cost || Boolean(t.requiredVertical && !game.company.verticals.includes(t.requiredVertical))}
                onClick={() => dispatch({ type: "startResearch", techId: t.id })}
              >
                Research · {money(t.cost)}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}

function FinancePanel({ game }: { game: GameState }) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <div>
          <dt className="text-[10px] uppercase text-[#9aa3b2]">Cash</dt>
          <dd>{money(game.company.cash)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#9aa3b2]">ARR</dt>
          <dd>{money(monthlyArr(game) * 12)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#9aa3b2]">Payroll / mo</dt>
          <dd>{money(monthlyPayroll(game))}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#9aa3b2]">Rent / mo</dt>
          <dd>{money(monthlyRent(game))}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#9aa3b2]">Compute / mo</dt>
          <dd>{money(monthlyCompute(game))}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#9aa3b2]">Burn</dt>
          <dd>{money(monthlyBurn(game))}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#9aa3b2]">Gross margin</dt>
          <dd>{pct(grossMargin(game) * 100)}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#9aa3b2]">Valuation</dt>
          <dd>{money(valuationOf(game))}</dd>
        </div>
      </dl>
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Cap table</h3>
      {Object.entries(game.company.ownership).map(([k, v]) => (
        <div key={k} className="flex justify-between font-mono text-xs">
          <span className="capitalize">{k}</span>
          <span>{pct(v * 100)}</span>
        </div>
      ))}
      {game.board ? (
        <section className="border border-white/10 p-3">
          <div className="font-medium">Board</div>
          <div className="text-xs text-[#9aa3b2]">
            Approval {pct(game.board.approval)} · {game.board.pressure} · target {money(game.board.arrTarget * 12)} ARR · grace{" "}
            {game.board.graceMonths} mo
          </div>
          <div className="mt-1 text-xs">{game.board.members.join(", ")}</div>
        </section>
      ) : (
        <p className="text-xs text-[#9aa3b2]">No board until you take institutional money.</p>
      )}
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Product economics</h3>
      {game.products
        .filter((p) => p.status === "active" || p.status === "mature" || p.status === "declining")
        .map((p) => (
          <div key={p.id} className="flex justify-between border border-white/10 px-2 py-1 font-mono text-xs">
            <span>{p.name}</span>
            <span>
              {money(p.weeklyRevenue)} − {money(p.weeklyInference)}
            </span>
          </div>
        ))}
    </div>
  );
}

function ComputePanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-4">
      <p className="text-[#9aa3b2]">Credits soak inference first. Then cash. GPUs are a mood and a bill.</p>
      <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
        <div>Credits {money(game.compute.apiCredits)}</div>
        <div>Rented GPUs {game.compute.rentedGpus}</div>
        <div>Owned cluster {game.compute.ownedCluster}</div>
        <div>Data centers {game.compute.dataCenters}</div>
        <div>Cloud bill {money(game.compute.monthlyCloudBill)}</div>
        <div>Chips {game.compute.customChips}</div>
      </dl>
      <label className="block text-xs">
        Rent GPUs
        <input
          type="number"
          min={0}
          className="ml-2 w-20 bg-[#243044] px-2 py-1"
          value={game.compute.rentedGpus}
          onChange={(e) => dispatch({ type: "rentGpus", count: Number(e.target.value) })}
        />
      </label>
      <button type="button" className="border border-white/20 px-3 py-2" onClick={() => dispatch({ type: "buyCluster" })}>
        Buy cluster {money(400_000)}
      </button>
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">House model</h3>
      <select
        className="w-full bg-[#243044] px-2 py-2"
        value={game.currentModelId}
        onChange={(e) => dispatch({ type: "setCompanyModel", modelId: e.target.value })}
      >
        {models
          .filter((m) => m.provider !== "You" || game.ownedModels.includes(m.id))
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · {m.provider} · ${m.costPerMTok}/MTok
            </option>
          ))}
      </select>
      {game.unlocks.automation ? (
        <div className="space-y-2">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Automation</h3>
          {DEPTS.map((d) => (
            <label key={d} className="flex items-center justify-between text-xs capitalize">
              {d}
              <input
                type="range"
                min={0}
                max={100}
                value={game.company.automation[d]}
                onChange={(e) => dispatch({ type: "setAutomation", department: d, percent: Number(e.target.value) })}
              />
              <span className="w-8 font-mono">{game.company.automation[d]}</span>
            </label>
          ))}
          <div className="flex flex-wrap gap-1">
            {(["engineering", "support", "sales", "research"] as const).map((k) => (
              <button key={k} type="button" className="border border-white/20 px-2 py-1 text-[11px]" onClick={() => dispatch({ type: "deployAiWorker", kind: k })}>
                Deploy {k} agent
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FundingPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-3">
      <p className="text-[#9aa3b2]">Two or three cards. Cash is real. So is the chart.</p>
      <button
        type="button"
        className="bg-[#c4622d] px-3 py-2 text-white disabled:opacity-40"
        disabled={game.funding.cooldownDays > 0}
        onClick={() => dispatch({ type: "generateFunding" })}
      >
        Take meetings {game.funding.cooldownDays ? `(${game.funding.cooldownDays}d)` : ""}
      </button>
      {game.funding.offers.map((o) => (
        <section key={o.id} className="border border-white/10 p-3">
          <div className="font-medium">{o.investor}</div>
          <div className="font-mono text-[10px] uppercase text-[#c9a227]">
            {o.round} · {o.archetype}
          </div>
          <p className="mt-1 text-xs">{o.notes}</p>
          <div className="mt-2 font-mono text-xs">
            {money(o.cash)} at {money(o.valuation)} · dilution {pct(o.dilution * 100)}
          </div>
          <button type="button" className="mt-2 border border-white/20 px-3 py-1" onClick={() => dispatch({ type: "acceptOffer", offerId: o.id })}>
            Accept
          </button>
        </section>
      ))}
    </div>
  );
}

function PerksPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-3">
      {game.unlocks.promo ? (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Promos</h3>
          <div className="mt-2 grid gap-2">
            {promos.map((p) => (
              <button
                key={p.id}
                type="button"
                className="border border-white/15 px-3 py-2 text-left disabled:opacity-40"
                disabled={game.company.cash < p.cost}
                onClick={() => dispatch({ type: "startPromo", promoId: p.id })}
              >
                <div>{p.name}</div>
                <div className="text-[11px] text-[#9aa3b2]">
                  {p.description} · {money(p.cost)}
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      {perks.map((perk) => {
        const owned = game.company.perks.find((p) => p.id === perk.id);
        const next = perk.upgrades[(owned ? owned.level + 1 : 0)];
        return (
          <section key={perk.id} className="border border-white/10 p-3">
            <div className="font-medium">{perk.name}</div>
            <div className="text-[11px] text-[#9aa3b2]">{owned ? perk.upgrades[owned.level]?.name : "None yet"}</div>
            {next ? (
              <button
                type="button"
                className="mt-2 border border-white/20 px-3 py-1 disabled:opacity-40"
                disabled={game.company.cash < next.cost || game.company.officeLevel < next.requiredOffice}
                onClick={() => dispatch({ type: "buyPerk", perkId: perk.id })}
              >
                {next.name} · {money(next.cost)}
              </button>
            ) : (
              <div className="mt-1 text-[11px] text-[#1f6b4a]">Maxed</div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function WorldPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">World meters</h3>
      {Object.entries(game.world).map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span>{k}</span>
            <span>{v.toFixed(0)}</span>
          </div>
          <div className="h-1 bg-white/10">
            <div className="h-full bg-[#c9a227]" style={{ width: `${Math.min(100, v)}%` }} />
          </div>
        </div>
      ))}
      <div className="font-mono text-xs">Economy: {game.economy}</div>
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Competitors</h3>
      {game.competitors.map((c) => (
        <div key={c.id} className="flex items-start justify-between border border-white/10 p-2">
          <div>
            <div>{c.name}</div>
            <div className="font-mono text-[10px] text-[#9aa3b2]">
              {c.archetype} · {c.personality} · share {pct(c.marketShare)}
              {c.disabled ? " · acquired" : ""}
            </div>
          </div>
          {game.unlocks.acquisitions && !c.disabled ? (
            <button type="button" className="text-[11px] underline" onClick={() => dispatch({ type: "acquire", competitorId: c.id })}>
              Acquire
            </button>
          ) : null}
        </div>
      ))}
      {game.unlocks.locations ? (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Locations</h3>
          {locations.map((l) => (
            <button
              key={l.id}
              type="button"
              className="mt-1 w-full border border-white/10 px-2 py-2 text-left disabled:opacity-40"
              disabled={game.company.locations.includes(l.id) || game.company.cash < l.cost}
              onClick={() => dispatch({ type: "buyLocation", locationId: l.id })}
            >
              {l.name} · {money(l.cost)} {game.company.locations.includes(l.id) ? "· open" : ""}
              <div className="text-[11px] text-[#9aa3b2]">{l.bonuses}</div>
            </button>
          ))}
        </section>
      ) : null}
      {game.unlocks.verticals ? (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Verticals</h3>
          {verticals.map((v) => (
            <button
              key={v.id}
              type="button"
              className="mt-1 w-full border border-white/10 px-2 py-2 text-left disabled:opacity-40"
              disabled={game.company.verticals.includes(v.id) || game.company.cash < v.cost}
              onClick={() => dispatch({ type: "buyVertical", verticalId: v.id })}
            >
              {v.name} · {money(v.cost)}
            </button>
          ))}
        </section>
      ) : null}
      <section>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Special projects</h3>
        {specialProjects.map((p) => {
          const ready = p.requiresTechs.every((t) => game.company.technologies.includes(t));
          const done = game.company.specialProjects.includes(p.id);
          const busy = game.tasks.some((t) => t.projectId === p.id);
          return (
            <button
              key={p.id}
              type="button"
              className="mt-1 w-full border border-white/10 px-2 py-2 text-left disabled:opacity-40"
              disabled={!ready || done || busy || game.company.cash < p.cost}
              onClick={() => dispatch({ type: "startProject", projectId: p.id })}
            >
              {p.name} · {done ? "done" : money(p.cost)}
              <div className="text-[11px] text-[#9aa3b2]">{p.description}</div>
            </button>
          );
        })}
      </section>
      {game.unlocks.lobbying ? (
        <section>
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Lobbying</h3>
          {lobbies.map((l) => (
            <button
              key={l.id}
              type="button"
              className="mt-1 w-full border border-white/10 px-2 py-2 text-left disabled:opacity-40"
              disabled={game.company.lobbies.includes(l.id) || game.company.cash < l.cost}
              onClick={() => dispatch({ type: "startLobby", lobbyId: l.id })}
            >
              {l.name} · {money(l.cost)}
            </button>
          ))}
        </section>
      ) : null}
    </div>
  );
}

function InboxPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">Inbox</h3>
      {game.inbox.length === 0 ? <p className="text-[#9aa3b2]">Quiet, for now.</p> : null}
      {game.inbox.slice(0, 20).map((m) => (
        <section key={m.id} className={`border p-3 ${m.read ? "border-white/10" : "border-[#c4622d]"}`}>
          <button type="button" className="w-full text-left" onClick={() => dispatch({ type: "readMail", mailId: m.id })}>
            <div className="font-medium">{m.subject}</div>
            <div className="font-mono text-[10px] text-[#9aa3b2]">
              {m.from} · {formatDate(m.at)}
            </div>
            <p className="mt-2 text-xs leading-relaxed">{m.body}</p>
          </button>
          {m.choices?.map((c) => (
            <button
              key={c.id}
              type="button"
              className="mt-2 mr-2 border border-white/20 px-2 py-1 text-[11px]"
              onClick={() => dispatch({ type: "mailChoice", mailId: m.id, choiceId: c.id })}
            >
              {c.label}
            </button>
          ))}
        </section>
      ))}
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">News</h3>
      {game.news.slice(0, 12).map((n) => (
        <article key={n.id} className="border-b border-white/10 pb-2">
          <div className="font-medium">{n.headline}</div>
          <div className="text-[11px] text-[#9aa3b2]">{n.body}</div>
        </article>
      ))}
    </div>
  );
}

function CompanyPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const loadGame = useGame((s) => s.loadGame);
  const office = offices[game.company.officeLevel];
  const next = offices[game.company.officeLevel + 1];

  return (
    <div className="space-y-4">
      <div>
        <div className="font-display text-2xl">{game.company.name}</div>
        <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
          {office?.name} · cap {office?.capacity} · {game.employees.length} people
        </div>
      </div>
      {next ? (
        <button
          type="button"
          className="bg-[#c4622d] px-3 py-2 text-white disabled:opacity-40"
          disabled={game.company.cash < next.cost}
          onClick={() => dispatch({ type: "upgradeOffice" })}
        >
          Upgrade to {next.name} · {money(next.cost)}
        </button>
      ) : (
        <p className="text-xs text-[#9aa3b2]">The campus is as large as representation allows.</p>
      )}
      <div className="text-xs text-[#9aa3b2]">
        Hype {game.company.hype.toFixed(0)} · backlash {game.company.backlash.toFixed(0)} · prestige {game.company.prestige.toFixed(0)} ·
        trust {game.company.trust.toFixed(0)}
      </div>
      <SavePanel game={game} onLoad={loadGame} variant="company" />
      <button type="button" className="text-xs underline" onClick={() => dispatch({ type: "retire" })}>
        Close the books
      </button>
    </div>
  );
}

export function Drawers({ game }: { game: GameState }) {
  const drawer = useGame((s) => s.drawer);
  if (!drawer) return null;
  const body =
    drawer === "tasks" ? (
      <TasksPanel game={game} />
    ) : drawer === "products" ? (
      <ProductsPanel game={game} />
    ) : drawer === "people" ? (
      <PeoplePanel game={game} />
    ) : drawer === "hiring" ? (
      <HiringPanel game={game} />
    ) : drawer === "research" ? (
      <ResearchPanel game={game} />
    ) : drawer === "finance" ? (
      <FinancePanel game={game} />
    ) : drawer === "compute" ? (
      <ComputePanel game={game} />
    ) : drawer === "funding" ? (
      <FundingPanel game={game} />
    ) : drawer === "perks" ? (
      <PerksPanel game={game} />
    ) : drawer === "world" ? (
      <WorldPanel game={game} />
    ) : drawer === "inbox" ? (
      <InboxPanel game={game} />
    ) : (
      <CompanyPanel game={game} />
    );
  const titles: Record<string, string> = {
    tasks: "Tasks",
    products: "Products",
    people: "People",
    hiring: "Hiring",
    research: "Research",
    finance: "Finance",
    compute: "Compute",
    funding: "Raise",
    perks: "Culture",
    world: "World",
    inbox: "Inbox",
    company: "Company",
  };
  return <Panel title={titles[drawer] ?? drawer}>{body}</Panel>;
}
