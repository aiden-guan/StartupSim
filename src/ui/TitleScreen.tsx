import { identity } from "../branding/identity";
import { useGame } from "../state/store";
import { SavePanel } from "./SavePanel";

export function TitleScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const loadGame = useGame((s) => s.loadGame);

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
      <div className="flex flex-1 flex-col justify-center gap-4 overflow-auto p-16">
        <button
          type="button"
          onClick={() => setScreen("setup")}
          className="w-72 bg-[#c4622d] px-5 py-3 text-left font-medium text-white"
        >
          Incorporate
        </button>
        <SavePanel game={null} onLoad={loadGame} variant="title" />
        <p className="mt-8 max-w-md font-mono text-[11px] leading-relaxed text-[#6d7788]">
          Inspired by systems in The Founder (Francis Tseng, MIT). Original names, art, and copy are not used.
        </p>
      </div>
    </div>
  );
}
