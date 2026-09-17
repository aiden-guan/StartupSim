import type { PerkState } from "../simulation/types";

export function PerkDecor({ perks }: { perks: PerkState[] }) {
  const has = (id: string, min = 0) => (perks.find((p) => p.id === id)?.level ?? -1) >= min;
  return (
    <group>
      {has("coffee") ? (
        <mesh position={[3.55, 1.05, 1.6]}>
          <boxGeometry args={[0.35, 0.4, 0.28]} />
          <meshStandardMaterial color="#3a2a22" />
        </mesh>
      ) : null}
      {has("play") ? (
        <mesh position={[-1.6, 0.75, 1.2]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[0.9, 0.08, 0.5]} />
          <meshStandardMaterial color="#1f6b4a" />
        </mesh>
      ) : null}
      {has("life") ? (
        <mesh position={[2.2, 0.25, 2.4]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>
      ) : null}
      {has("food") ? (
        <mesh position={[4.6, 0.7, 1.4]}>
          <boxGeometry args={[0.7, 1.2, 0.5]} />
          <meshStandardMaterial color="#d8d3c8" />
        </mesh>
      ) : null}
      {has("desks") ? (
        <mesh position={[-2.4, 1.15, -1.6]}>
          <boxGeometry args={[0.3, 0.06, 0.3]} />
          <meshStandardMaterial color="#efe8dc" />
        </mesh>
      ) : null}
    </group>
  );
}
