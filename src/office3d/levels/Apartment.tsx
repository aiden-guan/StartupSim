import type { ThreeEvent } from "@react-three/fiber";
import { PerkDecor } from "../PerkDecor";
import { Hotspot } from "../Hotspot";

function Desk({ position, color = "#c4a574" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.06, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[-0.6, 0.36, 0.28]}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        <meshStandardMaterial color="#6b5344" />
      </mesh>
      <mesh position={[0.6, 0.36, 0.28]}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        <meshStandardMaterial color="#6b5344" />
      </mesh>
      <mesh position={[-0.6, 0.36, -0.28]}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        <meshStandardMaterial color="#6b5344" />
      </mesh>
      <mesh position={[0.6, 0.36, -0.28]}>
        <boxGeometry args={[0.08, 0.72, 0.08]} />
        <meshStandardMaterial color="#6b5344" />
      </mesh>
      <mesh position={[0.15, 0.86, -0.05]}>
        <boxGeometry args={[0.42, 0.28, 0.32]} />
        <meshStandardMaterial color="#d8d3c8" />
      </mesh>
      <mesh position={[0.15, 0.86, -0.22]}>
        <boxGeometry args={[0.4, 0.26, 0.02]} />
        <meshStandardMaterial color="#243044" emissive="#1f6b4a" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

export function Apartment({
  onObject,
  perks = [],
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number }[];
}) {
  const stop = (e: ThreeEvent<MouseEvent>) => e.stopPropagation();
  return (
    <group onClick={stop}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 10]} />
        <meshStandardMaterial color="#d9cbb6" />
      </mesh>
      <mesh position={[0, 1.6, -4.9]} receiveShadow>
        <boxGeometry args={[12, 3.2, 0.2]} />
        <meshStandardMaterial color="#efe6d6" />
      </mesh>
      <mesh position={[-5.9, 1.6, 0]} receiveShadow>
        <boxGeometry args={[0.2, 3.2, 10]} />
        <meshStandardMaterial color="#e7dcc8" />
      </mesh>
      <mesh position={[5.9, 1.6, 0]}>
        <boxGeometry args={[0.2, 3.2, 10]} />
        <meshStandardMaterial color="#e7dcc8" />
      </mesh>
      <mesh position={[3.2, 1.7, -4.78]}>
        <boxGeometry args={[1.6, 1.2, 0.08]} />
        <meshStandardMaterial color="#9ec5d8" transparent opacity={0.45} />
      </mesh>
      <Desk position={[-2.4, 0, -1.6]} />
      <Desk position={[1.9, 0, -1.7]} color="#b08968" />
      <mesh position={[-0.2, 1.35, 3.6]}>
        <boxGeometry args={[2.2, 1.4, 0.08]} />
        <meshStandardMaterial color="#f4f0e6" />
      </mesh>
      <mesh position={[3.4, 0.9, 1.6]}>
        <cylinderGeometry args={[0.18, 0.22, 0.35, 10]} />
        <meshStandardMaterial color="#3b2a22" />
      </mesh>
      <mesh position={[-4.6, 0.2, 2.8]}>
        <boxGeometry args={[1.1, 0.4, 0.8]} />
        <meshStandardMaterial color="#cfc1a8" />
      </mesh>
      <mesh position={[-4.2, 0.55, 3.1]}>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <meshStandardMaterial color="#8a6a4b" />
      </mesh>
      <mesh position={[4.6, 0.35, -3.2]}>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        <meshStandardMaterial color="#2f5d45" />
      </mesh>
      <mesh position={[0.3, 0.02, 0.6]}>
        <boxGeometry args={[2.2, 0.04, 1.4]} />
        <meshStandardMaterial color="#8f3d2c" />
      </mesh>
      <mesh position={[-3.6, 0.55, -3.4]}>
        <boxGeometry args={[0.7, 1.1, 0.35]} />
        <meshStandardMaterial color="#5b4636" />
      </mesh>
      <Hotspot position={[3.4, 1.1, 1.6]} label="Coffee" onClick={() => onObject("coffee")} />
      <Hotspot position={[-0.2, 2.1, 3.6]} label="Whiteboard" onClick={() => onObject("board")} />
      <Hotspot position={[4.8, 1.2, -3]} label="Plant" onClick={() => onObject("plant")} />
      <PerkDecor perks={perks} />
    </group>
  );
}
