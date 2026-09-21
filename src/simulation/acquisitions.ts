import { BALANCE } from "../config/balance.js";
import type { CompetitorState, GameState } from "./types.js";
import { economyMult, marketScaleMultiplier } from "./products.js";

/** The cash price shown to the player for acquiring a competitor. */
export function acquisitionCost(competitor: Pick<CompetitorState, "funding">): number {
  return Math.round(Math.max(BALANCE.ACQUISITION_MIN_COST, competitor.funding * BALANCE.ACQUISITION_FUNDING_RATIO));
}

/**
 * A competitor's current market footprint translated into monthly revenue.
 * This is deliberately a projection: market share, capability, product depth,
 * hype, the economy, and the size of the market all shape the result.
 */
export function acquisitionMonthlyRevenue(state: GameState, competitor: CompetitorState): number {
  const marketShare = Math.max(0, competitor.marketShare);
  const capabilityMultiplier = 0.85 + Math.max(0, competitor.capability) / 40;
  const productDepthMultiplier = 0.8 + Math.min(8, competitor.products.length) * 0.16;
  const hypeMultiplier = 0.9 + Math.max(0, competitor.hype) / 160;

  return Math.max(
    0,
    Math.round(
      marketShare *
        BALANCE.ACQUISITION_REVENUE_PER_SHARE *
        capabilityMultiplier *
        productDepthMultiplier *
        hypeMultiplier *
        economyMult(state) *
        marketScaleMultiplier(state),
    ),
  );
}

export function totalAcquiredMonthlyRevenue(state: GameState): number {
  return state.company.acquisitions.reduce((total, id) => {
    const competitor = state.competitors.find((candidate) => candidate.id === id);
    return competitor ? total + acquisitionMonthlyRevenue(state, competitor) : total;
  }, 0);
}
