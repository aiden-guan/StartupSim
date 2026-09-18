import { createNewGame } from '../../simulation/newGame';
import { createProduct } from '../../simulation/products';
import { Rng } from '../../simulation/rng';
import { recipes } from '../../data/recipes';
import { perks } from '../../data/perks';
import { models } from '../../data/models';

/** Local, unsaved fixture for visual and interaction QA. Never imported by gameplay rendering. */
export function createEnvironmentPreviewGame(level:number) {
  const stage=Math.max(0,Math.min(5,Math.floor(level)));
  const game=createNewGame({founderName:'Ada',companyName:'StartupSim',cofounderId:'dustin-moskovitz',seed:42,skipTutorial:true});
  game.company.officeLevel=stage;
  game.settings.autosave=false;
  for(const key of Object.keys(game.unlocks) as (keyof typeof game.unlocks)[])game.unlocks[key]=true;
  game.ownedModels=models.map((model)=>model.id);
  game.company.perks=stage===0?[]:[
    {id:'coffee',level:Math.min(2,stage-1)},
    {id:'desks',level:0},
    ...(stage>=2?[{id:'food',level:0},{id:'play',level:2}]:[]),
  ];
  if(stage===3)game.providerOutages=[{provider:'Macrosoft',startedTick:game.clock.tick,untilTick:game.clock.tick+5}];
  const original=[...game.employees];
  game.employees=Array.from({length:[2,7,20,35,75,150][stage]!},(_,i)=>({...original[i%2]!,id:`preview-${i}`,role:i>=2?(stage>=5&&i%17===0?'robot':'employee'):original[i]!.role}));
  game.compute.rentedGpus=stage>=1?3:0;
  game.compute.ownedCluster=stage>=2?stage*4:0;
  game.compute.dataCenters=stage>=4?1:0;
  game.compute.customChips=stage>=5?1:0;
  game.company.specialProjects=['gpu-cluster','research-lab','foundation-model','autonomous-lab','robot-line','general-robot','data-center','custom-chip','automate-ceo'].filter((_,i)=>i<Math.max(0,stage*2-1));
  game.company.technologies=['agents','computer-use','robotics','autonomous-corp'].filter((_,i)=>i<Math.max(0,stage-1));
  game.company.verticals=['consumer','developer','hardware','robotics'];
  for(const key of Object.keys(game.company.automation) as (keyof typeof game.company.automation)[])game.company.automation[key]=Math.round(stage*1.5)*10;
  game.company.ceoAutomated=stage===5;
  game.company.hype=stage>=4?68:12;
  game.company.cash=100_000_000;
  if(import.meta.env.DEV && typeof window !== 'undefined') {
    const params=new URLSearchParams(window.location.search);
    const recipe=recipes.find(r=>r.id===params.get('artifact'));
    if(recipe) {
      const product=createProduct(game,...recipe.parts,new Rng(42));
      product.status='ready';
      game.products=[product];
    }
    const tier=params.get('cultureTier');
    if(tier!==null) game.company.perks=perks.map(p=>({id:p.id,level:Math.min(p.upgrades.length-1,Math.max(0,Number(tier)||0))})).filter(p=>perks.find(def=>def.id===p.id)!.upgrades[p.level]!.requiredOffice<=stage);
  }
  return game;
}
