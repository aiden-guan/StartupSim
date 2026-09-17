export type SkillName =
  | "research"
  | "engineering"
  | "product"
  | "growth"
  | "productivity";

export const SKILLS: SkillName[] = [
  "research",
  "engineering",
  "product",
  "growth",
  "productivity",
];

export type LaunchStat = "deployment" | "capability" | "distribution";

export type ProductStatus =
  | "development"
  | "ready"
  | "active"
  | "mature"
  | "declining"
  | "deprecated"
  | "sold";

export type TaskType =
  | "product"
  | "promo"
  | "research"
  | "lobby"
  | "special"
  | "crisis"
  | "training"
  | "hiring";

export type BusinessModel =
  | "free"
  | "freemium"
  | "subscription"
  | "usage"
  | "enterprise"
  | "api"
  | "ads";

export type EconomyState =
  | "boom"
  | "normal"
  | "slowdown"
  | "recession"
  | "aiBubble"
  | "creditCrunch";

export type ScreenId =
  | "title"
  | "setup"
  | "playing"
  | "market"
  | "ended";

export type DrawerId =
  | "products"
  | "tasks"
  | "research"
  | "people"
  | "finance"
  | "compute"
  | "world"
  | "inbox"
  | "hiring"
  | "perks"
  | "funding"
  | "company";

export type DepartmentId =
  | "engineering"
  | "support"
  | "sales"
  | "marketing"
  | "finance"
  | "recruiting"
  | "legal"
  | "research"
  | "management";

export type HairStyle =
  | "buzz"
  | "fade"
  | "short"
  | "messy"
  | "side-part"
  | "curly"
  | "long"
  | "bun"
  | "ponytail"
  | "swept"
  | "bald"
  | "textured"
  | "shaved";

export type BodyType = "slim" | "average" | "broad";
export type HeightId = "short" | "avg" | "tall";
export type TopId = "tee" | "hoodie" | "sweater" | "overshirt" | "blazer" | "vest" | "jacket" | "labcoat" | "techjacket";
export type PantsId = "jeans" | "chinos" | "joggers" | "trousers";
export type ShoesId = "sneakers" | "dress" | "boots" | "runners";
export type GlassesId = "none" | "round" | "rect";
export type AccessoryId = "none" | "badge" | "headphones" | "scarf" | "watch" | "coffee" | "phone" | "notebook" | "backpack";
export type FaceId = "default" | "round" | "angular";
export type ExpressionId = "neutral" | "happy" | "stressed" | "angry" | "tired" | "confident" | "surprised";
export type BrandMark = "wordmark" | "circle" | "bars" | "spark";
export type GraphicsQuality = "low" | "medium" | "high";

export interface CharacterLook {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  pants: string;
  shoes: string;
  glasses: boolean;
  accessory: AccessoryId;
  body: BodyType;
  archetype: string;
  topId: TopId;
  pantsId: PantsId;
  shoesId: ShoesId;
  glassesId: GlassesId;
  height: HeightId;
  faceId: FaceId;
}

export interface CompanyBrand {
  color: string;
  mark: BrandMark;
}

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export interface Skills {
  research: number;
  engineering: number;
  product: number;
  growth: number;
  productivity: number;
}

export interface Employee {
  id: string;
  name: string;
  title: string;
  role: "founder" | "cofounder" | "employee" | "robot" | "ai";
  look: CharacterLook;
  skills: Skills;
  happiness: number;
  burnoutDays: number;
  burnoutRisk: number;
  loyalty: number;
  ambition: number;
  ethics: number;
  salary: number;
  equity: number;
  traits: string[];
  taskId: string | null;
  remote: boolean;
  tenureDays: number;
  offMarketDays: number;
  department: DepartmentId;
}

export interface ProductPoints {
  engineering: number;
  product: number;
  growth: number;
  research: number;
}

export interface LaunchLevels {
  deployment: number;
  capability: number;
  distribution: number;
}

