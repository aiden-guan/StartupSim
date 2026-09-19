import type { Vector3Tuple } from 'three';
import { perkById } from '../../data/perks';
import { officeScale } from '../environment/officeScale';
export interface PurchasedPerk { id: string; level: number }
export interface FacilityZone {
  purpose: 'quiet' | 'recreation' | 'care' | 'wellness' | 'housing';
  anchor: Vector3Tuple; width: number; depth: number; rotation: number; exterior?: boolean;
}
export interface InstalledFacility extends FacilityZone { id: string; tier: number }
const zone = (purpose: FacilityZone['purpose'], x: number, z: number, width: number, depth: number): FacilityZone => ({ purpose, anchor: [x,0,z], width, depth, rotation: 0 });
/** Authored clear areas for each shell. Front amenities face circulation aisles;
 * rear technical areas remain reserved. An apartment has no quiet room. */
const PLANS: ReadonlyArray<Partial<Record<string, FacilityZone>>> = [
  { play:zone('recreation',0,-3.9,2.6,1.3),life:zone('care',2.35,3.8,1.5,1.4),gym:zone('wellness',4.4,4.1,1.1,1.2) },
  { rest:zone('quiet',-2.7,-5.6,4.2,1.6),play:zone('recreation',2.5,-.6,3.6,3),life:zone('care',7,-1,2,2),gym:zone('wellness',7,5.6,1.4,1.4) },
  { rest:zone('quiet',-10.5,9,5,2.8),play:zone('recreation',-4.5,8.9,4.6,3),life:zone('care',4,9.1,3.4,3),gym:zone('wellness',10,9.1,5,3) },
  { rest:zone('quiet',-15,12.5,6,3),play:zone('recreation',-7,12.5,6,3),life:zone('care',6,12.5,6,3),gym:zone('wellness',15,12.5,6,3) },
  { rest:zone('quiet',-24,19,7,5),play:zone('recreation',-15,19,7,5),life:zone('care',14,19,7,5),gym:zone('wellness',24,19,7,5) },
  { rest:zone('quiet',-36,28,8,6),play:zone('recreation',-24,28,9,6),life:zone('care',12,28,8,6),gym:zone('wellness',25,28,10,6) },
];
export function facilityZones(level:number) { return PLANS[Math.max(0,Math.min(5,Math.floor(level)))]!; }
export function installedFacilities(level:number, perks:PurchasedPerk[]):InstalledFacility[] {
  return perks.flatMap(perk=>{
    const def=perkById[perk.id]?.upgrades[perk.level];
    if(!def || def.requiredOffice>level) return [];
    if(perk.id==='life' && perk.level===3) {
      const {width}=officeScale(level);
      return [{...zone('housing',width/2+7.5,0,14,13),exterior:true,id:perk.id,tier:perk.level}];
    }
    const placement=facilityZones(level)[perk.id];
    return placement?[{...placement,id:perk.id,tier:perk.level}]:[];
  });
}
export function facilityFootprint(zone:FacilityZone) {
  return {center:[zone.anchor[0],zone.anchor[2]] as [number,number],halfSize:[zone.width/2,zone.depth/2] as [number,number]};
}
/** Shared grounded kitchen and collision box, facing its coffee activity point. */
export function kitchenPlacement(level:number) {
  const entries = [
    {anchor:[4.65,0,1.7],rotation:-Math.PI/2,width:2.8},
    {anchor:[6.35,0,2.2],rotation:-Math.PI/2,width:3.2},
    {anchor:[8.55,0,4],rotation:-Math.PI/2,width:3.6},
    {anchor:[-13.15,0,8],rotation:Math.PI/2,width:4.2},
    {anchor:[-20.15,0,9],rotation:Math.PI/2,width:4.8},
    {anchor:[-33.15,0,20],rotation:Math.PI/2,width:5.2},
  ];
  const p=entries[Math.max(0,Math.min(5,level))]!;
  return {...p,anchor:p.anchor as Vector3Tuple,depth:1.25};
}
/** Purchased quiet zones replace the default lounge at larger offices. */
export function loungePlacement(level:number):Vector3Tuple {
  return level===1?[-6.9,0,5.65]:level===2?[-10.5,0,9]:level===3?[-15,0,12.5]:level===4?[-24,0,19]:[-36,0,28];
}
/** Small vertical/state cues occupy a separate back display ribbon. */
export function displayRibbon(level:number):Vector3Tuple[] {
  return [
    [[-4.7,0,-3.9]], [[1.5,0,-5.6],[3.5,0,-5.6]],
    [[3.7,0,-8.9],[5.7,0,-8.9]], [[-5,0,-12.8],[-2.5,0,-12.8]],
    [[-5,0,-16],[-2.5,0,-16]], [[-6,0,-22],[-3.5,0,-22]],
  ][level]! as Vector3Tuple[];
}

/** Dedicated vertical exhibition bays, separated from amenity rooms. */
export function verticalPlacements(level:number):Vector3Tuple[] {
  return [ [[-4.7,0,-3.9]], [[2,0,-5.4]], [[-11,0,5],[10,0,-3.8]],
    [[-17,0,3],[16,0,7]], [[-27,0,12],[25,0,7]], [[-40,0,15],[39,0,12]],
  ][level]! as Vector3Tuple[];
}
export function hypePlacement(level:number):Vector3Tuple {
  return [[-8,0,0],[-11,0,0],[1.5,0,6],[17,0,-4],[25,0,-1],[40,0,20]][level]! as Vector3Tuple;
}
