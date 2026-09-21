import { useEffect, useState } from "react";
import type { GameState } from "../simulation/types";
import { AUTOSAVE_ID, listSaves, readSave, writeSave, type SaveMeta } from "../state/save";

export function SavePanel({
  game,
  onLoad,
  variant,
}: {
  game: GameState | null;
  onLoad: (state: GameState) => void;
  variant: "title" | "company";
}) {
  const [saves, setSaves] = useState<SaveMeta[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    try {
      setSaves(await listSaves());
    } catch {
      setMessage("Local saves are unavailable in this browser.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function loadAutosave() {
    try {
      const next = await readSave(AUTOSAVE_ID);
      if (!next) {
        setMessage("There is no saved company on this device yet.");
        return;
      }
      onLoad(next);
    } catch {
      setMessage("That company could not be loaded.");
    }
  }

  async function saveNow() {
    if (!game) return;
    setMessage("Saving…");
    try {
      await writeSave(AUTOSAVE_ID, game);
      await refresh();
      setMessage("Saved just now on this device.");
    } catch {
      setMessage("Could not save this company in the browser.");
    }
  }

  const autosave = saves.find((save) => save.id === AUTOSAVE_ID);

  return (
    <div className={variant === "title" ? "flex max-w-md flex-col gap-3" : "space-y-3"}>
      <p className="text-xs leading-relaxed text-[#9aa3b2]">
        Your company saves automatically in this browser after each decision and each day of simulation.
      </p>
      {variant === "title" && autosave ? (
        <button
          type="button"
          onClick={() => void loadAutosave()}
          className="w-72 border border-white/20 bg-white/5 px-5 py-3 text-left text-sm text-[#efe8dc] hover:bg-white/10 hover:border-white/35 transition-colors rounded-lg"
        >
          <span className="block font-medium text-[#fcf9f1]">
            Continue {autosave.company}
          </span>
          <span className="block font-mono text-[11px] text-[#9aa3b2] mt-0.5">
            Autosave · {autosave.date}
          </span>
        </button>
      ) : null}
      {game ? (
        <div className="flex items-center justify-between gap-3 border border-white/10 bg-white/5 px-3 py-2 rounded">
          <span className="font-mono text-[11px] text-[#9aa3b2]">
            {autosave ? `Autosaved · ${autosave.date}` : "Autosave will be created now"}
          </span>
          <button
            type="button"
            className="shrink-0 border border-white/20 bg-white/5 px-3 py-1 text-xs text-[#efe8dc] hover:bg-white/10 hover:border-white/35 transition-colors rounded"
            onClick={() => void saveNow()}
          >
            Save now
          </button>
        </div>
      ) : null}
      {variant === "title" && !autosave ? (
        <p className="font-mono text-[11px] text-[#6d7788]">No local company yet.</p>
      ) : null}
      {message ? <p className="font-mono text-[11px] text-[#c9a227]">{message}</p> : null}
    </div>
  );
}
