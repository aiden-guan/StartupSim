import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Vector3Tuple } from "three";
import { Bevel } from "../geometry/Bevel";
import { officeScale } from "../environment/officeScale";
import { assetUrl, KitOrGltf } from "../assets/useKitOrGltf";
import type { CityTheme, CityVegetation } from "./cityThemes";
import { cityThemeFor } from "./cityThemes";

export type ExteriorQuality = "low" | "medium" | "high";

/**
 * The front of the office is +Z in the current isometric scene.  These
 * dimensions are exported so a future camera or navigation integration can
 * reason about the same exterior clearances without reaching into JSX.
 */
export interface ExteriorBounds {
  officeMinX: number;
  officeMaxX: number;
  officeMinZ: number;
  officeMaxZ: number;
  frontEdge: number;
  backEdge: number;
  /** Inner edge of each side dressing strip. */
  sideInnerX: number;
  roadZ: number;
  roadWidth: number;
  roadSpan: number;
  clearance: number;
}

const EXTERIOR_CLEARANCE = 0.5;
const ROAD_DEPTH = 4.2;
const ROAD_OFFSET = 5.3;
const ROAD_WIDTH_EXTRA = 20;

function levelIndex(level: number) {
  return Math.max(0, Math.min(5, Math.floor(Number.isFinite(level) ? level : 0)));
}

export function exteriorBoundsFor(level: number): ExteriorBounds {
  const { width, depth } = officeScale(levelIndex(level));
  const halfWidth = width / 2;
  const frontEdge = depth / 2;
  const backEdge = -frontEdge;
  const roadWidth = width + ROAD_WIDTH_EXTRA;
  const roadZ = frontEdge + ROAD_OFFSET;
  return {
    officeMinX: -halfWidth,
    officeMaxX: halfWidth,
    officeMinZ: backEdge,
    officeMaxZ: frontEdge,
    frontEdge,
    backEdge,
    sideInnerX: halfWidth + 0.5,
    roadZ,
    roadWidth,
    roadSpan: roadWidth / 2 - 1.5,
    clearance: EXTERIOR_CLEARANCE,
  };
}

function qualityDetail(quality: ExteriorQuality) {
  return quality === "high" ? 1 : quality === "medium" ? 0.65 : 0.38;
}

function smoothStep(value: number) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}

function positiveModulo(value: number, modulus: number) {
  return ((value % modulus) + modulus) % modulus;
}

export type TransitState = "APPROACH" | "ARRIVE" | "DWELL" | "DEPART";

export interface TransitMotion {
  state: TransitState;
  progress: number;
  x: number;
  /** 0 is the road lane, 1 is the curb stop. */
  curb: number;
  rotationY: number;
  parked: boolean;
}

export type TransitExchangeDirection = "INBOUND" | "OUTBOUND";

export interface TransitExchangeMotion {
  visible: boolean;
  progress: number;
  /** 0 is beside the vehicle, 1 is at the office entrance. */
  path: number;
}

export const TRANSIT_TIMING = {
  approach: 7,
  arrive: 2,
  dwell: 6,
  depart: 7,
} as const;

export const TRANSIT_CYCLE_SECONDS =
  TRANSIT_TIMING.approach + TRANSIT_TIMING.arrive + TRANSIT_TIMING.dwell + TRANSIT_TIMING.depart;

/**
 * Pure, deterministic transit motion.  The rendered vehicle uses the same
 * phase math directly in useFrame so no object is allocated on animation
 * frames. This helper stays exported for tests and preview tooling.
 */
export function transitMotionAt(seconds: number, span: number, reducedMotion = false, output?: TransitMotion): TransitMotion {
  const result=output ?? {state:'DWELL',progress:1,x:0,curb:1,rotationY:0,parked:true};
  const safeSpan=Math.max(2,Number.isFinite(span)?span:2);
  const t=positiveModulo(Number.isFinite(seconds)?seconds:0,TRANSIT_CYCLE_SECONDS);
  const arriveEnd=TRANSIT_TIMING.approach+TRANSIT_TIMING.arrive;
  const dwellEnd=arriveEnd+TRANSIT_TIMING.dwell;
  result.parked=reducedMotion;result.rotationY=0;
  if(reducedMotion || (t>=arriveEnd&&t<dwellEnd)) {
    result.state='DWELL';result.progress=1;result.x=0;result.curb=1;
  } else if(t<TRANSIT_TIMING.approach) {
    result.state='APPROACH';result.progress=smoothStep(t/TRANSIT_TIMING.approach);
    result.x=-safeSpan+(safeSpan-3)*result.progress;result.curb=0;
  } else if(t<arriveEnd) {
    result.state='ARRIVE';result.progress=smoothStep((t-TRANSIT_TIMING.approach)/TRANSIT_TIMING.arrive);
    result.x=-3+3*result.progress;result.curb=result.progress;
  } else {
    result.state='DEPART';result.progress=smoothStep((t-dwellEnd)/TRANSIT_TIMING.depart);
    result.x=safeSpan*result.progress;result.curb=1-smoothStep(Math.min(1,result.progress*4));
  }
  return result;
}

