import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import { Character, type CharacterActivity } from "../characters/Character";
import { useGame } from "../../state/store";
import { ACTIVITY_WEIGHTS, homeDeskFor, type ActivityPoint, type OfficeLayout, type PointKind } from "./layout";
import { claimPoint, releasePoint } from "./occupancy";
import type { AgentView } from "../selectWorldView";

function pickKind(weights: Partial<Record<PointKind, number>>): PointKind {
  const entries = Object.entries(weights) as [PointKind, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [k, w] of entries) {
    roll -= w;
    if (roll <= 0) return k;
  }
  return entries[0]?.[0] ?? "idle";
}

function activityFor(kind: PointKind, walking: boolean, burnout: boolean): CharacterActivity {
  if (walking) return burnout ? "tired" : "walking";
  if (burnout) return "tired";
  if (kind === "desk") return "working";
  if (kind === "board" || kind === "meet") return "talking";
  if (kind === "coffee") return "coffee";
  return "idle";
}

export function EmployeeAgent({
  agent,
  layout,
  index,
  reducedMotion,
  onSelect,
}: {
  agent: AgentView;
  layout: OfficeLayout;
  index: number;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
}) {
  const selected = useGame((s) => s.selectedEmployeeId === agent.id);
  const ref = useRef<Group>(null);
  const home = useMemo(() => homeDeskFor(index, layout), [index, layout]);
  const [point, setPoint] = useState<ActivityPoint>(home);
  const [arrived, setArrived] = useState(false);
  const spawn = layout.points.find((p) => p.kind === "entrance") ?? home;
  const start = useRef(new THREE.Vector3(...(agent.role === "employee" ? spawn.position : home.position)));
  const dest = useRef(new THREE.Vector3(...home.position));
  const speed = agent.burnoutDays > 0 ? 0.7 : 1.45;

  useEffect(() => {
    return () => releasePoint(agent.id);
  }, [agent.id]);

  useEffect(() => {
    const weights =
      agent.burnoutDays > 0
        ? ACTIVITY_WEIGHTS.burnout
        : agent.taskType
          ? ACTIVITY_WEIGHTS[agent.taskType] ?? ACTIVITY_WEIGHTS.idle
          : ACTIVITY_WEIGHTS.idle;
    const kind = pickKind(weights ?? ACTIVITY_WEIGHTS.idle);
    const candidates = layout.points.filter((p) => p.kind === kind);
    const pool = candidates.length ? candidates : layout.points.filter((p) => p.kind === "idle" || p.kind === "desk");
    const next =
      kind === "desk"
        ? home
        : pool.find((p) => claimPoint(p.id, agent.id, p.capacity)) ?? home;
    claimPoint(next.id, agent.id, next.capacity);
    setPoint(next);
    dest.current.set(...next.position);
    setArrived(false);
  }, [agent.taskType, agent.burnoutDays, agent.id, home, layout]);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = dest.current;
    const dist = g.position.distanceTo(target);
    if (dist < 0.12) {
      if (!arrived) setArrived(true);
      const look = new THREE.Vector3(...point.look);
      const dir = look.sub(g.position);
      dir.y = 0;
      if (dir.lengthSq() > 0.01) {
        const yaw = Math.atan2(dir.x, dir.z);
        g.rotation.y += (yaw - g.rotation.y) * Math.min(1, dt * 6);
      }
      if (Math.random() < dt * 0.08) {
        const weights =
          agent.burnoutDays > 0
            ? ACTIVITY_WEIGHTS.burnout
            : agent.taskType
              ? ACTIVITY_WEIGHTS[agent.taskType] ?? ACTIVITY_WEIGHTS.idle
              : ACTIVITY_WEIGHTS.idle;
        const kind = pickKind(weights ?? ACTIVITY_WEIGHTS.idle);
        const candidates = layout.points.filter((p) => p.kind === kind);
        const next = (kind === "desk" ? home : candidates.find((p) => claimPoint(p.id, agent.id, p.capacity))) ?? point;
        if (next.id !== point.id) {
          claimPoint(next.id, agent.id, next.capacity);
          setPoint(next);
          dest.current.set(...next.position);
          setArrived(false);
        }
      }
      return;
    }
    const hub = new THREE.Vector3(...layout.hub);
    const viaHub = g.position.distanceTo(target) > 3.2 && g.position.distanceTo(hub) > 0.6 && hub.distanceTo(target) > 0.6;
    const aim = viaHub ? hub : target;
    const dir = aim.clone().sub(g.position);
    dir.y = 0;
    dir.normalize();
    g.position.addScaledVector(dir, speed * dt);
    g.position.y = 0;
    g.rotation.y = Math.atan2(dir.x, dir.z);
  });

  const walking = !arrived;
  const activity = reducedMotion ? "idle" : activityFor(point.kind, walking, agent.burnoutDays > 0);

  return (
    <group
      ref={ref}
      position={start.current.toArray()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(agent.id);
      }}
    >
      <Character look={agent.look} activity={activity} exhausted={agent.burnoutDays > 0} robot={agent.role === "robot"} />
      {selected ? (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.4, 24]} />
          <meshBasicMaterial color="#c4622d" transparent opacity={0.85} />
        </mesh>
      ) : null}
      {agent.burnoutDays > 0 ? (
        <Html position={[0, 2.05, 0]} center distanceFactor={10}>
          <div className="rounded-sm bg-[#1b2433]/80 px-1.5 py-0.5 font-mono text-[9px] text-[#e07a7a]">tired</div>
        </Html>
      ) : null}
    </group>
  );
}

export function DepartingAgent({
  id,
  look,
  robot,
  layout,
}: {
  id: string;
  look: AgentView["look"];
  robot: boolean;
  layout: OfficeLayout;
}) {
  const clear = useGame((s) => s.clearDeparture);
  const ref = useRef<Group>(null);
  const exit = layout.points.find((p) => p.kind === "entrance") ?? layout.points[0]!;
  const target = useRef(new THREE.Vector3(...exit.position));

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const dir = target.current.clone().sub(g.position);
    dir.y = 0;
    if (dir.length() < 0.15) {
      clear(id);
      return;
    }
    dir.normalize();
    g.position.addScaledVector(dir, 1.8 * dt);
    g.rotation.y = Math.atan2(dir.x, dir.z);
  });

  return (
    <group ref={ref} position={layout.hub}>
      <Character look={look} activity="walking" robot={robot} />
    </group>
  );
}
