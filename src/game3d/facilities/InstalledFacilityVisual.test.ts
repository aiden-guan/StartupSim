import { describe, expect, it } from 'vitest';
import { InstalledFacilityVisual, InstalledKitchen } from './InstalledFacilityVisual';

describe('installed facility art', () => {
  const facilityTiers = {
    rest: 3,
    play: 3,
    life: 4,
    gym: 2,
  } as const;

  it('covers every supported facility tier at a tiny office footprint', () => {
    for (const [id, count] of Object.entries(facilityTiers)) {
      for (let tier = 0; tier < count; tier += 1) {
        const visual = InstalledFacilityVisual({
          id,
          tier,
          width: id === 'gym' ? 1.4 : id === 'play' ? 2.6 : 2,
          depth: id === 'play' ? 1.3 : id === 'gym' ? 1.4 : 2.4,
        });
        expect(visual.props.id).toMatch(/^facility_/);
      }
    }
  });

  it('keeps the renderer strict about IDs and tiers', () => {
    expect(() => InstalledFacilityVisual({ id: 'unknown', tier: 0, width: 2, depth: 2 })).toThrow(/Unknown installed facility id/);
    expect(() => InstalledFacilityVisual({ id: 'rest', tier: 3, width: 2, depth: 2 })).toThrow(/Invalid installed facility tier/);
    expect(() => InstalledFacilityVisual({ id: 'gym', tier: 1.5, width: 2, depth: 2 })).toThrow(/Invalid installed facility tier/);
    expect(() => InstalledFacilityVisual({ id: 'rest', tier: 0, width: 0, depth: 2 })).toThrow(/footprint/);
  });

  it('covers absent, basic, upgraded, and full kitchen combinations', () => {
    for (const coffeeTier of [-1, 0, 1, 2]) {
      for (const foodTier of [-1, 0, 1, 2]) {
        expect(() => InstalledKitchen({ coffeeTier, foodTier })).not.toThrow();
      }
    }
    expect(() => InstalledKitchen({ coffeeTier: 3, foodTier: -1 })).toThrow(/coffee tier/);
    expect(() => InstalledKitchen({ coffeeTier: -1, foodTier: 3 })).toThrow(/food tier/);
  });
});

