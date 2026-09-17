import { describe, expect, it } from 'vitest';
import { referenceLooks } from '../game3d/characters/ReferenceLooks';
import {
  DEFAULT_FOUNDER_LOOK,
  HAIR_COLORS,
  HAIR_STYLES,
  PANTS_IDS,
  SHOES_IDS,
  SKIN_TONES,
  TOP_IDS,
  lookFromSeed,
  normalizeLook,
} from './look';

describe('Character Look Customization & Normalization', () => {
  it('normalizes undefined or empty input to valid default founder look', () => {
    const look = normalizeLook(null);
    expect(look).toBeDefined();
    expect(look.skin).toBe(SKIN_TONES[0]);
    expect(look.hair).toBe(HAIR_COLORS[0]);
    expect(look.hairStyle).toBe('short');
    expect(look.beard).toBe(false);
    expect(look.glassesId).toBe('none');

    // DEFAULT_FOUNDER_LOOK matches schema standards
    expect(DEFAULT_FOUNDER_LOOK.archetype).toBe('founder');
    expect(SKIN_TONES).toContain(DEFAULT_FOUNDER_LOOK.skin);
    expect(HAIR_STYLES).toContain(DEFAULT_FOUNDER_LOOK.hairStyle);
  });

  it('preserves newly added hairstyles and beard properties', () => {
    const baldingLook = normalizeLook({
      hairStyle: 'balding',
      beard: true,
      beardColor: '#8c929a',
    });
    expect(baldingLook.hairStyle).toBe('balding');
    expect(baldingLook.beard).toBe(true);
    expect(baldingLook.beardColor).toBe('#8c929a');

    const beanieLook = normalizeLook({
      hairStyle: 'beanie',
      hair: '#1e2023',
      beard: true,
      beardColor: '#6d727a',
    });
    expect(beanieLook.hairStyle).toBe('beanie');
    expect(beanieLook.beard).toBe(true);
    expect(beanieLook.beardColor).toBe('#6d727a');
  });

  it('validates all 8 founder archetypes in ReferenceLooks', () => {
    expect(referenceLooks.length).toBe(8);

    const names = referenceLooks.map((r) => r.name);
    expect(names).toContain('Steve Jobs');
    expect(names).toContain('Mark Zuckerberg');
    expect(names).toContain('Bill Gates');
    expect(names).toContain('Sam Altman');
    expect(names).toContain('Jensen Huang');
    expect(names).toContain('Elon Musk');
    expect(names).toContain('Reed Hastings');
    expect(names).toContain('Jeff Bezos');

    for (const ref of referenceLooks) {
      expect(ref.name).toBeTruthy();
      expect(ref.role).toBeTruthy();
      const look = ref.look;
      expect(SKIN_TONES).toContain(look.skin);
      expect(HAIR_STYLES).toContain(look.hairStyle);
      expect(TOP_IDS).toContain(look.topId);
      expect(PANTS_IDS).toContain(look.pantsId);
      expect(SHOES_IDS).toContain(look.shoesId);
      expect(typeof look.beard).toBe('boolean');
    }
  });

  it('produces deterministic looks from the same seed', () => {
    const lookA = lookFromSeed('startup-seed-123');
    const lookB = lookFromSeed('startup-seed-123');
    expect(lookA).toEqual(lookB);

    const lookC = lookFromSeed('startup-seed-456');
    expect(lookA).not.toEqual(lookC);
  });

  it('handles extreme customization combinations safely', () => {
    const extremeCombos = [
      { hairStyle: 'bald' as const, beard: true, glassesId: 'round' as const },
      { hairStyle: 'balding' as const, beard: false, glassesId: 'rect' as const },
      { hairStyle: 'beanie' as const, beard: true, accessory: 'headphones' as const },
      { hairStyle: 'swept' as const, topId: 'turtleneck' as const, shoesId: 'boots' as const },
    ];

    for (const combo of extremeCombos) {
      const normalized = normalizeLook(combo);
      expect(normalized.hairStyle).toBe(combo.hairStyle);
      expect(normalized.beard).toBe(combo.beard ?? false);
    }
  });
});
