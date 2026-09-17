import type { Effect, NewsItem } from "../simulation/types";

export interface NewsStage {
  headline: string;
  body: string;
  tone: NewsItem["tone"];
  delayWeeks: number;
  effects?: Effect[];
  impact?: string;
}

export interface NewsChain {
  id: string;
  minYear: number;
  weight: number;
  stages: NewsStage[];
}

export const NEWS_CHAINS: NewsChain[] = [
  {
    id: "open-weights", minYear: 2023, weight: 7,
    stages: [
      { headline: "Benchmark screenshots from an unnamed open model are circulating", body: "A cropped chart posted by a compiler engineer shows a small model trading blows with closed APIs. The weights are not public, but inference vendors are already testing capacity.", tone: "hype", delayWeeks: 0, impact: "Foreshadowing only; developer expectations are moving." },
      { headline: "The weights landed before the model card", body: "Mirrors appeared within minutes. Developers are publishing quantized builds while researchers argue about whether the benchmark prompt leaked into training data.", tone: "markets", delayWeeks: 2, effects: [{ type: "world", value: { meter: "openSourcePressure", amount: 6 } }, { type: "world", value: { meter: "developerDemandIndex", amount: 0.08 } }], impact: "Developer products gain demand; open-source pricing pressure rises." },
      { headline: "Hosted inference vendors cut prices for the new open model", body: "Three providers now offer the release below the price of last quarter's smallest closed model. Application teams are migrating batch workloads first.", tone: "markets", delayWeeks: 2, effects: [{ type: "world", value: { meter: "inferenceCostIndex", amount: -0.08 } }, { type: "inferenceMultiplier", value: 0.94 }], impact: "Inference costs fall across active products." },
      { headline: "Closed-model vendors answer the open-weight migration", body: "Contract minimums are down, cached input is cheaper, and one provider quietly extended its deprecation window. Buyers now expect portability in every enterprise review.", tone: "neutral", delayWeeks: 2, effects: [{ type: "world", value: { meter: "enterpriseDemandIndex", amount: -0.04 } }], impact: "Enterprise demand softens while buyers reassess vendors." },
    ],
  },
  {
    id: "gpu-allocation", minYear: 2023, weight: 6,
    stages: [
      { headline: "Accelerator lead times have slipped past two quarters", body: "Cloud resellers are asking customers to forecast capacity before product plans are final. On-demand inventory is being held for accounts with annual commitments.", tone: "panic", delayWeeks: 0, effects: [{ type: "world", value: { meter: "computeDemand", amount: 4 } }], impact: "Compute demand rises; no immediate bill change." },
      { headline: "Cloud providers move premium accelerators to allocation-only", body: "Reserved-capacity customers keep their slots. Everyone else gets burst limits, queueing, and a sales call about committed spend.", tone: "markets", delayWeeks: 3, effects: [{ type: "world", value: { meter: "inferenceCostIndex", amount: 0.12 } }, { type: "inferenceMultiplier", value: 1.1 }], impact: "Active-product inference costs rise 10%." },
      { headline: "A rival accelerator clears its first production deployments", body: "Early benchmarks show weaker tooling but credible throughput. Inference hosts begin offering migration credits to teams willing to test the new stack.", tone: "neutral", delayWeeks: 4, effects: [{ type: "world", value: { meter: "inferenceCostIndex", amount: -0.07 } }, { type: "inferenceMultiplier", value: 0.96 }], impact: "Competition partially relieves compute costs." },
    ],
  },
  {
    id: "safety-bill", minYear: 2024, weight: 5,
    stages: [
      { headline: "Draft safety bill targets models above a compute threshold", body: "The proposal would require standardized evaluations and incident reporting from frontier developers. Enterprise buyers immediately ask vendors which upstream models qualify.", tone: "panic", delayWeeks: 0, effects: [{ type: "world", value: { meter: "regulation", amount: 4 } }], impact: "Regulatory pressure rises." },
      { headline: "Procurement teams add model-provenance questionnaires", body: "Security reviews now ask for provider contracts, evaluation summaries, and a named incident owner. Sales cycles stretch before the bill has a vote.", tone: "markets", delayWeeks: 3, effects: [{ type: "world", value: { meter: "complianceCostIndex", amount: 0.14 } }, { type: "world", value: { meter: "enterpriseDemandIndex", amount: -0.06 } }], impact: "Compliance costs rise and enterprise demand slows." },
      { headline: "Government pilot program favors vendors with audit trails", body: "A procurement framework offers larger contracts to teams that can document model lineage, evaluations, and human escalation paths.", tone: "neutral", delayWeeks: 5, effects: [{ type: "demand", value: { verticals: ["enterprise", "legal", "finance", "health", "defense"], strategies: ["enterprise-sales"], multiplier: 1.12 } }], impact: "Compliant enterprise motions gain demand." },
    ],
  },
  {
    id: "benchmark-dispute", minYear: 2023, weight: 6,
    stages: [
      { headline: "A benchmark graph goes viral after a founder declares a category solved", body: "The chart compares a new model against older baselines and omits latency. Product demos flood the timeline before the evaluation code is public.", tone: "hype", delayWeeks: 0, effects: [{ type: "world", value: { meter: "aiAdoption", amount: 3 } }], impact: "AI adoption accelerates." },
      { headline: "Researchers reproduce the viral benchmark with different results", body: "The ranking flips after controlling for prompt retries and tool failures. A public spreadsheet tracks which labs disclosed their evaluation settings.", tone: "panic", delayWeeks: 2, effects: [{ type: "world", value: { meter: "publicTrust", amount: -3 } }, { type: "demand", value: { verticals: ["consumer", "media"], multiplier: 0.95 } }], impact: "Public trust and consumer demand dip." },
      { headline: "Buyers begin asking for task-specific evaluations", body: "The benchmark controversy does not stop deployments, but sales teams now bring customer data into proof-of-concept reviews instead of forwarding leaderboard screenshots.", tone: "neutral", delayWeeks: 3, effects: [{ type: "world", value: { meter: "enterpriseDemandIndex", amount: 0.04 } }], impact: "Enterprise demand recovers for credible products." },
    ],
  },
  {
    id: "talent-war", minYear: 2023, weight: 4,
    stages: [
      { headline: "Two frontier labs are bidding for the same research team", body: "Recruiters are quoting multi-year packages and guaranteed compute. Senior engineers at application companies are forwarding screenshots to their managers.", tone: "hype", delayWeeks: 0, effects: [{ type: "world", value: { meter: "talentCostIndex", amount: 0.08 } }], impact: "New-hire salary expectations rise 8%." },
      { headline: "The researcher auction spills into infrastructure hiring", body: "Distributed-systems and inference engineers now command lab-level packages. Startups respond with title inflation, equity refreshes, and remote exceptions.", tone: "markets", delayWeeks: 3, effects: [{ type: "world", value: { meter: "talentCostIndex", amount: 0.06 } }], impact: "Hiring costs rise again." },
      { headline: "A lab hiring freeze cools the market at the edges", body: "Core research packages remain extreme, but application and infrastructure offers stop climbing. Candidates begin valuing scope and equity again.", tone: "neutral", delayWeeks: 6, effects: [{ type: "world", value: { meter: "talentCostIndex", amount: -0.07 } }], impact: "Salary pressure partially eases." },
    ],
  },
];
