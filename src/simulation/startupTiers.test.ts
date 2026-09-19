import { describe, expect, it } from "vitest";
import { startupTierForValuation } from "./startupTiers";

describe("startup valuation tiers", () => {
  it("classifies a $10B company as a decacorn", () => {
    expect(startupTierForValuation(10_000_000_000).label).toBe("Decacorn");
  });

  it("uses established startup scale terms at the major thresholds", () => {
    expect(startupTierForValuation(100_000_000_000).label).toBe("Hectocorn");
    expect(startupTierForValuation(1_000_000_000).label).toBe("Unicorn");
    expect(startupTierForValuation(100_000_000).label).toBe("Scale-up");
  });
});
