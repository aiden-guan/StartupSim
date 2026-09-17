import { mats } from "../materials/library";
import {
  BrandSign,
  Chair,
  Desk,
  Fridge,
  Laptop,
  Plant,
  ServerRack,
  Whiteboard,
} from "../props/Furniture";
import { Hotspot } from "../props/Hotspot";
import { PerkSet } from "../props/PerkSet";
import type { CompanyBrand } from "../../simulation/types";

export function GarageOffice({
  onObject,
  perks = [],
  brand,
  computeLoad = 0.2,
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number; object?: string }[];
  brand: CompanyBrand;
  computeLoad?: number;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial {...mats.concrete} />
      </mesh>
      <mesh position={[0, 1.9, -6.9]}>
        <boxGeometry args={[18, 3.8, 0.2]} />
        <meshStandardMaterial color="#c9b8a3" roughness={0.95} />
      </mesh>
      <mesh position={[-8.9, 1.9, 0]}>
        <boxGeometry args={[0.2, 3.8, 14]} />
        <meshStandardMaterial color="#bba894" roughness={0.95} />
      </mesh>
      {[-4.5, -2.2, 0.1, 2.4].map((x) => (
        <group key={x}>
          <Desk position={[x, 0, -2.4]} color="#d7c4a8" />
          <Chair position={[x, 0, -1.6]} />
          <Laptop position={[x, 0.76, -2.3]} />
        </group>
      ))}
      <Whiteboard position={[-6.4, 1.5, 2.6]} />
      <Fridge position={[6.2, 0.68, 2.4]} />
      <ServerRack position={[5.7, 0.85, -3]} load={computeLoad} />
      <Plant position={[-7.2, 0.1, 4]} />
      <BrandSign position={[0, 2.4, -6.75]} color={brand.color} mark={brand.mark} />
      <Hotspot id="servers" position={[5.7, 1.6, -3]} label="Compute" onClick={onObject} />
      <Hotspot id="coffee" position={[6.2, 1.4, 2.4]} label="Kitchen" onClick={onObject} />
      <Hotspot id="board" position={[-6.4, 1.5, 2.6]} label="Tasks" onClick={onObject} size={[2.2, 1.4, 0.4]} />
      <Hotspot id="reception" position={[0, 1.2, 5.4]} label="Hiring" onClick={onObject} />
      <PerkSet perks={perks} level={1} />
    </group>
  );
}

export function HQOffice({
  onObject,
  perks = [],
  brand,
  computeLoad = 0.35,
  emptyDesks = false,
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number; object?: string }[];
  brand: CompanyBrand;
  computeLoad?: number;
  emptyDesks?: boolean;
}) {
  const desks = [
    [-6, -3],
    [-3.2, -3],
    [-0.4, -3],
    [2.4, -3],
    [-6, 1.4],
    [-3.2, 1.4],
  ] as const;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 18]} />
        <meshStandardMaterial color="#d4cfc4" roughness={0.88} />
      </mesh>
      <mesh position={[0, 2.1, -8.9]}>
        <boxGeometry args={[22, 4.2, 0.16]} />
        <meshStandardMaterial {...mats.plaster} />
      </mesh>
      <mesh position={[-10.9, 2.1, 0]}>
        <boxGeometry args={[0.16, 4.2, 18]} />
        <meshStandardMaterial color="#e4ddd0" roughness={0.9} />
      </mesh>
      <mesh position={[7.2, 1.7, 5.4]}>
        <boxGeometry args={[5.2, 3.2, 0.08]} />
        <meshStandardMaterial {...mats.glass} opacity={0.28} />
      </mesh>
      <mesh position={[-6.4, 0.02, 5.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 4.2]} />
        <meshStandardMaterial color="#8f3d2c" roughness={0.92} />
      </mesh>
      {desks.map(([x, z], i) => (
        <group key={`${x}-${z}`}>
          <Desk position={[x, 0, z]} color="#e2d3bc" />
          {emptyDesks && i > 2 ? null : <Chair position={[x, 0, z + 0.8]} />}
          <Laptop position={[x, 0.76, z + 0.1]} />
        </group>
      ))}
      <ServerRack position={[8.2, 0.85, -4.4]} load={computeLoad} />
      <ServerRack position={[9.1, 0.85, -4.4]} load={computeLoad * 0.85} />
      <Plant position={[8.4, 0.1, 5.6]} scale={1.4} />
      <Whiteboard position={[-8.4, 1.6, 3.2]} />
      <BrandSign position={[0, 3.1, -8.75]} color={brand.color} mark={brand.mark} width={2.6} />
      <Hotspot id="logo" position={[0, 3.1, -8.5]} label="Company" onClick={onObject} />
      <Hotspot id="servers" position={[8.6, 1.6, -4.4]} label="Compute" onClick={onObject} />
      <Hotspot id="coffee" position={[8.2, 1.3, 4.2]} label="Kitchen" onClick={onObject} />
      <Hotspot id="board" position={[-8.4, 1.6, 3.2]} label="Tasks" onClick={onObject} />
      <Hotspot id="reception" position={[0, 1.2, 7.4]} label="Hiring" onClick={onObject} />
      <PerkSet perks={perks} level={2} />
    </group>
  );
}