/** Passenger timing within the vehicle dwell. Inbound workers clear the curb
 * first, then outbound workers cross the same path back to the vehicle. */
export function transitExchangeAt(
  seconds: number,
  direction: TransitExchangeDirection,
  index: number,
  count: number,
  reducedMotion = false,
  output?: TransitExchangeMotion,
): TransitExchangeMotion {
  const result=output??{visible:false,progress:0,path:0};
  const safeIndex=Math.max(0,Math.floor(index));
  const safeCount=Math.max(1,Math.floor(count));
  if(reducedMotion) {
    result.visible=safeIndex===0;
    result.progress=.5;
    result.path=direction==="INBOUND" ? .62 : .38;
    return result;
  }
  const t=positiveModulo(Number.isFinite(seconds)?seconds:0,TRANSIT_CYCLE_SECONDS);
  const dwellStart=TRANSIT_TIMING.approach+TRANSIT_TIMING.arrive;
  const dwellEnd=dwellStart+TRANSIT_TIMING.dwell;
  if(t<dwellStart||t>=dwellEnd) {
    result.visible=false;result.progress=0;result.path=direction==="INBOUND"?0:1;
    return result;
  }
  const dwell=(t-dwellStart)/TRANSIT_TIMING.dwell;
  const stagger=Math.min(.075,.22/Math.max(1,safeCount-1))*safeIndex;
  const start=(direction==="INBOUND" ? .02 : .48)+stagger;
  const end=Math.min(.98,(direction==="INBOUND" ? .47 : .93)+stagger);
  if(dwell<start||dwell>end) {
    result.visible=false;result.progress=dwell<start?0:1;result.path=direction==="INBOUND"?result.progress:1-result.progress;
    return result;
  }
  result.visible=true;
  result.progress=smoothStep((dwell-start)/Math.max(.01,end-start));
  result.path=direction==="INBOUND"?result.progress:1-result.progress;
  return result;
}

interface BlockProps {
  position: Vector3Tuple;
  size: Vector3Tuple;
  color: string;
  radius?: number;
}

function GroundBlock({ position, size, color, radius = 0.02 }: BlockProps) {
  return <Bevel position={position} size={size} color={color} radius={radius} />;
}

interface BuildingSpec {
  position: Vector3Tuple;
  size: Vector3Tuple;
  color: string;
  index: number;
}

