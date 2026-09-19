import type { GameState } from "../simulation/types";
import type { FeedbackEvent } from "./feedbackEvents";

export function feedbackMotionPolicy(event: FeedbackEvent, settings: Pick<GameState["settings"], "reducedMotion" | "graphics">) {
  const allowMotion = !settings.reducedMotion;
  return {
    camera: allowMotion && ["office.upgraded", "funding.closed", "milestone"].includes(event.type),
    characterReaction: allowMotion && ["launch.result", "launch.homecoming", "funding.closed", "milestone", "acquisition"].includes(event.type),
    durationMs: event.type === "office.upgraded" ? 2700 : event.tier >= 5 ? 2300 : 1450,
    // The current effects use no particle system; lower quality keeps the same readable feedback.
    detail: settings.graphics === "low" ? "simple" : "standard" as "simple" | "standard",
  };
}
