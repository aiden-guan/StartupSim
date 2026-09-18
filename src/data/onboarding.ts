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
    {id:'intro-1',text:'You have an apartment, a cofounder, and API credits.',focus:{type:'camera',id:'overview'},workspace:null,advance:next},
    {id:'intro-2',text:'This is headquarters.',focus:{type:'camera',id:'overview'},workspace:null,advance:next},
    {id:'intro-3',text:'This is your cofounder.',focus:{type:'employee',id:'cofounder'},workspace:null,advance:next},
    {id:'intro-4',text:'For now, this is the company.',focus:{type:'officeObject',id:'founderDesk'},workspace:null,advance:next},
    {id:'open-lab',text:'Open Products to build your first product.',focus:{type:'camera',id:'overview'},highlightUI:'new-product',advance:action('openedProductLab')},
    {id:'primitives',text:'Products start by combining two technologies.',workspace:'tasks',highlightUI:'primitives',advance:next},
    {id:'choose-chat',text:'Choose Chat.',workspace:'tasks',highlightUI:'primitive-chat',advance:action('selectedPrimitiveA')},
    {id:'choose-writing',text:'Combine it with Writing.',workspace:'tasks',highlightUI:'primitive-writing',advance:action('selectedPrimitiveB')},
    {id:'start-first',text:'The combination is ready. Start development.',workspace:'tasks',highlightUI:'start-product',advance:action('startedFirstProduct')},
  ]},
  {id:'assign',after:'intro',slides:[
    {id:'assign-founder',text:'Assign yourself to the project.',workspace:'tasks',highlightUI:'assign-founder',advance:action('assignedFounder')},
    {id:'assign-cofounder',text:'Assign your cofounder too; they speed development.',workspace:'tasks',highlightUI:'assign-cofounder',advance:action('assignedCofounder')},
    {id:'team-ready',text:'Both founders are assigned. Start the clock.',workspace:'tasks',highlightUI:'speed-controls',advance:next},
  ]},
  {id:'clock',after:'assign',slides:[
    {id:'start-clock',text:'Start the clock.',workspace:null,highlightUI:'speed-one',advance:action('startedClock')},
  ]},
  {id:'designer',after:'clock',slides:[
    {id:'product-ready',text:'Development is done. Choose how to launch this product.',workspace:'products',highlightUI:'product-ready',advance:next},
    {id:'deployment',text:'Scale determines how much of the market you can support at once.',workspace:'products',highlightUI:'stat-deployment',advance:next},
    {id:'capability',text:'Capability determines how strongly customers prefer the product once they try it.',workspace:'products',highlightUI:'stat-capability',advance:next},
    {id:'distribution',text:'Distribution determines how easily the product spreads between customer groups.',workspace:'products',highlightUI:'stat-distribution',advance:next},
    {id:'spend-points',text:'Spend at least one launch point.',workspace:'products',highlightUI:'designer',advance:action('spentLaunchPoint')},
    {id:'enter-market',text:'Enter the market map to establish customer footholds.',workspace:'products',highlightUI:'enter-market',advance:action('enteredFirstMarket')},
  ]},
  {id:'market',after:'designer',slides:[
    {id:'market-yours',text:'A market isn’t one crowd. Different customer segments adopt for different reasons.',highlightUI:'market-board',advance:next},
    {id:'market-beachhead',text:'Your product begins with a natural customer beachhead.',highlightUI:'market-player',advance:next},
    {id:'market-rival',text:'The competitor has a beachhead across the category.',highlightUI:'market-rival',advance:next},
    {id:'market-expand',text:'Every turn, you can expand into connected segments or reinforce existing footholds.',highlightUI:'market-customer',advance:next},
    {id:'market-support',text:'Strong nearby markets support neighboring segments.',highlightUI:'market-board',advance:next},
    {id:'market-dominance',text:'Overwhelm a segment to push the rival out: Market Dominance.',highlightUI:'market-value',advance:next},
    {id:'market-isolation',text:'Cut a market off from its network; its defense then collapses.',highlightUI:'market-board',advance:next},
    {id:'market-goal',text:'Capture as much of the market as possible before the launch ends.',highlightUI:'market-board',advance:next},
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
