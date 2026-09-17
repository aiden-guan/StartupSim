import { useEffect } from "react";
import { useGame } from "../../state/store";

export function FeelLayer() {
  const eventFrame = useGame((s) => s.eventFrame);
  const officeCaption = useGame((s) => s.officeCaption);
  const setEventFrame = useGame((s) => s.setEventFrame);
  const setOfficeCaption = useGame((s) => s.setOfficeCaption);

  useEffect(() => {
    if (!eventFrame) return;
    const t = window.setTimeout(() => setEventFrame(null), 4200);
    return () => window.clearTimeout(t);
  }, [eventFrame, setEventFrame]);

  useEffect(() => {
    if (!officeCaption) return;
    const t = window.setTimeout(() => setOfficeCaption(null), 2800);
    return () => window.clearTimeout(t);
  }, [officeCaption, setOfficeCaption]);

  return (
    <>
      {eventFrame ? (
        <div className="pointer-events-none absolute inset-x-0 top-28 z-30 flex justify-center">
          <article className="term-sheet max-w-md p-4 shadow-2xl">
            <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-copper">Wire</div>
            <h3 className="mt-1 font-display text-2xl leading-tight">{eventFrame.headline}</h3>
            <p className="mt-2 text-sm text-muted">{eventFrame.body}</p>
          </article>
        </div>
      ) : null}
      {officeCaption ? (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#1b2230]/45">
          <div className="text-center text-paper">
            <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold">Office</div>
            <div className="mt-2 font-display text-4xl">{officeCaption}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
