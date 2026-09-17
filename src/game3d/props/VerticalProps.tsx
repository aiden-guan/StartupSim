import type { Vector3Tuple } from 'three';
import { Bevel } from '../geometry/Bevel';
import { Chair, Desk, Monitor, Smartphone, Whiteboard } from './Furniture';
import { ChipBench } from './ComputeProps';
import { ResearchBench, RobotArm } from './ResearchProps';
import { PartsCart, RobotTestBay } from './RoboticsProps';

type Placed={position:Vector3Tuple};
const navy='#2b3e55', dark='#282c30', blue='#5599ff', sage='#5c6e5a', paper='#f4f0e6';

function DisplayBoard({position,accent=blue}:Placed&{accent?:string}) {
  return <group position={position}>
    <Bevel position={[0,1.25,0]} size={[1.65,1.25,.1]} color={paper}/>
    {[-.38,0,.38].map((y,i)=><Bevel key={i} position={[-.16,1.24+y,.06]} size={[i===1?1.1:.85,.07,.012]} color={i===1?accent:navy}/>)}
    <Bevel position={[-.65,.5,0]} size={[.06,1,.06]} color="#6d7788"/><Bevel position={[.65,.5,0]} size={[.06,1,.06]} color="#6d7788"/>
  </group>;
}

export function PressCamera({position}:Placed) {
  return <group position={position}>
    <Bevel position={[0,1.42,0]} size={[.56,.37,.38]} color={dark}/>
    <mesh position={[0,1.42,.23]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.12,.17,.23,10]}/><meshStandardMaterial color={navy} roughness={.8}/></mesh>
    <Bevel position={[0,.82,0]} size={[.05,1,.05]} color="#6d7788"/>
    {[-1,0,1].map(i=><Bevel key={i} position={[i*.25,.25,i===0?.23:-.12]} size={[.04,.55,.04]} rotation={[i*.3,0,i*.32]} color="#6d7788"/>)}
  </group>;
}

export function StudioLight({position}:Placed) {
  return <group position={position}>
    <Bevel position={[0,.8,0]} size={[.055,1.6,.055]} color={dark}/>
    <Bevel position={[0,1.6,0]} size={[.8,.63,.2]} color={dark}/>
    <Bevel position={[0,1.6,.11]} size={[.59,.45,.012]} color="#f9eed2" emissive="#f9eed2" emissiveIntensity={.18}/>
    <Bevel position={[0,.04,0]} size={[.7,.08,.7]} color={dark}/>
  </group>;
}

export function BadgeReader({position}:Placed) {
  return <group position={position}>
    <Bevel position={[0,.7,0]} size={[.12,1.4,.12]} color="#6d7788"/>
    <Bevel position={[0,1.31,0]} size={[.3,.28,.16]} color={navy}/>
    <Bevel position={[0,1.36,.086]} size={[.17,.045,.01]} color={blue} emissive={blue} emissiveIntensity={.2}/>
  </group>;
}

export function MedicalCart({position}:Placed) {
  return <group position={position}>
    <Bevel position={[0,.57,0]} size={[.75,.92,.55]} color="#dedede"/>
    {[-.15,.07,.29].map(y=><Bevel key={y} position={[0,.57+y,.29]} size={[.62,.045,.012]} color="#6d7788"/>)}
    <Bevel position={[0,1.12,-.05]} size={[.3,.17,.3]} color={paper}/>
    {[-.26,.26].map(x=>[-.17,.17].map(z=><mesh key={`${x},${z}`} position={[x,.06,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.07,.07,.05,8]}/><meshStandardMaterial color={dark}/></mesh>))}
  </group>;
}

export function DocumentScanner({position}:Placed) {
  return <group position={position}>
    <Bevel position={[0,.16,0]} size={[.86,.32,.7]} color="#dedede"/>
    <Bevel position={[0,.33,-.12]} size={[.7,.035,.32]} color={dark}/>
    <Bevel position={[0,.02,.43]} size={[.6,.025,.44]} color={paper}/>
  </group>;
}

function ScreenCluster({position,count=2}:Placed&{count?:number}) {
  return <group position={position}><Desk position={[0,0,0]}/>{Array.from({length:count},(_,i)=><Monitor key={i} position={[(i-(count-1)/2)*.58,1.13,-.15]}/>)}</group>;
}

