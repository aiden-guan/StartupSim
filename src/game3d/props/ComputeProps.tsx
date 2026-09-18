import type { Vector3Tuple } from 'three';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { assetUrl, KitOrGltf } from '../assets/useKitOrGltf';
import { Bevel } from '../geometry/Bevel';
import { CardboardBox, Desk, Monitor, ServerRack } from './Furniture';

const navy = '#2b3e55', charcoal = '#282c30', blue = '#1e78ff', gray = '#dedede', wood = '#c89e6e';
type Placed = { position: Vector3Tuple };
const kit = (id: string, fallback: React.ReactNode) => <KitOrGltf id={id} path={assetUrl('props', `${id}.glb`)} fallback={fallback}/>;

export function GpuShippingBox({position}:Placed) {
  return <group position={position}>{kit('prop_compute_gpuShippingBox_A',<CardboardBox position={[0,0,0]} scale={1.25}/>)}</group>;
}

export function CloudConsole({position}:Placed) {
  return <group position={position}>
    <Desk position={[0,0,0]}/><Monitor position={[-.34,.78,-.12]}/>
    <Bevel position={[.43,1.12,-.11]} size={[.42,.23,.04]} color={navy}/>
    <Bevel position={[.43,1.12,-.08]} size={[.31,.1,.012]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.2}/>
  </group>;
}

function CompactRack({position,load}:{position:Vector3Tuple;load:number}) {
  return <group position={position}>
    <Bevel position={[0,.88,0]} size={[.82,1.76,.66]} color={charcoal}/>
    <Bevel position={[0,.88,.339]} size={[.68,1.59,.012]} color="#171c24"/>
    {Array.from({length:load>.65?5:load>.25?3:1},(_,i)=><Bevel key={i} position={[-.2,.43+i*.2,.351]} size={[.1,.035,.014]} color={blue} emissive={blue} emissiveIntensity={.18+load*.22}/>)}
  </group>;
}

export function ServerRackBank({position,count=4,columns,load=0,quality='high'}:{position:Vector3Tuple;count?:number;columns?:number;load?:number;quality?:'low'|'medium'|'high'}) {
  const shown=Math.min(count,quality==='low'?3:quality==='medium'?8:18);
  return <group position={position}>{kit('set_compute_privateCluster_L2',<group>
    {(() => {
      const gridColumns = Math.max(1, Math.min(columns ?? (shown > 1 ? 2 : 1), shown));
      const rows = Math.ceil(shown / gridColumns);
      const positions = Array.from({length:shown},(_,i)=>[
        (i % gridColumns - (gridColumns - 1) / 2) * 1.02,
        0,
        (Math.floor(i / gridColumns) - (rows - 1) / 2) * 1.28,
      ] as Vector3Tuple);
      return <>
        <Bevel position={[0,-.015,0]} size={[Math.max(1.1,gridColumns*1.02),.03,Math.max(1.1,rows*1.28)]} color="#86969b"/>
        {positions.map((rackPosition,i)=><group key={i} position={rackPosition}>
      {i<2&&quality==='high'?<ServerRack position={[0,.88,0]} load={load}/>:<CompactRack position={[0,0,0]} load={load}/>} 
        </group>)}
      </>;
    })()}
  </group>)}</group>;
}

