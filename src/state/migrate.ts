import { BALANCE } from "../config/balance";
import { offices } from "../data/offices";
import { onboarding } from "../data/onboarding";
import { DEFAULT_BRAND, defaultSettings } from "../simulation/newGame";
import { normalizeLook } from "../simulation/look";
import { reconcileTutorial } from "../simulation/tutorial";
import { setPause } from "../simulation/pause";
import type { GameState } from "../simulation/types";

export function migrateGameState(raw: GameState): GameState {
  const state = structuredClone(raw);
  const legacyTutorial = state.onboarding?.version !== 2;
  state.meta.schemaVersion = BALANCE.SCHEMA_VERSION;
  state.founder.look = normalizeLook(state.founder.look);
  state.employees = state.employees.map((employee) => ({
    ...employee,
    look: normalizeLook(employee.look),
  }));
  if (!state.company.brand) state.company.brand = { ...DEFAULT_BRAND };
  if (!state.company.brand.color) state.company.brand.color = DEFAULT_BRAND.color;
  if (!state.company.brand.mark) state.company.brand.mark = DEFAULT_BRAND.mark;
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
  setPause(state,"market",Boolean(state.marketBattle));
  setPause(state,"results",Boolean(state.marketResult));
  setPause(state,"productReady",!state.marketBattle && state.products.some(p=>p.status==="ready"));
  setPause(state,"settings",false);
  reconcileTutorial(state);
  return state;
}
