import { OrbitControls, Html } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { BALANCE } from "../config/balance";
import type { GameState } from "../simulation/types";
import { EmployeeAgent } from "./EmployeeAgent";
import { Apartment } from "./levels/Apartment";
import { Campus, StartupOffice } from "./levels/Offices";

function DeptMarkers({ game }: { game: GameState }) {
  const extras = game.employees.length - Math.min(game.employees.filter((e) => !e.remote && e.role !== "ai").length, BALANCE.RENDER_AGENT_CAP);
  if (extras <= 0 || game.company.officeLevel < 2) return null;
  const labels = [
    { id: "eng", label: `Eng · ${Math.max(4, Math.round(extras * 0.4))}`, pos: [-6, 3.2, -4] as [number, number, number] },
    { id: "lab", label: `Lab · ${Math.max(2, Math.round(extras * 0.25))}`, pos: [8, 3.6, -2] as [number, number, number] },
    { id: "ops", label: `Ops · ${Math.max(2, Math.round(extras * 0.2))}`, pos: [2, 2.4, 5] as [number, number, number] },
  ];
  return (
    <group>
      {labels.map((l) => (
        <Html key={l.id} position={l.pos} center>
          <div className="rounded-sm border border-[#cfc5b6] bg-[#efe8dc]/90 px-2 py-1 font-mono text-[10px] text-[#1b2230]">
            {l.label}
          </div>
        </Html>
      ))}
    </group>
  );
}

export function OfficeCanvas({
  game,
  onEmployee,
  onObject,
}: {
  game: GameState;
  onEmployee: (id: string) => void;
  onObject: (id: string) => void;
}) {
  const level = game.company.officeLevel;
  const humans = game.employees.filter((e) => !e.remote && e.role !== "ai").slice(0, BALANCE.RENDER_AGENT_CAP);
  const scene =
    level <= 0 ? (
      <Apartment onObject={onObject} perks={game.company.perks} />
    ) : level === 1 ? (
      <StartupOffice onObject={onObject} perks={game.company.perks} />
    ) : level === 2 ? (
      <StartupOffice onObject={onObject} perks={game.company.perks} hq />
    ) : (
      <Campus onObject={onObject} perks={game.company.perks} mega={level >= 5} />
    );

  return (
    <div className="absolute inset-0">
    <Canvas shadows camera={{ position: level >= 3 ? [-16, 18, 18] : [-10, 11, 12], fov: 42 }} className="h-full w-full">
      <color attach="background" args={[level >= 3 ? "#c5d0c4" : "#d4cbbd"]} />
      <hemisphereLight args={["#fff6e8", "#8a7a68", 0.7]} />
      <directionalLight position={[8, 14, 6]} intensity={1.15} castShadow shadow-mapSize={1024} />
      <ambientLight intensity={0.25} />
      {scene}
      {humans.map((e) => (
        <EmployeeAgent key={e.id} employee={e} game={game} onSelect={onEmployee} />
      ))}
      <DeptMarkers game={game} />
      <OrbitControls
        makeDefault
        maxPolarAngle={Math.PI / 2.15}
        minDistance={8}
        maxDistance={level >= 3 ? 48 : 32}
        target={[0, 0.4, 0]}
      />
    </Canvas>
    </div>
  );
}