export interface Product {
  id: string;
  name: string;
  combo: [string, string];
  recipeId: string;
  description: string;
  status: ProductStatus;
  difficulty: number;
  revenueScore: number;
  points: ProductPoints;
  levels: LaunchLevels;
  version: number;
  newDiscovery: boolean;
  vertical: string;
  riskTags: string[];
  businessModel: BusinessModel;
  modelId: string;
  marketShare: number;
  weeklyRevenue: number;
  weeklyInference: number;
  users: number;
  reliability: number;
  ageWeeks: number;
  earnedRevenue: number;
  technicalDebt: number;
  competitorId: string | null;
}

export interface Task {
  id: string;
  type: TaskType;
  name: string;
  progress: number;
  requiredProgress: number;
  productId?: string;
  techId?: string;
  promoId?: string;
  projectId?: string;
  lobbyId?: string;
  eventId?: string;
  skillTarget?: SkillName;
  skillNeed?: number;
  skillVal?: number;
  dueWeeks?: number;
  successEffects?: Effect[];
  failureEffects?: Effect[];
  successBody?: string;
  failureBody?: string;
  repeat: boolean;
}

export interface Effect {
  type: string;
  value: number | string | Record<string, unknown>;
}

export interface Condition {
  type: string;
  op: "eq" | "gt" | "ge" | "lt" | "le" | "has" | "notHas";
  val: number | string | boolean;
}

export interface Mail {
  id: string;
  at: CalendarDate;
  from: string;
  subject: string;
  body: string;
  choices?: { id: string; label: string; effects: Effect[] }[];
  read: boolean;
  requiresResponse: boolean;
}

export interface NewsItem {
  id: string;
  at: CalendarDate;
  headline: string;
  body: string;
  tone: "hype" | "neutral" | "panic" | "markets";
}

export interface Candidate {
  employee: Employee;
  minSalary: number;
  personality: string;
}

export interface FundingOffer {
  id: string;
  round: string;
  investor: string;
  archetype: string;
  cash: number;
  valuation: number;
  dilution: number;
  boardPressure: number;
  notes: string;
}

export interface PerkState {
  id: string;
  level: number;
}

export interface ComputeState {
  apiCredits: number;
  rentedGpus: number;
  reservedCapacity: number;
  ownedCluster: number;
  dataCenters: number;
  customChips: number;
  energyContracts: number;
  monthlyCloudBill: number;
  trainingReserved: number;
}

export interface WorldState {
  aiCapability: number;
  aiAdoption: number;
  automation: number;
  publicTrust: number;
  regulation: number;
  computeDemand: number;
  energyDemand: number;
  scientificProgress: number;
  economicDisruption: number;
  systemicRisk: number;
}

export interface CompetitorState {
  id: string;
  name: string;
  archetype: string;
  cash: number;
  hype: number;
  capability: number;
  marketShare: number;
  funding: number;
  employees: number;
  techs: string[];
  products: string[];
  personality: "aggressive" | "expansionist" | "defensive" | "opportunistic";
  disabled: boolean;
}

export interface BoardState {
  approval: number;
  arrTarget: number;
  members: string[];
  lastReviewMonth: number;
  graceMonths: number;
  pressure: "growth" | "profit" | "safety" | "research";
}

export interface Ownership {
  founder: number;
  cofounder: number;
  employees: number;
  investors: number;
}

export interface HistoryPoint {
  year: number;
  month: number;
  cash: number;
  revenue: number;
  burn: number;
  hype: number;
  trust: number;
  employees: number;
  valuation: number;
}

export interface Unlocks {
  hiring: boolean;
  research: boolean;
  promo: boolean;
  funding: boolean;
  compute: boolean;
  world: boolean;
  perks: boolean;
  locations: boolean;
  verticals: boolean;
  acquisitions: boolean;
  lobbying: boolean;
  automation: boolean;
  models: boolean;
}

