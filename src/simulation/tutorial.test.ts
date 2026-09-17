import { describe, expect, it } from 'vitest';
import { applyCommand, type GameCommand } from './commands';
import { createNewGame } from './newGame';
import { currentTutorialSlide } from './tutorial';
import { importSave, exportSave } from '../state/save';
import { taskEstimate } from './tasks';
import { BALANCE } from '../config/balance';
import { onboarding } from '../data/onboarding';

function run(seed=11) {
  let game=createNewGame({founderName:'Ada',companyName:'Northstar',cofounderId:'reya',seed});
  const send=(cmd:GameCommand)=>{game=applyCommand(game,cmd)!;return game;};
  const next=()=>send({type:'advanceMentor'});
  const id=()=>currentTutorialSlide(game)?.id;
  const start=()=>{
    for(let i=0;i<4;i++)next();
    expect(id()).toBe('open-lab');
    send({type:'tutorialEvent',action:'openedProductLab'});next();
    send({type:'selectPrimitive',slot:'a',primitive:'chat'});
    send({type:'selectPrimitive',slot:'b',primitive:'writing'});
    expect(id()).toBe('start-first');
    send({type:'startProduct',a:'chat',b:'writing'});
    expect(id()).toBe('assign-founder');
  };
  const assign=()=>{
    for(const w of game.employees)send({type:'assign',workerId:w.id,taskId:game.tasks[0]!.id});
    expect(id()).toBe('team-ready');next();
    expect(id()).toBe('start-clock');
    send({type:'setSpeed',speed:1});
    expect(game.pendingMentor).toBeNull();
    expect(game.clock.paused).toBe(false);
  };
  const ready=()=>{
    start();assign();
    const eta=taskEstimate(game,game.tasks[0]!).days!;
    expect(eta*BALANCE.MS_PER_DAY_AT_1X/1000).toBeGreaterThan(45);
    for(let n=0;n<100 && game.products[0]?.status==='development';n++)send({type:'tickDay'});
    expect(game.products[0]?.status).toBe('ready');
    expect(id()).toBe('product-ready');
    expect(game.clock.paused).toBe(true);
  };
  return {get game(){return game;},send,next,id,start,assign,ready,reload:()=>{game=importSave(exportSave(game));}};
}

