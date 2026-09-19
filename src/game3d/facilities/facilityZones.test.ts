import { describe,expect,it } from 'vitest';
import { perks } from '../../data/perks';
import { facilityFootprint,installedFacilities,kitchenPlacement } from './facilityZones';
import { layoutFor } from '../navigation/layout';
import { navigationObstacles,pointInsideObstacle } from '../navigation/obstacles';
import { officeScale } from '../environment/officeScale';
import { route } from '../navigation/path';
const maxPerks=(level:number)=>perks.flatMap(p=>{const tier=p.upgrades.reduce((last,u,i)=>u.requiredOffice<=level?i:last,-1);return tier<0?[]:[{id:p.id,level:tier}];});
const overlaps=(a:ReturnType<typeof facilityFootprint>,b:ReturnType<typeof facilityFootprint>)=>Math.abs(a.center[0]-b.center[0])<a.halfSize[0]+b.halfSize[0] && Math.abs(a.center[1]-b.center[1])<a.halfSize[1]+b.halfSize[1];
describe('semantic facility placement',()=>{
  for(let level=0;level<6;level++) {
    it(`keeps level ${level} facilities on floor, distinct, and clear of architecture/workstations/kitchen`,()=>{
      const facilities=installedFacilities(level,maxPerks(level));
      const layout={...layoutFor(level),facilities};
      const {width,depth}=officeScale(level);
      const base=navigationObstacles({...layout,facilities:[]});
      // The default lounge is intentionally replaced by the quiet room.
      const quiet=facilities.find(f=>f.id==='rest');
      const forbidden=base.filter(o=>!quiet || level===1 || !pointInsideObstacle(o.center[0],o.center[1],facilityFootprint(quiet)));
      for(const f of facilities) {
        expect(['coffee','food','desks','transit']).not.toContain(f.id);
        if(f.exterior){expect(f.id).toBe('life');expect(f.anchor[0]-f.width/2).toBeGreaterThan(width/2);continue;}
        expect(Math.abs(f.anchor[0])+f.width/2).toBeLessThan(width/2-.15);
        expect(Math.abs(f.anchor[2])+f.depth/2).toBeLessThan(depth/2-.15);
        for(const o of forbidden) expect(overlaps(facilityFootprint(f),o),`${f.id} against ${JSON.stringify(o)}`).toBe(false);
        for(const other of facilities.filter(o=>o.id!==f.id)) expect(overlaps(facilityFootprint(f),facilityFootprint(other))).toBe(false);
        for(const p of layout.points) expect(pointInsideObstacle(p.position[0],p.position[2],facilityFootprint(f),.3),`${f.id} blocks ${p.id}`).toBe(false);
      }
      const kitchen=kitchenPlacement(level);
      expect(Math.abs(kitchen.anchor[0])+kitchen.depth/2).toBeLessThan(width/2);
      expect(Math.abs(kitchen.anchor[2])+kitchen.width/2).toBeLessThan(depth/2);
    });
    it(`routes workers to every activity around full facilities at level ${level}`,()=>{
      const layout={...layoutFor(level),facilities:installedFacilities(level,maxPerks(level))};
      const entrance=layout.points.find(p=>p.kind==='entrance')!;
      for(const point of layout.points) {
        const path=route(entrance.position,point.position,layout);
        expect(path.at(-1),point.id).toEqual(point.position);
        for(const node of path.slice(0,-1)) for(const f of layout.facilities.filter(f=>!f.exterior)) expect(pointInsideObstacle(node[0],node[2],facilityFootprint(f),.3),`${point.id} crosses ${f.id}`).toBe(false);
      }
    });
  }
  it('places every feasible nonintegrated tier and never puts transit/desks/kitchen in a spare slot',()=>{
    for(let level=0;level<6;level++)for(const p of perks)for(let tier=0;tier<p.upgrades.length;tier++) {
      const list=installedFacilities(level,[{id:p.id,level:tier}]);
      expect(list.length).toBe(['coffee','food','desks','transit'].includes(p.id)||p.upgrades[tier]!.requiredOffice>level?0:1);
    }
  });
  it('reserves a neighborhood-sized exterior parcel for employee housing',()=>{
    for(const level of [4,5]) {
      const housing=installedFacilities(level,[{id:'life',level:3}])[0]!;
      expect(housing.exterior).toBe(true);
      expect(housing.width).toBeGreaterThanOrEqual(12);
      expect(housing.depth).toBeGreaterThanOrEqual(11);
    }
  });
});
