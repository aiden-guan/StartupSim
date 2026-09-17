import { BALANCE } from "../../config/balance";
import { locations } from "../../data/locations";
import { lobbies } from "../../data/lobbies";
import { models } from "../../data/models";
import { offices } from "../../data/offices";
import { perks } from "../../data/perks";
import { promos } from "../../data/promos";
import { specialProjects } from "../../data/specialProjects";
import { technologies } from "../../data/technologies";
import { verticals } from "../../data/verticals";
import { formatDate } from "../../simulation/date";
import { grossMargin, monthlyArr, monthlyBurn, monthlyCompute, monthlyPayroll, monthlyRent, valuationOf } from "../../simulation/derived";
import type { DepartmentId, GameState } from "../../simulation/types";
import { useGame } from "../../state/store";
import { SavePanel } from "../SavePanel";
import { money, pct } from "../format";
import { GameButton } from "../shared/controls";
import { competitors as competitorDefs } from "../../data/competitors";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import { lookFromSeed } from "../../simulation/look";

const DEPTS: DepartmentId[] = ["engineering", "support", "sales", "marketing", "finance", "recruiting", "legal", "research", "management"];

export function ResearchPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const eras = [1, 2, 3, 4, 5] as const;
  return (
    <div className="space-y-5">
      {eras.map((era) => (
        <section key={era} className="relative">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-gold">Era {era}</h3>
          <div className="mt-2 grid gap-2 border-l border-copper/40 pl-3">
            {technologies
              .filter((t) => t.era === era)
              .map((t) => {
                const have = game.company.technologies.includes(t.id);
                const hidden = t.hiddenUntil?.some((id) => !game.company.technologies.includes(id));
                const locked = t.requires.some((id) => !game.company.technologies.includes(id));
                const busy = game.tasks.some((task) => task.techId === t.id);
                if (hidden) {
                  return (
                    <div key={t.id} className="border border-dashed border-white/10 p-3 text-[#5d6573]">
                      ???
                    </div>
                  );
                }
                return (
                  <div key={t.id} className={`border p-3 ${have ? "border-ledger/40 bg-ledger/10" : locked ? "border-white/10 opacity-60" : "border-white/10"}`}>
                    <div className="flex justify-between">
                      <div className="font-medium">{t.name}</div>
                      {have ? <span className="text-[11px] text-ledger">On</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-[#9aa3b2]">{t.description}</p>
                    {t.requires.length ? <div className="mt-1 font-mono text-[9px] uppercase text-[#9aa3b2]">Needs {t.requires.join(", ")}</div> : null}
                    {!have ? (
                      <GameButton className="mt-2" disabled={locked || busy || game.company.cash < t.cost || Boolean(t.requiredVertical && !game.company.verticals.includes(t.requiredVertical))} onClick={() => dispatch({ type: "startResearch", techId: t.id })}>
                        Research · {money(t.cost)}
                      </GameButton>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function FinancePanel({ game }: { game: GameState }) {
  return (
    <div className="space-y-4 font-mono text-sm">
      <div className="grid grid-cols-2 gap-2 border border-white/10 p-3">
        <div>Cash {money(game.company.cash)}</div>
        <div>ARR {money(monthlyArr(game) * 12)}</div>
        <div>Payroll {money(monthlyPayroll(game))}</div>
        <div>Rent {money(monthlyRent(game))}</div>
        <div>Compute {money(monthlyCompute(game))}</div>
        <div>Burn {money(monthlyBurn(game))}</div>
        <div>Margin {pct(grossMargin(game) * 100)}</div>
        <div>Value {money(valuationOf(game))}</div>
      </div>
      <h3 className="text-[10px] uppercase tracking-widest text-gold">Cap table</h3>
      {Object.entries(game.company.ownership).map(([k, v]) => (
        <div key={k} className="flex justify-between text-xs">
          <span className="capitalize">{k}</span>
          <span>{pct(v * 100)}</span>
        </div>
      ))}
      {game.board ? (
        <section className="border border-white/10 p-3 text-xs">
          Board {pct(game.board.approval)} · {game.board.pressure} · {game.board.members.join(", ")}
        </section>
      ) : (
        <p className="text-xs text-[#9aa3b2]">No board until you take institutional money.</p>
      )}
    </div>
  );
}

export function ComputePanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-4">
      <p className="text-[#9aa3b2]">Credits soak inference first. Then cash. GPUs are a mood and a bill.</p>
      <dl className="grid grid-cols-2 gap-2 font-mono text-xs">
        <div>Credits {money(game.compute.apiCredits)}</div>
        <div>Rented GPUs {game.compute.rentedGpus}</div>
        <div>Owned cluster {game.compute.ownedCluster}</div>
        <div>Cloud {money(game.compute.monthlyCloudBill)}</div>
      </dl>
      <label className="block text-xs">
        Rent GPUs
        <input type="number" min={0} className="ml-2 w-20 bg-[#243044] px-2 py-1" value={game.compute.rentedGpus} onChange={(e) => dispatch({ type: "rentGpus", count: Number(e.target.value) })} />
      </label>
      <GameButton onClick={() => dispatch({ type: "buyCluster" })}>Buy cluster {money(400_000)}</GameButton>
      <select className="w-full bg-[#243044] px-2 py-2" value={game.currentModelId} onChange={(e) => dispatch({ type: "setCompanyModel", modelId: e.target.value })}>
        {models
          .filter((m) => m.provider !== "You" || game.ownedModels.includes(m.id))
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · {m.provider}
            </option>
          ))}
      </select>
      {game.unlocks.automation ? (
        <div className="space-y-2">
          {DEPTS.map((d) => (
            <label key={d} className="flex items-center justify-between text-xs capitalize">
              {d}
              <input type="range" min={0} max={100} value={game.company.automation[d]} onChange={(e) => dispatch({ type: "setAutomation", department: d, percent: Number(e.target.value) })} />
              <span className="w-8 font-mono">{game.company.automation[d]}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FundingPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-3">
      <GameButton tone="primary" disabled={game.funding.cooldownDays > 0} onClick={() => dispatch({ type: "generateFunding" })}>
        Take meetings {game.funding.cooldownDays ? `(${game.funding.cooldownDays}d)` : ""}
      </GameButton>
      {game.funding.offers.map((o) => (
        <section key={o.id} className="flex gap-3 border border-white/10 p-3">
          <CharacterPortrait look={lookFromSeed(o.investor, o.archetype)} className="h-16 w-14 shrink-0" />
          <div>
            <div className="font-medium">{o.investor}</div>
            <div className="font-mono text-[10px] uppercase text-gold">
              {o.round} · {o.archetype}
            </div>
            <p className="mt-1 text-xs">{o.notes}</p>
            <div className="mt-2 font-mono text-xs">
              {money(o.cash)} at {money(o.valuation)} · {pct(o.dilution * 100)}
            </div>
            <GameButton className="mt-2" onClick={() => dispatch({ type: "acceptOffer", offerId: o.id })}>
              Accept
            </GameButton>
          </div>
        </section>
      ))}
    </div>
  );
}

export function PerksPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-3">
      {game.unlocks.promo
        ? promos.map((p) => (
            <GameButton key={p.id} className="w-full text-left" disabled={game.company.cash < p.cost} onClick={() => dispatch({ type: "startPromo", promoId: p.id })}>
              {p.name} · {money(p.cost)}
            </GameButton>
          ))
        : null}
      {perks.map((perk) => {
        const owned = game.company.perks.find((p) => p.id === perk.id);
        const next = perk.upgrades[owned ? owned.level + 1 : 0];
        return (
          <section key={perk.id} className="border border-white/10 p-3">
            <div className="font-medium">{perk.name}</div>
            <div className="text-[11px] text-[#9aa3b2]">{owned ? perk.upgrades[owned.level]?.name : "None yet"}</div>
            {next ? (
              <GameButton className="mt-2" disabled={game.company.cash < next.cost || game.company.officeLevel < next.requiredOffice} onClick={() => dispatch({ type: "buyPerk", perkId: perk.id })}>
                {next.name} · {money(next.cost)}
              </GameButton>
            ) : (
              <div className="mt-1 text-[11px] text-ledger">Maxed</div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function WorldPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-4">
      {Object.entries(game.world).map(([k, v]) => (
        <div key={k}>
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span>{k}</span>
            <span>{v.toFixed(0)}</span>
          </div>
          <div className="h-1 bg-white/10">
            <div className="h-full bg-gold" style={{ width: `${Math.min(100, v)}%` }} />
          </div>
        </div>
      ))}
      <div className="font-mono text-xs">Economy: {game.economy}</div>
      {game.competitors.map((c) => (
        <div key={c.id} className="flex gap-3 border border-white/10 p-2">
          <CharacterPortrait look={lookFromSeed(c.id, competitorDefs.find((d) => d.id === c.id)?.archetype)} className="h-14 w-12 shrink-0" />
          <div className="flex flex-1 justify-between">
            <div>
              <div>{c.name}</div>
              <div className="font-mono text-[10px] text-[#9aa3b2]">
                {competitorDefs.find((d) => d.id === c.id)?.founder} · {c.personality} · {pct(c.marketShare)}
              </div>
            </div>
            {game.unlocks.acquisitions && !c.disabled ? (
              <button type="button" className="text-[11px] underline" onClick={() => dispatch({ type: "acquire", competitorId: c.id })}>
                Acquire
              </button>
            ) : null}
          </div>
        </div>
      ))}
      {game.unlocks.locations
        ? locations.map((l) => (
            <GameButton key={l.id} className="mt-1 w-full text-left" disabled={game.company.locations.includes(l.id) || game.company.cash < l.cost} onClick={() => dispatch({ type: "buyLocation", locationId: l.id })}>
              {l.name} · {money(l.cost)}
            </GameButton>
          ))
        : null}
      {game.unlocks.verticals
        ? verticals.map((v) => (
            <GameButton key={v.id} className="mt-1 w-full text-left" disabled={game.company.verticals.includes(v.id) || game.company.cash < v.cost} onClick={() => dispatch({ type: "buyVertical", verticalId: v.id })}>
              {v.name} · {money(v.cost)}
            </GameButton>
          ))
        : null}
      {specialProjects.map((p) => {
        const ready = p.requiresTechs.every((t) => game.company.technologies.includes(t));
        const done = game.company.specialProjects.includes(p.id);
        return (
          <GameButton key={p.id} className="mt-1 w-full text-left" disabled={!ready || done || game.company.cash < p.cost} onClick={() => dispatch({ type: "startProject", projectId: p.id })}>
            {p.name} · {done ? "done" : money(p.cost)}
          </GameButton>
        );
      })}
      {game.unlocks.lobbying
        ? lobbies.map((l) => (
            <GameButton key={l.id} className="mt-1 w-full text-left" disabled={game.company.lobbies.includes(l.id) || game.company.cash < l.cost} onClick={() => dispatch({ type: "startLobby", lobbyId: l.id })}>
              {l.name} · {money(l.cost)}
            </GameButton>
          ))
        : null}
    </div>
  );
}

export function InboxPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-4">
      {game.inbox.slice(0, 20).map((m) => (
        <section key={m.id} className={`border p-3 ${m.read ? "border-line" : "border-copper"}`}>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-copper">From {m.from}</div>
          <button type="button" className="w-full text-left" onClick={() => dispatch({ type: "readMail", mailId: m.id })}>
            <div className="font-display text-lg">{m.subject}</div>
            <div className="font-mono text-[10px] text-muted">{formatDate(m.at)}</div>
            <p className="mt-2 text-xs leading-relaxed">{m.body}</p>
          </button>
          {m.choices?.map((c) => (
            <GameButton key={c.id} className="mt-2 mr-2 border-line text-ink" onClick={() => dispatch({ type: "mailChoice", mailId: m.id, choiceId: c.id })}>
              {c.label}
            </GameButton>
          ))}
        </section>
      ))}
      {game.news.slice(0, 12).map((n) => (
        <article key={n.id} className="border-b border-white/10 pb-2">
          <div className="font-medium">{n.headline}</div>
          <div className="text-[11px] text-[#9aa3b2]">{n.body}</div>
        </article>
      ))}
    </div>
  );
}

export function CompanyPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const loadGame = useGame((s) => s.loadGame);
  const office = offices[game.company.officeLevel];
  const next = offices[game.company.officeLevel + 1];
  return (
    <div className="space-y-4">
      <div className="font-display text-2xl">{game.company.name}</div>
      <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
        {office?.name} · cap {office?.capacity} · {game.employees.length} people
      </div>
      {next ? (
        <GameButton tone="primary" disabled={game.company.cash < next.cost} onClick={() => dispatch({ type: "upgradeOffice" })}>
          Upgrade to {next.name} · {money(next.cost)}
        </GameButton>
      ) : (
        <p className="text-xs text-[#9aa3b2]">The campus is as large as representation allows.</p>
      )}
      <SavePanel game={game} onLoad={loadGame} variant="company" />
      <button type="button" className="text-xs underline" onClick={() => dispatch({ type: "retire" })}>
        Close the books
      </button>
      <p className="font-mono text-[10px] text-[#9aa3b2]">First product speed remains {BALANCE.FIRST_PRODUCT_SPEED}× for onboarding.</p>
    </div>
  );
}
