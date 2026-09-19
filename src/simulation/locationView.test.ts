import { describe, expect, it } from 'vitest';
import { createNewGame } from './newGame';
import { applyCommand } from './commands';
import { migrateGameState } from '../state/migrate';
import { selectWorldView } from '../game3d/selectWorldView';
import { locations } from '../data/locations';
const game = () => createNewGame({founderName:'Ada',companyName:'Atlas',cofounderId:'dustin-moskovitz',skipTutorial:true,seed:42});
describe('office travel',()=>{
  it('starts at home and rejects unknown or unowned cities',()=>{
    const g=game();
    expect(g.company.activeLocationId).toBeNull();
    for(const id of ['tokyo','unknown']) expect(applyCommand(g,{type:'setActiveLocation',locationId:id})!.company.activeLocationId).toBeNull();
  });
  it('preserves purchase effects and ownership, visits separately, and returns home',()=>{
    const g=game();g.company.cash=1e9;
    const loc=locations.find(l=>l.id==='tokyo')!;
    const bought=applyCommand(g,{type:'buyLocation',locationId:'tokyo'})!;
    expect(bought.company.cash).toBe(g.company.cash-loc.cost);
    expect(bought.company.locations).toEqual(['tokyo']);
    expect(bought.company.activeLocationId).toBeNull();
    const visiting=applyCommand(bought,{type:'setActiveLocation',locationId:'tokyo'})!;
    expect(visiting.company.activeLocationId).toBe('tokyo');
    expect({...visiting.company,activeLocationId:null}).toEqual(bought.company);
    expect(applyCommand(visiting,{type:'setActiveLocation',locationId:'unknown'})!.company.activeLocationId).toBe('tokyo');
    expect(applyCommand(visiting,{type:'setActiveLocation',locationId:null})!.company.activeLocationId).toBeNull();
    expect(applyCommand(bought,{type:'buyLocation',locationId:'tokyo'})!.company.cash).toBe(bought.company.cash);
  });
  it('normalizes old, unowned, malformed saves and keeps owned selection after JSON round trip',()=>{
    for(const id of [undefined,'unknown','tokyo',32]) {
      const g=game();Object.assign(g.company,{activeLocationId:id});
      expect(migrateGameState(g).company.activeLocationId).toBeNull();
    }
    const g=game();g.company.locations=['tokyo'];g.company.activeLocationId='tokyo';
    expect(migrateGameState(JSON.parse(JSON.stringify(g))).company.activeLocationId).toBe('tokyo');
  });
  it('derives city theme and transit without persisting visual state',()=>{
    const g=game();g.company.locations=['tokyo'];g.company.activeLocationId='tokyo';
    for(const tier of [-1,0,1]) {
      g.company.perks=tier<0?[]:[{id:'transit',level:tier}];
      const view=selectWorldView(g);expect(view.activeLocationId).toBe('tokyo');expect(view.transitTier).toBe(tier);expect(view.cityTheme).toBeDefined();
    }
    g.company.activeLocationId='bad';expect(selectWorldView(g).activeLocationId).toBeNull();
  });
});
