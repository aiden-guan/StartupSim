import { Bevel } from '../geometry/Bevel';
import { Hotspot } from '../props/Hotspot';
import { BookStack, BrandSign, CardboardBox, Chair, CoffeeMachine, Couch, Desk, Fridge, Keyboard, Lamp, Laptop, Monitor, Mug, PizzaBox, Plant, Rug, Whiteboard } from '../props/Furniture';
import { PerkSet } from '../props/PerkSet';
import type { CompanyBrand } from '../../simulation/types';
import { apartmentLayout } from '../navigation/layout';

export function Apartment({onObject,perks=[],brand,standingDesks=false,employeeCount=2}:{onObject:(id:string)=>void;perks?:{id:string;level:number}[];brand:CompanyBrand;standingDesks?:boolean;employeeCount?:number}) {
  const desktop=standingDesks?.99:.78;
  return <group>
    <Bevel position={[0,-.15,0]} size={[12.2,.29,10.2]} color="#d7c0a2" radius={.08}/>
    {Array.from({length:17},(_,i)=><Bevel key={i} position={[i*.71-5.68,.002,0]} size={[.012,.004,10]} color="#c8b093" radius={.001}/>)}
    <Bevel position={[0,1.4,-5]} size={[12.2,2.8,.15]} color="#eeebe1" radius={.016}/>
    <Bevel position={[-6.04,1.4,0]} size={[.15,2.8,10.2]} color="#e4e4da" radius={.016}/>
    <Bevel position={[0,.09,-4.89]} size={[12.04,.15,.046]} color="#faf6ee" radius={.008}/>
    <Bevel position={[-5.93,.09,0]} size={[.046,.15,10]} color="#faf6ee" radius={.008}/>
    <group position={[2.6,1.78,-4.887]}>
      <Bevel size={[2.7,1.55,.07]} color="#fcf9f1" radius={.016}/>
      <Bevel position={[0,0,.041]} size={[2.52,1.36,.019]} color="#b7cfdb" radius={.005}/>
      <Bevel position={[0,0,.058]} size={[.065,1.40,.031]} color="#faf7ef" radius={.007}/>
      <Bevel position={[0,0,.059]} size={[2.59,.065,.034]} color="#faf7ef" radius={.007}/>
      <Bevel position={[0,-.82,.094]} size={[2.86,.065,.29]} color="#ede6d7" radius={.013}/>
    </group>
    <BrandSign position={[-1.5,2.12,-4.88]} color={brand.color} mark={brand.mark} width={1.6}/>
    {apartmentLayout.points.filter(p=>p.kind==='desk').slice(0,employeeCount).map((point,i)=>{
      const [x,,z]=point.position;
      return <group key={point.id}>
        <Desk position={[x,0,z-.79]} standing={standingDesks}/>
        <Chair position={[x,0,z]} rotation={Math.PI} color="#474c52"/>
        {i===0?<><Monitor position={[x,desktop+.347,z-.94]}/><Keyboard position={[x,desktop,z-.58]}/></>:<Laptop position={[x,desktop,z-.83]}/>}
        <Mug position={[x+.56,desktop+.05,z-.74]}/>
        {i===0&&<BookStack position={[x-.56,desktop,z-.93]}/>}
      </group>;
    })}
    <group position={[-.15,0,3.7]} rotation={[0,-.15,0]}><Whiteboard position={[0,1.35,0]}/></group>
    <Couch position={[-4.45,0,3.08]}/>
    <Rug position={[-3.9,.008,1.62]}/>
    <Bevel position={[-4.15,.25,1.9]} size={[1.13,.10,.65]} color="#c99e76" radius={.04}/>
    {[-.42,.42].map(x=>[-.21,.21].map(z=><Bevel key={`${x},${z}`} position={[-4.15+x,.125,1.9+z]} size={[.055,.25,.055]} color="#545354" radius={.008}/>))}
    <PizzaBox position={[-4.21,.35,1.87]}/>
    <Plant position={[-5.38,.005,4.08]} scale={1.15}/>
    <Plant position={[4.65,.005,-3.65]} scale={1.3}/>
    <Fridge position={[5.27,.68,2.69]}/>
    <Bevel position={[4.57,.39,1.57]} size={[1.15,.78,.62]} color="#c6b79c" radius={.024}/>
    <Bevel position={[4.57,.80,1.57]} size={[1.23,.052,.7]} color="#e7d2b5" radius={.014}/>
    <group position={[4.42,.825,1.57]} rotation={[0,-Math.PI/2,0]}><CoffeeMachine position={[0,0,0]}/></group>
    <BookStack position={[4.95,.83,1.64]}/>
    <Lamp position={[-5.29,.34,-3.67]}/>
    <CardboardBox position={[-4.46,.21,-4.12]} scale={1.2}/>
    <CardboardBox position={[-3.86,.21,-4.04]}/>
    <Bevel position={[.3,.005,4.65]} size={[1.48,.018,.72]} color="#829386" radius={.008}/>
    <Hotspot id="founderDesk" position={[-2.35,1,-2.1]} label="Founder desk" onClick={onObject} size={[1.5,1.2,1]}/>
    <Hotspot id="coffee" position={[4.2,1,1.7]} label="Kitchen" onClick={onObject}/>
    <Hotspot id="board" position={[-.15,1.4,3.6]} label="Whiteboard" onClick={onObject} size={[2.2,1.4,.4]}/>
    <Hotspot id="plant" position={[4.7,.8,-3.6]} label="Company" onClick={onObject}/>
    <PerkSet perks={perks} level={0}/>
  </group>;
}
