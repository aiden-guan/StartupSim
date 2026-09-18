import { monthlyArr } from "./conditions";
import type { GameState } from "./types";

/** Stable identity check used by both the dilution mechanic and achievements. */
export function isEduardoSaverin(employee: { id?: string; name?: string; traits?: string[] }): boolean {
  if (!employee) return false;
  const id = employee.id?.toLowerCase() ?? "";
  const name = employee.name?.toLowerCase() ?? "";
  const traits = employee.traits ?? [];

  return (
    id.includes("saverin") ||
    id === "casey" ||
    id === "eduardo-saverin" ||
    name.includes("eduardo") ||
    name.includes("saverin") ||
    name.includes("savron") ||
    traits.includes("capital-connector")
  );
}

export type AchievementCategory = "scale" | "strategy" | "tech" | "culture" | "legacy";

export interface AchievementDef {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
  check: (game: GameState) => boolean;
}

export interface UnlockedAchievement {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  points: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Scale
  {
    id: "first-ship",
    title: "Hello World",
    subtitle: "Launch 1st Product",
    description: "Shipped your first AI product to the market.",
    icon: "🚀",
    category: "scale",
    points: 5_000,
    check: (g) => g.stats.productsLaunched >= 1,
  },
  {
    id: "ten-k-arr",
    title: "First Traction",
    subtitle: "$10k Monthly ARR",
    description: "Reached over $10,000 in monthly recurring revenue.",
    icon: "💵",
    category: "scale",
    points: 5_000,
    check: (g) => monthlyArr(g) >= 10_000,
  },
  {
    id: "one-m-arr",
    title: "Product-Market Fit",
    subtitle: "$1M Annual ARR",
    description: "Surpassed $1,000,000 in annual recurring revenue.",
    icon: "📈",
    category: "scale",
    points: 10_000,
    check: (g) => monthlyArr(g) * 12 >= 1_000_000,
  },
  {
    id: "ten-m-arr",
    title: "Centurion ARR",
    subtitle: "$10M Annual ARR",
    description: "Generated more than $10,000,000 in annual recurring revenue.",
    icon: "💰",
    category: "scale",
    points: 15_000,
    check: (g) => monthlyArr(g) * 12 >= 10_000_000,
  },
  {
    id: "unicorn-club",
    title: "Valuation With A Horn",
    subtitle: "$1B+ Valuation",
    description: "Built a company with an enterprise valuation over $1,000,000,000.",
    icon: "🦄",
    category: "scale",
    points: 20_000,
    check: (g) => g.stats.peakValuation >= 1_000_000_000 || g.company.valuation >= 1_000_000_000,
  },
  {
    id: "decacorn",
    title: "The Ten-Figure Titan",
    subtitle: "$10B+ Valuation",
    description: "Achieved an astronomical valuation of $10,000,000,000 or higher.",
    icon: "👑",
    category: "scale",
    points: 30_000,
    check: (g) => g.stats.peakValuation >= 10_000_000_000 || g.company.valuation >= 10_000_000_000,
  },

  // Strategy
  {
    id: "bootstrapped",
    title: "Ramen Profitable",
    subtitle: "Zero Outside VC",
    description: "Reached over $1,000,000 annual ARR without selling equity to venture capital.",
    icon: "🍜",
    category: "strategy",
    points: 25_000,
    check: (g) => monthlyArr(g) * 12 >= 1_000_000 && g.funding.raisedTotal === 0,
  },
  {
    id: "category-king",
    title: "Category King",
    subtitle: "$500k/mo Product",
    description: "Engineered a flagship product generating over $500,000 per month.",
    icon: "🏆",
    category: "strategy",
    points: 15_000,
    check: (g) => g.products.some((p) => (p.weeklyRevenue * 4.33) >= 500_000 || p.earnedRevenue >= 500_000),
  },
  {
    id: "blitzscale",
    title: "Blitzscale Velocity",
    subtitle: "$100M in Year 1",
    description: "Reached $100M+ valuation before the end of calendar year 2023.",
    icon: "⚡",
    category: "strategy",
    points: 25_000,
    check: (g) => (g.stats.peakValuation >= 100_000_000 || g.company.valuation >= 100_000_000) && g.clock.date.year <= 2023,
  },
  {
    id: "m-and-a-mogul",
    title: "Acquisition Empire",
    subtitle: "3+ Startups Acquired",
    description: "Bought out three or more competing companies in the AI ecosystem.",
    icon: "🤝",
    category: "strategy",
    points: 20_000,
    check: (g) => g.stats.acquisitions >= 3 || g.company.acquisitions.length >= 3,
  },
  {
    id: "strategic-pivot",
    title: "The Great Pivot",
    subtitle: "Sunset & Rebuild",
    description: "Successfully deprecated or sold an older product while sustaining active products.",
    icon: "🔄",
    category: "strategy",
    points: 10_000,
    check: (g) =>
      g.products.some((p) => p.status === "deprecated" || p.status === "sold") &&
      g.products.filter((p) => p.status === "active").length >= 1,
  },

