import { describe, expect, it } from 'vitest';
import { primitives } from '../../data/primitives';
import { primitiveIconPaths } from '../../ui/shared/PrimitiveIcons';
import { productArtifactSpec } from './ProductArtifact';

describe('product visual coverage', () => {
  it('gives every technology a distinct line icon', () => {
    const paths = primitives.map((primitive) => primitiveIconPaths[primitive.id]);
    expect(paths.every(Boolean)).toBe(true);
    expect(new Set(paths).size).toBe(primitives.length);
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
});
