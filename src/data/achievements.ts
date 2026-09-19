import {
  ACHIEVEMENTS as SIMULATION_ACHIEVEMENTS,
  isEduardoSaverin,
} from "../simulation/achievements";

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "founders" | "growth" | "chaos" | "tech" | "business";
  subtitle: string;
  points: number;
  secret?: boolean;
}

const categoryMap: Record<string, AchievementDef["category"]> = {
  scale: "growth",
  strategy: "business",
  tech: "tech",
  culture: "chaos",
  legacy: "business",
};

const foundersAchievements = new Set(["the-social-network", "founder-mode"]);
const chaosAchievements = new Set(["cold-blooded", "ruthless-operator"]);

/**
 * Presentation metadata for the canonical simulation achievement catalog.
 * Unlock criteria live in src/simulation/achievements.ts so scoring, saves,
 * the HUD, and the achievements overlay cannot drift apart.
 */
export const ACHIEVEMENTS: AchievementDef[] = SIMULATION_ACHIEVEMENTS.map((achievement) => ({
  id: achievement.id,
  name: achievement.title,
  description: achievement.description,
  icon: achievement.icon,
  category: foundersAchievements.has(achievement.id)
    ? "founders"
    : chaosAchievements.has(achievement.id)
      ? "chaos"
      : categoryMap[achievement.category] ?? "business",
  subtitle: achievement.subtitle,
  points: achievement.points,
  secret: achievement.secret,
}));

export const achievementById: Record<string, AchievementDef> = Object.fromEntries(
  ACHIEVEMENTS.map((achievement) => [achievement.id, achievement]),
);

export { isEduardoSaverin };
