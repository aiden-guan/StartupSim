import { create } from "zustand";
import { applyCommand, type GameCommand } from "../simulation/commands";
import { DEFAULT_FOUNDER_LOOK } from "../simulation/look";
import { DEFAULT_BRAND } from "../simulation/newGame";
import type { CharacterLook, CompanyBrand, DrawerId, GameState, ScreenId } from "../simulation/types";
import { identity } from "../branding/identity";
import { cofounders } from "../data/cofounders";
import { offices } from "../data/offices";
import { currentTutorialSlide, slideWantsAction } from "../simulation/tutorial";
import { migrateGameState } from "./migrate";
import { writeSave } from "./save";
import { audio } from "../audio/Audio";

export interface CashFloater {
  id: string;
  text: string;
  tone: "cash" | "warn" | "ok";
}

export interface EventFrame {
  id: string;
  headline: string;
  body: string;
}

export interface Departure {
  id: string;
  look: CharacterLook;
  robot: boolean;
}

export type SetupStep = "founder" | "cofounder" | "company";

export interface SetupDraft {
  step: SetupStep;
  founderName: string;
  founderLook: CharacterLook;
  cofounderId: string;
  companyName: string;
  brand: CompanyBrand;
  skipTutorial: boolean;
}

interface UiState {
  screen: ScreenId;
  drawer: DrawerId | null;
  selectedEmployeeId: string | null;
  selectedObject: string | null;
  debugOpen: boolean;
  galleryOpen: boolean;
  settingsOpen: boolean;
  creditsOpen: boolean;
  revealPlaying: boolean;
  lastUiAction: string | null;
  setup: SetupDraft;
  floaters: CashFloater[];
  eventFrame: EventFrame | null;
  officeCaption: string | null;
  departures: Departure[];
}

interface AppState extends UiState {
  game: GameState | null;
  dispatch: (cmd: GameCommand) => void;
  setScreen: (screen: ScreenId) => void;
  setDrawer: (drawer: DrawerId | null) => void;
  selectEmployee: (id: string | null) => void;
  selectObject: (id: string | null) => void;
  toggleDebug: () => void;
  loadGame: (state: GameState) => void;
  reportTutorialAction: (action: string) => void;
  patchSetup: (patch: Partial<SetupDraft>) => void;
  resetSetup: () => void;
  setGalleryOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setCreditsOpen: (open: boolean) => void;
  setRevealPlaying: (playing: boolean) => void;
  dismissFloater: (id: string) => void;
  setEventFrame: (frame: EventFrame | null) => void;
  setOfficeCaption: (caption: string | null) => void;
  clearDeparture: (id: string) => void;
}

function blankSetup(): SetupDraft {
  return {
    step: "founder",
    founderName: "Aiden",
    founderLook: { ...DEFAULT_FOUNDER_LOOK },
    cofounderId: cofounders[0]!.id,
    companyName: identity.companyFallback,
    brand: { ...DEFAULT_BRAND },
    skipTutorial: false,
  };
}

