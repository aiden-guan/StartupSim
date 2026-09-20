export const identity = {
  title: "Compounding",
  subtitle: "Late 2022. Two laptops. No product.",
  shortTitle: "Compounding",
  mentorName: "Marcus Vale",
  mentorTitle: "Partner · Compound Capital",
  mentorEmail: "marcus@compound.capital",
  currency: "USD",
  companyFallback: "Northstar Labs",
  version: "0.2.0",
};

export const BRAND_COLORS = ["#c4622d", "#1f6b4a", "#2b3a55", "#5b4b8a", "#8a3b2f", "#1b2230"] as const;

export const BRAND_SECONDARY_COLORS = ["#f4ead7", "#d8e9df", "#d8e6ef", "#e9def0", "#f1d9ce", "#dfe4eb"] as const;

export const BRAND_PATTERNS = ["solid", "split", "stripes", "frame"] as const;

export type Identity = typeof identity;
