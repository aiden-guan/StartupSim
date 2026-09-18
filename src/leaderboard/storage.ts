import type { LeaderboardEntry, LeaderboardFilter } from "./types.js";

export const SEEDED_LEGENDS: LeaderboardEntry[] = [
  {
    id: "legend_sama",
    handle: "SAMA",
    companyName: "OpenBrain",
    founderName: "Sam Altman",
    score: 1_450_000,
    tier: "SSS",
    endingId: "monopoly",
    endingTitle: "Infrastructure",
    valuation: 157_000_000_000,
    cash: 12_000_000_000,
    arr: 11_400_000_000,
    year: 2026,
    daysElapsed: 1150,
    productsCount: 6,
    employeesCount: 45,
    achievements: [
      "first-ship",
      "ten-k-arr",
      "one-m-arr",
      "ten-m-arr",
      "unicorn-club",
      "decacorn",
      "infrastructure-monopoly",
      "frontier-builder",
      "sovereign-silicon",
      "megawatt-mind",
      "hype-beast",
    ],
    quote: "The compute curve bends upward.",
    verified: true,
    createdAt: 1700000000000,
  },
  {
    id: "legend_ilya",
    handle: "ILYA",
    companyName: "SafeIntelligence",
    founderName: "Ilya Sutskever",
    score: 1_180_000,
    tier: "SS",
    endingId: "ai-science",
    endingTitle: "Discovery Engine",
    valuation: 5_000_000_000,
    cash: 1_000_000_000,
    arr: 0,
    year: 2025,
    daysElapsed: 890,
    productsCount: 1,
    employeesCount: 18,
    achievements: [
      "first-ship",
      "unicorn-club",
      "frontier-builder",
      "autonomous-frontier",
      "megawatt-mind",
      "flawless-record",
    ],
    quote: "Straight line to safe superintelligence.",
    verified: true,
    createdAt: 1705000000000,
  },
  {
    id: "legend_jensen",
    handle: "JENSEN",
    companyName: "SiliconForge",
    founderName: "Jensen Huang",
    score: 1_120_000,
    tier: "SS",
    endingId: "monopoly",
    endingTitle: "Infrastructure",
    valuation: 3_200_000_000_000,
    cash: 34_000_000_000,
    arr: 60_000_000_000,
    year: 2026,
    daysElapsed: 1200,
    productsCount: 8,
    employeesCount: 60,
    achievements: [
      "first-ship",
      "ten-k-arr",
      "one-m-arr",
      "ten-m-arr",
      "unicorn-club",
      "decacorn",
      "sovereign-silicon",
      "infrastructure-monopoly",
      "frontline-squad",
    ],
    quote: "The more intelligence you buy, the more you save.",
    verified: true,
    createdAt: 1708000000000,
  },
  {
    id: "legend_dario",
    handle: "DARIO",
    companyName: "ConstitutionalAI",
    founderName: "Dario Amodei",
    score: 980_000,
    tier: "SS",
    endingId: "ipo",
    endingTitle: "Public",
    valuation: 40_000_000_000,
    cash: 4_000_000_000,
    arr: 3_800_000_000,
    year: 2025,
    daysElapsed: 950,
    productsCount: 4,
    employeesCount: 35,
    achievements: [
      "first-ship",
      "ten-k-arr",
      "one-m-arr",
      "ten-m-arr",
      "unicorn-club",
      "decacorn",
      "ring-the-bell",
      "flawless-record",
    ],
    quote: "Responsible scaling with mathematical rigor.",
    verified: true,
    createdAt: 1710000000000,
  },
  {
    id: "legend_andrej",
    handle: "ANDREJ",
    companyName: "EurekaLabs",
    founderName: "Andrej Karpathy",
    score: 780_000,
    tier: "S",
    endingId: "research-lab",
    endingTitle: "Lab, Not a Company",
    valuation: 850_000_000,
    cash: 120_000_000,
    arr: 15_000_000,
    year: 2025,
    daysElapsed: 720,
    productsCount: 2,
    employeesCount: 14,
    achievements: [
      "first-ship",
      "ten-k-arr",
      "one-m-arr",
      "ten-m-arr",
      "open-weights",
      "flawless-record",
    ],
    quote: "Software 2.0 is eating software 1.0.",
    verified: true,
    createdAt: 1712000000000,
  },
  {
    id: "legend_viktor",
    handle: "VIKTOR",
    companyName: "NexaAI",
    founderName: "Viktor Brandt",
    score: 560_000,
    tier: "A",
    endingId: "unicorn",
    endingTitle: "Unicorn",
    valuation: 1_400_000_000,
    cash: 45_000_000,
    arr: 22_000_000,
    year: 2024,
    daysElapsed: 640,
    productsCount: 3,
    employeesCount: 28,
    achievements: [
      "first-ship",
      "ten-k-arr",
      "one-m-arr",
      "ten-m-arr",
      "unicorn-club",
      "hype-beast",
    ],
    quote: "Enterprise lock-in beats idealism every time.",
    verified: true,
    createdAt: 1714000000000,
  },
  {
    id: "legend_sam_c",
    handle: "SAM_C",
    companyName: "ShipOrSink",
    founderName: "Sam Rivera",
    score: 380_000,
    tier: "B",
    endingId: "quiet-profit",
    endingTitle: "Quiet Profitability",
    valuation: 14_000_000,
    cash: 8_500_000,
    arr: 4_200_000,
    year: 2024,
    daysElapsed: 510,
    productsCount: 3,
    employeesCount: 4,
    achievements: [
      "first-ship",
      "ten-k-arr",
      "one-m-arr",
      "bootstrapped",
      "quiet-operator",
    ],
    quote: "Ship features, bank profit, ignore the timeline.",
    verified: true,
    createdAt: 1716000000000,
  },
];

