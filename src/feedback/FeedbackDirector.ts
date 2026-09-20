import { audio, type SfxId } from "../audio/Audio";
import type { GameState } from "../simulation/types";
import type { FeedbackEvent, FeedbackKind } from "./feedbackEvents";

type Listener = (event: FeedbackEvent) => void;
const listeners = new Set<Listener>();
let recent: { events: FeedbackEvent[]; at: number } | null = null;

export function subscribeFeedback(listener: Listener, replayRecent = false): () => void {
  listeners.add(listener);
  if (replayRecent && recent && Date.now() - recent.at < 750)
    for (const event of recent.events) listener(event);
  return () => { listeners.delete(listener); };
}

export const FEEDBACK_SOUND_MAP: Partial<Record<FeedbackKind, SfxId>> = {
  "ui.select": "ui.select", assignment: "ui.click", "product.started": "ui.select",
  "product.ready": "product.ready", "product.launching": "product.launch", "product.launched": "market.capture", "launch.result": "market.capture",
  "research.started": "ui.select", "research.completed": "research", "employee.hired": "people.stamp",
  // Burnout is a routine operational warning; reserve the error cue for critical incidents.
  "employee.fired": "money.spend", "employee.burnout": "message", "funding.closed": "business.major",
  "office.upgraded": "business.major", "location.opened": "business.major", "market.move": "ui.click",
  "market.captured": "market.capture", "market.rival": "market.rival", "crisis.started": "crisis",
  "message.received": "message", "social.received": "message", "achievement.unlocked": "product.ready",
  "money.gained": "money.gain", "money.spent": "money.spend", milestone: "business.major",
  acquisition: "business.major", ending: "business.major",
};

const emphasis: Partial<Record<FeedbackKind, number>> = {
  "product.launching": 9, "product.launched": 9, "product.ready": 8, "office.upgraded": 8, "funding.closed": 8,
  "market.captured": 7, "research.completed": 6, "employee.hired": 5,
  "achievement.unlocked": 4, "money.gained": 3, "money.spent": 3,
};

export function presentFeedback(events: FeedbackEvent[], settings: GameState["settings"]): void {
  if (!events.length) return;
  recent = { events, at: Date.now() };
  // One sound per command prevents a funding/achievement/milestone pileup.
  const chosen = [...events].sort((a, b) => b.tier - a.tier || (emphasis[b.type] ?? 0) - (emphasis[a.type] ?? 0))[0]!;
  const cue = FEEDBACK_SOUND_MAP[chosen.type];
  if (cue) audio.playSfx(cue, settings);
  if (chosen.tier >= 4) audio.duck(chosen.tier === 5 ? 2.2 : 1.25, chosen.tier === 5 ? .42 : .55);
  for (const event of events) for (const listener of listeners) listener(event);
}
