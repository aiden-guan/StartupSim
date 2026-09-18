import { create } from "zustand";
import { applyCommand, type GameCommand } from "../simulation/commands";
import { DEFAULT_FOUNDER_LOOK } from "../simulation/look";
import { DEFAULT_BRAND } from "../simulation/newGame";
import type { CharacterLook, CompanyBrand, DrawerId, GameState, ScreenId } from "../simulation/types";
import { identity } from "../branding/identity";
import { cofounders } from "../data/cofounders";
import { offices } from "../data/offices";
import { currentTutorialSlide } from "../simulation/tutorial";
import type { TutorialAction } from "../data/onboarding";
import { migrateGameState } from "./migrate";
import { writeSave } from "./save";
import { audio } from "../audio/Audio";
import { isLifeOrDeathEvent } from "../simulation/pause";

export interface EventFrame {
  id: string;
  headline: string;
  body: string;
  surface: "news" | "gameplay" | "social";
  impact?: string;
  mailId?: string;
  requiresResponse?: boolean;
  sender?: string;
  senderOrg?: string;
  critical?: boolean;
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
  reportTutorialAction: (action: TutorialAction) => void;
  patchSetup: (patch: Partial<SetupDraft>) => void;
  resetSetup: () => void;
  setGalleryOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setCreditsOpen: (open: boolean) => void;
  setRevealPlaying: (playing: boolean) => void;
  setEventFrame: (frame: EventFrame | null) => void;
  setOfficeCaption: (caption: string | null) => void;
  clearDeparture: (id: string) => void;
}

