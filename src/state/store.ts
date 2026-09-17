import { create } from "zustand";
import { applyCommand, type GameCommand } from "../simulation/commands";
import type { DrawerId, GameState, ScreenId } from "../simulation/types";
import { writeSave } from "./save";

interface UiState {
  screen: ScreenId;
  drawer: DrawerId | null;
  selectedEmployeeId: string | null;
  selectedObject: string | null;
  debugOpen: boolean;
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
}

export const useGame = create<AppState>((set, get) => ({
  game: null,
  screen: "title",
  drawer: null,
  selectedEmployeeId: null,
  selectedObject: null,
  debugOpen: false,
  dispatch: (cmd) => {
    const next = applyCommand(get().game, cmd);
    const patch: Partial<AppState> = { game: next };
    if (cmd.type === "newGame" && next) {
      patch.screen = "playing";
      patch.drawer = "tasks";
    }
    if (cmd.type === "enterMarket") patch.screen = "market";
    if ((cmd.type === "marketEndTurn" || cmd.type === "delegateMarket") && next && !next.marketBattle) {
      patch.screen = "playing";
    }
    if (next?.endingId) patch.screen = "ended";
    const prev = get().game;
    if (
      next &&
      cmd.type === "tickDay" &&
      next.products.some((p) => p.status === "ready") &&
      !prev?.products.some((p) => p.status === "ready")
    ) {
      patch.drawer = "products";
    }
    set(patch);
    if (next && (cmd.type === "tickDay" ? next.clock.date.day === 1 : true)) {
      void writeSave("autosave", next);
    }
  },
  setScreen: (screen) => set({ screen }),
  setDrawer: (drawer) => set({ drawer }),
  selectEmployee: (id) => set({ selectedEmployeeId: id, drawer: id ? "people" : get().drawer }),
  selectObject: (id) => set({ selectedObject: id }),
  toggleDebug: () => set({ debugOpen: !get().debugOpen }),
  loadGame: (state) =>
    set({
      game: state,
      screen: state.endingId ? "ended" : state.marketBattle ? "market" : "playing",
    }),
}));
