import { Rover, Tower, Lectern, MedicalScanner, ClinicalRobot, SpecimenFreezer, OpenBook } from './SpecialtyParts';
import type { Vector3Tuple } from 'three';

export { Box, Cylinder, ink, navy, paper, wood, blue, orange, steel } from './Geometry';
import { Box, Cylinder, ink, navy, paper, wood, blue, orange, steel } from './Geometry';
function Lines({code=false}:{code?:boolean}) {return <>{[0,1,2].map(i=><Box key={i} p={[-.04+i*.025,.84-i*.12,.105]} s={[.5-i*.09,.04,.018]} c={code&&i===1?orange:paper}/>)}</>}
export function Display({mode='text'}:{mode?:'text'|'code'|'chart'|'face'|'image'|'web'|'scan'}) {
  return <>
    <Box p={[0,.04,0]} s={[.64,.08,.46]} c={steel}/><Box p={[0,.25,-.06]} s={[.12,.44,.12]} c={steel}/>
    <Box p={[0,.75,0]} s={[1,.72,.16]}/><Box p={[0,.75,.09]} s={[.87,.58,.018]} c={mode==='image'?paper:navy}/>
    {mode==='chart'? [0,1,2].map(i=><Box key={i} p={[-.26+i*.25,.58+i*.07,.11]} s={[.15,.18+i*.14,.025]} c={i===2?orange:blue}/>)
      :mode==='face'?<><Cylinder p={[0,.84,.12]} r={.12} h={.025} rot={[Math.PI/2,0,0]} c={paper}/><Box p={[0,.6,.12]} s={[.36,.19,.025]} c={blue}/></>
      :mode==='image'?<><Box p={[-.12,.68,.12]} s={[.32,.28,.022]} rot={[0,0,.6]} c={navy}/><Box p={[.16,.65,.13]} s={[.36,.24,.025]} rot={[0,0,.4]} c={blue}/><Cylinder p={[.22,.91,.12]} r={.075} h={.022} c={orange} rot={[Math.PI/2,0,0]}/></>
      :mode==='scan'?<>{[-.2,-.07,.07,.2].map(x=><Box key={x} p={[x,.78,.115]} s={[.055,.34-Math.abs(x),.025]} c={paper}/>)}</>
      :<Lines code={mode==='code'}/>}
    {mode==='web'&&<Box p={[0,1,.12]} s={[.76,.06,.02]} c={blue}/>}
  </>;
}
function LaptopPart(){return <><Box p={[0,.055,.12]} s={[1,.11,.7]} c={steel}/><Box p={[0,.12,.13]} s={[.77,.02,.37]}/><group position={[0,.1,-.2]} rotation={[-.15,0,0]}><Box p={[0,.4,0]} s={[1,.78,.08]}/><Box p={[0,.4,.05]} s={[.85,.62,.02]} c={navy}/><group position={[0,-.35,-.05]}><Lines code/></group></group><Box p={[0,.12,.39]} s={[.24,.015,.12]} c={paper}/></>}
function Document(){return <><Box p={[0,.055,0]} s={[.65,.11,.85]} c={navy}/><Box p={[.015,.12,0]} s={[.59,.025,.78]} c={paper}/>{[0,1,2].map(i=><Box key={i} p={[-.025,.14,-.2+i*.15]} s={[.39-i*.06,.014,.035]} c={steel}/>)}<Box p={[.34,.17,.02]} s={[.045,.045,.66]} c={orange} rot={[0,-.18,0]}/></>}
function Book(){return <><Box p={[0,.075,0]} s={[.74,.15,.65]} c={navy}/><Box p={[0,.083,.025]} s={[.7,.1,.61]} c={paper}/><Box p={[0,.17,0]} s={[.78,.035,.68]} c={orange}/><Box p={[0,.2,0]} s={[.025,.018,.62]} c={paper}/></>}
function Rack(){return <><Box p={[0,.6,0]} s={[.7,1.2,.65]}/>{[0,1,2,3].map(i=><group key={i}><Box p={[0,.18+i*.26,.34]} s={[.59,.2,.03]} c={steel}/><Box p={[-.2,.18+i*.26,.36]} s={[.055,.04,.02]} c={blue}/><Box p={[.08,.18+i*.26,.36]} s={[.24,.035,.015]}/></group>)}</>}
function Archive(){return <><Box p={[0,.55,0]} s={[.73,1.1,.6]} c={wood}/>{[0,1,2].map(i=><group key={i}><Box p={[0,.2+i*.34,.32]} s={[.64,.29,.04]} c={paper}/><Box p={[0,.2+i*.34,.36]} s={[.2,.055,.06]} c={steel}/></group>)}</>}
function Microphone(){return <><Cylinder p={[0,.045,0]} r={.27} h={.09} c={ink}/><Cylinder p={[0,.38,0]} r={.045} h={.62}/><Box p={[0,.85,0]} s={[.28,.5,.25]} c={ink} r={.1}/>{[0,1,2,3].map(i=><Box key={i} p={[0,.69+i*.1,.13]} s={[.21,.035,.025]} c={steel}/>)}</>}
function Camera(){return <><Box p={[0,.72,0]} s={[.68,.42,.38]}/><Cylinder p={[.1,.72,.28]} r={.19} h={.25} c={steel} rot={[Math.PI/2,0,0]}/><Cylinder p={[.1,.72,.415]} r={.13} h={.025} c={navy} rot={[Math.PI/2,0,0]}/><Box p={[-.15,1,0]} s={[.24,.13,.2]}/>{[-1,1].map(x=><Box key={x} p={[x*.16,.28,0]} s={[.055,.57,.07]} rot={[0,0,-x*.4]} c={steel}/>)}<Box p={[0,.27,-.15]} s={[.06,.57,.06]} rot={[.45,0,0]} c={steel}/></>}
function Phone(){return <><Box p={[0,.04,0]} s={[.5,.08,.42]} c={steel}/><Box p={[0,.35,-.05]} s={[.09,.62,.09]} c={steel}/><Box p={[0,.7,0]} s={[.43,.8,.08]} r={.05}/><Box p={[0,.7,.05]} s={[.34,.65,.025]} c={blue}/><Box p={[0,.8,.07]} s={[.24,.12,.018]} c={paper}/><Box p={[.04,.58,.07]} s={[.17,.09,.018]} c={navy}/></>}
function Arm(){return <><Cylinder p={[0,.08,0]} r={.28} h={.16}/><Box p={[-.08,.43,0]} s={[.19,.64,.2]} rot={[0,0,.25]} c={orange}/><Cylinder p={[-.15,.74,0]} r={.14} h={.25} rot={[Math.PI/2,0,0]} c={ink}/><Box p={[.16,.88,0]} s={[.65,.17,.19]} rot={[0,0,.4]} c={paper}/><Box p={[.44,.71,0]} s={[.12,.38,.14]} c={steel}/>{[-.09,.09].map(x=><Box key={x} p={[.44+x,.5,0]} s={[.06,.19,.15]}/>)}</>}
function Robot(){return <><Box p={[0,.22,0]} s={[.65,.32,.55]} c={ink}/>{[-.33,.33].map(x=><Cylinder key={x} p={[x,.17,0]} r={.17} h={.1} rot={[0,0,Math.PI/2]} c={ink}/>)}<Box p={[0,.63,0]} s={[.48,.58,.4]} c={paper}/><Box p={[0,1.02,0]} s={[.43,.27,.34]} c={paper}/><Box p={[0,1.04,.18]} s={[.33,.13,.025]} c={navy}/><Box p={[0,.65,.22]} s={[.28,.12,.03]} c={blue}/>{[-1,1].map(x=><Box key={x} p={[x*.34,.67,.07]} s={[.12,.48,.15]} c={steel} rot={[0,0,x*.2]}/>)}</>}
function Tubes(){return <><Box p={[0,.075,0]} s={[.8,.15,.4]} c={steel}/><Box p={[0,.34,0]} s={[.8,.07,.4]} c={paper}/>{[-.27,0,.27].map((x,i)=><group key={x}><Cylinder p={[x,.36,0]} r={.075} h={.5} c={paper}/><Cylinder p={[x,.2,.005]} r={.078} h={.17} c={i===1?orange:blue}/><Cylinder p={[x,.63,0]} r={.09} h={.055} c={navy}/></group>)}</>}
function Microscope(){return <><Box p={[0,.06,0]} s={[.6,.12,.66]} c={paper}/><Box p={[-.15,.48,-.16]} s={[.16,.85,.16]} c={paper} rot={[0,0,-.22]}/><Box p={[0,.44,.06]} s={[.49,.07,.4]}/><group position={[.12,.84,.01]} rotation={[0,0,-.28]}><Cylinder p={[0,0,0]} r={.095} h={.46} c={navy}/></group><Cylinder p={[-.22,.54,.03]} r={.12} h={.16} rot={[Math.PI/2,0,0]}/></>}
function Printer(){return <><Box p={[0,.27,0]} s={[.85,.54,.65]} c={paper}/><Box p={[0,.38,.34]} s={[.63,.1,.025]}/><Box p={[0,.28,.53]} s={[.6,.025,.45]} c={paper}/><Box p={[0,.67,-.19]} s={[.56,.45,.035]} c={paper} rot={[-.12,0,0]}/><Box p={[.27,.57,0]} s={[.16,.035,.12]} c={blue}/></>}
function Package(){return <><Box p={[0,.25,0]} s={[.64,.5,.56]} c={wood}/><Box p={[0,.51,0]} s={[.11,.02,.57]} c={paper}/><Box p={[.1,.28,.29]} s={[.26,.18,.025]} c={paper}/></>}
function Board(){return <><Box p={[0,.76,0]} s={[1.1,1.1,.1]} c={wood}/><Box p={[0,.76,.06]} s={[1,1,.025]} c={paper}/>{[-.42,.42].map(x=><Box key={x} p={[x,.12,0]} s={[.08,.24,.38]} c={steel}/>)}{[0,1,2].map(i=><Box key={i} p={[-.29+i*.29,.8,.09]} s={[.2,.35+i*.13,.02]} c={i===1?orange:blue}/>)}</>}
function Safe(){return <><Box p={[0,.48,0]} s={[.85,.96,.7]} c={steel}/><Box p={[0,.48,.37]} s={[.69,.8,.065]} c={navy}/><Cylinder p={[0,.48,.43]} r={.17} h={.08} c={steel} rot={[Math.PI/2,0,0]}/><Box p={[0,.48,.49]} s={[.35,.055,.045]} c={paper}/></>}
function Scales(){return <><Box p={[0,.055,0]} s={[.85,.11,.45]} c={wood}/><Box p={[0,.6,0]} s={[.075,1.1,.075]} c={steel}/><Box p={[0,1.1,0]} s={[1,.055,.07]} c={steel}/>{[-.4,.4].map(x=><group key={x}><Box p={[x,.85,0]} s={[.025,.5,.025]} c={steel}/><Cylinder p={[x,.58,0]} r={.22} h={.05} c={orange}/></group>)}</>}
function Terrain(){return <><Box p={[0,.1,0]} s={[1.2,.2,.9]} c={navy}/><Box p={[0,.22,0]} s={[1.1,.04,.8]} c='#a8b599'/><Box p={[.16,.25,0]} s={[.15,.025,.79]} c={blue}/>{[[-.32,-.18,.22],[.33,.19,.32],[-.3,.24,.13]].map(([x,z,h],i)=><Box key={i} p={[x!,h!/2+.25,z!]} s={[.2,h!,.19]} c={paper}/>)} </>}
function Conveyor(){return <><Box p={[0,.3,0]} s={[1.2,.17,.52]} c={steel}/>{[-.47,.47].map(x=><Box key={x} p={[x,.14,0]} s={[.1,.28,.42]}/>)}{[-.48,-.24,0,.24,.48].map(x=><Cylinder key={x} p={[x,.4,0]} r={.055} h={.48} c={ink} rot={[Math.PI/2,0,0]}/>)}</>}
function Easel(){return <><Box p={[0,.83,0]} s={[.87,.97,.07]} c={wood}/><group position={[0,.35,.03]} scale={.77}><Display mode='image'/></group>{[-.28,.28].map(x=><Box key={x} p={[x,.19,0]} s={[.06,.38,.09]} c={wood}/>)}<Box p={[0,.57,-.25]} s={[.06,1.18,.06]} c={wood} rot={[.4,0,0]}/></>}
function Headset(){return <><Box p={[0,.04,0]} s={[.6,.08,.4]} c={wood}/><Box p={[0,.4,0]} s={[.08,.72,.09]} c={steel}/><mesh position={[0,.63,0]}><torusGeometry args={[.29,.045,6,16,Math.PI]}/><meshStandardMaterial color={ink} roughness={.9}/></mesh>{[-.29,.29].map(x=><Box key={x} p={[x,.56,0]} s={[.12,.25,.18]}/>)}<Box p={[.2,.43,.14]} s={[.23,.045,.07]} c={steel}/></>}
function Cart(){return <><Box p={[0,.27,0]} s={[.73,.11,.53]} c={steel}/><Box p={[0,.72,0]} s={[.77,.1,.57]} c={paper}/>{[-.29,.29].map(x=><group key={x}><Box p={[x,.46,0]} s={[.05,.5,.4]} c={steel}/><Cylinder p={[x,.1,.17]} r={.1} h={.08} rot={[0,0,Math.PI/2]} c={ink}/><Cylinder p={[x,.1,-.17]} r={.1} h={.08} rot={[0,0,Math.PI/2]} c={ink}/></group>)}</>}
function Chip(){return <><Box p={[0,.06,0]} s={[.95,.12,.8]} c='#50664d'/><Box p={[0,.18,0]} s={[.53,.13,.45]} c={ink}/>{[-.35,-.18,0,.18,.35].map(x=><Box key={x} p={[x,.29,0]} s={[.045,.16,.63]} c={steel}/>)}<Box p={[0,.12,.41]} s={[.65,.06,.04]} c={orange}/></>}
function Speaker(){return <><Box p={[0,.44,0]} s={[.5,.88,.43]} c={wood}/>{[.25,.66].map(y=><Cylinder key={y} p={[0,y,.23]} r={y<.3?.17:.1} h={.04} c={ink} rot={[Math.PI/2,0,0]}/>)}</>}
function Scan(){return <><Box p={[0,.1,0]} s={[1,.2,.73]} c={paper}/><Box p={[-.4,.64,0]} s={[.18,1.05,.22]} c={paper}/><Box p={[0,1.12,0]} s={[.97,.16,.23]} c={paper}/><Box p={[.3,1,.03]} s={[.25,.12,.27]} c={navy}/><Box p={[0,.22,.06]} s={[.62,.025,.49]} c={blue}/></>}
function Booth(){return <><Box p={[0,.07,0]} s={[1.12,.14,.8]} c={navy}/><Box p={[0,.48,-.31]} s={[1.05,.82,.08]} c={paper}/>{[-.49,.49].map(x=><Box key={x} p={[x,.57,0]} s={[.06,1.14,.06]} c={wood}/>)}<Box p={[0,1.17,0]} s={[1.18,.14,.86]} c={orange}/><Box p={[0,.46,.28]} s={[1.02,.68,.18]} c={wood}/></>}
function Seat(){return <><Box p={[0,.34,0]} s={[.6,.13,.55]} c={navy}/><Box p={[0,.67,-.23]} s={[.6,.6,.1]} c={navy}/>{[-.23,.23].map(x=><Box key={x} p={[x,.15,0]} s={[.055,.3,.46]} c={wood}/>)}</>}

