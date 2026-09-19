import { FacilityArchitecture } from './FacilityArchitecture';
import type { ReactNode } from 'react';
import { assetUrl, KitOrGltf } from '../assets/useKitOrGltf';
import { Box, Cylinder } from '../props/products/Geometry';

/**
 * Installed facility art is authored around a local ground origin. The parent
 * owns the world position and collision reservation; this file only owns the
 * bounded visual composition that fits inside the supplied footprint.
 */

const ink = '#282c30';
const charcoal = '#33373b';
const navy = '#2b3e55';
const paper = '#eee6d7';
const warmPaper = '#f5efe3';
const wood = '#c89e6e';
const darkWood = '#76543d';
const steel = '#929b9d';
const blue = '#699ac0';
const screenBlue = '#5599ff';
const orange = '#d87747';
const sage = '#819074';
const green = '#5c8646';
const coral = '#b9654b';
const yellow = '#d6aa52';

type Footprint = {
  width: number;
  depth: number;
};

type FacilityId = 'rest' | 'play' | 'life' | 'gym';

const ASSET_IDS: Record<FacilityId, readonly string[]> = {
  rest: ['facility_rest_nap_pods', 'facility_rest_meditation', 'facility_rest_clinic'],
  play: ['facility_play_ping_pong', 'facility_play_gaming_room', 'facility_play_executive_dining'],
  life: ['facility_life_pet_nook', 'facility_life_counseling', 'facility_life_childcare', 'facility_life_housing'],
  gym: ['facility_gym_stipend', 'facility_gym_floor'],
};

const KITCHEN_DEPTH = 1.25;

function assertPositiveFootprint(width: number, depth: number): Footprint {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(depth) || depth <= 0) {
    throw new Error(`Facility footprint must be finite and positive: ${width}x${depth}`);
  }
  // Keep a clear visual margin from the collision rectangle. Every child below
  // is derived from these reduced dimensions, so it remains inside width/depth.
  return { width: width * 0.9, depth: depth * 0.9 };
}

function assertTier(id: string, tier: number): asserts tier is number {
  const range = Object.prototype.hasOwnProperty.call(ASSET_IDS, id) ? ASSET_IDS[id as FacilityId] : undefined;
  if (!range || !Number.isInteger(tier) || tier < 0 || tier >= range.length) {
    throw new Error(`Invalid installed facility tier: ${id}:${tier}`);
  }
}

function assertKitchenTier(name: 'coffee' | 'food', tier: number) {
  if (!Number.isInteger(tier) || tier < -1 || tier > 2) {
    throw new Error(`Invalid installed kitchen ${name} tier: ${tier}`);
  }
}

function kit(id: string, fallback: ReactNode) {
  return <KitOrGltf id={id} path={assetUrl('props', `${id}.glb`)} fallback={fallback} />;
}

function Floor({ footprint, color = '#d6d0c2' }: { footprint: Footprint; color?: string }) {
  return <Box p={[0, 0.018, 0]} s={[footprint.width, 0.036, footprint.depth]} c={color} r={0.018} />;
}

function RestNapPods({ footprint }: { footprint: Footprint }) {
  const podWidth = footprint.width * 0.38;
  const podDepth = footprint.depth * 0.7;
  const podX = footprint.width * 0.26;
  const canopyHeight = 1.5;
  return (
    <group>
      <Floor footprint={footprint} color="#d8d0c5" />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * podX, 0, 0]}>
          <Box p={[0, 0.19, 0]} s={[podWidth, 0.34, podDepth]} c={charcoal} r={0.06} />
          <Box p={[0, 0.39, podDepth * 0.03]} s={[podWidth * 0.86, 0.12, podDepth * 0.82]} c={navy} r={0.04} />
          <Box p={[0, 0.46, -podDepth * 0.24]} s={[podWidth * 0.34, 0.09, podDepth * 0.2]} c={warmPaper} r={0.035} />
          <Box p={[-podWidth * 0.47, canopyHeight * 0.52, 0]} s={[0.07, canopyHeight, podDepth]} c={paper} r={0.02} />
          <Box p={[podWidth * 0.47, canopyHeight * 0.52, 0]} s={[0.07, canopyHeight, podDepth]} c={paper} r={0.02} />
          <Box p={[0, canopyHeight, 0]} s={[podWidth, 0.1, podDepth]} c={paper} r={0.02} />
          <Box p={[0, 0.78, -podDepth * 0.46]} s={[podWidth * 0.9, 0.66, 0.07]} c={paper} r={0.02} />
          <Box p={[0, 0.83, podDepth * 0.46]} s={[podWidth * 0.82, 0.05, 0.05]} c={orange} r={0.012} />
        </group>
      ))}
    </group>
  );
}