export interface OnboardingState {
  finished: string[];
  tutorialEnabled: boolean;
  slideIndex: number;
  revealDone: boolean;
}

export interface Stats {
  productsLaunched: number;
  employeesHired: number;
  employeesFired: number;
  aiWorkersDeployed: number;
  researchCompleted: number;
  acquisitions: number;
  scandals: number;
  computeConsumed: number;
  peakValuation: number;
  peakEmployees: number;
}

export interface HexPos {
  row: number;
  col: number;
}

export interface MarketTile {
  id: string;
  pos: HexPos;
  kind: "empty" | "customer" | "enterprise" | "influencer" | "data" | "cloud" | "partner" | "regulated" | "government";
  income: number;
  owner: "player" | "ai" | null;
  captured: number;
  baseCost: number;
}

export interface MarketPiece {
  id: string;
  owner: "player" | "ai";
  pos: HexPos;
  health: number;
  maxHealth: number;
  moves: number;
  movement: number;
  done: boolean;
}

export interface MarketBattle {
  productId: string;
  competitorId: string;
  turnsLeft: number;
  totalTurns: number;
  tiles: MarketTile[];
  pieces: MarketPiece[];
  current: "player" | "ai";
  selectedPieceId: string | null;
  tutorialStep: number;
  firstMarket: boolean;
}

export interface ClockState {
  date: CalendarDate;
  speed: 0 | 1 | 2 | 4 | 8;
  paused: boolean;
  tick: number;
  reasonPaused: string | null;
}

export interface CompanyState {
  name: string;
  brand: CompanyBrand;
  cash: number;
  officeLevel: number;
  hype: number;
  backlash: number;
  prestige: number;
  trust: number;
  valuation: number;
  ownership: Ownership;
  primitives: string[];
  technologies: string[];
  expertise: Record<string, number>;
  perks: PerkState[];
  locations: string[];
  verticals: string[];
  acquisitions: string[];
  specialProjects: string[];
  lobbies: string[];
  discoveredRecipes: string[];
  versions: Record<string, number>;
  culture: {
    intensity: number;
    bureaucracy: number;
    mission: number;
    prestige: number;
    trust: number;
  };
  automation: Record<DepartmentId, number>;
  lifetimeRevenue: number;
  lifetimeCosts: number;
  monthlyRevenue: number;
  monthlyCosts: number;
  lastMonthlyRevenue: number;
  lastMonthlyCosts: number;
  productsLaunched: number;
  seenMarket: boolean;
  ceoAutomated: boolean;
}

export interface GameState {
  meta: {
    schemaVersion: number;
    seed: number;
    rngState: number;
    difficulty: "baseline";
  };
  clock: ClockState;
  founder: Employee;
  cofounderId: string;
  company: CompanyState;
  employees: Employee[];
  products: Product[];
  tasks: Task[];
  compute: ComputeState;
  currentModelId: string;
  ownedModels: string[];
  world: WorldState;
  competitors: CompetitorState[];
  economy: EconomyState;
  nextEconomy: EconomyState;
  board: BoardState | null;
  inbox: Mail[];
  news: NewsItem[];
  unlocks: Unlocks;
  onboarding: OnboardingState;
  stats: Stats;
  history: HistoryPoint[];
  hiring: {
    channelId: string | null;
    candidates: Candidate[];
    cooldownDays: number;
  };
  funding: {
    lastRound: string | null;
    offers: FundingOffer[];
    cooldownDays: number;
    raisedTotal: number;
  };
  marketBattle: MarketBattle | null;
  pendingMentor: string | null;
  endingId: string | null;
  endingNote: string | null;
  settings: {
    reducedMotion: boolean;
    mute: boolean;
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    ambientVolume: number;
    graphics: GraphicsQuality;
    npcDensity: number;
    pauseOnEvents: boolean;
    autosave: boolean;
    uiScale: number;
  };
}
