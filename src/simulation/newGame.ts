import { BALANCE } from "../config/balance";
import { cofounders } from "../data/cofounders";
import { competitors as competitorDefs } from "../data/competitors";
import type {
  CompanyState,
  DepartmentId,
  Employee,
  GameState,
  Unlocks,
} from "./types";
import { founderLook } from "./look";
import { Rng, uid } from "./rng";

const depts: DepartmentId[] = [
  "engineering",
  "support",
  "sales",
  "marketing",
  "finance",
  "recruiting",
  "legal",
  "research",
  "management",
];

function emptyUnlocks(): Unlocks {
  return {
    hiring: false,
    research: false,
    promo: false,
    funding: false,
    compute: false,
    world: false,
    perks: false,
    locations: false,
    verticals: false,
    acquisitions: false,
    lobbying: false,
    automation: false,
    models: false,
  };
}

export interface NewGameInput {
  founderName: string;
  companyName: string;
  cofounderId: string;
  seed?: number;
}

export function createNewGame(input: NewGameInput): GameState {
  const seed = input.seed ?? (Math.floor(Math.random() * 1_000_000_000) || 1);
  const rng = new Rng(seed);
  const cofounderDef = cofounders.find((c) => c.id === input.cofounderId) ?? cofounders[0]!;
  const founder: Employee = {
    id: uid(rng, "fnd"),
    name: input.founderName.trim() || "Founder",
    title: "Founder",
    role: "founder",
    look: founderLook(rng),
    skills: { research: 4, engineering: 5, product: 5, growth: 4, productivity: 7 },
    happiness: 10,
    burnoutDays: 0,
    burnoutRisk: 0,
    loyalty: 10,
    ambition: 8,
    ethics: 6,
    salary: BALANCE.FOUNDER_SALARY,
    equity: 0.55,
    traits: ["operator"],
    taskId: null,
    remote: false,
    tenureDays: 0,
    offMarketDays: 0,
    department: "management",
  };
  const cofounder: Employee = {
    id: uid(rng, "cof"),
    name: cofounderDef.name,
    title: cofounderDef.title,
    role: "cofounder",
    look: cofounderDef.look,
    skills: { ...cofounderDef.skills },
    happiness: 10,
    burnoutDays: 0,
    burnoutRisk: 0,
    loyalty: 9,
    ambition: 8,
    ethics: 6,
    salary: BALANCE.COFOUNDER_SALARY,
    equity: cofounderDef.equity,
    traits: [cofounderDef.trait, "tireless"],
    taskId: null,
    remote: false,
    tenureDays: 0,
    offMarketDays: 0,
    department: cofounderDef.trait === "paper-machine" ? "research" : cofounderDef.trait === "posts" ? "marketing" : "engineering",
  };
  founder.equity = 1 - cofounder.equity - 0.1;

  const company: CompanyState = {
    name: input.companyName.trim() || "Northstar Labs",
    cash: BALANCE.STARTING_CASH,
    officeLevel: 0,
    hype: 4,
    backlash: 0,
    prestige: 1,
    trust: 62,
    valuation: 1_000_000,
    ownership: {
      founder: founder.equity,
      cofounder: cofounder.equity,
      employees: 0.1,
      investors: 0,
    },
    primitives: ["chat", "writing", "search", "image"],
    technologies: [],
    expertise: {},
    perks: [],
    locations: [],
    verticals: ["consumer"],
    acquisitions: [],
    specialProjects: [],
    lobbies: [],
    discoveredRecipes: [],
    versions: {},
    culture: { intensity: 40, bureaucracy: 8, mission: 50, prestige: 10, trust: 62 },
    automation: Object.fromEntries(depts.map((d) => [d, 0])) as CompanyState["automation"],
    lifetimeRevenue: 0,
    lifetimeCosts: 0,
    monthlyRevenue: 0,
    monthlyCosts: 0,
    lastMonthlyRevenue: 0,
    lastMonthlyCosts: 0,
    productsLaunched: 0,
    seenMarket: false,
    ceoAutomated: false,
  };

  const state: GameState = {
    meta: { schemaVersion: BALANCE.SCHEMA_VERSION, seed, rngState: rng.seed, difficulty: "baseline" },
    clock: {
      date: { year: BALANCE.START_YEAR, month: BALANCE.START_MONTH, day: BALANCE.START_DAY },
      speed: 1,
      paused: true,
      tick: 0,
      reasonPaused: "Mentor",
    },
    founder,
    cofounderId: cofounder.id,
    company,
    employees: [founder, cofounder],
    products: [],
    tasks: [],
    compute: {
      apiCredits: BALANCE.STARTING_API_CREDITS,
      rentedGpus: 0,
      reservedCapacity: 0,
      ownedCluster: 0,
      dataCenters: 0,
      customChips: 0,
      energyContracts: 0,
      monthlyCloudBill: 400,
      trainingReserved: 0,
    },
    currentModelId: "claudius-instant",
    ownedModels: ["claudius-instant", "openbrain-o3", "metamind-34b"],
    world: {
      aiCapability: 12,
      aiAdoption: 8,
      automation: 3,
      publicTrust: 64,
      regulation: 6,
      computeDemand: 10,
      energyDemand: 8,
      scientificProgress: 10,
      economicDisruption: 4,
      systemicRisk: 2,
    },
    competitors: competitorDefs.map((c) => ({
      id: c.id,
      name: c.name,
      archetype: c.archetype,
      cash: 20_000_000 * (c.difficulty + 1),
      hype: 10 + c.difficulty * 8,
      capability: 8 + c.difficulty * 6,
      marketShare: c.startingShare,
      funding: 50_000_000 * (c.difficulty + 1),
      employees: 40 * (c.difficulty + 1),
      techs: [],
      products: c.focus,
      personality: c.personality,
      disabled: false,
    })),
    economy: "boom",
    nextEconomy: "boom",
    board: null,
    inbox: [
      {
        id: uid(rng, "mail"),
        at: { year: 2022, month: 11, day: 30 },
        from: "nia@operator.local",
        subject: "You have a company now",
        body: "Lease is month-to-month. Cloud credits expire in spirit, not in fact. Build something that talks.",
        read: false,
        requiresResponse: false,
      },
    ],
    news: [],
    unlocks: emptyUnlocks(),
    onboarding: { finished: [], tutorialEnabled: true },
    stats: {
      productsLaunched: 0,
      employeesHired: 0,
      employeesFired: 0,
      aiWorkersDeployed: 0,
      researchCompleted: 0,
      acquisitions: 0,
      scandals: 0,
      computeConsumed: 0,
      peakValuation: 1_000_000,
      peakEmployees: 2,
    },
    history: [],
    hiring: { channelId: null, candidates: [], cooldownDays: 0 },
    funding: { lastRound: null, offers: [], cooldownDays: 0, raisedTotal: 0 },
    marketBattle: null,
    pendingMentor: "intro",
    endingId: null,
    endingNote: null,
    settings: { reducedMotion: false, mute: true },
  };

  state.meta.rngState = rng.seed;
  return state;
}
