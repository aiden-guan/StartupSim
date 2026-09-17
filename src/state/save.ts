import { openDB } from "idb";
import type { GameState } from "../simulation/types";

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

export async function writeSave(id: string, state: GameState): Promise<void> {
  const database = await db();
  const meta: SaveMeta = {
    id,
    name: id,
    updatedAt: Date.now(),
    date: `${state.clock.date.year}-${state.clock.date.month}-${state.clock.date.day}`,
    company: state.company.name,
  };
  await database.put(STORE, { meta, state }, id);
}

export async function readSave(id: string): Promise<GameState | null> {
  const database = await db();
  const row = await database.get(STORE, id);
  return row?.state ?? null;
}

export function exportSave(state: GameState): string {
  return JSON.stringify({ v: 1, state }, null, 2);
}

export function importSave(raw: string): GameState {
  const parsed = JSON.parse(raw) as { state: GameState };
  return parsed.state;
}
