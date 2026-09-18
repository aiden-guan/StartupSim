import type { Vector3Tuple } from 'three';
import type { OfficeLayout } from './layout';
import { navigationObstacles, pointInsideObstacle } from './obstacles';
import { officeScale } from '../environment/officeScale';
/** Grid paths skirt worktops. The path is computed once per activity, never rerolled per frame. */
export function route(from:Vector3Tuple,to:Vector3Tuple,layout:OfficeLayout):Vector3Tuple[] {
  const step=.6,key=(x:number,z:number)=>`${x},${z}`;
  const start=[Math.round(from[0]/step),Math.round(from[2]/step)],end=[Math.round(to[0]/step),Math.round(to[2]/step)];
  if (from[0]===to[0]&&from[2]===to[2]) return [to];
  const {width,depth}=officeScale(layout.level);
  const boundX=Math.floor((width/2-.42)/step),boundZ=Math.floor((depth/2-.42)/step);
  const obstacles=navigationObstacles(layout);
  const blocked=(x:number,z:number)=>{
    if(x===end[0]&&z===end[1])return false;
    if(x===start[0]&&z===start[1])return false;
    const px=x*step,pz=z*step;
    return obstacles.some(item=>pointInsideObstacle(px,pz,item,.3));
  };
  const fringe=[start],came=new Map<string,string|null>([[key(start[0]!,start[1]!),null]]);
  const costs=new Map<string,number>([[key(start[0]!,start[1]!),0]]);
  for(let visits=0;fringe.length&&visits<25000;visits++) {
    let best=0,score=Infinity;
    for(let i=0;i<fringe.length;i++) {
      const [fx,fz]=fringe[i]!,candidate=(costs.get(key(fx!,fz!))??Infinity)+Math.abs(fx!-end[0]!)+Math.abs(fz!-end[1]!);
      if(candidate<score){score=candidate;best=i;}
    }
    const [x,z]=fringe.splice(best,1)[0]!;
    if(x===end[0]&&z===end[1])break;
    for(const [dx,dz] of [[1,0],[0,1],[-1,0],[0,-1]]) {
      const nx=x!+dx!,nz=z!+dz!,k=key(nx,nz);
      if(Math.abs(nx)>boundX||Math.abs(nz)>boundZ||came.has(k)||blocked(nx,nz))continue;
      came.set(k,key(x!,z!));costs.set(k,(costs.get(key(x!,z!))??0)+1);fringe.push([nx,nz]);
    }
  }
  const out:Vector3Tuple[]=[];
  let cur:string|null=key(end[0]!,end[1]!);
  if(!came.has(cur))return [from];
  while(cur) {const [x,z]=cur.split(',').map(Number);out.unshift([x!*step,0,z!*step]);cur=came.get(cur)??null;}
  // The destination grid cell is only a search anchor. Drop it before adding
  // the real activity point so agents do not take an extra step through an
  // inflated collision volume near a prop.
  out.shift();out.pop();out.push(to);return out;
}
