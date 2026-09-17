import { openDB } from "idb";
import type { GameState } from "../simulation/types";
import { migrateGameState } from "./migrate";

const DB = "founder-mode";
const STORE = "saves";

async function db() {
  return openDB(DB, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
    },
  });
}

export interface SaveMeta {
  id: string;
  name: string;
  updatedAt: number;
  date: string;
  company: string;
}

export async function listSaves(): Promise<SaveMeta[]> {
  const database = await db();
  const keys = await database.getAllKeys(STORE);
  const metas: SaveMeta[] = [];
  for (const key of keys) {
    const row = await database.get(STORE, key);
    if (row?.meta) metas.push(row.meta);
  }
  return metas.sort((a, b) => b.updatedAt - a.updatedAt);
}

export const MANUAL_SLOTS = ["slot-1", "slot-2", "slot-3"] as const;

export function saveLabel(id: string): string {
  if (id === "autosave") return "Autosave";
  if (id.startsWith("slot-")) return `Slot ${id.slice(5)}`;
  return id;
}

export async function writeSave(id: string, state: GameState): Promise<void> {
  const database = await db();
  const meta: SaveMeta = {
    id,
    name: saveLabel(id),
    updatedAt: Date.now(),
    date: `${state.clock.date.year}-${String(state.clock.date.month).padStart(2, "0")}-${String(state.clock.date.day).padStart(2, "0")}`,
    company: state.company.name,
  };
  await database.put(STORE, { meta, state }, id);
}

export async function readSave(id: string): Promise<GameState | null> {
  const database = await db();
  const row = await database.get(STORE, id);
  return row?.state ? migrateGameState(row.state) : null;
}

export async function deleteSave(id: string): Promise<void> {
  const database = await db();
  await database.delete(STORE, id);
}

export function exportSave(state: GameState): string {
  return JSON.stringify({ v: 1, state }, null, 2);
}

export function importSave(raw: string): GameState {
  const parsed = JSON.parse(raw) as { state?: GameState; company?: unknown; clock?: unknown };
  if (parsed?.state && typeof parsed.state === "object" && parsed.state.company && parsed.state.clock) {
    return migrateGameState(parsed.state);
  }
  if (parsed && typeof parsed === "object" && parsed.company && parsed.clock) {
    return migrateGameState(parsed as GameState);
  }
  throw new Error("Not a Founder Mode save file");
}

export function downloadSaveFile(state: GameState): void {
  const blob = new Blob([exportSave(state)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${state.company.name.replace(/\s+/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}
