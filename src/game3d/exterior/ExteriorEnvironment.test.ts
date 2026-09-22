import { describe, expect, it } from "vitest";
import { locations } from "../../data/locations";
import { cityThemeFor, cityThemes } from "./cityThemes";
import { ExteriorEnvironment, exteriorBoundsFor, frontVegetationPositionFor, TRANSIT_CYCLE_SECONDS, transitExchangeAt, transitLaneZFor, transitMotionAt } from "./ExteriorEnvironment";

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

  it("keeps frontage trees outside the road for every office size", () => {
    for (let level = 0; level <= 5; level += 1) {
      const bounds = exteriorBoundsFor(level);
      for (const side of [-1, 1] as const) {
        for (let index = 0; index < 6; index += 1) {
          const [x, y, z] = frontVegetationPositionFor(bounds, side, index);
          expect(y).toBe(0);
          expect(Math.abs(x)).toBeGreaterThan(bounds.roadWidth / 2 + bounds.clearance);
          expect(z).toBeGreaterThan(bounds.officeMaxZ);
        }
      }
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
  it("uses one fixed drive lane through approach, stop, and departure", () => {
    for (let level = 0; level <= 5; level += 1) {
      const bounds = exteriorBoundsFor(level);
      const lane = transitLaneZFor(bounds);
      expect(lane).toBe(bounds.roadZ - 4.2 / 2 + 0.85);
      expect(lane).toBeGreaterThan(bounds.roadZ - 4.2 / 2);
      expect(lane).toBeLessThan(bounds.roadZ + 4.2 / 2);
    }
  });

  it("uses a deterministic approach, dwell, depart loop", () => {
    const span = 12;
    expect(transitMotionAt(0, span).state).toBe("APPROACH");
    expect(transitMotionAt(TRANSIT_CYCLE_SECONDS * 0.5, span).state).toBe("DWELL");
    expect(transitMotionAt(TRANSIT_CYCLE_SECONDS - 0.1, span).state).toBe("DEPART");
    expect(transitMotionAt(TRANSIT_CYCLE_SECONDS + 0.1, span)).toEqual(transitMotionAt(0.1, span));
    for (const time of [0, 7.5, 9.5, 15, 21]) {
      expect(transitMotionAt(time, span).curb).toBe(1);
    }
  });

  it("parks at the curb under reduced motion", () => {
    const parked = transitMotionAt(99, 12, true);
    expect(parked).toEqual({ state: "DWELL", progress: 1, x: 0, curb: 1, rotationY: 0, parked: true });
  });

  it("unloads workers before boarding the next group", () => {
    const inbound = transitExchangeAt(9.6, "INBOUND", 0, 3);
    const outboundEarly = transitExchangeAt(9.6, "OUTBOUND", 0, 2);
    expect(inbound.visible).toBe(true);
    expect(inbound.path).toBeGreaterThan(0);
    expect(outboundEarly.visible).toBe(false);

    const inboundLate = transitExchangeAt(13, "INBOUND", 0, 3);
    const outbound = transitExchangeAt(13, "OUTBOUND", 0, 2);
    expect(inboundLate.visible).toBe(false);
    expect(outbound.visible).toBe(true);
    expect(outbound.path).toBeLessThan(1);
  });

  it("keeps three private cars staggered so only one occupies the stop", () => {
    const offsets = [0, TRANSIT_CYCLE_SECONDS / 3, TRANSIT_CYCLE_SECONDS * 2 / 3];
    for (let time = 0; time < TRANSIT_CYCLE_SECONDS; time += .25) {
      const dwellers = offsets.filter((offset) => transitMotionAt(time + offset, 12).state === "DWELL");
      expect(dwellers.length).toBeLessThanOrEqual(1);
    }
  });
});
