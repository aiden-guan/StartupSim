import { useState } from 'react';
import { BALANCE } from '../../config/balance';
import { models, modelById } from '../../data/models';
import { primitives, primitiveById } from '../../data/primitives';
import { findRecipe } from '../../data/recipes';
import { PRICING_MODELS } from '../../data/pricing';
import { availableGtmStrategies, GTM_STRATEGIES } from '../../data/gtm';
import { currentTutorialSlide } from '../../simulation/tutorial';
import { canAffordStat, launchCosts, requiredFor } from '../../simulation/products';
import { taskEstimate } from '../../simulation/tasks';
import { isModelAvailable, providerForModel } from '../../simulation/effects';
import { calculateWeeklyProductOperations, gtmExecutionMultiplier, gtmFitAnalysis, marketDemandMultiplier } from '../../simulation/gtm';
import type { BusinessModel, GameState, LaunchStat, Product } from '../../simulation/types';
import { useGame } from '../../state/store';
import { money, pct } from '../format';
import { GameButton } from '../shared/controls';
import { CharacterPortrait } from '../shared/CharacterPortrait';
import { GameIcon } from '../shared/Icons';
const STATS:LaunchStat[]=['deployment','capability','distribution'];
const MODELS:BusinessModel[]=['freemium','subscription','enterprise','usage','api','ads','free'];

