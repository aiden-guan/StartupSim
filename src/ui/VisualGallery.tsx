import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows } from '@react-three/drei';
import { useLayoutEffect, useState } from 'react';
import { Character } from '../game3d/characters/Character';
import { referenceLooks } from '../game3d/characters/ReferenceLooks';
import { useGame } from '../state/store';
import {
  BookStack,
  CardboardBox,
  Chair,
  CoffeeMachine,
  ConferenceBadge,
  Couch,
  Desk,
  Fridge,
  Headphones,
  Keyboard,
  Laptop,
  Monitor,
  Mug,
  Notebook,
  PizzaBox,
  Plant,
  RobotAssistant,
  ServerRack,
  Smartphone,
  Whiteboard,
} from '../game3d/props/Furniture';
import type { ComponentType } from 'react';
import type { Vector3Tuple } from 'three';
import { ChipBench, CoolingUnit, GpuShippingBox, ServerRackBank, ComputeStatusWall } from '../game3d/props/ComputeProps';
import { ResearchBench, RobotArm } from '../game3d/props/ResearchProps';
import { ChargingDock, GeneralRobot, RobotPrototype } from '../game3d/props/RoboticsProps';
import { AgentTerminal, AutonomyStatusWall } from '../game3d/props/AutonomyProps';
import { BadgeReader, MedicalCart, PressCamera } from '../game3d/props/VerticalProps';
import { selectWorldView } from '../game3d/selectWorldView';
import { createEnvironmentPreviewGame } from '../game3d/environment/devEnvironmentPreview';
import { Apartment } from '../game3d/environments/Apartment';
import { CampusOffice, GarageOffice, HQOffice, MegaCampus, ResearchLab } from '../game3d/environments/Offices';
import { DynamicEnvironment } from '../game3d/environment/DynamicEnvironment';
import { layoutFor } from '../game3d/navigation/layout';
import { offices } from '../data/offices';
import { perks } from '../data/perks';
import { promos } from '../data/promos';
import { models } from '../data/models';
import { PerkVisual } from '../game3d/props/PerkSet';
import { PromoVisual } from '../game3d/props/PromoVisuals';
import { CatalogAudit } from './visuals/CatalogAudit';
import { ModelVisual } from '../game3d/props/ModelVisuals';

const assets: { name: string; component: ComponentType<{ position: Vector3Tuple }>; offset?: number }[] = [
  { name: 'Laptop', component: Laptop },
  { name: 'Monitor', component: Monitor, offset: 0.35 },
  { name: 'Keyboard', component: Keyboard },
  { name: 'Office chair', component: Chair },
  { name: 'Desk', component: Desk },
  { name: 'Whiteboard', component: Whiteboard, offset: 1.35 },
  { name: 'Coffee machine', component: CoffeeMachine },
  { name: 'Potted plant', component: Plant },
  { name: 'Server rack', component: ServerRack, offset: 0.86 },
  { name: 'GPU shipping box', component: CardboardBox, offset: 0.2 },
  { name: 'Notebook', component: Notebook, offset: 0.02 },
  { name: 'Headphones', component: Headphones, offset: 0.08 },
  { name: 'Conference badge', component: ConferenceBadge, offset: 0.12 },
  { name: 'Smartphone', component: Smartphone, offset: 0.02 },
  { name: 'Pizza box', component: PizzaBox, offset: 0.04 },
  { name: 'Couch', component: Couch },
  { name: 'Stack of books', component: BookStack },
  { name: 'Robot assistant', component: RobotAssistant },
  { name: 'Coffee mug', component: Mug, offset: 0.06 },
  { name: 'Fridge', component: Fridge, offset: 0.67 },
  { name: 'GPU box', component: GpuShippingBox },
  { name: 'Rack bank', component: ServerRackBank },
  { name: 'Cooling unit', component: CoolingUnit },
  { name: 'Chip bench', component: ChipBench },
  { name: 'Research bench', component: ResearchBench },
  { name: 'Robot prototype', component: RobotPrototype },
  { name: 'General robot', component: GeneralRobot },
  { name: 'Charging dock', component: ChargingDock },
  { name: 'Robot arm', component: RobotArm },
  { name: 'Agent terminal', component: AgentTerminal },
  { name: 'Status wall', component: AutonomyStatusWall },
  { name: 'Compute status', component: ComputeStatusWall },
  { name: 'Press camera', component: PressCamera },
  { name: 'Badge reader', component: BadgeReader },
  { name: 'Medical cart', component: MedicalCart },
];

function previewState(level:number) {
  return selectWorldView(createEnvironmentPreviewGame(level));
}

function EnvironmentPreview({level}:{level:number}) {
  const view=previewState(level);
  const props={onObject:()=>undefined,perks:view.perks,brand:view.brand,visual:view.environment,quality:'medium' as const};
  const shell=level===0?<Apartment onObject={()=>undefined} perks={view.perks} brand={view.brand} employeeCount={view.environment.employeeCount}/>:level===1?<GarageOffice {...props}/>:level===2?<HQOffice {...props}/>:level===3?<ResearchLab {...props}/>:level===4?<CampusOffice {...props}/>:<MegaCampus {...props}/>;
  return <>{shell}<DynamicEnvironment state={view.environment} quality="medium"/></>;
}

