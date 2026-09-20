export interface ModelDef {
  id: string;
  name: string;
  provider: string;
  capability: number;
  speed: number;
  reliability: number;
  context: number;
  costPerMTok: number;
  multimodal: boolean;
  tools: boolean;
  open: boolean;
  safety: number;
  eraMin: number;
}

export const models: ModelDef[] = [
  { id: "openbrain-o3", name: "OpenBrain O3", provider: "OpenBrain", capability: 7, speed: 5, reliability: 7, context: 8, costPerMTok: 15, multimodal: true, tools: true, open: false, safety: 7, eraMin: 1 },
  { id: "openbrain-o4", name: "OpenBrain O4", provider: "OpenBrain", capability: 9, speed: 4, reliability: 7, context: 9, costPerMTok: 35, multimodal: true, tools: true, open: false, safety: 6, eraMin: 2 },
  { id: "claudius-instant", name: "Claudius Instant", provider: "Claudius Labs", capability: 6, speed: 8, reliability: 8, context: 6, costPerMTok: 5, multimodal: false, tools: true, open: false, safety: 8, eraMin: 1 },
  { id: "claudius-opus", name: "Claudius Opus", provider: "Claudius Labs", capability: 8, speed: 4, reliability: 8, context: 8, costPerMTok: 22, multimodal: true, tools: true, open: false, safety: 8, eraMin: 2 },
  { id: "metamind-34b", name: "MetaMind Open 34B", provider: "MetaMind Open", capability: 6, speed: 8, reliability: 6, context: 7, costPerMTok: 1.5, multimodal: false, tools: false, open: true, safety: 4, eraMin: 1 },
  { id: "metamind-400b", name: "MetaMind Open 400B", provider: "MetaMind Open", capability: 8, speed: 6, reliability: 6, context: 8, costPerMTok: 3, multimodal: true, tools: true, open: true, safety: 4, eraMin: 2 },
  { id: "macrosoft-azure", name: "Macrosoft Foundry", provider: "Macrosoft", capability: 7, speed: 6, reliability: 8, context: 8, costPerMTok: 11, multimodal: true, tools: true, open: false, safety: 7, eraMin: 1 },
  { id: "xeno-grok", name: "XenoAI Spark", provider: "XenoAI", capability: 7, speed: 7, reliability: 5, context: 8, costPerMTok: 7, multimodal: true, tools: true, open: false, safety: 3, eraMin: 1 },
  { id: "house-small", name: "In-House 8B", provider: "You", capability: 5, speed: 9, reliability: 6, context: 5, costPerMTok: 0.5, multimodal: false, tools: false, open: false, safety: 5, eraMin: 2 },
  { id: "house-frontier", name: "In-House Frontier", provider: "You", capability: 10, speed: 3, reliability: 6, context: 10, costPerMTok: 4.5, multimodal: true, tools: true, open: false, safety: 4, eraMin: 3 },
];

export const modelById = Object.fromEntries(models.map((m) => [m.id, m]));
