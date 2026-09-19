import { useEffect, useState } from "react";
import { overviewShot, useCameraDirector } from "../../game3d/camera/cameraStore";
import { subscribeFeedback } from "../../feedback/FeedbackDirector";
import type { FeedbackEvent } from "../../feedback/feedbackEvents";
import { feedbackMotionPolicy } from "../../feedback/feedbackPolicy";
import { useGame } from "../../state/store";

export function FeelLayer() {
  const eventFrame = useGame((s) => s.eventFrame);
  const officeCaption = useGame((s) => s.officeCaption);
  const setEventFrame = useGame((s) => s.setEventFrame);
  const setOfficeCaption = useGame((s) => s.setOfficeCaption);
  const setDrawer = useGame((s) => s.setDrawer);
  const isPaused = useGame((s) => s.game?.clock.paused ?? false);
  const reducedMotion = useGame((s) => s.game?.settings.reducedMotion ?? false);
  const graphics = useGame((s) => s.game?.settings.graphics ?? "high");
  const [presentation, setPresentation] = useState<FeedbackEvent | null>(null);

  useEffect(() => subscribeFeedback((event) => {
    if (event.tier < 3 || event.type === "office.upgraded" || event.type === "crisis.started") return;
    if (!event.label) return;
    setPresentation((current) => current && current.tier > event.tier ? current : event);
  }), []);

  useEffect(() => {
    if (!presentation) return;
    const timer = window.setTimeout(() => setPresentation(null), presentation.tier >= 5 ? 2300 : 1650);
    return () => window.clearTimeout(timer);
  }, [presentation]);

  useEffect(() => subscribeFeedback((event) => {
    const policy = feedbackMotionPolicy(event, { reducedMotion, graphics });
    if (!policy.camera) return;
    const game = useGame.getState().game;
    if (!game) return;
    // Wait until the new office level has committed its normal camera goal.
    window.requestAnimationFrame(() => {
      if (useGame.getState().screen !== "playing") return;
      const director = useCameraDirector.getState();
      const original = director.goal;
      const orbit = director.orbitEnabled;
      const shot = overviewShot(game.company.officeLevel);
      director.setGoal({ ...shot, position: shot.position.map((axis) => axis * 1.12) as [number, number, number], duration: .85, mode: "FOCUS" });
      const shown = useCameraDirector.getState().goal;
      window.setTimeout(() => {
        if (useCameraDirector.getState().goal !== shown) return;
        useCameraDirector.setState({ goal: { ...original, duration: .8 }, orbitEnabled: orbit });
      }, policy.durationMs);
    });
  }), [reducedMotion, graphics]);

  useEffect(() => {
    if (!eventFrame || (eventFrame.surface !== "gameplay" && eventFrame.surface !== "social")) return;
    const t = window.setTimeout(() => setEventFrame(null), eventFrame.requiresResponse ? 8000 : 4500);
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
          <article className="game-event-card" aria-label="New message received">
            <header className="game-event-header">
              <div
                className="game-event-mark"
                aria-hidden="true"
                style={{ backgroundColor: eventFrame.critical ? "#991b1b" : "#2e5241" }}
              >
                {eventFrame.critical ? "⚠" : "✉"}
              </div>
              <div>
                <span
                  className="game-event-kicker"
                  style={{ color: eventFrame.critical ? "#991b1b" : "#2e5241" }}
                >
                  {eventFrame.critical ? "Critical crisis · action required" : "New message · response required"}
                </span>
                {eventFrame.sender ? (
                  <div className="text-[11px] font-semibold text-[#1c2e24] mt-0.5">
                    From: {eventFrame.sender}{eventFrame.senderOrg ? ` (${eventFrame.senderOrg})` : ""}
                  </div>
                ) : null}
                <h3 style={{ fontSize: "16px", marginTop: "2px", lineHeight: "1.3" }}>{eventFrame.headline}</h3>
              </div>
            </header>
            {eventFrame.impact ? (
              <div className="game-event-impact">
                <span>Consequences</span>
                <strong>{eventFrame.impact}</strong>
              </div>
            ) : null}
            <p className="game-event-body">{eventFrame.body.slice(0, 160)}{eventFrame.body.length > 160 ? "…" : ""}</p>
            <footer className="game-event-footer">
              <span>{isPaused ? "Simulation paused" : "Simulation running"}</span>
              {eventFrame.mailId ? (
                <button
                  onClick={() => {
                    setDrawer("inbox");
                    setEventFrame(null);
                  }}
                  style={{
                    background: eventFrame.critical ? "#991b1b" : "#2e5241",
                    color: "#f5f3e9",
                    padding: "4px 9px",
                    borderRadius: "3px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Open Inbox →
                </button>
              ) : null}
            </footer>
          </article>
        </div>
      ) : null}
      {eventFrame?.surface === "social" ? (
        <div className="game-event-layer" role="status" aria-live="polite">
          <aside
            className="game-event-card cursor-pointer"
            style={{ borderLeftColor: "#3c6b53", borderColor: "#8ea38a" }}
            onClick={() => {
              setDrawer("social");
              setEventFrame(null);
            }}
          >
            <header className="game-event-header">
              <div
                className="game-event-mark"
                style={{ backgroundColor: "#3c6b53" }}
                aria-hidden="true"
              >
                @
              </div>
              <div>
                <span className="game-event-kicker" style={{ color: "#3c6b53" }}>
                  Radar
                </span>
                <h3 className="text-base font-semibold">{eventFrame.headline}</h3>
              </div>
            </header>
            <p className="game-event-body">{eventFrame.body}</p>
            <footer className="game-event-footer">
              <span className="text-xs text-[#3c6b53] font-medium">Open Radar →</span>
            </footer>
          </aside>
        </div>
      ) : null}
      {officeCaption ? (
        <div className="office-reveal pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-[#1b2230]/25">
          <div className="text-center text-paper">
            <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-gold">Office</div>
            <div className="mt-2 font-display text-4xl">{officeCaption}</div>
          </div>
        </div>
      ) : null}
      {presentation && !officeCaption && !eventFrame?.requiresResponse ? (
        <div key={`${presentation.type}-${presentation.id ?? presentation.label}`} className={`feel-presentation feel-tier-${presentation.tier}`} role="status" aria-live="polite">
          <span>{presentation.type === "milestone" ? "Company milestone" : presentation.type === "product.ready" ? "Product ready" : presentation.type === "funding.closed" ? "Term sheet signed" : "Compounding"}</span>
          <strong>{presentation.label}</strong>
        </div>
      ) : null}
    </>
  );
}
