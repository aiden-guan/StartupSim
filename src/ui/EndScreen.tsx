import { identity } from "../branding/identity";
import { biography, ENDINGS } from "../simulation/endings";
import type { GameState } from "../simulation/types";
import { useGame } from "../state/store";
import { money } from "./format";

export function EndScreen({ game }: { game: GameState }) {
  const setScreen = useGame((s) => s.setScreen);
  const ending = ENDINGS[game.endingId ?? ""] ?? { title: "Closed", line: game.endingNote ?? "" };
  const lines = biography(game);

  return (
    <div className="h-full overflow-auto bg-[#efe8dc] text-[#1b2230]">
      <div className="mx-auto max-w-2xl px-8 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#c4622d]">{identity.shortTitle} · postmortem</p>
        <h1 className="mt-3 font-display text-5xl">{ending.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-[#5d6573]">{ending.line}</p>
        <div className="mt-10 space-y-3 text-sm leading-relaxed">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <dl className="mt-10 grid grid-cols-2 gap-3 font-mono text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Cash</dt>
            <dd>{money(game.company.cash)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Valuation</dt>
            <dd>{money(game.company.valuation)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Hype / Trust</dt>
            <dd>
              {game.company.hype.toFixed(0)} / {game.company.trust.toFixed(0)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Year</dt>
            <dd>{game.clock.date.year}</dd>
          </div>
        </dl>
        <button type="button" className="mt-12 bg-[#1b2230] px-5 py-3 text-white" onClick={() => setScreen("title")}>
          Start another company →
        </button>
      </div>
    </div>
  );
}
