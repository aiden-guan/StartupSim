import type { Vector3Tuple } from "three";

export type PointKind = "desk" | "coffee" | "board" | "idle" | "lab" | "meet" | "server" | "entrance";

export interface ActivityPoint {
  id: string;
  kind: PointKind;
  position: Vector3Tuple;
  look: Vector3Tuple;
  capacity: number;
}

export interface OfficeLayout {
  id: string;
  level: number;
  points: ActivityPoint[];
  hub: Vector3Tuple;
  camera: { overview: Vector3Tuple; target: Vector3Tuple; min: number; max: number };
}

export const apartmentLayout: OfficeLayout = {
  id: "apartment",
  level: 0,
  hub: [0.2, 0, 0.4],
  camera: { overview: [-4.2, 7.4, 5.6], target: [0.2, 0.4, -0.5], min: 4, max: 14 },
  points: [
    { id: "desk-a", kind: "desk", position: [-2.35, 0, -1.35], look: [-2.35, 0, -2.4], capacity: 1 },
    { id: "desk-b", kind: "desk", position: [2.05, 0, -1.4], look: [2.05, 0, -2.4], capacity: 1 },
    { id: "coffee", kind: "coffee", position: [3.55, 0, 1.7], look: [4.2, 0, 1.7], capacity: 1 },
    { id: "board", kind: "board", position: [-0.2, 0, 2.35], look: [-0.2, 0, 3.3], capacity: 2 },
    { id: "idle-window", kind: "idle", position: [3.4, 0, -2.6], look: [4.2, 0, -3.2], capacity: 1 },
    { id: "idle-rug", kind: "idle", position: [0.15, 0, 0.45], look: [0.4, 0, -0.2], capacity: 2 },
    { id: "entrance", kind: "entrance", position: [0.3, 0, 4.1], look: [0.3, 0, 0], capacity: 4 },
  ],
};

export const garageLayout: OfficeLayout = {
  id: "garage-office",
  level: 1,
  hub: [0, 0, 0.5],
  camera: { overview: [-12, 13, 13], target: [0, 0.5, 0], min: 8, max: 28 },
  points: [
    { id: "d1", kind: "desk", position: [-4.5, 0, -1.7], look: [-4.5, 0, -2.8], capacity: 1 },
    { id: "d2", kind: "desk", position: [-2.2, 0, -1.7], look: [-2.2, 0, -2.8], capacity: 1 },
    { id: "d3", kind: "desk", position: [0.1, 0, -1.7], look: [0.1, 0, -2.8], capacity: 1 },
    { id: "d4", kind: "desk", position: [2.4, 0, -1.7], look: [2.4, 0, -2.8], capacity: 1 },
    { id: "coffee", kind: "coffee", position: [5.2, 0, 2.2], look: [5.8, 0, 2.2], capacity: 2 },
    { id: "board", kind: "board", position: [-5.4, 0, 2.4], look: [-6, 0, 2.4], capacity: 2 },
    { id: "meet", kind: "meet", position: [2.8, 0, 3.4], look: [2.8, 0, 4], capacity: 4 },
    { id: "server", kind: "server", position: [5.4, 0, -2.8], look: [6, 0, -2.8], capacity: 1 },
    { id: "idle", kind: "idle", position: [-0.4, 0, 1.2], look: [0, 0, 0], capacity: 3 },
    { id: "entrance", kind: "entrance", position: [0, 0, 6], look: [0, 0, 0], capacity: 6 },
  ],
};

export const loftLayout: OfficeLayout = {
  id: "hq",
  level: 2,
  hub: [0, 0, 0.8],
  camera: { overview: [-14, 15, 15], target: [0, 0.8, 0], min: 9, max: 32 },
  points: [
    { id: "d1", kind: "desk", position: [-6, 0, -2.2], look: [-6, 0, -3], capacity: 1 },
    { id: "d2", kind: "desk", position: [-3.2, 0, -2.2], look: [-3.2, 0, -3], capacity: 1 },
    { id: "d3", kind: "desk", position: [-0.4, 0, -2.2], look: [-0.4, 0, -3], capacity: 1 },
    { id: "d4", kind: "desk", position: [2.4, 0, -2.2], look: [2.4, 0, -3], capacity: 1 },
    { id: "d5", kind: "desk", position: [-6, 0, 2.2], look: [-6, 0, 1.2], capacity: 1 },
    { id: "d6", kind: "desk", position: [-3.2, 0, 2.2], look: [-3.2, 0, 1.2], capacity: 1 },
    { id: "coffee", kind: "coffee", position: [7.4, 0, 4], look: [8, 0, 4], capacity: 3 },
    { id: "board", kind: "board", position: [-7.6, 0, 3], look: [-8.2, 0, 3], capacity: 3 },
    { id: "meet", kind: "meet", position: [6.8, 0, 5.2], look: [7.2, 0, 5.6], capacity: 6 },
    { id: "server", kind: "server", position: [8.4, 0, -4.2], look: [9, 0, -4.2], capacity: 2 },
    { id: "idle", kind: "idle", position: [-5.4, 0, 5], look: [-5, 0, 5.4], capacity: 6 },
    { id: "entrance", kind: "entrance", position: [0, 0, 8], look: [0, 0, 0], capacity: 8 },
    { id: "reception", kind: "idle", position: [0.4, 0, 6.6], look: [0, 0, 7], capacity: 2 },
  ],
};

