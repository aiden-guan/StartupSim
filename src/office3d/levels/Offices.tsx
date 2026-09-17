import { Hotspot } from "../Hotspot";
import { PerkDecor } from "../PerkDecor";

function RowDesks() {
  return (
    <group>
      {[-4.5, -2.2, 0.1, 2.4].map((x) => (
        <group key={x} position={[x, 0, -2.4]}>
          <mesh position={[0, 0.72, 0]} castShadow>
            <boxGeometry args={[1.5, 0.06, 0.72]} />
            <meshStandardMaterial color="#d7c4a8" />
          </mesh>
          <mesh position={[0.1, 0.9, -0.1]}>
            <boxGeometry args={[0.5, 0.32, 0.04]} />
            <meshStandardMaterial color="#1b2433" emissive="#c4622d" emissiveIntensity={0.08} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function StartupOffice({
  onObject,
  perks = [],
  hq = false,
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number }[];
  hq?: boolean;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color={hq ? "#c8c2d4" : "#cfc6b8"} />
      </mesh>
      <mesh position={[0, 1.8, -6.9]}>
        <boxGeometry args={[18, 3.6, 0.2]} />
        <meshStandardMaterial color="#ece4d6" />
      </mesh>
      <mesh position={[-8.9, 1.8, 0]}>
        <boxGeometry args={[0.2, 3.6, 14]} />
        <meshStandardMaterial color="#e5dccd" />
      </mesh>
      <RowDesks />
      <mesh position={[2.8, 0.7, 3.6]}>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        <meshStandardMaterial color="#8d6e4c" />
      </mesh>
      <mesh position={[5.6, 0.9, -3]}>
        <boxGeometry args={[0.8, 1.8, 0.6]} />
        <meshStandardMaterial color="#3a3f4b" emissive="#1f6b4a" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[5.4, 0.9, 2.2]}>
        <boxGeometry args={[1.2, 1.1, 0.7]} />
        <meshStandardMaterial color="#d9d0c2" />
      </mesh>
      <Hotspot position={[5.6, 2, -3]} label="Racks" onClick={() => onObject("servers")} />
      <Hotspot position={[5.4, 1.6, 2.2]} label="Kitchen" onClick={() => onObject("coffee")} />
      <Hotspot position={[-5.4, 1.6, 2.6]} label="Board" onClick={() => onObject("board")} />
      <PerkDecor perks={perks} />
    </group>
  );
}

export function Campus({
  onObject,
  perks = [],
  mega = false,
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number }[];
  mega?: boolean;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 28]} />
        <meshStandardMaterial color="#b7c4b2" />
      </mesh>
      <mesh position={[-8, 1.2, -4]}>
        <boxGeometry args={[12, 2.4, 8]} />
        <meshStandardMaterial color="#e8dfd0" />
      </mesh>
      <mesh position={[9, 1.6, -2]}>
        <boxGeometry args={[10, 3.2, 9]} />
        <meshStandardMaterial color="#d5dce3" />
      </mesh>
      <mesh position={[10, 1.4, 6]}>
        <boxGeometry args={[8, 2.8, 7]} />
        <meshStandardMaterial color="#2c3340" emissive="#1f6b4a" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 0.02, 2]}>
        <cylinderGeometry args={[3.2, 3.2, 0.08, 24]} />
        <meshStandardMaterial color="#8aa37a" />
      </mesh>
      <Hotspot position={[10, 3, 6]} label="Compute" onClick={() => onObject("servers")} />
      <Hotspot position={[9, 3.4, -2]} label="Lab" onClick={() => onObject("lab")} />
      <Hotspot position={[-8, 2.6, -4]} label="HQ" onClick={() => onObject("logo")} />
      <PerkDecor perks={perks} />
      {mega ? (
        <group>
          {[-14, -2, 12].map((x) => (
            <mesh key={x} position={[x, 2.2, 10]}>
              <boxGeometry args={[6, 4.4, 5]} />
              <meshStandardMaterial color="#2a3140" emissive="#1f6b4a" emissiveIntensity={0.12} />
            </mesh>
          ))}
          <mesh position={[0, 0.4, -10]}>
            <boxGeometry args={[18, 0.8, 4]} />
            <meshStandardMaterial color="#6d7788" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}
