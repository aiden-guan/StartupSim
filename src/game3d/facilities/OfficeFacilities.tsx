import { installedFacilities, kitchenPlacement, type PurchasedPerk } from './facilityZones';
import { InstalledFacilityVisual, InstalledKitchen } from './InstalledFacilityVisual';
import { Bevel } from '../geometry/Bevel';
import { Hotspot } from '../props/Hotspot';

export function OfficeFacilities({level,perks}:{level:number;perks:PurchasedPerk[]}) {
  return <group>{installedFacilities(level,perks).map(facility=><group key={facility.id} position={facility.anchor} rotation={[0,facility.rotation,0]}>
    {facility.exterior&&<Bevel position={[-.75,-.08,0]} size={[facility.width+1.5,.16,facility.depth+.5]} color="#c9c4b4"/>}
    <InstalledFacilityVisual id={facility.id} tier={facility.tier} width={facility.width} depth={facility.depth}/>
  </group>)}</group>;
}
export function OfficeKitchen({level,perks,onObject}:{level:number;perks:PurchasedPerk[];onObject?:(id:string)=>void}) {
  const placement=kitchenPlacement(level);
  return <group position={placement.anchor} rotation={[0,placement.rotation,0]}>
    <InstalledKitchen coffeeTier={perks.find(p=>p.id==='coffee')?.level??-1} foodTier={perks.find(p=>p.id==='food')?.level??-1} width={placement.width}/>
    {onObject&&<Hotspot id="coffee" position={[0,1,0]} size={[placement.width,2,placement.depth]} label="Kitchen" onClick={onObject}/>}
  </group>;
}
