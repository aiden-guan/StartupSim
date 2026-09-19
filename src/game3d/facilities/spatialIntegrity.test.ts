import { describe, expect, it } from 'vitest';
import { Fragment, isValidElement, type ReactElement, type ReactNode } from 'react';
import * as THREE from 'three';
import { perks } from '../../data/perks';
import { installedFacilities, kitchenPlacement } from './facilityZones';
import { InstalledFacilityVisual, InstalledKitchen } from './InstalledFacilityVisual';
import { DynamicEnvironment } from '../environment/DynamicEnvironment';
import type { EnvironmentVisualState } from '../environment/environmentVisualState';
import { officeScale } from '../environment/officeScale';

type Bounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

type MatrixProps = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
};

type GeometryElement = ReactElement<{ args?: readonly number[] }>;

const emptyBounds = (): Bounds => ({
  minX: Infinity,
  maxX: -Infinity,
  minY: Infinity,
  maxY: -Infinity,
  minZ: Infinity,
  maxZ: -Infinity,
});

function hasBounds(bounds: Bounds) {
  return Number.isFinite(bounds.minX);
}

function includePoint(bounds: Bounds, point: THREE.Vector3) {
  bounds.minX = Math.min(bounds.minX, point.x);
  bounds.maxX = Math.max(bounds.maxX, point.x);
  bounds.minY = Math.min(bounds.minY, point.y);
  bounds.maxY = Math.max(bounds.maxY, point.y);
  bounds.minZ = Math.min(bounds.minZ, point.z);
  bounds.maxZ = Math.max(bounds.maxZ, point.z);
}

function mergeBounds(target: Bounds, source: Bounds) {
  if (!hasBounds(source)) return;
  target.minX = Math.min(target.minX, source.minX);
  target.maxX = Math.max(target.maxX, source.maxX);
  target.minY = Math.min(target.minY, source.minY);
  target.maxY = Math.max(target.maxY, source.maxY);
  target.minZ = Math.min(target.minZ, source.minZ);
  target.maxZ = Math.max(target.maxZ, source.maxZ);
}

function transformBox(bounds: Bounds, matrix: THREE.Matrix4, min: THREE.Vector3, max: THREE.Vector3) {
  for (const x of [min.x, max.x]) {
    for (const y of [min.y, max.y]) {
      for (const z of [min.z, max.z]) {
        includePoint(bounds, new THREE.Vector3(x, y, z).applyMatrix4(matrix));
      }
    }
  }
}

function matrixFromProps(props: MatrixProps) {
  const position = new THREE.Vector3(...(props.position ?? [0, 0, 0]));
  const rotation = new THREE.Euler(...(props.rotation ?? [0, 0, 0]));
  const quaternion = new THREE.Quaternion().setFromEuler(rotation);
  const scale = props.scale === undefined
    ? new THREE.Vector3(1, 1, 1)
    : typeof props.scale === 'number'
      ? new THREE.Vector3(props.scale, props.scale, props.scale)
      : new THREE.Vector3(...props.scale);
  return new THREE.Matrix4().compose(position, quaternion, scale);
}

function geometryObjectBounds(geometry: unknown): [THREE.Vector3, THREE.Vector3] | undefined {
  if (!(geometry instanceof THREE.BufferGeometry)) return undefined;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  return box ? [box.min.clone(), box.max.clone()] : undefined;
}

function geometryElementBounds(element: GeometryElement): [THREE.Vector3, THREE.Vector3] | undefined {
  const args = element.props.args ?? [];
  switch (element.type) {
    case 'boxGeometry': {
      const [width = 0, height = 0, depth = 0] = args;
      return [new THREE.Vector3(-width / 2, -height / 2, -depth / 2), new THREE.Vector3(width / 2, height / 2, depth / 2)];
    }
    case 'cylinderGeometry': {
      const [top = 0, bottom = 0, height = 0] = args;
      const radius = Math.max(top, bottom);
      return [new THREE.Vector3(-radius, -height / 2, -radius), new THREE.Vector3(radius, height / 2, radius)];
    }
    case 'sphereGeometry': {
      const [radius = 0] = args;
      return [new THREE.Vector3(-radius, -radius, -radius), new THREE.Vector3(radius, radius, radius)];
    }
    case 'torusGeometry': {
      const [radius = 0, tube = 0] = args;
      return [new THREE.Vector3(-(radius + tube), -(radius + tube), -tube), new THREE.Vector3(radius + tube, radius + tube, tube)];
    }
    case 'planeGeometry': {
      const [width = 0, height = 0] = args;
      return [new THREE.Vector3(-width / 2, -height / 2, 0), new THREE.Vector3(width / 2, height / 2, 0)];
    }
    case 'circleGeometry': {
      const [radius = 0] = args;
      return [new THREE.Vector3(-radius, -radius, 0), new THREE.Vector3(radius, radius, 0)];
    }
    case 'icosahedronGeometry': {
      const [radius = 0] = args;
      return [new THREE.Vector3(-radius, -radius, -radius), new THREE.Vector3(radius, radius, radius)];
    }
    default:
      return undefined;
  }
}

