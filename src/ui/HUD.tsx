import { identity } from "../branding/identity";
import { SPEED_OPTIONS } from "../config/balance";
import { formatDate } from "../simulation/date";
import { grossMargin, monthlyArr, monthlyBurn, runwayMonths } from "../simulation/derived";
import type { DrawerId, GameState } from "../simulation/types";
import { useGame } from "../state/store";
import { money, pct } from "./format";

const NAV: { id: DrawerId; label: string; need?: keyof GameState["unlocks"] }[] = [
  { id: "tasks", label: "Tasks" },
  { id: "products", label: "Products" },
  { id: "people", label: "People" },
  { id: "hiring", label: "Hiring", need: "hiring" },
  { id: "research", label: "Research", need: "research" },
  { id: "finance", label: "Finance" },
  { id: "compute", label: "Compute", need: "compute" },
  { id: "funding", label: "Raise", need: "funding" },
  { id: "perks", label: "Perks", need: "perks" },
  { id: "world", label: "World", need: "world" },
  { id: "inbox", label: "Inbox" },
  { id: "company", label: "Company" },
];

export function HUD({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const drawer = useGame((s) => s.drawer);
  const setDrawer = useGame((s) => s.setDrawer);
  const unread = game.inbox.filter((m) => !m.read).length;
  const arr = monthlyArr(game);
  const burn = monthlyBurn(game);
  const run = runwayMonths(game);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 text-[#efe8dc]">
      <div className="pointer-events-auto rounded-sm border border-white/10 bg-[#1b2433]/92 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
          <div>
            <div className="font-display text-lg leading-none tracking-tight">{game.company.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#c9a227]">{identity.shortTitle}</div>
          </div>
          <Stat label="Cash" value={money(game.company.cash)} alert={game.company.cash < 15_000} />
          <Stat label="ARR" value={money(arr * 12)} />
          <Stat label="Burn" value={money(burn)} />
          <Stat label="Runway" value={run >= 99 ? "∞" : `${run.toFixed(1)} mo`} alert={run < 3} />
          <Stat label="Hype" value={game.company.hype.toFixed(0)} />
          <Stat label="Trust" value={game.company.trust.toFixed(0)} />
          <Stat label="Credits" value={money(game.compute.apiCredits)} />
          {game.board ? <Stat label="Board" value={pct(game.board.approval)} alert={game.board.approval < 30} /> : null}
          <div className="ml-auto flex items-center gap-3">
            <div className="font-mono text-sm">{formatDate(game.clock.date)}</div>
            <div className="flex overflow-hidden rounded-sm border border-white/15">
              {SPEED_OPTIONS.map((sp) => {
                const active = sp === 0 ? game.clock.paused || game.clock.speed === 0 : game.clock.speed === sp && !game.clock.paused;
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => {
                      if (sp === 0) dispatch({ type: "setPaused", paused: true, reason: "Paused" });
                      else dispatch({ type: "setSpeed", speed: sp });
                    }}
                    className={`px-2 py-1 font-mono text-xs ${active ? "bg-[#c4622d] text-white" : "hover:bg-white/10"}`}
                  >
                    {sp === 0 ? "‖" : `${sp}×`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 border-t border-white/10 px-3 py-1.5">
          {NAV.map((item) => {
            if (item.need && !game.unlocks[item.need]) return null;
            const active = drawer === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setDrawer(active ? null : item.id)}
                className={`rounded-sm px-2 py-1 font-mono text-[11px] uppercase tracking-wide ${active ? "bg-[#c4622d] text-white" : "text-[#d8d1c4] hover:bg-white/10"}`}
              >
                {item.label}
                {item.id === "inbox" && unread ? ` (${unread})` : ""}
              </button>
            );
          })}
          <span className="ml-auto font-mono text-[10px] text-[#9aa3b2]">
            Gross {pct(grossMargin(game) * 100)} · {game.employees.length} people · Office L{game.company.officeLevel}
            {game.clock.reasonPaused ? ` · ${game.clock.reasonPaused}` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9aa3b2]">{label}</div>
      <div className={`hud-number text-sm ${alert ? "text-[#e07a7a]" : ""}`}>{value}</div>
    </div>
  );
}

export type { DrawerId };
