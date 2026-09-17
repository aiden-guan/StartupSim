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
    {id:'intro-1',text:'You have an apartment, a cofounder, and enough API credits to become a problem.',focus:{type:'camera',id:'overview'},workspace:null,advance:next},
    {id:'intro-2',text:'This is headquarters.',focus:{type:'camera',id:'overview'},workspace:null,advance:next},
    {id:'intro-3',text:'This is your cofounder.',focus:{type:'employee',id:'cofounder'},workspace:null,advance:next},
    {id:'intro-4',text:'For now, this is the whole company.',focus:{type:'officeObject',id:'founderDesk'},workspace:null,advance:next},
    {id:'open-lab',text:'Companies usually work better when they have something to sell.',focus:{type:'camera',id:'overview'},highlightUI:'new-product',advance:action('openedProductLab')},
    {id:'primitives',text:'Products start by combining two technologies.',workspace:'tasks',highlightUI:'primitives',advance:next},
    {id:'choose-chat',text:'Choose Chat.',workspace:'tasks',highlightUI:'primitive-chat',advance:action('selectedPrimitiveA')},
    {id:'choose-writing',text:'Now combine it with Writing.',workspace:'tasks',highlightUI:'primitive-writing',advance:action('selectedPrimitiveB')},
    {id:'start-first',text:'Good enough for venture capital.',workspace:'tasks',highlightUI:'start-product',advance:action('startedFirstProduct')},
  ]},
  {id:'assign',after:'intro',slides:[
    {id:'assign-founder',text:'A product without people is a slide deck.',workspace:'tasks',highlightUI:'assign-founder',advance:action('assignedFounder')},
    {id:'assign-cofounder',text:'Your cofounder is probably worth using too.',workspace:'tasks',highlightUI:'assign-cofounder',advance:action('assignedCofounder')},
    {id:'team-ready',text:'Now they can actually build it.',workspace:'tasks',highlightUI:'speed-controls',advance:next},
  ]},
  {id:'clock',after:'assign',slides:[
    {id:'start-clock',text:'Start the clock.',workspace:null,highlightUI:'speed-one',advance:action('startedClock')},
  ]},
  {id:'designer',after:'clock',slides:[
    {id:'product-ready',text:'Development is done. Now decide what kind of product you’re launching.',workspace:'products',highlightUI:'product-ready',advance:next},
    {id:'deployment',text:'Scale determines how much of the market you can support at once.',workspace:'products',highlightUI:'stat-deployment',advance:next},
    {id:'capability',text:'Capability determines how strongly customers prefer the product once they try it.',workspace:'products',highlightUI:'stat-capability',advance:next},
    {id:'distribution',text:'Distribution determines how easily the product spreads between customer groups.',workspace:'products',highlightUI:'stat-distribution',advance:next},
    {id:'spend-points',text:'Spend your points.',workspace:'products',highlightUI:'designer',advance:action('spentLaunchPoint')},
    {id:'enter-market',text:'Ready. Enter the market map to establish customer footholds.',workspace:'products',highlightUI:'enter-market',advance:action('enteredFirstMarket')},
  ]},
  {id:'market',after:'designer',slides:[
    {id:'market-yours',text:'A market isn’t one crowd. Different customer segments adopt for different reasons.',highlightUI:'market-board',advance:next},
    {id:'market-beachhead',text:'Your product begins with a natural customer beachhead.',highlightUI:'market-player',advance:next},
    {id:'market-rival',text:'Your competitor has established their own beachhead across the category.',highlightUI:'market-rival',advance:next},
    {id:'market-expand',text:'Every turn, you can expand into connected segments or reinforce existing footholds.',highlightUI:'market-customer',advance:next},
    {id:'market-support',text:'Nearby strong markets provide connected network support to neighboring segments.',highlightUI:'market-board',advance:next},
    {id:'market-dominance',text:'If you overwhelm a segment decisively, the rival is pushed out completely with Market Dominance.',highlightUI:'market-value',advance:next},
    {id:'market-isolation',text:'Cut a market off from their network and its defense collapses into isolation.',highlightUI:'market-board',advance:next},
    {id:'market-goal',text:'Take as much of the market as you can before the launch concludes.',highlightUI:'market-board',advance:next},
  ]},
  {id:'revenue',after:'market',slides:[
    {id:'revenue-first',text:'Congratulations. You now have revenue.',workspace:'products',highlightUI:'product-economics',advance:next},
    {id:'revenue-next',text:'Hiring is now available under Team. Keep the clock moving or prepare your next move.',workspace:null,highlightUI:'team-nav',advance:next},
  ]},
  {id:'hire',after:'revenue',slides:[
    {id:'hire-open',text:'Ready for another pair of hands? Start with your personal network.',workspace:'hiring',highlightUI:'recruit-network',advance:action('recruitedCandidates')},
    {id:'hire-candidate',text:'Read their skills, check the salary, then hire. An offer at the asking salary is guaranteed; lower offers can be rejected.',workspace:'hiring',highlightUI:'candidate-dossier',advance:action('hiredEmployee')},
  ]},
  {id:'research',after:'hire',slides:[
    {id:'research-open',text:'Research opens new product combinations. Begin with an available node, then assign a team in Projects.',workspace:'research',highlightUI:'research-tree',advance:action('startedResearch')},
  ]},
  {id:'compute',after:'research',slides:[
    {id:'compute-open',text:'Users are not free. Your credits cover API inference first. Watch this bill as products grow.',workspace:'compute',highlightUI:'compute-capacity',advance:next},
  ]},
  {id:'funding',after:'compute',slides:[
    {id:'funding-open',text:'Two launches make a story. Raising money buys time, but sells ownership and brings a board.',workspace:'funding',highlightUI:'funding-meetings',advance:next},
  ]},
];
export const onboardingById = Object.fromEntries(onboarding.map(step => [step.id,step]));