export function ResearchLab({
  onObject,
  perks = [],
  brand,
  computeLoad = 0.5,
  mega = false,
  empty = false,
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number; object?: string }[];
  brand: CompanyBrand;
  computeLoad?: number;
  mega?: boolean;
  empty?: boolean;
}) {
  const cool = empty || mega;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[36, 28]} />
        <meshStandardMaterial color={cool ? "#b7c4b2" : "#c5d0c4"} roughness={0.9} />
      </mesh>
      <mesh position={[-8, 1.4, -4]}>
        <boxGeometry args={[12, 2.8, 8]} />
        <meshStandardMaterial color={cool ? "#d5dce3" : "#e8dfd0"} />
      </mesh>
      <mesh position={[9, 1.8, -2]}>
        <boxGeometry args={[10, 3.6, 9]} />
        <meshStandardMaterial color="#d5dce3" />
      </mesh>
      <mesh position={[10, 1.6, 6]}>
        <boxGeometry args={[8, 3.2, 7]} />
        <meshStandardMaterial color="#2c3340" emissive="#1f6b4a" emissiveIntensity={0.12 + computeLoad * 0.2} />
      </mesh>
      <mesh position={[0, 0.02, 2]}>
        <cylinderGeometry args={[3.2, 3.2, 0.08, 24]} />
        <meshStandardMaterial {...mats.plant} color="#8aa37a" />
      </mesh>
      {!empty ? (
        <>
          <Desk position={[-8, 0, -4]} />
          <Desk position={[-5, 0, -4]} />
          <Chair position={[-8, 0, -3.2]} />
          <Chair position={[-5, 0, -3.2]} />
        </>
      ) : (
        <Desk position={[-8, 0, -4]} />
      )}
      <ServerRack position={[10, 0.85, 6]} load={computeLoad} />
      <ServerRack position={[11.2, 0.85, 5.2]} load={Math.min(1, computeLoad + 0.2)} />
      {mega
        ? [-14, -2, 12].map((x) => (
            <mesh key={x} position={[x, 2.2, 10]}>
              <boxGeometry args={[6, 4.4, 5]} />
              <meshStandardMaterial color="#2a3140" emissive="#1f6b4a" emissiveIntensity={0.1} />
            </mesh>
          ))
        : null}
      <BrandSign position={[0, 3.2, -8]} color={brand.color} mark={brand.mark} width={3} />
      <Hotspot id="servers" position={[10, 3, 6]} label="Compute" onClick={onObject} />
      <Hotspot id="lab" position={[9, 3.4, -2]} label="Research" onClick={onObject} />
      <Hotspot id="logo" position={[-8, 2.6, -4]} label="Company" onClick={onObject} />
      <PerkSet perks={perks} level={mega ? 5 : 3} />
    </group>
  );
}