function getLaunchProfile(levels: { deployment: number; capability: number; distribution: number }) {
  const cap = levels.capability;
  const dist = levels.distribution;
  const scale = levels.deployment;

  if (cap >= 2 && dist <= 1 && scale <= 1) {
    return {
      descriptor: "Niche Dominator",
      notes: "Heavy conversion power for taking and defending high-value segments, but narrow reach.",
    };
  }
  if (dist >= 2 && scale >= 2 && cap <= 1) {
    return {
      descriptor: "Viral Expansion",
      notes: "Rapid network spread across low-resistance segments and hubs, but vulnerable in contested markets.",
    };
  }
  if (cap >= 2 && dist >= 1 && scale >= 1) {
    return {
      descriptor: "Enterprise Wedge",
      notes: "Strong product preference paired with enough reach to penetrate toward high-value enterprise accounts.",
    };
  }
  if (cap >= 1 && dist >= 1 && scale >= 1) {
    return {
      descriptor: "Balanced Entry",
      notes: "Flexible multi-segment foothold capable of expanding or reinforcing as competitor moves dictate.",
    };
  }
  if (scale >= 2 && cap <= 1 && dist <= 1) {
    return {
      descriptor: "Broad Capacity",
      notes: "High market load capacity, ready to sustain multiple segments once footholds are established.",
    };
  }
  return {
    descriptor: "Emerging Foothold",
    notes: "Early configuration. Invest launch points to define product reach and market conversion power.",
  };
}
export function TasksPanel({game}:{game:GameState}) {
  const dispatch=useGame(s=>s.dispatch);
  const [showLab,setShowLab]=useState(game.tasks.length===0);
  const [slot,setSlot]=useState<'a'|'b'>('a');
  const a=game.onboarding.primitiveA,b=game.onboarding.primitiveB;
  const recipe=a&&b?findRecipe(a,b):null;
  const intro=game.pendingMentor==='intro';
  const slide=currentTutorialSlide(game)?.id;
  const choosingSlot=slide==='choose-writing'?'b':slide==='choose-chat'?'a':slot;
  const difficulty=a&&b?(primitiveById[a]?.difficulty??0)+(primitiveById[b]?.difficulty??0)+(recipe?.difficultyMod??0):0;
  return <div className="product-workspace">
    <div className="workspace-intro"><div><span className="eyebrow">Build / Launch / Grow</span><h3>{game.tasks.length?'Work in progress':'Two ideas. One product.'}</h3></div>{!intro&&<GameButton onClick={()=>setShowLab(!showLab)}>{showLab?'View projects':'+ New product'}</GameButton>}</div>
    {(intro||showLab)&&<section className="product-lab">
      <div className="lab-ingredients"><div className="eyebrow">01 · Choose your ingredients</div>
        <div className="combo-slots">{(['a','b'] as const).map((s,i)=><div key={s} className="combo-slot-wrap">{i===1&&<span className="combine-plus">+</span>}<button className={`combo-slot ${choosingSlot===s?'selected':''}`} onClick={()=>setSlot(s)} aria-label={`Select technology slot ${i+1}`}><span>{i+1}</span><GameIcon name={(s==='a'?a:b)??'products'}/><strong>{primitiveById[(s==='a'?a:b)??'']?.name??'Choose technology'}</strong></button></div>)}</div>
        <div className="primitive-grid" data-tutorial="primitives">{primitives.filter(p=>game.company.primitives.includes(p.id)).map(p=>{
          const blocked=intro&&(choosingSlot==='a'?p.id!=='chat':p.id!=='writing');
          return <button key={p.id} data-tutorial={`primitive-${p.id}`} className={`primitive-tile ${a===p.id||b===p.id?'selected':''}`} disabled={blocked} title={blocked?'Try Chat + Writing for your first product':`Add ${p.name} to slot ${choosingSlot.toUpperCase()}`} onClick={()=>{dispatch({type:'selectPrimitive',slot:choosingSlot,primitive:p.id});setSlot(choosingSlot==='a'?'b':'a');}}><GameIcon name={p.id}/><span>{p.name}</span></button>;
        })}</div>
      </div>
      <div className="recipe-preview"><span className="eyebrow">02 · The combination</span><div className="product-emblem"><GameIcon name={a??'products'}/></div><h3>{recipe?.name??(a&&b?'An untested combination':'Something worth building')}</h3><p>{recipe?.description??'Combine two technologies to discover your next product.'}</p>{a&&b&&<div className="recipe-meta"><span>{recipe?'Known recipe':'Experimental'}</span><span>Difficulty {difficulty.toFixed(1)}</span></div>}<GameButton tone="primary" data-tutorial="start-product" disabled={!a||!b} onClick={()=>{dispatch({type:'startProduct',a:a!,b:b!});setShowLab(false);}}>Start development →</GameButton></div>
    </section>}
    <div className="project-list">{game.tasks.map(task=>{
      const estimate=taskEstimate(game,task);
      const p=game.products.find(p=>p.id===task.productId);
      return <section key={task.id} className="project-sheet"><div className="project-heading"><div><span className="eyebrow">{task.type} · {p?`Difficulty ${p.difficulty.toFixed(1)}`:'Team project'}</span><h3>{task.name}</h3></div><div className="project-time"><strong>{estimate.days===null?'No team assigned':`~${estimate.days} days`}</strong><small>{estimate.days===null?'Assign people below to begin':'At the current team’s pace'}</small></div></div>
        <div data-tutorial="task-progress"><div className="progress-label"><span>{Math.min(100,task.progress/task.requiredProgress*100).toFixed(0)}% complete</span><span>{estimate.daily.toFixed(1)} progress / day</span></div><div className="progress-track"><i style={{width:`${Math.min(100,task.progress/task.requiredProgress*100)}%`}}/></div></div>
        <div className="team-efficiency"><span>Team efficiency <strong>{pct(estimate.efficiency*100)}</strong></span><span>Coordination overhead −{Math.round((1-estimate.efficiency)*100)}%</span></div>
        {estimate.workers.length===0?<div className="no-team-alert" role="alert"><strong>⚠ NO TEAM ASSIGNED</strong><span>Progress is halted. Assign available teammates below to begin development.</span></div>:<div className="team-active-note"><span>Assigned team: <strong>{estimate.workers.length} active</strong> · ~{estimate.days} days remaining</span></div>}
        <div className="assignment-grid" data-tutorial="assign-crew">{game.employees.map(w=>{
          const assigned=w.taskId===task.id;
          const other=game.tasks.find(t=>t.id===w.taskId);
          return <button key={w.id} className={`worker-assignment ${assigned?'assigned':''}`} data-tutorial={task.productId===game.onboarding.firstProductId?`assign-${w.role}`:undefined} aria-pressed={assigned} disabled={w.burnoutDays>0} title={w.burnoutDays>0?`Resting for ${w.burnoutDays} days`:other&&!assigned?`Reassign from ${other.name}`:assigned?'Unassign from this project':'Assign to this project'} onClick={()=>dispatch(assigned?{type:'unassign',workerId:w.id}:{type:'assign',workerId:w.id,taskId:task.id})}>
            <CharacterPortrait look={w.look} robot={w.role==='robot'}/><div><strong>{w.name}</strong><small>{w.role==='founder'?'Founder':w.role==='cofounder'?'Cofounder':w.title}</small><span>ENG {w.skills.engineering.toFixed(0)} · R&D {w.skills.research.toFixed(0)} · SPEED {w.skills.productivity.toFixed(0)}</span><em>{w.burnoutDays>0?`Resting · ${w.burnoutDays}d`:assigned?'✓ Working on this':other?`On ${other.name}`:'Available · click to assign'}</em></div>
          </button>;
        })}</div>
        {estimate.workers.length>0&&<div className="skill-contributions">{(['engineering','product','growth','research'] as const).map(skill=><span key={skill}>{skill}<b>{estimate.workers.reduce((s,w)=>s+(w.burnoutDays?0:w.skills[skill]),0).toFixed(1)}</b></span>)}</div>}
      </section>;
    })}</div>
    {!game.tasks.length&&!showLab&&!intro&&<div className="empty-state"><h3>The studio is clear.</h3><p>Ready products are waiting in Products & launches.</p><GameButton onClick={()=>useGame.getState().setDrawer('products')}>View products →</GameButton></div>}
  </div>;
}
function projectLaunchEconomics(p: Product, game: GameState) {
  const pricing = PRICING_MODELS[p.businessModel] ?? PRICING_MODELS.freemium;
  const strategy = GTM_STRATEGIES[p.gtmStrategy] ?? GTM_STRATEGIES['product-led'];
  const fit = gtmFitAnalysis(game, p, strategy.id);
  const execution = gtmExecutionMultiplier(fit.score);
  const demand = marketDemandMultiplier(game, p);
  const model = modelById[p.modelId];
  const pa = primitiveById[p.combo[0]];
  const pb = primitiveById[p.combo[1]];
  const weight = (pa?.computeWeight ?? 1) * (pb?.computeWeight ?? 1);
  const agenty = p.combo.includes('agent') || p.combo.includes('computer-use') ? 1.8 : 1;

  // Typical competitive beachhead + expansion foothold projection (~7,000 baseline users)
  const scaleMult = 1 + p.levels.deployment * 0.15;
  const estUsers = Math.max(100, Math.round(7_000 * pricing.userMultiplier * strategy.volumeMultiplier * strategy.rampMultiplier * execution * demand * scaleMult * 0.8));

  const baseTokens = BALANCE.BASE_TOKENS_PER_USER_WEEK ?? 7_000;
  const tokens = estUsers * baseTokens * pricing.tokenMultiplier * weight * agenty;
  const price = model?.costPerMTok ?? 8;
  const efficiency = 1 + (game.company.technologies.includes('efficient-inference') ? -0.12 : 0);
  const estInference = Math.round(((tokens * price) / 1_000_000) * Math.max(0.35, efficiency) * game.world.inferenceCostIndex);

  // Baseline competitive revenue projection
  const baseRevenue =
    2.8 *
    0.6 *
    (BALANCE.BASE_REVENUE_PER_SHARE + BALANCE.EXTRA_REVENUE_PER_DIFFICULTY * (p.difficulty - 2)) *
    p.revenueScore *
    (p.recipeId === 'generic' ? 0.7 : 1.15);

  const hypeMult = 1 + Math.max(0, Math.sqrt(game.company.hype) * BALANCE.HYPE_MULTIPLIER_SCALE);
  const disc = p.newDiscovery ? BALANCE.NEW_PRODUCT_MULTIPLIER : 1;
  const loc = 1 + game.company.locations.length * BALANCE.LOCATION_MULTIPLIER;
  const trust = Math.max(0.6, game.company.trust / 70);

  let calculatedRev = Math.round(
    baseRevenue * pricing.revenueMultiplier * strategy.revenueMultiplier * strategy.rampMultiplier * execution * demand * hypeMult * disc * loc * trust * 0.55 * 0.85,
  );

  if (pricing.costPlusMargin !== null && estInference > 0) {
    const minCostPlus = Math.round(estInference / (1 - pricing.costPlusMargin));
    calculatedRev = Math.max(calculatedRev, minCostPlus);
  }

  const estRevenue = Math.max(0, calculatedRev);
  const estOperations = calculateWeeklyProductOperations(game, p, estUsers, estRevenue, fit.score);

  return {
    pricing,
    strategy,
    fit,
    model,
    estUsers,
    estRevenue,
    estInference,
    estOperations,
    revenueRange: [Math.round(estRevenue * 0.68), Math.round(estRevenue * 1.32)] as const,
    costRange: [Math.round((estInference + estOperations) * 0.88), Math.round((estInference + estOperations) * 1.22)] as const,
  };
}

