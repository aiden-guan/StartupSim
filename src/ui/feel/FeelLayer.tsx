import { useEffect } from "react";
import { useGame } from "../../state/store";

export function FeelLayer() {
  const eventFrame = useGame((s) => s.eventFrame);
  const officeCaption = useGame((s) => s.officeCaption);
  const setEventFrame = useGame((s) => s.setEventFrame);
  const setOfficeCaption = useGame((s) => s.setOfficeCaption);
  const setDrawer = useGame((s) => s.setDrawer);

  useEffect(() => {
    if (!eventFrame || eventFrame.surface !== "gameplay") return;
    const t = window.setTimeout(() => setEventFrame(null), eventFrame.requiresResponse ? 8000 : 4200);
    return () => window.clearTimeout(t);
  }, [eventFrame, setEventFrame]);

  useEffect(() => {
    if (!officeCaption) return;
    const t = window.setTimeout(() => setOfficeCaption(null), 2800);
    return () => window.clearTimeout(t);
  }, [officeCaption, setOfficeCaption]);

  return (
    <>
      {eventFrame?.surface === "gameplay" && eventFrame.requiresResponse ? (
        <div className="game-event-layer" role="alert" aria-live="assertive" aria-atomic="true">
          <article className="game-event-card" aria-label="Company event">
            <header className="game-event-header">
              <div className="game-event-mark" aria-hidden="true">!</div>
              <div>
                <span className="game-event-kicker">Company event · Decision required</span>
                <h3>{eventFrame.headline}</h3>
              </div>
            </header>
            {eventFrame.impact ? (
              <div className="game-event-impact">
                <span>Effect on your company</span>
                <strong>{eventFrame.impact}</strong>
              </div>
            ) : null}
            <p className="game-event-body">{eventFrame.body}</p>
            <footer className="game-event-footer">
              <span>Paused until you respond</span>
              {eventFrame.mailId ? <button onClick={() => { setDrawer("inbox"); setEventFrame(null); }}>Open event brief →</button> : null}
            </footer>
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
