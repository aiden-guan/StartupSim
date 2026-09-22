import { facilityFootprint, kitchenPlacement, loungePlacement } from '../facilities/facilityZones';
import type { OfficeLayout } from './layout';
import { officeScale } from '../environment/officeScale';
import { computeRackLayout, requestedComputeRacks } from '../environment/computeLayout';
import type { EnvironmentVisualState } from '../environment/environmentVisualState';

export interface NavigationObstacle {
  center: [number, number];
  halfSize: [number, number];
}

const obstacle = (x: number, z: number, halfX: number, halfZ: number): NavigationObstacle => ({
  center: [x, z],
  halfSize: [halfX, halfZ],
});

/**
 * Physical footprints used by the office renderer and the walking grid.
 * Keep these deliberately broader than the visible mesh: agents have a body,
 * not a point, and a little clearance keeps them from brushing screens/chairs.
 */
export function navigationObstacles(layout: OfficeLayout): NavigationObstacle[] {
  const desks = layout.points.filter((point) => point.kind === 'desk');
  const obstacles: NavigationObstacle[] = [...(layout.extraObstacles ?? [])];

  for (const desk of desks) {
    const [x, , z] = desk.position;
    obstacles.push(obstacle(x, z - 0.79, 0.82, 0.42));
  }

  // These props are rendered at the point's look position. Keep the activity
  // position itself reachable while blocking the furniture in front of it.
  for (const point of layout.points.filter((item) => !item.id.includes('-slot-'))) {
    const [x, , z] = point.look;
    if (point.kind === 'board') obstacles.push(obstacle(x, z, 1.05, 0.08));

    if (point.kind === 'lab') obstacles.push(obstacle(x, z, 0.92, 0.54));
    if (point.kind === 'server') obstacles.push(obstacle(x, z, 0.48, 0.42));
    if (point.kind === 'meet') obstacles.push(obstacle(x, z, 0.92, 0.42));
  }

  // Activity points are the walkable side of these props. Their larger
  // collision areas are covered by the static furniture below; treating the
  // whole hotspot as solid would box an agent out of its destination.

  if (layout.level === 0) {
    obstacles.push(
      obstacle(-4.45, 3.08, 1.28, 0.72), // sofa
      obstacle(-4.15, 1.9, 0.72, 0.55), // coffee table
      obstacle(-4.16, -4.08, 0.62, 0.48), // moving boxes
      obstacle(-5.38, 4.08, 0.52, 0.52),
      obstacle(4.65, -3.65, 0.58, 0.58),
    );
  } else {
    const { width, depth } = officeScale(layout.level);
    obstacles.push(
      obstacle(width / 2 - 1.1, -depth / 2 + 1.1, 0.62, 0.62),
      obstacle(-width / 2 + 1.1, -depth / 2 + 1.1, 0.62, 0.62),
    );

    if (layout.level === 2) {
      // The glass meeting room has two walls and an open side, not a solid
      // rectangle. Keep the walls physical while leaving the room reachable.
      obstacles.push(
        obstacle(width * 0.28 - 3.15, depth * 0.25 - 1, 0.08, 2.36),
        obstacle(width * 0.28, depth * 0.25 - 3.3, 3.25, 0.08),
      );
    }
    if (layout.level >= 4) {
      // Central planter and the long planted bed. The larger pale rectangle
      // around the planter is floor trim, not a solid object.
      obstacles.push(obstacle(0, depth * 0.14, width * 0.1, depth * 0.09));
      obstacles.push(obstacle(width * 0.33, depth * 0.31, 2.48, 1.94));
    }
    if (layout.level >= 5) {
      // Three workstation pods in the mega campus.
      for (let i = 0; i < 3; i += 1) {
        obstacles.push(obstacle(width * 0.23 + i * 3.4, depth * 0.34, 1.34, 1.3));
      }
    }
  }

  const kitchen = kitchenPlacement(layout.level);
  obstacles.push(obstacle(kitchen.anchor[0], kitchen.anchor[2], kitchen.depth/2, kitchen.width/2));
  if (layout.level > 0 && !(layout.level >= 2 && layout.facilities?.some(f => f.id === 'rest'))) {
    const [x,,z]=loungePlacement(layout.level);
    obstacles.push(obstacle(x,z,1.3,.75));
  }
  for (const facility of layout.facilities ?? []) {
    if (!facility.exterior) obstacles.push(facilityFootprint(facility));
  }
  return obstacles;
}