  // Deep Tech
  {
    id: "frontier-builder",
    title: "Frontier Weights",
    subtitle: "Trained Foundation Model",
    description: "Completed training of an in-house proprietary frontier foundation model.",
    icon: "🧠",
    category: "tech",
    points: 20_000,
    check: (g) => g.company.specialProjects.includes("foundation-model"),
  },
  {
    id: "sovereign-silicon",
    title: "Custom Silicon",
    subtitle: "Private Racks or Chips",
    description: "Broke free from cloud vendors by designing custom AI chips or deploying a private GPU cluster.",
    icon: "🖲️",
    category: "tech",
    points: 20_000,
    check: (g) =>
      g.company.specialProjects.includes("gpu-cluster") ||
      g.company.specialProjects.includes("custom-chip") ||
      (g.compute.ownedCluster ?? 0) > 0 ||
      (g.compute.customChips ?? 0) > 0,
  },
  {
    id: "autonomous-frontier",
    title: "Self-Directing Lab",
    subtitle: "Autonomous Research",
    description: "Built autonomous research facilities that conduct synthetic experiments without humans.",
    icon: "🔬",
    category: "tech",
    points: 25_000,
    check: (g) => g.company.specialProjects.includes("autonomous-lab"),
  },
  {
    id: "megawatt-mind",
    title: "Exaflop Territory",
    subtitle: "1M+ Compute Burned",
    description: "Burned more than 1,000,000 compute units powering modern AI intelligence.",
    icon: "⚡",
    category: "tech",
    points: 15_000,
    check: (g) => g.stats.computeConsumed >= 1_000_000,
  },
  {
    id: "open-weights",
    title: "The Commons",
    subtitle: "Open Weights Maximalist",
    description: "Contributed weights to the open commons, fostering an open ecosystem.",
    icon: "🌐",
    category: "tech",
    points: 15_000,
    check: (g) =>
      g.endingId === "open-source" ||
      (g.products.filter((p) => p.combo.includes("opensource") && p.status === "active").length >= 2 && g.company.hype >= 20),
  },

  // Culture & Team
  {
    id: "flawless-record",
    title: "Clean Hands",
    subtitle: "Zero Scandals & High Trust",
    description: "Operated through 2025 or beyond with 0 regulatory or safety scandals and Trust >= 70.",
    icon: "🛡️",
    category: "culture",
    points: 20_000,
    check: (g) => g.clock.date.year >= 2025 && g.stats.scandals === 0 && g.company.trust >= 70,
  },
  {
    id: "hype-beast",
    title: "Timeline God",
    subtitle: "80+ Hype Rating",
    description: "Reached viral status with 80+ Hype, commanding every tech conversation.",
    icon: "🔥",
    category: "culture",
    points: 10_000,
    check: (g) => g.company.hype >= 80,
  },
  {
    id: "ghost-in-the-shell",
    title: "Minority Human",
    subtitle: "75%+ Automation or AI CEO",
    description: "Automated the CEO role or achieved over 75% average automation across departments.",
    icon: "🤖",
    category: "culture",
    points: 25_000,
    check: (g) => {
      if (g.company.ceoAutomated) return true;
      const autoVals = Object.values(g.company.automation);
      if (!autoVals.length) return false;
      const avg = autoVals.reduce((s, n) => s + n, 0) / autoVals.length;
      return avg >= 75;
    },
  },
  {
    id: "frontline-squad",
    title: "Scale Organization",
    subtitle: "20+ Team Members",
    description: "Grew the company to a peak team size of 20 or more talent specialists.",
    icon: "👥",
    category: "culture",
    points: 15_000,
    check: (g) => g.stats.peakEmployees >= 20 || g.employees.length >= 20,
  },