function Cabinet({position,secure=false}:Placed&{secure?:boolean}) {
  return <group position={position}><Bevel position={[0,.7,0]} size={[.8,1.4,.7]} color={secure?dark:'#dedede'}/>
    {secure?<Bevel position={[0,.75,.36]} size={[.17,.22,.02]} color={blue}/>:<Bevel position={[0,.7,.36]} size={[.54,.035,.02]} color="#6d7788"/>}
  </group>;
}

function RuggedCase({position}:Placed) {
  return <group position={position}><Bevel position={[0,.28,0]} size={[.95,.56,.63]} color={dark}/>
    <Bevel position={[0,.56,0]} size={[.97,.065,.65]} color={navy}/>
    <Bevel position={[0,.3,.33]} size={[.2,.07,.02]} color="#6d7788"/>
  </group>;
}

function TabletCart({position}:Placed) {
  return <group position={position}><Cabinet position={[0,0,0]}/>{[-.22,0,.22].map(x=><Bevel key={x} position={[x,1.48,0]} size={[.18,.32,.05]} color={navy}/>)}</group>;
}

function PipetteRack({position}:Placed) {
  return <group position={position}><Bevel position={[0,.05,0]} size={[.75,.1,.28]} color="#dedede"/>
    {[-.28,-.14,0,.14,.28].map(x=><Bevel key={x} position={[x,.34,0]} size={[.045,.58,.045]} color={paper}/>)}
  </group>;
}

export function VerticalKit({id,position,secondary=false}:Placed&{id:string;secondary?:boolean}) {
  const primary=<group>
    {id==='consumer'&&<><Smartphone position={[-.45,.85,0]}/><DisplayBoard position={[.9,0,-.25]} accent="#e06b3a"/><StudioLight position={[-1.1,0,-.4]}/></>}
    {id==='enterprise'&&<><DisplayBoard position={[-.5,0,-.3]} accent={sage}/><BadgeReader position={[1,0,.1]}/><Desk position={[.2,0,.9]}/><Chair position={[-.7,0,.9]}/></>}
    {id==='developer'&&<><ScreenCluster position={[0,0,0]} count={3}/><DisplayBoard position={[1.45,0,-.4]} accent={blue}/></>}
    {id==='media'&&<><PressCamera position={[-.65,0,.2]}/><StudioLight position={[.65,0,-.5]}/><ScreenCluster position={[1.25,0,.8]}/></>}
    {id==='education'&&<><TabletCart position={[-.6,0,0]}/><DisplayBoard position={[.85,0,-.2]} accent={sage}/><Bevel position={[.7,.15,.8]} size={[.5,.3,.4]} color={navy}/></>}
    {id==='health'&&<><MedicalCart position={[-.7,0,.2]}/><DisplayBoard position={[.7,0,-.3]} accent={sage}/><Cabinet position={[1.4,0,.8]}/></>}
    {id==='finance'&&<><ScreenCluster position={[-.3,0,0]} count={3}/><DisplayBoard position={[1.3,0,-.3]} accent={sage}/><Cabinet position={[1.2,0,1]} secure/></>}
    {id==='legal'&&<><DocumentScanner position={[-.7,.79,0]}/><Desk position={[-.7,0,0]}/><Cabinet position={[.85,0,-.4]}/><DisplayBoard position={[1.3,0,.9]}/></>}
    {id==='defense'&&<><ScreenCluster position={[-.5,0,0]}/><RuggedCase position={[1,0,.6]}/><BadgeReader position={[1.3,0,-.5]}/></>}
    {id==='robotics'&&<><RobotTestBay position={[0,0,0]}/><PartsCart position={[2.2,0,.8]}/></>}
    {id==='biotech'&&<><ResearchBench position={[-.5,0,0]}/><PipetteRack position={[.45,1.05,0]}/><Cabinet position={[1.3,0,-.35]}/></>}
    {id==='hardware'&&<><ChipBench position={[-.5,0,0]}/><Cabinet position={[1.3,0,-.4]} secure/></>}
    {id==='science'&&<><ResearchBench position={[-.5,0,0]}/><RobotArm position={[.7,0,-.3]}/><Whiteboard position={[1.4,1.35,.8]}/></>}
  </group>;
  return <group position={position}>{secondary?<group>
    <Bevel position={[0,.27,0]} size={[.6,.54,.5]} color={navy}/><Bevel position={[0,.51,.26]} size={[.35,.045,.014]} color={id==='consumer'?'#e06b3a':blue}/>
  </group>:primary}</group>;
}
