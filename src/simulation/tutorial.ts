import { offices } from '../data/offices';
import { onboarding, type TutorialAction, type TutorialSlide } from '../data/onboarding';
import { setPause } from './pause';
import type { GameState } from './types';

export function currentTutorialStep(state:GameState) {
  if (!state.onboarding.tutorialEnabled || !state.pendingMentor) return null;
  return onboarding.find(step => step.id === state.pendingMentor) ?? null;
}
export function currentTutorialSlide(state:GameState):TutorialSlide|null {
  return currentTutorialStep(state)?.slides[state.onboarding.slideIndex] ?? null;
}
export function firstProduct(state:GameState) {
  return state.products.find(p => p.id === state.onboarding.firstProductId) ?? state.products[0];
}
function satisfied(state:GameState, action:TutorialAction):boolean {
  const product = firstProduct(state);
  const task = state.tasks.find(t => t.productId === product?.id);
  switch(action) {
    case 'selectedPrimitiveA': return state.onboarding.primitiveA === 'chat';
    case 'selectedPrimitiveB': return state.onboarding.primitiveB === 'writing';
    case 'startedFirstProduct': return Boolean(product);
    case 'assignedFounder': return Boolean(task && state.employees.some(w => w.role === 'founder' && w.taskId === task.id));
    case 'assignedCofounder': return Boolean(task && state.employees.some(w => w.role === 'cofounder' && w.taskId === task.id));
    case 'spentLaunchPoint': return Boolean(product && Object.values(product.levels).some(n=>n>0));
    case 'enteredFirstMarket': return Boolean(state.marketBattle || state.company.seenMarket);
    case 'hiredEmployee': return state.stats.employeesHired > 0;
    case 'recruitedCandidates': return state.hiring.candidates.length > 0 || state.stats.employeesHired > 0;
    case 'startedResearch': return state.tasks.some(t=>t.type==='research') || state.stats.researchCompleted > 0;
    default: return state.onboarding.events.includes(action);
  }
}
export function finishMentorStep(state:GameState) {
  if (!state.pendingMentor) return;
  const id=state.pendingMentor;
  if (!state.onboarding.finished.includes(id)) state.onboarding.finished.push(id);
  state.pendingMentor=null;
  state.onboarding.slideIndex=0;
  if (['revenue','hire','research','compute','funding'].includes(id)) state.onboarding.nextLessonTick=state.clock.tick+4;
  setPause(state,'tutorial',false);
}
function stepForward(state:GameState) {
  const step=currentTutorialStep(state);
  if (!step) return;
  if(state.onboarding.slideIndex < step.slides.length-1) state.onboarding.slideIndex++;
  else finishMentorStep(state);
}
export function applyAdvanceMentor(state:GameState) {
  if(currentTutorialSlide(state)?.advance.type !== 'nextButton') return;
  stepForward(state);
  reconcileTutorial(state);
}
export function applyBackMentor(state:GameState) {
  const step=currentTutorialStep(state);
  if(!step) return;
  // Revisit explanations, never undo a committed action or recreate its task.
  for(let i=state.onboarding.slideIndex-1;i>=0;i--) {
    if(step.slides[i]?.advance.type==='nextButton') {state.onboarding.slideIndex=i; return;}
  }
}
export function recordTutorialEvent(state:GameState, action:TutorialAction) {
  if(!state.onboarding.events.includes(action)) state.onboarding.events.push(action);
  const slide=currentTutorialSlide(state);
  if(slide?.advance.type==='playerAction' && slide.advance.action===action && satisfied(state,action)) stepForward(state);
  reconcileTutorial(state);
}
export function slideWantsAction(state:GameState,action:string) {
  const slide=currentTutorialSlide(state);
  return slide?.advance.type==='playerAction' && slide.advance.action===action;
}
export function updateUnlocks(state:GameState) {
  const launched=state.company.productsLaunched;
  const age=state.firstLaunchTick===null ? 0 : state.clock.tick-state.firstLaunchTick;
  if(launched>=1) state.unlocks.hiring=true;
  if(launched>=1 && (state.stats.employeesHired>0 || age>=14)) state.unlocks.research=true;
  if(launched>=1 && (state.stats.researchCompleted>0 || age>=21)) {state.unlocks.compute=true;state.unlocks.models=true;}
  if(launched>=1 && age>=28) state.unlocks.promo=true;
  if(state.stats.employeesHired>0 && age>=35) state.unlocks.perks=true;
  if(launched>=2) state.unlocks.funding=true;
  if(launched>=3) state.unlocks.world=true;
  if(state.company.officeLevel>=1) state.unlocks.locations=true;
  if(state.company.cash>200_000) state.unlocks.verticals=true;
  if(state.company.technologies.includes('agents')) state.unlocks.automation=true;
  if(state.company.technologies.includes('fine-tuning')) state.unlocks.models=true;
}
function eligible(state:GameState,id:string):boolean {
  const p=firstProduct(state);
  if(id==='intro') return !p;
  if(id==='assign') return p?.status==='development';
  if(id==='clock') return p?.status==='development';
  if(id==='designer') return p?.status==='ready';
  if(id==='market') return Boolean(state.marketBattle?.firstMarket);
  if(id==='revenue') return state.company.seenMarket && !state.marketResult && !state.marketBattle;
  if(state.clock.tick<state.onboarding.nextLessonTick || state.marketBattle || state.marketResult || state.products.some(p=>p.status==='ready')) return false;
  if(id==='hire') return state.unlocks.hiring && state.company.cash>=4000 && (state.hiring.candidates.length>0 || state.hiring.cooldownDays===0) && state.employees.length<(offices[state.company.officeLevel]?.capacity??6);
  if(id==='research') return state.unlocks.research && state.company.cash>=12_000;
  if(id==='compute') return state.unlocks.compute;
  if(id==='funding') return state.unlocks.funding;
  return false;
}
export function reconcileTutorial(state:GameState) {
  updateUnlocks(state);
  if(!state.onboarding.tutorialEnabled) {state.pendingMentor=null;setPause(state,'tutorial',false);return;}
  // Re-enter assignment if a required worker was removed while learning the clock.
  const task = state.tasks.find(t=>t.productId===state.onboarding.firstProductId);
  if ((state.pendingMentor==='clock' || (state.pendingMentor==='assign' && state.onboarding.slideIndex===2)) && task) {
    const missing = ['founder','cofounder'].find(role=>!state.employees.some(w=>w.role===role && w.taskId===task.id));
    if (missing) {
      state.pendingMentor='assign';state.onboarding.slideIndex=missing==='founder'?0:1;
      state.onboarding.finished=state.onboarding.finished.filter(id=>id!=='assign');
    }
  }
  // Passing/losing the last candidate releases the clock until recruitment is available.
  if (state.pendingMentor==='hire' && !state.hiring.candidates.length && state.hiring.cooldownDays>0 && !state.stats.employeesHired) {
    state.pendingMentor=null;state.onboarding.slideIndex=0;setPause(state,'tutorial',false);return;
  }
  // A bounded pass consumes already-satisfied actions after reload or Back.
  for(let n=0;n<30;n++) {
    const slide=currentTutorialSlide(state);
    if(slide) {
      if(slide.advance.type==='playerAction' && satisfied(state,slide.advance.action)) {stepForward(state);continue;}
      setPause(state,'tutorial',true);return;
    }
    const step=onboarding.find(s=> !state.onboarding.finished.includes(s.id) && (!s.after || state.onboarding.finished.includes(s.after)) && eligible(state,s.id));
    if(!step) {setPause(state,'tutorial',false);return;}
    state.pendingMentor=step.id;state.onboarding.slideIndex=0;
  }
}
export function skipTutorial(state:GameState) {
  state.onboarding.tutorialEnabled=false;
  state.onboarding.finished=onboarding.map(s=>s.id);
  state.onboarding.slideIndex=0;state.onboarding.revealDone=true;state.pendingMentor=null;
  setPause(state,'tutorial',false);
}
