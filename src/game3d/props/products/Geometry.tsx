import { Bevel } from '../../geometry/Bevel';
import type { Vector3Tuple } from 'three';
export const ink = '#282c30', navy = '#2b3e55', paper = '#eee6d7', wood = '#c89e6e', blue = '#699ac0', orange = '#d87747', steel = '#929b9d';
export function Box({p=[0,0,0],s,c=ink,r=.025,rot=[0,0,0]}:{p?:Vector3Tuple;s:Vector3Tuple;c?:string;r?:number;rot?:Vector3Tuple}) {
  return <Bevel position={p} size={s} color={c} radius={Math.min(r,...s.map(n=>n/3))} rotation={rot}/>;
}
export function Cylinder({p,r=.1,h=.2,c=steel,rot=[0,0,0]}:{p:Vector3Tuple;r?:number;h?:number;c?:string;rot?:Vector3Tuple}) {
  return <mesh position={p} rotation={rot} castShadow receiveShadow><cylinderGeometry args={[r,r,h,12]}/><meshStandardMaterial color={c} roughness={.88}/></mesh>;
}
