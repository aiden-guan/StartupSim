export interface RecipeDef {
  id: string;
  parts: [string, string];
  name: string;
  description: string;
  innovation: number;
  vertical: string;
  riskTags: string[];
  difficultyMod?: number;
}

function key(a: string, b: string): string {
  return [a, b].sort().join(".");
}

const named: RecipeDef[] = [
  { id: key("chat", "writing"), parts: ["chat", "writing"], name: "Copywright", description: "A polite machine that will write your landing page until you hate it.", innovation: 1.15, vertical: "consumer", riskTags: ["slop"] },
  { id: key("chat", "search"), parts: ["chat", "search"], name: "Answer Engine", description: "Search that refuses to show ten blue links.", innovation: 1.3, vertical: "consumer", riskTags: ["misinformation"] },
  { id: key("chat", "code"), parts: ["chat", "code"], name: "Coding Copilot", description: "It completes the function. Sometimes the right one.", innovation: 1.35, vertical: "developer", riskTags: ["automation"] },
  { id: key("chat", "memory"), parts: ["chat", "memory"], name: "Companion", description: "It remembers your birthday and your worst opinions.", innovation: 1.2, vertical: "consumer", riskTags: ["privacy", "safety"] },
  { id: key("agent", "browser"), parts: ["agent", "browser"], name: "Web Research Agent", description: "A tab that opens other tabs on your behalf.", innovation: 1.4, vertical: "enterprise", riskTags: ["privacy"] },
  { id: key("agent", "workflow"), parts: ["agent", "workflow"], name: "Ops Autopilot", description: "Enterprise automation with a chat box glued on.", innovation: 1.35, vertical: "enterprise", riskTags: ["automation"] },
  { id: key("voice", "agent"), parts: ["voice", "agent"], name: "Receptionist", description: "Hold music, but ambitious.", innovation: 1.25, vertical: "enterprise", riskTags: ["automation"] },
  { id: key("video", "avatar"), parts: ["video", "avatar"], name: "Virtual Influencer", description: "A face that never sleeps, never ages, never says no to a brand deal.", innovation: 1.2, vertical: "media", riskTags: ["deepfake", "misinformation"] },
  { id: key("image", "chat"), parts: ["image", "chat"], name: "Studio Chat", description: "Describe a picture. Argue with the picture. Ship the picture.", innovation: 1.1, vertical: "consumer", riskTags: ["copyright"] },
  { id: key("retrieval", "chat"), parts: ["retrieval", "chat"], name: "Doc Oracle", description: "Your company's PDFs, finally willing to talk.", innovation: 1.25, vertical: "enterprise", riskTags: ["privacy"] },
  { id: key("code", "agent"), parts: ["code", "agent"], name: "Software Factory", description: "Tickets go in. Pull requests come out. Nightmares vary.", innovation: 1.45, vertical: "developer", riskTags: ["automation"] },
  { id: key("reasoning", "science"), parts: ["reasoning", "science"], name: "Hypothesis Engine", description: "It proposes experiments faster than ethics can schedule them.", innovation: 1.5, vertical: "science", riskTags: ["safety"] },
  { id: key("biology", "science"), parts: ["biology", "science"], name: "Drug Discovery Suite", description: "Molecules on a deadline.", innovation: 1.55, vertical: "biotech", riskTags: ["safety", "regulation"] },
  { id: key("robotics", "agent"), parts: ["robotics", "agent"], name: "Floor Worker", description: "A body for the workflow you already automated.", innovation: 1.5, vertical: "robotics", riskTags: ["automation"] },
  { id: key("robotics", "defense"), parts: ["robotics", "defense"], name: "Perimeter Platform", description: "National security, now with firmware updates.", innovation: 1.4, vertical: "defense", riskTags: ["defense", "safety"] },
  { id: key("api", "reasoning"), parts: ["api", "reasoning"], name: "Reasoning API", description: "Tokens sold by the thought.", innovation: 1.3, vertical: "developer", riskTags: [] },
  { id: key("opensource", "code"), parts: ["opensource", "code"], name: "Public Copilot", description: "Give the weights away. Keep the brand.", innovation: 1.2, vertical: "developer", riskTags: [] },
  { id: key("ads", "chat"), parts: ["ads", "chat"], name: "Sponsored Answers", description: "The model is free. The citations are not.", innovation: 0.95, vertical: "consumer", riskTags: ["misinformation"] },
  { id: key("education", "chat"), parts: ["education", "chat"], name: "Tutor", description: "Homework, but with a progress bar for parents.", innovation: 1.15, vertical: "education", riskTags: [] },
  { id: key("health", "retrieval"), parts: ["health", "retrieval"], name: "Chart Companion", description: "It has read the chart. It has not been to medical school.", innovation: 1.3, vertical: "health", riskTags: ["regulation", "safety"] },
  { id: key("legal", "writing"), parts: ["legal", "writing"], name: "Contract Mill", description: "Where clauses go to multiply.", innovation: 1.2, vertical: "legal", riskTags: ["regulation"] },
  { id: key("finance", "agent"), parts: ["finance", "agent"], name: "Treasury Agent", description: "It moves money while you are in a meeting about moving money.", innovation: 1.3, vertical: "finance", riskTags: ["regulation"] },
  { id: key("social", "avatar"), parts: ["social", "avatar"], name: "Crowdcast", description: "A network of people who might not be people.", innovation: 1.1, vertical: "consumer", riskTags: ["misinformation", "deepfake"] },
  { id: key("analytics", "workflow"), parts: ["analytics", "workflow"], name: "RevOps Brain", description: "Dashboards that act without asking.", innovation: 1.2, vertical: "enterprise", riskTags: ["automation"] },
  { id: key("memory", "agent"), parts: ["memory", "agent"], name: "Chief of Staff", description: "It knows every deadline you have missed.", innovation: 1.35, vertical: "enterprise", riskTags: ["privacy"] },
  { id: key("search", "analytics"), parts: ["search", "analytics"], name: "Intent Graph", description: "What people want, priced by the query.", innovation: 1.1, vertical: "consumer", riskTags: ["privacy"] },
  { id: key("image", "ads"), parts: ["image", "ads"], name: "Ad Forge", description: "A thousand variants of the same sincerity.", innovation: 1.05, vertical: "media", riskTags: ["copyright"] },
  { id: key("voice", "customer" as string), parts: ["voice", "chat"], name: "Voice Desk", description: "Call centers, minus the center.", innovation: 1.15, vertical: "enterprise", riskTags: ["automation"] },
  { id: key("computer-use", "agent"), parts: ["computer-use", "agent"], name: "Desktop Operator", description: "It has your mouse. Try not to think about that.", innovation: 1.5, vertical: "enterprise", riskTags: ["security", "automation"] },
  { id: key("security", "agent"), parts: ["security", "agent"], name: "SOC Autopilot", description: "Alerts fighting alerts.", innovation: 1.3, vertical: "enterprise", riskTags: ["security"] },
  { id: key("entertainment", "video"), parts: ["entertainment", "video"], name: "Infinite Show", description: "A series that never has to wrap.", innovation: 1.15, vertical: "media", riskTags: ["copyright", "slop"] },
  { id: key("recommend", "entertainment"), parts: ["recommend", "entertainment"], name: "Taste Engine", description: "It knows what you will watch next. It is not proud.", innovation: 1.05, vertical: "media", riskTags: [] },
  { id: key("data", "api"), parts: ["data", "api"], name: "Corpus Broker", description: "Other people's text, neatly licensed. Allegedly.", innovation: 1.1, vertical: "developer", riskTags: ["copyright"] },
  { id: key("hardware", "reasoning"), parts: ["hardware", "reasoning"], name: "Inference Brick", description: "A box that thinks in a warehouse.", innovation: 1.4, vertical: "hardware", riskTags: ["energy"] },
  { id: key("world-model", "robotics"), parts: ["world-model", "robotics"], name: "Generalist Body", description: "A robot that has opinions about gravity.", innovation: 1.6, vertical: "robotics", riskTags: ["safety", "automation"] },
  { id: key("auto-research", "self-improve"), parts: ["auto-research", "self-improve"], name: "Recursive Lab", description: "Research that researches research. The slides write themselves.", innovation: 2, vertical: "science", riskTags: ["safety", "systemic"] },
  { id: key("defense", "vision"), parts: ["defense", "vision"], name: "Watchtower", description: "Cameras with a mandate.", innovation: 1.2, vertical: "defense", riskTags: ["surveillance", "defense"] },
  { id: key("commerce", "agent"), parts: ["commerce", "agent"], name: "Buyer Bot", description: "It will purchase the thing you almost wanted.", innovation: 1.15, vertical: "consumer", riskTags: ["automation"] },
  { id: key("education", "agent"), parts: ["education", "agent"], name: "Classroom Agent", description: "Thirty students. One infinitely patient not-teacher.", innovation: 1.2, vertical: "education", riskTags: ["automation"] },
  { id: key("health", "vision"), parts: ["health", "vision"], name: "Scan Reader", description: "Radiology, accelerated. Liability, not.", innovation: 1.35, vertical: "health", riskTags: ["regulation", "safety"] },
  { id: key("legal", "agent"), parts: ["legal", "agent"], name: "Discovery Swarm", description: "A million documents, none of them fun.", innovation: 1.25, vertical: "legal", riskTags: ["privacy"] },
  { id: key("finance", "analytics"), parts: ["finance", "analytics"], name: "Risk Desk", description: "VaR with a chat window.", innovation: 1.15, vertical: "finance", riskTags: ["regulation"] },
  { id: key("opensource", "api"), parts: ["opensource", "api"], name: "Hosted Commons", description: "Free weights. Paid GPUs. Honest work.", innovation: 1.2, vertical: "developer", riskTags: [] },
  { id: key("chat", "analytics"), parts: ["chat", "analytics"], name: "Insight Bot", description: "Your metrics, explained like a product manager.", innovation: 1.05, vertical: "enterprise", riskTags: [] },
  { id: key("writing", "legal"), parts: ["writing", "legal"], name: "Policy Drafter", description: "Terms of service that can see the future.", innovation: 1.1, vertical: "legal", riskTags: ["regulation"] },
  { id: key("search", "code"), parts: ["search", "code"], name: "Repo Search", description: "Find the function. Ignore the comment that says sorry.", innovation: 1.2, vertical: "developer", riskTags: [] },
  { id: key("image", "commerce"), parts: ["image", "commerce"], name: "Catalog Dreamer", description: "Products that do not exist, beautifully lit.", innovation: 1.05, vertical: "consumer", riskTags: ["slop"] },
  { id: key("voice", "education"), parts: ["voice", "education"], name: "Language Partner", description: "A conversation partner with infinite patience and no visa.", innovation: 1.1, vertical: "education", riskTags: [] },
  { id: key("memory", "social"), parts: ["memory", "social"], name: "Social Ledger", description: "It never forgets who you were at 19.", innovation: 0.95, vertical: "consumer", riskTags: ["privacy"] },
  { id: key("retrieval", "legal"), parts: ["retrieval", "legal"], name: "Precedent Engine", description: "Case law, instantly overconfident.", innovation: 1.25, vertical: "legal", riskTags: ["regulation"] },
  { id: key("agent", "science"), parts: ["agent", "science"], name: "Lab Scheduler", description: "Pipettes, but make it autonomous.", innovation: 1.45, vertical: "science", riskTags: ["safety"] },
  { id: key("simulation", "finance"), parts: ["simulation", "finance"], name: "Market Twin", description: "A fake economy for real decisions.", innovation: 1.3, vertical: "finance", riskTags: [] },
  { id: key("simulation", "defense"), parts: ["simulation", "defense"], name: "Wargame Cloud", description: "Practice the worst day, monthly.", innovation: 1.35, vertical: "defense", riskTags: ["defense"] },
  { id: key("recommend", "ads"), parts: ["recommend", "ads"], name: "Attention Exchange", description: "The oldest business model in a new trench coat.", innovation: 0.9, vertical: "media", riskTags: ["privacy"] },
  { id: key("browser", "search"), parts: ["browser", "search"], name: "Research Tab", description: "It reads the internet so you do not have to. This is not always better.", innovation: 1.2, vertical: "consumer", riskTags: ["misinformation"] },
  { id: key("workflow", "legal"), parts: ["workflow", "legal"], name: "Compliance Flow", description: "A checklist that files itself.", innovation: 1.15, vertical: "enterprise", riskTags: ["regulation"] },
  { id: key("avatar", "education"), parts: ["avatar", "education"], name: "Lecturer", description: "A professor who never has office hours.", innovation: 1.05, vertical: "education", riskTags: [] },
  { id: key("video", "education"), parts: ["video", "education"], name: "Course Mill", description: "A university's catalog, overnight.", innovation: 1.1, vertical: "education", riskTags: ["slop"] },
  { id: key("robotics", "health"), parts: ["robotics", "health"], name: "Ward Assistant", description: "Gentle motors in a hospital hallway.", innovation: 1.4, vertical: "health", riskTags: ["safety", "regulation"] },
  { id: key("robotics", "commerce"), parts: ["robotics", "commerce"], name: "Warehouse Hand", description: "Fulfillment, minus the human back.", innovation: 1.3, vertical: "robotics", riskTags: ["automation"] },
  { id: key("vision", "security"), parts: ["vision", "security"], name: "Anomaly Eye", description: "It watches the cameras watching you.", innovation: 1.2, vertical: "enterprise", riskTags: ["surveillance"] },
  { id: key("data", "biology"), parts: ["data", "biology"], name: "Phenotype Vault", description: "Bodies, tokenized.", innovation: 1.25, vertical: "biotech", riskTags: ["privacy", "regulation"] },
  { id: key("api", "voice"), parts: ["api", "voice"], name: "Speech API", description: "Everyone's IVR, white-labeled.", innovation: 1.1, vertical: "developer", riskTags: [] },
  { id: key("opensource", "image"), parts: ["opensource", "image"], name: "Public Palette", description: "Weights on a torrent. Taste optional.", innovation: 1.05, vertical: "consumer", riskTags: ["copyright"] },
  { id: key("self-improve", "code"), parts: ["self-improve", "code"], name: "Self-Tuning Devtool", description: "The IDE that rewrites its own completions.", innovation: 1.7, vertical: "developer", riskTags: ["safety"] },
  { id: key("auto-research", "biology"), parts: ["auto-research", "biology"], name: "Closed-Loop Wet Lab", description: "Hypothesis, pipette, result, repeat. No Fridays.", innovation: 1.75, vertical: "biotech", riskTags: ["safety"] },
  { id: key("world-model", "simulation"), parts: ["world-model", "simulation"], name: "World Sandbox", description: "A planet in a cluster.", innovation: 1.55, vertical: "science", riskTags: ["energy"] },
  { id: key("hardware", "energy" as string), parts: ["hardware", "analytics"], name: "Rack Oracle", description: "Your data center, narrating its own power bill.", innovation: 1.2, vertical: "hardware", riskTags: ["energy"] },
  { id: key("chat", "entertainment"), parts: ["chat", "entertainment"], name: "Storybox", description: "A novel that collaborates, then spoils itself.", innovation: 1.05, vertical: "media", riskTags: ["copyright"] },
  { id: key("writing", "ads"), parts: ["writing", "ads"], name: "Slogan Press", description: "Brand voice in bulk.", innovation: 0.9, vertical: "media", riskTags: ["slop"] },
  { id: key("search", "health"), parts: ["search", "health"], name: "Symptom Index", description: "Please do not use this instead of a doctor. People will.", innovation: 1.1, vertical: "health", riskTags: ["safety", "misinformation"] },
  { id: key("agent", "ads"), parts: ["agent", "ads"], name: "Media Buyer", description: "It spends the budget. It has theories.", innovation: 1.15, vertical: "enterprise", riskTags: ["automation"] },
  { id: key("reasoning", "legal"), parts: ["reasoning", "legal"], name: "Counsel", description: "A junior associate that does not sleep or bill quite yet.", innovation: 1.3, vertical: "legal", riskTags: ["regulation"] },
  { id: key("reasoning", "code"), parts: ["reasoning", "code"], name: "Staff Engineer", description: "It leaves comments. Some of them are kind.", innovation: 1.45, vertical: "developer", riskTags: ["automation"] },
  { id: key("memory", "health"), parts: ["memory", "health"], name: "Longitudinal Twin", description: "A patient record that talks back.", innovation: 1.35, vertical: "health", riskTags: ["privacy", "regulation"] },
  { id: key("browser", "commerce"), parts: ["browser", "commerce"], name: "Deal Hunter", description: "It will find a coupon or invent a reason.", innovation: 1.05, vertical: "consumer", riskTags: [] },
  { id: key("computer-use", "finance"), parts: ["computer-use", "finance"], name: "Backoffice Hands", description: "Legacy software, operated by something new.", innovation: 1.4, vertical: "finance", riskTags: ["security"] },
];

export const recipes: RecipeDef[] = named.map((r) => ({
  ...r,
  id: key(r.parts[0], r.parts[1]),
}));

export function recipeKey(a: string, b: string): string {
  return key(a, b);
}

export function findRecipe(a: string, b: string): RecipeDef | undefined {
  const k = key(a, b);
  return recipes.find((r) => r.id === k);
}
