import type { Condition, Effect, MailChoice } from "../simulation/types";

export interface EventDef {
  id: string;
  title: string;
  from: string;
  body: string;
  weight: number;
  cooldownDays: number;
  repeatable: boolean;
  conditions: Condition[];
  effects?: Effect[];
  choices?: MailChoice[];
  crisis?: {
    name: string;
    dueWeeks: number;
    skill: "research" | "engineering" | "product" | "growth";
    need: number;
    successBody: string;
    failureBody: string;
    success: Effect[];
    failure: Effect[];
  };
}

export const events: EventDef[] = [
  {
    id: "runway-note",
    title: "About the bank account",
    from: "mentor",
    body: "You are not out of money. You are, however, in a relationship with money. Watch the burn. The apartment lease does not care about your waitlist.",
    weight: 10,
    cooldownDays: 9999,
    repeatable: false,
    conditions: [{ type: "day", op: "ge", val: 6 }],
  },
  {
    id: "openbrain-drop",
    title: "OpenBrain shipped something with a number in the name",
    from: "news",
    body: "OpenBrain cut input-token prices by 45% and deprecated its oldest chat endpoint on the same day. Migration guides are trending; customers now expect every AI feature to become cheaper by the quarter.",
    weight: 6,
    cooldownDays: 90,
    repeatable: true,
    conditions: [{ type: "productsLaunched", op: "ge", val: 1 }],
    effects: [{ type: "world", value: { meter: "aiCapability", amount: 3 } }, { type: "hype", value: 4 }],
  },
  {
    id: "poach",
    title: "A recruiter is in your engineer's DMs",
    from: "people",
    body: "A frontier lab has made a written offer to one of your engineers. The compensation and runway impact are available before you decide.",
    weight: 5,
    cooldownDays: 50,
    repeatable: true,
    conditions: [{ type: "employees", op: "ge", val: 3 }],
    choices: [
      { id: "match", label: "Match the offer", effects: [{ type: "morale", value: 6 }] },
      { id: "let-go", label: "Let them walk", effects: [{ type: "loseEmployee", value: 1 }, { type: "competitorBoost", value: 1 }], consequences: ["Employee leaves immediately", "A competitor gains technical capability"] },
    ],
  },
  {
    id: "api-hike",
    title: "OpenBrain is raising API prices",
    from: "compute",
    body: "Your provider is moving the newest model family to a premium tier next month. Cached-input discounts remain, but uncached inference rises 12% across every active product using the API.",
    weight: 5,
    cooldownDays: 70,
    repeatable: true,
    conditions: [{ type: "activeProducts", op: "ge", val: 1 }],
    effects: [{ type: "computeCost", value: 0.12 }],
  },
  {
    id: "outage",
    title: "Provider outage",
    from: "compute",
    body: "A regional control-plane failure has left inference requests retrying across two zones. Enterprise status pages are now screenshotting your latency graph.",
    weight: 4,
    cooldownDays: 80,
    repeatable: true,
    conditions: [{ type: "activeProducts", op: "ge", val: 1 }],
    crisis: {
      name: "Stabilize inference",
      dueWeeks: 3,
      skill: "engineering",
      need: 40,
      successBody: "You failed over. The postmortem is already a template.",
      failureBody: "Twelve hours down. Trust is a renewable resource, in theory.",
      success: [{ type: "hype", value: 2 }],
      failure: [{ type: "trust", value: -8 }, { type: "backlash", value: 6 }],
    },
  },
  {
    id: "copyright",
    title: "A letter from a studio",
    from: "legal",
    body: "A studio's counsel identified recognizable frames in generated output and requested training-data provenance, an indemnity clause, and a preservation hold.",
    weight: 4,
    cooldownDays: 100,
    repeatable: true,
    conditions: [{ type: "hasTag", op: "has", val: "copyright" }],
    crisis: {
      name: "Copyright response",
      dueWeeks: 5,
      skill: "growth",
      need: 50,
      successBody: "A settlement. A footnote. You keep shipping.",
      failureBody: "The headline was unkind. The invoice was worse.",
      success: [{ type: "cash", value: -40000 }],
      failure: [{ type: "cash", value: -220000 }, { type: "backlash", value: 12 }],
    },
  },
  {
    id: "hallucination",
    title: "The model invented a law firm",
    from: "support",
    body: "A customer followed a fabricated citation into a nonexistent case. Their legal team has frozen the rollout while a reporter asks who approved the retrieval settings.",
    weight: 5,
    cooldownDays: 60,
    repeatable: true,
    conditions: [{ type: "activeProducts", op: "ge", val: 1 }],
    effects: [{ type: "backlash", value: 8 }, { type: "hype", value: 3 }],
  },
  {
    id: "gpu-shortage",
    title: "Lead times",
    from: "compute",
    body: "Cloud resellers moved current-generation accelerators to allocation-only. Customers with twelve-month capacity commitments get priority; on-demand queues now stretch into next quarter.",
    weight: 4,
    cooldownDays: 110,
    repeatable: true,
    conditions: [{ type: "officeLevel", op: "ge", val: 1 }],
    effects: [{ type: "computeCost", value: 0.08 }],
  },
  {
    id: "viral",
    title: "A demo escaped",
    from: "growth",
    body: "Someone on a train filmed your product doing a trick. The trick is now the company.",
    weight: 3,
    cooldownDays: 90,
    repeatable: true,
    conditions: [{ type: "productsLaunched", op: "ge", val: 1 }],
    effects: [{ type: "hype", value: 22 }, { type: "usersSpike", value: 1.4 }],
  },
  {
    id: "opensource-peer",
    title: "A free model showed up",
    from: "world",
    body: "MetaMind released weights within striking distance of last quarter's closed models. Developers are publishing migration benchmarks, and hosted inference vendors have started a price war.",
    weight: 4,
    cooldownDays: 140,
    repeatable: true,
    conditions: [{ type: "year", op: "ge", val: 2024 }],
    effects: [{ type: "world", value: { meter: "aiAdoption", amount: 5 } }, { type: "pricePressure", value: 0.12 }],
  },
  {
    id: "board-nudge",
    title: "From the observers",
    from: "board",
    body: "We remain extremely excited. We would be more excited with a chart that goes up and to the right, specifically.",
    weight: 6,
    cooldownDays: 80,
    repeatable: true,
    conditions: [{ type: "hasBoard", op: "eq", val: true }],
    effects: [{ type: "boardPressure", value: 4 }],
  },
  {
    id: "agent-meetings",
    title: "The agents are in a meeting",
    from: "infra",
    body: "Eighteen percent of company compute is currently being spent on AI agents attending meetings with other AI agents. No one scheduled this. It scheduled itself.",
    weight: 3,
    cooldownDays: 120,
    repeatable: true,
    conditions: [{ type: "automation", op: "ge", val: 35 }],
    effects: [{ type: "computeWaste", value: 0.18 }, { type: "hype", value: 6 }],
  },
  {
    id: "safety-near-miss",
    title: "A near miss",
    from: "safety",
    body: "The agent booked a flight, an API key, and a contractor. Only two of those were in the spec.",
    weight: 3,
    cooldownDays: 150,
    repeatable: true,
    conditions: [{ type: "hasTag", op: "has", val: "safety" }],
    crisis: {
      name: "Contain the agent",
      dueWeeks: 4,
      skill: "research",
      need: 70,
      successBody: "You added a wall. The demo still works, mostly.",
      failureBody: "The write-up is already on a forum. Trust moved.",
      success: [{ type: "trust", value: 4 }],
      failure: [{ type: "trust", value: -12 }, { type: "backlash", value: 14 }, { type: "world", value: { meter: "systemicRisk", amount: 4 } }],
    },
  },
  {
    id: "acquisition-inbound",
    title: "They would like to buy you",
    from: "macrosoft",
    body: "A polite email. An impolite number. Your cap table just sat up.",
    weight: 2,
    cooldownDays: 200,
    repeatable: true,
    conditions: [{ type: "arr", op: "ge", val: 2_000_000 }],
    choices: [
      { id: "sell", label: "Take the meeting to sell", effects: [{ type: "ending", value: "acquisition" }] },
      { id: "no", label: "Stay independent", effects: [{ type: "hype", value: 8 }, { type: "morale", value: 4 }] },
    ],
  },
  {
    id: "regulation-talk",
    title: "A hearing, in the abstract",
    from: "policy",
    body: "A draft bill would require developers above a compute threshold to publish standardized safety evaluations. Enterprise procurement teams are already asking vendors to map model providers against the proposed rule.",
    weight: 4,
    cooldownDays: 130,
    repeatable: true,
    conditions: [{ type: "year", op: "ge", val: 2023 }],
    effects: [{ type: "world", value: { meter: "regulation", amount: 5 } }],
  },
];
