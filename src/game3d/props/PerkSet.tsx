import type { Vector3Tuple } from 'three';
import { officeScale } from '../environment/officeScale';
import { Chair, Desk } from './Furniture';
import { Box, paper, navy } from './products/Parts';
import { CultureDetails } from './CultureDetails';
import { perkById } from '../../data/perks';
type Perk={id:string;level:number;object?:string};
export function PerkVisual({perk,position=[0,0,0]}:{perk:Perk;position?:Vector3Tuple}) {
  const definition = perkById[perk.id];
  if (!definition || !definition.upgrades[perk.level]) throw new Error(`Missing perk miniature tier: ${perk.id}:${perk.level}`);
  return <group position={position}>{perk.id==='desks' ? <>
    {perk.level===2 && <><Box p={[0,1,-.45]} s={[1.8,2,.12]} c={paper}/><Box p={[-.85,1,0]} s={[.12,2,.9]} c={paper}/><Box p={[.85,1,0]} s={[.12,2,.9]} c={paper}/><Box p={[0,2.04,-.03]} s={[1.92,.08,1]} c={paper}/></>}
    <Desk position={[0,0,0]} standing={perk.level===0}/><Chair position={[0,0,.85]} color={perk.level>=1?navy:'#474c52'}/>
  </> : <CultureDetails id={perk.id} tier={perk.level}/>}</group>;
}

export function PerkSet({perks,level,skipKitchen=false}:{perks:Perk[];level:number;skipKitchen?:boolean}) {
  const {width:w,depth:d}=officeScale(level);
  const slots:Vector3Tuple[] = level===0
    ? [[4.8,0,-1],[0,0,-3.8],[5,0,3.9],[-3.8,0,.1],[-2.5,0,-3.8],[1.8,0,3.2],[3,0,4],[-5,0,-.4]]
    : [
        [w*.3,0,d*.19],
        level===1?[7,0,5]:[w*.1,0,d*.4],
        level>=4?[w*.22,0,d*.31]:[w*.33,0,d*.31],
        level===3?[-w*.35,0,2]:[-w*.35,0,d*.27],
        [-w*.12,0,d*.34],
        [w*.05,0,d*.34],
        level===1?[3.8,0,5.6]:[w*.4,0,d*.4],
        [-w*.43,0,d*.1]
      ];
  const order=['coffee','desks','food','rest','play','life','transit','gym'];
  return <group>{perks.map(perk=>{
    if(skipKitchen && (perk.id === 'coffee' || perk.id === 'food')) return null;
    const slot=slots[order.indexOf(perk.id)];
    return slot?<PerkVisual key={perk.id} perk={perk} position={slot}/>:null;
  })}</group>;
}