function BuildingBlock({ theme, spec, quality }: { theme: CityTheme; spec: BuildingSpec; quality: ExteriorQuality }) {
  const [width, height, depth] = spec.size;
  const windowRows = quality === "high" ? Math.max(2, Math.floor(height / 1.05)) : quality === "medium" ? Math.max(1, Math.floor(height / 1.8)) : 0;
  const windowColumns = quality === "high" ? (theme.architecture === "dense" || theme.architecture === "japanese" ? 3 : 2) : 1;
  const windowWidth = Math.max(0.16, Math.min(0.42, (width - 0.5) / (windowColumns * 2.1)));
  const windowHeight = Math.min(0.25, Math.max(0.14, (height - 0.75) / Math.max(3, windowRows * 3)));
  const styleId = `exterior_city_building_${theme.architecture}`;
  const frontZ = depth / 2 + 0.018;
  const roofAccent = theme.buildingAccent;
  const visibleRows = Math.min(windowRows, 5);
  const visibleColumns = Math.min(windowColumns, 3);

  const fallback = (
    <group>
      <Bevel position={[0, height / 2, 0]} size={[width, height, depth]} color={spec.color} radius={0.045} />
      <Bevel position={[0, height + 0.055, 0]} size={[width * 0.9, 0.1, depth * 0.88]} color={roofAccent} radius={0.02} />
      {theme.architecture==='stone' && <>
        <mesh position={[0,height+.48,0]} rotation={[0,Math.PI/4,0]}><cylinderGeometry args={[width*.3,width*.5,.9,4]}/><meshStandardMaterial color={roofAccent} roughness={1}/></mesh>
        {[-.28,.28].map(x=><Bevel key={x} position={[width*x,height+1,-depth*.2]} size={[.2,.7,.25]} color={spec.color}/>)}
        {[.32,.64].map(y=><Bevel key={y} position={[0,height*y,frontZ]} size={[width+.12,.11,.17]} color="#e9decb"/>)}
      </>}
      {theme.architecture==='bay' && <>
        <mesh position={[0,height+.32,0]} rotation={[0,Math.PI/4,0]}><coneGeometry args={[width*.65,.65,4]}/><meshStandardMaterial color={roofAccent} roughness={1}/></mesh>
        <Bevel position={[0,height*.42,depth*.5]} size={[width*.45,height*.65,.45]} color={theme.plaza}/>
        {[.28,.48,.68].map(y=><Bevel key={y} position={[0,height*y,frontZ+.24]} size={[width*.32,.3,.04]} color={theme.window}/>)}
      </>}
      {(theme.architecture==='dense'||theme.architecture==='gulf'||theme.architecture==='northAmerican') && <>
        <Bevel position={[0,height+.65,0]} size={[width*.7,1.3,depth*.7]} color={spec.color}/>
        <Bevel position={[0,height+1.55,0]} size={[width*.42,.6,depth*.44]} color={theme.buildingAccent}/>
        {theme.architecture==='gulf'&&<Bevel position={[width*.23,height*.6,frontZ+.03]} size={[.18,height*1.18,.09]} color={theme.window}/>}
        {theme.architecture==='dense'&&<mesh position={[width*.22,height+2.15,0]}><cylinderGeometry args={[.33,.36,.65,8]}/><meshStandardMaterial color={roofAccent} roughness={1}/></mesh>}
      </>}
      {(theme.architecture==='japanese'||theme.architecture==='eastAsian') && <>
        <Bevel position={[0,.8,frontZ+.2]} size={[width*.82,1.4,.2]} color={theme.window}/>
        <Bevel position={[0,1.55,frontZ+.35]} size={[width*.9,.16,.65]} color={theme.vehicleAccent}/>
        {[-.3,.3].map(x=><group key={x}>
          <Bevel position={[width*x,height*.63,frontZ+.12]} size={[.37,height*.46,.16]} color={x<0?theme.plaza:theme.vehicleAccent}/>
          {[.48,.59,.7,.81].map(y=><Bevel key={y} position={[width*x,height*y,frontZ+.21]} size={[.2,.05,.02]} color={x<0?theme.buildingAccent:theme.plaza}/>)}
        </group>)}
      </>}
      {(theme.architecture==='tropical'||theme.architecture==='tech') && <>
        {[.3,.64,1].map(y=><group key={y}>
          <Bevel position={[0,height*y,frontZ+.12]} size={[width*1.04,.22,.6]} color={theme.plaza}/>
          <Bevel position={[0,height*y+.18,frontZ+.12]} size={[width*.92,.2,.42]} color={theme.vegetationColor}/>
        </group>)}
      </>}
      {theme.architecture==='brick'&&[-.33,.33].map(x=><Bevel key={x} position={[width*x,height+.35,0]} size={[.38,.7,.38]} color={theme.buildingAccent}/>)}

      {theme.architecture === "dense" || theme.architecture === "japanese" || theme.architecture === "eastAsian" ? (
        <Bevel position={[0, height + 0.42, 0]} size={[0.08, 0.72, 0.08]} color={theme.buildingAccent} radius={0.01} />
      ) : null}
      {quality !== "low"
        ? Array.from({ length: visibleRows }, (_, row) =>
            Array.from({ length: visibleColumns }, (_, column) => {
              const x = (column - (visibleColumns - 1) / 2) * Math.min(0.62, width / Math.max(2, visibleColumns + 1));
              const y = 0.58 + row * Math.max(0.58, (height - 0.95) / Math.max(1, visibleRows));
              return <Bevel key={`${row}-${column}`} position={[x, y, frontZ]} size={[windowWidth, windowHeight, 0.035]} color={theme.window} radius={0.008} />;
            })
          )
        : null}
      {theme.signage !== "none" && spec.index % 2 === 0 ? (
        <Bevel
          position={[width * 0.24, Math.min(height * 0.68, 2.2), frontZ + 0.028]}
          size={[theme.signage === "vertical" ? 0.12 : 0.48, theme.signage === "vertical" ? 0.76 : 0.16, 0.035]}
          color={theme.vehicleAccent}
          radius={0.01}
        />
      ) : null}
      {theme.architecture === "brick" && quality !== "low" ? (
        <Bevel position={[0, height * 0.66, frontZ + 0.026]} size={[width * 0.84, 0.04, 0.04]} color={theme.buildingAccent} radius={0.004} />
      ) : null}
      {theme.architecture === "gulf" ? (
        <Bevel position={[0, height * 0.38, frontZ + 0.026]} size={[width * 0.7, 0.065, 0.04]} color={theme.vehicleAccent} radius={0.008} />
      ) : null}
    </group>
  );

  return (
    <group position={spec.position}>
      <KitOrGltf id={styleId} path={assetUrl("environments", `${styleId}.glb`)} fallback={fallback} />
    </group>
  );
}

