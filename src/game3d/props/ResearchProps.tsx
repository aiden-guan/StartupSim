import type { Vector3Tuple } from 'three';
import { assetUrl, KitOrGltf } from '../assets/useKitOrGltf';
import { Bevel } from '../geometry/Bevel';
import { Desk, Monitor, Whiteboard } from './Furniture';

type Placed={position:Vector3Tuple};
const kit=(id:string,fallback:React.ReactNode)=><KitOrGltf id={id} path={assetUrl('props',`${id}.glb`)} fallback={fallback}/>;

export function ResearchBench({position}:Placed) {
  return <group position={position}>{kit('prop_research_bench_A',<group>
    <Desk position={[0,0,0]} standing/>
    <Bevel position={[-.45,1.07,-.1]} size={[.32,.11,.22]} color="#2b3e55"/>
    {[-.12,0,.12].map((x,i)=><group key={i} position={[x+.42,1.11,.08]}>
      <mesh><cylinderGeometry args={[.035,.045,.22,7]}/><meshStandardMaterial color="#dedede" roughness={.9}/></mesh>
      <Bevel position={[0,-.04,0]} size={[.07,.04,.07]} color={i===1?'#e06b3a':'#5599ff'}/>
    </group>)}
    <Monitor position={[-.28,.99,-.22]}/>
  </group>)}</group>;
}

export function ModelTrainingStation({position}:Placed) {
  return <group position={position}>
    <Desk position={[0,0,0]}/>
    <Monitor position={[-.36,.78,-.14]}/><Monitor position={[.36,.78,-.14]}/>
    <Bevel position={[0,.83,.16]} size={[.68,.055,.35]} color="#282c30"/>
    <Bevel position={[.7,.95,-.19]} size={[.23,.32,.3]} color="#2b3e55"/>
    {[0,1,2].map(i=><Bevel key={i} position={[.7,1.03-i*.075,-.03]} size={[.12,.018,.012]} color="#1e78ff" emissive="#1e78ff" emissiveIntensity={.18}/>)}
  </group>;
}

export function CheckpointStack({position}:Placed) {
  return <group position={position}>
    {[0,1,2].map(i=><group key={i} position={[0,.08+i*.2,0]}>
      <Bevel size={[.62,.16,.55]} color="#33373b"/>
      <Bevel position={[-.17,0,.29]} size={[.1,.03,.012]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.15}/>
    </group>)}
  </group>;
}

export function ResearchBoard({position}:Placed) {
  return <group position={position}><Whiteboard position={[0,1.35,0]}/>
    <Bevel position={[.62,1.54,.055]} size={[.23,.035,.008]} color="#e06b3a"/>
    <Bevel position={[.62,1.4,.055]} size={[.33,.035,.008]} color="#5c6e5a"/>
  </group>;
}

export function AutonomousLabCell({position}:Placed) {
  return <group position={position}>{kit('set_research_autonomousLab_L3',<group>
    <Bevel position={[0,.015,0]} size={[3.6,.03,3.2]} color="#aab5b4"/>
    {[-1.6,1.6].map(x=><Bevel key={x} position={[x,1.2,0]} size={[.05,2.4,3.2]} color="#8b9da4"/>)}
    <Bevel position={[0,2.4,-1.55]} size={[3.3,.05,.05]} color="#8b9da4"/>
    <ResearchBench position={[0,0,-.45]}/><RobotArm position={[.95,0,-.55]}/>
    <Bevel position={[0,.65,1.54]} size={[2.5,1.15,.035]} color="#b9cfd5" roughness={.45}/>
  </group>)}</group>;
}

export function RobotArm({position}:Placed) {
  return <group position={position}>{kit('prop_research_robotArm_A',<group>
    <Bevel position={[0,.12,0]} size={[.45,.24,.45]} color="#33373b"/>
    <Bevel position={[0,.48,0]} size={[.15,.58,.16]} rotation={[0,0,-.18]} color="#dedede"/>
    <Bevel position={[.16,.83,0]} size={[.48,.14,.15]} rotation={[0,0,.35]} color="#dedede"/>
    <Bevel position={[.39,.67,0]} size={[.1,.36,.1]} rotation={[0,0,.55]} color="#dedede"/>
    <Bevel position={[.49,.51,0]} size={[.25,.07,.07]} color="#282c30"/>
    <mesh position={[.1,.79,0]}><sphereGeometry args={[.115,8,6]}/><meshStandardMaterial color="#2b3e55" roughness={.82}/></mesh>
  </group>)}</group>;
}
