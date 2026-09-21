import { useState, type CSSProperties } from "react";
import { offices } from "../../data/offices";
import { formatDate } from "../../simulation/date";
import type { GameState, GameplayEventKind } from "../../simulation/types";
import { useGame } from "../../state/store";
import { SavePanel } from "../SavePanel";
import { money, pct } from "../format";
import { GameButton } from "../shared/controls";
import { competitors as competitorDefs } from "../../data/competitors";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import { lookFromSeed } from "../../simulation/look";
import { CompanyMark } from "../visuals/CompanyMark";
import { BrandStudio } from "../visuals/BrandStudio";
import { archetypeLabel, worldConditionLabel } from "../../visuals/registry";
import { isLifeOrDeathEvent, isMinorFee } from "../../simulation/pause";
import { BALANCE } from "../../config/balance";
import { ExpansionPanel } from "./ExpansionPanel";
import { acquisitionCost, acquisitionMonthlyRevenue } from "../../simulation/acquisitions";


export { ResearchPanel } from './Research';
export { FinancePanel, FundingPanel } from './Finance';

export { ComputePanel } from './Compute';
export { CulturePromotionPanel as PerksPanel } from './CulturePromotion';
export { SocialPanel } from './Social';

function knownConsequence(effect:{type:string;value:unknown}):string|null {
  if(effect.type==='cash') return `${Number(effect.value)>=0?'+':''}${money(Number(effect.value))} cash`;
  if(effect.type==='hype') return `${Number(effect.value)>=0?'+':''}${effect.value} hype`;
  if(effect.type==='trust') return `${Number(effect.value)>=0?'+':''}${effect.value} trust`;
  if(effect.type==='backlash') return `${Number(effect.value)>=0?'+':''}${effect.value} backlash`;
  if(effect.type==='morale') return `${Number(effect.value)>=0?'+':''}${effect.value} team morale`;
  if(effect.type==='loseEmployee') return 'One employee leaves immediately';
  if(effect.type==='ending') return 'This can end the company story';
  return null;
}

const EVENT_KIND_LABELS: Record<GameplayEventKind, string> = {
  people: "People",
  cost: "Cost shock",
  outage: "Service outage",
  crisis: "Crisis",
  "market-shift": "Market shift",
  reputation: "Reputation",
  decision: "Decision",
  recovery: "Service restored",
};

const WORLD_TABS = {
  news: "News",
  competitors: "Competitors",
  economy: "Economy",
  expansion: "Expansion",
} as const;