function RestMeditation({ footprint }: { footprint: Footprint }) {
  const matWidth = footprint.width * 0.72;
  const matDepth = footprint.depth * 0.57;
  const screenWidth = footprint.width * 0.62;
  const screenZ = -footprint.depth * 0.34;
  const plantX = footprint.width * 0.34;
  const plantRadius = footprint.width * 0.055;
  return (
    <group>
      <Floor footprint={footprint} color="#d6d0c2" />
      <Box p={[0, 0.04, footprint.depth * 0.02]} s={[matWidth, 0.08, matDepth]} c="#a5af95" r={0.04} />
      <Box p={[0, 0.86, screenZ]} s={[screenWidth, 1.72, 0.06]} c={wood} r={0.02} />
      <Box p={[0, 0.86, screenZ + 0.036]} s={[screenWidth * 0.86, 1.48, 0.018]} c={warmPaper} r={0.008} />
      {[-0.28, 0, 0.28].map((x) => (
        <Box key={x} p={[screenWidth * x, 0.86, screenZ + 0.05]} s={[0.018, 1.48, 0.02]} c={wood} />
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * matWidth * 0.25, 0, 0.02]}>
          <Box p={[0, 0.13, 0]} s={[matWidth * 0.28, 0.16, matDepth * 0.38]} c={navy} r={0.07} />
          <Box p={[0, 0.225, -matDepth * 0.07]} s={[matWidth * 0.2, 0.045, matDepth * 0.19]} c={warmPaper} r={0.025} />
        </group>
      ))}
      <Cylinder p={[plantX, 0.18, screenZ + 0.12]} r={plantRadius} h={0.36} c={paper} />
      <Cylinder p={[plantX, 0.39, screenZ + 0.12]} r={plantRadius * 0.76} h={0.34} c={green} />
      <Box p={[plantX - plantRadius * 0.4, 0.6, screenZ + 0.12]} s={[plantRadius * 2.1, 0.07, plantRadius * 0.75]} c={green} r={0.03} />
      <Box p={[plantX + plantRadius * 0.38, 0.7, screenZ + 0.12]} s={[plantRadius * 1.7, 0.07, plantRadius * 0.7]} c="#557f3f" r={0.03} />
      <Cylinder p={[0, 0.25, footprint.depth * 0.2]} r={0.06} h={0.13} c={orange} />
    </group>
  );
}

function RestClinic({ footprint }: { footprint: Footprint }) {
  const bedWidth = Math.min(1.15, footprint.width * 0.46);
  const bedDepth = Math.min(1.85, footprint.depth * 0.58);
  const bedX = -footprint.width * 0.13;
  const trolleyWidth = Math.min(0.48, footprint.width * 0.18);
  const trolleyX = footprint.width * 0.33;
  const screenWidth = Math.min(1.35, footprint.width * 0.34);
  return (
    <group>
      <Floor footprint={footprint} color="#d4d9d6" />
      <Box p={[bedX, 0.5, 0.02]} s={[bedWidth, 0.16, bedDepth]} c={steel} r={0.025} />
      <Box p={[bedX, 0.61, 0.02]} s={[bedWidth * 0.93, 0.09, bedDepth * 0.92]} c={warmPaper} r={0.035} />
      <Box p={[bedX, 0.7, -bedDepth * 0.38]} s={[bedWidth * 0.93, 0.16, 0.06]} c={navy} r={0.02} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box p={[bedX + side * bedWidth * 0.38, 0.25, -bedDepth * 0.3]} s={[0.06, 0.5, 0.06]} c={charcoal} r={0.01} />
          <Box p={[bedX + side * bedWidth * 0.38, 0.25, bedDepth * 0.3]} s={[0.06, 0.5, 0.06]} c={charcoal} r={0.01} />
        </group>
      ))}
      <Box p={[trolleyX, 0.48, -footprint.depth * 0.08]} s={[trolleyWidth, 0.08, footprint.depth * 0.4]} c={steel} r={0.015} />
      <Box p={[trolleyX, 0.84, -footprint.depth * 0.08]} s={[trolleyWidth, 0.08, footprint.depth * 0.4]} c={paper} r={0.015} />
      {[-1, 1].map((side) => (
        <Box key={side} p={[trolleyX + side * trolleyWidth * 0.36, 0.65, -footprint.depth * 0.08]} s={[0.035, 0.46, 0.035]} c={steel} />
      ))}
      <Box p={[trolleyX, 1.13, -footprint.depth * 0.08]} s={[trolleyWidth * 0.9, 0.32, 0.05]} c={charcoal} r={0.015} />
      <Box p={[trolleyX, 1.14, -footprint.depth * 0.045]} s={[trolleyWidth * 0.72, 0.2, 0.018]} c={screenBlue} r={0.006} />
      <Box p={[0.02, 0.86, -footprint.depth * 0.39]} s={[screenWidth, 1.72, 0.06]} c={paper} r={0.02} />
      <Box p={[0.02, 0.86, -footprint.depth * 0.35]} s={[screenWidth * 0.84, 1.48, 0.018]} c="#b9cfd5" r={0.01} />
      <Box p={[-footprint.width * 0.03, 0.43, footprint.depth * 0.28]} s={[0.04, 0.68, 0.04]} c={orange} />
      <Box p={[-footprint.width * 0.03, 0.76, footprint.depth * 0.28]} s={[0.22, 0.04, 0.04]} c={orange} />
    </group>
  );
}

function PlayPingPong({ footprint }: { footprint: Footprint }) {
  const tableWidth = footprint.width * 0.76;
  const tableDepth = footprint.depth * 0.52;
  const tableY = 0.78;
  return (
    <group>
      <Floor footprint={footprint} color="#c9d1c4" />
      <Box p={[0, 0.04, 0]} s={[footprint.width * 0.7, 0.03, footprint.depth * 0.76]} c="#a8b599" />
      <Box p={[0, tableY, 0]} s={[tableWidth, 0.08, tableDepth]} c={sage} r={0.025} />
      <Box p={[0, tableY + 0.006, 0]} s={[0.025, 0.015, tableDepth * 0.94]} c={paper} />
      <Box p={[0, tableY + 0.006, 0]} s={[tableWidth * 0.94, 0.015, 0.02]} c={paper} />
      <Box p={[0, tableY + 0.14, 0]} s={[tableWidth * 0.98, 0.25, 0.035]} c={paper} r={0.008} />
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((frontBack) => (
          <Box
            key={`${side}-${frontBack}`}
            p={[side * tableWidth * 0.4, tableY * 0.5, frontBack * tableDepth * 0.34]}
            s={[0.06, tableY, 0.06]}
            c={navy}
            r={0.012}
          />
        ))
      )}
      <Box p={[tableWidth * 0.22, tableY + 0.12, tableDepth * 0.31]} s={[0.08, 0.02, 0.16]} c={orange} r={0.02} />
      <Box p={[tableWidth * 0.31, tableY + 0.12, tableDepth * 0.3]} s={[0.08, 0.02, 0.16]} c={orange} r={0.02} />
    </group>
  );
}

