import { describe, expect, it } from 'vitest';
import { computeRackLayout, maxVisibleRacksForOffice, requestedComputeRacks } from './computeLayout';

describe('compute rack layout', () => {
  it('keeps the visible footprint bounded by office size', () => {
    expect(maxVisibleRacksForOffice(0)).toBe(8);
    expect(maxVisibleRacksForOffice(1)).toBe(9);
    expect(maxVisibleRacksForOffice(3)).toBe(36);
    expect(maxVisibleRacksForOffice(99)).toBe(96);

    const layout = computeRackLayout(3, 50);
    expect(layout.shown).toBe(36);
    expect(layout.overflow).toBe(14);
    expect(layout.positions).toHaveLength(36);
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

    const largerOffice = computeRackLayout(2, 30);
    expect(largerOffice.shown).toBe(24);
    expect(largerOffice.columns).toBe(4);
    expect(largerOffice.rows).toBe(6);
  });

  it('uses available compute width to keep larger banks shallow and centered', () => {
    const layout = computeRackLayout(4, 16);
    expect(layout.columns).toBe(8);
    expect(layout.rows).toBe(2);
    expect(layout.positions[0]![0]).toBeCloseTo(-3.57, 10);
    expect(layout.positions[0]![2]).toBeCloseTo(-0.64, 10);
    expect(layout.positions.at(-1)![0]).toBeCloseTo(3.57, 10);
    expect(layout.positions.at(-1)![2]).toBeCloseTo(0.64, 10);
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
