import type { CharacterLook, DepartmentId, Skills } from "../simulation/types";
import { normalizeLook } from "../simulation/look";

export interface CofounderDef {
  id: string;
  name: string;
  title: string;
  pitch: string;
  /** An original line written for the game, not a quotation from this person. */
  quote: string;
  trait: string;
  skills: Skills;
  look: CharacterLook;
  equity: number;
  department: DepartmentId;
}

/** Stylized Founder Mode likenesses built entirely from the shared CharacterLook kit. */
export const cofounders: CofounderDef[] = [
  {
    id: "steve-wozniak", name: "Steve Wozniak", title: "Circuit Architect",
    pitch: "A brilliant hands-on builder. Hardware and prototypes come fast; go-to-market needs another voice.",
    quote: "Let's make the machine do something wonderful.", trait: "circuit-craft",
    skills: { research: 3, engineering: 10, product: 6, growth: 2, productivity: 7 }, equity: 0.18, department: "engineering",
    look: normalizeLook({
      skin: "#f2c8a2", hair: "#9b9da0", hairStyle: "side-part", beard: true, beardColor: "#9b9da0",
      top: "#222629", topId: "tee", pants: "#506b88", pantsId: "jeans", shoes: "#ededeb", shoesId: "sneakers",
      glassesId: "rect", accessory: "none", body: "broad", height: "avg", faceId: "round", archetype: "founder",
    }),
  },
  {
    id: "paul-allen", name: "Paul Allen", title: "Platform Builder",
    pitch: "Connects technical pieces into a platform. Brings steady systems thinking over raw launch speed.",
    quote: "The pieces become powerful when they work together.", trait: "systems-builder",
    skills: { research: 6, engineering: 8, product: 5, growth: 3, productivity: 6 }, equity: 0.17, department: "engineering",
    look: normalizeLook({
      skin: "#efc39f", hair: "#8b6545", hairStyle: "side-part",
      top: "#375b87", topId: "sweater", pants: "#b6a184", pantsId: "chinos", shoes: "#574537", shoesId: "dress",
      glassesId: "rect", accessory: "none", body: "average", height: "avg", faceId: "round", archetype: "founder",
    }),
  },
  {
    id: "larry-page", name: "Larry Page", title: "Search Systems Thinker",
    pitch: "Sees the research problem behind the product. Strong long-range bets, with a slower first launch.",
    quote: "Start with the question that changes the scale.", trait: "search-systems",
    skills: { research: 9, engineering: 6, product: 6, growth: 3, productivity: 5 }, equity: 0.19, department: "research",
    look: normalizeLook({
      skin: "#f2c8a2", hair: "#424446", hairStyle: "textured",
      top: "#62686a", topId: "jacket", pants: "#506b88", pantsId: "jeans", shoes: "#e9ebec", shoesId: "sneakers",
      glassesId: "none", accessory: "none", body: "average", height: "avg", faceId: "default", archetype: "founder",
    }),
  },
  {
    id: "sergey-brin", name: "Sergey Brin", title: "Curious Product Hacker",
    pitch: "Turns unusual research into experiments. Flexible across lab and product, less focused on distribution.",
    quote: "Try the strange idea and see what it teaches us.", trait: "prototype-loop",
    skills: { research: 8, engineering: 7, product: 5, growth: 3, productivity: 6 }, equity: 0.18, department: "research",
    look: normalizeLook({
      skin: "#efc39f", hair: "#302b29", hairStyle: "curly", beard: true, beardColor: "#302b29",
      top: "#292c2e", topId: "hoodie", pants: "#333639", pantsId: "joggers", shoes: "#e6e8e9", shoesId: "sneakers",
      glassesId: "rect", accessory: "none", body: "average", height: "avg", faceId: "angular", archetype: "founder",
    }),
  },
  {
    id: "dustin-moskovitz", name: "Dustin Moskovitz", title: "Rapid Product Engineer",
    pitch: "Builds and iterates with urgency. Great momentum early, but deeper research needs a specialist.",
    quote: "We can learn more by shipping the next version.", trait: "shipping-rhythm",
    skills: { research: 4, engineering: 8, product: 6, growth: 3, productivity: 9 }, equity: 0.16, department: "engineering",
    look: normalizeLook({
      skin: "#e9ba91", hair: "#684b37", hairStyle: "curly",
      top: "#303437", topId: "hoodie", pants: "#4a6788", pantsId: "jeans", shoes: "#e9e9e7", shoesId: "sneakers",
      glassesId: "none", accessory: "none", body: "average", height: "avg", faceId: "round", archetype: "founder",
    }),
  },
  {
    id: "greg-brockman", name: "Greg Brockman", title: "AI Infrastructure Lead",
    pitch: "Builds the systems that keep ambitious models running. Strong on compute; weaker on customer acquisition.",
    quote: "Make the infrastructure ready for what comes next.", trait: "infrastructure-scaler",
    skills: { research: 7, engineering: 8, product: 4, growth: 2, productivity: 8 }, equity: 0.18, department: "engineering",
    look: normalizeLook({
      skin: "#efc39f", hair: "#49392d", hairStyle: "swept",
      top: "#25282b", topId: "jacket", pants: "#303437", pantsId: "trousers", shoes: "#25272a", shoesId: "dress",
      glassesId: "none", accessory: "none", body: "average", height: "avg", faceId: "angular", archetype: "founder",
    }),
  },
  {
    id: "marc-randolph", name: "Marc Randolph", title: "Launch Operator",
    pitch: "Finds the audience and the business model. Strong product instincts; technical depth needs a partner.",
    quote: "Put the idea in front of people and listen.", trait: "launch-operator",
    skills: { research: 2, engineering: 3, product: 8, growth: 9, productivity: 6 }, equity: 0.15, department: "marketing",
    look: normalizeLook({
      skin: "#efc39f", hair: "#a4a6a5", hairStyle: "balding", beard: true, beardColor: "#919491",
      top: "#2b2e30", topId: "hoodie", pants: "#506b88", pantsId: "jeans", shoes: "#ededeb", shoesId: "sneakers",
      glassesId: "none", accessory: "none", body: "average", height: "avg", faceId: "round", archetype: "founder",
    }),
  },
  {
    id: "eduardo-saverin", name: "Eduardo Saverin", title: "Early Growth Strategist",
    pitch: "Opens doors and thinks about capital. Excellent reach, with less hands-on engineering capacity.",
    quote: "A great idea still needs a way to grow.", trait: "capital-connector",
    skills: { research: 3, engineering: 3, product: 6, growth: 10, productivity: 6 }, equity: 0.15, department: "finance",
    look: normalizeLook({
      skin: "#e9ba91", hair: "#302820", hairStyle: "swept",
      top: "#2d4972", topId: "blazer", pants: "#b6a184", pantsId: "chinos", shoes: "#564335", shoesId: "dress",
      glassesId: "none", accessory: "none", body: "average", height: "avg", faceId: "angular", archetype: "founder",
    }),
  },
];

// Old setup inputs still resolve. Saved companies hold an employee snapshot,
// so their existing cofounders, names, and appearances remain untouched.
const legacyCofounderIds: Record<string, string> = {
  reya: "dustin-moskovitz", arjun: "larry-page", casey: "eduardo-saverin", samir: "marc-randolph",
};

export function resolveCofounder(id: string): CofounderDef {
  return cofounders.find((cofounder) => cofounder.id === (legacyCofounderIds[id] ?? id)) ?? cofounders[0]!;
}
