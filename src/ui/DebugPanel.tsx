import { useGame } from "../state/store";

export function DebugPanel() {
  const game = useGame((s) => s.game);
  const open = useGame((s) => s.debugOpen);
  const dispatch = useGame((s) => s.dispatch);
  const toggleDebug = useGame((s) => s.toggleDebug);
  if (!game || !open) return null;
  if (!import.meta.env.DEV && !new URLSearchParams(window.location.search).get("debug")) return null;

  const actions: { label: string; action: string; amount?: number }[] = [
    { label: "+$1M", action: "cash", amount: 1_000_000 },
    { label: "+Hype", action: "hype", amount: 20 },
    { label: "+7d", action: "time", amount: 7 },
    { label: "+30d", action: "time", amount: 30 },
    { label: "Unlock tech", action: "tech" },
    { label: "Office+", action: "office" },
    { label: "Hire", action: "hire" },
  ];

  return (
    <div className="pointer-events-auto absolute right-3 top-24 z-40 w-56 border border-[#c4622d] bg-[#1b2433] p-3 text-[#efe8dc] shadow-xl">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-[#c9a227]">
        Debug
        <button type="button" onClick={toggleDebug}>
          close
        </button>
      </div>
      <div className="grid gap-1">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className="border border-white/10 px-2 py-1 text-left text-xs hover:bg-white/10"
            onClick={() => dispatch({ type: "debug", action: a.action, amount: a.amount })}
          >
            {a.label}
          </button>
        ))}
      </div>
      <pre className="mt-2 max-h-40 overflow-auto font-mono text-[9px] text-[#9aa3b2]">
        {JSON.stringify(
          {
            tick: game.clock.tick,
            cash: Math.round(game.company.cash),
            tasks: game.tasks.length,
            products: game.products.map((p) => p.status),
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
