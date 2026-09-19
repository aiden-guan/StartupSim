export type StartupTierId =
  | "hectocorn"
  | "decacorn"
  | "unicorn"
  | "scale-up"
  | "venture-backed"
  | "early-stage";

export interface StartupTier {
  id: StartupTierId;
  label: string;
  threshold: number;
  description: string;
}

const STARTUP_TIERS: StartupTier[] = [
  {
    id: "hectocorn",
    label: "Hectocorn",
    threshold: 100_000_000_000,
    description: "$100B+ peak valuation",
  },
  {
    id: "decacorn",
    label: "Decacorn",
    threshold: 10_000_000_000,
    description: "$10B+ peak valuation",
  },
  {
    id: "unicorn",
    label: "Unicorn",
    threshold: 1_000_000_000,
    description: "$1B+ peak valuation",
  },
  {
    id: "scale-up",
    label: "Scale-up",
    threshold: 100_000_000,
    description: "$100M+ peak valuation",
  },
  {
    id: "venture-backed",
    label: "Venture-backed",
    threshold: 10_000_000,
    description: "$10M+ peak valuation",
  },
  {
    id: "early-stage",
    label: "Early-stage",
    threshold: 0,
    description: "Below $10M peak valuation",
  },
];

export function startupTierForValuation(valuation: number): StartupTier {
  const normalized = Math.max(0, Number.isFinite(valuation) ? valuation : 0);
  return STARTUP_TIERS.find((tier) => normalized >= tier.threshold) ?? STARTUP_TIERS[STARTUP_TIERS.length - 1]!;
}
