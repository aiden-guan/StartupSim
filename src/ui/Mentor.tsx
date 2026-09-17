import { identity } from "../branding/identity";
import { onboarding } from "../data/onboarding";
import { useGame } from "../state/store";

export function Mentor() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  if (!game?.pendingMentor) return null;
  const step = onboarding.find((o) => o.id === game.pendingMentor);
  if (!step) return null;
  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-30 w-[min(520px,92vw)] -translate-x-1/2 border border-[#c4622d] bg-[#efe8dc] p-5 text-[#1b2230] shadow-2xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c4622d]">
        {identity.mentorName} · {identity.mentorTitle}
      </div>
      <div className="mt-3 space-y-2 text-sm leading-relaxed">
        {step.messages.map((m) => (
          <p key={m}>{m}</p>
        ))}
      </div>
      <button type="button" className="mt-4 bg-[#1b2230] px-4 py-2 text-sm text-white" onClick={() => dispatch({ type: "dismissMentor" })}>
        Understood
      </button>
    </div>
  );
}