function Framing({ mode, level }: { mode:'characters'|'props'|'environments'|'catalog';level:number }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    if(mode==='environments') {
      const layout=layoutFor(level);
      camera.position.set(...layout.camera.overview.map(n=>n*1.28) as Vector3Tuple);
      camera.lookAt(...layout.camera.target);
      camera.far=500;camera.updateProjectionMatrix();
    } else {
      const objectMode=mode==='props'||mode==='catalog';
      camera.position.set(objectMode?3.2:0,objectMode?2.5:1.95,objectMode?4.2:5.1);
      camera.lookAt(0,objectMode?.65:.92,0);
    }
  }, [camera, mode, level]);
  return null;
}

export function VisualGallery() {
  const [mode, setMode] = useState<'characters' | 'props' | 'environments' | 'catalog'>('characters');
  const [index, setIndex] = useState(0);
  const [audit, setAudit] = useState(false);
  if (import.meta.env.DEV && audit) return <CatalogAudit onBack={() => setAudit(false)}/>;
  const propsMode = mode === 'props';
  const person = referenceLooks[index % referenceLooks.length]!;
  const asset = assets[index % assets.length]!;
  const Asset = asset.component;
  const environmentMode=mode==='environments';
  const catalogMode=mode==='catalog';
  const catalogAssets=[
    ...perks.map((item)=>({kind:'perk' as const,id:item.id,name:`Culture · ${item.name}`,level:item.upgrades.length-1})),
    ...promos.map((item)=>({kind:'promo' as const,id:item.id,name:`Promotion · ${item.name}`})),
    ...models.map((item)=>({kind:'model' as const,id:item.id,name:`Model · ${item.name}`})),
  ];
  const catalogAsset=catalogAssets[index%catalogAssets.length]!;

  return (
    <main className="asset-studio">
      <header>
        <div>
          <span className="eyebrow">StartupSim / 3D Style Guide</span>
          <h1>Simple people. Big ideas.</h1>
        </div>
        <button onClick={() => useGame.getState().setGalleryOpen(false)}>Return to game →</button>
      </header>
      <aside>
        <div className="studio-tabs">
          <button aria-pressed={mode==='characters'} onClick={() => { setMode('characters'); setIndex(0); }}>
            8 Founder characters
          </button>
          <button aria-pressed={propsMode} onClick={() => { setMode('props'); setIndex(0); }}>
            Office props ({assets.length})
          </button>
          {import.meta.env.DEV&&<button aria-pressed={environmentMode} onClick={() => { setMode('environments'); setIndex(0); }}>
            Environment preview
          </button>}
          {import.meta.env.DEV&&<button aria-pressed={catalogMode} onClick={() => { setMode('catalog'); setIndex(0); }}>
            Choice visuals
          </button>}
        </div>
        <button onClick={() => setAudit(true)}>Full catalog audit</button>
        <p>Matte materials. Clean geometry. Consistent proportions.</p>
        <div className="studio-options">
          {(environmentMode?offices:catalogMode?catalogAssets:propsMode ? assets : referenceLooks).map((item, i) => (
            <button key={item.name} aria-pressed={index === i} onClick={() => setIndex(i)}>
              <small>{String(i + 1).padStart(2, '0')}</small>
              <div className="text-left">
                <div>{item.name}</div>
                {'role' in item && <div className="text-[10px] opacity-70">{(item as typeof person).role}</div>}
              </div>
            </button>
          ))}
        </div>
      </aside>
      <section className="studio-stage">
        <Canvas shadows camera={{ fov: 30, position: [0, 1.95, 5.1] }} dpr={[1, 2]}>
          <color attach="background" args={['#f1f2ef']} />
          <hemisphereLight args={['#fffaf3', '#c1c9d0', 1.5]} />
          <ambientLight intensity={0.45} />
          <directionalLight
            position={[-3, 6, 5]}
            intensity={2.4}
            castShadow
            shadow-mapSize={2048}
            shadow-normalBias={0.025}
          />
          <Framing mode={mode} level={index%offices.length}/>
          {environmentMode?<EnvironmentPreview level={index%offices.length}/> : catalogMode ? (
            catalogAsset.kind==='perk'?<PerkVisual perk={{id:catalogAsset.id,level:catalogAsset.level}}/>:catalogAsset.kind==='promo'?<PromoVisual id={catalogAsset.id}/>:<ModelVisual modelId={catalogAsset.id}/>
          ) : propsMode ? (
            <Asset position={[0, asset.offset ?? 0, 0]} />
          ) : (
            <>
              <group position={[-0.68, 0, 0]}>
                <Character look={person.look} preview />
              </group>
              <group position={[0.68, 0, 0]} rotation={[0, 0.6, 0]}>
                <Character look={person.look} preview />
              </group>
            </>
          )}
          {!environmentMode&&<ContactShadows opacity={0.28} scale={8} blur={2.8} far={3} resolution={512} />}
        </Canvas>
        <div className="studio-caption">
          <span className="eyebrow">{environmentMode?'DEV ONLY • progression preview':catalogMode?'DEV ONLY • choice visual registry':propsMode ? 'Office things' : `${person.role} • Front / 3/4`}</span>
          <h2>{environmentMode?offices[index%offices.length]!.name:catalogMode?catalogAsset.name:propsMode ? asset.name : `${person.name} — ${person.role}`}</h2>
          <p>
            {catalogMode
              ? 'The same procedural visual language used by management choices and the office.'
              : propsMode
              ? 'Simple shapes. Clear silhouettes. Consistent style. Built from the same palette.'
              : environmentMode ? 'A derived visual fixture for reviewing scale and company progression.'
              : 'Simple geometry. Consistent proportions. Easy to model. Game-ready.'}
          </p>
        </div>
      </section>
    </main>
  );
}