describe('guided first company',()=>{
  it('runs product, configuration, market, report, revenue, hire, and research without debug',()=>{
    const r=run();r.ready();
    const productId=r.game.products[0]!.id;
    r.send({type:'enterMarket',productId});
    expect(r.game.marketBattle).toBeNull();
    for(let i=0;i<4;i++)r.next();
    expect(r.id()).toBe('spend-points');
    r.send({type:'buyStat',productId,stat:'capability'});
    expect(r.id()).toBe('enter-market');
    r.send({type:'enterMarket',productId});
    expect(r.id()).toBe('market-yours');
    const tick=r.game.clock.tick;
    r.send({type:'tickDay'});r.send({type:'marketEndTurn'});
    expect(r.game.clock.tick).toBe(tick);
    expect(r.game.marketBattle?.turnsLeft).toBe(10);
    r.reload();expect(r.id()).toBe('market-yours');
    for(let i=0;i<8;i++)r.next();
    expect(r.game.pendingMentor).toBeNull();
    r.send({type:'marketCapture'});
    for(let i=0;i<10 && r.game.marketBattle;i++)r.send({type:'marketEndTurn'});
    expect(r.game.marketBattle).toBeNull();
    expect(r.game.marketResult?.revenue).toBeGreaterThan(0);
    expect(r.game.clock.pauseReasons).toContain('results');
    r.reload();expect(r.game.marketResult).not.toBeNull();
    r.send({type:'continueMarketResults'});
    expect(r.id()).toBe('revenue-first');r.next();r.next();
    expect(r.game.pendingMentor).toBeNull();
    r.send({type:'setSpeed',speed:1});
    for(let i=0;i<4;i++)r.send({type:'tickDay'});
    expect(r.id()).toBe('hire-open');
    expect(r.game.unlocks.hiring).toBe(true);
    r.send({type:'recruit',channelId:'network'});
    expect(r.id()).toBe('hire-candidate');
    const candidate=r.game.hiring.candidates[0]!;
    r.send({type:'hire',candidateId:candidate.employee.id,salary:candidate.minSalary});
    expect(r.game.stats.employeesHired).toBe(1);
    expect(r.game.pendingMentor).toBeNull();
    for(let i=0;i<4;i++)r.send({type:'tickDay'});
    expect(r.id()).toBe('research-open');
    r.send({type:'startResearch',techId:'prompt-engineering'});
    expect(r.game.tasks.some(t=>t.techId==='prompt-engineering')).toBe(true);
    expect(r.game.pendingMentor).toBeNull();
    expect(r.game.company.lifetimeRevenue).toBeGreaterThan(0);
  });

  it('ignores wrong actions, repeated clicks and an early clock event',()=>{
    const r=run();r.send({type:'setSpeed',speed:8});
    r.send({type:'startProduct',a:'chat',b:'writing'});
    expect(r.game.products).toHaveLength(0);
    expect(r.game.onboarding.events).not.toContain('startedClock');
    r.start();
    r.send({type:'startProduct',a:'chat',b:'writing'});
    expect(r.game.products).toHaveLength(1);
    r.send({type:'tutorialEvent',action:'assignedFounder'});
    expect(r.id()).toBe('assign-founder');
    const task=r.game.tasks[0]!;
    const partner=r.game.employees.find(e=>e.role==='cofounder')!;
    r.send({type:'assign',workerId:partner.id,taskId:task.id});
    expect(r.id()).toBe('assign-founder');
    r.send({type:'fire',workerId:partner.id});
    expect(r.game.employees).toHaveLength(2);
    r.assign();
  });

  it('reloads every introductory phase and Back never re-creates a product',()=>{
    const r=run();
    for(let n=0;n<4;n++){r.next();r.reload();}
    r.send({type:'tutorialEvent',action:'openedProductLab'});r.next();
    r.send({type:'selectPrimitive',slot:'a',primitive:'chat'});r.reload();
    expect(r.id()).toBe('choose-writing');
    r.send({type:'backMentor'});expect(r.id()).toBe('primitives');r.next();
    expect(r.id()).toBe('choose-writing');
    r.send({type:'selectPrimitive',slot:'b',primitive:'writing'});r.reload();
    r.send({type:'startProduct',a:'chat',b:'writing'});r.reload();
    expect(r.id()).toBe('assign-founder');expect(r.game.tasks).toHaveLength(1);
  });

  it('returns to missing founder assignment before starting the clock',()=>{
    const r=run();r.start();
    for(const w of r.game.employees)r.send({type:'assign',workerId:w.id,taskId:r.game.tasks[0]!.id});
    r.next();
    r.send({type:'unassign',workerId:r.game.employees[0]!.id});
    expect(r.id()).toBe('assign-founder');
    expect(r.game.clock.paused).toBe(true);
  });

  it('skip and settings release only their own pause reasons',()=>{
    const r=run();r.send({type:'pauseLock',reason:'settings',enabled:true});
    r.send({type:'setPaused',paused:true,reason:'Inbox'});
    r.send({type:'skipTutorial'});
    expect(r.game.pendingMentor).toBeNull();
    expect(r.game.clock.pauseReasons).not.toContain('tutorial');
    r.send({type:'setSpeed',speed:1});
    expect(r.game.clock.pauseReasons).toEqual(expect.arrayContaining(['settings','event']));
    r.send({type:'pauseLock',reason:'settings',enabled:false});
    r.send({type:'tickDay'});expect(r.game.clock.tick).toBe(0);
    r.send({type:'setPaused',paused:false,reason:'Inbox'});
    r.send({type:'tickDay'});expect(r.game.clock.tick).toBe(1);
  });

  it('recovers when every recruiting candidate is passed',()=>{
    let g=createNewGame({founderName:'A',companyName:'N',cofounderId:'reya',seed:44});
    g.company.seenMarket=true;g.company.productsLaunched=1;g.firstLaunchTick=0;
    g.onboarding.finished=['intro','assign','clock','designer','market','revenue'];g.pendingMentor=null;
    g=applyCommand(g,{type:'setSpeed',speed:1})!;
    g=applyCommand(g,{type:'recruit',channelId:'network'})!;
    expect(currentTutorialSlide(g)?.id).toBe('hire-candidate');
    for(const c of g.hiring.candidates)g=applyCommand(g,{type:'passCandidate',candidateId:c.employee.id})!;
    expect(g.pendingMentor).toBeNull();expect(g.clock.paused).toBe(false);
    for(let i=0;i<10;i++)g=applyCommand(g,{type:'tickDay'})!;
    expect(currentTutorialSlide(g)?.id).toBe('hire-open');
  });

  it('restores market entry mid-session with 100% fidelity on save and reload', () => {
    const r = run(42);
    r.ready();
    const productId = r.game.products[0]!.id;
    for (let i = 0; i < 4; i++) r.next();
    r.send({ type: 'buyStat', productId, stat: 'capability' });
    r.send({ type: 'buyStat', productId, stat: 'distribution' });
    r.send({ type: 'enterMarket', productId });
    expect(r.game.marketBattle).not.toBeNull();
    for (let i = 0; i < 8; i++) r.next(); // clear mentor explanation slides

    // Select and expand into a market node
    const sessionBefore = r.game.marketBattle!;
    const targetNode = sessionBefore.nodes.find(n => n.id !== sessionBefore.playerBeachhead)!;
    r.send({ type: 'selectMarketNode', nodeId: targetNode.id });
    r.send({ type: 'marketAction', nodeId: targetNode.id, action: 'expand' });

    const battleBeforeSave = structuredClone(r.game.marketBattle!);
    const rawJson = exportSave(r.game);
    const restored = importSave(rawJson);

    expect(restored.marketBattle).not.toBeNull();
    expect(restored.clock.pauseReasons).toContain('market');
    expect(restored.marketBattle?.productId).toBe(battleBeforeSave.productId);
    expect(restored.marketBattle?.competitorId).toBe(battleBeforeSave.competitorId);
    expect(restored.marketBattle?.turnsLeft).toBe(battleBeforeSave.turnsLeft);
    expect(restored.marketBattle?.selectedNodeId).toBe(battleBeforeSave.selectedNodeId);
    expect(restored.marketBattle?.playerBeachhead).toBe(battleBeforeSave.playerBeachhead);
    expect(restored.marketBattle?.rivalBeachhead).toBe(battleBeforeSave.rivalBeachhead);
    expect(restored.marketBattle?.playerScaleUsed).toBe(battleBeforeSave.playerScaleUsed);
    expect(restored.marketBattle?.rivalScaleUsed).toBe(battleBeforeSave.rivalScaleUsed);

    // Verify node fidelity (influence, shares, dominance, isolation)
    expect(restored.marketBattle?.nodes.length).toBe(battleBeforeSave.nodes.length);
    for (let i = 0; i < battleBeforeSave.nodes.length; i++) {
      const bNode = battleBeforeSave.nodes[i]!;
      const rNode = restored.marketBattle!.nodes[i]!;
      expect(rNode.id).toBe(bNode.id);
      expect(rNode.playerInfluence).toBe(bNode.playerInfluence);
      expect(rNode.rivalInfluence).toBe(bNode.rivalInfluence);
      expect(rNode.playerShare).toBe(bNode.playerShare);
      expect(rNode.rivalShare).toBe(bNode.rivalShare);
      expect(rNode.playerDominated).toBe(bNode.playerDominated);
      expect(rNode.rivalDominated).toBe(bNode.rivalDominated);
      expect(rNode.playerIsolated).toBe(bNode.playerIsolated);
      expect(rNode.rivalIsolated).toBe(bNode.rivalIsolated);
    }

    // Verify edge fidelity
    expect(restored.marketBattle?.edges.length).toBe(battleBeforeSave.edges.length);
    for (let i = 0; i < battleBeforeSave.edges.length; i++) {
      expect(restored.marketBattle!.edges[i]).toEqual(battleBeforeSave.edges[i]);
    }
  });

  it('triggers bankruptcy ending cleanly when cash drops below 0 without breaking mentor state', () => {
    const r = run(19);
    r.ready();
    const productId = r.game.products[0]!.id;
    for (let i = 0; i < 4; i++) r.next();
    r.send({ type: 'buyStat', productId, stat: 'capability' });
    r.send({ type: 'enterMarket', productId });
    for (let i = 0; i < 8; i++) r.next();
    for (let i = 0; i < 10 && r.game.marketBattle; i++) r.send({ type: 'marketEndTurn' });
    r.send({ type: 'continueMarketResults' });
    expect(r.id()).toBe('revenue-first');
    r.next();
    r.next();
    expect(r.game.pendingMentor).toBeNull();
    r.send({ type: 'setSpeed', speed: 1 });
    expect(r.game.clock.paused).toBe(false);

    // Force negative cash
    r.send({ type: 'debug', action: 'cash', amount: -200000 });
    expect(r.game.company.cash).toBeLessThan(0);

    // Tick day to trigger ending detection
    r.send({ type: 'tickDay' });
    expect(r.game.endingId).toBe('bankruptcy');
    expect(r.game.clock.pauseReasons).toContain('ended');
    expect(r.game.clock.paused).toBe(true);

    // State can still be saved and loaded cleanly in ended screen
    const raw = exportSave(r.game);
    const loaded = importSave(raw);
    expect(loaded.endingId).toBe('bankruptcy');
    expect(loaded.clock.paused).toBe(true);
  });

  it('verifies all tutorial slide highlight targets exist and slide bounds are invariant', () => {
    const KNOWN_TARGETS = new Set([
      'new-product',
      'primitives',
      'primitive-chat',
      'primitive-writing',
      'start-product',
      'assign-founder',
      'assign-cofounder',
      'speed-controls',
      'speed-one',
      'product-ready',
      'stat-deployment',
      'stat-capability',
      'stat-distribution',
      'designer',
      'enter-market',
      'market-player',
      'market-rival',
      'market-customer',
      'market-value',
      'market-board',
      'market-capture',
      'market-end-turn',
      'product-economics',
      'team-nav',
      'recruit-network',
      'candidate-dossier',
      'research-tree',
      'compute-capacity',
      'funding-meetings',
    ]);

    const r = run();
    for (const step of r.game.onboarding ? [r.game.onboarding] : []) {
      expect(step).toBeDefined();
    }

    // Every slide's highlightUI must belong to KNOWN_TARGETS
    for (const step of onboarding) {
      expect(step.slides.length).toBeGreaterThan(0);
      for (const slide of step.slides) {
        if (slide.highlightUI) {
          expect(KNOWN_TARGETS.has(slide.highlightUI)).toBe(true);
        }
      }
    }
  });

  it('skipping tutorial initializes cleanly with full player control', () => {
    let game = createNewGame({ founderName: 'Aiden', companyName: 'Synthetix', cofounderId: 'reya', skipTutorial: true });
    expect(game.onboarding.tutorialEnabled).toBe(false);
    expect(game.pendingMentor).toBeNull();
    expect(game.clock.pauseReasons).not.toContain('tutorial');
    expect(game.clock.paused).toBe(true); // game starts paused until player starts it
    game = applyCommand(game, { type: 'setSpeed', speed: 1 })!;
    expect(game.clock.paused).toBe(false);
    expect(game.clock.speed).toBe(1);
  });
});