export const useGame = create<AppState>((set, get) => ({
  game: null,
  screen: "title",
  drawer: null,
  selectedEmployeeId: null,
  selectedObject: null,
  debugOpen: false,
  galleryOpen: false,
  settingsOpen: false,
  creditsOpen: false,
  revealPlaying: false,
  lastUiAction: null,
  setup: blankSetup(),
  floaters: [],
  eventFrame: null,
  officeCaption: null,
  departures: [],
  dispatch: (cmd) => {
    const prev = get().game;
    const next = applyCommand(prev, cmd);
    const patch: Partial<AppState> = { game: next };
    if (cmd.type === "newGame" && next) {
      patch.screen = "playing";
      patch.drawer = null;
      patch.revealPlaying = next.onboarding.tutorialEnabled && !next.onboarding.revealDone;
      patch.selectedEmployeeId = null;
      patch.selectedObject = null;
      patch.floaters = [];
      patch.eventFrame = null;
      patch.officeCaption = null;
      patch.departures = [];
    }
    if (cmd.type === "enterMarket") patch.screen = "market";
    if ((cmd.type === "marketEndTurn" || cmd.type === "delegateMarket") && next && !next.marketBattle) {
      patch.screen = "playing";
    }
    if (next?.endingId) patch.screen = "ended";
    if (
      next &&
      cmd.type === "tickDay" &&
      next.products.some((p) => p.status === "ready") &&
      !prev?.products.some((p) => p.status === "ready") &&
      (!next.onboarding.tutorialEnabled || next.onboarding.finished.includes("designer"))
    ) {
      patch.drawer = "products";
    }
    if (next && prev && cmd.type !== "tickDay" && cmd.type !== "setPaused" && cmd.type !== "setSpeed") {
      const delta = next.company.cash - prev.company.cash;
      if (Math.abs(delta) >= 80) {
        const sign = delta >= 0 ? "+" : "-";
        patch.floaters = [
          ...get().floaters.slice(-5),
          {
            id: `${next.clock.tick}-${Math.abs(Math.round(delta))}`,
            text: `${sign}$${Math.abs(Math.round(delta)).toLocaleString()}`,
            tone: delta >= 0 ? "cash" : "warn",
          },
        ];
      }
    }
    if (next && prev && next.company.officeLevel !== prev.company.officeLevel) {
      const office = offices[next.company.officeLevel];
      if (office) patch.officeCaption = `${office.name.toUpperCase()} · CAPACITY ${office.capacity}`;
    }
    if (cmd.type === "fire" && prev) {
      const gone = prev.employees.find((e) => e.id === cmd.workerId);
      if (gone) {
        patch.departures = [...get().departures, { id: gone.id, look: gone.look, robot: gone.role === "robot" }];
      }
    }
    if (next && prev && next.news[0] && next.news[0].id !== prev.news[0]?.id) {
      patch.eventFrame = { id: next.news[0].id, headline: next.news[0].headline, body: next.news[0].body };
    }
    set(patch);
    if (next && prev && next.products.some((p) => p.status === "ready") && !prev.products.some((p) => p.status === "ready")) {
      audio.play("complete", next.settings);
    }
    if (next && cmd.type === "hire") audio.play("success", next.settings);
    if (next && (cmd.type === "upgradeOffice" || (cmd.type === "debug" && cmd.action === "office"))) audio.play("notify", next.settings);
    if (next && cmd.type === "fire") audio.play("warn", next.settings);
    if (next && cmd.type === "acceptOffer") audio.play("success", next.settings);
    if (next && prev && next.inbox.filter((m) => !m.read).length > prev.inbox.filter((m) => !m.read).length) {
      audio.play("notify", next.settings);
    }
    if (
      next &&
      prev &&
      next.settings.pauseOnEvents &&
      cmd.type !== "setPaused" &&
      !next.pendingMentor &&
      next.inbox.some((m) => m.requiresResponse && !prev.inbox.some((p) => p.id === m.id))
    ) {
      get().dispatch({ type: "setPaused", paused: true, reason: "Inbox" });
    }
    if (next && (cmd.type === "tickDay" ? next.clock.date.day === 1 : true) && next.settings.autosave) {
      void writeSave("autosave", next);
    }
  },
  setScreen: (screen) => set({ screen }),
  setDrawer: (drawer) => {
    set({ drawer });
    if (drawer === "tasks") get().reportTutorialAction("openTasks");
  },
  selectEmployee: (id) => set({ selectedEmployeeId: id, drawer: id ? "people" : get().drawer }),
  selectObject: (id) => set({ selectedObject: id }),
  toggleDebug: () => set({ debugOpen: !get().debugOpen }),
  loadGame: (state) => {
    const migrated = migrateGameState(state);
    set({
      game: migrated,
      screen: migrated.endingId ? "ended" : migrated.marketBattle ? "market" : "playing",
      drawer: null,
      revealPlaying: false,
    });
  },
  reportTutorialAction: (action) => {
    const game = get().game;
    if (!game) return;
    set({ lastUiAction: action });
    if (slideWantsAction(game, action)) {
      get().dispatch({ type: "advanceMentor" });
    }
    const slide = currentTutorialSlide(get().game ?? game);
    if (slide?.highlightUI === action) {
      /* no-op: consumed by spotlight */
    }
  },
  patchSetup: (patch) => set({ setup: { ...get().setup, ...patch } }),
  resetSetup: () => set({ setup: blankSetup() }),
  setGalleryOpen: (open) => set({ galleryOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setCreditsOpen: (open) => set({ creditsOpen: open }),
  setRevealPlaying: (playing) => set({ revealPlaying: playing }),
  dismissFloater: (id) => set({ floaters: get().floaters.filter((f) => f.id !== id) }),
  setEventFrame: (frame) => set({ eventFrame: frame }),
  setOfficeCaption: (caption) => set({ officeCaption: caption }),
  clearDeparture: (id) => set({ departures: get().departures.filter((d) => d.id !== id) }),
}));
