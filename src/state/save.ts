import { openDB } from "idb";
import type { GameState } from "../simulation/types";
import { migrateGameState } from "./migrate";

const DB = "compounding";
const LEGACY_DB = "founder-mode";
const STORE = "saves";
export const AUTOSAVE_ID = "autosave";

let pendingAutosave: GameState | null = null;
let autosaveWrite: Promise<void> | null = null;

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
  let keys = await database.getAllKeys(STORE);
  if (keys.length === 0 && typeof indexedDB !== "undefined") {
    try {
      const oldDb = await openDB(LEGACY_DB, 1);
      if (oldDb.objectStoreNames.contains(STORE)) {
        const oldKeys = await oldDb.getAllKeys(STORE);
        for (const key of oldKeys) {
          const row = await oldDb.get(STORE, key);
          if (row) await database.put(STORE, row, key);
        }
      }
      oldDb.close();
      keys = await database.getAllKeys(STORE);
    } catch {
      // Legacy DB migration is best effort
    }
  }
  const metas: SaveMeta[] = [];
  for (const key of keys) {
    const row = await database.get(STORE, key);
    if (row?.meta) metas.push(row.meta);
  }
  const sorted = metas.sort((a, b) => b.updatedAt - a.updatedAt);
  if (!sorted.some((meta) => meta.id === AUTOSAVE_ID) && sorted[0]) {
    // Older releases exposed manual slots. Promote the newest one into the
    // single autosave so simplifying the UI does not strand an existing run.
    const latest = sorted[0];
    const row = await database.get(STORE, latest.id);
    if (row?.state) {
      const autosaveMeta: SaveMeta = { ...latest, id: AUTOSAVE_ID, name: "Autosave" };
      await database.put(STORE, { meta: autosaveMeta, state: row.state }, AUTOSAVE_ID);
      sorted.unshift(autosaveMeta);
    }
  }
  return sorted;
}

async function persistSave(id: string, state: GameState): Promise<void> {
  const database = await db();
  const meta: SaveMeta = {
    id,
    name: id === AUTOSAVE_ID ? "Autosave" : id,
    updatedAt: Date.now(),
    date: `${state.clock.date.year}-${String(state.clock.date.month).padStart(2, "0")}-${String(state.clock.date.day).padStart(2, "0")}`,
    company: state.company.name,
  };
  await database.put(STORE, { meta, state }, id);
}

async function flushAutosave(): Promise<void> {
  while (pendingAutosave) {
    const state = pendingAutosave;
    pendingAutosave = null;
    await persistSave(AUTOSAVE_ID, state);
  }
}

export function writeSave(id: string, state: GameState): Promise<void> {
  if (id !== AUTOSAVE_ID) return persistSave(id, state);

  // Keep autosaves ordered and collapse a burst of simulation ticks down to
  // the newest state. This prevents an older async IndexedDB write from
  // replacing a newer company state.
  pendingAutosave = state;
  if (!autosaveWrite) {
    autosaveWrite = flushAutosave().finally(() => {
      autosaveWrite = null;
    });
  }
  return autosaveWrite;
}

export async function readSave(id: string): Promise<GameState | null> {
  const database = await db();
  let row = await database.get(STORE, id);
  if (!row && typeof indexedDB !== "undefined") {
    try {
      const oldDb = await openDB(LEGACY_DB, 1);
      if (oldDb.objectStoreNames.contains(STORE)) {
        row = await oldDb.get(STORE, id);
        if (row) await database.put(STORE, row, id);
      }
      oldDb.close();
    } catch {
      // Legacy DB fallback is best effort
    }
  }
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
  throw new Error("Not a Compounding save file");
}
