import { useEffect, useState } from "react";
import type { GameState } from "../simulation/types";
import {
  MANUAL_SLOTS,
  deleteSave,
  downloadSaveFile,
  importSave,
  listSaves,
  readSave,
  saveLabel,
  writeSave,
  type SaveMeta,
} from "../state/save";

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
    setSaves(await listSaves());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function loadId(id: string) {
    const next = await readSave(id);
    if (!next) {
      setMessage("That slot is empty.");
      return;
    }
    onLoad(next);
  }

  async function saveTo(id: string) {
    if (!game) return;
    await writeSave(id, game);
    await refresh();
    setMessage(`Wrote ${saveLabel(id)} on this device.`);
  }

  async function onImport(file: File) {
    try {
      const next = importSave(await file.text());
      await writeSave("imported", next);
      await refresh();
      onLoad(next);
      setMessage("Loaded a save file into this browser.");
    } catch {
      setMessage("That file is not a Founder Mode save.");
    }
  }

  const latest = saves[0];

  return (
    <div className={variant === "title" ? "flex max-w-md flex-col gap-3" : "space-y-3"}>
      <p className="text-xs leading-relaxed text-[#9aa3b2]">
        Progress is stored in this browser. Export a file to move a company to another device, or import one whenever you want.
      </p>
      {variant === "title" && latest ? (
        <button
          type="button"
          onClick={() => void loadId(latest.id)}
          className="w-72 border border-white/20 px-5 py-3 text-left text-sm"
        >
          Continue {latest.company}
          <span className="block font-mono text-[11px] text-[#9aa3b2]">
            {saveLabel(latest.id)} · {latest.date}
          </span>
        </button>
      ) : null}
      {game ? (
        <div className="flex flex-wrap gap-2">
          {MANUAL_SLOTS.map((id) => (
            <button
              key={id}
              type="button"
              className="border border-white/20 px-3 py-1 text-xs"
              onClick={() => void saveTo(id)}
            >
              Save {saveLabel(id)}
            </button>
          ))}
          <button type="button" className="border border-white/20 px-3 py-1 text-xs" onClick={() => downloadSaveFile(game)}>
            Export file
          </button>
        </div>
      ) : null}
      <label className="inline-flex w-fit cursor-pointer border border-white/20 px-3 py-1 text-xs">
        Import file
        <input
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onImport(file);
          }}
        />
      </label>
      {saves.length ? (
        <ul className="space-y-1 font-mono text-[11px] text-[#9aa3b2]">
          {(variant === "title" ? saves.slice(1) : saves).map((save) => (
            <li key={save.id} className="flex flex-wrap items-center gap-2">
              <span>
                {saveLabel(save.id)} · {save.company} · {save.date}
              </span>
              <button type="button" className="underline" onClick={() => void loadId(save.id)}>
                load
              </button>
              {save.id !== "autosave" ? (
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    void deleteSave(save.id).then(refresh);
                  }}
                >
                  delete
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-mono text-[11px] text-[#6d7788]">No local companies yet.</p>
      )}
      {message ? <p className="font-mono text-[11px] text-[#c9a227]">{message}</p> : null}
    </div>
  );
}
