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
    <div className="mentor-card" role="dialog" aria-label="Mentor" data-tutorial-card>
      <div className="term-sheet flex gap-4 p-4 shadow-2xl">
        <CharacterPortrait look={MENTOR_LOOK} className="h-24 w-20 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
            {identity.mentorName}
          </div>
          <div className="font-mono text-[10px] text-muted">{identity.mentorTitle}</div>
          <p className="mt-2 font-display text-[17px] leading-snug">“{slide.text}”</p>
          <div className="mentor-card-footer mt-3 flex items-center justify-between gap-3">
            <div className="mentor-progress flex gap-1" aria-label={`Step ${index + 1} of ${step.slides.length}`}>
              {step.slides.map((s, i) => (
                <span key={s.id} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-copper" : "bg-[#cfc5b6]"}`} />
              ))}
            </div>
            <div className="mentor-actions flex items-center gap-2">
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
                <span className="mentor-action-status" role="status">
                  <span className="mentor-action-status-dot" aria-hidden="true" />
                  Waiting for your action
                </span>
              )}
              <button
                type="button"
                className="mentor-skip font-mono text-[10px] uppercase tracking-widest text-muted"
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
    let cancelled = false;
    let target: HTMLElement | SVGElement | null = null;
    let observer: ResizeObserver | null = null;
    let frame = 0;
    const scrollingKeys = new Set(["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", " "]);
    const blockScroll = (event: Event) => event.preventDefault();
    const blockKeyScroll = (event: KeyboardEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return;
      if (scrollingKeys.has(event.key)) event.preventDefault();
    };
    const scrollParents = (element: Element) => {
      const parents: HTMLElement[] = [];
      let parent = element.parentElement;
      while (parent) {
        const style = getComputedStyle(parent);
        if (/(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight + 2) parents.push(parent);
        parent = parent.parentElement;
      }
      return parents;
    };
    const updateRect = () => {
      if (!target || cancelled) return;
      const next = target.getBoundingClientRect();
      if (next.width > 0 && next.height > 0) {
        setRect(next);
      }
    };
    const scrollIntoViewIfNeeded = (el: HTMLElement | SVGElement) => {
      const parents = scrollParents(el);
      for (const parent of parents) {
        const current = el.getBoundingClientRect();
        const base = parent.getBoundingClientRect();
        const pad = 16;
        let delta = 0;
        if (current.top < base.top + pad) {
          delta = current.top - (base.top + pad);
        } else if (current.bottom > base.bottom - pad) {
          delta = current.bottom - (base.bottom - pad);
        }
        if (Math.abs(delta) > 3) {
          parent.scrollBy({ top: delta, behavior: "smooth" });
        }
      }
    };
    const placeTarget = () => {
      target = document.querySelector(`[data-tutorial="${slide.highlightUI}"]`);
      if (!(target instanceof HTMLElement || target instanceof SVGElement)) {
        if (!cancelled) frame = window.requestAnimationFrame(placeTarget);
        return;
      }
      const style = getComputedStyle(target);
      if (style.display === "none" || style.visibility === "hidden" || target.closest("[hidden]")) {
        frame = window.requestAnimationFrame(placeTarget);
        return;
      }
      if (slide.advance.type === "playerAction") target.classList.add("tutorial-actionable");

      scrollIntoViewIfNeeded(target);

      let lastTop = target.getBoundingClientRect().top;
      let stableFrames = 0;
      const settle = () => {
        if (cancelled || !target) return;
        const next = target.getBoundingClientRect();
        stableFrames = Math.abs(next.top - lastTop) < 0.35 ? stableFrames + 1 : 0;
        lastTop = next.top;
        if (stableFrames >= 4) {
          setRect(next);
          observer?.disconnect();
          observer = new ResizeObserver(() => {
            updateRect();
          });
          observer.observe(target);
          return;
        }
        frame = window.requestAnimationFrame(settle);
      };
      frame = window.requestAnimationFrame(settle);
    };

    document.documentElement.classList.add("tutorial-scroll-locked");
    document.addEventListener("wheel", blockScroll, { capture: true, passive: false });
    document.addEventListener("touchmove", blockScroll, { capture: true, passive: false });
    document.addEventListener("keydown", blockKeyScroll, true);
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);

    setRect(null);
    placeTarget();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      target?.classList.remove("tutorial-actionable");
      document.documentElement.classList.remove("tutorial-scroll-locked");
      document.removeEventListener("wheel", blockScroll, true);
      document.removeEventListener("touchmove", blockScroll, true);
      document.removeEventListener("keydown", blockKeyScroll, true);
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [slide?.highlightUI, slide?.id, slide?.advance.type]);

  if (!slide?.highlightUI || !rect) return null;
  const pad = 8;
  const x = rect.left - pad;
  const y = rect.top - pad;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        className="tutorial-outline"
        data-testid="tutorial-spotlight"
        style={{ left: x, top: y, width: w, height: h }}
      />
    </div>
  );
}