// In-memory store initialized with legends
let memoryEntries: LeaderboardEntry[] = [...SEEDED_LEGENDS];

// Attempt to read from / write to local file cache in Node runtime (Vite dev or Vercel serverless)
async function loadPersistedFile(): Promise<void> {
  const g = globalThis as any;
  if (typeof g.process !== "undefined" && g.process.versions?.node) {
    try {
      const fsMod = "node:" + "fs/promises";
      const pathMod = "node:" + "path";
      const fs = await import(/* @vite-ignore */ fsMod);
      const path = await import(/* @vite-ignore */ pathMod);
      const filePath = path.resolve(g.process.cwd(), ".leaderboard-store.json");
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content) as LeaderboardEntry[];
      if (Array.isArray(parsed) && parsed.length) {
        // Merge with legends
        const map = new Map<string, LeaderboardEntry>();
        for (const item of SEEDED_LEGENDS) map.set(item.id, item);
        for (const item of parsed) map.set(item.id, item);
        memoryEntries = Array.from(map.values());
      }
    } catch {
      // File does not exist yet, memoryEntries remains default
    }
  }
}

async function writePersistedFile(): Promise<void> {
  const g = globalThis as any;
  if (typeof g.process !== "undefined" && g.process.versions?.node) {
    try {
      const fsMod = "node:" + "fs/promises";
      const pathMod = "node:" + "path";
      const fs = await import(/* @vite-ignore */ fsMod);
      const path = await import(/* @vite-ignore */ pathMod);
      const filePath = path.resolve(g.process.cwd(), ".leaderboard-store.json");
      await fs.writeFile(filePath, JSON.stringify(memoryEntries, null, 2), "utf-8");
    } catch {
      // File write is best-effort
    }
  }
}

// Initial best-effort file load
void loadPersistedFile();

export async function getLeaderboardEntries(options?: {
  filter?: LeaderboardFilter;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  await loadPersistedFile();

  let filtered = [...memoryEntries];

  if (options?.filter && options.filter !== "all") {
    switch (options.filter) {
      case "unicorn":
        filtered = filtered.filter(
          (e) => e.valuation >= 1_000_000_000 || e.endingId === "unicorn"
        );
        break;
      case "ipo":
        filtered = filtered.filter((e) => e.endingId === "ipo");
        break;
      case "monopoly":
        filtered = filtered.filter((e) => e.endingId === "monopoly");
        break;
      case "quiet-profit":
        filtered = filtered.filter((e) => e.endingId === "quiet-profit");
        break;
      case "bootstrapped":
        filtered = filtered.filter((e) => e.achievements.includes("bootstrapped"));
        break;
    }
  }

  filtered.sort((a, b) => b.score - a.score);

  const limit = options?.limit ?? 50;
  const sliced = filtered.slice(0, limit);

  return sliced.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function saveLeaderboardEntry(
  entry: LeaderboardEntry
): Promise<{ rank: number }> {
  await loadPersistedFile();

  // Deduplicate by entry.id (runId)
  const existingIdx = memoryEntries.findIndex((e) => e.id === entry.id);
  if (existingIdx >= 0) {
    // Update if score is higher
    if (entry.score > memoryEntries[existingIdx]!.score) {
      memoryEntries[existingIdx] = entry;
    }
  } else {
    memoryEntries.push(entry);
  }

  memoryEntries.sort((a, b) => b.score - a.score);
  await writePersistedFile();

  const rank = memoryEntries.findIndex((e) => e.id === entry.id) + 1;
  return { rank: rank > 0 ? rank : memoryEntries.length };
}