function blankSetup(): SetupDraft {
  return {
    step: "founder",
    founderName: "",
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
      patch.eventFrame = null;
      patch.officeCaption = null;
      patch.departures = [];
    }
    if (next?.marketBattle || next?.marketResult) patch.screen = "market";
    if (cmd.type === "continueMarketResults" && next && !next.marketResult) { patch.screen = "playing"; patch.drawer = "products"; }
    if (get().screen === "market" && next && !next.marketBattle && !next.marketResult) {
      patch.screen = "playing";
    }
    if (next?.endingId) patch.screen = "ended";
    if (
      next &&
      cmd.type === "tickDay" &&
      next.products.some((p) => p.status === "ready") &&
      !prev?.products.some((p) => p.status === "ready") &&
      true
    ) {
      patch.drawer = "products";
    }
    if (next && prev && next.company.officeLevel !== prev.company.officeLevel) {
      const office = offices[next.company.officeLevel];
      if (office) patch.officeCaption = `${office.name.toUpperCase()} · CAPACITY ${office.capacity}`;
    }
    if (next && prev && next.company.seenMarket && !next.pendingMentor) {
      const gameplayMail = next.inbox.find((mail) => mail.eventKind && !prev.inbox.some((previousMail) => previousMail.id === mail.id));
      if (gameplayMail?.requiresResponse) {
        const isCritical = isLifeOrDeathEvent(gameplayMail, next);
        patch.eventFrame = {
          id: gameplayMail.id,
          headline: gameplayMail.subject,
          body: gameplayMail.body,
          surface: "gameplay",
          impact: gameplayMail.impact,
          mailId: gameplayMail.id,
          requiresResponse: gameplayMail.requiresResponse,
          sender: gameplayMail.sender?.name ?? gameplayMail.from,
          senderOrg: gameplayMail.sender?.organization,
          critical: isCritical,
        };
      }
    }
    if (cmd.type === "mailChoice" && get().eventFrame?.mailId === cmd.mailId) {
      patch.eventFrame = null;
    }
    if (next && prev && next.social && prev.social && !patch.eventFrame) {
      const newDms = next.social.dms.filter((dm) => !prev.social.dms.some((pdm) => pdm.id === dm.id));
      if (newDms.length > 0) {
        const firstDm = newDms[0]!;
        patch.eventFrame = {
          id: firstDm.id,
          headline: `DM from @${firstDm.actorId}`,
          body: firstDm.text,
          surface: "social",
          requiresResponse: false,
        };
      }
    }
    if (next && prev) {
      if (next.products.length > prev.products.length) patch.drawer = 'tasks';
      if (cmd.type === 'startResearch' && next.tasks.length > prev.tasks.length) patch.drawer = 'tasks';
      const ready = next.products.find(p=>p.status==='ready' && prev.products.find(x=>x.id===p.id)?.status==='development');
      if (ready) patch.drawer = 'products';
      const gone = prev.employees.filter(e=>!next.employees.some(n=>n.id===e.id));
      if (gone.length) {
        patch.departures = [...get().departures, ...gone.map(e=>({id:e.id,look:e.look,robot:e.role==='robot'}))];
      }
    }
    set(patch);
    if (next && prev && next.products.some((p) => p.status === "ready") && !prev.products.some((p) => p.status === "ready")) {
      audio.play("complete", next.settings);
    }
    if (next && prev && next.stats.researchCompleted > prev.stats.researchCompleted) audio.play("success", next.settings);
    if (next && prev && next.employees.some(e=>e.burnoutDays > 0 && !prev.employees.find(p=>p.id===e.id)?.burnoutDays)) audio.play("warn", next.settings);
    if (next && (cmd.type === "assign" || cmd.type === "unassign" || cmd.type === "startProduct")) audio.play("click", next.settings);
    if (next && prev && cmd.type === "hire") audio.play(next.employees.length > prev.employees.length ? "success" : "warn", next.settings);
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
      !next.marketBattle &&
      !next.marketResult &&
      next.inbox.some((m) => m.requiresResponse && isLifeOrDeathEvent(m, next) && !prev.inbox.some((p) => p.id === m.id))
    ) {
      get().dispatch({ type: "setPaused", paused: true, reason: "Inbox" });
    }
    if (next && (cmd.type === "tickDay" ? next.clock.date.day === 1 : true) && next.settings.autosave) {
      void writeSave("autosave", get().game ?? next);
    }
  },
  setScreen: (screen) => set({ screen }),
  setDrawer: (drawer) => {
    set({ drawer });
    const events: Partial<Record<DrawerId, TutorialAction>> = {tasks:'openedProductLab',products:'openedProductDesigner',hiring:'openedHiring',research:'openedResearch',compute:'openedCompute',funding:'openedFunding'};
    if (drawer && events[drawer]) get().reportTutorialAction(events[drawer]!);
  },
  selectEmployee: (id) => set({ selectedEmployeeId: id }),
  selectObject: (id) => set({ selectedObject: id }),
  toggleDebug: () => set({ debugOpen: !get().debugOpen }),
  loadGame: (state) => {
    const migrated = migrateGameState(state);
    set({
      game: migrated,
      screen: migrated.endingId ? "ended" : (migrated.marketBattle || migrated.marketResult) ? "market" : "playing",
      drawer: currentTutorialSlide(migrated)?.workspace ?? (migrated.products.some(p=>p.status==="ready") ? "products" : null),
      selectedEmployeeId: null, departures: [], eventFrame: null, officeCaption: null,
      revealPlaying: false,
    });
  },
  reportTutorialAction: (action) => {
    const game = get().game;
    if (!game) return;
    set({ lastUiAction: action });
    get().dispatch({ type: "tutorialEvent", action });
  },
  patchSetup: (patch) => set({ setup: { ...get().setup, ...patch } }),
  resetSetup: () => set({ setup: blankSetup() }),
  setGalleryOpen: (open) => set({ galleryOpen: open }),
  setSettingsOpen: (open) => {set({ settingsOpen: open });get().dispatch({type:"pauseLock",reason:"settings",enabled:open});},
  setCreditsOpen: (open) => set({ creditsOpen: open }),
  setRevealPlaying: (playing) => set({ revealPlaying: playing }),
  setEventFrame: (frame) => set({ eventFrame: frame }),
  setOfficeCaption: (caption) => set({ officeCaption: caption }),
  clearDeparture: (id) => set({ departures: get().departures.filter((d) => d.id !== id) }),
}));
