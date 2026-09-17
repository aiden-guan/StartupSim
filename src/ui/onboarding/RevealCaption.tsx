import { useEffect } from "react";
import { useGame } from "../../state/store";

export function RevealCaption() {
  const game = useGame((s) => s.game);
  const playing = useGame((s) => s.revealPlaying);
  const setRevealPlaying = useGame((s) => s.setRevealPlaying);
  const dispatch = useGame((s) => s.dispatch);

  useEffect(() => {
    if (!playing || !game) return;
    const t = window.setTimeout(() => {
      setRevealPlaying(false);
      dispatch({ type: "beginTutorial" });
    }, 2800);
    return () => window.clearTimeout(t);
  }, [playing, game, dispatch, setRevealPlaying]);

  if (!playing || !game) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center bg-black/25 pb-24">
      <div className="text-center text-paper">
        <div className="font-mono text-[11px] uppercase tracking-[0.4em]">November 2022</div>
        <div className="mt-2 font-display text-4xl">San Francisco</div>
        <div className="mt-2 font-mono text-xs uppercase tracking-[0.2em] opacity-80">{game.company.name}</div>
      </div>
    </div>
  );
}
