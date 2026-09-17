import { Fridge, Plant } from "./Furniture";

function objectOf(perks: { id: string; level: number; object?: string }[], id: string) {
  const owned = perks.find((p) => p.id === id);
  if (!owned) return null;
  return owned.object ?? id;
}

function hasObject(perks: { id: string; level: number; object?: string }[], object: string) {
  return perks.some((p) => (p.object ?? p.id) === object || p.id === object);
}

export function PerkSet({
  perks,
  level,
}: {
  perks: { id: string; level: number; object?: string }[];
  level: number;
}) {
  const x = level <= 0 ? 0 : level === 1 ? 1.4 : level >= 4 ? 4 : 2.4;
  const z = level >= 3 ? 2 : 0;
  return (
    <group>
      {hasObject(perks, "coffee") || objectOf(perks, "coffee") === "coffee" ? (
        <mesh position={[3.7 + x * 0.1, 0.95, 1.55 + z * 0.1]}>
          <boxGeometry args={[0.28, 0.32, 0.22]} />
          <meshStandardMaterial color="#3a2a22" roughness={0.55} />
        </mesh>
      ) : null}
      {hasObject(perks, "espresso") ? (
        <group position={[3.95 + x * 0.12, 1.05, 1.7]}>
          <mesh>
            <boxGeometry args={[0.42, 0.38, 0.28]} />
            <meshStandardMaterial color="#1b2230" metalness={0.35} roughness={0.4} />
          </mesh>
          <mesh position={[0.16, 0.08, 0.12]}>
            <cylinderGeometry args={[0.03, 0.03, 0.12, 8]} />
            <meshStandardMaterial color="#6d7788" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      ) : null}
      {hasObject(perks, "pingpong") ? (
        <mesh position={[-1.4, 0.55, 1.4 + z]} rotation={[0, 0.4, 0]}>
          <boxGeometry args={[1.1, 0.06, 0.58]} />
          <meshStandardMaterial color="#1f6b4a" />
        </mesh>
      ) : null}
      {hasObject(perks, "arcade") ? (
        <mesh position={[-2.2, 0.7, 2.4 + z]}>
          <boxGeometry args={[0.5, 1.2, 0.36]} />
          <meshStandardMaterial color="#1b2230" emissive="#5b4b8a" emissiveIntensity={0.18} />
        </mesh>
      ) : null}
      {hasObject(perks, "fridge") || hasObject(perks, "kitchen") || hasObject(perks, "food") ? (
        <Fridge position={[5.1 + x * 0.2, 0.68, 1.2 + z * 0.2]} />
      ) : null}
      {hasObject(perks, "dog") ? (
        <mesh position={[2.4, 0.18, 2.6]}>
          <sphereGeometry args={[0.14, 10, 8]} />
          <meshStandardMaterial color="#c4a574" roughness={0.75} />
        </mesh>
      ) : null}
      {hasObject(perks, "nap") || hasObject(perks, "rest") ? (
        <mesh position={[-3.2, 0.45, 3.2 + z * 0.2]} rotation={[0, 0.2, Math.PI / 2]}>
          <capsuleGeometry args={[0.28, 0.55, 6, 10]} />
          <meshStandardMaterial color="#d8d1c4" />
        </mesh>
      ) : null}
      {hasObject(perks, "zen") ? (
        <mesh position={[-4.2, 0.04, 2.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7, 20]} />
          <meshStandardMaterial color="#cfc5b6" />
        </mesh>
      ) : null}
      {hasObject(perks, "pod") ? (
        <mesh position={[1.6 + x * 0.1, 0.7, 3.1]}>
          <capsuleGeometry args={[0.42, 0.7, 6, 12]} />
          <meshStandardMaterial color="#d8d1c4" roughness={0.7} />
        </mesh>
      ) : null}
      {hasObject(perks, "chair") || hasObject(perks, "desk") || hasObject(perks, "desks") ? (
        <Plant position={[-2.9, 0.1, -1.2]} scale={0.7} />
      ) : null}
      {hasObject(perks, "clinic") ? (
        <mesh position={[4.4, 0.7, 3.6]}>
          <boxGeometry args={[1.1, 1.4, 0.9]} />
          <meshStandardMaterial color="#efe8dc" />
        </mesh>
      ) : null}
      {hasObject(perks, "dining") ? (
        <mesh position={[0.4, 0.42, 3.8]}>
          <boxGeometry args={[1.6, 0.08, 0.7]} />
          <meshStandardMaterial color="#6b5344" />
        </mesh>
      ) : null}
      {hasObject(perks, "shuttle") ? (
        <mesh position={[6.4, 0.45, 5.2]}>
          <boxGeometry args={[1.6, 0.7, 0.5]} />
          <meshStandardMaterial color="#2b3a55" />
        </mesh>
      ) : null}
      {hasObject(perks, "gym") ? (
        <mesh position={[-5.2, 0.2, 3.4]} rotation={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 1.1, 8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.4} />
        </mesh>
      ) : null}
      {hasObject(perks, "housing") ? (
        <mesh position={[8, 1.1, 6]}>
          <boxGeometry args={[2.4, 2.2, 1.8]} />
          <meshStandardMaterial color="#c9b8a3" />
        </mesh>
      ) : null}
      {hasObject(perks, "therapy") || hasObject(perks, "kids") ? (
        <mesh position={[3.2, 0.35, 4.1]}>
          <boxGeometry args={[0.7, 0.5, 0.5]} />
          <meshStandardMaterial color="#e7dfd1" />
        </mesh>
      ) : null}
    </group>
  );
}
