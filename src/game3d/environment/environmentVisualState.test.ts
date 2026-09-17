import { describe, expect, it } from 'vitest';
import { createNewGame } from '../../simulation/newGame';
import { offices } from '../../data/offices';
import { layoutFor } from '../navigation/layout';
import { deriveEnvironmentVisualState } from './environmentVisualState';
import { OFFICE_SCALE, officeScale } from './officeScale';
import { selectWorldView } from '../selectWorldView';

const game=()=>createNewGame({founderName:'Ada',companyName:'Northstar',cofounderId:'reya',seed:42,skipTutorial:true});

describe('office presentation scale',()=>{
  it('grows the physical footprint and camera with the existing office levels',()=>{
    for(let i=0;i<offices.length;i++) {
      const scale=officeScale(i),camera=layoutFor(i).camera;
      expect(scale.width*scale.depth).toBeGreaterThan(i===0?0:OFFICE_SCALE[i-1]!.width*OFFICE_SCALE[i-1]!.depth);
      expect(camera.overview).toEqual(scale.camera);
      expect(camera.max).toBeGreaterThan(Math.hypot(...scale.camera)*.9);
    }
    expect(officeScale(5).width*officeScale(5).depth).toBeGreaterThan(officeScale(0).width*officeScale(0).depth*40);
    expect(offices.map(o=>o.capacity)).toEqual([6,12,48,120,400,2000]);
  });
});

describe('derived environment visuals',()=>{
  it('uses completed projects and existing compute counts',()=>{
    const g=game();
    expect(deriveEnvironmentVisualState(g).computeTier).toBe(0);
    g.compute.rentedGpus=2;
    expect(deriveEnvironmentVisualState(g).computeTier).toBe(1);
    g.compute.ownedCluster=4;
    expect(deriveEnvironmentVisualState(g).computeTier).toBe(2);
    g.company.specialProjects.push('gpu-cluster','research-lab','foundation-model','autonomous-lab');
    const v=deriveEnvironmentVisualState(g);
    expect(v.computeTier).toBe(3);
    expect([v.hasGpuCluster,v.hasResearchLab,v.hasFoundationModel,v.hasAutonomousLab]).toEqual([true,true,true,true]);
    g.compute.dataCenters=1;
    g.compute.customChips=1;
    expect(deriveEnvironmentVisualState(g)).toMatchObject({computeTier:4,hasDataCenter:true,hasCustomChip:true});
  });

  it('maps robotics, agents and automation thresholds without changing employees',()=>{
    const g=game();
    g.employees[1]!.role='robot';
    g.company.technologies.push('robotics','agents','computer-use');
    expect(deriveEnvironmentVisualState(g)).toMatchObject({robotWorkers:1,roboticsTier:1,hasAgents:true,hasComputerUse:true,automationTier:0});
    g.company.specialProjects.push('robot-line');
    expect(deriveEnvironmentVisualState(g).roboticsTier).toBe(2);
    g.company.specialProjects.push('general-robot');
    expect(deriveEnvironmentVisualState(g).roboticsTier).toBe(3);
    for(const key of Object.keys(g.company.automation) as (keyof typeof g.company.automation)[])g.company.automation[key]=35;
    expect(deriveEnvironmentVisualState(g).automationTier).toBe(1);
    for(const key of Object.keys(g.company.automation) as (keyof typeof g.company.automation)[])g.company.automation[key]=56;
    expect(deriveEnvironmentVisualState(g).automationTier).toBe(2);
    g.company.ceoAutomated=true;
    expect(deriveEnvironmentVisualState(g).automationTier).toBe(3);
    expect(g.employees).toHaveLength(2);
  });

  it('keeps late robot workers visible under the NPC render cap',()=>{
    const g=game();
    const template=g.employees[0]!;
    g.employees.push(...Array.from({length:30},(_,i)=>({...template,id:`human-${i}`,role:'employee' as const})));
    g.employees.push({...template,id:'late-robot',role:'robot'});
    const view=selectWorldView(g);
    expect(view.agents).toHaveLength(24);
    expect(view.agents.some(a=>a.id==='late-robot'&&a.role==='robot')).toBe(true);
    expect(view.hiddenCount).toBe(9);
  });

  it('derives pressure and stable, capped prominent verticals without persisting visuals',()=>{
    const g=game();
    g.company.verticals.push('finance','developer','health');
    g.company.expertise.finance=8;
    g.company.expertise.health=4;
    g.company.cash=1;
    g.employees[0]!.burnoutDays=5;
    const before=JSON.stringify(g);
    const a=deriveEnvironmentVisualState(g),b=deriveEnvironmentVisualState(g);
    expect(a.runwayPressure).toBe(true);
    expect(a.burnedOutWorkers).toBe(1);
    expect(a.prominentVerticals).toEqual(['finance','health']);
    expect(a.secondaryVerticals).toEqual(['consumer','developer']);
    expect(a).toEqual(b);
    expect(JSON.stringify(g)).toBe(before);
    expect('environment' in g).toBe(false);
  });
});
