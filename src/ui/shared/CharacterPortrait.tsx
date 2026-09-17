import { Canvas } from "@react-three/fiber";
import { Character } from "../../game3d/characters/Character";
import type { CharacterLook } from "../../simulation/types";

export function CharacterPortrait({ look, robot = false, className = "" }: { look: CharacterLook; robot?: boolean; className?: string }) {
  return (
    <div className={`overflow-hidden bg-[#cbb59a] ${className}`}>
      <Canvas camera={{ position: [0.15, 1.35, 2.1], fov: 28 }} gl={{ antialias: true }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[2, 4, 3]} intensity={1.1} />
        <group position={[0, -0.05, 0]}>
          <Character look={look} activity="idle" robot={robot} preview />
        </group>
      </Canvas>
    </div>
  );
}
