import type { Vector3Tuple } from 'three';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { assetUrl, KitOrGltf } from '../assets/useKitOrGltf';
import { Bevel } from '../geometry/Bevel';
import { CardboardBox, RobotAssistant } from './Furniture';
import { RobotArm } from './ResearchProps';

type Placed={position:Vector3Tuple};
const kit=(id:string,fallback:React.ReactNode)=><KitOrGltf id={id} path={assetUrl('props',`${id}.glb`)} fallback={fallback}/>;

export function RobotPrototype({position}:Placed) {
  return <group position={position}>{kit('prop_robot_prototype_A',<group>
    <Bevel position={[0,.08,0]} size={[.65,.16,.65]} color="#33373b"/>
    <RobotAssistant position={[0,.16,0]}/>
    <Bevel position={[0,.18,.38]} size={[.3,.03,.05]} color="#e06b3a"/>
  </group>)}</group>;
}

export function GeneralRobot({position}:Placed) {
  return <group position={position}>{kit('prop_robot_generalPurpose_A',<group>
    <Bevel position={[0,1.45,0]} size={[.55,.43,.38]} color="#e8ece9" radius={.09}/>
    <Bevel position={[0,1.47,.2]} size={[.43,.25,.025]} color="#282c30" radius={.05}/>
    {[-.1,.1].map(x=><Bevel key={x} position={[x,1.48,.218]} size={[.04,.08,.01]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.25}/>)}
    <Bevel position={[0,.94,0]} size={[.51,.75,.36]} color="#dedede" radius={.07}/>
    <Bevel position={[0,.9,.19]} size={[.18,.07,.015]} color="#2b3e55"/>
    {[-1,1].map(side=><group key={side}>
      <Bevel position={[side*.39,1.03,0]} size={[.16,.55,.17]} color="#dedede" radius={.04}/>
      <Bevel position={[side*.4,.64,.035]} size={[.15,.22,.14]} color="#33373b"/>
      <Bevel position={[side*.16,.29,0]} size={[.18,.48,.18]} color="#e8ece9"/>
      <Bevel position={[side*.16,.055,.12]} size={[.27,.11,.36]} color="#33373b"/>
    </group>)}
  </group>)}</group>;
}

export function ChargingDock({position}:Placed) {
  return <group position={position}>{kit('prop_robot_chargingDock_A',<group>
    <Bevel position={[0,.04,0]} size={[1.1,.08,1]} color="#33373b"/>
    <Bevel position={[0,.1,0]} size={[.67,.02,.65]} color="#1e78ff" emissive="#1e78ff" emissiveIntensity={.14}/>
    <Bevel position={[0,.65,-.43]} size={[.55,1.2,.18]} color="#2b3e55"/>
    <Bevel position={[0,.81,-.33]} size={[.28,.2,.012]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.2}/>
  </group>)}</group>;
}

export function PartsCart({position}:Placed) {
  return <group position={position}>
    <Bevel position={[0,.54,0]} size={[.87,.09,.62]} color="#6d7788"/>
    <Bevel position={[0,.17,0]} size={[.87,.07,.62]} color="#6d7788"/>
    {[-.34,.34].flatMap(x=>[-.23,.23].map(z=><Bevel key={`${x}-${z}`} position={[x,.28,z]} size={[.06,.5,.06]} color="#33373b"/>))}
    <CardboardBox position={[-.1,.66,0]} scale={.65}/>
    <Bevel position={[.27,.6,0]} size={[.18,.08,.2]} color="#e06b3a"/>
  </group>;
}

export function RobotTestBay({position}:Placed) {
  return <group position={position}>{kit('set_robotics_testBay_L2',<group>
    <Bevel position={[0,.01,0]} size={[4,.02,3.2]} color="#b7c1bf"/>
    {[-1.75,1.75].map(x=><Bevel key={x} position={[x,.026,0]} size={[.07,.015,3]} color="#e6aa48"/>)}
    {[0,1,2].map(i=><Bevel key={i} position={[0,.027,-1+i*1.05]} size={[.8,.016,.065]} color="#f4f0e6"/>)}
    <ChargingDock position={[1.23,0,-.87]}/><RobotArm position={[-1.3,0,-.8]}/>
    <PartsCart position={[1.15,0,1.1]}/>
  </group>)}</group>;
}

export function RobotAssemblyField({position,count}:{position:Vector3Tuple;count:number}) {
  return <group position={position}>
    {Array.from({length:count},(_,i)=>{
      const x=(i%4)*3.1,z=Math.floor(i/4)*3.3;
      return <group key={i} position={[x,0,z]}>
        <Bevel position={[0,.03,0]} size={[2.7,.05,2.75]} color="#b5c2c0"/>
        <Bevel position={[0,.73,-.3]} size={[2.1,.09,.9]} color="#dedede"/>
        {[-.82,.82].map(s=><Bevel key={s} position={[s,.36,-.3]} size={[.07,.72,.07]} color="#6d7788"/>)}
        <RobotArm position={[-.5,.78,-.3]}/>
        <Bevel position={[.72,.9,-.22]} size={[.36,.24,.3]} color="#2b3e55"/>
        <Bevel position={[0,.04,1.28]} size={[1.5,.018,.07]} color="#e6aa48"/>
      </group>;
    })}
  </group>;
}

export function MachineField({position,columns,rows}:{position:Vector3Tuple;columns:number;rows:number}) {
  const n=columns*rows;
  const bases=useRef<THREE.InstancedMesh>(null),arms=useRef<THREE.InstancedMesh>(null),heads=useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(()=>{
    const obj=new THREE.Object3D();
    for(let i=0;i<n;i++) {
      const x=(i%columns)*2.6,z=Math.floor(i/columns)*2.8;
      obj.position.set(x,.55,z);obj.rotation.set(0,0,0);obj.updateMatrix();bases.current?.setMatrixAt(i,obj.matrix);
      obj.position.set(x-.35,1.25,z-.1);obj.rotation.set(0,0,-.35);obj.updateMatrix();arms.current?.setMatrixAt(i,obj.matrix);
      obj.position.set(x-.05,1.55,z-.1);obj.rotation.set(0,0,0);obj.updateMatrix();heads.current?.setMatrixAt(i,obj.matrix);
    }
    for(const ref of [bases,arms,heads])if(ref.current)ref.current.instanceMatrix.needsUpdate=true;
  },[n,columns]);
  return <group position={position}>
    <instancedMesh ref={bases} args={[undefined,undefined,n]}><boxGeometry args={[1.95,1.1,1.3]}/><meshStandardMaterial color="#2b3e55" roughness={.92}/></instancedMesh>
    <instancedMesh ref={arms} args={[undefined,undefined,n]}><boxGeometry args={[.17,.85,.17]}/><meshStandardMaterial color="#dedede" roughness={.86}/></instancedMesh>
    <instancedMesh ref={heads} args={[undefined,undefined,n]}><boxGeometry args={[.42,.28,.38]}/><meshStandardMaterial color="#2b3e55" roughness={.85}/></instancedMesh>
  </group>;
}
