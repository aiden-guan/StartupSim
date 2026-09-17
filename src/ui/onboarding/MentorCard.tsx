import { useEffect, useState } from "react";
import { identity } from "../../branding/identity";
import { onboarding } from "../../data/onboarding";
import { MENTOR_LOOK } from "../../game3d/characters/HeroLooks";
import { currentTutorialSlide } from "../../simulation/tutorial";
import { useGame } from "../../state/store";
import { GameButton } from "../shared/controls";
import { CharacterPortrait } from "../shared/CharacterPortrait";

export const TUTORIAL_NEXT_IDLE_MS = 4000;

export function MentorCard() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const revealPlaying = useGame((s) => s.revealPlaying);
  const [highlightNext, setHighlightNext] = useState(false);

  const step = game?.pendingMentor ? onboarding.find((o) => o.id === game.pendingMentor) : null;
  const slide = game ? currentTutorialSlide(game) : null;
  const index = game?.onboarding.slideIndex ?? 0;
  const showNext = slide?.advance.type === "nextButton";

  useEffect(() => {
    setHighlightNext(false);
    if (!showNext || revealPlaying || !game?.pendingMentor) return;

    const timer = window.setTimeout(() => {
      setHighlightNext(true);
    }, TUTORIAL_NEXT_IDLE_MS);

    return () => window.clearTimeout(timer);
  }, [slide?.id, showNext, index, revealPlaying, game?.pendingMentor]);

  if (!game?.pendingMentor || revealPlaying) return null;
  if (!step || !slide) return null;

  return (
    <div className="mentor-card" role="dialog" aria-label="Mentor">
      <div className="term-sheet flex gap-3 p-3 shadow-2xl">
        <CharacterPortrait look={MENTOR_LOOK} className="h-24 w-20 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
            {identity.mentorName}
          </div>
          <div className="font-mono text-[10px] text-muted">{identity.mentorTitle}</div>
          <p className="mt-2 font-display text-[17px] leading-snug">“{slide.text}”</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex gap-1">
              {step.slides.map((s, i) => (
                <span key={s.id} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-copper" : "bg-[#cfc5b6]"}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {index > 0 ? (
                <GameButton className="border-[#cfc5b6] text-ink" onClick={() => dispatch({ type: "backMentor" })}>
                  Back
                </GameButton>
              ) : null}
              {showNext ? (
                <GameButton
                  tone="primary"
                  className={highlightNext ? "tutorial-next-pulse" : ""}
                  data-tutorial-next={highlightNext ? "pulsing" : "idle"}
                  title={highlightNext ? "Click Next to continue" : undefined}
                  onClick={() => {
                    setHighlightNext(false);
                    dispatch({ type: "advanceMentor" });
                  }}
                >
                  Next
                </GameButton>
              ) : (
                <span className="text-xs text-muted">Your turn →</span>
              )}
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-widest text-muted"
                onClick={() => dispatch({ type: "skipTutorial" })}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Spotlight() {
  const game = useGame((s) => s.game);
  const slide = game ? currentTutorialSlide(game) : null;
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!slide?.highlightUI) {
      setRect(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(`[data-tutorial="${slide.highlightUI}"]`);
      if (!(el instanceof HTMLElement || el instanceof SVGElement)) {setRect(null);return;}
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const visible = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth && style.visibility !== 'hidden' && style.display !== 'none' && !el.closest('[hidden]');
      setRect(visible ? r : null);
    };
    update();
    const t = window.setInterval(update, 240);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("resize", update);
    };
  }, [slide?.highlightUI, slide?.id]);

  if (!slide?.highlightUI || !rect) return null;
  const pad = 8;
  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="tutorial-outline" data-testid="tutorial-spotlight" style={{ left: x, top: y, width: w, height: h }} />
    </div>
  );
}