function StreetTree({ kind, color, accent, scale = 1 }: { kind: CityVegetation; color: string; accent: string; scale?: number }) {
  if (kind === "palm") {
    return (
      <group scale={scale}>
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.12, 2.3, 7]} />
          <meshStandardMaterial color="#9b7953" roughness={0.95} />
        </mesh>
        {[-1, -0.45, 0, 0.45, 1].map((lean, index) => (
          <Bevel key={index} position={[lean * 0.27, 2.35 - Math.abs(lean) * 0.08, lean * 0.08]} rotation={[0.1 * lean, 0, lean * 0.48]} size={[0.09, 0.72, 0.18]} color={color} radius={0.04} />
        ))}
      </group>
    );
  }

  if (kind === "evergreen") {
    return (
      <group scale={scale}>
        <Bevel position={[0, 0.65, 0]} size={[0.14, 1.3, 0.14]} color="#76573f" radius={0.025} />
        <mesh position={[0, 1.45, 0]} castShadow>
          <coneGeometry args={[0.56, 2.2, 7]} />
          <meshStandardMaterial color={color} roughness={0.95} flatShading />
        </mesh>
        <mesh position={[0, 1.95, 0]} castShadow>
          <coneGeometry args={[0.39, 1.25, 7]} />
          <meshStandardMaterial color={accent} roughness={0.95} flatShading />
        </mesh>
      </group>
    );
  }

  if (kind === "cherryBlossom") {
    return (
      <group scale={scale}>
        <Bevel position={[0, 0.62, 0]} size={[0.13, 1.24, 0.13]} color="#5a4232" radius={0.025} />
        <mesh position={[0, 1.48, 0]} castShadow>
          <icosahedronGeometry args={[0.74, 1]} />
          <meshStandardMaterial color={color} roughness={0.94} flatShading />
        </mesh>
        <mesh position={[0.28, 1.35, 0.12]} castShadow>
          <icosahedronGeometry args={[0.48, 1]} />
          <meshStandardMaterial color={accent} roughness={0.94} flatShading />
        </mesh>
        <mesh position={[-0.24, 1.42, -0.1]} castShadow>
          <icosahedronGeometry args={[0.42, 1]} />
          <meshStandardMaterial color={accent} roughness={0.94} flatShading />
        </mesh>
      </group>
    );
  }

  const canopyScale = kind === "liveOak" ? 0.92 : kind === "lush" ? 0.75 : 0.64;
  return (
    <group scale={scale}>
      <Bevel position={[0, 0.58, 0]} size={[0.14, 1.16, 0.14]} color="#76573f" radius={0.025} />
      <mesh position={[0, 1.48, 0]} castShadow>
        <icosahedronGeometry args={[canopyScale, 1]} />
        <meshStandardMaterial color={color} roughness={0.96} flatShading />
      </mesh>
      {kind === "lush" || kind === "subtropical" ? (
        <mesh position={[0.32, 1.28, 0.08]} castShadow>
          <icosahedronGeometry args={[canopyScale * 0.58, 1]} />
          <meshStandardMaterial color={accent} roughness={0.96} flatShading />
        </mesh>
      ) : null}
    </group>
  );
}

function VegetationPiece({ theme, position, scale = 1 }: { theme: CityTheme; position: Vector3Tuple; scale?: number }) {
  const id = `exterior_city_vegetation_${theme.vegetation}`;
  return (
    <group position={position}>
      <KitOrGltf id={id} path={assetUrl("environments", `${id}.glb`)} fallback={<StreetTree kind={theme.vegetation} color={theme.vegetationColor} accent={theme.vegetationAccent} scale={scale} />} />
    </group>
  );
}

function StreetLamp({ position, accent }: { position: Vector3Tuple; accent: string }) {
  return (
    <group position={position}>
      <Bevel position={[0, 0.9, 0]} size={[0.08, 1.8, 0.08]} color="#3f474a" radius={0.018} />
      <Bevel position={[0.16, 1.82, 0]} size={[0.32, 0.07, 0.08]} color="#3f474a" radius={0.018} />
      <Bevel position={[0.3, 1.74, 0]} size={[0.12, 0.13, 0.12]} color={accent} radius={0.03} />
    </group>
  );
}

