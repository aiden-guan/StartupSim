import type { CharacterLook, Skills } from "../simulation/types";

export interface CofounderDef {
  id: string;
  name: string;
  title: string;
  pitch: string;
  trait: string;
  skills: Skills;
  look: CharacterLook;
  equity: number;
}

export const cofounders: CofounderDef[] = [
  {
    id: "reya",
    name: "Reya Okonkwo",
    title: "Technical Cofounder",
    pitch: "Ships it. The demo is already running on a laptop that smells like coffee.",
    trait: "ships-it",
    skills: { research: 4, engineering: 9, product: 5, growth: 2, productivity: 8 },
    equity: 0.18,
    look: {
      skin: "#8d5524",
      hair: "#1a1a1a",
      hairStyle: "short",
      top: "#1d4e3a",
      pants: "#2c2c34",
      shoes: "#111111",
      glasses: false,
      accessory: "headphones",
      body: "average",
      archetype: "hoodie",
    },
  },
  {
    id: "arjun",
    name: "Dr. Arjun Mehta",
    title: "Chief Scientist",
    pitch: "A paper machine. He will cite the scaling laws unprompted.",
    trait: "paper-machine",
    skills: { research: 10, engineering: 5, product: 3, growth: 1, productivity: 6 },
    equity: 0.16,
    look: {
      skin: "#c68642",
      hair: "#4a3728",
      hairStyle: "fade",
      top: "#2b3a55",
      pants: "#3a3a44",
      shoes: "#222230",
      glasses: true,
      accessory: "badge",
      body: "slim",
      archetype: "researcher",
    },
  },
  {
    id: "casey",
    name: "Casey Bloom",
    title: "Growth Cofounder",
    pitch: "Posts through it. Somehow already has a waitlist for a product you have not named.",
    trait: "posts",
    skills: { research: 2, engineering: 3, product: 5, growth: 10, productivity: 7 },
    equity: 0.15,
    look: {
      skin: "#f3d1b0",
      hair: "#c45c26",
      hairStyle: "messy",
      top: "#c4622d",
      pants: "#1b2230",
      shoes: "#ffffff",
      glasses: false,
      accessory: "none",
      body: "average",
      archetype: "growth",
    },
  },
  {
    id: "samir",
    name: "Samir Pell",
    title: "Product Cofounder",
    pitch: "User empathy as a personality. Will watch the session recordings so you do not have to.",
    trait: "empathy",
    skills: { research: 4, engineering: 5, product: 8, growth: 6, productivity: 6 },
    equity: 0.17,
    look: {
      skin: "#e0b184",
      hair: "#1a1a1a",
      hairStyle: "bun",
      top: "#5b4b8a",
      pants: "#2a2a32",
      shoes: "#444450",
      glasses: true,
      accessory: "scarf",
      body: "slim",
      archetype: "pm",
    },
  },
];
