import { BALANCE } from "../config/balance";
import { offices } from "../data/offices";
import { onboarding } from "../data/onboarding";
import { DEFAULT_BRAND, defaultSettings } from "../simulation/newGame";
import { normalizeLook } from "../simulation/look";
import type { GameState } from "../simulation/types";

export function migrateGameState(raw: GameState): GameState {
  const state = raw;
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
  return state;
}