function TransitStop({ position, theme, premium }: { position: Vector3Tuple; theme: CityTheme; premium: boolean }) {
  return (
    <group position={position}>
      <Bevel position={[0, 0.65, 0]} size={[0.065, 1.3, 0.065]} color="#3e4b50" radius={0.01} />
      <Bevel position={[0, 1.3, 0]} size={[0.52, 0.22, 0.12]} color={premium?"#2b3e55":theme.vehicleAccent} radius={0.035} />
      <Bevel position={[0, 1.3, 0.065]} size={[premium ? .24 : .32, 0.055, 0.015]} color={premium?"#d3a34f":"#f1eee4"} radius={0.01} />
      <Bevel position={[0, 0.06, 0]} size={[1.35, 0.08, 0.55]} color={theme.sidewalk} radius={0.025} />
      <Bevel position={[0, 0.1, -0.2]} size={[1.05, 0.08, 0.06]} color={theme.buildingAccent} radius={0.01} />
    </group>
  );
}

function CityBackdrop({ theme, level, quality, bounds }: { theme: CityTheme; level: number; quality: ExteriorQuality; bounds: ExteriorBounds }) {
  const detail = qualityDetail(quality);
  const officeWidth = bounds.officeMaxX - bounds.officeMinX;
  const officeDepth = bounds.officeMaxZ - bounds.officeMinZ;
  const buildingCount = Math.max(3, Math.round((4 + level * 1.05) * theme.density * detail));
  const sideCount = Math.max(1, Math.round((1 + level * 0.55) * theme.density * detail));
  const buildings: BuildingSpec[] = [];

  for (let i = 0; i < buildingCount; i += 1) {
    const width = 3.3 + level*.95 + ((i * 17) % 7) * 0.3;
    const depth = 3 + level*.65 + ((i * 11) % 5) * 0.25;
    const baseHeight = 5.5 + level * 2.1;
    const height = Math.min(20, baseHeight * theme.heightScale * (0.78 + (i % 5) * 0.09));
    const span = officeWidth + 21;
    const x = -span / 2 + ((i + 0.75) * span) / (buildingCount + 1);
    const z = bounds.backEdge - depth / 2 - 1.55 - (i % 2) * 1.45;
    buildings.push({ position: [x, 0, z], size: [width, height, depth], color: theme.building[i % theme.building.length]!, index: i });
  }

  for (let i = 0; i < sideCount; i += 1) {
    const depth = 3 + level*.65 + ((i * 7) % 4) * 0.24;
    const width = 3.5 + level*.7 + ((i * 5) % 3) * 0.3;
    const height = Math.min(10, (4 + level * 0.8) * theme.heightScale * (0.84 + (i % 3) * 0.1));
    const side = i % 2 === 0 ? -1 : 1;
    const z = bounds.backEdge - 1 + (i % 3) * 4.7;
    const x = side * (Math.abs(bounds.officeMaxX) + width / 2 + 2.1);
    buildings.push({ position: [x, 0, z], size: [width, height, depth], color: theme.building[(i + buildingCount) % theme.building.length]!, index: i + buildingCount });
  }

  const vegetation: { position: Vector3Tuple; scale: number }[] = [];
  if (quality !== "low") {
    const count = Math.max(2, Math.round((theme.vegetation === "palm" || theme.vegetation === "lush" ? 6 : 4) * detail));
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const x = side * (Math.abs(bounds.officeMaxX) + 1.55 + (i % 3) * 0.62);
      const z = bounds.frontEdge + 0.95 + (i % 4) * 2.5;
      vegetation.push({ position: [x, 0, z], scale: theme.vegetation === "palm" ? 1.1+level*.14+(i%3)*.12 : 1+level*.1+(i%2)*.13 });
    }
    if (theme.vegetation === "evergreen" || theme.vegetation === "broadleaf") {
      vegetation.push({ position: [-officeWidth * 0.32, 0, bounds.backEdge - 0.7], scale: 0.76 });
      vegetation.push({ position: [officeWidth * 0.32, 0, bounds.backEdge - 0.7], scale: 0.76 });
    }
  }

  const frontGroundZ = bounds.frontEdge + 8.1;
  const backGroundZ = bounds.backEdge - 8.6;
  const sideGroundZ = (bounds.frontEdge + bounds.backEdge) / 2 + 2.2;
  const fallback = (
    <group name={`city-${theme.id}`}>
      {/* Ground is split into exterior bands so it never occupies the office footprint. */}
      <GroundBlock position={[0, -0.13, frontGroundZ]} size={[bounds.roadWidth + 4, 0.12, 13.8]} color={theme.ground} radius={0.04} />
      <GroundBlock position={[0, -0.13, backGroundZ]} size={[bounds.roadWidth + 18, 0.12, 16]} color={theme.ground} radius={0.04} />
      <GroundBlock position={[-Math.abs(bounds.officeMaxX) - 5, -0.13, sideGroundZ]} size={[9, 0.12, officeDepth + 18]} color={theme.ground} radius={0.04} />
      <GroundBlock position={[Math.abs(bounds.officeMaxX) + 5, -0.13, sideGroundZ]} size={[9, 0.12, officeDepth + 18]} color={theme.ground} radius={0.04} />

      {/* A legible pedestrian arrival path and planted verge join the building to the street. */}
      <GroundBlock position={[0,.025,bounds.frontEdge+1.6]} size={[2.2,.03,3.15]} color={theme.plaza}/>
      {quality!=='low'&&[-1,1].map(side=><group key={side} position={[side*(officeWidth*.3),0,bounds.frontEdge+1.1]}>
        <Bevel position={[0,.2,0]} size={[3.4,.4,.65]} color={theme.curb}/>
        <Bevel position={[0,.47,0]} size={[3.15,.18,.48]} color={theme.vegetationColor} radius={.08}/>
      </group>)}
      {/* Front arrival sequence: plaza -> sidewalk -> curb -> road. */}
      <GroundBlock position={[0, -0.03, bounds.frontEdge + 0.95]} size={[officeWidth + 3.2, 0.08, 1.9]} color={theme.plaza} radius={0.025} />
      <GroundBlock position={[0, -0.015, bounds.frontEdge + 2.15]} size={[bounds.roadWidth, 0.09, 1.65]} color={theme.sidewalk} radius={0.025} />
      <GroundBlock position={[0, 0.015, bounds.frontEdge + 3.18]} size={[bounds.roadWidth, 0.18, 0.22]} color={theme.curb} radius={0.035} />
      <GroundBlock position={[0, -0.005, bounds.roadZ]} size={[bounds.roadWidth, 0.12, ROAD_DEPTH]} color={theme.road} radius={0.02} />
      {[-0.28, 0.28].map((laneZ) => (
        <Bevel key={laneZ} position={[0, 0.062, bounds.roadZ + laneZ]} size={[bounds.roadWidth - 2.2, 0.025, 0.055]} color={theme.lane} radius={0.01} />
      ))}
      {theme.trafficSide === "left" ? (
        <Bevel position={[-bounds.roadWidth * 0.21, 0.07, bounds.roadZ]} size={[0.08, 0.028, ROAD_DEPTH - 0.45]} color={theme.lane} radius={0.01} />
      ) : (
        <Bevel position={[bounds.roadWidth * 0.21, 0.07, bounds.roadZ]} size={[0.08, 0.028, ROAD_DEPTH - 0.45]} color={theme.lane} radius={0.01} />
      )}

      {buildings.map((spec) => <BuildingBlock key={`${spec.position[0]}-${spec.position[2]}`} theme={theme} spec={spec} quality={quality} />)}
      {vegetation.map((item, index) => <VegetationPiece key={`${item.position[0]}-${item.position[2]}-${index}`} theme={theme} position={item.position} scale={item.scale} />)}

      {theme.slope > 0 ? (
        <group position={[0, 0, bounds.backEdge - 3.8]}>
          {[-1, 0, 1].map((step) => (
            <Bevel key={step} position={[step * (officeWidth * 0.28), 0.15 + Math.abs(step) * 0.18, 0]} size={[officeWidth * 0.34, 0.3 + Math.abs(step) * 0.36, 2.3]} color={theme.ground} radius={0.08} />
          ))}
        </group>
      ) : null}

      {quality !== "low" ? (
        <>
          <StreetLamp position={[-officeWidth * 0.4, 0, bounds.frontEdge + 2.42]} accent={theme.vehicleAccent} />
          <StreetLamp position={[officeWidth * 0.4, 0, bounds.frontEdge + 2.42]} accent={theme.vehicleAccent} />
        </>
      ) : null}
    </group>
  );

  return <KitOrGltf id={`exterior_city_${theme.id}`} path={assetUrl("environments", `exterior_city_${theme.id}.glb`)} fallback={fallback} />;
}

