/** Physical presentation only. Capacity and office prices remain in data/offices. */
export const OFFICE_SCALE = [
  { width: 12.2, depth: 10.2, wallHeight: 2.8, camera: [10, 11, 13] },
  { width: 18, depth: 14, wallHeight: 3.2, camera: [13, 16, 17] },
  { width: 28, depth: 22, wallHeight: 4, camera: [19, 23, 24] },
  { width: 40, depth: 30, wallHeight: 5.2, camera: [28, 33, 36] },
  { width: 60, depth: 45, wallHeight: 7.2, camera: [43, 52, 56] },
  { width: 90, depth: 65, wallHeight: 9.5, camera: [68, 83, 88] },
] as const;

export function officeScale(level: number) {
  return OFFICE_SCALE[Math.max(0, Math.min(5, Math.floor(level)))]!;
}
