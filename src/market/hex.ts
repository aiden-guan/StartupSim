export interface Axial {
  row: number;
  col: number;
}

const evenAdj: Axial[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
];
const oddAdj: Axial[] = [
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

export function posKey(p: Axial): string {
  return `${p.row},${p.col}`;
}

export function samePos(a: Axial, b: Axial): boolean {
  return a.row === b.row && a.col === b.col;
}

export function neighbors(pos: Axial): Axial[] {
  const shifts = pos.row % 2 === 0 ? evenAdj : oddAdj;
  return shifts.map((s) => ({ row: pos.row + s.row, col: pos.col + s.col }));
}

export function manhattan(a: Axial, b: Axial): number {
  if (samePos(a, b)) return 0;
  return Math.max(
    Math.abs(b.row - a.row),
    Math.abs(Math.ceil(b.row / -2) + b.col - Math.ceil(a.row / -2) - a.col),
    Math.abs(-b.row - Math.ceil(b.row / -2) - b.col + a.row + Math.ceil(a.row / -2) + a.col),
  );
}

export function pixelFor(pos: Axial, size: number): { x: number; y: number } {
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  const x = pos.col * (w * 0.75) + (pos.row % 2 === 0 ? 0 : w * 0.375);
  const y = pos.row * h;
  return { x, y };
}

export function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(`${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`);
  }
  return pts.join(" ");
}
