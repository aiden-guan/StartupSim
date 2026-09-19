import type { Vector3Tuple } from 'three';
import { Chair, Desk } from './Furniture';
import { Box, paper, navy } from './products/Parts';
import { CultureDetails } from './CultureDetails';
import { perkById } from '../../data/perks';
type Perk={id:string;level:number;object?:string};
export function PerkPreviewVisual({perk,position=[0,0,0]}:{perk:Perk;position?:Vector3Tuple}) {
  const definition = perkById[perk.id];
  if (!definition || !definition.upgrades[perk.level]) throw new Error(`Missing perk miniature tier: ${perk.id}:${perk.level}`);
  return <group position={position}>{perk.id==='desks' ? <>
    {perk.level===2 && <><Box p={[0,1,-.45]} s={[1.8,2,.12]} c={paper}/><Box p={[-.85,1,0]} s={[.12,2,.9]} c={paper}/><Box p={[.85,1,0]} s={[.12,2,.9]} c={paper}/><Box p={[0,2.04,-.03]} s={[1.92,.08,1]} c={paper}/></>}
    <Desk position={[0,0,0]} standing={perk.level===0}/><Chair position={[0,0,.85]} color={perk.level>=1?navy:'#474c52'}/>
  </> : <CultureDetails id={perk.id} tier={perk.level}/>}</group>;
}