/** Instanced distant rows keep the megacampus legible without hundreds of rack draw calls. */
export function ServerField({position,columns,rows,load=0}:{position:Vector3Tuple;columns:number;rows:number;load?:number}) {
  const n=columns*rows;
  const shells=useRef<THREE.InstancedMesh>(null),fronts=useRef<THREE.InstancedMesh>(null),lights=useRef<THREE.InstancedMesh>(null);
  const lit=load>.65?4:load>.25?2:1;
  useLayoutEffect(()=>{
    const obj=new THREE.Object3D();
    for(let i=0;i<n;i++) {
      const x=(i%columns)*1.08,z=Math.floor(i/columns)*1.35;
      obj.position.set(x,.88,z);obj.updateMatrix();shells.current?.setMatrixAt(i,obj.matrix);
      obj.position.set(x,.88,z+.338);obj.updateMatrix();fronts.current?.setMatrixAt(i,obj.matrix);
      for(let k=0;k<lit;k++) {obj.position.set(x-.22,.42+k*.26,z+.353);obj.updateMatrix();lights.current?.setMatrixAt(i*lit+k,obj.matrix);}
    }
    for(const ref of [shells,fronts,lights])if(ref.current)ref.current.instanceMatrix.needsUpdate=true;
  },[n,columns,lit]);
  return <group position={position}>
    <instancedMesh ref={shells} args={[undefined,undefined,n]} castShadow={false}><boxGeometry args={[.82,1.76,.66]}/><meshStandardMaterial color={charcoal} roughness={.93}/></instancedMesh>
    <instancedMesh ref={fronts} args={[undefined,undefined,n]}><boxGeometry args={[.68,1.6,.025]}/><meshStandardMaterial color="#171c24" roughness={.9}/></instancedMesh>
    <instancedMesh ref={lights} args={[undefined,undefined,n*lit]}><boxGeometry args={[.1,.045,.015]}/><meshStandardMaterial color={blue} emissive={blue} emissiveIntensity={.2+load*.25} roughness={.9}/></instancedMesh>
  </group>;
}

export function CoolingUnit({position,active=false}:Placed&{active?:boolean}) {
  return <group position={position}>{kit('prop_compute_coolingUnit_A',<group>
    <Bevel position={[0,.75,0]} size={[1.2,1.5,.7]} color={gray}/>
    {[-.3,.3].map(x=><group key={x} position={[x,.9,.36]}>
      <mesh rotation={[Math.PI/2,0,0]}><torusGeometry args={[.2,.035,6,16]}/><meshStandardMaterial color={charcoal} roughness={.85}/></mesh>
      <Bevel size={[.32,.035,.025]} color={charcoal}/><Bevel size={[.035,.32,.025]} color={charcoal}/>
    </group>)}
    <Bevel position={[0,.18,.365]} size={[.3,.05,.014]} color={active?'#5599ff':'#86969b'} emissive={active?'#5599ff':undefined} emissiveIntensity={.16}/>
  </group>)}</group>;
}

export function ComputeStatusWall({position,load=0}:Placed&{load?:number}) {
  return <group position={position}>
    <Bevel position={[0,1.6,0]} size={[2.5,1.45,.12]} color={charcoal}/>
    {Array.from({length:4},(_,i)=><group key={i} position={[-.83+i*.55,1.55,.07]}>
      <Bevel size={[.38,.75,.014]} color="#192739"/>
      <Bevel position={[0,-.24,.012]} size={[.27,.07,.01]} color={load>.65?'#e06b3a':blue} emissive={blue} emissiveIntensity={.15}/>
      <Bevel position={[-.08,.08,.012]} size={[.06,.24,.01]} color="#5c6e5a"/>
    </group>)}
  </group>;
}

export function ChipBench({position}:Placed) {
  return <group position={position}>{kit('prop_hardware_chipBench_A',<group>
    <Desk position={[0,0,0]} standing/>
    <Bevel position={[-.3,1.03,0]} size={[.5,.035,.45]} color={charcoal}/>
    <Bevel position={[-.3,1.055,0]} size={[.24,.012,.24]} color={blue}/>
    {[-.15,0,.15].map(x=><Bevel key={x} position={[x+.36,1.03,.05]} size={[.08,.045,.14]} color={wood}/>)}
    <Bevel position={[.32,1.2,-.2]} size={[.55,.4,.05]} color={navy}/>
    <Bevel position={[.32,1.2,-.167]} size={[.38,.24,.012]} color="#5599ff" emissive="#5599ff" emissiveIntensity={.18}/>
  </group>)}</group>;
}
