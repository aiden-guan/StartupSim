import { normalizeLook } from "../../simulation/look";
import type { CharacterLook } from "../../simulation/types";

export const MENTOR_LOOK: CharacterLook = normalizeLook({
  skin: "#c68642",
  hair: "#d4b483",
  hairStyle: "swept",
  top: "#1b2230",
  pants: "#2c2c34",
  shoes: "#111111",
  glasses: true,
  accessory: "coffee",
  body: "average",
  archetype: "mentor",
  topId: "vest",
  pantsId: "trousers",
  shoesId: "dress",
  glassesId: "round",
  height: "avg",
  faceId: "angular",
});