function addField(
  obstacles: NavigationObstacle[],
  anchor: [number, number],
  count: number,
  columns: number,
  gapX: number,
  gapZ: number,
  halfX: number,
  halfZ: number,
) {
  const safeCount = Math.max(0, Math.floor(count));
  const safeColumns = Math.max(1, Math.floor(columns));
  for (let i = 0; i < safeCount; i += 1) {
    const column = i % safeColumns;
    const row = Math.floor(i / safeColumns);
    obstacles.push(obstacle(anchor[0] + column * gapX, anchor[1] + row * gapZ, halfX, halfZ));
  }
}

/**
 * Collision footprints for the optional progression props. These are kept in
 * navigation space instead of reading rendered meshes so the agent route stays
 * deterministic and cheap. Only props that can occupy a walking lane are added.
 */
export function environmentObstacles(level: number, state: EnvironmentVisualState): NavigationObstacle[] {
  const safeLevel = Math.max(0, Math.min(5, Math.floor(level)));
  const { width, depth } = officeScale(safeLevel);
  const obstacles: NavigationObstacle[] = [];

  const computeX = width / 2 - (safeLevel >= 4 ? 8 : safeLevel >= 2 ? 5 : 1.5);
  const computeZ = -depth / 2 + (safeLevel >= 4 ? 7 : safeLevel >= 2 ? 3.3 : 2.2);
  if (state.computeTier > 0) {
    const rackLayout = computeRackLayout(safeLevel, requestedComputeRacks(state));
    obstacles.push(obstacle(
      computeX,
      computeZ,
      Math.max(0.9, rackLayout.columns * 0.51 + 0.38),
      // Leave the service side of the rack bank open; the server activity
      // point sits just beyond that face in the level-3 shell.
      Math.max(0.65, rackLayout.rows * 0.64 - 0.65),
    ));
    if (state.hasGpuCluster) obstacles.push(obstacle(computeX + (safeLevel >= 4 ? 2 : 1.5), computeZ, 0.75, 0.55));
    if (state.hasDataCenter) obstacles.push(obstacle(computeX + (safeLevel >= 3 ? 1.5 : 0), computeZ + (safeLevel >= 3 ? 3 : 2), 1.55, 0.8));
    if (state.hasCustomChip) obstacles.push(obstacle(computeX - 2, computeZ + (safeLevel >= 3 ? 5 : 2), 0.95, 0.65));
  }

  const labX = -width / 2 + (safeLevel >= 4 ? 8 : safeLevel >= 2 ? 4.6 : 2.2);
  const labZ = -depth / 2 + (safeLevel >= 4 ? 7 : safeLevel >= 2 ? 3.5 : 2.4);
  if (state.hasResearchLab) obstacles.push(obstacle(labX, labZ, 1.25, 1.05));
  if (state.hasFoundationModel) {
    obstacles.push(obstacle(labX + (safeLevel >= 3 ? 3.5 : 0), labZ + (safeLevel >= 3 ? 0 : 2), 1.05, 0.75));
    obstacles.push(obstacle(labX + (safeLevel >= 3 ? 4.8 : 1.2), labZ + (safeLevel >= 3 ? 1.1 : 2.4), 0.5, 0.5));
  }
  if (state.hasAutonomousLab) {
    // The lab activity point is authored at the near edge of this cell. Keep
    // that approach lane clear while still blocking the cell interior.
    obstacles.push(obstacle(labX + (safeLevel >= 3 ? 2 : 0), labZ + (safeLevel >= 3 ? 4 : 3), 1.9, 1.05));
  }

  const robotX = safeLevel === 1 ? 4.7 : width / 2 - (safeLevel >= 4 ? 15 : safeLevel >= 3 ? 9 : 3.5);
  const robotZ = safeLevel === 1 ? -4.7 : safeLevel >= 4 ? 2 : safeLevel >= 3 ? 3 : 0;
  if (state.roboticsTier > 0) obstacles.push(obstacle(robotX, robotZ, state.roboticsTier >= 2 ? 2.1 : 0.65, state.roboticsTier >= 2 ? 1.7 : 0.65));
  if (state.roboticsTier >= 2 && safeLevel >= 3) {
    addField(
      obstacles,
      [robotX + (safeLevel >= 5 ? -9 : safeLevel === 4 ? -5 : -2), robotZ + (safeLevel >= 5 ? -5 : safeLevel === 4 ? -4 : -2)],
      safeLevel >= 5 ? 8 : safeLevel === 4 ? 5 : 3,
      safeLevel === 4 ? 3 : 3,
      3.1,
      3.3,
      1.35,
      1.35,
    );
    addField(
      obstacles,
      [robotX + (safeLevel >= 5 ? -14 : safeLevel === 4 ? -6 : -3), robotZ + (safeLevel >= 5 ? 0 : safeLevel === 4 ? 2 : 4)],
      safeLevel >= 5 ? 24 : safeLevel === 4 ? 10 : 3,
      safeLevel >= 4 ? 5 : 3,
      2.6,
      2.8,
      1.05,
      0.85,
    );
  }

  const automationAnchor: [number, number] = safeLevel >= 5 ? [17, 13] : safeLevel === 4 ? [14, 9] : safeLevel === 3 ? [6.5, -2.5] : safeLevel === 2 ? [5.2, -0.5] : [0, 2];
  if (state.hasAgents) obstacles.push(obstacle(automationAnchor[0], automationAnchor[1], 1.1, 0.8));
  if (state.hasComputerUse && safeLevel >= 2 && safeLevel < 4) {
    addField(obstacles, [automationAnchor[0] + 2.1, automationAnchor[1]], 2, 2, 2, 1.3, 0.85, 0.75);
  }
  if (state.automationTier >= 1) obstacles.push(obstacle(automationAnchor[0], automationAnchor[1] - 1.8, 1.9, 0.35));
  if (state.automationTier >= 2 && safeLevel >= 3 && safeLevel < 4) {
    addField(obstacles, [automationAnchor[0], automationAnchor[1] + 2.5], 3, 3, 2, 2.25, 0.85, 0.75);
  }
  if (state.automationTier >= 3) {
    const local: [number, number] = safeLevel >= 4 ? [0, 8] : safeLevel === 2 ? [-1, 1.8] : [1, 2.5];
    obstacles.push(obstacle(automationAnchor[0] + local[0], automationAnchor[1] + local[1], 2.1, 1.65));
  }
  if (safeLevel >= 4 && state.automationTier >= 2) {
    const fieldAnchor: [number, number] = safeLevel >= 5 ? [17, 8] : [10, 11];
    const count = safeLevel >= 5 ? 12 : 8;
    const columns = Math.min(4, Math.ceil(Math.sqrt(count)));
    addField(obstacles, fieldAnchor, count, columns, 2.15, 2.25, 0.95, 0.8);
  }

  return obstacles;
}

export function pointInsideObstacle(x: number, z: number, item: NavigationObstacle, clearance = 0): boolean {
  return (
    Math.abs(x - item.center[0]) <= item.halfSize[0] + clearance &&
    Math.abs(z - item.center[1]) <= item.halfSize[1] + clearance
  );
}
