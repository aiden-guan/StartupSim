import { identity } from "../branding/identity";
import { listSaves, readSave } from "../state/save";
import { useGame } from "../state/store";
import { useEffect, useState } from "react";

export function TitleScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const loadGame = useGame((s) => s.loadGame);
  const [saves, setSaves] = useState<{ id: string; company: string; date: string }[]>([]);

  useEffect(() => {
    void listSaves().then(setSaves);
  }, []);

  return (
    <div className="flex h-full bg-[#1b2230] text-[#efe8dc]">
      <div className="relative flex w-[46%] flex-col justify-between border-r border-[#c4622d]/40 p-12">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.35em] text-[#c9a227]">Late 2022 · a private ledger</div>
          <h1 className="mt-6 font-display text-6xl leading-[0.9]">{identity.title}</h1>
          <p className="mt-4 max-w-sm font-display text-xl text-[#d8d1c4]">{identity.subtitle}</p>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-[#9aa3b2]">
          Two people, an apartment, a pile of API credits. The industry is about to become a weather system. You can still name the company.
        </p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4 p-16">
        <button
          type="button"
          onClick={() => setScreen("setup")}
          className="w-72 bg-[#c4622d] px-5 py-3 text-left font-medium text-white"
        >
          Incorporate
        </button>
        {saves[0] ? (
          <button
            type="button"
            onClick={async () => {
              const g = await readSave(saves[0]!.id);
              if (g) loadGame(g);
            }}
            className="w-72 border border-white/20 px-5 py-3 text-left text-sm"
          >
            Continue {saves[0].company}
            <span className="block font-mono text-[11px] text-[#9aa3b2]">{saves[0].date}</span>
          </button>
        ) : null}
        <p className="mt-8 max-w-md font-mono text-[11px] leading-relaxed text-[#6d7788]">
          Inspired by systems in The Founder (Francis Tseng, MIT). Original names, art, and copy are not used.
        </p>
      </div>
    </div>
  );
}
