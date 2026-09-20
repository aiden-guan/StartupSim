import { normalizeActiveLocation } from "../simulation/locationView";
import { BALANCE } from "../config/balance";
import { offices } from "../data/offices";
import { onboarding } from "../data/onboarding";
import { normalizeCompanyBrand, defaultSettings } from "../simulation/newGame";
import { normalizeLook } from "../simulation/look";
import { reconcileTutorial } from "../simulation/tutorial";
import { setPause } from "../simulation/pause";
import type { GameState } from "../simulation/types";
import { initSocialState, isMilestoneSatisfied, applySocialMilestone } from "../simulation/social";
import { SOCIAL_MILESTONES } from "../data/social";
import { Rng } from "../simulation/rng";
import { ENDINGS } from "../simulation/endings";

export function migrateGameState(raw: GameState): GameState {
  const state = structuredClone(raw);
  const legacyTutorial = state.onboarding?.version !== 2;
  state.meta.schemaVersion = BALANCE.SCHEMA_VERSION;
  state.meta.runId ??= `run_${Math.random().toString(36).slice(2, 10)}`;
  state.founder.look = normalizeLook(state.founder.look);
  state.employees = state.employees.map((employee) => ({
    ...employee,
    look: normalizeLook(employee.look),
  }));
  state.achievements ??= [];
  state.company.activeLocationId = normalizeActiveLocation(state.company);
  if (state.stats) state.stats.dilutionsCount ??= 0;
  state.company.brand = normalizeCompanyBrand((state.company.brand ?? {}) as Partial<GameState["company"]["brand"]>);
  const emptyBreakdown = () => ({ revenue: 0, inference: 0, productOperations: 0, payroll: 0, office: 0, fixedCompute: 0, companyOperations: 0 });
  state.company.currentMonthBreakdown = { ...emptyBreakdown(), ...(state.company.currentMonthBreakdown ?? {}) };
  state.company.lastMonthlyBreakdown = { ...emptyBreakdown(), ...(state.company.lastMonthlyBreakdown ?? {}) };
  const lastBreakdown = state.company.lastMonthlyBreakdown;
  const lastOperatingNet = lastBreakdown.revenue - lastBreakdown.inference - lastBreakdown.productOperations - lastBreakdown.payroll - lastBreakdown.office - lastBreakdown.fixedCompute - lastBreakdown.companyOperations;
  state.company.lastMonthlyCashChange ??= lastOperatingNet;
  state.company.cashAtLastStatement ??= state.company.cash - (state.company.lastMonthlyCashChange - lastOperatingNet);
  state.world.inferenceCostIndex ??= 1;
  state.world.talentCostIndex ??= 1;
  state.world.enterpriseDemandIndex ??= 1;
  state.world.consumerDemandIndex ??= 1;
  state.world.developerDemandIndex ??= 1;
  state.world.complianceCostIndex ??= 1;
  state.world.openSourcePressure ??= 0;
  state.providerOutages ??= [];
  for (const product of state.products) {
    product.gtmStrategy ??= product.vertical === "developer" ? "developer-first" : product.businessModel === "enterprise" ? "enterprise-sales" : "product-led";
    product.weeklyOperatingCost ??= 0;
    product.retentionRate ??= BALANCE.REVENUE_DECAY;
    product.gtmFit ??= 50;
    product.weeklyGrowthRate ??= 0;
    product.rampWeeks ??= 0;
  }
  state.onboarding = {
    ...state.onboarding,
    version: 2,
    events: state.onboarding?.events ?? [],
    primitiveA: state.onboarding?.primitiveA ?? null,
    primitiveB: state.onboarding?.primitiveB ?? null,
    firstProductId: state.onboarding?.firstProductId ?? state.products[0]?.id ?? null,
    nextLessonTick: state.onboarding?.nextLessonTick ?? 0,
    finished: state.onboarding?.finished ?? [],
    tutorialEnabled: state.onboarding?.tutorialEnabled ?? true,
    slideIndex: state.onboarding?.slideIndex ?? 0,
    revealDone: state.onboarding?.revealDone ?? Boolean(state.onboarding?.finished?.length),
  };
  const settings = defaultSettings();
  const incoming = (state.settings ?? {}) as Record<string, unknown>;
  state.settings = {
    ...settings,
    ...incoming,
    reducedMotion: Boolean(incoming.reducedMotion),
    mute: Boolean(incoming.mute),
    masterVolume: typeof incoming.masterVolume === "number" ? incoming.masterVolume : settings.masterVolume,
    musicVolume: typeof incoming.musicVolume === "number" ? incoming.musicVolume : settings.musicVolume,
    sfxVolume: typeof incoming.sfxVolume === "number" ? incoming.sfxVolume : settings.sfxVolume,
    ambientVolume: typeof incoming.ambientVolume === "number" ? incoming.ambientVolume : settings.ambientVolume,
    graphics: incoming.graphics === "low" || incoming.graphics === "medium" || incoming.graphics === "high" ? incoming.graphics : settings.graphics,
    npcDensity: typeof incoming.npcDensity === "number" ? incoming.npcDensity : settings.npcDensity,
    pauseOnEvents: typeof incoming.pauseOnEvents === "boolean" ? incoming.pauseOnEvents : settings.pauseOnEvents,
    autosave: typeof incoming.autosave === "boolean" ? incoming.autosave : settings.autosave,
    uiScale: typeof incoming.uiScale === "number" ? incoming.uiScale : settings.uiScale,
    autoDelegate: typeof incoming.autoDelegate === "boolean" ? incoming.autoDelegate : settings.autoDelegate,
  };
  if (state.company.officeLevel > offices.length - 1) {
    state.company.officeLevel = offices.length - 1;
  }
  if (state.pendingMentor && !onboarding.some((step) => step.id === state.pendingMentor)) {
    state.pendingMentor = null;
  }
  state.marketResult ??= null;
  state.firstLaunchTick ??= state.company.seenMarket ? state.clock.tick : null;
  state.clock.pauseReasons ??= state.clock.paused ? ["manual"] : [];
  // AI capability used to terminate otherwise healthy companies with an opaque
  // "Unknown" ending. Reopen only saves produced by that retired cutoff.
  if (state.endingId === "unknown" && state.endingNote === ENDINGS.unknown.line) {
    state.endingId = null;
    state.endingNote = null;
  }
  if (legacyTutorial && state.onboarding.tutorialEnabled) {
    state.onboarding.finished = state.company.seenMarket ? ["intro","assign","clock","designer","market"] : state.products[0]?.status === "ready" ? ["intro","assign","clock"] : state.products.length ? ["intro"] : [];
    state.pendingMentor = null;
    state.onboarding.slideIndex = 0;
  }
  // Migrate legacy hex battle to clean ready product
  if (state.marketBattle && !("nodes" in state.marketBattle)) {
    const legacyPid = (state.marketBattle as any).productId;
    const prod = state.products.find((p) => p.id === legacyPid);
    if (prod && prod.status !== "active") {
      prod.status = "ready";
    }
    state.marketBattle = null;
    if (state.inbox) {
      state.inbox.unshift({
        id: `market-migration-${Date.now()}`,
        at: { ...state.clock.date },
        from: "Advisor",
        subject: "Market Entry System Updated",
        body: "Market entry system updated. Your product is ready to relaunch.",
        read: false,
        requiresResponse: false,
      });
    }
  }

  if (state.marketBattle && "nodes" in state.marketBattle) {
    state.onboarding.finished = [...new Set([...state.onboarding.finished,"intro","assign","clock","designer"])];
    if (state.pendingMentor !== "market") state.pendingMentor = null;
  }
  if (state.pendingMentor) {
    const step = onboarding.find(s=>s.id===state.pendingMentor);
    state.onboarding.slideIndex = Math.max(0, Math.min(state.onboarding.slideIndex, (step?.slides.length ?? 1)-1));
  }
  if (state.pendingMentor === "clock" && state.onboarding.events.includes("startedClock")) state.onboarding.events = state.onboarding.events.filter(e=>e!=="startedClock");
  state.hiring.lastResult ??= null;
  state.lastStaffing ??= null;
  state.compute.trainingReserved ??= 0;
  for (const item of state.news) {
    item.read ??= true;
    item.source ??= "The Wire";
    item.category ??= item.tone === "markets" ? "markets" : "industry";
  }
  if (state.marketBattle && "nodes" in state.marketBattle) {
    state.marketBattle.playerMomentum ??= 0;
    state.marketBattle.rivalMomentum ??= 0;
    state.marketBattle.busy = false;
    state.marketBattle.turnNonce ??= 0;
    state.marketBattle.lastResolution ??= null;
    state.marketBattle.playerOps ??= 3;
    state.marketBattle.playerMaxOps ??= 3;
    state.marketBattle.bankedOps ??= 0;
    state.marketBattle.rivalOps ??= 2;
    state.marketBattle.playerDefensivePosture ??= false;
    state.marketBattle.actionLog ??= [];
    for (const node of state.marketBattle.nodes) {
      node.contestPenalty ??= 0;
      node.fortified ??= false;
    }
  }
  setPause(state,"market",Boolean(state.marketBattle));
  setPause(state,"results",Boolean(state.marketResult));
  setPause(state,"productReady",false);
  setPause(state,"settings",false);
  setPause(state,"ended",Boolean(state.endingId));

  if (!state.social) {
    const r = new Rng(state.meta.seed || 1);
    state.social = initSocialState(state, r);
    for (const milestone of SOCIAL_MILESTONES) {
      if (!state.social.triggeredMilestones.includes(milestone.id) && isMilestoneSatisfied(milestone.id, state)) {
        state.social.triggeredMilestones.push(milestone.id);
        const { newPosts, newDms } = applySocialMilestone(state, milestone, r);
        state.social.posts.push(...newPosts);
        state.social.dms.push(...newDms);
      }
    }
    state.social.posts = state.social.posts.slice(0, BALANCE.SOCIAL_POSTS_CAP);
    state.social.dms = state.social.dms.slice(0, BALANCE.SOCIAL_DMS_CAP);
  } else {
    state.social.posts ??= [];
    state.social.dms ??= [];
    state.social.triggeredMilestones ??= ["genesis"];
    state.social.lastAmbientTick ??= state.clock.tick;
  }

  reconcileTutorial(state);
  return state;
}
