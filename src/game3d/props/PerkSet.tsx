import type { Vector3Tuple } from 'three';
import { Bevel } from '../geometry/Bevel';
import { officeScale } from '../environment/officeScale';
import { Chair, CoffeeMachine, Couch, Desk, Fridge, Mug, Plant } from './Furniture';
import { perkVisualIds } from '../../visuals/registry';

type Perk={id:string;level:number;object?:string};
const navy='#2b3e55', beige='#ded3c3', wood='#c89e6e', gray='#dedede', green='#5c6e5a';
const perkMiniatureIds = {
  coffee: true,
  desks: true,
  food: true,
  rest: true,
  play: true,
  life: true,
  transit: true,
  gym: true,
} satisfies Record<keyof typeof perkVisualIds, true>;

export function PerkVisual({perk,position=[0,0,0]}:{perk:Perk;position?:Vector3Tuple}) {
  if (!(perk.id in perkMiniatureIds)) throw new Error(`Missing perk miniature definition: ${perk.id}`);
  const tier=perk.level;
  return <group position={position}>
    {perk.id==='coffee'&&<>
      <Bevel position={[0,.43,0]} size={[tier>=2?2.1:1.35,.86,.7]} color={beige}/>
      <Bevel position={[0,.88,0]} size={[tier>=2?2.2:1.45,.07,.74]} color={wood}/>
      <CoffeeMachine position={[tier>=2?-.5:0,.93,0]}/>
      {tier>=1&&<Mug position={[.46,.99,.1]}/>}
      {tier>=2&&<><CoffeeMachine position={[.43,.93,0]}/><Bevel position={[0,1.58,-.3]} size={[1.4,.07,.3]} color={navy}/></>}
    </>}
    {perk.id==='desks'&&<>
      {tier<2?<><Desk position={[0,0,0]} standing={tier===0}/><Chair position={[0,0,1]} color={tier>=1?navy:'#474c52'}/></>:<>
        <Bevel position={[0,1.18,-.45]} size={[1.8,2.36,.12]} color={beige}/>
        <Bevel position={[-.85,1.18,0]} size={[.12,2.36,.9]} color={beige}/>
        <Bevel position={[.85,1.18,0]} size={[.12,2.36,.9]} color={beige}/>
        <Desk position={[0,0,-.1]}/><Chair position={[0,0,.85]} color={navy}/>
      </>}
    </>}
    {perk.id==='food'&&<><Fridge position={[-.55,.68,0]}/>
      {tier>=1&&<><Bevel position={[.6,.44,0]} size={[1.2,.88,.7]} color={beige}/><Bevel position={[.6,.9,0]} size={[1.25,.06,.75]} color={wood}/><Mug position={[.35,.96,0]}/></>}
      {tier>=2&&<><Bevel position={[1.45,1.2,-.23]} size={[.62,.5,.08]} color={navy}/><Bevel position={[1.45,1.2,-.18]} size={[.4,.07,.015]} color="#e06b3a"/></>}
    </>}
    {perk.id==='rest'&&<>
      <Bevel position={[0,.42,0]} size={[1.6,.82,.88]} color={tier===0?beige:gray}/>
      <Bevel position={[0,.47,.12]} size={[1.42,.19,.72]} color={tier===1?green:navy}/>
      {tier===0&&<Bevel position={[0,1.14,-.42]} size={[1.65,1.44,.12]} color={beige}/>}
      {tier>=1&&<Plant position={[1.15,0,-.35]} scale={.8}/>}
      {tier>=2&&<><Bevel position={[-1.2,.65,-.4]} size={[.54,1.3,.46]} color={gray}/><Bevel position={[-1.2,1.06,-.15]} size={[.35,.2,.015]} color="#5599ff"/></>}
    </>}
    {perk.id==='play'&&<>
      {tier===0?<><Bevel position={[0,.68,0]} size={[2.1,.07,1.1]} color={green}/><Bevel position={[0,.78,0]} size={[.025,.2,1.05]} color={gray}/>{[-.83,.83].map(x=><Bevel key={x} position={[x,.34,0]} size={[.06,.68,.06]} color={navy}/>)}</>:tier===1?<><Bevel position={[-.45,.7,0]} size={[.75,1.4,.65]} color={navy}/><Bevel position={[-.45,1,.34]} size={[.52,.44,.015]} color="#5599ff"/><Couch position={[1,0,.2]}/></>:<><Desk position={[0,0,0]} color={wood}/>{[-1.1,1.1].map(x=><Chair key={x} position={[x,0,0]}/>)}</>}
    </>}
    {perk.id==='life'&&<>
      {tier===0?<><Bevel position={[0,.23,0]} size={[.8,.4,.45]} color={wood}/><Bevel position={[.37,.51,0]} size={[.3,.3,.3]} color={wood}/>{[-.28,.28].map(x=><Bevel key={x} position={[x,.08,.14]} size={[.14,.25,.14]} color={wood}/>)}</>:tier===1?<><Couch position={[0,0,0]}/><Plant position={[1.45,0,0]} scale={.8}/></>:tier===2?<><Bevel position={[0,.35,0]} size={[1.7,.7,1.1]} color={beige}/>{[-.45,.4].map(x=><Bevel key={x} position={[x,.78,0]} size={[.38,.17,.35]} color={x<0?'#5599ff':'#e06b3a'}/>)}</>:<><Bevel position={[0,.8,0]} size={[2.3,1.6,1.6]} color={beige}/><Bevel position={[0,1.7,0]} size={[2.5,.16,1.8]} color={navy}/>{[-.55,.55].map(x=><Bevel key={x} position={[x,.93,.82]} size={[.45,.6,.025]} color="#b9cfd5"/>)}</>}
    </>}
    {perk.id==='transit'&&<>
      <Bevel position={[0,.55,0]} size={[tier>0?2.7:2.1,.95,.9]} color={navy}/>
      <Bevel position={[0,.85,.46]} size={[tier>0?2.35:1.65,.37,.03]} color="#b9cfd5"/>
      {[-.7,.7].map(x=><mesh key={x} position={[x,.12,.38]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.16,.16,.09,10]}/><meshStandardMaterial color="#282c30" roughness={.9}/></mesh>)}
      {tier>0&&<Bevel position={[0,1.08,0]} size={[.8,.08,.48]} color="#e06b3a"/>}
    </>}
    {perk.id==='gym'&&<><Bevel position={[0,.03,0]} size={[1.8,.06,1.2]} color={green}/>
      <Bevel position={[0,.34,0]} size={[1.2,.06,.06]} color="#6d7788"/>
      {[-.65,.65].map(x=><mesh key={x} position={[x,.34,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.26,.26,.12,10]}/><meshStandardMaterial color="#282c30" roughness={.9}/></mesh>)}
      {tier>0&&<><Bevel position={[1.25,.55,-.22]} size={[.12,1.1,.12]} color="#6d7788"/><Bevel position={[1.25,1.12,-.22]} size={[.95,.07,.08]} color="#6d7788"/></>}
    </>}
  </group>;
}

export function PerkSet({perks,level}:{perks:Perk[];level:number}) {
  const {width:w,depth:d}=officeScale(level);
  const slots:Vector3Tuple[] = level===0
    ? [[4.4,0,1.3],[-3.5,0,-3.2],[4.8,0,3.1],[-4.2,0,3.4],[-1.5,0,3.1],[2.7,0,3.3],[5,0,4],[-5,0,1.4]]
    : [[w*.3,0,d*.19],level===1?[7,0,5]:[w*.1,0,d*.4],[w*.33,0,d*.31],[-w*.35,0,d*.27],[-w*.12,0,d*.34],[w*.05,0,d*.34],[w*.4,0,d*.4],[-w*.43,0,d*.1]];
  const order=['coffee','desks','food','rest','play','life','transit','gym'];
  return <group>{perks.map(perk=>{
    const slot=slots[order.indexOf(perk.id)];
    return slot?<PerkVisual key={perk.id} perk={perk} position={slot}/>:null;
  })}</group>;
}
