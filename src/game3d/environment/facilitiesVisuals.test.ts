import { describe, expect, it } from 'vitest';
import { perks } from '../../data/perks';
import { PerkPreviewVisual } from '../props/PerkPreviewVisual';
import { CoffeeStation, FoodStation } from '../props/CultureDetails';
import { createNewGame } from '../../simulation/newGame';
import { selectWorldView } from '../selectWorldView';

describe('Facility & Perk 3D Visuals', () => {
  it('renders all perks at every valid tier without throwing', () => {
    for (const perk of perks) {
      for (let level = 0; level < perk.upgrades.length; level++) {
        expect(() => PerkPreviewVisual({ perk: { id: perk.id, level } })).not.toThrow();
      }
    }
  });

  it('rejects unmapped perk tiers with an explicit error', () => {
    expect(() => PerkPreviewVisual({ perk: { id: 'coffee', level: 99 } })).toThrow(/Missing perk miniature tier/);
    expect(() => PerkPreviewVisual({ perk: { id: 'unknown-perk', level: 0 } })).toThrow(/Missing perk miniature tier/);
  });

  it('renders CoffeeStation and FoodStation for all tiers 0, 1, 2', () => {
    for (const tier of [0, 1, 2]) {
      expect(() => CoffeeStation({ tier })).not.toThrow();
      expect(() => FoodStation({ tier })).not.toThrow();
    }
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
