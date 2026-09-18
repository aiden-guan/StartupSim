/**
 * Physical presentation limits for compute. Capacity can keep growing in the
 * simulation, but an office has a finite, legible equipment footprint.
 */
export const MAX_VISIBLE_RACKS = [1, 2, 4, 7, 10, 14] as const;

export interface ComputeRackInput {
  computeTier: number;
  rentedGpus: number;
  ownedCluster: number;
  dataCenters: number;
  hasGpuCluster: boolean;
}

export interface ComputeRackLayout {
  requested: number;
  shown: number;
  overflow: number;
  columns: number;
  rows: number;
  positions: [number, number, number][];
}

export function maxVisibleRacksForOffice(level: number): number {
  return MAX_VISIBLE_RACKS[Math.max(0, Math.min(MAX_VISIBLE_RACKS.length - 1, Math.floor(level)))]!;
}

export function requestedComputeRacks(input: ComputeRackInput): number {
  if (input.computeTier <= 0) return 0;
  const rentalRacks = input.rentedGpus > 0 ? Math.min(2, Math.ceil(input.rentedGpus / 8)) : 0;
  const clusterRacks = input.ownedCluster > 0 ? Math.ceil(input.ownedCluster / 4) : 0;
  const privateClusterRacks = input.hasGpuCluster ? 2 : 0;
  const dataCenterRacks = input.dataCenters * 4;
  return Math.max(1, rentalRacks + clusterRacks + privateClusterRacks + dataCenterRacks);
}

export function computeRackLayout(level: number, requested: number): ComputeRackLayout {
  const safeRequested = Math.max(0, Math.floor(requested));
  const shown = Math.min(safeRequested, maxVisibleRacksForOffice(level));
  if (!shown) return { requested: safeRequested, shown: 0, overflow: 0, columns: 0, rows: 0, positions: [] };

  const officeColumns = level <= 1 ? 2 : level === 2 ? 2 : level === 3 ? 3 : level === 4 ? 4 : 5;
  const columns = Math.min(officeColumns, shown);
  const rows = Math.ceil(shown / columns);
  const positions: [number, number, number][] = Array.from({ length: shown }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    return [
      (column - (columns - 1) / 2) * 1.02,
      0,
      (row - (rows - 1) / 2) * 1.28,
    ];
  });
  return { requested: safeRequested, shown, overflow: Math.max(0, safeRequested - shown), columns, rows, positions };
}