function matrixWithLocal(parent: THREE.Matrix4, props: MatrixProps) {
  return parent.clone().multiply(matrixFromProps(props));
}

function appendKnownInstancedField(
  name: string,
  props: Record<string, unknown>,
  parent: THREE.Matrix4,
  bounds: Bounds,
) {
  const position: [number, number, number] = Array.isArray(props.position) ? props.position as [number, number, number] : [0, 0, 0];
  const matrix = matrixWithLocal(parent, { position });
  const columns = typeof props.columns === 'number' ? props.columns : 1;
  const rows = typeof props.rows === 'number' ? props.rows : 1;
  const count = Math.max(0, Math.floor(columns * rows));
  for (let index = 0; index < count; index += 1) {
    if (name === 'ServerField') {
      const x = (index % columns) * 1.08;
      const z = Math.floor(index / columns) * 1.35;
      transformBox(bounds, matrix, new THREE.Vector3(x - 0.41, 0, z - 0.33), new THREE.Vector3(x + 0.41, 1.76, z + 0.33));
    } else {
      const x = (index % columns) * 2.6;
      const z = Math.floor(index / columns) * 2.8;
      transformBox(bounds, matrix, new THREE.Vector3(x - 0.975, 0, z - 0.65), new THREE.Vector3(x + 0.975, 1.1, z + 0.65));
      const armMatrix = matrix.clone().multiply(matrixFromProps({ position: [x - 0.35, 1.25, z - 0.1], rotation: [0, 0, -0.35] }));
      transformBox(bounds, armMatrix, new THREE.Vector3(-0.085, -0.425, -0.085), new THREE.Vector3(0.085, 0.425, 0.085));
      transformBox(bounds, matrix, new THREE.Vector3(x - 0.26, 1.41, z - 0.29), new THREE.Vector3(x + 0.16, 1.69, z + 0.09));
    }
  }
}

function geometryFromMesh(element: ReactElement, children: ReactNode): [THREE.Vector3, THREE.Vector3] | undefined {
  const direct = geometryObjectBounds(element.props.geometry);
  if (direct) return direct;
  const childList = Array.isArray(children) ? children : [children];
  for (const child of childList) {
    if (isValidElement(child)) {
      const parsed = geometryElementBounds(child as GeometryElement);
      if (parsed) return parsed;
    }
  }
  return undefined;
}

function collectBounds(node: ReactNode, parent: THREE.Matrix4, bounds = emptyBounds(), leaves?: Bounds[]): Bounds {
  if (node === null || node === undefined || typeof node === 'boolean' || typeof node === 'string' || typeof node === 'number') return bounds;
  if (Array.isArray(node)) {
    for (const child of node) collectBounds(child, parent, bounds, leaves);
    return bounds;
  }
  if (!isValidElement(node)) return bounds;

  const element = node as ReactElement;
  const type = element.type;
  if (typeof type === 'function') {
    const name = type.name;
    if (name === 'ServerField' || name === 'MachineField') {
      const field = emptyBounds();
      appendKnownInstancedField(name, element.props as Record<string, unknown>, parent, field);
      mergeBounds(bounds, field);
      if (leaves && hasBounds(field)) leaves.push(field);
      return bounds;
    }
    const render = type as unknown as (props: Record<string, unknown>) => ReactNode;
    return collectBounds(render(element.props as Record<string, unknown>), parent, bounds, leaves);
  }
  if ((type as unknown) === (Fragment as unknown)) {
    return collectBounds(element.props.children, parent, bounds, leaves);
  }

  const local = matrixWithLocal(parent, element.props as MatrixProps);
  if (type === 'mesh' || type === 'instancedMesh') {
    const geometry = geometryFromMesh(element, element.props.children);
    if (geometry) {
      const leaf = emptyBounds();
      transformBox(leaf, local, geometry[0], geometry[1]);
      mergeBounds(bounds, leaf);
      if (leaves && hasBounds(leaf)) leaves.push(leaf);
    }
    return bounds;
  }
  if (type === 'group') collectBounds(element.props.children, local, bounds, leaves);
  return bounds;
}

function renderedBounds(node: ReactNode) {
  return collectBounds(node, new THREE.Matrix4());
}

function moveBounds(bounds: Bounds, position: [number, number, number], rotation = 0) {
  const moved = emptyBounds();
  const matrix = matrixFromProps({ position, rotation: [0, rotation, 0] });
  transformBox(
    moved,
    matrix,
    new THREE.Vector3(bounds.minX, bounds.minY, bounds.minZ),
    new THREE.Vector3(bounds.maxX, bounds.maxY, bounds.maxZ),
  );
  return moved;
}

function maxFeasiblePerks(level: number) {
  return perks.flatMap((perk) => {
    const tier = perk.upgrades.reduce((last, upgrade, index) => upgrade.requiredOffice <= level ? index : last, -1);
    return tier < 0 ? [] : [{ id: perk.id, level: tier }];
  });
}

