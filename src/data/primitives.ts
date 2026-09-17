export interface PrimitiveDef {
  id: string;
  name: string;
  category: "capability" | "vertical" | "interface" | "business";
  difficulty: number;
  requiredTech?: string;
  requiredVertical?: string;
  computeWeight: number;
  description: string;
}

export const primitives: PrimitiveDef[] = [
  { id: "chat", name: "Chat", category: "interface", difficulty: 1, computeWeight: 1, description: "Conversational interface." },
  { id: "writing", name: "Writing", category: "capability", difficulty: 1, computeWeight: 1, description: "Long-form generation." },
  { id: "search", name: "Search", category: "capability", difficulty: 1, computeWeight: 1.1, description: "Retrieve and rank." },
  { id: "image", name: "Image", category: "capability", difficulty: 2, computeWeight: 1.6, description: "Still-image generation." },
  { id: "code", name: "Code", category: "capability", difficulty: 2, requiredTech: "prompt-engineering", computeWeight: 1.2, description: "Software generation." },
  { id: "voice", name: "Voice", category: "interface", difficulty: 2, requiredTech: "multimodality", computeWeight: 1.5, description: "Speech in and out." },
  { id: "video", name: "Video", category: "capability", difficulty: 3, requiredTech: "multimodality", computeWeight: 2.4, description: "Moving pictures." },
  { id: "avatar", name: "Avatar", category: "interface", difficulty: 2, requiredTech: "multimodality", computeWeight: 1.4, description: "Persistent digital faces." },
  { id: "memory", name: "Memory", category: "capability", difficulty: 2, requiredTech: "retrieval", computeWeight: 1.3, description: "State that lasts." },
  { id: "retrieval", name: "Retrieval", category: "capability", difficulty: 2, requiredTech: "embeddings", computeWeight: 1.2, description: "Grounding in documents." },
  { id: "reasoning", name: "Reasoning", category: "capability", difficulty: 3, requiredTech: "reasoning", computeWeight: 1.8, description: "Multi-step thought." },
  { id: "agent", name: "Agent", category: "capability", difficulty: 3, requiredTech: "agents", computeWeight: 2.2, description: "Act over time." },
  { id: "browser", name: "Browser", category: "interface", difficulty: 2, requiredTech: "tool-use", computeWeight: 1.4, description: "Operate the open web." },
  { id: "computer-use", name: "Computer Use", category: "interface", difficulty: 3, requiredTech: "computer-use", computeWeight: 2, description: "Click, type, file." },
  { id: "workflow", name: "Workflow", category: "business", difficulty: 2, requiredTech: "agents", computeWeight: 1.3, description: "Business process glue." },
  { id: "analytics", name: "Analytics", category: "capability", difficulty: 1, computeWeight: 1, description: "Measure and forecast." },
  { id: "simulation", name: "Simulation", category: "capability", difficulty: 3, requiredTech: "world-models", computeWeight: 2, description: "Counterfactuals." },
  { id: "recommend", name: "Recommendation", category: "capability", difficulty: 2, computeWeight: 1.1, description: "Rank what people see." },
  { id: "security", name: "Security", category: "vertical", difficulty: 3, requiredTech: "tool-use", computeWeight: 1.2, description: "Offense and defense." },
  { id: "robotics", name: "Robotics", category: "vertical", difficulty: 4, requiredTech: "robotics", requiredVertical: "robotics", computeWeight: 1.8, description: "Bodies in the world." },
  { id: "vision", name: "Vision", category: "capability", difficulty: 2, requiredTech: "multimodality", computeWeight: 1.5, description: "See and segment." },
  { id: "world-model", name: "World Model", category: "capability", difficulty: 4, requiredTech: "world-models", computeWeight: 2.2, description: "Internal physics." },
  { id: "science", name: "Scientific Research", category: "vertical", difficulty: 4, requiredTech: "ai-science", requiredVertical: "science", computeWeight: 1.7, description: "Hypothesis engines." },
  { id: "biology", name: "Biology", category: "vertical", difficulty: 4, requiredTech: "ai-biology", requiredVertical: "biotech", computeWeight: 1.6, description: "Wet labs, dry models." },
  { id: "finance", name: "Finance", category: "vertical", difficulty: 2, requiredVertical: "finance", computeWeight: 1.2, description: "Money movement." },
  { id: "defense", name: "Defense", category: "vertical", difficulty: 3, requiredVertical: "defense", computeWeight: 1.5, description: "National customers." },
  { id: "education", name: "Education", category: "vertical", difficulty: 1, computeWeight: 1, description: "Tutors and tests." },
  { id: "health", name: "Healthcare", category: "vertical", difficulty: 3, requiredVertical: "health", computeWeight: 1.3, description: "Clinical workflows." },
  { id: "entertainment", name: "Entertainment", category: "vertical", difficulty: 1, computeWeight: 1.4, description: "Attention products." },
  { id: "social", name: "Social", category: "interface", difficulty: 1, computeWeight: 1.1, description: "People talking to people, supposedly." },
  { id: "ads", name: "Advertising", category: "business", difficulty: 1, computeWeight: 1, description: "Someone else pays." },
  { id: "legal", name: "Legal", category: "vertical", difficulty: 3, requiredVertical: "legal", computeWeight: 1.1, description: "Contracts and counsel." },
  { id: "commerce", name: "Commerce", category: "vertical", difficulty: 2, computeWeight: 1.2, description: "Buy buttons." },
  { id: "hardware", name: "Hardware", category: "vertical", difficulty: 4, requiredTech: "chip-design", requiredVertical: "hardware", computeWeight: 0.6, description: "Atoms, not tokens." },
  { id: "data", name: "Data", category: "business", difficulty: 2, computeWeight: 1.1, description: "The leftover exhaust." },
  { id: "api", name: "API", category: "business", difficulty: 1, computeWeight: 1.3, description: "Sell the model itself." },
  { id: "opensource", name: "Open Source", category: "business", difficulty: 2, computeWeight: 0.7, description: "Give it away on purpose." },
  { id: "auto-research", name: "Autonomous Research", category: "capability", difficulty: 5, requiredTech: "autonomous-research", computeWeight: 2.6, description: "Labs that run themselves." },
  { id: "self-improve", name: "Self-Improvement", category: "capability", difficulty: 5, requiredTech: "self-improvement", computeWeight: 3, description: "The loop closes." },
];

export const primitiveById = Object.fromEntries(primitives.map((p) => [p.id, p]));
