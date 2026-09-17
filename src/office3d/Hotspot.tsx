import { Html } from "@react-three/drei";
import type { Vector3Tuple } from "three";

export function Hotspot({
  position,
  label,
  onClick,
}: {
  position: Vector3Tuple;
  label: string;
  onClick: () => void;
}) {
  return (
    <group position={position} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <Html position={[0, 0.4, 0]} center distanceFactor={10}>
        <button
          type="button"
          className="rounded-full border border-[#cfc5b6] bg-[#efe8dc]/90 px-2 py-0.5 font-mono text-[10px] text-[#1b2230]"
        >
          {label}
        </button>
      </Html>
    </group>
  );
}