function PlayGamingRoom({ footprint }: { footprint: Footprint }) {
  const tvWidth = footprint.width * 0.48;
  const tvBackZ = -footprint.depth * 0.38;
  const couchWidth = footprint.width * 0.47;
  const arcadeX = footprint.width * 0.33;
  const arcadeWidth = footprint.width * 0.15;
  return (
    <group>
      <Floor footprint={footprint} color="#c8c7c0" />
      <Box p={[0, 0.75, tvBackZ]} s={[footprint.width * 0.78, 1.5, 0.06]} c={navy} r={0.02} />
      <Box p={[0, 1.36, tvBackZ + 0.045]} s={[tvWidth, 0.75, 0.025]} c={ink} r={0.02} />
      <Box p={[0, 1.36, tvBackZ + 0.064]} s={[tvWidth * 0.88, 0.58, 0.012]} c={screenBlue} r={0.008} />
      <Box p={[0, 0.68, tvBackZ + 0.1]} s={[tvWidth * 0.58, 0.08, 0.28]} c={charcoal} r={0.02} />
      <Box p={[0, 0.05, footprint.depth * 0.23]} s={[footprint.width * 0.7, 0.04, footprint.depth * 0.37]} c="#52614f" r={0.02} />
      <Box p={[0, 0.42, footprint.depth * 0.21]} s={[couchWidth, 0.2, footprint.depth * 0.2]} c={navy} r={0.07} />
      <Box p={[0, 0.81, footprint.depth * 0.29]} s={[couchWidth, 0.62, 0.18]} c={navy} r={0.06} />
      <Box p={[-couchWidth * 0.39, 0.64, footprint.depth * 0.18]} s={[0.12, 0.4, footprint.depth * 0.24]} c={navy} r={0.05} />
      <Box p={[couchWidth * 0.39, 0.64, footprint.depth * 0.18]} s={[0.12, 0.4, footprint.depth * 0.24]} c={navy} r={0.05} />
      <Box p={[arcadeX, 0.68, -footprint.depth * 0.01]} s={[arcadeWidth, 1.36, footprint.depth * 0.25]} c={charcoal} r={0.025} />
      <Box p={[arcadeX, 1.13, footprint.depth * 0.12]} s={[arcadeWidth * 0.8, 0.43, 0.025]} c={screenBlue} r={0.01} />
      <Box p={[arcadeX, 0.69, footprint.depth * 0.14]} s={[arcadeWidth * 0.9, 0.08, 0.09]} c={orange} r={0.02} />
      <Cylinder p={[arcadeX - arcadeWidth * 0.2, 0.75, footprint.depth * 0.2]} r={0.035} h={0.16} c={yellow} />
      <Cylinder p={[arcadeX + arcadeWidth * 0.2, 0.75, footprint.depth * 0.2]} r={0.035} h={0.16} c={blue} />
      <Box p={[-footprint.width * 0.32, 0.19, -footprint.depth * 0.05]} s={[footprint.width * 0.12, 0.38, footprint.depth * 0.16]} c={wood} r={0.02} />
      <Box p={[-footprint.width * 0.32, 0.42, footprint.depth * 0.05]} s={[footprint.width * 0.18, 0.08, footprint.depth * 0.2]} c={paper} r={0.02} />
    </group>
  );
}

function DiningChair({ x, z, backDirection }: { x: number; z: number; backDirection: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box p={[0, 0.42, 0]} s={[0.48, 0.1, 0.45]} c={navy} r={0.06} />
      <Box p={[0, 0.69, backDirection * 0.195]} s={[0.48, 0.52, 0.06]} c={navy} r={0.035} />
      {[-1, 1].map((side) => (
        <Box key={side} p={[side * 0.17, 0.21, 0]} s={[0.05, 0.42, 0.05]} c={darkWood} r={0.01} />
      ))}
    </group>
  );
}

function PlayExecutiveDining({ footprint }: { footprint: Footprint }) {
  const tableWidth = footprint.width * 0.52;
  const tableDepth = footprint.depth * 0.34;
  const chairX = tableWidth * 0.34;
  const chairZ = footprint.depth * 0.33;
  return (
    <group>
      <Floor footprint={footprint} color="#d7d0c3" />
      <Box p={[0, 0.03, 0]} s={[footprint.width * 0.76, 0.04, footprint.depth * 0.7]} c="#b7a88d" r={0.025} />
      <Box p={[0, 0.8, 0]} s={[tableWidth, 0.1, tableDepth]} c={wood} r={0.035} />
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((frontBack) => (
          <Box key={`${side}-${frontBack}`} p={[side * tableWidth * 0.38, 0.41, frontBack * tableDepth * 0.34]} s={[0.06, 0.74, 0.06]} c={darkWood} r={0.012} />
        ))
      )}
      <DiningChair x={-chairX} z={chairZ} backDirection={1} />
      <DiningChair x={chairX} z={chairZ} backDirection={1} />
      <DiningChair x={-chairX} z={-chairZ} backDirection={-1} />
      <DiningChair x={chairX} z={-chairZ} backDirection={-1} />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * tableWidth * 0.22, 0.89, 0]}>
          <Cylinder p={[0, 0, 0]} r={0.11} h={0.025} c={paper} />
          <Cylinder p={[0, 0.02, 0]} r={0.055} h={0.03} c={orange} />
        </group>
      ))}
      <Box p={[0, 0.42, -footprint.depth * 0.38]} s={[footprint.width * 0.48, 0.84, 0.14]} c={darkWood} r={0.025} />
      <Box p={[0, 0.84, -footprint.depth * 0.32]} s={[footprint.width * 0.4, 0.08, footprint.depth * 0.14]} c={paper} r={0.015} />
      <Cylinder p={[-footprint.width * 0.11, 0.98, -footprint.depth * 0.31]} r={0.06} h={0.1} c={yellow} />
      <Cylinder p={[footprint.width * 0.11, 0.98, -footprint.depth * 0.31]} r={0.06} h={0.1} c={green} />
    </group>
  );
}

