import { Bevel } from '../geometry/Bevel';
import { officeScale } from '../environment/officeScale';
import { Plant } from '../props/Furniture';
import { assetUrl, KitOrGltf } from '../assets/useKitOrGltf';

type Quality='low'|'medium'|'high';
export function OfficeArchitecture({level,quality='high'}:{level:number;quality?:Quality}) {
  const {width:w,depth:d,wallHeight:h}=officeScale(level);
  const industrial=level>=3;
  const floor=industrial?'#cad0c8':level>=2?'#d7d2c6':'#cfbc9e';
  const id=['env_apartment_shell','env_tinyOffice_shell','env_hq_shell','env_aiLab_shell','env_campus_shell','env_megaCampus_shell'][level]!;
  return <KitOrGltf id={id} path={assetUrl('environments',`${id}.glb`)} fallback={<group>
    <Bevel position={[0,-.17,0]} size={[w,.32,d]} radius={.08} color={floor}/>
    {level>=2&&<>
      <Bevel position={[0,.005,d/2-(level>=4?4:2.1)]} size={[w-.45,.012,level>=4?7.4:3.7]} color="#c6b69c" radius={.004}/>
      <Bevel position={[0,.015,d/2-(level>=4?8:4.3)]} size={[w-.5,.018,1.1]} color="#e6e0d3" radius={.003}/>
      <Bevel position={[0,.018,d/2-(level>=4?8.6:4.9)]} size={[w-.5,.018,.045]} color="#a99b81" radius={.003}/>
    </>}

    <Bevel position={[0,h/2,-d/2]} size={[w,h,.17]} radius={.02} color={industrial?'#dce3e1':'#e8ebe5'}/>
    <Bevel position={[-w/2,h/2,0]} size={[.17,h,d]} radius={.02} color={industrial?'#cbd4d3':'#dbe2de'}/>
    <Bevel position={[0,.05,-d/2+.17]} size={[w,.1,.14]} color="#f4f0e6"/>
    {Array.from({length:level>=5?10:level>=4?7:level>=3?5:2},(_,i)=>{
      const x=-w/2+(i+1)*w/(level>=5?11:level>=4?8:level>=3?6:3);
      return <group key={i} position={[x,0,-d/2+.2]}>
        <Bevel position={[0,h/2,0]} size={[.16,h,.25]} color={industrial?'#aab8b8':'#f6f5ed'}/>
        <Bevel position={[0,h*.6,.12]} size={[Math.min(4,w/7),h*.42,.025]} color="#b9cfd5"/>
      </group>;
    })}
    {level>=2&&<>
      <Bevel position={[-w*.22,.018,0]} size={[.07,.02,d*.72]} color={industrial?'#a6b8be':'#b8ad97'}/>
      <Bevel position={[w*.2,.018,0]} size={[.07,.02,d*.72]} color={industrial?'#a6b8be':'#b8ad97'}/>
      <Bevel position={[0,.019,-d*.17]} size={[w*.75,.02,.07]} color={industrial?'#a6b8be':'#b8ad97'}/>
    </>}
    {level===2&&<group position={[w*.28,0,d*.25-1]}>
      <Bevel position={[0,.025,0]} size={[6.5,.05,4.7]} color="#ded3c3"/>
      <Bevel position={[-3.15,1.4,0]} size={[.09,2.8,4.7]} color="#8b9da4"/>
      <mesh position={[0,1.4,-2.3]}><boxGeometry args={[6.5,2.8,.035]}/><meshStandardMaterial color="#b9cfd5" transparent opacity={.22} roughness={.5} depthWrite={false}/></mesh>
      <Bevel position={[0,2.8,-2.3]} size={[6.5,.08,.08]} color="#8b9da4"/>
    </group>}
    {level>=3&&<>
      {[-1,1].map(side=><group key={side} position={[side*w*.31,0,0]}>
        <Bevel position={[0,h*.78,0]} size={[.16,.16,d*.82]} color="#6d7788"/>
        {[.25,.6].map(z=><Bevel key={z} position={[0,h*.78,d*(z-.5)]} size={[3.3,.12,.12]} color="#6d7788"/>)}
      </group>)}
      {[-1,1].map(side=><Bevel key={side} position={[side*w*.36,.025,-d*.2]} size={[.07,.015,d*.38]} color="#e6aa48"/>)}
    </>}
    {level>=4&&<>
      <Bevel position={[level===4?.1:-3.5,.013,level===4?-6.4:-9]} size={[level===4?13.6:21,.018,level===4?10.5:14.4]} color="#b8b9aa"/>
      <Bevel position={[level===4?-7.5:-15.5,.017,level===4?-6.4:-9]} size={[.055,.02,level===4?12:16]} color="#e8e1d2"/>
      <Bevel position={[0,.02,d*.2]} size={[w*.26,.035,d*.24]} color="#e3e8e0"/>
      <Bevel position={[0,.13,d*.14]} size={[w*.16,.22,d*.13]} color="#9daa8e"/>
      {quality!=='low'&&[-2,-1,0,1,2].map(i=><Plant key={i} position={[i*2,.25,d*.14]} scale={1.9}/>)}
      <Bevel position={[0,3.25,-d/2+2.1]} size={[w*.55,.24,4.2]} color="#d4dcda"/>
      <Bevel position={[0,3.5,-d/2+4.1]} size={[w*.55,.45,.14]} color="#8b9da4"/>
      {Array.from({length:Math.round(w/8)},(_,i)=><Bevel key={i} position={[-w*.275+(i+.5)*w*.55/Math.round(w/8),1.75,-d/2+4.1]} size={[.14,3.5,.14]} color="#8b9da4"/>)}
      <Bevel position={[-w*.27,1.5,-d*.21]} size={[.09,3,d*.25]} color="#8b9da4"/>
      <Bevel position={[w*.28,1.5,-d*.21]} size={[.09,3,d*.25]} color="#8b9da4"/>
    </>}
    {level>=5&&<>
      <Bevel position={[w*.19,4.4,-d/2+3.4]} size={[w*.34,.24,6.3]} color="#aebcbe"/>
      <Bevel position={[w*.19,4.65,-d/2+6.5]} size={[w*.34,.38,.12]} color="#6d7788"/>
      {Array.from({length:5},(_,i)=><Bevel key={i} position={[w*.04+i*3.1,2.2,-d/2+6.5]} size={[.15,4.4,.16]} color="#8b9da4"/>)}
      <Bevel position={[w*.31,.022,d*.31]} size={[w*.25,.035,d*.18]} color="#b5bbb5"/>
      {Array.from({length:3},(_,i)=><group key={i} position={[w*.23+i*3.4,0,d*.34]}>
        <Bevel position={[0,1.5,0]} size={[2.5,3,.18]} color="#8c999b"/>
        <Bevel position={[0,1.5,.12]} size={[2.15,2.5,.03]} color="#323e49"/>
        <Bevel position={[0,.08,1.25]} size={[2.5,.08,2.4]} color="#e6aa48"/>
      </group>)}
    </>}
  </group>}/>;
}
