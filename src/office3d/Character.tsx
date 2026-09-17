import { useMemo } from "react";
import type { CharacterLook } from "../simulation/types";

export function CharacterMesh({ look, exhausted = false, robot = false }: { look: CharacterLook; exhausted?: boolean; robot?: boolean }) {
  const scale = look.body === "slim" ? 0.9 : look.body === "broad" ? 1.12 : 1;
  const dim = exhausted ? 0.55 : 1;
  const hairY = look.hairStyle === "bun" ? 1.55 : 1.42;
  const hair = useMemo(() => {
    if (look.hairStyle === "shaved") return null;
    if (look.hairStyle === "long") return <mesh position={[0, 1.28, -0.05]}><boxGeometry args={[0.42, 0.42, 0.28]} /><meshStandardMaterial color={look.hair} /></mesh>;
    if (look.hairStyle === "bun") return (
      <group>
        <mesh position={[0, 1.42, 0]}><sphereGeometry args={[0.22, 8, 8]} /><meshStandardMaterial color={look.hair} /></mesh>
        <mesh position={[0, 1.62, -0.02]}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color={look.hair} /></mesh>
      </group>
    );
    if (look.hairStyle === "fade") return <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[0.16, 0.2, 0.16, 8]} /><meshStandardMaterial color={look.hair} /></mesh>;
    return <mesh position={[0, 1.4, 0]}><boxGeometry args={[0.38, 0.16, 0.34]} /><meshStandardMaterial color={look.hair} /></mesh>;
  }, [look.hair, look.hairStyle]);

  if (robot) {
    return (
      <group scale={[scale, 1, scale]}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.42, 0.7, 0.28]} />
          <meshStandardMaterial color="#6d7788" metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.12, 0]}>
          <boxGeometry args={[0.28, 0.22, 0.24]} />
          <meshStandardMaterial color="#1b2433" emissive="#1f6b4a" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 1.28, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>
      </group>
    );
  }

  return (
    <group scale={[scale, 1, scale]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.55, 4, 8]} />
        <meshStandardMaterial color={look.top} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.22, 10, 10]} />
        <meshStandardMaterial color={look.skin} roughness={0.55} />
      </mesh>
      <group scale={[dim, dim, dim]}>{hair}</group>
      {look.hairStyle !== "shaved" && look.hairStyle !== "bun" && look.hairStyle !== "long" && look.hairStyle !== "fade" ? (
        <mesh position={[0, hairY, 0]}>
          <boxGeometry args={[0.36, 0.12, 0.32]} />
          <meshStandardMaterial color={look.hair} />
        </mesh>
      ) : null}
      <mesh position={[-0.22, 0.7, 0]}>
        <capsuleGeometry args={[0.05, 0.32, 3, 6]} />
        <meshStandardMaterial color={look.top} />
      </mesh>
      <mesh position={[0.22, 0.7, 0]}>
        <capsuleGeometry args={[0.05, 0.32, 3, 6]} />
        <meshStandardMaterial color={look.top} />
      </mesh>
      <mesh position={[-0.08, 0.18, 0]}>
        <capsuleGeometry args={[0.06, 0.28, 3, 6]} />
        <meshStandardMaterial color={look.pants} />
      </mesh>
      <mesh position={[0.08, 0.18, 0]}>
        <capsuleGeometry args={[0.06, 0.28, 3, 6]} />
        <meshStandardMaterial color={look.pants} />
      </mesh>
      <mesh position={[-0.08, 0.02, 0.04]}>
        <boxGeometry args={[0.1, 0.05, 0.16]} />
        <meshStandardMaterial color={look.shoes} />
      </mesh>
      <mesh position={[0.08, 0.02, 0.04]}>
        <boxGeometry args={[0.1, 0.05, 0.16]} />
        <meshStandardMaterial color={look.shoes} />
      </mesh>
      {look.glasses ? (
        <mesh position={[0, 1.2, 0.18]}>
          <boxGeometry args={[0.28, 0.06, 0.04]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ) : null}
      {look.accessory === "headphones" ? (
        <mesh position={[0, 1.32, 0]}>
          <torusGeometry args={[0.22, 0.03, 6, 12]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ) : null}
      {look.accessory === "badge" ? (
        <mesh position={[0.14, 0.72, 0.16]}>
          <boxGeometry args={[0.08, 0.1, 0.02]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>
      ) : null}
      {look.accessory === "scarf" ? (
        <mesh position={[0, 0.96, 0.08]}>
          <boxGeometry args={[0.22, 0.08, 0.12]} />
          <meshStandardMaterial color="#8a3b2f" />
        </mesh>
      ) : null}
    </group>
  );
}
