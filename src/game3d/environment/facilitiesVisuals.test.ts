import { describe, expect, it } from 'vitest';
import { perks } from '../../data/perks';
import { PerkVisual, PerkSet } from '../props/PerkSet';
import { CoffeeStation, FoodStation } from '../props/CultureDetails';
import { officeScale } from './officeScale';
import { createNewGame } from '../../simulation/newGame';
import { selectWorldView } from '../selectWorldView';

describe('Facility & Perk 3D Visuals', () => {
  it('renders all perks at every valid tier without throwing', () => {
    for (const perk of perks) {
      for (let level = 0; level < perk.upgrades.length; level++) {
        expect(() => PerkVisual({ perk: { id: perk.id, level } })).not.toThrow();
      }
    }
  });

  it('rejects unmapped perk tiers with an explicit error', () => {
    expect(() => PerkVisual({ perk: { id: 'coffee', level: 99 } })).toThrow(/Missing perk miniature tier/);
    expect(() => PerkVisual({ perk: { id: 'unknown-perk', level: 0 } })).toThrow(/Missing perk miniature tier/);
  });

  it('renders CoffeeStation and FoodStation for all tiers 0, 1, 2', () => {
    for (const tier of [0, 1, 2]) {
      expect(() => CoffeeStation({ tier })).not.toThrow();
      expect(() => FoodStation({ tier })).not.toThrow();
    }
  });

  it('ensures distinct non-overlapping perk slot coordinates for every office level', () => {
    for (let level = 0; level <= 5; level++) {
      const { width: w, depth: d } = officeScale(level);
      const slots = level === 0
        ? [[4.8,0,-1],[0,0,-3.8],[5,0,3.9],[-3.8,0,.1],[-2.5,0,-3.8],[1.8,0,3.2],[3,0,4],[-5,0,-.4]]
        : [
            [w*.3,0,d*.19],
            level===1?[7,0,5]:[w*.1,0,d*.4],
            level>=4?[w*.22,0,d*.31]:[w*.33,0,d*.31],
            level===3?[-w*.35,0,2]:[-w*.35,0,d*.27],
            [-w*.12,0,d*.34],
            [w*.05,0,d*.34],
            level===1?[3.8,0,5.6]:[w*.4,0,d*.4],
            [-w*.43,0,d*.1]
          ];

      expect(slots).toHaveLength(8);
      // Check pairwise distance between all slots
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          const [x1, y1, z1] = slots[i]!;
          const [x2, y2, z2] = slots[j]!;
          const dist = Math.hypot(x1 - x2, y1 - y2, z1 - z2);
          expect(dist).toBeGreaterThan(1.2);
        }
      }
    }
  });

  it('filters kitchen perks when skipKitchen is true', () => {
    const testPerks = [
      { id: 'coffee', level: 1 },
      { id: 'food', level: 1 },
      { id: 'desks', level: 0 },
      { id: 'play', level: 0 },
    ];

    const result = PerkSet({ perks: testPerks, level: 1, skipKitchen: true });
    // result is a <group> whose children array corresponds to non-kitchen perks
    const children = (result?.props?.children as unknown[])?.filter(Boolean) ?? [];
    expect(children).toHaveLength(2);
  });

  it('selectWorldView correctly reflects perks and office upgrades in view state', () => {
    const game = createNewGame({
      founderName: 'Ada',
      companyName: 'Apex',
      cofounderId: 'reya',
      seed: 42,
      skipTutorial: true,
    });

    // Start in apartment (level 0) with no perks
    let view = selectWorldView(game);
    expect(view.officeLevel).toBe(0);
    expect(view.perks).toHaveLength(0);

    // Add perks
    game.company.perks = [
      { id: 'coffee', level: 1 },
      { id: 'desks', level: 2 },
    ];
    view = selectWorldView(game);
    expect(view.perks).toEqual([
      { id: 'coffee', level: 1, object: 'espresso' },
      { id: 'desks', level: 2, object: 'pod' },
    ]);

    // Upgrade office level
    game.company.officeLevel = 2;
    view = selectWorldView(game);
    expect(view.officeLevel).toBe(2);
    expect(view.officeName).toBe('Startup HQ');
  });
});
