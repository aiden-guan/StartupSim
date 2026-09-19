import { useState } from 'react';
import { BALANCE } from '../../config/balance';
import { models, modelById } from '../../data/models';
import { calculateModelImpact, calculateWeeklyProductInference } from '../../simulation/modelImpact';
import { primitives, primitiveById } from '../../data/primitives';
import { findRecipe } from '../../data/recipes';
import { PRICING_MODELS } from '../../data/pricing';
import { availableGtmStrategies, GTM_STRATEGIES } from '../../data/gtm';
import { currentTutorialSlide } from '../../simulation/tutorial';
import { canAffordStat, findProductByCombo, launchCosts, requiredFor } from '../../simulation/products';
import { taskEstimate } from '../../simulation/tasks';
import { reassignmentImpact, relevantSkillsFor } from '../../simulation/staffing';
import { computeBlockReason } from '../../simulation/compute';
import { isModelAvailable, providerForModel } from '../../simulation/effects';
import { calculateWeeklyProductOperations, gtmExecutionMultiplier, gtmFitAnalysis, marketDemandMultiplier } from '../../simulation/gtm';
import type { BusinessModel, Employee, GameState, LaunchStat, Product, Task } from '../../simulation/types';
import { useGame } from '../../state/store';
import { money, pct } from '../format';
import { GameButton } from '../shared/controls';
import { CharacterPortrait } from '../shared/CharacterPortrait';
import { GameIcon } from '../shared/Icons';
import { ProductPreview } from './ProductPreview';
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
  const [customName,setCustomName]=useState('');
  const [renamingTaskId,setRenamingTaskId]=useState<string | null>(null);
  const [renameTaskInput,setRenameTaskInput]=useState('');
  const a=game.onboarding.primitiveA,b=game.onboarding.primitiveB;
  const recipe=a&&b?findRecipe(a,b):null;
  const completedProduct=a&&b?game.products.find(p=>[p.combo[0],p.combo[1]].sort().join('.')===[a,b].sort().join('.')&&p.status!=='development'):undefined;
  const existingProduct=a&&b?(completedProduct??findProductByCombo(game.products,a,b)):undefined;
  const isCreated=Boolean(completedProduct);
  const intro=game.pendingMentor==='intro';
  const slide=currentTutorialSlide(game)?.id;
  const choosingSlot=slide==='choose-writing'?'b':slide==='choose-chat'?'a':slot;
  const difficulty=a&&b?(primitiveById[a]?.difficulty??0)+(primitiveById[b]?.difficulty??0)+(recipe?.difficultyMod??0):0;
  const defaultProductName=recipe?.name??(a&&b?`${primitiveById[a]?.name??a} ${primitiveById[b]?.name??b}`:'');
  const autoAssignNote=game.lastStaffing?game.lastStaffing.lines:[];
  return <div className="product-workspace">
    <div className="workspace-intro"><div><span className="eyebrow">Product lab</span><h3>{game.tasks.length?'Work in progress':'Start a product'}</h3></div>{!intro&&<div className="workspace-actions">{game.tasks.length>0&&<><GameButton onClick={()=>dispatch({type:'autoAssign'})}>Auto Assign All</GameButton><small>Covers every project first, then adds the best available teammates.</small></>}<GameButton onClick={()=>setShowLab(!showLab)}>{showLab?'View projects':'+ New product'}</GameButton></div>}</div>
    {autoAssignNote.length>0&&<p className="auto-assign-note">Auto assign complete</p>}
    {(intro||showLab)&&<section className="product-lab">
      <div className="lab-ingredients"><div className="eyebrow">01 · Choose your ingredients</div>
        <div className="combo-slots">{(['a','b'] as const).map((s,i)=><div key={s} className="combo-slot-wrap">{i===1&&<span className="combine-plus">+</span>}<button className={`combo-slot ${choosingSlot===s?'selected':''}`} onClick={()=>setSlot(s)} aria-label={`Select technology slot ${i+1}`}><span>{i+1}</span><GameIcon name={(s==='a'?a:b)??'products'}/><strong>{primitiveById[(s==='a'?a:b)??'']?.name??'Choose technology'}</strong></button></div>)}</div>
        <div className="primitive-grid" data-tutorial="primitives">{primitives.filter(p=>game.company.primitives.includes(p.id)).map(p=>{
          const blocked=intro&&(choosingSlot==='a'?p.id!=='chat':p.id!=='writing');
          return <button key={p.id} data-tutorial={`primitive-${p.id}`} className={`primitive-tile ${a===p.id||b===p.id?'selected':''}`} disabled={blocked} title={blocked?'Try Chat + Writing for your first product':`Add ${p.name} to slot ${choosingSlot.toUpperCase()}`} onClick={()=>{
            dispatch({type:'selectPrimitive',slot:choosingSlot,primitive:p.id});
            if (intro && (choosingSlot === 'b' || a === 'chat') && p.id === 'writing') {
              dispatch({type:'startProduct',a:'chat',b:'writing'});
              setShowLab(false);
            } else {
              setSlot(choosingSlot==='a'?'b':'a');
            }
          }}><GameIcon name={p.id}/><span>{p.name}</span></button>;
        })}</div>
      </div>
      <div className="recipe-preview">
        <span className="eyebrow">02 · The combination</span>
        <ProductPreview a={a} b={b} created={isCreated}/>
        <h3>{existingProduct?.name??recipe?.name??(a&&b?'Untested combination':'Choose two technologies')}</h3>
        <p>{existingProduct ? (isCreated ? `Already created from this combination. Start another version or choose a different pair.` : `Currently in development from this combination.`) : recipe?.description??'Combine two technologies to define a product.'}</p>
        {a&&b&&<div className="lab-product-name-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="eyebrow" style={{ fontSize: 10 }}>Product Name</span>
            <span className="char-counter-label" style={{ fontSize: 10, color: '#6e7f72' }}>
              {(customName || defaultProductName).length}/{BALANCE.MAX_PRODUCT_NAME_LENGTH}
            </span>
          </div>
          <div className="product-rename-input-wrap">
            <input
              type="text"
              className="product-name-field-input"
              maxLength={BALANCE.MAX_PRODUCT_NAME_LENGTH}
              value={customName}
              placeholder={defaultProductName}
              onChange={(e) => setCustomName(e.target.value)}
              aria-label="Custom product name"
            />
            <span className="char-counter">{(customName || defaultProductName).length}/{BALANCE.MAX_PRODUCT_NAME_LENGTH}</span>
          </div>
        </div>}
        {a&&b&&<div className="recipe-meta"><span>{existingProduct?'Already created':recipe?'Known recipe':'Experimental'}</span><span>Difficulty {difficulty.toFixed(1)}</span></div>}
        <GameButton tone="primary" data-tutorial="start-product" disabled={!a||!b} onClick={()=>{
          const finalName = customName.trim() || defaultProductName;
          dispatch({type:'startProduct',a:a!,b:b!,name:finalName});
          setCustomName('');
          setShowLab(false);
        }}>Start development →</GameButton>
      </div>
    </section>}
    <div className="project-list">{game.tasks.map(task=>{
      const estimate=taskEstimate(game,task);
      const p=game.products.find(p=>p.id===task.productId);
      const isRenaming = renamingTaskId === task.id && p;
      return <section key={task.id} className="project-sheet"><div className="project-heading"><div><span className="eyebrow">{task.type} · {p?`Difficulty ${p.difficulty.toFixed(1)}`:'Team project'}</span>
        {isRenaming ? (
          <div className="product-rename-inline-box">
            <div className="product-rename-input-wrap">
              <input
                type="text"
                className="product-name-field-input"
                maxLength={BALANCE.MAX_PRODUCT_NAME_LENGTH}
                value={renameTaskInput}
                onChange={(e) => setRenameTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameTaskInput.trim()) {
                    dispatch({ type: 'renameProduct', productId: p.id, name: renameTaskInput });
                    setRenamingTaskId(null);
                  } else if (e.key === 'Escape') {
                    setRenamingTaskId(null);
                  }
                }}
                autoFocus
                aria-label="Rename product"
              />
              <span className="char-counter">{renameTaskInput.length}/{BALANCE.MAX_PRODUCT_NAME_LENGTH}</span>
            </div>
            <div className="rename-btn-group">
              <GameButton
                tone="primary"
                disabled={!renameTaskInput.trim()}
                onClick={() => {
                  if (renameTaskInput.trim()) {
                    dispatch({ type: 'renameProduct', productId: p.id, name: renameTaskInput });
                    setRenamingTaskId(null);
                  }
                }}
              >
                Save
              </GameButton>
              <GameButton onClick={() => setRenamingTaskId(null)}>Cancel</GameButton>
            </div>
          </div>
        ) : (
          <div className="product-name-header-row">
            <h3>{task.name}</h3>
            {p && (
              <button
                type="button"
                className="product-rename-btn"
                onClick={() => {
                  setRenamingTaskId(task.id);
                  setRenameTaskInput(p.name);
                }}
                title="Rename product"
                aria-label={`Rename ${p.name}`}
              >
                ✏️ Rename
              </button>
            )}
          </div>
        )}
      </div><div className="project-time"><strong>{estimate.days===null?'No team assigned':`~${estimate.days} days`}</strong><small>{estimate.days===null?'Assign people below to begin':'At the current team’s pace'}</small></div></div>
        <div data-tutorial="task-progress"><div className="progress-label"><span>{Math.min(100,task.progress/task.requiredProgress*100).toFixed(0)}% complete</span><span>{estimate.daily.toFixed(1)} progress / day</span></div><div className="progress-track"><i style={{width:`${Math.min(100,task.progress/task.requiredProgress*100)}%`}}/></div></div>
        <div className="team-efficiency"><span>Team efficiency <strong>{pct(estimate.efficiency*100)}</strong></span><span>Coordination overhead −{Math.round((1-estimate.efficiency)*100)}%</span></div>
        {estimate.computeBlocked&&<div className="no-team-alert" role="status"><strong>Blocked by compute</strong><span>{computeBlockReason(game,task)??`${task.name} cannot advance until you buy GPU capacity or restore API credits.`}</span><GameButton onClick={()=>useGame.getState().setDrawer('compute')}>Open compute →</GameButton></div>}
        {estimate.workers.length===0?<div className="no-team-alert" role="alert"><strong>⚠ NO TEAM ASSIGNED</strong><span>Progress is halted. Assign available teammates below to begin development.</span></div>:<div className="team-active-note"><span>Assigned team: <strong>{estimate.workers.filter(w=>w.burnoutDays<=0).length} active</strong>{estimate.resting?` · ${estimate.workers.filter(w=>w.burnoutDays>0).length} resting`:''} · {estimate.days===null?'waiting':`~${estimate.days} days remaining`}</span></div>}
        <ProjectStaffing game={game} task={task}/>
        {estimate.workers.length>0&&<div className="skill-contributions">{relevantSkillsFor(task).filter(s=>s!=='productivity').map(skill=><span key={skill}>{skill}<b>{estimate.workers.reduce((s,w)=>s+(w.burnoutDays?0:w.skills[skill]),0).toFixed(1)}</b></span>)}</div>}
      </section>;
    })}</div>
    {!game.tasks.length&&!showLab&&!intro&&<div className="empty-state"><h3>No active projects.</h3><p>Ready products are in Launches.</p><GameButton onClick={()=>useGame.getState().setDrawer('products')}>View launches →</GameButton></div>}
  </div>;
}