function LifePetNook({ footprint }: { footprint: Footprint }) {
  const bedWidth = footprint.width * 0.46;
  const bedDepth = footprint.depth * 0.43;
  const dogX = -footprint.width * 0.1;
  const dogBodyWidth = footprint.width * 0.18;
  const dogBodyDepth = footprint.depth * 0.2;
  return (
    <group>
      <Floor footprint={footprint} color="#d8d1c5" />
      <Box p={[-footprint.width * 0.13, 0.07, -0.02]} s={[bedWidth, 0.14, bedDepth]} c={navy} r={0.08} />
      <Box p={[-footprint.width * 0.13, 0.15, -0.02]} s={[bedWidth * 0.83, 0.12, bedDepth * 0.78]} c="#b6865e" r={0.06} />
      <Box p={[dogX, 0.42, -footprint.depth * 0.04]} s={[dogBodyWidth, 0.36, dogBodyDepth]} c="#ae8258" r={0.08} />
      <Box p={[dogX, 0.55, footprint.depth * 0.12]} s={[dogBodyWidth * 0.84, 0.3, dogBodyDepth * 0.72]} c="#c49b73" r={0.07} />
      <Box p={[dogX, 0.68, footprint.depth * 0.25]} s={[dogBodyWidth * 0.74, 0.32, dogBodyDepth * 0.6]} c="#ae8258" r={0.08} />
      <Box p={[dogX - dogBodyWidth * 0.25, 0.84, footprint.depth * 0.25]} s={[dogBodyWidth * 0.28, 0.22, 0.08]} c="#674b35" r={0.02} />
      <Box p={[dogX + dogBodyWidth * 0.25, 0.84, footprint.depth * 0.25]} s={[dogBodyWidth * 0.28, 0.22, 0.08]} c="#674b35" r={0.02} />
      <Box p={[dogX - dogBodyWidth * 0.48, 0.24, -footprint.depth * 0.08]} s={[0.07, 0.28, 0.07]} c="#ae8258" r={0.02} />
      <Box p={[dogX + dogBodyWidth * 0.48, 0.24, -footprint.depth * 0.08]} s={[0.07, 0.28, 0.07]} c="#ae8258" r={0.02} />
      <Box p={[dogX - dogBodyWidth * 0.35, 0.58, -footprint.depth * 0.18]} s={[0.08, 0.07, 0.23]} c="#ae8258" r={0.03} />
      <Box p={[dogX + dogBodyWidth * 0.35, 0.58, -footprint.depth * 0.18]} s={[0.08, 0.07, 0.23]} c="#ae8258" r={0.03} />
      <Box p={[dogX - dogBodyWidth * 0.38, 0.74, -footprint.depth * 0.18]} s={[0.08, 0.08, 0.25]} c="#ae8258" r={0.03} />
      <Cylinder p={[footprint.width * 0.3, 0.15, footprint.depth * 0.28]} r={footprint.width * 0.07} h={0.09} c={steel} />
      <Cylinder p={[footprint.width * 0.3, 0.2, footprint.depth * 0.28]} r={footprint.width * 0.05} h={0.02} c={blue} />
      <Box p={[-footprint.width * 0.35, 0.18, footprint.depth * 0.28]} s={[footprint.width * 0.13, 0.07, footprint.depth * 0.1]} c={orange} r={0.03} />
    </group>
  );
}

