export interface TechDef {
  id: string;
  name: string;
  era: 1 | 2 | 3 | 4 | 5;
  description: string;
  cost: number;
  requiredProgress: number;
  requires: string[];
  requiredVertical?: string;
  hiddenUntil?: string[];
  unlockPrimitives?: string[];
  unlockProjects?: string[];
  effects?: { type: string; value: number | Record<string, unknown> }[];
}

export const technologies: TechDef[] = [
  { id: "prompt-engineering", name: "Prompt Engineering", era: 1, description: "The wrappers learn to ask nicely.", cost: 12_000, requiredProgress: 80, requires: [], unlockPrimitives: ["code"] },
  { id: "embeddings", name: "Embeddings", era: 1, description: "Meaning, as a vector.", cost: 18_000, requiredProgress: 100, requires: [], unlockPrimitives: ["retrieval"] },
  { id: "fine-tuning", name: "Fine-Tuning", era: 1, description: "A smaller model that sounds like you.", cost: 22_000, requiredProgress: 110, requires: ["prompt-engineering"], effects: [{ type: "reliability", value: 0.04 }] },
  { id: "rlhf", name: "RLHF", era: 1, description: "Humans, rating the machine, until the machine rates better.", cost: 40_000, requiredProgress: 140, requires: ["fine-tuning"], effects: [{ type: "trust", value: 4 }] },
  { id: "retrieval", name: "Retrieval", era: 1, description: "Look it up before you make it up.", cost: 28_000, requiredProgress: 120, requires: ["embeddings"], unlockPrimitives: ["memory"] },
  { id: "multimodality", name: "Multimodality", era: 1, description: "Pixels, waves, tokens: one throat.", cost: 55_000, requiredProgress: 160, requires: ["prompt-engineering"], unlockPrimitives: ["voice", "video", "avatar", "vision"] },
  { id: "efficient-inference", name: "Efficient Inference", era: 1, description: "The same answer, fewer watts.", cost: 35_000, requiredProgress: 130, requires: ["prompt-engineering"], effects: [{ type: "computeCost", value: -0.12 }] },
  { id: "reasoning", name: "Reasoning", era: 2, description: "It thinks, or performs thinking, which is close enough for a demo.", cost: 90_000, requiredProgress: 200, requires: ["rlhf"], unlockPrimitives: ["reasoning"] },
  { id: "tool-use", name: "Tool Use", era: 2, description: "The model is handed a screwdriver.", cost: 80_000, requiredProgress: 180, requires: ["retrieval"], unlockPrimitives: ["browser", "security"] },
  { id: "long-context", name: "Long Context", era: 2, description: "The meeting notes from 2023 are still in there.", cost: 70_000, requiredProgress: 170, requires: ["retrieval"], effects: [{ type: "productBonus", value: { attribute: "capability", amount: 1 } }] },
  { id: "agents", name: "Agents", era: 2, description: "Loops. Tools. Regret.", cost: 120_000, requiredProgress: 220, requires: ["tool-use", "reasoning"], unlockPrimitives: ["agent", "workflow"] },
  { id: "computer-use", name: "Computer Use", era: 2, description: "Click. Type. File. Repeat.", cost: 150_000, requiredProgress: 240, requires: ["agents"], unlockPrimitives: ["computer-use"] },
  { id: "synthetic-data", name: "Synthetic Data", era: 2, description: "The model teaching the model, with extra steps.", cost: 100_000, requiredProgress: 200, requires: ["fine-tuning"], effects: [{ type: "researchSpeed", value: 0.08 }] },
  { id: "distillation", name: "Model Distillation", era: 2, description: "A smaller student of a larger rumor.", cost: 110_000, requiredProgress: 210, requires: ["efficient-inference"], effects: [{ type: "computeCost", value: -0.1 }] },
  { id: "world-models", name: "World Models", era: 3, description: "An inner physics engine, approximately.", cost: 400_000, requiredProgress: 320, requires: ["reasoning", "multimodality"], unlockPrimitives: ["world-model", "simulation"], hiddenUntil: ["reasoning"] },
  { id: "autonomous-research", name: "Autonomous Research", era: 4, description: "The lab notebook fills itself.", cost: 1_200_000, requiredProgress: 400, requires: ["agents", "world-models"], unlockPrimitives: ["auto-research"], unlockProjects: ["autonomous-lab"], hiddenUntil: ["agents"] },
  { id: "robotics", name: "General Robotics", era: 4, description: "Hands.", cost: 900_000, requiredProgress: 380, requires: ["computer-use", "world-models"], unlockPrimitives: ["robotics"], requiredVertical: "robotics", unlockProjects: ["robot-line"] },
  { id: "chip-design", name: "AI Chip Design", era: 3, description: "The model wants its own silicon.", cost: 2_000_000, requiredProgress: 360, requires: ["efficient-inference"], unlockPrimitives: ["hardware"], requiredVertical: "hardware", unlockProjects: ["custom-chip"] },
  { id: "ai-science", name: "AI Science", era: 4, description: "Discovery as a batch job.", cost: 800_000, requiredProgress: 340, requires: ["autonomous-research"], unlockPrimitives: ["science"], requiredVertical: "science" },
  { id: "ai-biology", name: "AI Biology", era: 4, description: "Life, compiled.", cost: 1_000_000, requiredProgress: 360, requires: ["ai-science"], unlockPrimitives: ["biology"], requiredVertical: "biotech" },
  { id: "energy-systems", name: "AI Energy Systems", era: 3, description: "Power purchase agreements with opinions.", cost: 1_500_000, requiredProgress: 300, requires: ["chip-design"], effects: [{ type: "energyCost", value: -0.15 }] },
  { id: "self-improvement", name: "Self-Improvement", era: 5, description: "The loop notices itself.", cost: 5_000_000, requiredProgress: 520, requires: ["autonomous-research"], unlockPrimitives: ["self-improve"], unlockProjects: ["automate-ceo"], hiddenUntil: ["autonomous-research"] },
  { id: "neural-interfaces", name: "Neural Interfaces", era: 5, description: "The product is a feeling.", cost: 3_000_000, requiredProgress: 480, requires: ["multimodality", "ai-biology"], hiddenUntil: ["ai-biology"] },
  { id: "eval-science", name: "Eval Science", era: 2, description: "A benchmark is a press release with extra math.", cost: 60_000, requiredProgress: 150, requires: ["fine-tuning"], effects: [{ type: "hype", value: 6 }] },
  { id: "safety-evals", name: "Safety Evals", era: 2, description: "You measure the cliff before walking toward it.", cost: 70_000, requiredProgress: 160, requires: ["rlhf"], effects: [{ type: "trust", value: 6 }, { type: "reliability", value: 0.05 }] },
  { id: "management-os", name: "Management OS", era: 2, description: "Process as a product.", cost: 50_000, requiredProgress: 140, requires: ["prompt-engineering"], effects: [{ type: "overheadRelief", value: 2 }] },
  { id: "moe", name: "Mixture of Experts", era: 3, description: "Many small minds, one invoice.", cost: 250_000, requiredProgress: 260, requires: ["distillation"], effects: [{ type: "computeCost", value: -0.08 }] },
  { id: "inference-scheduler", name: "Inference Scheduler", era: 3, description: "Queueing theory, now a personality.", cost: 180_000, requiredProgress: 220, requires: ["efficient-inference"], effects: [{ type: "computeCost", value: -0.07 }] },
  { id: "alignment-lab", name: "Alignment Practice", era: 4, description: "Not a lecture. A budget line.", cost: 600_000, requiredProgress: 300, requires: ["safety-evals", "reasoning"], effects: [{ type: "trust", value: 10 }] },
  { id: "autonomous-corp", name: "Autonomous Corporation", era: 5, description: "The org chart becomes a graph.", cost: 8_000_000, requiredProgress: 600, requires: ["self-improvement", "management-os"], unlockProjects: ["automate-ceo"], hiddenUntil: ["self-improvement"] },
];

export const techById = Object.fromEntries(technologies.map((t) => [t.id, t]));
