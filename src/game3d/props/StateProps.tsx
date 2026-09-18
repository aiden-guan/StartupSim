import type { Vector3Tuple } from 'three';
import { Bevel } from '../geometry/Bevel';
import { CardboardBox, Mug, Notebook, PizzaBox } from './Furniture';
import { PressCamera } from './VerticalProps';

type Placed={position:Vector3Tuple};

export function RunwayCorner({position}:Placed) {
  return <group position={position}>
    <CardboardBox position={[-.45,0,0]}/><CardboardBox position={[.18,0,.35]}/>
    <Bevel position={[.42,.6,-.22]} size={[.75,.055,.5]} color="#c89e6e"/>
    <Bevel position={[.16,.3,-.22]} size={[.05,.56,.05]} color="#6d7788"/>
    <Bevel position={[.68,.3,-.22]} size={[.05,.56,.05]} color="#6d7788"/>
  </group>;
}

export function HypeArea({position,tier=1}:Placed&{tier?:number}) {
  return <group position={position}>
    <PressCamera position={[-.8,0,.1]}/>
    <Bevel position={[.7,.36,0]} size={[1.05,.72,.8]} color="#b89065"/>
    {tier>1&&<><Bevel position={[.7,.77,0]} size={[.9,.12,.72]} color="#2b3e55"/>
      <Bevel position={[.7,.85,0]} size={[.62,.035,.4]} color="#dedede"/>
      <Bevel position={[1.35,1.12,-.6]} size={[1.15,.7,.08]} color="#2b3e55"/>
      <Bevel position={[1.35,1.12,-.55]} size={[.68,.05,.012]} color="#5599ff"/>
    </>}
  </group>;
}

export function BurnoutDeskClutter({position}:Placed) {
  return <group position={position}>
    <Mug position={[-.2,0,0]}/><Mug position={[.15,0,.16]} color="#ded3c3"/>
    <Notebook position={[.05,0,-.16]}/><PizzaBox position={[.5,0,.05]}/>
  </group>;
}
