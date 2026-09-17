import { SPEED_OPTIONS } from '../config/balance';
import { useCameraDirector } from '../game3d/camera/cameraStore';
import { formatDate } from '../simulation/date';
import { monthlyArr, monthlyBurn, runwayMonths } from '../simulation/derived';
import type { DrawerId, GameState } from '../simulation/types';
import { useGame } from '../state/store';
import { money } from './format';
import { GameIcon } from './shared/Icons';
import { taskEstimate } from '../simulation/tasks';

export const NAV_GROUPS:{id:string;label:string;items:{id:DrawerId;label:string;need?:keyof GameState['unlocks']}[]}[]=[
  {id:'products',label:'Products',items:[{id:'tasks',label:'Product lab & projects'},{id:'products',label:'Products & launches'}]},
  {id:'team',label:'Team',items:[{id:'people',label:'People'},{id:'hiring',label:'Recruiting',need:'hiring'}]},
  {id:'research',label:'Research',items:[{id:'research',label:'Technology tree',need:'research'}]},
  {id:'finance',label:'Finance',items:[{id:'finance',label:'Ledger'},{id:'funding',label:'Raise capital',need:'funding'}]},
  {id:'infrastructure',label:'Infrastructure',items:[{id:'compute',label:'Compute',need:'compute'}]},
  {id:'company',label:'Company',items:[{id:'company',label:'Office & saves'},{id:'perks',label:'Culture & promotion',need:'perks'}]},
  {id:'world',label:'World',items:[{id:'world',label:'The world',need:'world'}]},
  {id:'inbox',label:'Inbox',items:[{id:'inbox',label:'Messages'}]},
];
export function HUD({game}:{game:GameState}) {
  const dispatch=useGame(s=>s.dispatch),drawer=useGame(s=>s.drawer),setDrawer=useGame(s=>s.setDrawer);
  const unread=game.inbox.filter(m=>!m.read).length,run=runwayMonths(game);
  const activeTask=game.tasks.find(t=>t.type==='product')??game.tasks[0];
  const ready=game.products.find(p=>p.status==='ready');
  const estimate=activeTask?taskEstimate(game,activeTask):null;
  const burnedCount=game.employees.filter(e=>e.burnoutDays>0).length;
  const lowRunway=run<2 && run>0 && game.company.cash<25000;
  const creditDepleted=game.compute.apiCredits<=0 && game.products.some(p=>p.status==='active') && game.compute.rentedGpus===0;
  return <div className="game-hud">
    <header className="hud-bar">
      <button className="company-wordmark" onClick={()=>setDrawer('company')}><span className="brand-square" style={{background:game.company.brand.color}}/><span>{game.company.name}<small>{game.company.officeLevel===0?'Apartment headquarters':'Company headquarters'}</small></span></button>
      <div className="hud-stat"><small>Cash</small><strong>{money(game.company.cash)}</strong></div>
      <button className="hud-stat" onClick={()=>setDrawer('finance')} title={`Monthly costs ${money(monthlyBurn(game))}`}><small>Runway</small><strong className={run<3?'warning':''}>{run>=99?'Profitable':`${run.toFixed(1)} months`}</strong></button>
      <button className="hud-stat" onClick={()=>setDrawer('finance')}><small>Annual revenue</small><strong>{money(monthlyArr(game)*12)}</strong></button>
      {burnedCount>0&&<button className="hud-alert-badge" onClick={()=>setDrawer('people')} title={`${burnedCount} team member${burnedCount>1?'s are':' is'} resting due to burnout`}>⚠ {burnedCount} Resting</button>}
      {creditDepleted&&<button className="hud-alert-badge danger" onClick={()=>setDrawer('compute')} title="API credits depleted · paying for all inference from cash">⚠ Credits depleted</button>}
      {lowRunway&&<button className="hud-alert-badge danger" onClick={()=>setDrawer('finance')} title="Runway critically low · under 2 months">⚠ Low runway</button>}
      <div className="hud-clock"><span>{formatDate(game.clock.date)}</span><div className="speed-controls" data-tutorial="speed-controls">
        {SPEED_OPTIONS.map(speed=><button key={speed} data-tutorial={speed===1?'speed-one':undefined} aria-label={speed===0?'Pause':`${speed}× speed`} aria-pressed={speed===0?game.clock.paused:!game.clock.paused&&game.clock.speed===speed} onClick={()=>dispatch(speed===0?{type:'setPaused',paused:true}:{type:'setSpeed',speed})}>{speed===0?'Ⅱ':`${speed}×`}</button>)}
      </div></div>
      <button className="settings-button" aria-label="Settings" onClick={()=>useGame.getState().setSettingsOpen(true)}>⚙</button>
    </header>
    {game.clock.paused&&<div className="pause-caption">Ⅱ {game.clock.reasonPaused??'Paused'}</div>}
    {!drawer&&!game.pendingMentor&&<div className="next-action">
      <small>{ready?'READY TO LAUNCH':activeTask?'IN THE STUDIO':'YOUR NEXT MOVE'}</small>
      <strong>{ready?.name??activeTask?.name??(game.company.seenMarket?'What will you build next?':'Your first product starts here.')}</strong>
      {activeTask&&!ready&&<><div className="progress-track"><i style={{width:`${Math.min(100,activeTask.progress/activeTask.requiredProgress*100)}%`}}/></div><p>{estimate?.workers.length?`${estimate.workers.length} working · about ${estimate.days} days`:'No team assigned · add people to begin'}</p></>}
      <button onClick={()=>setDrawer(ready?'products':'tasks')}>{ready?'Configure launch':activeTask?'View project':'Open product lab'} →</button>
    </div>}
    <button className="overview-button" onClick={()=>useCameraDirector.getState().overview(game.company.officeLevel)}>↗ Office overview</button>
    <nav className="game-dock" aria-label="Company navigation">
      {NAV_GROUPS.map(group=>{
        const items=group.items.filter(i=>!i.need||game.unlocks[i.need]);
        if(!items.length)return null;
        const active=items.some(i=>i.id===drawer);
        return <button key={group.id} data-tutorial={group.id==='products'?'new-product':`${group.id}-nav`} aria-pressed={active} onClick={()=>setDrawer(active?null:items[0]!.id)}><GameIcon name={group.id}/><span>{group.label}</span>{group.id==='inbox'&&unread>0&&<b>{unread}</b>}{group.id==='products'&&ready&&<i className="dock-dot"/>}</button>;
      })}
    </nav>
  </div>;
}
