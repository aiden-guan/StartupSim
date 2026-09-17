export type CharacterActivity = "idle" | "walking" | "working" | "talking" | "coffee" | "celebrate" | "tired" | "sit" | "whiteboard" | "meeting";

/** Clip names match kit activities so a future GLB can swap in without changing callers. */
export const ACTIVITY_CLIPS: Record<CharacterActivity, string> = {
  idle: "idle",
  walking: "walk",
  working: "work",
  talking: "talk",
  coffee: "coffee",
  whiteboard: "whiteboard",
  meeting: "meeting",
  celebrate: "celebrate",
  tired: "tired-idle",
  sit: "sit",
};

export function setActivity(next: CharacterActivity): CharacterActivity {
  return next;
}

export function clipForActivity(activity: CharacterActivity): string {
  return ACTIVITY_CLIPS[activity];
}
