import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";
import * as THREE from "three";
import type { Employee, GameState } from "../simulation/types";
import { CharacterMesh } from "./Character";
import { waypointsFor, type Waypoint } from "./waypoints";

export function EmployeeAgent({
  employee,
  game,
  onSelect,
}: {
  employee: Employee;
  game: GameState;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<Group>(null);
  const waypoints = waypointsFor(game.company.officeLevel);
  const [target, setTarget] = useState<Waypoint>(() => waypoints[0]!);
  const [bob, setBob] = useState(0);
  const speed = employee.burnoutDays > 0 ? 0.6 : 1.4;
  const task = game.tasks.find((t) => t.id === employee.taskId);

  const preferred = useMemo(() => {
    if (employee.burnoutDays > 0) return waypoints.filter((w) => w.kind === "idle" || w.kind === "coffee");
    if (task?.type === "research") return waypoints.filter((w) => w.kind === "lab" || w.kind === "board" || w.kind === "desk");
    if (task?.type === "product") return waypoints.filter((w) => w.kind === "desk" || w.kind === "board");
    if (task?.type === "promo") return waypoints.filter((w) => w.kind === "meet" || w.kind === "idle");
    if (!task) return waypoints.filter((w) => w.kind === "coffee" || w.kind === "idle");
    return waypoints;
  }, [employee.burnoutDays, task?.type, waypoints]);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const pool = preferred.length ? preferred : waypoints;
    const dest = new THREE.Vector3(...target.position);
    dest.y = 0;
    const pos = g.position;
    const dist = pos.distanceTo(dest);
    if (dist < 0.12) {
      setBob((b) => b + dt * 6);
      g.position.y = employee.taskId && target.kind === "desk" ? 0.03 * Math.sin(bob) : 0;
      if (Math.random() < dt * 0.15) {
        const next = pool[Math.floor(Math.random() * pool.length)] ?? waypoints[0]!;
        setTarget(next);
      }
      return;
    }
    const dir = dest.clone().sub(pos);
    dir.y = 0;
    dir.normalize();
    pos.addScaledVector(dir, speed * dt);
    g.lookAt(pos.x + dir.x, pos.y, pos.z + dir.z);
    g.position.y = 0.05 * Math.sin(performance.now() / 90);
  });

  if (employee.remote || employee.role === "ai") return null;

  return (
    <group
      ref={ref}
      position={target.position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(employee.id);
      }}
    >
      <CharacterMesh look={employee.look} exhausted={employee.burnoutDays > 0} robot={employee.role === "robot"} />
      <Html position={[0, 2.05, 0]} center distanceFactor={8} occlude={false}>
        <div className="pointer-events-none rounded bg-[#1b2433]/80 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-[#efe8dc]">
          {employee.name.split(" ")[0]}
          {employee.burnoutDays > 0 ? " · out" : task ? " · busy" : " · idle"}
        </div>
      </Html>
    </group>
  );
}