function TransitVehicleModel({ premium, theme, index = 0 }: { premium: boolean; theme: CityTheme; index?: number }) {
  const carColors=["#2b3e55","#58636a","#76543d"];
  const body = premium ? carColors[index%carColors.length]! : "#e7e2d6";
  const lower = premium ? "#1f2932" : "#2d4972";
  const accent = premium ? "#d3a34f" : theme.vehicleAccent;
  if(premium) return <group>
    <Bevel position={[0,.34,0]} size={[2.05,.46,.92]} color={body} radius={.14}/>
    <Bevel position={[-.18,.66,0]} size={[1.05,.42,.78]} color={body} radius={.12}/>
    <Bevel position={[-.18,.68,.405]} size={[.73,.25,.025]} color="#8fb2bd" radius={.025}/>
    <Bevel position={[.83,.36,0]} size={[.08,.18,.72]} color={accent} radius={.025}/>
    {[-.68,.68].flatMap(x=>[-.47,.47].map(z=><group key={`${x}-${z}`} position={[x,.2,z]}>
      <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.19,.19,.08,12]}/><meshStandardMaterial color="#25292d" roughness={.96}/></mesh>
      <mesh position={[0,0,z>0 ? .045 : -.045]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.075,.075,.085,10]}/><meshStandardMaterial color="#9aa2a4" roughness={.8}/></mesh>
    </group>))}
  </group>;
  return (
    <group>
      <Bevel position={[0, 0.54, 0]} size={[3.65, 0.88, 1.24]} color={body} radius={0.13} />
      <Bevel position={[0, 0.25, 0]} size={[3.5, 0.16, 1.26]} color={lower} radius={0.05} />
      <Bevel position={[-.42, 1.0, 0]} size={[2.25, 0.55, 1.08]} color={body} radius={0.1} />
      {[-1.08,-.42,.24].map(x=><Bevel key={x} position={[x,1.0,.552]} size={[.5,.31,.025]} color="#80a4af" radius={.02}/>)}
      <Bevel position={[.92,.72,.638]} size={[.58,.84,.035]} color="#d8dde0" radius={.025}/>
      <Bevel position={[0, 0.72, 0.646]} size={[3.0, 0.08, 0.035]} color={accent} radius={0.015} />
      {[-1.18, 1.18].flatMap((x) => [-.64,.64].map(z => (
        <group key={`${x}-${z}`} position={[x, 0.23, z]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.23, 0.23, 0.09, 12]} />
            <meshStandardMaterial color="#25292d" roughness={0.96} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.052]}>
            <cylinderGeometry args={[0.09, 0.09, 0.095, 10]} />
            <meshStandardMaterial color="#8e9799" roughness={0.85} />
          </mesh>
        </group>
      )))}
    </group>
  );
}

