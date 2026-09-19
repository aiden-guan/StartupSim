import type { Vector3Tuple } from "three";
import { officeScale } from '../environment/officeScale';

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
  /** Shared installed geometry, populated by the world selector. */
  facilities?: import("../facilities/facilityZones").InstalledFacility[];
  camera: { overview: Vector3Tuple; target: Vector3Tuple; min: number; max: number };
}

export const apartmentLayout: OfficeLayout = {
  id: "apartment",
  level: 0,
  hub: [0.2, 0, 0.4],
  camera: { overview: [...officeScale(0).camera], target: [0.2, 0.4, -0.5], min: 7, max: 22 },
  points: [
    { id: "desk-a", kind: "desk", position: [-2.35, 0, -1.35], look: [-2.35, 0, -2.4], capacity: 1 },
    { id: "desk-b", kind: "desk", position: [2.05, 0, -1.4], look: [2.05, 0, -2.4], capacity: 1 },
    { id: "desk-c", kind: "desk", position: [-2.35, 0, 1.0], look: [-2.35, 0, .2], capacity: 1 },
    { id: "desk-d", kind: "desk", position: [2.05, 0, 1.0], look: [2.05, 0, .2], capacity: 1 },
    { id: "desk-e", kind: "desk", position: [-4.7, 0, -1.35], look: [-4.7, 0, -2.15], capacity: 1 },
    { id: "desk-f", kind: "desk", position: [.0, 0, -1.35], look: [0, 0, -2.15], capacity: 1 },
    { id: "coffee", kind: "coffee", position: [3.55, 0, 1.7], look: [4.2, 0, 1.7], capacity: 1 },
    { id: "board", kind: "board", position: [-1.15, 0, 3.75], look: [-0.15, 0, 3.7], capacity: 1 },
    { id: "idle-window", kind: "idle", position: [3.4, 0, -2.6], look: [4.2, 0, -3.2], capacity: 1 },
    { id: "idle-rug", kind: "idle", position: [-.6, 0, 1.6], look: [.6, 0, 1.6], capacity: 1 },
    { id: "idle-chat", kind: "idle", position: [.6, 0, 1.6], look: [-.6, 0, 1.6], capacity: 1 },
    { id: "entrance", kind: "entrance", position: [0.3, 0, 4.1], look: [0.3, 0, 0], capacity: 4 },
  ],
};

export const garageLayout: OfficeLayout = {
  id: "garage-office",
  level: 1,
  hub: [0, 0, 0.5],
  camera: { overview: [...officeScale(1).camera], target: [0, 0.5, 0], min: 10, max: 37 },
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
  camera: { overview: [...officeScale(2).camera], target: [0, 0.8, 0], min: 15, max: 56 },
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
  camera: { overview: [...officeScale(3).camera], target: [0, 0.6, 0], min: 22, max: 82 },
  points: [
    { id: "d1", kind: "desk", position: [-8, 0, -4], look: [-8, 0, -5], capacity: 1 },
    { id: "d2", kind: "desk", position: [-5, 0, -4], look: [-5, 0, -5], capacity: 1 },
    { id: "d3", kind: "desk", position: [-2, 0, -4], look: [-2, 0, -5], capacity: 1 },
    { id: "lab", kind: "lab", position: [-13, 0, -9], look: [-15, 0, -11.5], capacity: 6 },
    { id: "server", kind: "server", position: [15, 0, -10], look: [16, 0, -11.7], capacity: 2 },
    { id: "meet", kind: "meet", position: [0, 0, 9], look: [0, 0, 10], capacity: 6 },
    { id: "coffee", kind: "coffee", position: [-12, 0, 8], look: [-13, 0, 8], capacity: 3 },
    { id: "board", kind: "board", position: [-14, 0, -3], look: [-15, 0, -3], capacity: 3 },
    { id: "idle", kind: "idle", position: [0, 0, 0], look: [1, 0, 0], capacity: 8 },
    { id: "entrance", kind: "entrance", position: [0, 0, 13], look: [0, 0, 0], capacity: 8 },
  ],
};

export const campusLayout: OfficeLayout = {
  id: "campus",
  level: 4,
  hub: [0, 0, 0],
  camera: { overview: [...officeScale(4).camera], target: [0, 1, 0], min: 32, max: 124 },
  points: [
    { id: "d1", kind: "desk", position: [-12, 0, -6], look: [-12, 0, -7], capacity: 1 },
    { id: "d2", kind: "desk", position: [-9, 0, -6], look: [-9, 0, -7], capacity: 1 },
    { id: "d3", kind: "desk", position: [-6, 0, -6], look: [-6, 0, -7], capacity: 1 },
    { id: "lab", kind: "lab", position: [-20, 0, -13], look: [-22, 0, -15.5], capacity: 8 },
    { id: "server", kind: "server", position: [22, 0, -10], look: [23, 0, -15.5], capacity: 3 },
    { id: "meet", kind: "meet", position: [0, 0, 13], look: [0, 0, 14], capacity: 8 },
    { id: "coffee", kind: "coffee", position: [-19, 0, 9], look: [-20, 0, 9], capacity: 4 },
    { id: "board", kind: "board", position: [-22, 0, -4], look: [-23, 0, -4], capacity: 4 },
    { id: "idle", kind: "idle", position: [0, 0, 0], look: [1, 0, 0], capacity: 12 },
    { id: "entrance", kind: "entrance", position: [0, 0, 20], look: [0, 0, 0], capacity: 10 },
  ],
};

