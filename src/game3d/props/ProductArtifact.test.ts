import { describe, expect, it } from 'vitest';
import { recipes } from '../../data/recipes';
import { perks } from '../../data/perks';
import { promos } from '../../data/promos';
import { PerkPreviewVisual } from './PerkPreviewVisual';
import { PromoVisual } from './PromoVisuals';
import { primitiveDesignFor, recipeDesignFor, recipeDesigns } from './products/catalog';
import { partRenderers } from './products/Parts';
import { primitives } from '../../data/primitives';
import { primitiveIconPaths } from '../../ui/shared/PrimitiveIcons';
import { fallbackProductDesign, ProductArtifact, productArtifactSpec } from './ProductArtifact';

describe('product visual coverage', () => {
  it('gives every technology a distinct line icon', () => {
    const paths = primitives.map((primitive) => primitiveIconPaths[primitive.id]);
    expect(paths.every(Boolean)).toBe(true);
    expect(new Set(paths).size).toBe(primitives.length);
  });

  it('covers every primitive and every unique named recipe with authored parts', () => {
    for (const item of primitives) expect(primitiveDesignFor(item.id).parts.length).toBeGreaterThan(0);
    const unique = [...new Set(recipes.map(r=>r.id))];
    expect(Object.keys(recipeDesigns).sort()).toEqual(unique.sort());
    for(const r of recipes) {
      const design=recipeDesignFor(...r.parts)!;
      expect(design).toBe(recipeDesignFor(r.parts[1],r.parts[0]));
      expect(design.parts.every(p=>partRenderers[p.kind])).toBe(true);
    }
    expect(new Set(Object.values(recipeDesigns).map(d=>JSON.stringify(d.parts))).size).toBe(unique.length);
    expect(()=>primitiveDesignFor('missing')).toThrow();
    const saved=recipeDesigns['chat.code'];
    delete recipeDesigns['chat.code'];
    try { expect(()=>recipeDesignFor('chat','code')).toThrow('Missing recipe visual'); }
    finally { recipeDesigns['chat.code']=saved!; }
    expect(recipeDesignFor('chat','chat')).toBeUndefined();
  });

  it('accepts every Culture tier and Promotion and rejects unmapped content',()=>{
    for(const perk of perks) for(let level=0;level<perk.upgrades.length;level++) expect(()=>PerkPreviewVisual({perk:{id:perk.id,level}})).not.toThrow();
    for(const promo of promos) expect(()=>PromoVisual({id:promo.id})).not.toThrow();
    expect(()=>PerkPreviewVisual({perk:{id:'coffee',level:99}})).toThrow();
    expect(()=>PromoVisual({id:'missing'})).toThrow();
  });

  it('builds a stable artifact for every possible pair', () => {
    for (const first of primitives) {
      for (const second of primitives) {
        const forward = productArtifactSpec(first.id, second.id);
        const reverse = productArtifactSpec(second.id, first.id);
        expect(forward).toEqual(reverse);
        expect(forward.parts).toEqual([first.id, second.id].sort());
        expect(primitiveIconPaths[forward.parts[0]]).toBeTruthy();
        expect(primitiveIconPaths[forward.parts[1]]).toBeTruthy();
      }
    }
  });

  it('generates a valid composite fallback design for uncataloged product pairs', () => {
    const fallback = fallbackProductDesign('chat', 'robotics');
    const reversed = fallbackProductDesign('robotics', 'chat');
    expect(fallback).toEqual(reversed);
    expect(fallback.parts.length).toBeGreaterThanOrEqual(2);
    expect(fallback.concept).toContain('Conversation');
    expect(() => ProductArtifact({ a: 'chat', b: 'robotics', allowFallback: true })).not.toThrow();
    // Default without allowFallback still returns QuestionMarkArtifact for uncataloged pairs
    expect(recipeDesignFor('chat', 'robotics')).toBeUndefined();
  });
});
