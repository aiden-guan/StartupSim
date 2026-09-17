import { onboarding, type TutorialSlide } from "../data/onboarding";
import type { GameState } from "./types";

export function currentTutorialStep(state: GameState) {
  if (!state.pendingMentor) return null;
  return onboarding.find((step) => step.id === state.pendingMentor) ?? null;
}

export function currentTutorialSlide(state: GameState): TutorialSlide | null {
  const step = currentTutorialStep(state);
  if (!step) return null;
  return step.slides[state.onboarding.slideIndex] ?? step.slides[0] ?? null;
}

export function applyAdvanceMentor(state: GameState): void {
  const step = currentTutorialStep(state);
  if (!step) return;
  const last = step.slides.length - 1;
  if (state.onboarding.slideIndex < last) {
    state.onboarding.slideIndex += 1;
    const next = step.slides[state.onboarding.slideIndex];
    if (next?.pauseGame) {
      state.clock.paused = true;
      state.clock.reasonPaused = "Mentor";
    }
    return;
  }
  finishMentorStep(state);
}

export function applyBackMentor(state: GameState): void {
  if (!state.pendingMentor) return;
  if (state.onboarding.slideIndex <= 0) return;
  state.onboarding.slideIndex -= 1;
}

export function finishMentorStep(state: GameState): void {
  if (!state.pendingMentor) return;
  if (!state.onboarding.finished.includes(state.pendingMentor)) {
    state.onboarding.finished.push(state.pendingMentor);
  }
  state.pendingMentor = null;
  state.onboarding.slideIndex = 0;
  state.clock.paused = false;
  state.clock.reasonPaused = null;
}

export function skipTutorial(state: GameState): void {
  state.onboarding.tutorialEnabled = false;
  state.onboarding.finished = onboarding.map((step) => step.id);
  state.onboarding.slideIndex = 0;
  state.onboarding.revealDone = true;
  state.pendingMentor = null;
  state.clock.paused = false;
  state.clock.reasonPaused = null;
}

export function slideWantsAction(state: GameState, action: string): boolean {
  const slide = currentTutorialSlide(state);
  return slide?.advance.type === "playerAction" && slide.advance.action === action;
}
