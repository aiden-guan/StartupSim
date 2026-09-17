import type {
  AccessoryId,
  BodyType,
  CharacterLook,
  FaceId,
  GlassesId,
  HairStyle,
  HeightId,
  PantsId,
  ShoesId,
  TopId,
} from "./types";
import { Rng } from "./rng";

export const SKIN_TONES = ["#f6e0c8", "#f3d1b0", "#f2c8a2", "#e0b184", "#c68642", "#8d5524", "#5c3317", "#3b2216", "#f0d5b8"];
export const HAIR_COLORS = ["#1a1a1a", "#4a3728", "#6b3a2a", "#c45c26", "#d4b483", "#e8e1d6", "#2c1a12", "#6b2d5b"];
export const TOP_COLORS = ["#1d4e3a", "#2b3a55", "#c4622d", "#5b4b8a", "#3d5a4c", "#1b2230", "#8a3b2f", "#4a6fa5", "#d8d1c4"];
export const PANTS_COLORS = ["#2c2c34", "#3a3a44", "#1b2230", "#4a4038", "#243024", "#6a5a4a"];
export const SHOE_COLORS = ["#111111", "#222230", "#ffffff", "#5a4632", "#c4622d"];

export const HAIR_STYLES: HairStyle[] = [
  "buzz",
  "fade",
  "short",
  "messy",
  "side-part",
  "curly",
  "long",
  "bun",
  "ponytail",
  "swept",
  "bald",
  "textured",
  "beanie",
  "balding",
];
export const BODIES: BodyType[] = ["slim", "average", "broad"];
export const HEIGHTS: HeightId[] = ["short", "avg", "tall"];
export const TOP_IDS: TopId[] = ["tee", "turtleneck", "hoodie", "sweater", "overshirt", "blazer", "vest", "jacket", "labcoat", "techjacket"];
export const PANTS_IDS: PantsId[] = ["jeans", "chinos", "joggers", "trousers"];
export const SHOES_IDS: ShoesId[] = ["sneakers", "dress", "boots", "runners"];
export const GLASSES_IDS: GlassesId[] = ["none", "round", "rect"];
export const ACCESSORIES: AccessoryId[] = ["none", "badge", "headphones", "scarf", "watch", "coffee", "phone", "notebook", "backpack"];
export const FACE_IDS: FaceId[] = ["default", "round", "angular"];
export const ARCHETYPES = ["hoodie", "pm", "researcher", "designer", "sales", "finance", "hardware", "intern", "founder"];

const LEGACY_HAIR: Record<string, HairStyle> = {
  shaved: "bald",
  short: "short",
  long: "long",
  bun: "bun",
  fade: "fade",
  messy: "messy",
};

const ARCHETYPE_TOP: Record<string, TopId> = {
  hoodie: "hoodie",
  researcher: "sweater",
  growth: "jacket",
  pm: "overshirt",
  founder: "tee",
  designer: "overshirt",
  sales: "vest",
  finance: "blazer",
  hardware: "techjacket",
  intern: "tee",
};

export function normalizeLook(raw: Partial<CharacterLook> | null | undefined): CharacterLook {
  const hairStyle = LEGACY_HAIR[raw?.hairStyle ?? ""] ?? (HAIR_STYLES.includes(raw?.hairStyle as HairStyle) ? (raw!.hairStyle as HairStyle) : "short");
  const glasses = Boolean(raw?.glasses) || raw?.glassesId === "round" || raw?.glassesId === "rect";
  const glassesId: GlassesId = raw?.glassesId && raw.glassesId !== "none" ? raw.glassesId : glasses ? "rect" : "none";
  const accessory = (ACCESSORIES.includes(raw?.accessory as AccessoryId) ? raw?.accessory : "none") as AccessoryId;
  return {
    beard: raw?.beard ?? false,
    beardColor: raw?.beardColor,
    skin: raw?.skin ?? SKIN_TONES[0]!,
    hair: raw?.hair ?? HAIR_COLORS[0]!,
    hairStyle,
    top: raw?.top ?? TOP_COLORS[0]!,
    pants: raw?.pants ?? PANTS_COLORS[0]!,
    shoes: raw?.shoes ?? SHOE_COLORS[0]!,
    glasses: glassesId !== "none",
    accessory,
    body: BODIES.includes(raw?.body as BodyType) ? (raw!.body as BodyType) : "average",
    archetype: raw?.archetype ?? "intern",
    topId: TOP_IDS.includes(raw?.topId as TopId) ? (raw!.topId as TopId) : (ARCHETYPE_TOP[raw?.archetype ?? ""] ?? "tee"),
    pantsId: PANTS_IDS.includes(raw?.pantsId as PantsId) ? (raw!.pantsId as PantsId) : "jeans",
    shoesId: SHOES_IDS.includes(raw?.shoesId as ShoesId) ? (raw!.shoesId as ShoesId) : "sneakers",
    glassesId,
    height: HEIGHTS.includes(raw?.height as HeightId) ? (raw!.height as HeightId) : "avg",
    faceId: FACE_IDS.includes(raw?.faceId as FaceId) ? (raw!.faceId as FaceId) : "default",
  };
}

export function randomLook(rng: Rng, archetype?: string): CharacterLook {
  const arch = archetype ?? rng.pick(ARCHETYPES);
  return normalizeLook({
    skin: rng.pick(SKIN_TONES),
    hair: rng.pick(HAIR_COLORS),
    hairStyle: rng.pick(HAIR_STYLES),
    top: rng.pick(TOP_COLORS),
    pants: rng.pick(PANTS_COLORS),
    shoes: rng.pick(SHOE_COLORS),
    glasses: rng.chance(0.35),
    accessory: rng.weighted([
      { item: "none" as const, weight: 5 },
      { item: "badge" as const, weight: 2 },
      { item: "headphones" as const, weight: 2 },
      { item: "scarf" as const, weight: 1 },
      { item: "watch" as const, weight: 2 },
      { item: "coffee" as const, weight: 1 },
    ]),
    body: rng.pick(BODIES),
    height: rng.pick(HEIGHTS),
    faceId: rng.pick(FACE_IDS),
    archetype: arch,
    topId: ARCHETYPE_TOP[arch] ?? rng.pick(TOP_IDS),
    pantsId: rng.pick(PANTS_IDS),
    shoesId: rng.pick(SHOES_IDS),
    glassesId: rng.chance(0.35) ? rng.pick(["round", "rect"] as const) : "none",
  });
}

export function founderLook(rng: Rng): CharacterLook {
  return randomLook(rng, "founder");
}

export const DEFAULT_FOUNDER_LOOK: CharacterLook = normalizeLook({
  skin: "#f3d1b0",
  hair: "#4a3728",
  hairStyle: "swept",
  top: "#2b3a55",
  pants: "#3a3a44",
  shoes: "#ffffff",
  glasses: false,
  accessory: "none",
  body: "average",
  archetype: "founder",
  topId: "tee",
  pantsId: "jeans",
  shoesId: "sneakers",
  glassesId: "none",
  height: "avg",
  faceId: "default",
});

export function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0 || 1;
}

export function lookFromSeed(seed: number | string, archetype?: string): CharacterLook {
  const n = typeof seed === "string" ? hashSeed(seed) : seed >>> 0 || 1;
  return randomLook(new Rng(n), archetype);
}