export const megaLayout: OfficeLayout = {
  id: "mega",
  level: 5,
  hub: [0, 0, 2],
  camera: { overview: [...officeScale(5).camera], target: [0, 1.5, 3], min: 45, max: 190 },
  points: [
    { id: "d1", kind: "desk", position: [-30, 0, 5], look: [-30, 0, 4], capacity: 1 },
    { id: "lab", kind: "lab", position: [-35, 0, -23], look: [-37, 0, -25.5], capacity: 6 },
    { id: "server", kind: "server", position: [36, 0, -23], look: [37, 0, -25.5], capacity: 4 },
    { id: "idle", kind: "idle", position: [10, 0, 16], look: [10, 0, 17], capacity: 10 },
    { id: "meet", kind: "meet", position: [-22, 0, 15], look: [-22, 0, 16], capacity: 6 },
    { id: "coffee", kind: "coffee", position: [-32, 0, 20], look: [-33, 0, 20], capacity: 4 },
    { id: "board", kind: "board", position: [-41, 0, -10], look: [-42, 0, -10], capacity: 4 },
    { id: "entrance", kind: "entrance", position: [0, 0, 29], look: [0, 0, 0], capacity: 12 },
  ],
};

// Furniture and navigation share these exact workstation coordinates.
const ALL = [apartmentLayout, garageLayout, loftLayout, labLayout, campusLayout, megaLayout].map(layout=>{
  if(layout.level===0)return layout;
  const columns=layout.level===1?3:6,rows=4;
  const startX=layout.level===1?-5:layout.level===2?-10:layout.level===3?-15:layout.level===4?-25:-34;
  const startZ=layout.level===1?-3.4:layout.level===2?-6:layout.level===3?-5:layout.level===4?-5:-18;
  const gapX=layout.level>=4?3.4:layout.level===3?2.8:2.2;
  const gapZ=layout.level>=4?4.1:layout.level===3?3.2:2.4;
  const desks:ActivityPoint[]=Array.from({length:columns*rows},(_,i)=>{
    const x=startX+(i%columns)*gapX,z=startZ+Math.floor(i/columns)*gapZ;
    return {id:`desk-${i}`,kind:'desk',position:[x,0,z],look:[x,0,z-.8],capacity:1};
  });
  // Larger shells gain a central team neighborhood, using the same furniture
  // coordinates and collision contract as the original workstation bank.
  if(layout.level>=4) {
    const cols=layout.level===4?4:6, rows=layout.level===4?3:4;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++) {
      const x=(layout.level===4?-5:-12)+col*3.4,z=(layout.level===4?-9:-13)+row*3.4;
      desks.push({id:`desk-central-${row}-${col}`,kind:'desk',position:[x,0,z],look:[x,0,z-.8],capacity:1});
    }
  }
  const activities=layout.points.filter(p=>p.kind!=='desk').flatMap(p=>{
    const point=layout.level===2 && p.kind==='meet' ? {...p, position:[p.position[0],0,p.position[2]-1] as Vector3Tuple,look:[p.look[0],0,p.look[2]-1] as Vector3Tuple} : p;
    if(point.kind==='entrance')return [point];
    const n=Math.min(point.kind==='idle'?4:point.kind==='coffee'?1:3,point.capacity);
    const dx=point.look[0]-point.position[0],dz=point.look[2]-point.position[2],len=Math.hypot(dx,dz)||1;
    return Array.from({length:n},(_,i):ActivityPoint=>{
      const offset=i===0?0:i%2?-.85: .85;
      return {...point,id:i===0?point.id:`${point.id}-slot-${i}`,capacity:1,position:[point.position[0]+dz/len*offset,0,point.position[2]-dx/len*offset]};
    });
  });
  return {...layout,points:[...desks,...activities]};
});

export function layoutFor(level: number): OfficeLayout {
  return ALL.find(l=>l.level===level)??ALL[level<=0?0:ALL.length-1]!;
}

export function homeDeskFor(index: number, layout: OfficeLayout): ActivityPoint {
  const desks = layout.points.filter((p) => p.kind === "desk");
  return desks[index % Math.max(1, desks.length)] ?? layout.points[0]!;
}

export const ACTIVITY_WEIGHTS: Record<string, Partial<Record<PointKind, number>>> = {
  product: { desk: 82, board: 13, coffee: 5 },
  research: { lab: 60, desk: 25, board: 15 },
  promo: { desk: 40, meet: 30, board: 15, coffee: 15 },
  lobby: { meet: 50, desk: 30, idle: 20 },
  special: { lab: 40, desk: 40, board: 20 },
  crisis: { meet: 40, board: 30, desk: 30 },
  training: { desk: 60, board: 20, idle: 20 },
  hiring: { meet: 60, desk: 40 },
  idle: { coffee: 25, idle: 65, desk: 10 },
  burnout: { idle: 50, coffee: 40, desk: 10 },
};
