import { Html } from "@react-three/drei";
import { useState } from "react";
import type { Vector3Tuple } from "three";
import { useGame } from "../../state/store";

export function Hotspot({
  id,
  position,
  label,
  onClick,
  size = [0.8, 1.2, 0.8],
}: {
  id: string;
  position: Vector3Tuple;
  label: string;
  onClick: (id: string) => void;
  size?: Vector3Tuple;
}) {
  const [hover, setHover] = useState(false);
  const selected = useGame((s) => s.selectedObject === id);
  const show = hover || selected;
  return (
    <group
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick(id);
      }}
    >
      <mesh>
        <boxGeometry args={size} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {show ? (
        <>
          <mesh>
            <boxGeometry args={size} />
            <meshBasicMaterial color="#c4622d" wireframe transparent opacity={0.55} />
          </mesh>
          <Html position={[0, size[1] * 0.55, 0]} center distanceFactor={12} occlude>
            <div className="pointer-events-none rounded-sm border border-[#cfc5b6] bg-[#efe8dc] px-2 py-0.5 font-ui text-[11px] text-[#1b2230]">
              {label}
            </div>
          </Html>
        </>
      ) : null}
    </group>
  );
}
