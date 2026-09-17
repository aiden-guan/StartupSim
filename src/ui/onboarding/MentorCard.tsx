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
    let cancelled = false;
    let target: HTMLElement | SVGElement | null = null;
    let observer: ResizeObserver | null = null;
    let frame = 0;
    let resizeTimer = 0;
    const restored = new Map<HTMLElement, { overflowY: string; scrollBehavior: string; overscrollBehavior: string }>();
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
    const unlockContainers = () => {
      for (const [node, styles] of restored) {
        node.style.overflowY = styles.overflowY;
        node.style.scrollBehavior = styles.scrollBehavior;
        node.style.overscrollBehavior = styles.overscrollBehavior;
      }
      restored.clear();
    };
    const lockContainers = (parents: HTMLElement[]) => {
      for (const node of parents) {
        if (!restored.has(node)) restored.set(node, { overflowY: node.style.overflowY, scrollBehavior: node.style.scrollBehavior, overscrollBehavior: node.style.overscrollBehavior });
        node.style.overflowY = "hidden";
        node.style.overscrollBehavior = "contain";
      }
    };
    const availableBounds = (elementRect: DOMRect, container?: HTMLElement) => {
      const base = container?.getBoundingClientRect();
      let top = Math.max(12, base?.top ?? 0) + 14;
      let bottom = Math.min(window.innerHeight - 12, base?.bottom ?? window.innerHeight) - 14;
      const hud = document.querySelector(".hud-bar")?.getBoundingClientRect();
      const dock = document.querySelector(".game-dock")?.getBoundingClientRect();
      const mentor = document.querySelector("[data-tutorial-card]")?.getBoundingClientRect();
      const overlapsX = (rect?: DOMRect) => Boolean(rect && rect.left < elementRect.right + 20 && rect.right > elementRect.left - 20);
      if (hud && overlapsX(hud)) top = Math.max(top, hud.bottom + 12);
      if (dock && overlapsX(dock)) bottom = Math.min(bottom, dock.top - 12);
      if (mentor && overlapsX(mentor)) bottom = Math.min(bottom, mentor.top - 12);
      return { top, bottom };
    };
    const placeTarget = () => {
      unlockContainers();
      setRect(null);
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
      const parents = scrollParents(target);
      for (const parent of parents) {
        const current = target.getBoundingClientRect();
        const bounds = availableBounds(current, parent);
        const available = Math.max(80, bounds.bottom - bounds.top);
        const desiredTop = bounds.top + Math.max(0, (available - Math.min(current.height, available)) / 2);
        const delta = current.top - desiredTop;
        if (Math.abs(delta) > 3) {
          if (!restored.has(parent)) restored.set(parent, { overflowY: parent.style.overflowY, scrollBehavior: parent.style.scrollBehavior, overscrollBehavior: parent.style.overscrollBehavior });
          parent.style.overflowY = "auto";
          parent.style.scrollBehavior = "smooth";
          parent.scrollTo({ top: parent.scrollTop + delta, behavior: "smooth" });
        }
      }
      let lastTop = target.getBoundingClientRect().top;
      let stableFrames = 0;
      const settle = () => {
        if (cancelled || !target) return;
        const next = target.getBoundingClientRect();
        stableFrames = Math.abs(next.top - lastTop) < 0.35 ? stableFrames + 1 : 0;
        lastTop = next.top;
        if (stableFrames >= 4) {
          lockContainers(parents);
          setRect(next);
          observer?.disconnect();
          observer = new ResizeObserver(() => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(placeTarget, 80);
          });
          observer.observe(target);
          return;
        }
        frame = window.requestAnimationFrame(settle);
      };
      frame = window.requestAnimationFrame(settle);
    };
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(placeTarget, 120);
    };
    document.documentElement.classList.add("tutorial-scroll-locked");
    document.addEventListener("wheel", blockScroll, { capture: true, passive: false });
    document.addEventListener("touchmove", blockScroll, { capture: true, passive: false });
    document.addEventListener("keydown", blockKeyScroll, true);
    window.addEventListener("resize", onResize);
    placeTarget();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      window.clearTimeout(resizeTimer);
      observer?.disconnect();
      target?.classList.remove("tutorial-actionable");
      unlockContainers();
      document.documentElement.classList.remove("tutorial-scroll-locked");
      document.removeEventListener("wheel", blockScroll, true);
      document.removeEventListener("touchmove", blockScroll, true);
      document.removeEventListener("keydown", blockKeyScroll, true);
      window.removeEventListener("resize", onResize);
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
      <div className="tutorial-outline" data-testid="tutorial-spotlight" style={{ left: x, top: y, width: w, height: h }} />
    </div>
  );
}
