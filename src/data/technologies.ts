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
  { id: "prompt-engineering", name: "Prompt Engineering", era: 1, description: "Methods for eliciting reliable model behavior.", cost: 18_000, requiredProgress: 80, requires: [], unlockPrimitives: ["code"] },
  { id: "embeddings", name: "Embeddings", era: 1, description: "Represent meaning as vectors for similarity search.", cost: 27_000, requiredProgress: 100, requires: [], unlockPrimitives: ["retrieval"] },
  { id: "fine-tuning", name: "Fine-Tuning", era: 1, description: "Adapt a smaller model to your domain.", cost: 33_000, requiredProgress: 110, requires: ["prompt-engineering"], effects: [{ type: "reliability", value: 0.04 }] },
  { id: "rlhf", name: "RLHF", era: 1, description: "Use human feedback to improve model behavior and trust.", cost: 60_000, requiredProgress: 140, requires: ["fine-tuning"], effects: [{ type: "trust", value: 4 }] },
  { id: "retrieval", name: "Retrieval", era: 1, description: "Ground answers in source documents.", cost: 42_000, requiredProgress: 120, requires: ["embeddings"], unlockPrimitives: ["memory"] },
  { id: "multimodality", name: "Multimodality", era: 1, description: "Process text, images, audio, and video in one system.", cost: 83_000, requiredProgress: 160, requires: ["prompt-engineering"], unlockPrimitives: ["voice", "video", "avatar", "vision"] },
  { id: "efficient-inference", name: "Efficient Inference", era: 1, description: "Lower inference cost without changing product capability.", cost: 53_000, requiredProgress: 130, requires: ["prompt-engineering"], effects: [{ type: "computeCost", value: -0.12 }] },
  { id: "reasoning", name: "Reasoning", era: 2, description: "Improve multi-step problem solving.", cost: 450_000, requiredProgress: 200, requires: ["rlhf"], unlockPrimitives: ["reasoning"] },
  { id: "tool-use", name: "Tool Use", era: 2, description: "Let models call tools and services.", cost: 400_000, requiredProgress: 180, requires: ["retrieval"], unlockPrimitives: ["browser", "security"] },
  { id: "long-context", name: "Long Context", era: 2, description: "Process larger documents and histories.", cost: 350_000, requiredProgress: 170, requires: ["retrieval"], effects: [{ type: "productBonus", value: { attribute: "capability", amount: 1 } }] },
  { id: "agents", name: "Agents", era: 2, description: "Combine loops and tools for tasks that run over time.", cost: 900_000, requiredProgress: 220, requires: ["tool-use", "reasoning"], unlockPrimitives: ["agent", "workflow"] },
  { id: "computer-use", name: "Computer Use", era: 2, description: "Let models click, type, and work in software.", cost: 1_250_000, requiredProgress: 240, requires: ["agents"], unlockPrimitives: ["computer-use"] },
  { id: "synthetic-data", name: "Synthetic Data", era: 2, description: "Use generated examples to expand training data.", cost: 500_000, requiredProgress: 200, requires: ["fine-tuning"], effects: [{ type: "researchSpeed", value: 0.08 }] },
  { id: "distillation", name: "Model Distillation", era: 2, description: "Compress a larger model into a smaller one.", cost: 600_000, requiredProgress: 210, requires: ["efficient-inference"], effects: [{ type: "computeCost", value: -0.1 }] },
  { id: "world-models", name: "World Models", era: 3, description: "Model environments and outcomes for planning.", cost: 8_000_000, requiredProgress: 320, requires: ["reasoning", "multimodality"], unlockPrimitives: ["world-model", "simulation"], hiddenUntil: ["reasoning"] },
  { id: "autonomous-research", name: "Autonomous Research", era: 4, description: "Run research loops with less human intervention.", cost: 100_000_000, requiredProgress: 400, requires: ["agents", "world-models"], unlockPrimitives: ["auto-research"], unlockProjects: ["autonomous-lab"], hiddenUntil: ["agents"] },
  { id: "robotics", name: "General Robotics", era: 4, description: "Connect AI planning to physical actions.", cost: 125_000_000, requiredProgress: 380, requires: ["computer-use", "world-models"], unlockPrimitives: ["robotics"], requiredVertical: "robotics", unlockProjects: ["robot-line"] },
  { id: "chip-design", name: "AI Chip Design", era: 3, description: "Design specialized hardware for inference.", cost: 25_000_000, requiredProgress: 360, requires: ["efficient-inference"], unlockPrimitives: ["hardware"], requiredVertical: "hardware", unlockProjects: ["custom-chip"] },
  { id: "ai-science", name: "AI Science", era: 4, description: "Use AI to generate and test scientific hypotheses.", cost: 150_000_000, requiredProgress: 340, requires: ["autonomous-research"], unlockPrimitives: ["science"], requiredVertical: "science" },
  { id: "ai-biology", name: "AI Biology", era: 4, description: "Apply AI to biological design and analysis.", cost: 250_000_000, requiredProgress: 360, requires: ["ai-science"], unlockPrimitives: ["biology"], requiredVertical: "biotech" },
  { id: "energy-systems", name: "AI Energy Systems", era: 3, description: "Optimize energy use for large compute workloads.", cost: 40_000_000, requiredProgress: 300, requires: ["chip-design"], effects: [{ type: "energyCost", value: -0.15 }] },
  { id: "self-improvement", name: "Self-Improvement", era: 5, description: "Allow systems to improve their own capabilities.", cost: 2_500_000_000, requiredProgress: 520, requires: ["autonomous-research"], unlockPrimitives: ["self-improve"], unlockProjects: ["automate-ceo"], hiddenUntil: ["autonomous-research"] },
  { id: "neural-interfaces", name: "Neural Interfaces", era: 5, description: "Connect products to human neural signals.", cost: 750_000_000, requiredProgress: 480, requires: ["multimodality", "ai-biology"], hiddenUntil: ["ai-biology"] },
  { id: "eval-science", name: "Eval Science", era: 2, description: "Measure model capability with benchmarks.", cost: 250_000, requiredProgress: 150, requires: ["fine-tuning"], effects: [{ type: "hype", value: 6 }] },
  { id: "safety-evals", name: "Safety Evals", era: 2, description: "Test failure modes before deployment.", cost: 300_000, requiredProgress: 160, requires: ["rlhf"], effects: [{ type: "trust", value: 6 }, { type: "reliability", value: 0.05 }] },
  { id: "management-os", name: "Management OS", era: 2, description: "Reduce coordination overhead with structured processes.", cost: 225_000, requiredProgress: 140, requires: ["prompt-engineering"], effects: [{ type: "overheadRelief", value: 2 }] },
  { id: "moe", name: "Mixture of Experts", era: 3, description: "Route requests across specialized model experts.", cost: 3_000_000, requiredProgress: 260, requires: ["distillation"], effects: [{ type: "computeCost", value: -0.08 }] },
  { id: "inference-scheduler", name: "Inference Scheduler", era: 3, description: "Schedule requests to reduce compute waste.", cost: 2_000_000, requiredProgress: 220, requires: ["efficient-inference"], effects: [{ type: "computeCost", value: -0.07 }] },
  { id: "alignment-lab", name: "Alignment Practice", era: 4, description: "Fund processes that improve behavior and trust.", cost: 75_000_000, requiredProgress: 300, requires: ["safety-evals", "reasoning"], effects: [{ type: "trust", value: 10 }] },
  { id: "autonomous-corp", name: "Autonomous Corporation", era: 5, description: "Automate company decisions and operations.", cost: 10_000_000_000, requiredProgress: 600, requires: ["self-improvement", "management-os"], unlockProjects: ["automate-ceo"], hiddenUntil: ["self-improvement"] },
];

export const techById = Object.fromEntries(technologies.map((t) => [t.id, t]));