export const labLayout: OfficeLayout = {
  id: "lab",
  level: 3,
  hub: [0, 0, 1],
  camera: { overview: [-16, 18, 18], target: [0, 0.6, 0], min: 12, max: 42 },
  points: [
    { id: "d1", kind: "desk", position: [-8, 0, -4], look: [-8, 0, -5], capacity: 1 },
    { id: "d2", kind: "desk", position: [-5, 0, -4], look: [-5, 0, -5], capacity: 1 },
    { id: "d3", kind: "desk", position: [-2, 0, -4], look: [-2, 0, -5], capacity: 1 },
    { id: "lab", kind: "lab", position: [8, 0, -3], look: [9, 0, -3], capacity: 6 },
    { id: "server", kind: "server", position: [10, 0, 4], look: [11, 0, 4], capacity: 2 },
    { id: "meet", kind: "meet", position: [0, 0, 6], look: [0, 0, 7], capacity: 6 },
    { id: "coffee", kind: "coffee", position: [-6, 0, 5], look: [-7, 0, 5], capacity: 3 },
    { id: "board", kind: "board", position: [-9, 0, 0], look: [-10, 0, 0], capacity: 3 },
    { id: "idle", kind: "idle", position: [0, 0, 0], look: [1, 0, 0], capacity: 8 },
    { id: "entrance", kind: "entrance", position: [0, 0, 12], look: [0, 0, 0], capacity: 8 },
  ],
};

export const campusLayout: OfficeLayout = {
  id: "campus",
  level: 4,
  hub: [0, 0, 0],
  camera: { overview: [-20, 22, 20], target: [0, 0.8, 0], min: 14, max: 48 },
  points: [
    { id: "d1", kind: "desk", position: [-12, 0, -6], look: [-12, 0, -7], capacity: 1 },
    { id: "d2", kind: "desk", position: [-9, 0, -6], look: [-9, 0, -7], capacity: 1 },
    { id: "d3", kind: "desk", position: [-6, 0, -6], look: [-6, 0, -7], capacity: 1 },
    { id: "lab", kind: "lab", position: [12, 0, -4], look: [13, 0, -4], capacity: 8 },
    { id: "server", kind: "server", position: [15, 0, -4], look: [16, 0, -4], capacity: 3 },
    { id: "meet", kind: "meet", position: [0, 0, 8], look: [0, 0, 9], capacity: 8 },
    { id: "coffee", kind: "coffee", position: [-8, 0, 6], look: [-9, 0, 6], capacity: 4 },
    { id: "board", kind: "board", position: [-14, 0, 0], look: [-15, 0, 0], capacity: 4 },
    { id: "idle", kind: "idle", position: [0, 0, 0], look: [1, 0, 0], capacity: 12 },
    { id: "entrance", kind: "entrance", position: [0, 0, 14], look: [0, 0, 0], capacity: 10 },
  ],
};

export const megaLayout: OfficeLayout = {
  id: "mega",
  level: 5,
  hub: [0, 0, 2],
  camera: { overview: [-22, 24, 22], target: [0, 1, 0], min: 16, max: 56 },
  points: [
    { id: "d1", kind: "desk", position: [-4, 0, 4], look: [-4, 0, 3], capacity: 1 },
    { id: "lab", kind: "lab", position: [0, 0, -6], look: [0, 0, -7], capacity: 6 },
    { id: "server", kind: "server", position: [11, 0, 6], look: [12, 0, 6], capacity: 4 },
    { id: "idle", kind: "idle", position: [4, 0, 8], look: [4, 0, 9], capacity: 10 },
    { id: "meet", kind: "meet", position: [-8, 0, 8], look: [-8, 0, 9], capacity: 6 },
    { id: "entrance", kind: "entrance", position: [0, 0, 16], look: [0, 0, 0], capacity: 12 },
  ],
};

const ALL = [apartmentLayout, garageLayout, loftLayout, labLayout, campusLayout, megaLayout];

export function layoutFor(level: number): OfficeLayout {
  return ALL.find((l) => l.level === level) ?? (level <= 0 ? apartmentLayout : megaLayout);
}

export function homeDeskFor(index: number, layout: OfficeLayout): ActivityPoint {
  const desks = layout.points.filter((p) => p.kind === "desk");
  return desks[index % Math.max(1, desks.length)] ?? layout.points[0]!;
}

export const ACTIVITY_WEIGHTS: Record<string, Partial<Record<PointKind, number>>> = {
  product: { desk: 55, board: 20, meet: 15, coffee: 5, idle: 5 },
  research: { lab: 40, desk: 30, board: 20, idle: 10 },
  promo: { meet: 40, idle: 25, coffee: 15, board: 20 },
  lobby: { meet: 50, desk: 30, idle: 20 },
  special: { lab: 40, desk: 40, board: 20 },
  crisis: { meet: 40, board: 30, desk: 30 },
  training: { desk: 60, board: 20, idle: 20 },
  hiring: { meet: 50, idle: 30, coffee: 20 },
  idle: { coffee: 30, idle: 40, board: 10, meet: 20 },
  burnout: { idle: 50, coffee: 40, desk: 10 },
};
