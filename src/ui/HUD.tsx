import { locations } from '../data/locations';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SPEED_OPTIONS } from '../config/balance';
import { useCameraDirector } from '../game3d/camera/cameraStore';
import { formatDate } from '../simulation/date';
import { monthlyBurn, runwayMonths } from '../simulation/derived';
import { inferenceCreditDepleted, uncoveredInferenceDemand } from '../simulation/compute';
import type { DrawerId, GameState } from '../simulation/types';
import { useGame } from '../state/store';
import { money } from './format';
import { GameIcon } from './shared/Icons';
import { ProgressStack } from './ProgressStack';
import { NewsFeed } from './NewsFeed';
import { ACHIEVEMENTS } from '../data/achievements';
import { getLifetimeAchievements } from '../simulation/achievements';
import { useAnimatedMetric } from './feel/useAnimatedMetric';

function useAnimatedCash(value:number,reducedMotion:boolean,baseline:number,tick:number) {
  const previous=useRef(value),frame=useRef(0),[display,setDisplay]=useState(value);
  const previousTick=useRef(tick);
  const [delta,setDelta]=useState<{value:number;level:'small'|'medium'|'large'}|null>(null);
  useEffect(()=>{
    const from=previous.current,change=value-from;
    const passive=previousTick.current!==tick;
    previous.current=value;
    previousTick.current=tick;
    window.cancelAnimationFrame(frame.current);
    if (!Number.isFinite(change)||Math.abs(change)<Math.max(500,baseline*.02)||passive||reducedMotion) {setDisplay(value);setDelta(null);return;}
    const relative=Math.abs(change)/Math.max(1,Math.abs(from),baseline);
    const level=relative>.35||Math.abs(change)>=1_000_000?'large':relative>.08||Math.abs(change)>=25_000?'medium':'small';
    setDelta({value:change,level});
    const started=performance.now(),duration=level==='large'?820:level==='medium'?560:300;
    const animate=(now:number)=>{
      const t=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-t,3);
      setDisplay(from+change*eased);
      if(t<1)frame.current=window.requestAnimationFrame(animate);
    };
    frame.current=window.requestAnimationFrame(animate);
    const timer=window.setTimeout(()=>setDelta(null),level==='large'?1800:1300);
    return()=>{window.cancelAnimationFrame(frame.current);window.clearTimeout(timer);};
  },[value,reducedMotion,baseline,tick]);
  return {display,delta};
}

