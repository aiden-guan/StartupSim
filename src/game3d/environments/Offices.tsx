import { Bevel } from '../geometry/Bevel';
import {
  BookStack,
  BrandSign,
  CardboardBox,
  Chair,
  CoffeeMachine,
  Couch,
  Desk,
  Fridge,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mug,
  Notebook,
  PizzaBox,
  Plant,
  RobotAssistant,
  ServerRack,
  Whiteboard,
} from '../props/Furniture';
import { Hotspot } from '../props/Hotspot';
import { PerkSet } from '../props/PerkSet';
import { layoutFor } from '../navigation/layout';
import type { CompanyBrand } from '../../simulation/types';

type OfficeProps={onObject:(id:string)=>void;perks?:{id:string;level:number;object?:string}[];brand:CompanyBrand;computeLoad?:number;empty?:boolean;emptyDesks?:boolean;mega?:boolean};
function OfficeInterior({level,onObject,perks=[],brand,computeLoad=.3,empty=false,emptyDesks=false}:OfficeProps&{level:number}) {
  const layout=layoutFor(level),size=level===1?[18,14]:level===2?[23,19]:level===3?[30,25]:[36,29];
  const [w,d]=size as [number,number];
  const desks=layout.points.filter(p=>p.kind==='desk');
  return <group>
    <Bevel position={[0,-.17,0]} size={[w,.32,d]} radius={.08} color={level<3?'#cfbc9e':'#cad0c8'}/>
    <Bevel position={[0,1.3,-d/2]} size={[w,2.6,.16]} radius={.022} color="#e8ebe5"/>
    <Bevel position={[-w/2,1.3,0]} size={[.16,2.6,d]} radius={.022} color="#dbe2de"/>
    <BrandSign position={[0,1.85,-d/2+.1]} color={brand.color} mark={brand.mark} width={2.5}/>
    {[-1,1].map(side=><group key={side} position={[side*w*.31,1.62,-d/2+.11]}><Bevel size={[w*.23,1.34,.055]} color="#f6f5ed" radius={.015}/><Bevel position={[0,0,.03]} size={[w*.23-.15,1.17,.012]} color="#b9cfd5" radius={.005}/><Bevel position={[0,0,.049]} size={[.065,1.2,.027]} color="#f6f5ed" radius={.005}/></group>)}
    {desks.map((p,i)=>{
      const [x,,z]=p.position;
      return <group key={p.id}>
        <Desk position={[x,0,z-.79]} color={level>=3?'#d0b797':'#d2ab84'}/>
        {(!(empty||emptyDesks)||i<4)&&<Chair position={[x,0,z]} rotation={Math.PI}/>}
        {level===1?<Laptop position={[x,.79,z-.86]}/>:<><Monitor position={[x,1.13,z-.96]}/><Keyboard position={[x,.79,z-.57]}/></>}
        {i % 2 === 0 && <Mug position={[x + 0.56, 0.84, z - 0.74]} color={i % 4 === 0 ? '#ffffff' : '#3b82f6'} />}
        {i === 1 && <BookStack position={[x - 0.56, 0.79, z - 0.93]} />}
        {i === 2 && <Notebook position={[x - 0.52, 0.79, z - 0.68]} />}
        {i === 3 && <Headphones position={[x + 0.48, 0.795, z - 0.60]} />}
      </group>;
    })}
    {layout.points.filter(p=>!p.id.includes('-slot-')).map(p=>{
      const [x,,z]=p.look;
      if(p.kind==='server')return <group key={p.id}><group position={[x,.86,z]} rotation={[0,Math.atan2(p.position[0]-x,p.position[2]-z),0]}>{Array.from({length:level>=3?4:1},(_,i)=><ServerRack key={i} position={[i*.91,0,0]} load={computeLoad}/>)}<CardboardBox position={[level>=3?4*.91+.25:1.05,-.65,.15]} scale={1.1}/></group><Hotspot id="servers" position={[x,1,z]} label="Compute" onClick={onObject}/></group>;
      if(p.kind==='board')return <group key={p.id} position={[x,0,z]} rotation={[0,Math.atan2(p.position[0]-x,p.position[2]-z),0]}><Whiteboard position={[0,1.35,0]}/><Hotspot id="board" position={[0,1.4,0]} label="Projects" onClick={onObject}/></group>;
      if(p.kind==='coffee')return <group key={p.id} position={[x,0,z]} rotation={[0,Math.atan2(p.position[0]-x,p.position[2]-z),0]}><Bevel position={[0,.39,0]} size={[1.6,.78,.65]} color="#b8ad97" radius={.025}/><Bevel position={[0,.80,0]} size={[1.69,.05,.7]} color="#e8d7bd" radius={.012}/><CoffeeMachine position={[-.28,.83,0]}/><Fridge position={[1.1,.68,0]}/><Mug position={[-.05,.85,.12]} color="#ffffff"/><Hotspot id="coffee" position={[0,1,0]} label="Kitchen" onClick={onObject}/></group>;
      if(p.kind==='lab')return <group key={p.id} position={[x,0,z]} rotation={[0,Math.atan2(p.position[0]-x,p.position[2]-z),0]}><Desk position={[0,0,0]} standing/><Monitor position={[0,1.33,-.13]}/><Keyboard position={[0,.99,.22]}/><RobotAssistant position={[.55,.99,-.1]}/><Hotspot id="lab" position={[0,1,0]} label="Research" onClick={onObject}/></group>;
      if(p.kind==='meet')return <group key={p.id} position={[x,0,z]}><Desk position={[0,0,0]}/><Chair position={[-.95,0,0]} rotation={-Math.PI/2}/><Chair position={[.95,0,0]} rotation={Math.PI/2}/><Laptop position={[0,.79,0]}/><Notebook position={[-.35,.79,.12]}/><Mug position={[.42,.84,-.15]} color="#f26419"/></group>;
      return null;
    })}
    <group position={[-w*.3,0,d*.34]} rotation={[0,.2,0]}>
      <Couch position={[0,0,0]}/>
      <Plant position={[-1.45,0,0]} scale={1.4}/>
      <Bevel position={[0,.18,.95]} size={[1.1,.08,.55]} color="#c99e76" radius={.025}/>
      {[-.42,.42].map(cx=>[-.18,.18].map(cz=><Bevel key={`${cx},${cz}`} position={[cx,.09,.95+cz]} size={[.04,.18,.04]} color="#545354" radius={.006}/>))}
      <PizzaBox position={[0,.26,.95]}/>
    </group>
    <Plant position={[w/2-1.1,0,-d/2+1.1]} scale={1.8}/>
    <Plant position={[-w/2+1.1,0,-d/2+1.1]} scale={1.6}/>
    {level>=4&&<><Bevel position={[w*.33,.10,d*.31]} size={[4.5,.2,3.5]} color="#9daa8e" radius={.06}/>{[-1,0,1].map(x=><Plant key={x} position={[w*.33+x*1.25,.2,d*.31]} scale={1.8}/>)}</>}
    <Hotspot id="logo" position={[0,1.85,-d/2+.2]} label="Company" onClick={onObject}/>
    <Hotspot id="reception" position={layout.points.find(p=>p.kind==='entrance')!.position} label="Recruiting" onClick={onObject}/>
    <PerkSet perks={perks} level={level}/>
  </group>;
}
export const GarageOffice=(props:OfficeProps)=><OfficeInterior {...props} level={1}/>;
export const HQOffice=(props:OfficeProps)=><OfficeInterior {...props} level={2}/>;
export const ResearchLab=(props:OfficeProps)=><OfficeInterior {...props} level={3}/>;
export const CampusOffice=(props:OfficeProps)=><OfficeInterior {...props} level={4}/>;
export const MegaCampus=(props:OfficeProps)=><OfficeInterior {...props} level={5}/>;
export const StartupLoft=HQOffice;