function LifeCounseling({ footprint }: { footprint: Footprint }) {
  const sofaWidth = footprint.width * 0.44;
  const chairX = footprint.width * 0.3;
  return (
    <group>
      <Floor footprint={footprint} color="#d9d1c5" />
      <Box p={[0, 0.04, 0.02]} s={[footprint.width * 0.7, 0.08, footprint.depth * 0.62]} c="#a5af95" r={0.04} />
      <Box p={[0, 0.43, -footprint.depth * 0.2]} s={[sofaWidth, 0.16, footprint.depth * 0.24]} c={navy} r={0.06} />
      <Box p={[0, 0.79, -footprint.depth * 0.3]} s={[sofaWidth, 0.6, 0.18]} c={navy} r={0.06} />
      {[-1, 1].map((side) => (
        <Box key={side} p={[side * sofaWidth * 0.42, 0.63, -footprint.depth * 0.17]} s={[0.11, 0.34, footprint.depth * 0.27]} c={navy} r={0.05} />
      ))}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((frontBack) => (
          <Box key={`sofa-foot-${side}-${frontBack}`} p={[side * sofaWidth * 0.35, 0.18, -footprint.depth * 0.2 + frontBack * footprint.depth * 0.08]} s={[0.06, 0.3, 0.06]} c={darkWood} r={0.01} />
        ))
      )}
      <Box p={[chairX, 0.42, footprint.depth * 0.24]} s={[footprint.width * 0.2, 0.13, footprint.depth * 0.18]} c={coral} r={0.05} />
      <Box p={[chairX, 0.76, footprint.depth * 0.32]} s={[footprint.width * 0.2, 0.59, 0.12]} c={coral} r={0.05} />
      <Box p={[chairX - footprint.width * 0.11, 0.62, footprint.depth * 0.21]} s={[0.08, 0.34, footprint.depth * 0.2]} c={coral} r={0.04} />
      <Box p={[chairX + footprint.width * 0.11, 0.62, footprint.depth * 0.21]} s={[0.08, 0.34, footprint.depth * 0.2]} c={coral} r={0.04} />
      {[-1, 1].map((side) => (
        <Box key={`chair-foot-${side}`} p={[chairX + side * footprint.width * 0.07, 0.18, footprint.depth * 0.24]} s={[0.06, 0.34, 0.06]} c={darkWood} r={0.01} />
      ))}
      <Box p={[-footprint.width * 0.13, 0.31, footprint.depth * 0.24]} s={[footprint.width * 0.16, 0.06, footprint.depth * 0.15]} c={wood} r={0.02} />
      <Cylinder p={[-footprint.width * 0.13, 0.41, footprint.depth * 0.24]} r={0.025} h={0.2} c={steel} />
      <Box p={[-footprint.width * 0.13, 0.52, footprint.depth * 0.24]} s={[0.15, 0.035, 0.1]} c={warmPaper} r={0.02} />
      <Cylinder p={[-footprint.width * 0.35, 0.16, -footprint.depth * 0.28]} r={footprint.width * 0.055} h={0.32} c={paper} />
      <Box p={[-footprint.width * 0.35, 0.45, -footprint.depth * 0.28]} s={[footprint.width * 0.14, 0.06, footprint.width * 0.08]} c={green} r={0.025} />
      <Box p={[-footprint.width * 0.3, 0.55, -footprint.depth * 0.28]} s={[footprint.width * 0.13, 0.06, footprint.width * 0.07]} c="#557f3f" r={0.025} />
    </group>
  );
}

function LifeChildcare({ footprint }: { footprint: Footprint }) {
  const tableWidth = footprint.width * 0.42;
  const tableDepth = footprint.depth * 0.28;
  const shelfWidth = footprint.width * 0.28;
  return (
    <group>
      <Floor footprint={footprint} color="#d4d8ce" />
      <Box p={[0, 0.04, 0.03]} s={[footprint.width * 0.74, 0.08, footprint.depth * 0.7]} c="#a5af95" r={0.04} />
      <Box p={[0, 0.58, 0.05]} s={[tableWidth, 0.1, tableDepth]} c={wood} r={0.035} />
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((frontBack) => (
          <Box key={`${side}-${frontBack}`} p={[side * tableWidth * 0.36, 0.29, 0.05 + frontBack * tableDepth * 0.34]} s={[0.05, 0.52, 0.05]} c={darkWood} r={0.01} />
        ))
      )}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((frontBack) => (
          <group key={`seat-${side}-${frontBack}`} position={[side * footprint.width * 0.27, 0, 0.05 + frontBack * footprint.depth * 0.28]}>
            <Box p={[0, 0.3, 0]} s={[footprint.width * 0.15, 0.09, footprint.depth * 0.13]} c={side === 1 ? coral : blue} r={0.03} />
            <Box p={[0, 0.51, frontBack * 0.06]} s={[footprint.width * 0.15, 0.35, 0.04]} c={side === 1 ? coral : blue} r={0.02} />
          </group>
        ))
      )}
      <Box p={[footprint.width * 0.31, 0.6, -footprint.depth * 0.3]} s={[shelfWidth, 1.2, 0.12]} c={wood} r={0.025} />
      {[0.35, 0.7, 1.05].map((y) => (
        <Box key={y} p={[footprint.width * 0.31, y, -footprint.depth * 0.22]} s={[shelfWidth * 0.84, 0.05, footprint.depth * 0.2]} c={paper} r={0.015} />
      ))}
      <Box p={[-footprint.width * 0.28, 0.09, footprint.depth * 0.28]} s={[0.19, 0.18, 0.19]} c={orange} r={0.025} />
      <Box p={[-footprint.width * 0.1, 0.1, footprint.depth * 0.28]} s={[0.17, 0.2, 0.17]} c={yellow} r={0.025} />
      <Box p={[footprint.width * 0.08, 0.11, footprint.depth * 0.28]} s={[0.16, 0.22, 0.16]} c={blue} r={0.025} />
      <Cylinder p={[0, 0.18, -footprint.depth * 0.1]} r={footprint.width * 0.07} h={0.2} c={coral} />
    </group>
  );
}

function NeighborhoodHouse({ position, rotation, wallColor, roofColor, index }: {
  position: [number, number, number];
  rotation: number;
  wallColor: string;
  roofColor: string;
  index: number;
}) {
  const frontZ=1.12;
  return (
    <group position={position} rotation={[0,rotation,0]}>
      <Box p={[0,.08,0]} s={[3.25,.16,2.7]} c="#d7d1c3" r={.035}/>
      <Box p={[0,1.02,0]} s={[2.85,1.9,2.25]} c={wallColor} r={.035}/>
      <Box p={[-.72,1.18,frontZ+.025]} s={[.62,1.45,.06]} c={index%2?darkWood:wood} r={.018}/>
      <Cylinder p={[-.51,1.18,frontZ+.07]} r={.025} h={.045} c={yellow} rot={[Math.PI/2,0,0]}/>
      {[.16,.82].map(x=><group key={x}>
        <Box p={[x,1.25,frontZ+.025]} s={[.48,.56,.055]} c={blue} r={.012}/>
        <Box p={[x,1.25,frontZ+.06]} s={[.025,.5,.02]} c={paper}/>
        <Box p={[x,1.25,frontZ+.06]} s={[.43,.025,.02]} c={paper}/>
      </group>)}
      <Box p={[-.72,.14,frontZ+.28]} s={[.92,.18,.5]} c={wood} r={.025}/>
      <Box p={[-.72,2.02,0]} s={[1.9,.16,2.55]} c={roofColor} r={.025} rot={[0,0,.48]}/>
      <Box p={[.72,2.02,0]} s={[1.9,.16,2.55]} c={roofColor} r={.025} rot={[0,0,-.48]}/>
    </group>
  );
}

