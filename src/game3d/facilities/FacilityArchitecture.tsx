import { Bevel } from '../geometry/Bevel';
import { Plant } from '../props/Furniture';
/** Open-front architectural enclosure, scaled to a real room rather than a
 * collectible plinth. Kept inside the collision reservation by construction. */
export function FacilityArchitecture({width,depth,kind}:{width:number;depth:number;kind:string}) {
  const w=width*.96,d=depth*.96;
  const medical=kind==='clinic', gym=kind==='gym',quiet=kind==='quiet';
  const color=medical?'#d9e2dc':gym?'#76877e':quiet?'#b2b7a2':'#b9ab95';
  const h=depth<2?1.35:2.1;
  return <group>
    <Bevel position={[0,.012,0]} size={[w,.024,d]} color={gym?'#53615e':medical?'#c5d2cc':'#baaf98'} radius={.005}/>
    <Bevel position={[0,h/2,-d/2+.065]} size={[w,h,.13]} color={color} radius={.012}/>
    <Bevel position={[-w/2+.065,h/2,-d*.17]} size={[.13,h,d*.65]} color={color} radius={.012}/>
    <Bevel position={[0,h+.035,-d/2+.065]} size={[w,.09,.18]} color="#e6dfd0"/>
    <Bevel position={[-w/2+.065,h+.035,-d*.17]} size={[.18,.09,d*.65]} color="#e6dfd0"/>
    <Bevel position={[w*.29,1.25,-d/2+.14]} size={[Math.min(.85,w*.22),.48,.025]} color={medical?'#e9eee7':'#2b3e55'}/>
    {medical ? <><Bevel position={[w*.29,1.25,-d/2+.16]} size={[.26,.085,.025]} color="#6c9079"/><Bevel position={[w*.29,1.25,-d/2+.16]} size={[.085,.26,.026]} color="#6c9079"/></> : <Bevel position={[w*.29,1.25,-d/2+.16]} size={[Math.min(.55,w*.13),.045,.018]} color="#c89e6e"/>}
    {width>4&&depth>2&&<Plant position={[w*.39,0,-d*.31]} scale={.8}/>}
  </group>;
}
