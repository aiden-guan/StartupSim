import type { Vector3Tuple } from 'three';
import type { OfficeLayout } from './layout';
/** Grid paths skirt worktops. The path is computed once per activity, never rerolled per frame. */
export function route(from:Vector3Tuple,to:Vector3Tuple,layout:OfficeLayout):Vector3Tuple[] {
  const step=.45,key=(x:number,z:number)=>`${x},${z}`;
  const start=[Math.round(from[0]/step),Math.round(from[2]/step)],end=[Math.round(to[0]/step),Math.round(to[2]/step)];
  const bound=Math.ceil(Math.max(...layout.points.flatMap(p=>[Math.abs(p.position[0]),Math.abs(p.position[2])]))/step)+3;
  const blocked=(x:number,z:number)=>layout.points.some(p=>p.kind==='desk'&&Math.abs(x*step-p.position[0])<.95&&Math.abs(z*step-(p.position[2]-.8))<.52);
  const fringe=[start],came=new Map<string,string|null>([[key(start[0]!,start[1]!),null]]);
  for(let head=0;head<fringe.length&&head<15000;head++) {
    const [x,z]=fringe[head]!;
    if(x===end[0]&&z===end[1])break;
    for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]]) {
      const nx=x!+dx!,nz=z!+dz!,k=key(nx,nz);
      if(Math.abs(nx)>bound||Math.abs(nz)>bound||came.has(k)||blocked(nx,nz))continue;
      came.set(k,key(x!,z!));fringe.push([nx,nz]);
    }
  }
  const out:Vector3Tuple[]=[];
  let cur:string|null=key(end[0]!,end[1]!);
  if(!came.has(cur))return [to];
  while(cur) {const [x,z]=cur.split(',').map(Number);out.unshift([x!*step,0,z!*step]);cur=came.get(cur)??null;}
  out.shift();out.push(to);return out;
}
