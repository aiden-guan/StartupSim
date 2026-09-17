import { onboarding } from "../data/onboarding";
import { useGame } from "../state/store";

export function DebugPanel() {
  const game = useGame((s) => s.game);
  const open = useGame((s) => s.debugOpen);
  const dispatch = useGame((s) => s.dispatch);
  const toggleDebug = useGame((s) => s.toggleDebug);
  const setGalleryOpen = useGame((s) => s.setGalleryOpen);
  if (!game || !open) return null;
  if (!import.meta.env.DEV && !new URLSearchParams(window.location.search).get("debug")) return null;

  const actions: { label: string; run: () => void }[] = [
    { label: "+$1M", run: () => dispatch({ type: "debug", action: "cash", amount: 1_000_000 }) },
    { label: "+Hype", run: () => dispatch({ type: "debug", action: "hype", amount: 20 }) },
    { label: "+7d", run: () => dispatch({ type: "debug", action: "time", amount: 7 }) },
    { label: "+30d", run: () => dispatch({ type: "debug", action: "time", amount: 30 }) },
    { label: "Unlock tech", run: () => dispatch({ type: "debug", action: "tech" }) },
    { label: "Office+", run: () => dispatch({ type: "debug", action: "office" }) },
    { label: "Hire", run: () => dispatch({ type: "debug", action: "hire" }) },
    { label: "Burnout", run: () => dispatch({ type: "debug", action: "burnout", amount: 10 }) },
    { label: "Finish product", run: () => dispatch({ type: "debug", action: "completeProduct" }) },
    { label: "Perk coffee", run: () => dispatch({ type: "debug", action: "perk", id: "coffee" }) },
    { label: "Skip tutorial", run: () => dispatch({ type: "skipTutorial" }) },
  ];

  return (
    <div className="pointer-events-auto absolute right-3 top-24 z-40 w-56 border border-copper bg-[#1b2433] p-3 text-paper shadow-xl">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-gold">
        Debug
        <button type="button" onClick={toggleDebug}>
          close
        </button>
      </div>
      <div className="grid gap-1">
        {actions.map((a) => (
          <button key={a.label} type="button" className="border border-white/10 px-2 py-1 text-left text-xs hover:bg-white/10" onClick={a.run}>
            {a.label}
          </button>
        ))}
        <select className="bg-panel px-2 py-1 text-xs" onChange={(e) => dispatch({ type: "debug", action: "jumpOnboard", id: e.target.value })}>
          <option value="">Jump onboard…</option>
          {onboarding.map((step) => (
            <option key={step.id} value={step.id}>
              {step.id}
            </option>
          ))}
        </select>
        <button type="button" className="border border-white/10 px-2 py-1 text-left text-xs" onClick={() => setGalleryOpen(true)}>
          Gallery
        </button>
      </div>
      <pre className="mt-2 max-h-40 overflow-auto font-mono text-[9px] text-[#9aa3b2]">
        {JSON.stringify({ tick: game.clock.tick, cash: Math.round(game.company.cash), mentor: game.pendingMentor, office: game.company.officeLevel }, null, 2)}
      </pre>
    </div>
  );
}
