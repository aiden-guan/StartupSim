import { useEffect } from "react";
import { useGame } from "../../state/store";

export function FeelLayer() {
  const eventFrame = useGame((s) => s.eventFrame);
  const officeCaption = useGame((s) => s.officeCaption);
  const setEventFrame = useGame((s) => s.setEventFrame);
  const setOfficeCaption = useGame((s) => s.setOfficeCaption);
  const setDrawer = useGame((s) => s.setDrawer);

  useEffect(() => {
    if (!eventFrame) return;
    const t = window.setTimeout(() => setEventFrame(null), eventFrame.surface === "gameplay" ? 6000 : 4200);
    return () => window.clearTimeout(t);
  }, [eventFrame, setEventFrame]);

  useEffect(() => {
    if (!officeCaption) return;
    const t = window.setTimeout(() => setOfficeCaption(null), 2800);
    return () => window.clearTimeout(t);
  }, [officeCaption, setOfficeCaption]);

  return (
    <>
      {eventFrame?.surface === "gameplay" ? (
        <div className="game-event-layer" role={eventFrame.requiresResponse ? "alert" : "status"} aria-live={eventFrame.requiresResponse ? "assertive" : "polite"} aria-atomic="true">
          <article className="game-event-card" aria-label="Company event">
            <header className="game-event-header">
              <div className="game-event-mark" aria-hidden="true">!</div>
              <div>
                <span className="game-event-kicker">Company event · {eventFrame.requiresResponse ? "Decision required" : "Applied now"}</span>
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
              <span>{eventFrame.requiresResponse ? "Paused until you respond" : "State updated"}</span>
              {eventFrame.mailId ? <button onClick={() => { setDrawer("inbox"); setEventFrame(null); }}>Open event brief →</button> : null}
            </footer>
          </article>
        </div>
      ) : null}
      {eventFrame?.surface === "news" ? (
        <div className="news-flash-layer" role="status" aria-live="polite" aria-atomic="true">
          <article className="news-post" aria-label="News flash">
            <header className="news-post-header">
              <div className="news-post-avatar" aria-hidden="true">W</div>
              <div className="news-post-author">
                <div className="news-post-author-line">
                  <strong>The Wire</strong>
                  <span className="news-post-verified" aria-label="Verified source">✓</span>
                  <span className="news-post-handle">@founderwire · now</span>
                </div>
                <span className="news-post-context">World news</span>
              </div>
              <span className="news-post-menu" aria-hidden="true">···</span>
            </header>
            <div className="news-post-copy">
              <h3>{eventFrame.headline}</h3>
              <p>{eventFrame.body}</p>
              {eventFrame.impact ? <div className="news-post-impact"><span>World impact</span>{eventFrame.impact}</div> : null}
            </div>
            <footer className="news-post-actions" aria-hidden="true">
              <span className="news-post-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.6 8.6 0 0 1-3.4-.7L4 20l1.3-3.4A7.4 7.4 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z" /></svg>
              </span>
              <span className="news-post-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m17 3 3 3-3 3M20 6H9a5 5 0 0 0-5 5v1M7 21l-3-3 3-3M4 18h11a5 5 0 0 0 5-5v-1" /></svg>
              </span>
              <span className="news-post-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 8.8c0 5.5-8.8 10.2-8.8 10.2S3.2 14.3 3.2 8.8A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 8.8 2.7Z" /></svg>
              </span>
              <span className="news-post-action">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4M7.5 8.5 12 4l4.5 4.5M5 14v5h14v-5" /></svg>
              </span>
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