function LifeHousing({ footprint }: { footprint: Footprint }) {
  const walls=[warmPaper,'#d8c7aa','#d7d8d0'];
  const roofs=[navy,'#704b42','#4e665a'];
  return <group>
    <Floor footprint={footprint} color="#bfc7b4" />
    <Box p={[0,.04,0]} s={[footprint.width*.94,.08,2.15]} c="#666b6d" r={.03}/>
    <Box p={[0,.095,-1.35]} s={[footprint.width*.94,.07,.52]} c="#ded9ce" r={.02}/>
    <Box p={[0,.095,1.35]} s={[footprint.width*.94,.07,.52]} c="#ded9ce" r={.02}/>
    {[-4,0,4].flatMap((x,column)=>[-1,1].map((side)=>{
      const index=column*2+(side===1?1:0);
      return <NeighborhoodHouse key={`${x}-${side}`} position={[x,0,side*3.45]} rotation={side===1?Math.PI:0} wallColor={walls[index%walls.length]!} roofColor={roofs[index%roofs.length]!} index={index}/>;
    }))}
    {[-5.2,5.2].flatMap(x=>[-1.5,1.5].map(z=><group key={`${x}-${z}`} position={[x,0,z]}>
      <Cylinder p={[0,.42,0]} r={.08} h={.84} c={darkWood}/>
      <mesh position={[0,1.05,0]} castShadow><icosahedronGeometry args={[.48,1]}/><meshStandardMaterial color={green} roughness={.95} flatShading/></mesh>
    </group>))}
    <Box p={[0,.16,0]} s={[1.15,.12,.58]} c={paper} r={.03}/>
    <Box p={[0,.23,0]} s={[.72,.035,.08]} c={navy} r={.01}/>
  </group>;
}

function GymStipend({ footprint }: { footprint: Footprint }) {
  const signWidth = footprint.width * 0.28;
  const dumbbellX = -footprint.width * 0.2;
  return (
    <group>
      <Floor footprint={footprint} color="#cfd5ca" />
      <Box p={[0, 0.03, footprint.depth * 0.05]} s={[footprint.width * 0.66, 0.06, footprint.depth * 0.58]} c={sage} r={0.025} />
      <Box p={[footprint.width * 0.24, 0.78, -footprint.depth * 0.24]} s={[signWidth, 1.48, 0.06]} c={paper} r={0.02} />
      <Box p={[footprint.width * 0.24, 1.1, -footprint.depth * 0.2]} s={[signWidth * 0.62, 0.47, 0.025]} c={navy} r={0.012} />
      <Box p={[footprint.width * 0.24, 1.1, -footprint.depth * 0.18]} s={[signWidth * 0.35, 0.18, 0.018]} c={orange} r={0.01} />
      <Box p={[dumbbellX, 0.13, footprint.depth * 0.13]} s={[footprint.width * 0.25, 0.05, footprint.depth * 0.16]} c="#a8b599" r={0.02} />
      <Box p={[dumbbellX, 0.22, footprint.depth * 0.13]} s={[footprint.width * 0.19, 0.04, 0.035]} c={steel} r={0.015} />
      {[-1, 1].map((side) => (
        <Cylinder key={side} p={[dumbbellX + side * footprint.width * 0.1, 0.23, footprint.depth * 0.13]} r={footprint.width * 0.045} h={0.08} c={ink} />
      ))}
      <Cylinder p={[-footprint.width * 0.03, 0.16, footprint.depth * 0.18]} r={footprint.width * 0.045} h={0.16} c={blue} />
    </group>
  );
}

function GymFloor({ footprint }: { footprint: Footprint }) {
  const w=footprint.width,d=footprint.depth;
  const rackX=w*.22, rackZ=-d*.12;
  const treadmillX=-w*.27;
  return <group>
    <Floor footprint={footprint} color="#53615e"/>
    {/* Bench press: padded bench, steel undercarriage, racked bar and plates. */}
    <group position={[rackX,0,rackZ]}>
      <Box p={[0,.46,.23]} s={[.48,.16,Math.min(1.45,d*.55)]} c={navy} r={.04}/>
      <Box p={[0,.22,.23]} s={[.1,.44,1.05]} c={steel}/>
      {[-.32,.65].map(z=><Box key={z} p={[0,.08,z]} s={[.8,.12,.12]} c={steel}/>)}
      {[-.58,.58].map(x=><group key={x}>
        <Box p={[x,.82,-.38]} s={[.1,1.64,.1]} c={steel}/>
        <Box p={[x,.06,-.27]} s={[.24,.12,.7]} c={charcoal}/>
        <Box p={[x,1.3,-.29]} s={[.13,.09,.26]} c={steel}/>
      </group>)}
      <Cylinder p={[0,1.37,-.27]} r={.035} h={1.8} c={steel} rot={[0,0,Math.PI/2]}/>
      {[-.74,.74].map(x=><group key={x}>
        <Cylinder p={[x,1.37,-.27]} r={.25} h={.11} c={charcoal} rot={[0,0,Math.PI/2]}/>
        <Cylinder p={[x*1.12,1.37,-.27]} r={.18} h={.08} c={ink} rot={[0,0,Math.PI/2]}/>
      </group>)}
    </group>
    {/* A full treadmill gives the gym a second readable activity silhouette. */}
    <group position={[treadmillX,0,0]}>
      <Box p={[0,.12,.03]} s={[.86,.24,Math.min(1.7,d*.67)]} c={charcoal} r={.05}/>
      <Box p={[0,.25,.06]} s={[.64,.025,Math.min(1.4,d*.55)]} c="#222d30"/>
      {[-.36,.36].map(x=><Box key={x} p={[x,.7,-d*.22]} s={[.06,1.25,.08]} c={steel}/>)}
      <Box p={[0,1.33,-d*.22]} s={[.78,.12,.38]} c={navy} r={.025}/>
      <Box p={[0,1.405,-d*.22]} s={[.33,.025,.19]} c={blue}/>
    </group>
    {d>3&&<group position={[0,0,d*.3]}>
      <Box p={[0,.48,0]} s={[2,.08,.4]} c={steel}/>
      {[-.82,.82].map(x=><Box key={x} p={[x,.24,0]} s={[.08,.48,.35]} c={charcoal}/>)}
      {[-.62,0,.62].map(x=><group key={x}>
        <Cylinder p={[x,.61,0]} r={.027} h={.35} c={steel} rot={[0,0,Math.PI/2]}/>
        {[-.15,.15].map(dx=><Cylinder key={dx} p={[x+dx,.61,0]} r={.12} h={.08} c={ink} rot={[0,0,Math.PI/2]}/>)}
      </group>)}
    </group>}
  </group>;
}