export const partRenderers = {
  rover:Rover, tower:Tower, lectern:Lectern, medicalScanner:MedicalScanner, clinicalRobot:ClinicalRobot, freezer:SpecimenFreezer, openBook:OpenBook,
  terminal:()=> <Display/>, code:()=> <Display mode='code'/>, chart:()=> <Display mode='chart'/>, portrait:()=> <Display mode='face'/>, image:()=> <Display mode='image'/>, browser:()=> <Display mode='web'/>, scanDisplay:()=> <Display mode='scan'/>,
  laptop:LaptopPart, document:Document, book:Book, rack:Rack, archive:Archive, mic:Microphone, camera:Camera, phone:Phone, arm:Arm, robot:Robot, tubes:Tubes, microscope:Microscope, printer:Printer, package:Package, board:Board, safe:Safe, scales:Scales, terrain:Terrain, conveyor:Conveyor, easel:Easel, headset:Headset, cart:Cart, chip:Chip, speaker:Speaker, scanner:Scan, booth:Booth, seat:Seat,
};
export type PartKind = keyof typeof partRenderers;
export type Part = {kind:PartKind; at:Vector3Tuple; scale?:number; yaw?:number};
/** All parts use a floor origin. Positions are authored, never derived from ingredient priority or hashes. */
export function Composition({parts}:{parts:readonly Part[]}) {
  return <group>{parts.map((part,i)=>{const Component=partRenderers[part.kind];return <group key={i} position={part.at} scale={part.scale??1} rotation={[0,part.yaw??0,0]}><Component/></group>;})}</group>;
}
