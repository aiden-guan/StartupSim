import { mats } from "../materials/library";
import { Hotspot } from "../props/Hotspot";
import {
  BookStack,
  CardboardBox,
  Chair,
  Couch,
  Desk,
  Fridge,
  Keyboard,
  Lamp,
  Laptop,
  Monitor,
  Mug,
  PizzaBox,
  Plant,
  Rug,
  Whiteboard,
} from "../props/Furniture";
import { PerkSet } from "../props/PerkSet";
import type { CompanyBrand } from "../../simulation/types";

export function Apartment({
  onObject,
  perks = [],
  brand,
  standingDesks = false,
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number }[];
  brand: CompanyBrand;
  standingDesks?: boolean;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12.2, 10.2]} />
        <meshStandardMaterial {...mats.wood} color="#b89a78" />
      </mesh>
      <mesh position={[0, 1.65, -5]} receiveShadow>
        <boxGeometry args={[12.2, 3.3, 0.18]} />
        <meshStandardMaterial {...mats.plaster} />
      </mesh>
      <mesh position={[-6.05, 1.65, 0]} receiveShadow>
        <boxGeometry args={[0.18, 3.3, 10.2]} />
        <meshStandardMaterial {...mats.plasterWarm} />
      </mesh>
      <mesh position={[6.05, 1.65, 0]}>
        <boxGeometry args={[0.18, 3.3, 10.2]} />
        <meshStandardMaterial {...mats.plasterWarm} />
      </mesh>
      <mesh position={[0, 1.65, 5]}>
        <boxGeometry args={[12.2, 3.3, 0.18]} />
        <meshStandardMaterial color="#e2d5c0" roughness={0.9} />
      </mesh>
      <mesh position={[2.8, 1.85, -4.9]}>
        <boxGeometry args={[1.9, 1.35, 0.06]} />
        <meshStandardMaterial {...mats.glass} />
      </mesh>
      <mesh position={[2.8, 1.85, -4.82]}>
        <boxGeometry args={[1.7, 1.15, 0.02]} />
        <meshStandardMaterial color="#d8c7a6" transparent opacity={0.28} />
      </mesh>
      <mesh position={[-0.2, 1.6, 4.88]}>
        <boxGeometry args={[1.1, 2.2, 0.08]} />
        <meshStandardMaterial color="#6b5344" roughness={0.7} />
      </mesh>
      <Rug position={[0.2, 0.03, 0.7]} />
      <Desk position={[-2.35, 0, -2.15]} standing={standingDesks} />
      <Chair position={[-2.35, 0, -1.35]} />
      <Laptop position={[-2.5, standingDesks ? 0.96 : 0.76, -2.05]} />
      <Monitor position={[-2.05, standingDesks ? 1.12 : 0.92, -2.32]} />
      <Keyboard position={[-2.3, standingDesks ? 0.96 : 0.76, -1.92]} />
      <Mug position={[-1.75, standingDesks ? 0.98 : 0.78, -2.0]} color="#c4622d" />
      <BookStack position={[-2.85, standingDesks ? 0.76 : 0.76, -2.3]} />
      <Desk position={[2.05, 0, -2.2]} color="#b08968" standing={standingDesks} />
      <Chair position={[2.05, 0, -1.4]} color="#5b4636" />
      <Laptop position={[1.85, standingDesks ? 0.96 : 0.76, -2.05]} color="#1b2433" />
      <Mug position={[2.5, standingDesks ? 0.98 : 0.78, -2.05]} />
      <mesh position={[2.55, standingDesks ? 0.78 : 0.78, -2.35]}>
        <boxGeometry args={[0.18, 0.08, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <Whiteboard position={[-0.15, 1.45, 3.7]} />
      <Couch position={[-3.9, 0, 2.1]} />
      <mesh position={[-3.7, 0.08, 2.6]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.28, 0.08, 0.22]} />
        <meshStandardMaterial color="#2b3a55" />
      </mesh>
      <Fridge position={[4.9, 0.68, 2.6]} />
      <mesh position={[4.85, 1.5, 2.6]}>
        <boxGeometry args={[0.4, 0.28, 0.32]} />
        <meshStandardMaterial color="#d8d3c8" metalness={0.15} roughness={0.4} />
      </mesh>
      <Lamp position={[4.4, 0.35, -3.4]} />
      <Plant position={[4.7, 0.12, -3.15]} />
      <PizzaBox position={[0.6, 0.06, 0.5]} />
      <CardboardBox position={[-4.7, 0.18, -3.3]} />
      <CardboardBox position={[-4.35, 0.18, -3.55]} scale={0.8} />
      <mesh position={[-4.55, 0.42, -3.2]} rotation={[0.2, 0.4, 0]}>
        <boxGeometry args={[0.36, 0.08, 0.28]} />
        <meshStandardMaterial color="#1f6b4a" emissive="#1f6b4a" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[4.4, 0.08, 1.55]}>
        <boxGeometry args={[0.7, 0.06, 0.4]} />
        <meshStandardMaterial color="#3b2a22" />
      </mesh>
      <mesh position={[4.15, 0.18, 1.7]}>
        <cylinderGeometry args={[0.07, 0.08, 0.16, 10]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-5.4, 1.7, -1.2]}>
        <boxGeometry args={[0.04, 0.7, 0.5]} />
        <meshStandardMaterial color="#efe8dc" />
      </mesh>
      <mesh position={[-5.4, 1.7, 0.2]}>
        <boxGeometry args={[0.04, 0.7, 0.5]} />
        <meshStandardMaterial color="#2b3a55" />
      </mesh>
      <mesh position={[0.3, 2.2, -4.88]}>
        <boxGeometry args={[0.9, 0.28, 0.04]} />
        <meshStandardMaterial color={brand.color} />
      </mesh>
      <mesh position={[-5.2, 0.08, 3.6]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.28, 0.1, 0.12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-4.7, 0.7, 3.4]} rotation={[0, 0.6, 0]}>
        <boxGeometry args={[0.28, 0.7, 0.08]} />
        <meshStandardMaterial color="#1d4e3a" roughness={0.85} />
      </mesh>
      <mesh position={[3.3, 0.06, 3.5]}>
        <cylinderGeometry args={[0.12, 0.14, 0.12, 10]} />
        <meshStandardMaterial color="#4a4038" />
      </mesh>
      <mesh position={[-0.8, 0.73, -2.15]}>
        <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
        <meshStandardMaterial color="#c9a227" />
      </mesh>
      <mesh position={[3.9, 0.04, -4.2]}>
        <boxGeometry args={[0.9, 0.04, 0.08]} />
        <meshStandardMaterial color="#2a2a32" />
      </mesh>
      <Hotspot id="founderDesk" position={[-2.35, 1.1, -2.1]} label="Founder desk" onClick={onObject} size={[1.5, 1.2, 1]} />
      <Hotspot id="coffee" position={[4.2, 1, 1.7]} label="Kitchen" onClick={onObject} />
      <Hotspot id="board" position={[-0.15, 1.5, 3.6]} label="Whiteboard" onClick={onObject} size={[2.2, 1.4, 0.4]} />
      <Hotspot id="plant" position={[4.7, 0.8, -3.15]} label="Company" onClick={onObject} />
      <PerkSet perks={perks} level={0} />
    </group>
  );
}
