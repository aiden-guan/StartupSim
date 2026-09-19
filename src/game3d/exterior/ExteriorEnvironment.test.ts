import { describe, expect, it } from "vitest";
import { locations } from "../../data/locations";
import { cityThemeFor, cityThemes } from "./cityThemes";
import { ExteriorEnvironment, exteriorBoundsFor, TRANSIT_CYCLE_SECONDS, transitMotionAt } from "./ExteriorEnvironment";

describe("city exterior configuration", () => {
  it("covers exactly every purchasable location", () => {
    expect(Object.keys(cityThemes).sort()).toEqual(locations.map((location) => location.id).sort());
    for (const location of locations) {
      const theme = cityThemeFor(location.id);
      expect(theme.id).toBe(location.id);
      expect(theme.name).toBeTruthy();
      expect(theme.building.length).toBeGreaterThan(0);
    }
  });

  it("falls back safely for home, null, and unknown locations", () => {
    expect(cityThemeFor(null).id).toBe("home");
    expect(cityThemeFor("home").id).toBe("home");
    expect(cityThemeFor("future-city").id).toBe("home");
  });

  it("keeps frontage and side dressing outside every office footprint", () => {
    for (let level = 0; level <= 5; level += 1) {
      const bounds = exteriorBoundsFor(level);
      expect(bounds.roadZ).toBeGreaterThan(bounds.officeMaxZ + bounds.clearance);
      expect(bounds.sideInnerX).toBeGreaterThan(bounds.officeMaxX);
      expect(bounds.officeMinZ).toBeLessThan(bounds.officeMaxZ);
    }
  });

  it("can construct every quality and transit tier without throwing", () => {
    for (const quality of ["low", "medium", "high"] as const) {
      for (const transitTier of [-1, 0, 1]) {
        expect(() => ExteriorEnvironment({ level: 2, locationId: "tokyo", transitTier, reducedMotion: false, quality })).not.toThrow();
      }
    }
  });
});

describe("exterior transit", () => {
  it("uses a deterministic approach, dwell, depart loop", () => {
    const span = 12;
    expect(transitMotionAt(0, span).state).toBe("APPROACH");
    expect(transitMotionAt(TRANSIT_CYCLE_SECONDS * 0.5, span).state).toBe("DWELL");
    expect(transitMotionAt(TRANSIT_CYCLE_SECONDS - 0.1, span).state).toBe("DEPART");
    expect(transitMotionAt(TRANSIT_CYCLE_SECONDS + 0.1, span)).toEqual(transitMotionAt(0.1, span));
  });

  it("parks at the curb under reduced motion", () => {
    const parked = transitMotionAt(99, 12, true);
    expect(parked).toEqual({ state: "DWELL", progress: 1, x: 0, curb: 1, rotationY: 0, parked: true });
  });
});
