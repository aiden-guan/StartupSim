import { Bevel } from '../geometry/Bevel';
import {
  BookStack,
  BrandSign,
  Chair,
  Couch,
  Desk,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mug,
  Notebook,
  Plant,
  Whiteboard,
} from '../props/Furniture';
import { Hotspot } from '../props/Hotspot';
import { OfficeFacilities, OfficeKitchen } from '../facilities/OfficeFacilities';
import { loungePlacement } from '../facilities/facilityZones';
import { layoutFor } from '../navigation/layout';
import type { CompanyBrand } from '../../simulation/types';
import type { EnvironmentVisualState } from '../environment/environmentVisualState';
import { officeScale } from '../environment/officeScale';
import { OfficeArchitecture } from './OfficeArchitecture';

type OfficeProps={onObject:(id:string)=>void;perks?:{id:string;level:number;object?:string}[];brand:CompanyBrand;visual?:EnvironmentVisualState;quality?:'low'|'medium'|'high'};
function OfficeInterior({level,onObject,perks=[],brand,visual,quality='high'}:OfficeProps&{level:number}) {
  const layout=layoutFor(level),{width:w,depth:d,wallHeight:h}=officeScale(level);
  const desks=layout.points.filter(p=>p.kind==='desk');
  const shownDesks=Math.min(desks.length,Math.max(4,visual?.employeeCount??4));
  const deskPerk = perks.find(p => p.id === 'desks');
  const deskTier = deskPerk ? deskPerk.level : -1;
  const isStanding = deskTier >= 0;
  const isFancy = deskTier >= 1;
  const isFocusPods = deskTier >= 2;
  const desktop = isStanding ? 0.99 : 0.78;
  return <group>
    <OfficeArchitecture level={level} quality={quality}/>
    <BrandSign position={[0,h*.7,-d/2+.19]} color={brand.color} secondaryColor={brand.secondaryColor} mark={brand.mark} pattern={brand.pattern} width={level>=4?5:level>=2?3.4:2.5}/>
    {desks.slice(0,shownDesks).map((p,i)=>{
      const [x,,z]=p.position;
      return <group key={p.id}>
        {isFocusPods && (
          <>
            <Bevel position={[x, 1.02, z - 1.22]} size={[1.68, 1.8, 0.06]} color="#ebe7de" radius={0.015} />
            <Bevel position={[x - 0.82, 1.02, z - 0.79]} size={[0.06, 1.8, 0.8]} color="#ebe7de" radius={0.015} />
            <Bevel position={[x + 0.82, 1.02, z - 0.79]} size={[0.06, 1.8, 0.8]} color="#ebe7de" radius={0.015} />
          </>
        )}
        <Desk position={[x,0,z-.79]} standing={isStanding} color={level>=3?'#d0b797':'#d2ab84'}/>
        <Chair position={[x,0,z]} rotation={Math.PI} color={isFancy ? '#1b2d42' : undefined}/>
        {level===1?<Laptop position={[x,desktop,z-.86]}/>:<><Monitor position={[x,desktop,z-.96]}/><Keyboard position={[x,desktop,z-.57]}/></>}
        {quality!=='low'&&i % 2 === 0 && <Mug position={[x + 0.56, desktop, z - 0.74]} color={i % 4 === 0 ? '#ffffff' : '#3b82f6'} />}
        {quality==='high'&&i === 1 && <BookStack position={[x - 0.56, desktop, z - 0.93]} />}
        {quality==='high'&&i === 2 && <Notebook position={[x - 0.52, desktop, z - 0.68]} />}
        {quality==='high'&&i === 3 && <Headphones position={[x + 0.48, desktop, z - 0.60]} />}
      </group>;
    })}
    {layout.points.filter(p=>!p.id.includes('-slot-')).map(p=>{
      const [x,,z]=p.look;
      if(p.kind==='server')return <Hotspot key={p.id} id="servers" position={[x,1,z]} label="Compute" onClick={onObject}/>;
      if(p.kind==='board')return <group key={p.id} position={[x,0,z]} rotation={[0,Math.atan2(p.position[0]-x,p.position[2]-z),0]}><Whiteboard position={[0,1.35,0]}/><Hotspot id="board" position={[0,1.4,0]} label="Projects" onClick={onObject}/></group>;
      if(p.kind==='coffee') {
        return <OfficeKitchen key={p.id} level={level} perks={perks} onObject={onObject}/>;
      }
      if(p.kind==='lab')return <group key={p.id} position={[x,0,z]} rotation={[0,Math.atan2(p.position[0]-x,p.position[2]-z),0]}>{!visual?.hasResearchLab&&<><Desk position={[0,0,0]} standing/><Monitor position={[0,.99,-.13]}/><Keyboard position={[0,.99,.22]}/></>}<Hotspot id="lab" position={[0,1,0]} label="Research" onClick={onObject}/></group>;
      if(p.kind==='meet')return <group key={p.id} position={[x,0,z]}><Desk position={[0,0,0]}/><Chair position={[-.95,0,0]} rotation={-Math.PI/2}/><Chair position={[.95,0,0]} rotation={Math.PI/2}/><Laptop position={[0,.78,0]}/><Notebook position={[-.35,.78,.12]}/><Mug position={[.42,.78,-.15]} color="#f26419"/></group>;
      return null;
    })}
    {!(level>=2 && perks.some(p=>p.id==='rest')) && <group position={loungePlacement(level)}>
      <Couch position={[0,0,0]}/>

    </group>}
    <Plant position={[w/2-1.1,0,-d/2+1.1]} scale={1.8}/>
    <Plant position={[-w/2+1.1,0,-d/2+1.1]} scale={1.6}/>
    {level>=4&&quality!=='low'&&<><Bevel position={[w*.33,.10,d*.31]} size={[4.5,.2,3.5]} color="#9daa8e" radius={.06}/>{[-1,0,1].map(x=><Plant key={x} position={[w*.33+x*1.25,.2,d*.31]} scale={1.8}/>)}</>}
    <Hotspot id="logo" position={[0,h*.7,-d/2+.2]} label="Company" onClick={onObject}/>
    <Hotspot id="reception" position={layout.points.find(p=>p.kind==='entrance')!.position} label="Recruiting" onClick={onObject}/>
    <OfficeFacilities perks={perks} level={level}/>
  </group>;
}
export const GarageOffice=(props:OfficeProps)=><OfficeInterior {...props} level={1}/>;
export const HQOffice=(props:OfficeProps)=><OfficeInterior {...props} level={2}/>;
export const ResearchLab=(props:OfficeProps)=><OfficeInterior {...props} level={3}/>;
export const CampusOffice=(props:OfficeProps)=><OfficeInterior {...props} level={4}/>;
export const MegaCampus=(props:OfficeProps)=><OfficeInterior {...props} level={5}/>;
export const StartupLoft=HQOffice;
