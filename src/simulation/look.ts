import type { CharacterLook, HairStyle, BodyType } from "./types";
import type { Rng } from "./rng";

const skins = ["#f6e0c8", "#f3d1b0", "#e0b184", "#c68642", "#8d5524", "#5c3317", "#f0d5b8"];
const hairs = ["#1a1a1a", "#4a3728", "#6b3a2a", "#c45c26", "#d4b483", "#e8e1d6", "#2c1a12", "#6b2d5b"];
const tops = ["#1d4e3a", "#2b3a55", "#c4622d", "#5b4b8a", "#3d5a4c", "#1b2230", "#8a3b2f", "#4a6fa5"];
const pants = ["#2c2c34", "#3a3a44", "#1b2230", "#4a4038", "#243024"];
const shoes = ["#111111", "#222230", "#ffffff", "#5a4632"];
const hairStyles: HairStyle[] = ["short", "long", "bun", "fade", "messy", "shaved"];
const bodies: BodyType[] = ["slim", "average", "broad"];
const archetypes = ["hoodie", "pm", "researcher", "designer", "sales", "finance", "hardware", "intern"];

export function randomLook(rng: Rng, archetype?: string): CharacterLook {
  return {
    skin: rng.pick(skins),
    hair: rng.pick(hairs),
    hairStyle: rng.pick(hairStyles),
    top: rng.pick(tops),
    pants: rng.pick(pants),
    shoes: rng.pick(shoes),
    glasses: rng.chance(0.35),
    accessory: rng.weighted([
      { item: "none" as const, weight: 6 },
      { item: "badge" as const, weight: 2 },
      { item: "headphones" as const, weight: 2 },
      { item: "scarf" as const, weight: 1 },
    ]),
    body: rng.pick(bodies),
    archetype: archetype ?? rng.pick(archetypes),
  };
}

export function founderLook(rng: Rng): CharacterLook {
  return randomLook(rng, "founder");
}
