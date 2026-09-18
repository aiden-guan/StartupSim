import { describe, expect, it } from 'vitest';
import { apartmentLayout, campusLayout, garageLayout, labLayout, loftLayout, megaLayout } from './layout';
import { route } from './path';
import { navigationObstacles, pointInsideObstacle } from './obstacles';
import { officeScale } from '../environment/officeScale';
import { layoutFor } from './layout';

describe('Navigation Pathfinding (route)', () => {
  const layouts = [
    { name: 'Apartment', layout: apartmentLayout },
    { name: 'Garage', layout: garageLayout },
    { name: 'Loft', layout: loftLayout },
    { name: 'Lab', layout: labLayout },
    { name: 'Campus', layout: campusLayout },
    { name: 'Mega', layout: megaLayout },
  ];

  it.each(layouts)('computes reachable paths between major points in $name layout', ({ layout }) => {
    const points = layout.points.slice(0, 8);
    for (let i = 0; i < points.length; i++) {
      for (let j = 0; j < points.length; j++) {
        const from = points[i]!.position;
        const to = points[j]!.position;
        const path = route(from, to, layout);

        expect(Array.isArray(path)).toBe(true);
        expect(path.length).toBeGreaterThanOrEqual(1);

        // Path must end at the destination
        const destination = path[path.length - 1]!;
        expect(destination).toEqual(to);

        // Path nodes should have 0 Y (floor level)
        for (const node of path) {
          expect(node[1]).toBe(0);
          expect(Number.isFinite(node[0])).toBe(true);
          expect(Number.isFinite(node[2])).toBe(true);
        }
      }
    }
  });

  it('handles identical start and destination gracefully', () => {
    const pos: [number, number, number] = [1.5, 0, 2.0];
    const path = route(pos, pos, apartmentLayout);
    expect(path).toEqual([pos]);
  });

  it('skirts around blocked desk collision volumes', () => {
    const desk = apartmentLayout.points.find((p) => p.kind === 'desk')!;
    const chair = desk.position;
    // Target is on the other side of the desk
    const behindDesk: [number, number, number] = [chair[0], 0, chair[2] - 1.8];

    const path = route(chair, behindDesk, apartmentLayout);
    expect(path.length).toBeGreaterThan(1);
    expect(path[path.length - 1]).toEqual(behindDesk);

    // Verify intermediate path points do not pass through the core desk bounding box
    const deskCenterX = desk.position[0];
    const deskCenterZ = desk.position[2] - 0.8;
    for (let i = 1; i < path.length - 1; i++) {
      const pt = path[i]!;
      const dx = Math.abs(pt[0] - deskCenterX);
      const dz = Math.abs(pt[2] - deskCenterZ);
      const insideCoreDesk = dx < 0.75 && dz < 0.35;
      expect(insideCoreDesk).toBe(false);
    }
  });

  it('keeps activity routes outside static furniture footprints', () => {
    for (const layout of layouts.map(({ layout }) => layout)) {
      const entrance = layout.points.find((point) => point.kind === 'entrance')!;
      const obstacles = navigationObstacles(layout);
      for (const kind of ['coffee', 'board', 'lab', 'server'] as const) {
        const destination = layout.points.find((point) => point.kind === kind);
        if (!destination) continue;
        const path = route(entrance.position, destination.position, layout);
        expect(path.length).toBeGreaterThan(1);
        for (const node of path.slice(1, -1)) {
          expect(obstacles.some((item) => pointInsideObstacle(node[0], node[2], item, 0.3)), `${layout.id} ${kind} ${node.join(',')}`).toBe(false);
        }
      }
    }
  });

  it('safely falls back when target is unreachable without infinite loops', () => {
    const distantUnreachable: [number, number, number] = [9999, 0, 9999];
    const path = route([0, 0, 0], distantUnreachable, apartmentLayout);
    // Never send an agent through a wall or an off-floor target when no safe
    // route exists. The caller can retry after the office state changes.
    expect(path).toEqual([[0, 0, 0]]);
  });

  it('keeps generated activity points on their expanded floors with reachable hotspots',()=>{
    for(let level=0;level<=5;level++) {
      const layout=layoutFor(level),scale=officeScale(level);
      for(const point of layout.points) {
        expect(Math.abs(point.position[0])).toBeLessThan(scale.width/2);
        expect(Math.abs(point.position[2])).toBeLessThan(scale.depth/2);
      }
      const entrance=layout.points.find(p=>p.kind==='entrance')!;
      for(const kind of ['coffee','board','meet','lab','server'] as const) {
        const point=layout.points.find(p=>p.kind===kind);
        if(!point)continue;
        const path=route(entrance.position,point.position,layout);
        expect(path.length, `level ${level} ${kind}`).toBeGreaterThan(2);
        expect(path.at(-1)).toEqual(point.position);
      }
    }
  });
});