export function CampusOffice({
  onObject,
  perks = [],
  brand,
  computeLoad = 0.55,
  empty = false,
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number; object?: string }[];
  brand: CompanyBrand;
  computeLoad?: number;
  empty?: boolean;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 36]} />
        <meshStandardMaterial color="#9eae9a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[6.4, 40]} />
        <meshStandardMaterial color="#c5d0c4" />
      </mesh>
      <mesh position={[-12, 2.2, -8]}>
        <boxGeometry args={[14, 4.4, 10]} />
        <meshStandardMaterial color="#d9dfe4" roughness={0.82} />
      </mesh>
      <mesh position={[12, 2.6, -6]}>
        <boxGeometry args={[12, 5.2, 12]} />
        <meshStandardMaterial color="#cfd6dc" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.6, 10]}>
        <boxGeometry args={[8, 3.2, 6]} />
        <meshStandardMaterial color="#efe8dc" />
      </mesh>
      {empty ? null : (
        <>
          <Desk position={[-12, 0, -6]} />
          <Desk position={[-9, 0, -6]} />
          <Chair position={[-12, 0, -5.2]} />
        </>
      )}
      <ServerRack position={[14, 0.85, -4]} load={computeLoad} />
      <ServerRack position={[15.2, 0.85, -4]} load={computeLoad} />
      <ServerRack position={[16.4, 0.85, -4]} load={Math.min(1, computeLoad + 0.15)} />
      <BrandSign position={[0, 3.4, 7.1]} color={brand.color} mark={brand.mark} width={3.4} />
      <Hotspot id="logo" position={[0, 3.4, 7.2]} label="Company" onClick={onObject} />
      <Hotspot id="lab" position={[12, 3.4, -6]} label="Research" onClick={onObject} />
      <Hotspot id="servers" position={[15, 2, -4]} label="Compute" onClick={onObject} />
      <Hotspot id="reception" position={[0, 1.4, 12]} label="Hiring" onClick={onObject} />
      <PerkSet perks={perks} level={4} />
    </group>
  );
}

export function MegaCampus({
  onObject,
  perks = [],
  brand,
  computeLoad = 0.8,
}: {
  onObject: (id: string) => void;
  perks?: { id: string; level: number; object?: string }[];
  brand: CompanyBrand;
  computeLoad?: number;
}) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[56, 40]} />
        <meshStandardMaterial color="#8a9694" roughness={0.96} />
      </mesh>
      {[-16, 0, 16].map((x) => (
        <mesh key={x} position={[x, 2.6, -8]}>
          <boxGeometry args={[12, 5.2, 14]} />
          <meshStandardMaterial color="#2a3140" emissive="#1f6b4a" emissiveIntensity={0.08 + computeLoad * 0.12} />
        </mesh>
      ))}
      <Desk position={[-4, 0, 4]} />
      <Chair position={[-4, 0, 4.8]} />
      <ServerRack position={[10, 0.85, 6]} load={1} />
      <ServerRack position={[11.4, 0.85, 6]} load={0.9} />
      <ServerRack position={[12.8, 0.85, 6]} load={0.85} />
      <BrandSign position={[0, 4.4, 10]} color={brand.color} mark={brand.mark} width={4} />
      <Hotspot id="servers" position={[11.4, 2.2, 6]} label="Compute" onClick={onObject} />
      <Hotspot id="lab" position={[0, 4, -8]} label="Research" onClick={onObject} />
      <Hotspot id="logo" position={[0, 4.4, 10]} label="Company" onClick={onObject} />
      <PerkSet perks={perks} level={5} />
    </group>
  );
}

export const StartupLoft = HQOffice;