function ProductEconomics({product:p}:{product:Product}) {
  const modelDef = PRICING_MODELS[p.businessModel];
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 6px' }}>
        <span className="eyebrow" style={{ fontSize: 10 }}>Active Economics · {GTM_STRATEGIES[p.gtmStrategy]?.name ?? p.gtmStrategy}</span>
        <span style={{ fontSize: 10, color: '#4a6755', fontWeight: 600 }}>{modelDef?.name ?? p.businessModel} · {modelDef?.tagline}</span>
      </div>
      <div className="economics-grid" data-tutorial="product-economics">{[['Revenue / week',money(p.weeklyRevenue)],['Compute / week',money(p.weeklyInference)],['GTM + support / week',money(p.weeklyOperatingCost)],['Net contribution / week',money(p.weeklyRevenue-p.weeklyInference-p.weeklyOperatingCost)],['Customers',Math.round(p.users).toLocaleString()],['Retention / week',pct(p.retentionRate*100)],['Market share',pct(p.marketShare)],['Lifetime revenue',money(p.earnedRevenue)]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    </div>
  );
}
export function ProductsPanel({game}:{game:GameState}) {
  const dispatch=useGame(s=>s.dispatch);
  const ordered=[...game.products].sort((a,b)=>Number(b.status==='ready')-Number(a.status==='ready'));
  return <div className="catalog-workspace">{!ordered.length&&<div className="empty-state"><GameIcon name="products"/><h3>Every company starts with an idea.</h3><GameButton tone="primary" onClick={()=>useGame.getState().setDrawer('tasks')}>Open product lab →</GameButton></div>}{ordered.map(p=>{
    const costs=launchCosts(p), ready=p.status==='ready';
    const state=ready?(Object.values(p.levels).some(n=>n>0)?'Ready to launch':'Ready to configure'):p.status==='deprecated'?'Sunset':p.status;
    return <article key={p.id} className="product-sheet"><header data-tutorial={ready?'product-ready':undefined}><div className="product-emblem"><GameIcon name={p.combo[0]}/></div><div><span className="eyebrow">{state}</span><h3>{p.name}</h3><p>{p.combo.map(id=>primitiveById[id]?.name??id).join(' + ')} · {p.vertical}</p></div>{ready&&<span className="ready-stamp">PRODUCT READY</span>}</header>
      {p.status==='development'?<div className="development-notice"><p>Your team is developing this product. Configure it when development finishes.</p><GameButton onClick={()=>useGame.getState().setDrawer('tasks')}>View development →</GameButton></div>:ready?<>
        <div className="launch-points"><span>Launch points</span>{(['engineering','product','growth'] as const).map(k=><div key={k}><small>{k}</small><strong>{Math.floor(p.points[k])}</strong></div>)}</div>
        <div className="designer-grid" data-tutorial="designer">{STATS.map(stat=>{
          const reason=p.levels[stat]>=BALANCE.MAX_LAUNCH_LEVEL?'Maximum level':!canAffordStat(p,stat)?`Need ${Math.ceil(costs[stat])} ${requiredFor(stat).join(' + ')} points`:'';
          const amount=p.levels[stat]+(stat==='capability'?2:stat==='deployment'?4:1);
          const statLabel=stat==='deployment'?'scale':stat;
          const statUnit=stat==='deployment'?'load capacity':stat==='capability'?'conversion power':'network reach';
          const statDesc=stat==='deployment'?'How much market load you can support without overextension penalty.':stat==='capability'?'How strongly customers convert and resist competitor pressure.':'How easily your product spreads between customer segments.';
          return <section key={stat} className="launch-stat" data-tutorial={`stat-${stat}`}><span className="eyebrow">{statLabel}</span><strong>{amount}<small>{statUnit}</small></strong><p>{statDesc}</p><div className="stat-controls"><GameButton aria-label={`Refund ${statLabel}`} disabled={!p.levels[stat]} title={!p.levels[stat]?'No points invested':'Refund last upgrade'} onClick={()=>dispatch({type:'refundStat',productId:p.id,stat})}>−</GameButton><GameButton aria-label={`Increase ${statLabel}`} disabled={!!reason} title={reason||'Buy one upgrade'} onClick={()=>dispatch({type:'buyStat',productId:p.id,stat})}>+</GameButton></div><small className="stat-cost">{reason||`${Math.ceil(costs[stat])} ${requiredFor(stat).join(' + ')}`}</small></section>;
        })}</div>
        {(()=>{
          const prof=getLaunchProfile(p.levels);
          return <div className="launch-profile" style={{padding:'12px 16px',background:'#ebf0e4',border:'1px solid #ced8c5',margin:'14px 0',borderRadius:3}}><span className="eyebrow" style={{fontSize:10,color:'#5a755d',textTransform:'uppercase',letterSpacing:'0.08em'}}>Launch Profile · <strong>{prof.descriptor}</strong></span><p style={{fontSize:11,margin:'4px 0 0',color:'#405345',lineHeight:1.5}}>{prof.notes}</p></div>;
        })()}
        <div className="launch-options">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span className="eyebrow">Business model</span>
              <span style={{ fontSize: 10, color: '#3d6854', fontWeight: 600 }}>
                Target margin: {PRICING_MODELS[p.businessModel]?.marginTarget ?? '50-70%'}
              </span>
            </div>
            <div className="choice-row">
              {MODELS.map(model => (
                <button
                  key={model}
                  aria-pressed={p.businessModel === model}
                  onClick={() => dispatch({ type: 'setBusinessModel', productId: p.id, model })}
                >
                  {PRICING_MODELS[model]?.name ?? model}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#4d5d52', margin: '6px 0 0', lineHeight: 1.4 }}>
              <strong>{PRICING_MODELS[p.businessModel]?.tagline}:</strong>{' '}
              {PRICING_MODELS[p.businessModel]?.description}
            </div>
          </div>
          <div>
            <span className="eyebrow">Powered by</span>
            <div className="choice-row">
              {models.filter(m => game.ownedModels.includes(m.id)).map(m => (
                <button
                  key={m.id}
                  disabled={!isModelAvailable(game, m.id)}
                  title={isModelAvailable(game, m.id) ? `Use ${m.name}` : `${providerForModel(m.id) ?? m.provider} is currently unavailable`}
                  aria-pressed={p.modelId === m.id}
                  onClick={() => dispatch({ type: 'setModel', productId: p.id, modelId: m.id })}
                >
                  {m.name} ({money(m.costPerMTok)}/MTok){!isModelAvailable(game, m.id) ? ' · offline' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
        <section className="gtm-strategy-selector">
          <div className="gtm-heading"><div><span className="eyebrow">Go-to-market strategy</span><h4>Choose the motion your company can execute.</h4></div><small>Options reflect this product and market.</small></div>
          <div className="gtm-card-grid">{availableGtmStrategies(p).map(strategy=>{
            const analysis=gtmFitAnalysis(game,p,strategy.id);
            return <button key={strategy.id} aria-pressed={p.gtmStrategy===strategy.id} onClick={()=>dispatch({type:'setGtmStrategy',productId:p.id,strategy:strategy.id})}>
              <span><strong>{strategy.name}</strong><em>{analysis.label}</em></span>
              <small>{strategy.tagline}</small>
              <p>{strategy.description}</p>
              <dl><div><dt>Time to revenue</dt><dd>{strategy.timeToRevenue}</dd></div><div><dt>Retention</dt><dd>{strategy.retention}</dd></div><div><dt>Acquisition cost</dt><dd>{strategy.acquisitionCost}</dd></div><div><dt>Scale</dt><dd>{strategy.scalePotential}</dd></div><div><dt>Sales complexity</dt><dd>{strategy.salesComplexity}</dd></div><div><dt>Key risk</dt><dd>{strategy.risk}</dd></div></dl>
              {(analysis.strengths[0]||analysis.risks[0])&&<footer>{analysis.strengths[0]&&<span>+ {analysis.strengths[0]}</span>}{analysis.risks[0]&&<span>− {analysis.risks[0]}</span>}</footer>}
            </button>;
          })}</div>
        </section>
        {(() => {
          const proj = projectLaunchEconomics(p, game);
          return (
            <div className="launch-economics-projection">
              <div className="projection-heading"><span className="eyebrow">Launch forecast · {proj.strategy.name} + {proj.pricing.name}</span><b>{proj.fit.label}</b></div>
              <div className="projection-grid">
                <div><small>First-year revenue range</small><strong>{money(proj.revenueRange[0]*52)}–{money(proj.revenueRange[1]*52)}</strong></div>
                <div><small>Customers at launch</small><strong>{Math.round(proj.estUsers*.7).toLocaleString()}–{Math.round(proj.estUsers*1.3).toLocaleString()}</strong></div>
                <div><small>Variable cost / week</small><strong>{money(proj.costRange[0])}–{money(proj.costRange[1])}</strong></div>
                <div><small>Time to revenue</small><strong>{proj.strategy.timeToRevenue}</strong></div>
              </div>
              <p>Range assumes a competitive market entry. Outcome depends on segment capture, team execution, demand, reliability, and competition. It is not a profit guarantee.</p>
            </div>
          );
        })()}
        <footer className="launch-footer"><span>Company time pauses in the market.</span><GameButton tone="primary" data-tutorial="enter-market" disabled={game.onboarding.tutorialEnabled&&!game.company.seenMarket&&currentTutorialSlide(game)?.id!=='enter-market'} title={game.pendingMentor==='designer'&&currentTutorialSlide(game)?.id!=='enter-market'?'Finish configuring your first launch with the mentor':'Launch this product'} onClick={()=>dispatch({type:'enterMarket',productId:p.id})}>Enter market →</GameButton>{game.company.productsLaunched>=BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE&&<div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}><span className="eyebrow" style={{fontSize:10,margin:0}}>Delegate:</span><GameButton onClick={()=>dispatch({type:'delegateMarket',productId:p.id,strategy:'balanced'})} title="Delegate launch with balanced strategic weights">Balanced</GameButton><GameButton onClick={()=>dispatch({type:'delegateMarket',productId:p.id,strategy:'aggressive'})} title="Delegate launch aggressively contesting rival hubs">Aggressive</GameButton><GameButton onClick={()=>dispatch({type:'delegateMarket',productId:p.id,strategy:'niche'})} title="Delegate launch targeting high-value niche segments">Niche</GameButton><GameButton onClick={()=>dispatch({type:'delegateMarket',productId:p.id,strategy:'expansion'})} title="Delegate launch expanding network reach">Expansion</GameButton></div>}</footer>
      </>:<><ProductEconomics product={p}/><footer className="launch-footer"><p>{p.description}</p>{p.status!=='deprecated'&&<GameButton tone="danger" onClick={()=>dispatch({type:'killProduct',productId:p.id})}>Sunset product</GameButton>}</footer></>}
    </article>;
  })}</div>;
}
