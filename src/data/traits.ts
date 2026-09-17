import type { SkillName } from "../simulation/types";

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  worker?: Partial<Record<SkillName | "happiness" | "burnoutRate" | "minSalary" | "loyalty" | "ethics", number>>;
  company?: Partial<Record<SkillName | "happiness" | "burnoutRate" | "hype" | "backlash" | "prestige", number>>;
}

export const traits: TraitDef[] = [
  { id: "10x", name: "10x Engineer", description: "Ships like three people. Communicates like one.", worker: { engineering: 8, productivity: 4, happiness: -1 } },
  { id: "academic", name: "Academic", description: "Cites papers in standups.", worker: { research: 8, product: -2, growth: -2 } },
  { id: "hacker", name: "Hacker", description: "Will duct-tape production if you look away.", worker: { engineering: 5, productivity: 3, ethics: -1 } },
  { id: "ex-founder", name: "Ex-Founder", description: "Has opinions about your board deck.", worker: { growth: 4, product: 3 } },
  { id: "influencer", name: "Influencer", description: "The launch is the content.", worker: { growth: 8 }, company: { hype: 2 } },
  { id: "enterprise", name: "Enterprise Whisperer", description: "Speaks fluent procurement.", worker: { growth: 6, product: 2 } },
  { id: "infra", name: "Infra Wizard", description: "Keeps the GPUs from catching fire.", worker: { engineering: 6, research: 2 } },
  { id: "jerk", name: "Brilliant Jerk", description: "Correct, loudly.", worker: { research: 5, engineering: 5, happiness: -4 }, company: { happiness: -1 } },
  { id: "mission", name: "Mission-Driven", description: "Will stay late for the story, not the stock.", worker: { loyalty: 3, minSalary: 0.92, ethics: 2 } },
  { id: "mercenary", name: "Mercenary", description: "Compensation is the culture.", worker: { minSalary: 1.2, loyalty: -2, productivity: 2 } },
  { id: "burnout-prone", name: "Burnout Prone", description: "Cares until they cannot.", worker: { burnoutRate: 0.03, productivity: 1 } },
  { id: "workaholic", name: "Workaholic", description: "Treats sleep as a rumor.", worker: { productivity: 5, burnoutRate: 0.02, happiness: -2 } },
  { id: "great-manager", name: "Great Manager", description: "Makes six people feel like four.", company: { productivity: 2, happiness: 1 } },
  { id: "bad-manager", name: "Bad Manager", description: "Meetings about meetings.", company: { productivity: -2 } },
  { id: "remote", name: "Remote Native", description: "Exists mainly as a well-lit rectangle.", worker: { happiness: 2 } },
  { id: "model-whisperer", name: "Model Whisperer", description: "Talks to base models like they are horses.", worker: { research: 6, engineering: 3 } },
  { id: "safety", name: "Safety Researcher", description: "Asks what happens if it works too well.", worker: { research: 5, ethics: 3 }, company: { backlash: -1 } },
  { id: "hardware", name: "Hardware Expert", description: "Thinks the cloud is a lifestyle choice.", worker: { engineering: 4, research: 3 } },
  { id: "ships-it", name: "Ships It", description: "Done is better than perfect, and they mean it.", worker: { productivity: 4, product: 2, research: -1 } },
  { id: "paper-machine", name: "Paper Machine", description: "A preprint is a product, in a sense.", worker: { research: 7, growth: -3 } },
  { id: "posts", name: "Posts Through It", description: "The strategy is a thread.", worker: { growth: 7, research: -2 }, company: { hype: 1 } },
  { id: "empathy", name: "User Empathy", description: "Has actually watched someone use the thing.", worker: { product: 6, growth: 2 } },
  { id: "tireless", name: "Tireless", description: "Does not burn out. This worries HR.", worker: { burnoutRate: -99 } },
  { id: "team", name: "Team Player", description: "The glue, and they know it.", company: { productivity: 1, happiness: 1 } },
  { id: "chill", name: "Chill", description: "Lowers the temperature. Also the velocity.", worker: { productivity: -3, burnoutRate: -0.01 }, company: { burnoutRate: -0.005 } },
  { id: "unicorn", name: "Unicorn", description: "Good at everything. Priced accordingly.", worker: { research: 4, engineering: 4, product: 4, growth: 4, minSalary: 1.35 } },
  { id: "intern-energy", name: "Intern Energy", description: "Will do anything once.", worker: { productivity: 3, minSalary: 0.7, research: -1 } },
  { id: "sales", name: "Closer", description: "Leaves every room with a verbal yes.", worker: { growth: 7, product: -1 } },
  { id: "designer", name: "Taste", description: "Deletes your favorite feature.", worker: { product: 7, engineering: -1 } },
  { id: "quant", name: "Quant", description: "Wants a dashboard for the dashboard.", worker: { research: 3, product: 3, engineering: 2 } },
  { id: "policy", name: "Policy Nerd", description: "Reads the Federal Register for fun.", worker: { growth: 3, ethics: 2 } },
  { id: "roboticist", name: "Roboticist", description: "Keeps a torque wrench in the backpack.", worker: { engineering: 5, research: 4 } },
  { id: "bio", name: "Wet-Lab Native", description: "Knows which fridge not to open.", worker: { research: 6 } },
  { id: "anxious", name: "Anxious Operator", description: "The outage is already happening in their head.", worker: { engineering: 2, happiness: -3 } },
  { id: "optimist", name: "Optimist", description: "The round will close. The model will converge.", worker: { happiness: 4, growth: 2 } },
  { id: "skeptic", name: "Skeptic", description: "Has a spreadsheet for your vision.", worker: { product: 3, growth: -2, ethics: 1 } },
  { id: "night-owl", name: "Night Owl", description: "Standup is a hate crime.", worker: { productivity: 2, happiness: -1 } },
  { id: "generalist", name: "Generalist", description: "Useful until the org chart arrives.", worker: { research: 2, engineering: 2, product: 2, growth: 2 } },
  { id: "ex-faang", name: "Ex-Big Tech", description: "Knows how to run a meeting that could have been a process.", worker: { engineering: 3, growth: 2, minSalary: 1.15 } },
  { id: "open-source", name: "Open-Source Loyalist", description: "Will leak the weights in their heart.", worker: { engineering: 3, ethics: 2, minSalary: 0.88 } },
  { id: "security", name: "Paranoid", description: "The threat model includes the intern.", worker: { engineering: 4 } },
  { id: "storyteller", name: "Storyteller", description: "Turns a demo into a religion.", worker: { growth: 6, product: 2 } },
  { id: "operator", name: "Operator", description: "Makes the company exist on Tuesdays.", worker: { productivity: 4, product: 2 } },
  { id: "researcher-in-residence", name: "Frontier Mind", description: "Too expensive to lose, too distracted to manage.", worker: { research: 10, minSalary: 1.5, product: -3 } },
  { id: "support-hero", name: "Support Hero", description: "Has read every angry email twice.", worker: { product: 4, happiness: 2 } },
  { id: "recruiter", name: "Talent Magnet", description: "People take the call.", company: { prestige: 2 } },
  { id: "lawyer", name: "In-House Counsel Energy", description: "The fun kind of no.", worker: { growth: 2, ethics: 2 } },
  { id: "finance", name: "Spreadsheet Saint", description: "Runway is a lifestyle.", worker: { product: 1, growth: 2 } },
  { id: "artist", name: "Latent Artist", description: "Cares about the generations.", worker: { product: 5, research: 1 } },
  { id: "agentic", name: "Agentic", description: "Wants everything to have a loop.", worker: { research: 3, engineering: 3, product: 2 } },
];

export const traitById = Object.fromEntries(traits.map((t) => [t.id, t]));