function TransitCommuter({bounds,premium,phaseOffset,direction,index,count,reducedMotion,stopOffset=0}:{
  bounds:ExteriorBounds;premium:boolean;phaseOffset:number;direction:TransitExchangeDirection;index:number;count:number;reducedMotion:boolean;stopOffset?:number;
}) {
  const root=useRef<Group>(null),leftLeg=useRef<Group>(null),rightLeg=useRef<Group>(null),leftArm=useRef<Group>(null),rightArm=useRef<Group>(null);
  const motion=useRef<TransitExchangeMotion>({visible:false,progress:0,path:0});
  useFrame(({clock})=>{
    const group=root.current;if(!group)return;
    const m=transitExchangeAt(clock.elapsedTime+phaseOffset,direction,index,count,reducedMotion,motion.current);
    group.visible=m.visible;
    if(!m.visible)return;
    const curbZ=bounds.frontEdge+3.72,doorZ=bounds.frontEdge+.16;
    const spread=(index-(count-1)/2)*(premium ? .2 : .38);
    const curbX=stopOffset+(premium ? .28 : .72)+spread,doorX=spread*.7;
    group.position.set(curbX+(doorX-curbX)*m.path,.03+(reducedMotion?0:Math.sin((clock.elapsedTime+phaseOffset)*9+index)*.025),curbZ+(doorZ-curbZ)*m.path);
    group.rotation.y=direction==="INBOUND"?Math.PI:0;
    const swing=reducedMotion?0:Math.sin((clock.elapsedTime+phaseOffset)*9+index)*.48;
    if(leftLeg.current)leftLeg.current.rotation.x=swing;
    if(rightLeg.current)rightLeg.current.rotation.x=-swing;
    if(leftArm.current)leftArm.current.rotation.x=-swing*.7;
    if(rightArm.current)rightArm.current.rotation.x=swing*.7;
  });
  const shirts=["#2b3e55","#b9654b","#5c8646","#d6aa52"];
  const shirt=shirts[(index+(direction==="OUTBOUND"?2:0))%shirts.length]!;
  return <group ref={root} visible={false}>
    <group ref={leftLeg} position={[-.09,.38,0]}><Bevel position={[0,-.19,0]} size={[.11,.42,.12]} color="#30343a" radius={.035}/></group>
    <group ref={rightLeg} position={[(.09),.38,0]}><Bevel position={[0,-.19,0]} size={[.11,.42,.12]} color="#30343a" radius={.035}/></group>
    <Bevel position={[0,.78,0]} size={[.36,.52,.24]} color={shirt} radius={.09}/>
    <group ref={leftArm} position={[-.23,.84,0]}><Bevel position={[0,-.16,0]} size={[.09,.38,.1]} color={shirt} radius={.035}/></group>
    <group ref={rightArm} position={[(.23),.84,0]}><Bevel position={[0,-.16,0]} size={[.09,.38,.1]} color={shirt} radius={.035}/></group>
    <mesh position={[0,1.17,0]} castShadow><sphereGeometry args={[.18,10,8]}/><meshStandardMaterial color={index%2?"#9a684c":"#c78f68"} roughness={.95}/></mesh>
  </group>;
}

