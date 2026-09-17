export interface OnboardDef {
  id: string;
  messages: string[];
  after?: string;
  condition?: { type: string; op: string; val: number | boolean | string };
}

export const onboarding: OnboardDef[] = [
  {
    id: "intro",
    messages: [
      "You have an apartment, a cofounder, and a small pile of cash that believes it is a company.",
      "Every company here begins the same way: make a product by combining two ideas.",
      "Open Tasks and start a product. The rest of the machine can wait.",
    ],
  },
  {
    id: "assign",
    messages: [
      "A product without people is a slide.",
      "Assign yourself and your cofounder. Skills accrue as time moves. Too many people on one task will just hold meetings about the task.",
    ],
    condition: { type: "tasks", op: "ge", val: 1 },
  },
  {
    id: "clock",
    messages: [
      "Time is a resource. Use the speeds in the top bar. Pause if you need to think; the board will not.",
    ],
    condition: { type: "productDeveloping", op: "eq", val: true },
  },
  {
    id: "designer",
    messages: [
      "Development finished. Before the market, you spend the points you earned.",
      "Deployment is how many pieces you get. Capability is how hard they hit. Distribution is how far they walk.",
    ],
    condition: { type: "readyProducts", op: "ge", val: 1 },
  },
  {
    id: "market",
    messages: [
      "The Market is not a percentage. It is a board.",
      "Move your pieces, capture customer tiles, bump the other company's product if you must. Share becomes revenue.",
    ],
    after: "designer",
  },
  {
    id: "hire",
    messages: [
      "Revenue is a trickle until you have more hands. Recruiting is under People. Cheap talent grows. Expensive talent arrives already tired.",
    ],
    condition: { type: "productsLaunched", op: "ge", val: 1 },
  },
  {
    id: "research",
    messages: [
      "Research unlocks new primitives and makes the old ones less embarrassing. Assign people who can think, not just ship.",
    ],
    condition: { type: "productsLaunched", op: "ge", val: 1 },
  },
  {
    id: "compute",
    messages: [
      "Users are not free. Inference is a second payroll. If gross margin goes negative, that can be a strategy. It can also be a hole.",
    ],
    condition: { type: "productsLaunched", op: "ge", val: 1 },
  },
  {
    id: "funding",
    messages: [
      "You can raise. The money is real. So is the chart they will want next year.",
    ],
    condition: { type: "productsLaunched", op: "ge", val: 2 },
  },
];