function fullEnvironmentState(officeLevel: number): EnvironmentVisualState {
  return {
    officeLevel,
    employeeCount: 1000,
    officeCapacity: 1000,
    teamDensity: 1,
    robotWorkers: 20,
    burnedOutWorkers: 3,
    computeLoad: 1,
    computeTier: 4,
    rentedGpus: 64,
    ownedCluster: 64,
    dataCenters: 64,
    customChips: 64,
    hasGpuCluster: true,
    hasDataCenter: true,
    hasCustomChip: true,
    hasFoundationModel: true,
    hasResearchLab: true,
    hasAutonomousLab: true,
    roboticsTier: 3,
    hasAgents: true,
    hasComputerUse: true,
    automationAverage: 100,
    automationTier: 3,
    ceoAutomated: true,
    prominentVerticals: ['consumer', 'enterprise'],
    secondaryVerticals: ['developer', 'media', 'education', 'health', 'finance'],
    hypeTier: 2,
    runwayPressure: true,
    perks: maxFeasiblePerks(officeLevel),
  };
}

function overlapsIn3d(a: Bounds, b: Bounds, epsilon = 1e-6) {
  return a.minX < b.maxX - epsilon && a.maxX > b.minX + epsilon
    && a.minY < b.maxY - epsilon && a.maxY > b.minY + epsilon
    && a.minZ < b.maxZ - epsilon && a.maxZ > b.minZ + epsilon;
}

function hasSolidVolume(bounds: Bounds) {
  return bounds.maxY - bounds.minY > 0.08;
}

describe('procedural facility spatial integrity', () => {
  it('keeps every installed facility mesh inside its declared zone', () => {
    for (let level = 0; level < 6; level += 1) {
      for (const facility of installedFacilities(level, maxFeasiblePerks(level))) {
        if (facility.exterior) continue;
        const bounds = renderedBounds(InstalledFacilityVisual({
          id: facility.id,
          tier: facility.tier,
          width: facility.width,
          depth: facility.depth,
        }));
        expect(hasBounds(bounds), `${facility.id} level ${level} has no mesh bounds`).toBe(true);
        expect(bounds.minX).toBeGreaterThanOrEqual(-facility.width / 2 - 1e-5);
        expect(bounds.maxX).toBeLessThanOrEqual(facility.width / 2 + 1e-5);
        expect(bounds.minZ).toBeGreaterThanOrEqual(-facility.depth / 2 - 1e-5);
        expect(bounds.maxZ).toBeLessThanOrEqual(facility.depth / 2 + 1e-5);
      }
    }
  });

  it('keeps the installed kitchen mesh inside its true width and 1.25 depth', () => {
    for (let level = 0; level < 6; level += 1) {
      const placement = kitchenPlacement(level);
      for (const coffeeTier of [-1, 0, 1, 2]) {
        for (const foodTier of [-1, 0, 1, 2]) {
          const bounds = renderedBounds(InstalledKitchen({ coffeeTier, foodTier, width: placement.width }));
          if (!hasBounds(bounds)) continue;
          expect(bounds.minX).toBeGreaterThanOrEqual(-placement.width / 2 - 1e-5);
          expect(bounds.maxX).toBeLessThanOrEqual(placement.width / 2 + 1e-5);
          expect(bounds.minZ).toBeGreaterThanOrEqual(-1.25 / 2 - 1e-5);
          expect(bounds.maxZ).toBeLessThanOrEqual(1.25 / 2 + 1e-5);
        }
      }
    }
  });

  for (let level = 0; level < 6; level += 1) {
    it(`keeps level ${level} facilities clear of full-progression environment solids`, () => {
      const environment = renderedBounds(DynamicEnvironment({ state: fullEnvironmentState(level), quality: 'high' }));
      const { width, depth } = officeScale(level);
      expect(environment.minX).toBeGreaterThan(-width / 2 - 20);
      expect(environment.maxX).toBeLessThan(width / 2 + 20);
      expect(environment.minZ).toBeGreaterThan(-depth / 2 - 20);
      expect(environment.maxZ).toBeLessThan(depth / 2 + 20);

      for (const facility of installedFacilities(level, maxFeasiblePerks(level))) {
        if (facility.exterior) continue;
        const facilityBounds = moveBounds(renderedBounds(InstalledFacilityVisual({
          id: facility.id,
          tier: facility.tier,
          width: facility.width,
          depth: facility.depth,
        })), facility.anchor, facility.rotation);
        expect(hasBounds(facilityBounds), `${facility.id} level ${level} has no mesh bounds`).toBe(true);
        // Re-resolve each leaf separately so decorative floor trims do not turn into
        // false positives; only environment meshes with meaningful vertical volume
        // represent a solid object for this audit.
        const solids = collectSolidBounds(DynamicEnvironment({ state: fullEnvironmentState(level), quality: 'high' }));
        const collisions = solids.filter((solid) => overlapsIn3d(facilityBounds, solid));
        expect(collisions, `${facility.id} level ${level} intersects environment solids: ${JSON.stringify(collisions)}`).toHaveLength(0);
      }
    });
  }
});

function collectSolidBounds(node: ReactNode) {
  const leaves: Bounds[] = [];
  collectBounds(node, new THREE.Matrix4(), emptyBounds(), leaves);
  return leaves.filter(hasSolidVolume);
}