function KitchenCounter({ width, depth, x = 0, color = paper }: { width: number; depth: number; x?: number; color?: string }) {
  const counterDepth = depth * 0.68;
  return (
    <>
      <Box p={[x, 0.39, 0]} s={[width, 0.78, counterDepth]} c={color} r={0.025} />
      <Box p={[x, 0.81, depth * 0.03]} s={[width * 1.02, 0.08, counterDepth * 1.04]} c={wood} r={0.02} />
      <Box p={[x, 0.42, depth * 0.37]} s={[width * 0.76, 0.5, 0.035]} c={charcoal} r={0.012} />
      {[-1, 1].map((side) => (
        <Box key={side} p={[x + side * width * 0.34, 0.4, depth * 0.37]} s={[0.025, 0.42, 0.04]} c={steel} r={0.006} />
      ))}
    </>
  );
}

function CoffeeModule({ tier, width, depth }: { tier: number; width: number; depth: number }) {
  const machineWidth = width * 0.32;
  const machineZ = depth * 0.04;
  return (
    <group>
      <KitchenCounter width={width * 0.9} depth={depth} />
      <Box p={[0, 1.13, machineZ]} s={[machineWidth, 0.62, depth * 0.35]} c={charcoal} r={0.035} />
      <Box p={[0, 1.13, depth * 0.23]} s={[machineWidth * 0.72, 0.25, 0.02]} c={ink} r={0.01} />
      <Cylinder p={[0, 0.91, depth * 0.24]} r={machineWidth * 0.16} h={0.08} c={paper} />
      <Cylinder p={[0, 0.99, depth * 0.24]} r={machineWidth * 0.11} h={0.02} c="#4a3528" />
      {tier >= 1 && (
        <>
          <Box p={[-width * 0.27, 1.02, machineZ]} s={[width * 0.15, 0.25, depth * 0.28]} c={steel} r={0.025} />
          <Cylinder p={[-width * 0.27, 1.18, depth * 0.06]} r={width * 0.055} h={0.22} c={ink} />
          <Cylinder p={[width * 0.26, 0.91, depth * 0.24]} r={width * 0.08} h={0.06} c={paper} />
          <Cylinder p={[width * 0.26, 0.98, depth * 0.24]} r={width * 0.05} h={0.018} c="#4a3528" />
        </>
      )}
      {tier >= 2 && (
        <>
          <Box p={[0, 1.73, -depth * 0.22]} s={[width * 0.78, 0.06, depth * 0.12]} c={navy} r={0.01} />
          <Box p={[-width * 0.26, 1.42, -depth * 0.2]} s={[width * 0.18, 0.45, depth * 0.08]} c={wood} r={0.02} />
          <Box p={[width * 0.26, 1.43, -depth * 0.2]} s={[width * 0.18, 0.46, depth * 0.08]} c={wood} r={0.02} />
          {[-width * 0.26, width * 0.26].map((x) => (
            <Cylinder key={x} p={[x, 1.7, -depth * 0.2]} r={width * 0.05} h={0.12} c={yellow} />
          ))}
        </>
      )}
    </group>
  );
}

function Fridge({ x, width, depth }: { x: number; width: number; depth: number }) {
  const fridgeWidth = width * 0.3;
  const fridgeDepth = depth * 0.68;
  const frontZ = depth * 0.31;
  return (
    <group>
      <Box p={[x, 0.91, -depth * 0.02]} s={[fridgeWidth, 1.82, fridgeDepth]} c={paper} r={0.035} />
      <Box p={[x, 1.2, frontZ]} s={[fridgeWidth * 0.82, 1.12, 0.025]} c="#dfe2dd" r={0.018} />
      <Box p={[x, 0.56, frontZ]} s={[fridgeWidth * 0.82, 0.05, 0.03]} c={steel} r={0.006} />
      <Box p={[x + fridgeWidth * 0.3, 1.17, frontZ + 0.025]} s={[0.025, 0.56, 0.025]} c={steel} r={0.006} />
      <Box p={[x + fridgeWidth * 0.29, 1.25, frontZ + 0.03]} s={[0.012, 0.28, 0.012]} c={ink} r={0.003} />
      <Box p={[x, 0.23, -depth * 0.02]} s={[fridgeWidth * 0.84, 0.05, fridgeDepth * 0.84]} c={charcoal} r={0.012} />
    </group>
  );
}

