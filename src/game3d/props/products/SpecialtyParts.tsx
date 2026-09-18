import { Box, Cylinder, ink, navy, paper, steel, wood, blue } from './Geometry';

export function Rover() {
  return <><Box p={[0,.34,0]} s={[1.15,.28,.65]} c={navy}/>{[-.45,.45].flatMap(x=>[-.38,.38].map(z=><group key={`${x}${z}`}><Cylinder p={[x,.22,z]} r={.22} h={.14} c={ink} rot={[Math.PI/2,0,0]}/><Cylinder p={[x,.22,z+(z<0?-.08:.08)]} r={.09} h={.02} c={steel} rot={[Math.PI/2,0,0]}/></group>))}</>;
}
export function Tower() {
  return <><Box p={[0,.05,0]} s={[.8,.1,.65]} c={navy}/>{[-.26,.26].flatMap(x=>[-.2,.2].map(z=><Box key={`${x}${z}`} p={[x,.6,z]} s={[.075,1.1,.075]} c={steel}/>))}<Box p={[0,1.15,0]} s={[.78,.1,.62]} c={navy}/><Box p={[0,.6,.2]} s={[.055,1.18,.055]} rot={[0,0,.4]} c={steel}/></>;
}
export function Lectern() {
  return <><Box p={[0,.05,0]} s={[.7,.1,.57]} c={navy}/><Box p={[0,.48,0]} s={[.44,.88,.35]} c={wood}/><Box p={[0,.98,0]} s={[.8,.09,.65]} c={wood} rot={[.12,0,0]}/><Box p={[0,1.015,.3]} s={[.72,.06,.04]} c={navy}/></>;
}
export function MedicalScanner() {
  return <><Box p={[0,.13,-.22]} s={[1.1,.26,.55]} c={paper}/><mesh position={[0,.76,-.22]} castShadow><torusGeometry args={[.43,.18,6,16]}/><meshStandardMaterial color={paper} roughness={.9}/></mesh><Box p={[0,.36,.35]} s={[.43,.13,1.15]} c={blue}/><Box p={[0,.17,.63]} s={[.26,.34,.35]} c={steel}/></>;
}
export function ClinicalRobot() {
  return <><Box p={[0,.57,0]} s={[.68,.8,.58]} c={paper}/>{[.38,.62,.86].map(y=><><Box key={`drawer${y}`} p={[0,y,.31]} s={[.57,.19,.04]} c='#d3d8d6'/><Box key={y} p={[0,y,.35]} s={[.21,.045,.04]} c={steel}/></>)}{[-.27,.27].flatMap(x=>[-.21,.21].map(z=><Cylinder key={`${x}${z}`} p={[x,.12,z]} r={.12} h={.1} c={ink} rot={[0,0,Math.PI/2]}/>))}<Box p={[0,1.08,-.08]} s={[.1,.28,.1]} c={steel}/><Box p={[0,1.25,-.04]} s={[.49,.31,.09]} c={navy}/><Box p={[0,1.25,.015]} s={[.35,.045,.02]} c={blue}/></>;
}
export function SpecimenFreezer() {
  return <><Box p={[0,.65,0]} s={[.82,1.3,.67]} c={paper}/><Box p={[0,.65,.35]} s={[.7,1.15,.06]} c='#d3d8d6'/><Box p={[.25,.65,.41]} s={[.045,.45,.05]} c={steel}/><Box p={[-.11,1.06,.39]} s={[.29,.15,.025]} c={navy}/><Box p={[-.1,1.06,.41]} s={[.18,.035,.015]} c={blue}/><Box p={[0,.15,.395]} s={[.47,.08,.02]} c={steel}/></>;
}
export function OpenBook() {
  return <>{[-1,1].map(side=><group key={side} position={[side*.25,.14,0]} rotation={[0,0,side*.12]}><Box s={[.51,.1,.7]} c={navy}/><Box p={[0,.07,0]} s={[.47,.07,.65]} c={paper}/>{[-.19,0,.19].map(z=><Box key={z} p={[0,.113,z]} s={[.32,.012,.027]} c={steel}/>)}</group>)}</>;
}
