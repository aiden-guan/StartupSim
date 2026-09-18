import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Character, type CharacterActivity } from '../characters/Character';
import { useGame } from '../../state/store';
import type { OfficeLayout, ActivityPoint } from './layout';
import { OfficeRuntime, chooseSession, isAtActivityPoint, stateForPoint, type AgentState } from './behavior';
import { route } from './path';
import type { AgentView } from '../selectWorldView';

const ANIMATION:Record<AgentState,CharacterActivity>={SPAWNING:'walking',WALKING_TO_ACTIVITY:'walking',WORKING:'working',WHITEBOARD:'whiteboard',MEETING:'meeting',COFFEE:'coffee',IDLE:'idle',CHATTING:'talking',BURNED_OUT:'tired',CELEBRATING:'celebrate',DEPARTING:'walking'};
export function EmployeeAgent({agent,layout,reducedMotion,onSelect,runtime}:{agent:AgentView;layout:OfficeLayout;reducedMotion:boolean;onSelect:(id:string)=>void;runtime:OfficeRuntime}) {
  const selected=useGame(s=>s.selectedEmployeeId===agent.id);
  const ref=useRef<THREE.Group>(null);
  const home=useRef(runtime.home(agent.id));
  const point=useRef<ActivityPoint>(home.current);
  const spawn=agent.role==='employee'||agent.role==='robot'?layout.points.find(p=>p.kind==='entrance')??home.current:home.current;
  const start=useRef([...spawn.position] as THREE.Vector3Tuple);
  const path=useRef<THREE.Vector3Tuple[]>([]);
  const counter=useRef(0),remaining=useRef(0),elapsed=useRef(0),priorTask=useRef(agent.taskType),celebrating=useRef(0);
  const [behavior,setBehavior]=useState<AgentState>('SPAWNING');
  const state=useRef<AgentState>('SPAWNING');
  const setState=(s:AgentState)=>{if(state.current!==s){state.current=s;setBehavior(s);}};
  function moveTo(next:ActivityPoint) {
    const current=ref.current?.position.toArray()??start.current;
    const nextPath=route(current,next.position,layout);
    // A failed route returns the current position. Staying put is safer than
    // allowing a character to cut through a prop as a direct fallback.
    if(nextPath.length===1&&Math.hypot(next.position[0]-current[0],next.position[2]-current[2])>.2)return false;
    if(!runtime.claim(agent.id,next))return false;
    point.current=next;
    path.current=nextPath;
    setState('WALKING_TO_ACTIVITY');return true;
  }
  function plan(first=false) {
    const firstProduct=!useGame.getState().game?.company.seenMarket;
    const session=chooseSession(runtime.seed,agent.id,counter.current++,agent.taskType,agent.burnoutDays>0,firstProduct);
    const kind=(first&&agent.taskType&&agent.burnoutDays<=0)||(firstProduct&&useGame.getState().game?.clock.paused)?'desk':session.kind;
    remaining.current=session.seconds;
    const pool=kind==='desk'?[home.current]:layout.points.filter(p=>p.kind===kind);
    const choices=[...pool,...(agent.taskType?[home.current]:layout.points.filter(p=>p.kind==='idle'))];
    for(const p of choices)if(moveTo(p))return;
    // Stay at the current point when every suitable object is occupied.
    setState(stateForPoint(point.current.kind,agent.burnoutDays>0));
  }
  useEffect(()=>{
    runtime.cancelChat(agent.id);
    if(priorTask.current==='product'&&!agent.taskType&&useGame.getState().game?.products.some(p=>p.status==='ready')) {celebrating.current=3;setState('CELEBRATING');}
    else plan(true);
    priorTask.current=agent.taskType;
  },[agent.taskType,agent.burnoutDays]);
  useEffect(()=>()=>runtime.release(agent.id),[runtime,agent.id]);
  useFrame((_,rawDt)=>{
    const g=ref.current;if(!g)return;
    const dt=Math.min(rawDt,.08),game=useGame.getState().game;
    runtime.positions.set(agent.id,g.position.toArray());
    elapsed.current+=dt;
    if(celebrating.current>0) {celebrating.current-=dt;if(celebrating.current<=0)plan();return;}
    // Walking to newly assigned work is visual acknowledgement, even while company time is paused.
    if(path.current.length) {
      const dest=new THREE.Vector3(...path.current[0]!);const dir=dest.sub(g.position);dir.y=0;
      const distance=dir.length();const amount=(agent.burnoutDays>0?.65:1.25)*dt;
      if(distance<=amount+.015){g.position.set(...path.current.shift()!);}
      else {dir.normalize();g.position.addScaledVector(dir,amount);const yaw=Math.atan2(dir.x,dir.z);g.rotation.y+=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y))*Math.min(1,dt*12);}
      if(!path.current.length)setState(stateForPoint(point.current.kind,agent.burnoutDays>0));
      return;
    }
    let look=point.current.look;
    if(!agent.taskType&&agent.burnoutDays<=0&&point.current.kind==='idle'&&!game?.clock.paused) {
      runtime.idle.add(agent.id);const partner=runtime.chat(agent.id,elapsed.current);
      if(partner&&runtime.positions.has(partner)){look=runtime.positions.get(partner)!;setState('CHATTING');}
      else if(state.current==='CHATTING')setState('IDLE');
    }else {runtime.idle.delete(agent.id);runtime.cancelChat(agent.id);}
    const yaw=Math.atan2(look[0]-g.position.x,look[2]-g.position.z);
    g.rotation.y+=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y))*Math.min(1,dt*6);
    if(game?.clock.paused||state.current==='CHATTING')return;
    remaining.current-=dt*Math.min(1.5,Math.sqrt(game?.clock.speed??1));
    if(remaining.current<=0)plan();
  });
  const settledAtActivity = ref.current
    ? path.current.length === 0 && isAtActivityPoint(ref.current.position.toArray(), point.current)
    : false;
  const atDesk=point.current.kind==='desk'&&behavior==='WORKING'&&settledAtActivity;
  const visualBehavior=behavior==='WORKING'&&!settledAtActivity?'IDLE':behavior;
  return <group ref={ref} position={start.current} onClick={e=>{e.stopPropagation();onSelect(agent.id);}}>
    <Character look={agent.look} activity={reducedMotion?'idle':ANIMATION[visualBehavior]} exhausted={agent.burnoutDays>0} robot={agent.role==='robot'} seated={atDesk}/>
    {selected&&<mesh position={[0,.015,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.31,.38,24]}/><meshBasicMaterial color="#e59154"/></mesh>}
    {(selected||agent.burnoutDays>0)&&<Html position={[0,1.8,0]} center distanceFactor={10} occlude><div className="agent-label">{agent.name.split(' ')[0]} · {agent.burnoutDays?'Resting':behavior==='WORKING'?agent.taskType:behavior.toLowerCase().replaceAll('_',' ')}</div></Html>}
  </group>;
}
export function DepartingAgent({id,look,robot,layout,runtime}:{id:string;look:AgentView['look'];robot:boolean;layout:OfficeLayout;runtime:OfficeRuntime}) {
  const ref=useRef<THREE.Group>(null),start=useRef(runtime.positions.get(id)??runtime.lastPositions.get(id)??layout.hub);
  const exit=layout.points.find(p=>p.kind==='entrance')!;
  const path=useRef(route(start.current,exit.position,layout));
  useFrame((_,dt)=>{
    const g=ref.current;if(!g)return;
    if(!path.current.length){runtime.release(id);runtime.homes.delete(id);runtime.lastPositions.delete(id);useGame.getState().clearDeparture(id);return;}
    const dir=new THREE.Vector3(...path.current[0]!).sub(g.position),distance=dir.length(),amount=Math.min(dt,.08)*1.5;
    if(distance<=amount+.02)g.position.set(...path.current.shift()!);
    else {dir.normalize();g.position.addScaledVector(dir,amount);g.rotation.y=Math.atan2(dir.x,dir.z);}
  });
  return <group ref={ref} position={start.current}><Character look={look} activity="walking" robot={robot}/></group>;
}