export function WorldPanel({ game }: { game: GameState }) {
  const [tab,setTab]=useState("news");
  const dispatch = useGame((s) => s.dispatch);
  const worldMeters=(['aiCapability','aiAdoption','automation','publicTrust','regulation','computeDemand','energyDemand','scientificProgress','economicDisruption','systemicRisk','openSourcePressure'] as const);
  const marketIndexes=[['Inference cost',game.world.inferenceCostIndex],['Talent cost',game.world.talentCostIndex],['Enterprise demand',game.world.enterpriseDemandIndex],['Consumer demand',game.world.consumerDemandIndex],['Developer demand',game.world.developerDemandIndex],['Compliance cost',game.world.complianceCostIndex]] as const;
  const highLevelConditions: Array<{ kind: Parameters<typeof worldConditionLabel>[0]; label: string; value: number; baseline: number; note: string }> = [
    { kind: 'momentum', label: 'AI momentum', value: (game.world.aiCapability + game.world.aiAdoption + game.world.scientificProgress) / 3, baseline: 50, note: 'Capability, adoption, and research pace.' },
    { kind: 'demand', label: 'Customer demand', value: (game.world.enterpriseDemandIndex + game.world.consumerDemandIndex + game.world.developerDemandIndex) / 3 * 100, baseline: 100, note: 'Demand across enterprise, consumer, and developers.' },
    { kind: 'pressure', label: 'Cost pressure', value: (game.world.inferenceCostIndex + game.world.talentCostIndex + game.world.complianceCostIndex) / 3 * 100, baseline: 100, note: 'Compute, hiring, and compliance costs.' },
    { kind: 'climate', label: 'Public climate', value: (game.world.publicTrust + (100 - game.world.regulation) + (100 - game.world.systemicRisk)) / 3, baseline: 50, note: 'Trust, regulation, and perceived risk.' },
  ];
  return (
    <div className="space-y-4">
      <nav className="world-tabs">{Object.entries(WORLD_TABS).map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{label}</button>)}</nav>
      {tab==="news"&&<div className="news-wire">{game.news.map(n=><article key={n.id}><span className="eyebrow">{formatDate(n.at)} / {n.tone}{n.chainStage!==undefined?` / development ${n.chainStage+1}`:''}</span><h3>{n.headline}</h3><p>{n.body}</p>{n.impact&&<aside><strong>Effect</strong>{n.impact}</aside>}</article>)}{!game.news.length&&<p>No news yet. The wire updates as time passes.</p>}</div>}
      {tab==="economy"&&<><h3 className="economy-title">{game.economy}</h3><p className="economy-caption">Macro conditions affect demand, costs, hiring, and valuations.</p>
      <div className="economy-overview">{highLevelConditions.map((condition)=><article key={condition.label}><span>{condition.label}</span><strong>{worldConditionLabel(condition.kind,condition.value,condition.baseline)}</strong><div className="condition-track"><i style={{width:`${Math.max(4,Math.min(100,condition.baseline===100?condition.value/1.6:condition.value))}%`}}/></div><p>{condition.note}</p></article>)}</div>
      <details className="economy-details"><summary>Detailed indicators</summary><div className="world-meter-list">{worldMeters.map((k) => (<div key={k}><div><span>{k.replace(/([A-Z])/g,' $1')}</span><strong>{game.world[k].toFixed(0)}</strong></div><div className="condition-track"><i style={{ width: `${Math.min(100, game.world[k])}%` }} /></div></div>))}</div><div className="market-index-grid">{marketIndexes.map(([label,value])=><div key={label}><small>{label}</small><strong>{Math.round(value*100)}</strong><span>{value>1.02?'Above baseline':value<.98?'Below baseline':'Baseline'}</span></div>)}</div></details>
      </>}
      {tab === "competitors" && (
        <div className="competitor-list">
          {game.competitors.map((c) => {
            const def = competitorDefs.find((d) => d.id === c.id);
            const acquired = game.company.acquisitions.includes(c.id);
            const price = acquisitionCost(c);
            const monthlyRevenue = acquisitionMonthlyRevenue(game, c);
            const canAfford = game.company.cash >= price;
            return (
              <details key={c.id} className="competitor-card">
                <summary>
                  <CompanyMark company={c.id} />
                  <span>
                    <strong>{c.name}</strong>
                    <small>{archetypeLabel(def?.archetype ?? c.archetype)} · {c.personality}</small>
                  </span>
                  <em>
                    <small>Market share</small>
                    <strong>{pct(c.marketShare)}</strong>
                  </em>
                </summary>
                <div className="competitor-detail">
                  <CharacterPortrait look={lookFromSeed(c.id, def?.archetype)} />
                  <div>
                    <p>{def?.description}</p>
                    <small>Founded by {def?.founder} · Focus: {def?.focus.join(", ")}</small>
                    {!c.disabled && game.unlocks.acquisitions ? (
                      <div className="acquisition-offer" aria-label={`${c.name} acquisition economics`}>
                        <div>
                          <span>Acquire for</span>
                          <strong>{money(price)}</strong>
                        </div>
                        <div>
                          <span>Revenue / month</span>
                          <strong>+{money(monthlyRevenue)}</strong>
                        </div>
                      </div>
                    ) : acquired ? (
                      <div className="acquisition-status">Acquired · contributing {money(monthlyRevenue)} / month</div>
                    ) : null}
                  </div>
                  {game.unlocks.acquisitions && !c.disabled ? (
                    <button
                      type="button"
                      disabled={!canAfford}
                      title={canAfford ? `Acquire ${c.name} for ${money(price)}` : `Need ${money(price - game.company.cash)} more cash`}
                      onClick={() => dispatch({ type: "acquire", competitorId: c.id })}
                    >
                      {canAfford ? `Acquire for ${money(price)}` : `Need ${money(price - game.company.cash)} more`}
                    </button>
                  ) : null}
                </div>
              </details>
            );
          })}
        </div>
      )}
      {tab === "expansion" && <ExpansionPanel game={game} />}
    </div>
  );
}

