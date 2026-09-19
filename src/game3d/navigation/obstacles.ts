import { facilityFootprint, kitchenPlacement, loungePlacement } from '../facilities/facilityZones';
import type { OfficeLayout } from './layout';
import { officeScale } from '../environment/officeScale';

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
  const obstacles: NavigationObstacle[] = [];

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

export function pointInsideObstacle(x: number, z: number, item: NavigationObstacle, clearance = 0): boolean {
  return (
    Math.abs(x - item.center[0]) <= item.halfSize[0] + clearance &&
    Math.abs(z - item.center[1]) <= item.halfSize[1] + clearance
  );
}