function FoodModule({ tier, width, depth }: { tier: number; width: number; depth: number }) {
  const fridgeX = -width * 0.27;
  const prepX = width * 0.2;
  const prepWidth = width * (tier === 0 ? 0.3 : 0.47);
  return (
    <group>
      <Fridge x={fridgeX} width={width} depth={depth} />
      {tier >= 0 && (
        <>
          <KitchenCounter width={prepWidth} depth={depth} x={prepX} color={warmPaper} />
          <Box p={[prepX, 0.88, depth * 0.25]} s={[prepWidth * 0.7, 0.06, depth * 0.16]} c={paper} r={0.018} />
          <Cylinder p={[prepX - prepWidth * 0.2, 0.93, depth * 0.28]} r={0.06} h={0.06} c={orange} />
          <Cylinder p={[prepX + prepWidth * 0.18, 0.93, depth * 0.28]} r={0.06} h={0.06} c={green} />
        </>
      )}
      {tier >= 2 && (
        <>
          <Box p={[prepX, 0.9, -depth * 0.17]} s={[prepWidth * 0.56, 0.035, depth * 0.34]} c={ink} r={0.008} />
          <Cylinder p={[prepX - prepWidth * 0.16, 0.93, -depth * 0.17]} r={0.065} h={0.04} c={steel} />
          <Cylinder p={[prepX + prepWidth * 0.16, 0.93, -depth * 0.17]} r={0.065} h={0.04} c={steel} />
          <Box p={[prepX, 1.75, -depth * 0.25]} s={[prepWidth * 0.92, 0.06, depth * 0.09]} c={steel} r={0.012} />
          <Box p={[prepX, 1.52, -depth * 0.21]} s={[prepWidth * 0.16, 0.42, depth * 0.08]} c={steel} r={0.012} />
          <Box p={[prepX, 1.64, -depth * 0.13]} s={[prepWidth * 0.28, 0.08, depth * 0.08]} c={paper} r={0.012} />
        </>
      )}
    </group>
  );
}

function renderFacility(id: FacilityId, tier: number, footprint: Footprint): ReactNode {
  if (id === 'rest') {
    if (tier === 0) return <RestNapPods footprint={footprint} />;
    if (tier === 1) return <RestMeditation footprint={footprint} />;
    return <RestClinic footprint={footprint} />;
  }
  if (id === 'play') {
    if (tier === 0) return <PlayPingPong footprint={footprint} />;
    if (tier === 1) return <PlayGamingRoom footprint={footprint} />;
    return <PlayExecutiveDining footprint={footprint} />;
  }
  if (id === 'life') {
    if (tier === 0) return <LifePetNook footprint={footprint} />;
    if (tier === 1) return <LifeCounseling footprint={footprint} />;
    if (tier === 2) return <LifeChildcare footprint={footprint} />;
    return <LifeHousing footprint={footprint} />;
  }
  if (tier === 0) return <GymStipend footprint={footprint} />;
  return <GymFloor footprint={footprint} />;
}

export function InstalledFacilityVisual({ id, tier, width, depth }: { id: string; tier: number; width: number; depth: number }) {
  if (!Object.prototype.hasOwnProperty.call(ASSET_IDS, id)) throw new Error(`Unknown installed facility id: ${id}`);
  assertTier(id, tier);
  const footprint = assertPositiveFootprint(width, depth);
  const assetId = ASSET_IDS[id as FacilityId][tier]!;
  const enclosed=id==='rest'||(id==='play'&&tier>0)||(id==='life'&&(tier===1||tier===2))||(id==='gym'&&tier===1);
  const kind=id==='rest'?(tier===2?'clinic':'quiet'):id==='gym'?'gym':id==='life'?'quiet':'recreation';
  return kit(assetId, <group>{enclosed&&<FacilityArchitecture width={width} depth={depth} kind={kind}/>} {renderFacility(id as FacilityId, tier, footprint)}</group>);
}

export function InstalledKitchen({ coffeeTier, foodTier, width = 3 }: { coffeeTier: number; foodTier: number; width?: number }) {
  assertKitchenTier('coffee', coffeeTier);
  assertKitchenTier('food', foodTier);
  const footprint = assertPositiveFootprint(width, KITCHEN_DEPTH);
  // The shell always has a small kitchenette. Purchased tiers replace their
  // matching module; -1 keeps the grounded kettle/fridge baseline in place.
  const modules = [
    { kind: 'coffee' as const, tier: coffeeTier >= 0 ? coffeeTier : 0, active: coffeeTier >= 0 },
    { kind: 'food' as const, tier: foodTier >= 0 ? foodTier : 0, active: foodTier >= 0 },
  ];
  const moduleWidth = footprint.width / modules.length;
  return (
    <group>
      {modules.map((module, index) => {
        const x = -footprint.width / 2 + moduleWidth * (index + 0.5);
        const moduleFootprint = { width: moduleWidth * 0.94, depth: footprint.depth };
        const fallback = module.kind === 'coffee'
          ? <CoffeeModule tier={module.tier} width={moduleFootprint.width} depth={moduleFootprint.depth} />
          : <FoodModule tier={module.tier} width={moduleFootprint.width} depth={moduleFootprint.depth} />;
        const assetId = module.active
          ? `facility_kitchen_${module.kind}_${module.tier}`
          : `facility_kitchen_base_${module.kind}`;
        return <group key={assetId} position={[x, 0, 0]}>{kit(assetId, fallback)}</group>;
      })}
    </group>
  );
}
