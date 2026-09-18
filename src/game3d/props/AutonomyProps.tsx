import type { Vector3Tuple } from 'three';
import { assetUrl, KitOrGltf } from '../assets/useKitOrGltf';
import { Bevel } from '../geometry/Bevel';
import { Desk, Monitor } from './Furniture';

type Placed={position:Vector3Tuple};
const kit=(id:string,fallback:React.ReactNode)=><KitOrGltf id={id} path={assetUrl('props',`${id}.glb`)} fallback={fallback}/>;

export function AgentTerminal({position}:Placed) {
  return <group position={position}>{kit('prop_autonomy_agentTerminal_A',<group>
    <Desk position={[0,0,0]}/><Monitor position={[0,.78,-.12]}/>
    <Bevel position={[0,.79,.18]} size={[.65,.04,.29]} color="#282c30"/>
    <Bevel position={[.63,.95,-.17]} size={[.18,.29,.28]} color="#2b3e55"/>
    {[0,1,2].map(i=><Bevel key={i} position={[.63,1.03-i*.07,-.015]} size={[.07,.025,.01]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.2}/>)}
  </group>)}</group>;
}

export function AutonomyStatusWall({position}:Placed) {
  return <group position={position}>{kit('prop_autonomy_statusWall_A',<group>
    <Bevel position={[0,1.55,0]} size={[3.5,1.8,.12]} color="#282c30"/>
    {[-1,0,1].map((x,i)=><group key={x} position={[x,1.55,.073]}>
      <Bevel size={[.87,1.45,.015]} color="#192638"/>
      <Bevel position={[0,.34,.014]} size={[.62,.055,.009]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.2}/>
      {[0,1,2].map(j=><Bevel key={j} position={[-.22+j*.21,-.24+j*.12,.016]} size={[.08,.32+j*.12,.01]} color={i===1?'#5c6e5a':'#1e78ff'}/>)}
    </group>)}
  </group>)}</group>;
}

export function AutonomousWorkstations({position,count=3}:Placed&{count?:number}) {
  return <group position={position}>{Array.from({length:count},(_,i)=><AgentTerminal key={i} position={[i*2,0,0]}/>)}</group>;
}

/** Cheap visual-only mezzanine field; agents stay on the ground plane. */
export function WorkstationField({position,count,autonomous}:{position:Vector3Tuple;count:number;autonomous:boolean}) {
  return <group position={position}>{Array.from({length:count},(_,i)=>{
    const x=(i%8)*1.55-5.4,z=Math.floor(i/8)*1.5;
    return <group key={i} position={[x,0,z]}>
      <Bevel position={[0,.7,0]} size={[1.12,.08,.58]} color="#c89e6e"/>
      <Bevel position={[0,1.04,-.16]} size={[.55,.52,.055]} color="#282c30"/>
      <Bevel position={[0,1.04,-.128]} size={[.44,.39,.012]} color={autonomous?'#5599ff':'#2b3e55'} emissive={autonomous?'#5599ff':undefined} emissiveIntensity={.13}/>
      {!autonomous&&<Bevel position={[0,.4,.64]} size={[.36,.6,.35]} color="#33373b"/>}
    </group>;
  })}</group>;
}

export function AutonomousCeoStation({position}:Placed) {
  return <group position={position}>{kit('set_autonomy_ceoStation_L3',<group>
    <Bevel position={[0,.04,0]} size={[4,.08,3.2]} color="#b5c0be"/>
    <Bevel position={[0,1.65,-1.15]} size={[3.7,2.5,.15]} color="#2b3e55"/>
    {Array.from({length:5},(_,i)=><group key={i} position={[-1.3+i*.65,1.8,-1.06]}>
      <Bevel size={[.29,.29,.015]} color={i===2?'#e06b3a':'#5599ff'} emissive="#5599ff" emissiveIntensity={.12}/>
      {i<4&&<Bevel position={[.32,-.22,.008]} size={[.28,.03,.01]} color="#dedede"/>}
    </group>)}
    <Desk position={[0,0,.55]} standing/>
    <Bevel position={[0,1.02,.5]} size={[.95,.06,.6]} color="#282c30"/>
    <Bevel position={[0,1.055,.5]} size={[.6,.015,.34]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.16}/>
  </group>)}</group>;
}
