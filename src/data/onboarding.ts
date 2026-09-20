import type { DrawerId } from '../simulation/types';

export type TutorialAction = 'openedProductLab' | 'selectedPrimitiveA' | 'selectedPrimitiveB' | 'startedFirstProduct' |
  'assignedFounder' | 'assignedCofounder' | 'startedClock' | 'firstProductReady' | 'openedProductDesigner' |
  'spentLaunchPoint' | 'enteredFirstMarket' | 'selectedMarketPiece' | 'movedMarketPiece' | 'capturedMarketTile' |
  'endedMarketTurn' | 'completedFirstMarket' | 'continuedMarketResults' | 'openedHiring' | 'recruitedCandidates' |
  'hiredEmployee' | 'openedResearch' | 'startedResearch' | 'openedCompute' | 'openedFunding';
export interface TutorialSlide {
  id: string;
  text: string;
  focus?: {type: 'employee' | 'officeObject' | 'ui' | 'camera' | 'none'; id?: string};
  workspace?: DrawerId | null;
  highlightUI?: string;
  advance: {type:'nextButton'} | {type:'playerAction'; action:TutorialAction};
  pauseGame?: boolean;
}
export interface OnboardDef { id:string; slides:TutorialSlide[]; after?:string }
const next = {type:'nextButton'} as const;
const action = (action:TutorialAction) => ({type:'playerAction',action} as const);
export const onboarding: OnboardDef[] = [
  {id:'intro', slides:[
    {id:'intro-1',text:'Build and ship your first product. Your cofounder speeds the work; the office shows it happening.',focus:{type:'camera',id:'overview'},workspace:null,advance:next},
    {id:'open-lab',text:'Open Build to choose two technologies.',focus:{type:'camera',id:'overview'},highlightUI:'new-product',advance:action('openedProductLab')},
    {id:'primitives',text:'Combine two technologies to make a product.',workspace:'tasks',highlightUI:'primitives',advance:next},
    {id:'choose-chat',text:'Choose Chat.',workspace:'tasks',highlightUI:'primitive-chat',advance:action('selectedPrimitiveA')},
    {id:'choose-writing',text:'Combine it with Writing.',workspace:'tasks',highlightUI:'primitive-writing',advance:action('selectedPrimitiveB')},
    {id:'start-first',text:'The combination is ready. Start development.',workspace:'tasks',highlightUI:'start-product',advance:action('startedFirstProduct')},
  ]},
  {id:'assign',after:'intro',slides:[
    {id:'assign-founder',text:'Put yourself on the project.',workspace:'tasks',highlightUI:'assign-founder',advance:action('assignedFounder')},
    {id:'assign-cofounder',text:'Add your cofounder to finish faster.',workspace:'tasks',highlightUI:'assign-cofounder',advance:action('assignedCofounder')},
    {id:'team-ready',text:'The project has a team. Start time.',workspace:'tasks',highlightUI:'speed-controls',advance:next},
  ]},
  {id:'clock',after:'assign',slides:[
    {id:'start-clock',text:'Start the clock.',workspace:null,highlightUI:'speed-one',advance:action('startedClock')},
  ]},
  {id:'designer',after:'clock',slides:[
    {id:'product-ready',text:'Development is done. Shape the launch.',workspace:'products',highlightUI:'product-ready',advance:next},
    {id:'spend-points',text:'Spend points on scale, conversion, or reach. Use them all, then enter the market.',workspace:'products',highlightUI:'designer',advance:action('spentLaunchPoint')},
    {id:'enter-market',text:'Enter the market map to establish customer footholds.',workspace:'products',highlightUI:'enter-market',advance:action('enteredFirstMarket')},
  ]},
  {id:'market',after:'designer',slides:[
    {id:'market-yours',text:'Each circle is a customer segment. Your orange beachhead is the starting point.',highlightUI:'market-board',advance:next},
    {id:'market-expand',text:'Select a segment, then Promote, Reinforce, or Poach. Spend Ops where the edge is worth it.',highlightUI:'market-customer',advance:next},
    {id:'market-goal',text:'Capture as much as you can before turns run out. End turn to let the rival move.',highlightUI:'market-end-turn',advance:next},
  ]},
  {id:'revenue',after:'market',slides:[
    {id:'revenue-first',text:'The launch produced revenue.',workspace:'products',highlightUI:'product-economics',advance:next},
    {id:'revenue-next',text:'Hiring is unlocked under Team. Keep time moving or plan your next move.',workspace:null,highlightUI:'team-nav',advance:next},
  ]},
  {id:'hire',after:'revenue',slides:[
    {id:'hire-open',text:'Open Recruiting and start with your personal network.',workspace:'hiring',highlightUI:'recruit-network',advance:action('recruitedCandidates')},
    {id:'hire-candidate',text:'Read their skills, check the salary, then hire. An offer at the asking salary is guaranteed; lower offers can be rejected.',workspace:'hiring',highlightUI:'candidate-dossier',advance:action('hiredEmployee')},
  ]},
  {id:'research',after:'hire',slides:[
    {id:'research-open',text:'Research unlocks product combinations. Start a node, then assign a team in Projects.',workspace:'research',highlightUI:'research-tree',advance:action('startedResearch')},
  ]},
  {id:'compute',after:'research',slides:[
    {id:'compute-open',text:'Users consume compute. Credits pay for inference first; watch this bill as products grow.',workspace:'compute',highlightUI:'compute-capacity',advance:next},
  ]},
  {id:'funding',after:'compute',slides:[
    {id:'funding-open',text:'Two launches unlock funding. Raising money buys time but costs ownership and adds a board.',workspace:'funding',highlightUI:'funding-meetings',advance:next},
  ]},
];
export const onboardingById = Object.fromEntries(onboarding.map(step => [step.id,step]));
