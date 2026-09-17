import { useState } from "react";
import { locations } from "../../data/locations";
import { lobbies } from "../../data/lobbies";
import { offices } from "../../data/offices";
import { perks } from "../../data/perks";
import { promos } from "../../data/promos";
import { specialProjects } from "../../data/specialProjects";
import { verticals } from "../../data/verticals";
import { formatDate } from "../../simulation/date";
import type { GameState } from "../../simulation/types";
import { useGame } from "../../state/store";
import { SavePanel } from "../SavePanel";
import { money, pct } from "../format";
import { GameButton } from "../shared/controls";
import { competitors as competitorDefs } from "../../data/competitors";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import { lookFromSeed } from "../../simulation/look";


export { ResearchPanel } from './Research';
export { FinancePanel, FundingPanel } from './Finance';

export { ComputePanel } from './Compute';

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

export function PerksPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-3">
      {game.unlocks.promo
        ? promos.map((p) => {
            const reason = game.company.cash < p.cost ? `Need ${money(p.cost - game.company.cash)} more` : '';
            return (
              <GameButton
                key={p.id}
                className="w-full text-left"
                disabled={!!reason}
                title={reason || p.description}
                onClick={() => dispatch({ type: "startPromo", promoId: p.id })}
              >
                {p.name} · {money(p.cost)}
              </GameButton>
            );
          })
        : null}
      {perks.map((perk) => {
        const owned = game.company.perks.find((p) => p.id === perk.id);
        const next = perk.upgrades[owned ? owned.level + 1 : 0];
        const reason = !next
          ? 'Max level reached'
          : game.company.officeLevel < next.requiredOffice
            ? `Requires office level ${next.requiredOffice}`
            : game.company.cash < next.cost
              ? `Need ${money(next.cost - game.company.cash)} more`
              : '';
        return (
          <section key={perk.id} className="border border-white/10 p-3">
            <div className="font-medium">{perk.name}</div>
            <div className="text-[11px] text-[#9aa3b2]">{owned ? perk.upgrades[owned.level]?.name : "None yet"}</div>
            {next ? (
              <GameButton
                className="mt-2"
                disabled={!!reason}
                title={reason || next.description}
                onClick={() => dispatch({ type: "buyPerk", perkId: perk.id })}
              >
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
  const [tab,setTab]=useState("news");
  const dispatch = useGame((s) => s.dispatch);
  const worldMeters=(['aiCapability','aiAdoption','automation','publicTrust','regulation','computeDemand','energyDemand','scientificProgress','economicDisruption','systemicRisk','openSourcePressure'] as const);
  const marketIndexes=[['Inference cost',game.world.inferenceCostIndex],['Talent cost',game.world.talentCostIndex],['Enterprise demand',game.world.enterpriseDemandIndex],['Consumer demand',game.world.consumerDemandIndex],['Developer demand',game.world.developerDemandIndex],['Compliance cost',game.world.complianceCostIndex]] as const;
  return (
    <div className="space-y-4">
      <nav className="world-tabs">{["news","competitors","economy","expansion"].map(id=><button key={id} aria-pressed={tab===id} onClick={()=>setTab(id)}>{id}</button>)}</nav>
      {tab==="news"&&<div className="news-wire">{game.news.map(n=><article key={n.id}><span className="eyebrow">{formatDate(n.at)} / {n.tone}{n.chainStage!==undefined?` / development ${n.chainStage+1}`:''}</span><h3>{n.headline}</h3><p>{n.body}</p>{n.impact&&<aside><strong>Simulation impact</strong>{n.impact}</aside>}</article>)}{!game.news.length&&<p>The wire is quiet. News arrives as company time passes.</p>}</div>}
      {tab==="economy"&&<><h3 className="economy-title">{game.economy}</h3><p className="economy-caption">Macro conditions change demand, costs, hiring, and valuations. Index 100 is the starting market.</p>
      {worldMeters.map((k) => (
        <div key={k}>
          <div className="flex justify-between font-mono text-[10px] uppercase">
            <span>{k.replace(/([A-Z])/g,' $1')}</span>
            <span>{game.world[k].toFixed(0)}</span>
          </div>
          <div className="h-1 bg-white/10">
            <div className="h-full bg-gold" style={{ width: `${Math.min(100, game.world[k])}%` }} />
          </div>
        </div>
      ))}
      <div className="market-index-grid">{marketIndexes.map(([label,value])=><div key={label}><small>{label}</small><strong>{Math.round(value*100)}</strong><span>{value>1.02?'Above baseline':value<.98?'Below baseline':'Baseline'}</span></div>)}</div>
      </>}
      {tab==="competitors"&&game.competitors.map((c) => (
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
      {tab==="expansion"&&<div className="expansion-catalog">
      {game.unlocks.locations
        ? locations.map((l) => {
            const owned = game.company.locations.includes(l.id);
            const reason = owned ? 'Already expanded to this location' : game.company.cash < l.cost ? `Need ${money(l.cost - game.company.cash)} more` : '';
            return (
              <GameButton
                key={l.id}
                className="mt-1 w-full text-left"
                disabled={!!reason}
                title={reason || l.bonuses}
                onClick={() => dispatch({ type: "buyLocation", locationId: l.id })}
              >
                {l.name} · {owned ? 'Established' : money(l.cost)}
              </GameButton>
            );
          })
        : null}
      {game.unlocks.verticals
        ? verticals.map((v) => {
            const active = game.company.verticals.includes(v.id);
            const reason = active ? 'Already active in this market' : game.company.cash < v.cost ? `Need ${money(v.cost - game.company.cash)} more` : '';
            return (
              <GameButton
                key={v.id}
                className="mt-1 w-full text-left"
                disabled={!!reason}
                title={reason || v.description}
                onClick={() => dispatch({ type: "buyVertical", verticalId: v.id })}
              >
                {v.name} · {active ? 'Active' : money(v.cost)}
              </GameButton>
            );
          })
        : null}
      {specialProjects.map((p) => {
        const ready = p.requiresTechs.every((t) => game.company.technologies.includes(t));
        const done = game.company.specialProjects.includes(p.id);
        const missing = p.requiresTechs.filter(t => !game.company.technologies.includes(t));
        const reason = done ? 'Project completed' : !ready ? `Requires ${missing.join(', ')}` : game.company.cash < p.cost ? `Need ${money(p.cost - game.company.cash)} more` : '';
        return (
          <GameButton
            key={p.id}
            className="mt-1 w-full text-left"
            disabled={!!reason}
            title={reason || p.description}
            onClick={() => dispatch({ type: "startProject", projectId: p.id })}
          >
            {p.name} · {done ? "Completed" : money(p.cost)}
          </GameButton>
        );
      })}
      {game.unlocks.lobbying
        ? lobbies.map((l) => {
            const active = game.company.lobbies.includes(l.id);
            const reason = active ? 'Lobbying initiative active' : game.company.cash < l.cost ? `Need ${money(l.cost - game.company.cash)} more` : '';
            return (
              <GameButton
                key={l.id}
                className="mt-1 w-full text-left"
                disabled={!!reason}
                title={reason || l.description}
                onClick={() => dispatch({ type: "startLobby", lobbyId: l.id })}
              >
                {l.name} · {active ? 'Active' : money(l.cost)}
              </GameButton>
            );
          })
        : null}
      </div>}
    </div>
  );
}

export function InboxPanel({ game }: { game: GameState }) {
  const [id,setId]=useState(game.inbox[0]?.id);
  const mail=game.inbox.find(m=>m.id===id)??game.inbox[0];
  const dispatch=useGame(s=>s.dispatch);
  return <div className="mail-workspace"><div className="mail-list"><div className="mail-list-heading">{game.inbox.filter(m=>!m.read).length} unread / {game.inbox.length} messages</div>{game.inbox.map(m=><button key={m.id} className={`${m.id===mail?.id?'selected':''} ${m.read?'':'unread'}`} onClick={()=>{setId(m.id);dispatch({type:'readMail',mailId:m.id});}}><small>{m.from} · {formatDate(m.at)}</small><strong>{m.subject}</strong><span>{m.requiresResponse?'Response needed':m.body.slice(0,65)}</span></button>)}</div>{mail?<article className="mail-letter"><span className="eyebrow">From {mail.from}</span><h3>{mail.subject}</h3><small>{formatDate(mail.at)}</small><p>{mail.body}</p>{mail.context?.length?<dl className="decision-context">{mail.context.map(item=><div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl>:null}{mail.warning&&<p className="decision-warning">⚠ {mail.warning}</p>}<div className="decision-choices">{mail.choices?.map(c=>{const cashEffect=c.effects.filter(e=>e.type==='cash').reduce((sum,e)=>sum+Number(e.value),0);const bankrupt=cashEffect<0&&game.company.cash+cashEffect<0;const consequences=c.consequences??c.effects.map(knownConsequence).filter(Boolean) as string[];return <section key={c.id}><GameButton tone="primary" onClick={()=>dispatch({type:'mailChoice',mailId:mail.id,choiceId:c.id})}>{c.label}</GameButton>{consequences.length?<ul>{consequences.map(text=><li key={text}>{text}</li>)}</ul>:null}{(c.warning||bankrupt)&&<p className="decision-warning">⚠ {c.warning??'This choice will reduce cash below $0.'}</p>}</section>;})}</div>{!mail.read&&<button className="mark-read" onClick={()=>dispatch({type:'readMail',mailId:mail.id})}>Mark as read</button>}</article>:<div className="empty-state">The inbox is quiet.</div>}</div>;
}

export function CompanyPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const loadGame = useGame((s) => s.loadGame);
  const office = offices[game.company.officeLevel];
  const next = offices[game.company.officeLevel + 1];
  const upgradeReason = !next ? '' : game.company.cash < next.cost ? `Need ${money(next.cost - game.company.cash)} more` : '';
  return (
    <div className="space-y-4">
      <div className="font-display text-2xl">{game.company.name}</div>
      <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
        {office?.name} · cap {office?.capacity} · {game.employees.length} people
      </div>
      {next ? (
        <GameButton
          tone="primary"
          disabled={!!upgradeReason}
          title={upgradeReason || `Expand company headquarters to ${next.name}`}
          onClick={() => dispatch({ type: "upgradeOffice" })}
        >
          Upgrade to {next.name} · {money(next.cost)}
        </GameButton>
      ) : (
        <p className="text-xs text-[#9aa3b2]">The campus is as large as representation allows.</p>
      )}
      <SavePanel game={game} onLoad={loadGame} variant="company" />
      <button type="button" className="text-xs underline" onClick={() => dispatch({ type: "retire" })}>
        Close the books
      </button>

    </div>
  );
}