  // Founder mode / internal power plays
  {
    id: "the-social-network",
    title: "The Social Network",
    subtitle: "Dilute Eduardo Saverin",
    description: "Diluted co-founder Eduardo Saverin's equity stake. You better lawyer up.",
    icon: "🎬",
    category: "culture",
    points: 15_000,
    check: (g) => (g.stats.dilutionsCount ?? 0) > 0 && g.employees.some(isEduardoSaverin),
  },
  {
    id: "founder-mode",
    title: "Founder Mode",
    subtitle: "Consolidate Power",
    description: "Diluted a co-founder or employee's equity stake to consolidate power.",
    icon: "👑",
    category: "culture",
    points: 8_000,
    check: (g) => (g.stats.dilutionsCount ?? 0) > 0,
  },
  {
    id: "cold-blooded",
    title: "Cold Blooded",
    subtitle: "$1M Treasury, No Mercy",
    description: "Diluted or let go of a teammate while company cash exceeded $1,000,000.",
    icon: "🧊",
    category: "culture",
    points: 12_000,
    check: (g) => g.company.cash >= 1_000_000 && (g.stats.dilutionsCount ?? 0) > 0,
  },
  {
    id: "ruthless-operator",
    title: "Ruthless Operator",
    subtitle: "Three Dilutions",
    description: "Executed equity dilution three or more times across the company.",
    icon: "🦈",
    category: "culture",
    points: 10_000,
    check: (g) => (g.stats.dilutionsCount ?? 0) >= 3,
  },
  {
    id: "in-the-black",
    title: "In The Black",
    subtitle: "First Product Revenue",
    description: "Generated the company's first monthly product revenue.",
    icon: "💵",
    category: "scale",
    points: 4_000,
    check: (g) => g.company.lifetimeRevenue > 0 || g.company.lastMonthlyRevenue > 0,
  },

  // Legacy & Endings
  {
    id: "ring-the-bell",
    title: "Going Public",
    subtitle: "IPO Ending",
    description: "Rang the opening bell on Wall Street, listing your shares on the public market.",
    icon: "🔔",
    category: "legacy",
    points: 35_000,
    check: (g) => g.endingId === "ipo",
  },
  {
    id: "infrastructure-monopoly",
    title: "The Standard",
    subtitle: "Monopoly Ending",
    description: "Became foundational infrastructure routing the majority of the digital economy.",
    icon: "🏛️",
    category: "legacy",
    points: 40_000,
    check: (g) => g.endingId === "monopoly",
  },
  {
    id: "quiet-operator",
    title: "The Silent Bank",
    subtitle: "Quiet Profitability",
    description: "Reached Quiet Profitability with strong positive cashflow and without answering to a board.",
    icon: "🤫",
    category: "legacy",
    points: 30_000,
    check: (g) => g.endingId === "quiet-profit",
  },
  {
    id: "valiant-postmortem",
    title: "Post-Mortem Writeup",
    subtitle: "Runway Zero Survivor",
    description: "Went down swinging: faced bankruptcy after shipping at least 2 real products.",
    icon: "📜",
    category: "legacy",
    points: 10_000,
    check: (g) => g.endingId === "bankruptcy" && g.stats.productsLaunched >= 2,
  },
];

export const ACHIEVEMENT_MAP = new Map<string, AchievementDef>(
  ACHIEVEMENTS.map((a) => [a.id, a])
);

export function evaluateAchievements(game: GameState): UnlockedAchievement[] {
  const unlocked: UnlockedAchievement[] = [];
  for (const def of ACHIEVEMENTS) {
    try {
      if (def.check(game)) {
        unlocked.push({
          id: def.id,
          title: def.title,
          subtitle: def.subtitle,
          description: def.description,
          icon: def.icon,
          category: def.category,
          points: def.points,
        });
      }
    } catch {
      // Invariant resilience: if a check errors due to partial state, skip cleanly
    }
  }
  return unlocked;
}

export function unlockAchievement(game: GameState, id: string): boolean {
  if (!game.achievements) game.achievements = [];
  if (!game.achievements.includes(id)) {
    game.achievements.push(id);
    return true;
  }
  return false;
}

export function checkAchievements(game: GameState): string[] {
  const newlyUnlocked: string[] = [];
  for (const a of evaluateAchievements(game)) {
    if (unlockAchievement(game, a.id)) {
      newlyUnlocked.push(a.id);
    }
  }
  return newlyUnlocked;
}

export function getLifetimeAchievements(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem("compounding_lifetime_achievements");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLifetimeAchievement(id: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const current = new Set(getLifetimeAchievements());
    current.add(id);
    localStorage.setItem("compounding_lifetime_achievements", JSON.stringify(Array.from(current)));
  } catch {
    // Best effort
  }
}
