import type { ReactNode } from "react";
import type { MeshStandardMaterialParameters } from "three";
import { mats } from "../materials/library";

function M(props: MeshStandardMaterialParameters & { children?: ReactNode }) {
  return <meshStandardMaterial {...props} />;
}

export function Desk({
  position,
  color = "#c4a574",
  standing = false,
}: {
  position: [number, number, number];
  color?: string;
  standing?: boolean;
}) {
  const h = standing ? 0.92 : 0.72;
  return (
    <group position={position}>
      <mesh position={[0, h, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.46, 0.05, 0.72]} />
        <M color={color} roughness={0.62} />
      </mesh>
      {([-0.64, 0.64] as const).map((x) =>
        ([-0.28, 0.28] as const).map((z) => (
          <mesh key={`${x}${z}`} position={[x, h / 2, z]}>
            <boxGeometry args={[0.07, h, 0.07]} />
            <M {...mats.woodDark} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Chair({ position, rotation = 0, color = "#3d4a63" }: { position: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[0.38, 0.06, 0.38]} />
        <M color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.52, -0.16]}>
        <boxGeometry args={[0.38, 0.36, 0.06]} />
        <M color={color} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.24, 8]} />
        <M {...mats.metal} />
      </mesh>
    </group>
  );
}

export function Laptop({ position, color = "#d8d3c8", open = true }: { position: [number, number, number]; color?: string; open?: boolean }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.38, 0.02, 0.26]} />
        <M color={color} roughness={0.4} metalness={0.2} />
      </mesh>
      {open ? (
        <mesh position={[0, 0.12, -0.12]} rotation={[Math.PI / 2.4, 0, 0]}>
          <boxGeometry args={[0.38, 0.24, 0.02]} />
          <M {...mats.screen} />
        </mesh>
      ) : null}
    </group>
  );
}

export function Monitor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.52, 0.34, 0.04]} />
        <M {...mats.screen} />
      </mesh>
      <mesh position={[0, -0.22, 0.02]}>
        <cylinderGeometry args={[0.03, 0.05, 0.12, 8]} />
        <M {...mats.plasticDark} />
      </mesh>
    </group>
  );
}

export function Keyboard({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.36, 0.02, 0.12]} />
      <M color="#2a2a32" roughness={0.7} />
    </mesh>
  );
}

export function Mug({ position, color = "#efe8dc" }: { position: [number, number, number]; color?: string }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.035, 0.03, 0.07, 10]} />
      <M color={color} roughness={0.55} />
    </mesh>
  );
}

export function BookStack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.16, 0.03, 0.22]} />
        <M color="#2b3a55" />
      </mesh>
      <mesh position={[0.01, 0.055, 0]}>
        <boxGeometry args={[0.15, 0.03, 0.2]} />
        <M color="#8a3b2f" />
      </mesh>
      <mesh position={[-0.01, 0.09, 0]}>
        <boxGeometry args={[0.16, 0.03, 0.21]} />
        <M color="#1f6b4a" />
      </mesh>
    </group>
  );
}

export function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <cylinderGeometry args={[0.1, 0.12, 0.16, 10]} />
        <M color="#8a6a4b" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.16, 10, 8]} />
        <M {...mats.plant} />
      </mesh>
    </group>
  );
}

export function Couch({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.7, 0.28, 0.7]} />
        <M {...mats.fabric} />
      </mesh>
      <mesh position={[0, 0.48, -0.28]}>
        <boxGeometry args={[1.7, 0.36, 0.16]} />
        <M {...mats.fabric} />
      </mesh>
      <mesh position={[-0.78, 0.4, 0]}>
        <boxGeometry args={[0.14, 0.28, 0.7]} />
        <M {...mats.fabric} />
      </mesh>
      <mesh position={[0.78, 0.4, 0]}>
        <boxGeometry args={[0.14, 0.28, 0.7]} />
        <M {...mats.fabric} />
      </mesh>
    </group>
  );
}

export function Fridge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.55, 1.35, 0.5]} />
        <M color="#d9d0c2" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0.24, 0.2, 0.16]}>
        <boxGeometry args={[0.04, 0.28, 0.04]} />
        <M {...mats.metal} />
      </mesh>
    </group>
  );
}

export function Whiteboard({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[2.2, 1.35, 0.06]} />
        <M {...mats.paper} />
      </mesh>
      <mesh position={[-0.4, 0.2, 0.04]} rotation={[0, 0, 0.2]}>
        <boxGeometry args={[0.7, 0.02, 0.01]} />
        <M color="#c4622d" />
      </mesh>
      <mesh position={[0.3, -0.1, 0.04]}>
        <boxGeometry args={[0.5, 0.02, 0.01]} />
        <M color="#2b3a55" />
      </mesh>
    </group>
  );
}

export function ServerRack({ position, load = 0.3 }: { position: [number, number, number]; load?: number }) {
  const heat = load > 0.8 ? "#9b2f2f" : load > 0.5 ? "#c9a227" : "#1f6b4a";
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.7, 1.7, 0.5]} />
        <M color="#2a3140" roughness={0.4} metalness={0.35} />
      </mesh>
      {[0.4, 0.1, -0.2, -0.5].map((y) => (
        <mesh key={y} position={[0, y, 0.26]}>
          <boxGeometry args={[0.5, 0.08, 0.02]} />
          <meshStandardMaterial color="#111" emissive={heat} emissiveIntensity={0.4 + load} />
        </mesh>
      ))}
    </group>
  );
}

export function PizzaBox({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} rotation={[0, 0.3, 0]}>
      <boxGeometry args={[0.42, 0.04, 0.42]} />
      <M color="#d8c39a" roughness={0.9} />
    </mesh>
  );
}

export function CardboardBox({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <boxGeometry args={[0.4, 0.32, 0.32]} />
      <M color="#c4a574" roughness={0.9} />
    </mesh>
  );
}

export function Rug({ position, color = "#8f3d2c" }: { position: [number, number, number]; color?: string }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[2.4, 1.6]} />
      <M color={color} roughness={0.95} />
    </mesh>
  );
}

export function BrandSign({
  position,
  color,
  mark = "wordmark",
  width = 1.8,
}: {
  position: [number, number, number];
  color: string;
  mark?: string;
  width?: number;
}) {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[width, 0.42, 0.06]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      {mark === "circle" ? (
        <mesh position={[0, 0, 0.04]}>
          <circleGeometry args={[0.12, 16]} />
          <meshStandardMaterial color="#efe8dc" />
        </mesh>
      ) : null}
      {mark === "bars" ? (
        <group position={[0, 0, 0.04]}>
          {[-0.16, 0, 0.16].map((x) => (
            <mesh key={x} position={[x, 0, 0]}>
              <boxGeometry args={[0.08, 0.22, 0.02]} />
              <meshStandardMaterial color="#efe8dc" />
            </mesh>
          ))}
        </group>
      ) : null}
      {mark === "spark" ? (
        <mesh position={[0, 0, 0.04]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.16, 0.16, 0.02]} />
          <meshStandardMaterial color="#efe8dc" />
        </mesh>
      ) : null}
    </group>
  );
}

export function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.08, 0.7, 8]} />
        <M {...mats.metal} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <coneGeometry args={[0.16, 0.18, 12]} />
        <M color="#efe8dc" emissive="#ffd9a8" emissiveIntensity={0.35} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} intensity={0.55} distance={5} color="#ffd9a8" />
    </group>
  );
}