function workerState(game: GameState, worker: Employee, task: Task) {
  if (worker.burnoutDays > 0) return { id: "resting" as const, label: `Resting · ${worker.burnoutDays}d · stays on ${game.tasks.find(t=>t.id===worker.taskId)?.name ?? "assignment"}` };
  if (worker.taskId === task.id) return { id: "assigned" as const, label: "Working on this" };
  const other = game.tasks.find((t) => t.id === worker.taskId);
  if (other) return { id: "elsewhere" as const, label: `On ${other.name}` };
  return { id: "available" as const, label: "Available" };
}

function ProjectStaffing({ game, task }: { game: GameState; task: Task }) {
  const dispatch = useGame((s) => s.dispatch);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = pendingId ? game.employees.find((w) => w.id === pendingId) : null;
  const impact = pending ? reassignmentImpact(game, pending, task) : null;
  const skills = relevantSkillsFor(task).filter((s) => s !== "productivity").slice(0, 3);

  function requestAssign(worker: Employee) {
    if (worker.burnoutDays > 0) return;
    if (worker.taskId === task.id) {
      dispatch({ type: "unassign", workerId: worker.id });
      return;
    }
    if (worker.taskId) {
      setPendingId(worker.id);
      return;
    }
    dispatch({ type: "assign", workerId: worker.id, taskId: task.id });
  }

  return (
    <div>
      {pending && impact?.fromTask && (
        <div className="assign-confirm" role="dialog" aria-label="Confirm reassignment">
          <p>
            {pending.name.split(" ")[0]} is currently assigned to {impact.fromTask.name}.
            {impact.lossPct > 0 ? ` Moving them will reduce ${impact.fromTask.name}'s expected development rate by ~${impact.lossPct}%.` : ""}
          </p>
          <div className="assign-confirm-actions">
            <GameButton onClick={() => setPendingId(null)}>Cancel</GameButton>
            <GameButton tone="primary" onClick={() => { dispatch({ type: "assign", workerId: pending.id, taskId: task.id, confirm: true }); setPendingId(null); }}>Reassign</GameButton>
          </div>
        </div>
      )}
      <div className="assignment-grid" data-tutorial="assign-crew">
        {game.employees.map((w) => {
          const state = workerState(game, w, task);
          return (
            <button
              key={w.id}
              className={`worker-assignment ${state.id}`}
              data-tutorial={task.productId === game.onboarding.firstProductId ? `assign-${w.role}` : undefined}
              aria-pressed={state.id === "assigned"}
              disabled={w.burnoutDays > 0}
              title={state.label}
              onClick={() => requestAssign(w)}
            >
              <CharacterPortrait look={w.look} robot={w.role === "robot"} />
              <div>
                <strong>{w.name}</strong>
                <small>{w.role === "founder" ? "Founder" : w.role === "cofounder" ? "Cofounder" : w.title}</small>
                <span>{skills.map((skill) => `${skill.slice(0, 3).toUpperCase()} ${w.skills[skill].toFixed(0)}`).join(" · ")}</span>
                <em>{state.id === "assigned" ? "✓ Working on this" : state.label}</em>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function projectLaunchEconomics(p: Product, game: GameState) {
  const pricing = PRICING_MODELS[p.businessModel] ?? PRICING_MODELS.freemium;
  const strategy = GTM_STRATEGIES[p.gtmStrategy] ?? GTM_STRATEGIES['product-led'];
  const fit = gtmFitAnalysis(game, p, strategy.id);
  const execution = gtmExecutionMultiplier(fit.score);
  const model = modelById[p.modelId];
  const modelImpact = model ? calculateModelImpact({
    model,
    product: p,
    technologies: game.company.technologies,
    worldInferenceCostIndex: game.world.inferenceCostIndex,
  }) : null;
  const demand = marketDemandMultiplier(game, p) * (modelImpact?.demandMultiplier ?? 1);
  const pa = primitiveById[p.combo[0]];
  const pb = primitiveById[p.combo[1]];

  // Typical competitive beachhead + expansion foothold projection (~7,000 baseline users)
  const scaleMult = 1 + p.levels.deployment * 0.15;
  const estUsers = Math.max(100, Math.round(7_000 * pricing.userMultiplier * strategy.volumeMultiplier * strategy.rampMultiplier * execution * demand * scaleMult * 0.8));

  const estInference = model ? calculateWeeklyProductInference({
    users: estUsers,
    combo: p.combo,
    pricingTokenMultiplier: pricing.tokenMultiplier,
    model,
    hasEfficientInferenceTech: game.company.technologies.includes('efficient-inference'),
    worldInferenceCostIndex: game.world.inferenceCostIndex,
    computeWeightA: pa?.computeWeight ?? 1,
    computeWeightB: pb?.computeWeight ?? 1,
  }) : 0;

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
    modelImpact,
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
  const [editingId,setEditingId]=useState<string | null>(null);
  const [editName,setEditName]=useState('');
  const [expandedIds,setExpandedIds]=useState<Record<string,boolean>>({});
  const ordered=[...game.products].sort((a,b)=>Number(b.status==='ready')-Number(a.status==='ready'));

  const readyCount = game.products.filter(p=>p.status==='ready').length;
  const activeCount = game.products.filter(p=>p.status==='active'||p.status==='mature'||p.status==='declining').length;

  return <div className="catalog-workspace">
    {!ordered.length&&<div className="empty-state"><GameIcon name="products"/><h3>No products yet.</h3><GameButton tone="primary" onClick={()=>useGame.getState().setDrawer('tasks')}>Open product lab →</GameButton></div>}
    {ordered.length>0&&<div className="catalog-header-bar">
      <div className="catalog-header-stats">
        <span className="eyebrow" style={{margin:0}}>Products ({ordered.length})</span>
        {readyCount>0&&<span className="catalog-stat-tag">{readyCount} ready to launch</span>}
        {activeCount>0&&<span className="catalog-stat-tag">{activeCount} active in market</span>}
      </div>
      <GameButton onClick={()=>{
        const allExpanded = ordered.every(p => expandedIds[p.id] ?? (p.status === 'ready'));
        const next: Record<string, boolean> = {};
        for (const p of ordered) next[p.id] = !allExpanded;
        setExpandedIds(next);
      }} className="catalog-expand-all-btn">
        {ordered.every(p => expandedIds[p.id] ?? (p.status === 'ready')) ? 'Collapse all' : 'Expand all'}
      </GameButton>
    </div>}
    {ordered.map(p=>{
      const costs=launchCosts(p), ready=p.status==='ready';
      const isLive=p.status==='active'||p.status==='mature'||p.status==='declining';
      const state=ready?(Object.values(p.levels).some(n=>n>0)?'Ready to launch':'Ready to configure'):p.status==='deprecated'?'Sunset':p.status;
      const isEditing=editingId===p.id;
      const isExpanded=expandedIds[p.id] ?? ready;
      return <article key={p.id} className={`product-sheet ${isExpanded?'is-expanded':'is-collapsed'}`}><header data-tutorial={ready?'product-ready':undefined}><div className="product-emblem product-combo-emblem"><GameIcon name={p.combo[0]}/><GameIcon name={p.combo[1]}/></div><div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:2}}>
          <span className="eyebrow" style={{margin:0}}>{state}</span>
          {isLive&&<span className="product-compact-badge">{money(p.weeklyRevenue)}/wk</span>}
          {isLive&&<span className="product-compact-badge">{Math.round(p.users).toLocaleString()} users</span>}
          {isLive&&<span className="product-compact-badge">{pct(p.marketShare)} share</span>}
          {ready&&<span className="product-compact-badge" style={{background:'#dce8dc',color:'#274b32'}}>{Math.floor(p.points.engineering+p.points.product+p.points.growth)} launch pts</span>}
        </div>
        {isEditing ? (
          <div className="product-rename-inline-box">
            <div className="product-rename-input-wrap">
              <input
                type="text"
                className="product-name-field-input"
                maxLength={BALANCE.MAX_PRODUCT_NAME_LENGTH}
                value={editName}
                onChange={(e)=>setEditName(e.target.value)}
                onKeyDown={(e)=>{
                  if (e.key === 'Enter' && editName.trim()) {
                    dispatch({ type: 'renameProduct', productId: p.id, name: editName });
                    setEditingId(null);
                  } else if (e.key === 'Escape') {
                    setEditingId(null);
                  }
                }}
                autoFocus
                aria-label="Rename product"
              />
              <span className="char-counter">{editName.length}/{BALANCE.MAX_PRODUCT_NAME_LENGTH}</span>
            </div>
            <div className="rename-btn-group">
              <GameButton
                tone="primary"
                disabled={!editName.trim()}
                onClick={()=>{
                  if (editName.trim()) {
                    dispatch({ type: 'renameProduct', productId: p.id, name: editName });
                    setEditingId(null);
                  }
                }}
              >
                Save
              </GameButton>
              <GameButton onClick={()=>setEditingId(null)}>Cancel</GameButton>
            </div>
          </div>
        ) : (
          <div className="product-name-header-row">
            <h3>{p.name}</h3>
            <button
              type="button"
              className="product-rename-btn"
              onClick={()=>{
                setEditingId(p.id);
                setEditName(p.name);
              }}
              title="Rename product"
              aria-label={`Rename ${p.name}`}
            >
              ✏️ Rename
            </button>
          </div>
        )}
        <p style={{margin:'2px 0 0'}}>{p.combo.map(id=>primitiveById[id]?.name??id).join(' + ')} · {p.vertical}{isLive?` · ${PRICING_MODELS[p.businessModel]?.name??p.businessModel} · ${p.gtmStrategy}`:''}</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
        {ready&&<span className="ready-stamp">PRODUCT READY</span>}
        <button
          type="button"
          className="product-collapse-toggle-btn"
          aria-expanded={isExpanded}
          onClick={()=>setExpandedIds(prev=>({...prev,[p.id]:!isExpanded}))}
        >
          {isExpanded?'Collapse ▲':'Details ▼'}
        </button>
      </div>
      </header>
      {isExpanded&&<>
        {p.status==='development'?<div className="development-notice"><p>Development is in progress. Configure the launch when it finishes.</p><GameButton onClick={()=>useGame.getState().setDrawer('tasks')}>View development →</GameButton></div>:ready?<>
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
              <span className="eyebrow">Powered by AI Model</span>
              <div className="choice-row">
                {models.filter(m => game.ownedModels.includes(m.id)).map(m => {
                  const impact = calculateModelImpact({ model: m, product: p, technologies: game.company.technologies });
                  const demandPct = Math.round((impact.demandMultiplier - 1) * 100);
                  const devPct = Math.round((impact.devSpeedMultiplier - 1) * 100);
                  const desc = `${m.name}: ${demandPct >= 0 ? '+' : ''}${demandPct}% demand, ${devPct >= 0 ? '+' : ''}${devPct}% dev speed, ${money(impact.effectiveTokenPrice)}/MTok`;
                  return (
                    <button
                      key={m.id}
                      disabled={!isModelAvailable(game, m.id)}
                      title={isModelAvailable(game, m.id) ? desc : `${providerForModel(m.id) ?? m.provider} is currently unavailable`}
                      aria-pressed={p.modelId === m.id}
                      onClick={() => dispatch({ type: 'setModel', productId: p.id, modelId: m.id })}
                    >
                      {m.name} ({money(m.costPerMTok)}/MTok){!isModelAvailable(game, m.id) ? ' · offline' : ''}
                    </button>
                  );
                })}
              </div>
              {(() => {
                const currentModel = modelById[p.modelId];
                const impact = currentModel ? calculateModelImpact({ model: currentModel, product: p, technologies: game.company.technologies }) : null;
                if (!impact) return null;
                return (
                  <div className="model-strategic-callout" style={{ fontSize: 11, color: '#3d4d42', margin: '8px 0 0', padding: '8px 11px', background: '#edf1e8', border: '1px solid #d4ded0', borderRadius: 4 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontWeight: 600, color: '#273f32' }}>
                      <span>Launch demand: {impact.demandMultiplier >= 1 ? `+${Math.round((impact.demandMultiplier - 1) * 100)}%` : `${Math.round((impact.demandMultiplier - 1) * 100)}%`}</span>
                      <span>Dev velocity: {impact.devSpeedMultiplier >= 1 ? `+${Math.round((impact.devSpeedMultiplier - 1) * 100)}%` : `${Math.round((impact.devSpeedMultiplier - 1) * 100)}%`}</span>
                      <span>Reliability: {Math.round(impact.estimatedReliability * 100)}% (+{(impact.retentionContribution * 100).toFixed(1)}%/wk ret)</span>
                      <span>Tokens: {money(impact.effectiveTokenPrice)}/MTok</span>
                    </div>
                    {impact.reasons.length > 0 && (
                      <div style={{ marginTop: 5, fontSize: 10, color: '#526658', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {impact.reasons.map((r) => <span key={r} style={{ background: '#dce5d4', padding: '2px 6px', borderRadius: 3 }}>{r}</span>)}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          <section className="gtm-strategy-selector">
            <div className="gtm-heading"><div><span className="eyebrow">Go-to-market strategy</span><h4>Choose a strategy your company can execute.</h4></div><small>Options depend on the product and market.</small></div>
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
                <p>Estimate for a competitive entry. Results depend on segment capture, execution, demand, reliability, and competition. This is not a profit guarantee.</p>
              </div>
            );
          })()}
          <footer className="launch-footer">
            <span>Time pauses during the market launch.</span>
            <GameButton tone="primary" data-tutorial="enter-market" disabled={game.onboarding.tutorialEnabled&&!game.company.seenMarket&&currentTutorialSlide(game)?.id!=='enter-market'} title={game.pendingMentor==='designer'&&currentTutorialSlide(game)?.id!=='enter-market'?'Finish configuring your first launch with the mentor':'Launch this product'} onClick={()=>dispatch({type:'enterMarket',productId:p.id})}>Enter market →</GameButton>
            {game.company.productsLaunched>=BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE&&(
              <div className="delegation-actions-group" style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                <span className="eyebrow" style={{fontSize:10,margin:0}}>Auto-Delegate:</span>
                <GameButton tone="plain" onClick={()=>dispatch({type:'delegateMarket',productId:p.id,strategy:'balanced'})} title="Delegate launch with balanced strategic weights">Balanced</GameButton>
                <GameButton tone="plain" onClick={()=>dispatch({type:'delegateMarket',productId:p.id,strategy:'aggressive'})} title="Delegate launch aggressively contesting rival hubs">Aggressive</GameButton>
                <GameButton tone="plain" onClick={()=>dispatch({type:'delegateMarket',productId:p.id,strategy:'niche'})} title="Delegate launch targeting high-value niche segments">Niche</GameButton>
                <GameButton tone="plain" onClick={()=>dispatch({type:'delegateMarket',productId:p.id,strategy:'expansion'})} title="Delegate launch expanding network reach">Expansion</GameButton>
              </div>
            )}
          </footer>
        </>:<>
          <ProductEconomics product={p}/>
          <footer className="launch-footer"><p>{p.description}</p>{p.status!=='deprecated'&&<GameButton tone="danger" onClick={()=>dispatch({type:'killProduct',productId:p.id})}>Sunset product</GameButton>}</footer>
        </>}
      </>}
    </article>;
  })}</div>;
}
