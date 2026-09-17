import { SPEED_OPTIONS } from "../config/balance";
import { useCameraDirector } from "../game3d/camera/cameraStore";
import { layoutFor } from "../game3d/navigation/layout";
import { formatDate } from "../simulation/date";
import { monthlyArr, monthlyBurn, runwayMonths } from "../simulation/derived";
import { currentTutorialSlide } from "../simulation/tutorial";
import type { DrawerId, GameState } from "../simulation/types";
import { useGame } from "../state/store";
import { money } from "./format";
import { NotificationBadge, Tooltip } from "./shared/controls";

const GROUPS: { id: string; label: string; items: { id: DrawerId; label: string; need?: keyof GameState["unlocks"]; tutorial?: string }[] }[] = [
  {
    id: "products",
    label: "Products",
    items: [
      { id: "tasks", label: "New", tutorial: "new-product" },
      { id: "products", label: "Catalog", tutorial: "products-nav" },
    ],
  },
  {
    id: "team",
    label: "Team",
    items: [
      { id: "people", label: "People" },
      { id: "hiring", label: "Hiring", need: "hiring", tutorial: "hiring-nav" },
    ],
  },
  { id: "research", label: "Research", items: [{ id: "research", label: "Tree", need: "research", tutorial: "research-nav" }] },
  {
    id: "finance",
    label: "Finance",
    items: [
      { id: "finance", label: "Ledger" },
      { id: "funding", label: "Raise", need: "funding", tutorial: "funding-nav" },
    ],
  },
  { id: "infra", label: "Infra", items: [{ id: "compute", label: "Compute", need: "compute", tutorial: "compute-nav" }] },
  {
    id: "company",
    label: "Company",
    items: [
      { id: "company", label: "Office" },
      { id: "perks", label: "Perks", need: "perks" },
    ],
  },
  { id: "world", label: "World", items: [{ id: "world", label: "News", need: "world" }] },
  { id: "inbox", label: "Inbox", items: [{ id: "inbox", label: "Mail" }] },
];

export function HUD({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const drawer = useGame((s) => s.drawer);
  const setDrawer = useGame((s) => s.setDrawer);
  const slide = currentTutorialSlide(game);
  const unread = game.inbox.filter((m) => !m.read).length;
  const run = runwayMonths(game);
  const highlight = slide?.highlightUI;
  const presets = layoutFor(game.company.officeLevel);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 text-paper">
      <div className="pointer-events-auto game-panel">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2">
          <div>
            <div className="font-display text-lg leading-none tracking-tight">{game.company.name}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-gold">Founder Mode</div>
          </div>
          <Stat label="Cash" value={money(game.company.cash)} alert={game.company.cash < 15_000} tip="Bank balance" />
          <Stat label="Runway" value={run >= 99 ? "∞" : `${run.toFixed(1)} mo`} alert={run < 3} tip="Months until empty" />
          <Tooltip text={`ARR ${money(monthlyArr(game) * 12)} · burn ${money(monthlyBurn(game))}`}>
            <button type="button" className="text-left" onClick={() => setDrawer("finance")}>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9aa3b2]">ARR</div>
              <div className="hud-number text-sm">{money(monthlyArr(game) * 12)}</div>
            </button>
          </Tooltip>
          <Tooltip text="API credits soak inference before cash">
            <button type="button" className="text-left" onClick={() => setDrawer("compute")}>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9aa3b2]">Credits</div>
              <div className="hud-number text-sm">{money(game.compute.apiCredits)}</div>
            </button>
          </Tooltip>
          <Tooltip text="Hype decays. It is not a moat.">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9aa3b2]">Hype</div>
              <div className="hud-number text-sm">{Math.round(game.company.hype)}</div>
            </div>
          </Tooltip>
          {unread ? (
            <button type="button" className="font-mono text-xs text-copper" onClick={() => setDrawer("inbox")}>
              Inbox <NotificationBadge count={unread} />
            </button>
          ) : null}
          {game.board && game.board.approval < 40 ? (
            <span className="font-mono text-xs text-[#e07a7a]">Board {game.board.approval.toFixed(0)}</span>
          ) : null}
          <div className="ml-auto flex items-center gap-3">
            <div className="font-mono text-sm">{formatDate(game.clock.date)}</div>
            <div
              data-tutorial="speed-controls"
              className={`flex overflow-hidden border border-white/15 ${highlight === "speed-controls" ? "tutorial-pulse" : ""}`}
            >
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
                    className={`px-2 py-1 font-mono text-xs ${active ? "bg-copper text-white" : "hover:bg-white/10"}`}
                  >
                    {sp === 0 ? "‖" : `${sp}×`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-white/10 px-3 py-1.5">
          {GROUPS.map((group) => {
            const items = group.items.filter((item) => !item.need || game.unlocks[item.need]);
            if (!items.length) return null;
            return (
              <div key={group.id} className="flex items-center gap-1">
                <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9aa3b2]">{group.label}</span>
                {items.map((item) => {
                  const active = drawer === item.id;
                  const pulse = item.tutorial && highlight === item.tutorial;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-tutorial={item.tutorial}
                      onClick={() => setDrawer(active ? null : item.id)}
                      className={`px-2 py-1 text-[11px] ${active ? "bg-copper text-white" : "text-[#d8d1c4] hover:bg-white/10"} ${pulse ? "tutorial-pulse" : ""}`}
                    >
                      {item.label}
                      {item.id === "inbox" ? <NotificationBadge count={unread} /> : ""}
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div className="ml-auto flex gap-1 font-mono text-[10px] text-[#9aa3b2]">
            <button type="button" onClick={() => useCameraDirector.getState().overview(game.company.officeLevel)}>
              Overview
            </button>
            <button
              type="button"
              onClick={() => {
                const desk = presets.points.find((p) => p.id === "desk-a") ?? presets.points[0]!;
                useCameraDirector.getState().focusPoint([desk.position[0] - 2, 3.2, desk.position[2] + 3], desk.position);
              }}
            >
              Founder
            </button>
            <button
              type="button"
              onClick={() => {
                const desks = presets.points.filter((p) => p.kind === "desk");
                const mid = desks[Math.floor(desks.length / 2)] ?? presets.points[0]!;
                useCameraDirector.getState().focusPoint([mid.position[0] - 3, 4, mid.position[2] + 4], mid.position);
              }}
            >
              Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, alert, tip }: { label: string; value: string; alert?: boolean; tip: string }) {
  return (
    <Tooltip text={tip}>
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#9aa3b2]">{label}</div>
        <div className={`hud-number text-sm ${alert ? "text-[#e07a7a]" : ""}`}>{value}</div>
      </div>
    </Tooltip>
  );
}