export function InboxPanel({ game }: { game: GameState }) {
  const [id, setId] = useState(game.inbox.find((mail) => mail.eventKind)?.id ?? game.inbox[0]?.id);
  const mail = game.inbox.find((m) => m.id === id) ?? game.inbox[0];
  const dispatch = useGame((s) => s.dispatch);

  return (
    <div className="mail-workspace">
      <div className="mail-list">
        <div className="mail-list-heading">
          {game.inbox.filter((m) => !m.read).length} unread / {game.inbox.length} messages
        </div>
        {game.inbox.map((m) => {
          const senderName = m.sender?.name ?? m.from;
          return (
            <button
              key={m.id}
              className={`${m.id === mail?.id ? "selected" : ""} ${m.read ? "" : "unread"}`}
              onClick={() => {
                setId(m.id);
                dispatch({ type: "readMail", mailId: m.id });
              }}
            >
              <small>
                {senderName} · {formatDate(m.at)}
              </small>
              <strong>{m.subject}</strong>
              <span>
                {m.autoCharged
                  ? `Auto-charged · ${m.impact ?? "Paid automatically"}`
                  : m.eventKind
                  ? `${m.requiresResponse ? "Decision required" : "Company update"} · ${m.impact ?? m.body.slice(0, 48)}`
                  : m.requiresResponse
                  ? "Response needed"
                  : m.body.slice(0, 65)}
              </span>
            </button>
          );
        })}
      </div>
      {mail ? (
        <article className="mail-letter">
          {mail.eventKind ? (
            <aside className={`mail-event-status ${mail.autoCharged ? "applied" : mail.requiresResponse ? "needs-response" : "applied"}`}>
              <div>
                <span className="mail-event-badge">{EVENT_KIND_LABELS[mail.eventKind]}</span>
                <strong>
                  {mail.autoCharged
                    ? "Paid automatically"
                    : mail.requiresResponse
                    ? "Decision required"
                    : "Applied now"}
                </strong>
              </div>
              <p>{mail.impact ?? (mail.autoCharged ? "Auto-debited after remaining unaddressed." : "This event changes your operating state now.")}</p>
            </aside>
          ) : null}

          <div className="bg-[#f5f0e3] border border-[#d6ccb9] rounded-lg p-4 mb-5 text-xs text-[#33463a] space-y-2 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e2d9c7] pb-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner"
                  style={{ backgroundColor: mail.sender?.avatarColor ?? "#4a6b57" }}
                >
                  {mail.sender?.avatarInitial ?? mail.from[0]?.toUpperCase() ?? "M"}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#1b2b22]">
                    {mail.sender?.name ?? mail.from}
                    {mail.sender?.handle && (
                      <span className="ml-1.5 text-xs font-normal text-[#687a6c]">
                        &lt;{mail.sender.handle}&gt;
                      </span>
                    )}
                  </div>
                  {mail.sender?.role && (
                    <div className="text-[10px] font-mono text-[#8a998b] uppercase tracking-wider">
                      {mail.sender.role}
                      {mail.sender.organization ? ` · ${mail.sender.organization}` : ""}
                    </div>
                  )}
                </div>
              </div>
              <time className="text-[11px] font-mono text-[#788879]">{formatDate(mail.at)}</time>
            </div>

            {mail.recipient && (
              <div className="text-[11px] text-[#607164] flex items-center gap-1.5 pt-0.5">
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#8b998a]">To:</span>
                <span>{mail.recipient.name}</span>
                {mail.recipient.handle && (
                  <span className="text-[#7e8d80]">&lt;{mail.recipient.handle}&gt;</span>
                )}
                {mail.recipient.organization && (
                  <span className="text-[#8e9d90]">({mail.recipient.organization})</span>
                )}
              </div>
            )}
          </div>

          <h3>{mail.subject}</h3>

          {mail.profile ? (
            <div className="mail-profile">
              <CharacterPortrait look={mail.profile.look} />
              <div>
                <div className="mail-profile-header">
                  <strong>{mail.profile.name}</strong>
                  <span className="mail-profile-dot">·</span>
                  <span>
                    {mail.profile.title}
                    {mail.profile.taskName ? ` · ${mail.profile.taskName}` : ""}
                  </span>
                  <span className="mail-profile-dot">·</span>
                  <span>Salary {money(mail.profile.salary)} / year</span>
                </div>
                {mail.profile.projectImpact ? <em>{mail.profile.projectImpact}</em> : null}
                <div className="mail-skills">
                  {Object.entries(mail.profile.skills)
                    .filter(([k]) => k !== "productivity")
                    .map(([k, v]) => (
                      <span key={k}>
                        {k} {Number(v).toFixed(0)}
                      </span>
                    ))}
                </div>
              </div>
            </div>
          ) : null}

          <p>{mail.body}</p>

          {mail.context?.length ? (
            <dl className="decision-context">
              {mail.context.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {mail.warning && <p className="decision-warning">⚠ {mail.warning}</p>}

          {mail.requiresResponse && isMinorFee(mail, game) && (
            <div className="bg-[#fef9c3] border border-[#fde047] text-[#854d0e] rounded-md px-3 py-2 text-xs mb-3 flex items-center gap-2">
              <span className="font-bold">⏱</span>
              <span>
                <strong>Net {mail.autoChargeDays ?? BALANCE.MINOR_FEE_AUTO_CHARGE_DAYS} Terms:</strong> Will auto-charge in{" "}
                <strong>
                  {Math.max(
                    0,
                    (mail.autoChargeDays ?? BALANCE.MINOR_FEE_AUTO_CHARGE_DAYS) -
                      (mail.createdTick !== undefined ? game.clock.tick - mail.createdTick : 0)
                  )}{" "}
                  day
                  {Math.max(
                    0,
                    (mail.autoChargeDays ?? BALANCE.MINOR_FEE_AUTO_CHARGE_DAYS) -
                      (mail.createdTick !== undefined ? game.clock.tick - mail.createdTick : 0)
                  ) === 1
                    ? ""
                    : "s"}
                </strong>{" "}
                if not contested.
              </span>
            </div>
          )}

          {mail.requiresResponse && !isMinorFee(mail, game) && (
            (() => {
              const deadline = mail.deadlineDays ?? BALANCE.DECISION_EVENT_DEADLINE_DAYS;
              const elapsed = mail.createdTick !== undefined ? game.clock.tick - mail.createdTick : 0;
              const remaining = Math.max(0, deadline - elapsed);
              const isCritical = isLifeOrDeathEvent(mail, game);
              return (
                <div
                  className={`border rounded-md px-3 py-2 text-xs mb-3 flex items-center gap-2 ${
                    isCritical
                      ? remaining <= 1
                        ? "bg-[#fee2e2] border-[#f87171] text-[#991b1b]"
                        : "bg-[#fff7ed] border-[#fdba74] text-[#9a3412]"
                      : "bg-[#f8fafc] border-[#cbd5e1] text-[#334155]"
                  }`}
                >
                  <span className="font-bold">{remaining <= 1 ? "⚠" : "⏱"}</span>
                  <span>
                    <strong>{isCritical ? "Critical Decision Deadline:" : "Decision Deadline:"}</strong>{" "}
                    <strong>{remaining} day{remaining === 1 ? "" : "s"} remaining</strong>
                    {remaining <= 1
                      ? " · Action required today before deadline expires!"
                      : isCritical
                      ? " · Simulation auto-pauses when 1 day away."
                      : ""}
                  </span>
                </div>
              );
            })()
          )}

          {mail.autoCharged && (
            <div className="bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] rounded-md px-3 py-2 text-xs mb-3 flex items-center gap-2">
              <span className="font-bold">✓</span>
              <span>
                <strong>Auto-debited:</strong> Payment was debited automatically after payment terms expired with no contest.
              </span>
            </div>
          )}

          <div className="decision-choices">
            {mail.choices?.map((c) => {
              const cashEffect = c.effects
                .filter((e) => e.type === "cash")
                .reduce((sum, e) => sum + Number(e.value), 0);
              const bankrupt = cashEffect < 0 && game.company.cash + cashEffect < 0;
              const consequences = c.consequences ?? (c.effects.map(knownConsequence).filter(Boolean) as string[]);
              return (
                <section key={c.id}>
                  <GameButton
                    tone="primary"
                    onClick={() => dispatch({ type: "mailChoice", mailId: mail.id, choiceId: c.id })}
                  >
                    {c.label}
                  </GameButton>
                  {consequences.length ? (
                    <ul>
                      {consequences.map((text) => (
                        <li key={text}>{text}</li>
                      ))}
                    </ul>
                  ) : null}
                  {(c.warning || bankrupt) && (
                    <p className="decision-warning">⚠ {c.warning ?? "This choice will reduce cash below $0."}</p>
                  )}
                </section>
              );
            })}
          </div>

          {!mail.read && (
            <button className="mark-read" onClick={() => dispatch({ type: "readMail", mailId: mail.id })}>
              Mark as read
            </button>
          )}
        </article>
      ) : (
        <div className="empty-state">No messages yet.</div>
      )}
    </div>
  );
}

export function CompanyPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const loadGame = useGame((s) => s.loadGame);
  const [brandStudioOpen, setBrandStudioOpen] = useState(false);
  const office = offices[game.company.officeLevel];
  const next = offices[game.company.officeLevel + 1];
  const upgradeReason = !next ? '' : game.company.cash < next.cost ? `Need ${money(next.cost - game.company.cash)} more` : '';
  return (
    <div className="space-y-4">
      <div className="font-display text-2xl">{game.company.name}</div>
      <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
        {office?.name} · cap {office?.capacity} · {game.employees.length} people · rent {money(office?.rent ?? 0)}/mo
      </div>
      <section className="company-identity-card">
        <div className="company-identity-header">
          <div>
            <span className="eyebrow">Company identity</span>
            <strong>{game.company.brand.tagline || "Ideas with room to compound."}</strong>
          </div>
          <button type="button" className="company-identity-toggle" onClick={() => setBrandStudioOpen((open) => !open)} aria-expanded={brandStudioOpen}>
            {brandStudioOpen ? "Close studio" : "Brand studio"}
          </button>
        </div>
        {brandStudioOpen ? (
          <BrandStudio
            compact
            brand={game.company.brand}
            companyName={game.company.name}
            onChange={(patch) => dispatch({ type: "setBrand", patch })}
          />
        ) : (
          <div className="company-identity-strip" style={{ "--brand-primary": game.company.brand.color, "--brand-secondary": game.company.brand.secondaryColor } as CSSProperties}>
            <span className={`brand-square brand-square-${game.company.brand.mark} brand-pattern-${game.company.brand.pattern}`} />
            <span><small>Current system</small><strong>{game.company.brand.mark} · {game.company.brand.pattern}</strong></span>
          </div>
        )}
      </section>
      <p className="text-xs text-[#56665e]">{office?.description}</p>
      {office && (
        <div className="office-benefits">
          <div><small>Seats</small><strong>{office.capacity}</strong></div>
          <div><small>Morale</small><strong>+{office.morale}</strong></div>
          <div><small>Productivity</small><strong>+{office.productivity}</strong></div>
          <div><small>Recruiting</small><strong>+{office.recruiting}</strong></div>
        </div>
      )}
      {next ? (
        <>
        <p className="text-xs text-[#56665e]">
            {next.name} costs {money(next.cost)} to move in and {money(next.rent)}/month after that. The same cash could fund hiring, compute, or a launch.
          </p>
          <GameButton
            tone="primary"
            disabled={!!upgradeReason}
            title={upgradeReason || `Expand company headquarters to ${next.name}`}
            onClick={() => dispatch({ type: "upgradeOffice" })}
          >
            Upgrade to {next.name} · {money(next.cost)}
          </GameButton>
        </>
      ) : (
        <p className="text-xs text-[#9aa3b2]">Maximum office reached.</p>
      )}
      <div className="pt-2">
        <GameButton className="w-full text-center" onClick={() => useGame.getState().setAchievementsOpen(true)}>
          🏆 View Achievements ({(game.achievements ?? []).length} Unlocked)
        </GameButton>
      </div>
      <SavePanel game={game} onLoad={loadGame} variant="company" />
      <button type="button" className="text-xs underline" onClick={() => dispatch({ type: "retire" })}>
        Retire company
      </button>

    </div>
  );
}
