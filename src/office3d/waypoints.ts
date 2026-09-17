import type { Vector3Tuple } from "three";

export interface Waypoint {
  id: string;
  kind: "desk" | "coffee" | "board" | "idle" | "lab" | "meet" | "server";
  position: Vector3Tuple;
  look: Vector3Tuple;
}

export const apartmentWaypoints: Waypoint[] = [
  { id: "desk-a", kind: "desk", position: [-2.4, 0, -1.1], look: [-2.4, 0, -2.2] },
  { id: "desk-b", kind: "desk", position: [1.8, 0, -1.2], look: [1.8, 0, -2.2] },
  { id: "coffee", kind: "coffee", position: [3.1, 0, 1.6], look: [3.6, 0, 1.6] },
  { id: "board", kind: "board", position: [-0.2, 0, 2.4], look: [-0.2, 0, 3.2] },
  { id: "idle-window", kind: "idle", position: [3.2, 0, -2.4], look: [4, 0, -2.8] },
  { id: "idle-rug", kind: "idle", position: [0.2, 0, 0.4], look: [0.4, 0, -0.2] },
];

export const officeWaypoints: Waypoint[] = [
  { id: "d1", kind: "desk", position: [-4.5, 0, -2], look: [-4.5, 0, -3] },
  { id: "d2", kind: "desk", position: [-2.2, 0, -2], look: [-2.2, 0, -3] },
  { id: "d3", kind: "desk", position: [0.1, 0, -2], look: [0.1, 0, -3] },
  { id: "d4", kind: "desk", position: [2.4, 0, -2], look: [2.4, 0, -3] },
  { id: "coffee", kind: "coffee", position: [5.2, 0, 2.2], look: [5.8, 0, 2.2] },
  { id: "board", kind: "board", position: [-5.4, 0, 2.6], look: [-6, 0, 2.6] },
  { id: "meet", kind: "meet", position: [2.8, 0, 3.4], look: [2.8, 0, 4] },
  { id: "server", kind: "server", position: [5.4, 0, -2.8], look: [6, 0, -2.8] },
  { id: "idle", kind: "idle", position: [-0.4, 0, 1.2], look: [0, 0, 0] },
];

export const campusWaypoints: Waypoint[] = [
  { id: "d1", kind: "desk", position: [-8, 0, -4], look: [-8, 0, -5] },
  { id: "d2", kind: "desk", position: [-5, 0, -4], look: [-5, 0, -5] },
  { id: "lab", kind: "lab", position: [8, 0, -3], look: [9, 0, -3] },
  { id: "server", kind: "server", position: [10, 0, 4], look: [11, 0, 4] },
  { id: "meet", kind: "meet", position: [0, 0, 6], look: [0, 0, 7] },
  { id: "coffee", kind: "coffee", position: [-6, 0, 5], look: [-7, 0, 5] },
  { id: "idle", kind: "idle", position: [0, 0, 0], look: [1, 0, 0] },
];

export function waypointsFor(level: number): Waypoint[] {
  if (level <= 0) return apartmentWaypoints;
  if (level === 1) return officeWaypoints;
  return campusWaypoints;
}
