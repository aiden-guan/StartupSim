import type { Condition } from "../simulation/types";

export interface TutorialSlide {
  id: string;
  speaker?: { type: "mentor" | "cofounder" | "system"; id?: string };
  text: string;
  focus?: {
    type: "employee" | "officeObject" | "ui" | "camera" | "none";
    id?: string;
    position?: [number, number, number];
    target?: [number, number, number];
  };
  highlightUI?: string;
  advance:
    | { type: "nextButton" }
    | { type: "playerAction"; action: string }
    | { type: "condition"; condition: Condition };
  pauseGame?: boolean;
  skippable?: boolean;
}

export interface OnboardDef {
  id: string;
  slides: TutorialSlide[];
  after?: string;
  condition?: { type: string; op: string; val: number | boolean | string };
}

export const onboarding: OnboardDef[] = [
  {
    id: "intro",
    slides: [
      {
        id: "intro-1",
        speaker: { type: "mentor" },
        text: "Running an AI company isn't easy. Fortunately, investors have recently decided this is everyone's problem.",
        focus: { type: "camera", id: "overview" },
        advance: { type: "nextButton" },
        pauseGame: true,
      },
      {
        id: "intro-2",
        speaker: { type: "mentor" },
        text: "For now, headquarters is your apartment.",
        focus: { type: "camera", id: "overview" },
        advance: { type: "nextButton" },
        pauseGame: true,
      },
      {
        id: "intro-3",
        speaker: { type: "mentor" },
        text: "And this is your cofounder.",
        focus: { type: "employee", id: "cofounder" },
        advance: { type: "nextButton" },
        pauseGame: true,
      },
      {
        id: "intro-4",
        speaker: { type: "mentor" },
        text: "You have two laptops, some API credits, and no product.",
        focus: { type: "officeObject", id: "founderDesk" },
        advance: { type: "nextButton" },
        pauseGame: true,
      },
      {
        id: "intro-5",
        speaker: { type: "mentor" },
        text: "Let's fix the last part.",
        focus: { type: "ui", id: "new-product" },
        highlightUI: "new-product",
        advance: { type: "playerAction", action: "openTasks" },
        pauseGame: true,
      },
      {
        id: "intro-6",
        speaker: { type: "mentor" },
        text: "Products are created by combining technologies.",
        highlightUI: "primitive-a",
        focus: { type: "ui", id: "primitive-a" },
        advance: { type: "nextButton" },
        pauseGame: true,
      },
      {
        id: "intro-7",
        speaker: { type: "mentor" },
        text: "Start simple. Chat and writing will do.",
        highlightUI: "start-product",
        focus: { type: "ui", id: "start-product" },
        advance: { type: "playerAction", action: "startProduct" },
        pauseGame: true,
      },
    ],
  },
  {
    id: "assign",
    condition: { type: "tasks", op: "ge", val: 1 },
    slides: [
      {
        id: "assign-1",
        speaker: { type: "mentor" },
        text: "Now someone has to build it.",
        focus: { type: "employee", id: "founder" },
        highlightUI: "assign-crew",
        advance: { type: "playerAction", action: "assign" },
        pauseGame: true,
      },
    ],
  },
  {
    id: "clock",
    condition: { type: "productDeveloping", op: "eq", val: true },
    slides: [
      {
        id: "clock-1",
        speaker: { type: "mentor" },
        text: "Good. Time is also a resource.",
        highlightUI: "speed-controls",
        focus: { type: "ui", id: "speed-controls" },
        advance: { type: "playerAction", action: "setSpeed" },
        pauseGame: true,
      },
    ],
  },
  {
    id: "designer",
    condition: { type: "readyProducts", op: "ge", val: 1 },
    slides: [
      {
        id: "designer-1",
        speaker: { type: "mentor" },
        text: "It shipped. Before the market, you spend the points you earned.",
        highlightUI: "products-nav",
        focus: { type: "ui", id: "products-nav" },
        advance: { type: "nextButton" },
        pauseGame: true,
      },
      {
        id: "designer-2",
        speaker: { type: "mentor" },
        text: "Deployment is how many pieces you get. Capability is how hard they hit. Distribution is how far they walk.",
        highlightUI: "designer",
        advance: { type: "nextButton" },
        pauseGame: true,
      },
    ],
  },
  {
    id: "market",
    after: "designer",
    slides: [
      {
        id: "market-1",
        speaker: { type: "mentor" },
        text: "The Market is not a percentage. It is a board.",
        highlightUI: "enter-market",
        advance: { type: "nextButton" },
        pauseGame: true,
      },
      {
        id: "market-2",
        speaker: { type: "mentor" },
        text: "Move your pieces, capture customer tiles, bump the other company if you must. Share becomes revenue.",
        highlightUI: "enter-market",
        advance: { type: "nextButton" },
        pauseGame: true,
      },
    ],
  },
  {
    id: "hire",
    condition: { type: "productsLaunched", op: "ge", val: 1 },
    slides: [
      {
        id: "hire-1",
        speaker: { type: "mentor" },
        text: "Revenue is a trickle until you have more hands. Cheap talent grows. Expensive talent arrives already tired.",
        highlightUI: "hiring-nav",
        advance: { type: "nextButton" },
        pauseGame: true,
      },
    ],
  },
  {
    id: "research",
    condition: { type: "productsLaunched", op: "ge", val: 1 },
    slides: [
      {
        id: "research-1",
        speaker: { type: "mentor" },
        text: "Research unlocks new primitives and makes the old ones less embarrassing.",
        highlightUI: "research-nav",
        advance: { type: "nextButton" },
        pauseGame: true,
      },
    ],
  },
  {
    id: "compute",
    condition: { type: "productsLaunched", op: "ge", val: 1 },
    slides: [
      {
        id: "compute-1",
        speaker: { type: "mentor" },
        text: "Users are not free. Inference is a second payroll.",
        highlightUI: "compute-nav",
        advance: { type: "nextButton" },
        pauseGame: true,
      },
    ],
  },
  {
    id: "funding",
    condition: { type: "productsLaunched", op: "ge", val: 2 },
    slides: [
      {
        id: "funding-1",
        speaker: { type: "mentor" },
        text: "You can raise more money. This will create more problems.",
        highlightUI: "funding-nav",
        advance: { type: "nextButton" },
        pauseGame: true,
      },
    ],
  },
];

export const onboardingById = Object.fromEntries(onboarding.map((step) => [step.id, step]));
