import { describe, expect, it } from 'vitest';
import { computeRackLayout, maxVisibleRacksForOffice, requestedComputeRacks } from './computeLayout';

describe('compute rack layout', () => {
  it('keeps the visible footprint bounded by office size', () => {
    expect(maxVisibleRacksForOffice(0)).toBe(1);
    expect(maxVisibleRacksForOffice(3)).toBe(24);
    expect(maxVisibleRacksForOffice(99)).toBe(48);

    const layout = computeRackLayout(3, 30);
    expect(layout.shown).toBe(24);
    expect(layout.overflow).toBe(6);
    expect(layout.positions).toHaveLength(24);
  });

  it('shows a private cluster as at least sixteen physical units', () => {
    const layout = computeRackLayout(2, requestedComputeRacks({
      computeTier: 3,
      rentedGpus: 3,
      ownedCluster: 8,
      dataCenters: 0,
      hasGpuCluster: true,
    }));
    expect(layout.requested).toBe(16);
    expect(layout.shown).toBe(16);
    expect(layout.columns).toBe(4);
    expect(layout.rows).toBe(4);
  });

  it('centers racks in an even grid instead of extending from the office', () => {
    const layout = computeRackLayout(4, 8);
    expect(layout.columns).toBe(4);
    expect(layout.rows).toBe(2);
    expect(layout.positions[0]).toEqual([-1.53, 0, -0.64]);
    expect(layout.positions.at(-1)).toEqual([1.53, 0, 0.64]);
  });

  it('counts compute units without changing simulation economics', () => {
    expect(requestedComputeRacks({
      computeTier: 2,
      rentedGpus: 16,
      ownedCluster: 9,
      dataCenters: 2,
      hasGpuCluster: true,
    })).toBe(33);
    expect(requestedComputeRacks({
      computeTier: 0,
      rentedGpus: 64,
      ownedCluster: 64,
      dataCenters: 64,
      hasGpuCluster: true,
    })).toBe(0);
  });
});