function TransitVehicle({ tier, theme, bounds, reducedMotion, phaseOffset=0, index=0 }: { tier: 0 | 1; theme: CityTheme; bounds: ExteriorBounds; reducedMotion: boolean; phaseOffset?:number; index?:number }) {
  const ref = useRef<Group>(null);
  const premium = tier === 1;
  const vehicleId = premium ? "vehicle_privateTransit" : "vehicle_companyShuttle";
  const parkZ = bounds.roadZ;
  const curbZ = bounds.frontEdge + 4.05;
  const span = bounds.roadSpan;

  const motion=useRef<TransitMotion>({state:'DWELL',progress:1,x:0,curb:1,rotationY:0,parked:true});
  useFrame(({ clock }) => {
    const group=ref.current;
    if(!group)return;
    const m=transitMotionAt(clock.elapsedTime+phaseOffset,span,reducedMotion,motion.current);
    const parkedX=reducedMotion&&premium?(index-1)*2.6:m.x;
    group.position.set(parkedX,.055,parkZ+(curbZ-parkZ)*m.curb);
    group.rotation.y=m.rotationY;
  });

  return (
    <group ref={ref} position={[0, 0.055, curbZ]}>
      <KitOrGltf id={vehicleId} path={assetUrl("environments", `${vehicleId}.glb`)} fallback={<TransitVehicleModel premium={premium} theme={theme} index={index} />} />
    </group>
  );
}

function TransitCycle({tier,theme,bounds,reducedMotion,phaseOffset=0,index=0}:{tier:0|1;theme:CityTheme;bounds:ExteriorBounds;reducedMotion:boolean;phaseOffset?:number;index?:number}) {
  const premium=tier===1,inbound=premium?1:3,outbound=premium?1:2;
  const stopOffset=reducedMotion&&premium?(index-1)*2.6:0;
  return <>
    <TransitVehicle tier={tier} theme={theme} bounds={bounds} reducedMotion={reducedMotion} phaseOffset={phaseOffset} index={index}/>
    {Array.from({length:inbound},(_,passenger)=><TransitCommuter key={`in-${passenger}`} bounds={bounds} premium={premium} phaseOffset={phaseOffset} direction="INBOUND" index={passenger} count={inbound} reducedMotion={reducedMotion} stopOffset={stopOffset}/>)}
    {Array.from({length:outbound},(_,passenger)=><TransitCommuter key={`out-${passenger}`} bounds={bounds} premium={premium} phaseOffset={phaseOffset} direction="OUTBOUND" index={passenger} count={outbound} reducedMotion={reducedMotion} stopOffset={stopOffset}/>)}
  </>;
}

function TransitSystem({ tier, theme, bounds, reducedMotion }: { tier: number; theme: CityTheme; bounds: ExteriorBounds; reducedMotion: boolean }) {
  if (tier !== 0 && tier !== 1) return null;
  return (
    <group name="exterior-transit">
      <TransitStop position={[0, 0, bounds.frontEdge + 3.1]} theme={theme} premium={tier===1} />
      {tier===0
        ? <TransitCycle tier={0} theme={theme} bounds={bounds} reducedMotion={reducedMotion}/>
        : [0,1,2].map(index=><TransitCycle key={index} tier={1} theme={theme} bounds={bounds} reducedMotion={reducedMotion} phaseOffset={index*TRANSIT_CYCLE_SECONDS/3} index={index}/>)}
    </group>
  );
}

export interface ExteriorEnvironmentProps {
  level: number;
  locationId: string | null;
  /** -1 means no transit, 0 is company shuttle, and 1 is private premium transit. */
  transitTier: number;
  reducedMotion: boolean;
  quality: ExteriorQuality;
}

/** Render the bounded city frontage and optional transit system around an office. */
export function ExteriorEnvironment({ level, locationId, transitTier, reducedMotion, quality }: ExteriorEnvironmentProps) {
  const safeLevel = levelIndex(level);
  const theme = cityThemeFor(locationId);
  const bounds = exteriorBoundsFor(safeLevel);
  return (
    <group name="exterior-environment" userData={{ locationId: theme.id, theme: theme.name, level: safeLevel }}>
      <CityBackdrop theme={theme} level={safeLevel} quality={quality} bounds={bounds} />
      <TransitSystem tier={transitTier} theme={theme} bounds={bounds} reducedMotion={reducedMotion} />
    </group>
  );
}