export const NAV_GROUPS:{id:string;label:string;items:{id:DrawerId;label:string;need?:keyof GameState['unlocks']}[]}[]=[
  // Keep the dock stable as the company grows. Unlocks become tabs inside the
  // same decision hub instead of adding more equally loud buttons to the stage.
  {id:'products',label:'Build',items:[{id:'tasks',label:'Product lab'},{id:'products',label:'Launches'},{id:'research',label:'Research',need:'research'},{id:'compute',label:'Compute',need:'compute'}]},
  {id:'team',label:'Team',items:[{id:'people',label:'People'},{id:'hiring',label:'Recruiting',need:'hiring'},{id:'perks',label:'Culture',need:'perks'}]},
  {id:'finance',label:'Money',items:[{id:'finance',label:'Finance'},{id:'funding',label:'Funding',need:'funding'}]},
  {id:'company',label:'Company',items:[{id:'company',label:'Office & saves'},{id:'world',label:'World',need:'world'}]},
  {id:'inbox',label:'Inbox',items:[{id:'inbox',label:'Inbox'},{id:'social',label:'Radar'}]},
];
export function HUD({game}:{game:GameState}) {
  const dispatch=useGame(s=>s.dispatch),drawer=useGame(s=>s.drawer),setDrawer=useGame(s=>s.setDrawer);
  const unreadMail=game.inbox.filter(m=>!m.read).length;
  const unreadDms=game.social?.dms?.filter(d=>!d.read).length ?? 0;
  const totalCommsUnread=unreadMail + unreadDms;
  const run=runwayMonths(game);
  const animatedRun = useAnimatedMetric(Math.min(99, run), game.settings.reducedMotion, .5);
  const ready=game.products.find(p=>p.status==='ready');
  const burnedCount=game.employees.filter(e=>e.burnoutDays>0).length;
  const lowRunway=run<2 && run>0 && game.company.cash<25000;
  const creditDepleted=inferenceCreditDepleted(game);
  const uncoveredInference=uncoveredInferenceDemand(game);
  const burn=monthlyBurn(game);
  const cash=useAnimatedCash(game.company.cash,game.settings.reducedMotion,burn,game.clock.tick);
  const unlockedAchievements = new Set([...(game.achievements ?? []), ...getLifetimeAchievements()]);
  const unlockedAchievementCount = ACHIEVEMENTS.filter((achievement) => unlockedAchievements.has(achievement.id)).length;
  const brandStyle = { background: game.company.brand.color, '--brand-secondary': game.company.brand.secondaryColor } as CSSProperties;
  return <div className="game-hud">
    <header className="hud-bar">
      <button className="company-wordmark" onClick={()=>setDrawer('company')}><span className={`brand-square brand-square-${game.company.brand.mark} brand-pattern-${game.company.brand.pattern}`} style={brandStyle}/><span>{game.company.name}<small>{locations.find(l=>l.id===game.company.activeLocationId)?.name ?? (game.company.officeLevel===0?'Apartment':'Headquarters')}</small></span></button>
      <button className={`hud-stat cash-stat ${cash.delta?`cash-${cash.delta.level} ${cash.delta.value>0?'cash-up':'cash-down'}`:''}`} onClick={()=>setDrawer('finance')} title="Open Finance for a cash-flow breakdown"><small>Cash</small><strong aria-label={money(game.company.cash)}>{money(cash.display)}</strong>{cash.delta&&<span className="cash-delta">{cash.delta.value>0?'+':''}{money(cash.delta.value)}</span>}</button>
      <button className="hud-stat" onClick={()=>setDrawer('finance')} title={`Expected net burn ${money(burn)} per month`}><small>Runway</small><strong className={run<3?'warning':''}>{run>=99?'Profitable':`${animatedRun.toFixed(1)} months`}</strong></button>
      {burnedCount>0&&<button className="hud-alert-badge" onClick={()=>setDrawer('people')} title={`${burnedCount} team member${burnedCount>1?'s are':' is'} resting due to burnout`}>⚠ {burnedCount} Resting</button>}
      {creditDepleted&&<button className="hud-alert-badge danger" onClick={()=>setDrawer('compute')} title={`API credits depleted · ${money(uncoveredInference)}/week of inference billed to cash`}>⚠ Credits depleted</button>}
      {lowRunway&&<button className="hud-alert-badge danger" onClick={()=>setDrawer('finance')} title="Runway critically low · under 2 months">⚠ Low runway</button>}
      <div className="hud-clock"><span>{formatDate(game.clock.date)}</span><div className="speed-controls" data-tutorial="speed-controls">
        {SPEED_OPTIONS.map(speed=><button key={speed} data-tutorial={speed===1?'speed-one':undefined} aria-label={speed===0?(game.clock.paused?'Resume':'Pause'):`${speed}× speed`} aria-pressed={speed===0?game.clock.paused:!game.clock.paused&&game.clock.speed===speed} onClick={()=>{
          if (speed === 0) {
            dispatch({ type: 'setPaused', paused: !game.clock.paused, reason: game.clock.pauseReasons.includes('event') ? 'Inbox' : undefined });
          } else {
            if (game.clock.pauseReasons.includes('event')) {
              dispatch({ type: 'setPaused', paused: false, reason: 'Inbox' });
            }
            dispatch({ type: 'setSpeed', speed });
          }
        }}>{speed===0?'Ⅱ':`${speed}×`}</button>)}
      </div></div>
      <button className="settings-button relative flex items-center justify-center text-sm" aria-label="Achievements" title={`Achievements (${unlockedAchievementCount} / ${ACHIEVEMENTS.length} unlocked)`} onClick={()=>useGame.getState().setAchievementsOpen(true)}>
        🏆
        {unlockedAchievementCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#c9a227] text-black font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-mono">
            {unlockedAchievementCount}
          </span>
        )}
      </button>
      <button className="settings-button" aria-label="Settings" onClick={()=>useGame.getState().setSettingsOpen(true)}>⚙</button>
    </header>
    {game.clock.paused&&<div className="pause-caption" onClick={() => {
      if (game.clock.pauseReasons.includes('event')) setDrawer('inbox');
      else if (game.clock.pauseReasons.includes('productReady')) setDrawer('products');
    }} style={{ cursor: (game.clock.pauseReasons.includes('event') || game.clock.pauseReasons.includes('productReady')) ? 'pointer' : undefined }} title={game.clock.pauseReasons.includes('event') ? 'Click to open inbox' : game.clock.pauseReasons.includes('productReady') ? 'Click to open products' : undefined}>Ⅱ {game.clock.reasonPaused??'Paused'}</div>}
    {!drawer&&!game.pendingMentor&&<ProgressStack game={game}/>}
    {!game.pendingMentor&&!game.marketBattle&&!game.marketResult&&<NewsFeed game={game}/>}
    <button className="overview-button" onClick={()=>useCameraDirector.getState().overview(game.company.officeLevel)}>↗ Office overview</button>
    <nav className="game-dock" aria-label="Company navigation">
      {NAV_GROUPS.map(group=>{
        const items=group.items.filter(i=>!i.need||game.unlocks[i.need]);
        if(!items.length)return null;
        const active=items.some(i=>i.id===drawer);
        return <button key={group.id} data-tutorial={group.id==='products'?'new-product':`${group.id}-nav`} aria-pressed={active} onClick={()=>setDrawer(active?null:items[0]!.id)}><GameIcon name={group.id}/><span>{group.label}</span>{group.id==='inbox'&&totalCommsUnread>0&&<b>{totalCommsUnread}</b>}{group.id==='products'&&ready&&<i className="dock-dot"/>}</button>;
      })}
    </nav>
  </div>;
}
