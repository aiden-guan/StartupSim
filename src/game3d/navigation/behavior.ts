import { Rng } from '../../simulation/rng';
import type { TaskType } from '../../simulation/types';
import { ACTIVITY_WEIGHTS, type ActivityPoint, type OfficeLayout, type PointKind } from './layout';

export type AgentState='SPAWNING'|'WALKING_TO_ACTIVITY'|'WORKING'|'WHITEBOARD'|'MEETING'|'COFFEE'|'IDLE'|'CHATTING'|'BURNED_OUT'|'CELEBRATING'|'DEPARTING';
export function isAtActivityPoint(position:[number,number,number],point:ActivityPoint,tolerance=.12) {
  return Math.hypot(position[0]-point.position[0],position[2]-point.position[2])<=tolerance;
}
export function visualSeed(seed:number,id:string) {let n=seed;for(const c of id)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
export function chooseSession(seed:number,id:string,counter:number,task:TaskType|null,burnout:boolean,firstProduct:boolean):{kind:PointKind;seconds:number} {
  const rng=new Rng(visualSeed(seed,id)^Math.imul(counter+1,2654435761));
  const weights=burnout?ACTIVITY_WEIGHTS.burnout!:firstProduct&&task==='product'?{desk:100}:ACTIVITY_WEIGHTS[task??'idle']!;
  const kind=rng.weighted(Object.entries(weights).map(([item,weight])=>({item:item as PointKind,weight:weight!})));
  return {kind,seconds:kind==='desk'||kind==='lab'?rng.float(24,40):kind==='coffee'?rng.float(10,15):rng.float(14,25)};
}
export function stateForPoint(point:PointKind,burnout:boolean):AgentState {
  if(burnout)return 'BURNED_OUT';
  return point==='desk'||point==='lab'||point==='server'?'WORKING':point==='board'?'WHITEBOARD':point==='meet'?'MEETING':point==='coffee'?'COFFEE':'IDLE';
}
export class OfficeRuntime {
  held=new Map<string,string>();
  homes=new Map<string,string>();
  lastPositions=new Map<string,[number,number,number]>();
  positions=new Map<string,[number,number,number]>();
  idle=new Set<string>();
  conversations=new Map<string,{partner:string;until:number}>();
  cooldown=new Map<string,number>();
  constructor(public layout:OfficeLayout,public seed:number) {}
  home(id:string) {
    const assigned=this.homes.get(id);
    if(assigned)return this.layout.points.find(p=>p.id===assigned)!;
    const used=new Set(this.homes.values());
    const point=this.layout.points.find(p=>p.kind==='desk'&&!used.has(p.id))??this.layout.points.find(p=>p.kind==='idle')!;
    this.homes.set(id,point.id);return point;
  }
  claim(id:string,point:ActivityPoint) {
    if(this.held.get(id)===point.id)return true;
    const count=[...this.held.values()].filter(p=>p===point.id).length;
    if(count>=point.capacity)return false;
    this.held.set(id,point.id);return true; // a single claim per agent; previous point is released atomically
  }
  release(id:string) {const pos=this.positions.get(id);if(pos)this.lastPositions.set(id,pos);this.held.delete(id);this.positions.delete(id);this.idle.delete(id);this.cancelChat(id);}
  cancelChat(id:string) {const chat=this.conversations.get(id);if(chat)this.conversations.delete(chat.partner);this.conversations.delete(id);}
  chat(id:string,now:number) {
    const current=this.conversations.get(id);
    if(current&&now<current.until)return current.partner;
    if(current)this.cancelChat(id);
    if(!this.idle.has(id)||(this.cooldown.get(id)??0)>now)return null;
    const pos=this.positions.get(id);
    if(!pos)return null;
    for(const other of [...this.idle].sort()) {
      const p=this.positions.get(other);
      if(other===id||!p||this.conversations.has(other)||(this.cooldown.get(other)??0)>now)continue;
      const distance=Math.hypot(pos[0]-p[0],pos[2]-p[2]);
      if(distance<.6||distance>1.8)continue;
      const until=now+12;
      this.conversations.set(id,{partner:other,until});this.conversations.set(other,{partner:id,until});
      this.cooldown.set(id,until+25);this.cooldown.set(other,until+25);
      return other;
    }
    return null;
  }
}
