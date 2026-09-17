import type { Vector3Tuple } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// One bevel segment keeps broad planes and deliberate facets, like the reference sheet.
const geometries = new Map<string, RoundedBoxGeometry>();
function geometry(size: Vector3Tuple, radius: number, taper: number) {
  const key = [...size, radius, taper].join(',');
  let geo = geometries.get(key);
  if (!geo) {
    geo = new RoundedBoxGeometry(...size, 1, radius);
    if (taper) {
      const p = geo.attributes.position!;
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i) / size[1] + .5;
        p.setX(i, p.getX(i) * (1 - taper * Math.abs(y - .6)));
      }
      geo.computeVertexNormals();
    }
    geometries.set(key, geo);
  }
  return geo;
}
export function Bevel({size,position=[0,0,0],rotation=[0,0,0],color,radius=.025,taper=0,roughness=.9,metalness=0,emissive,emissiveIntensity=0,flat=false}:{
  size:Vector3Tuple;position?:Vector3Tuple;rotation?:Vector3Tuple;color:string;radius?:number;taper?:number;
  roughness?:number;metalness?:number;emissive?:string;emissiveIntensity?:number;flat?:boolean;
}) {
  return <mesh geometry={geometry(size,radius,taper)} dispose={null} position={position} rotation={rotation} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} flatShading={flat} emissive={emissive} emissiveIntensity={emissiveIntensity}/>
  </mesh>;
}
