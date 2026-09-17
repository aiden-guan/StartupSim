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
];

function Framing({ propsMode }: { propsMode: boolean }) {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(propsMode ? 3.2 : 0, propsMode ? 2.5 : 1.95, propsMode ? 4.2 : 5.1);
    camera.lookAt(0, propsMode ? 0.65 : 0.92, 0);
  }, [camera, propsMode]);
  return null;
}

export function VisualGallery() {
  const [mode, setMode] = useState<'characters' | 'props'>('characters');
  const [index, setIndex] = useState(0);
  const propsMode = mode === 'props';
  const person = referenceLooks[index % referenceLooks.length]!;
  const asset = assets[index % assets.length]!;
  const Asset = asset.component;

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
          <button aria-pressed={!propsMode} onClick={() => { setMode('characters'); setIndex(0); }}>
            8 Founder characters
          </button>
          <button aria-pressed={propsMode} onClick={() => { setMode('props'); setIndex(0); }}>
            Office props ({assets.length})
          </button>
        </div>
        <p>Matte materials. Clean geometry. Consistent proportions.</p>
        <div className="studio-options">
          {(propsMode ? assets : referenceLooks).map((item, i) => (
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
          <Framing propsMode={propsMode} />
          {propsMode ? (
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
          <ContactShadows opacity={0.28} scale={8} blur={2.8} far={3} resolution={512} />
        </Canvas>
        <div className="studio-caption">
          <span className="eyebrow">{propsMode ? 'Office things' : `${person.role} • Front / 3/4`}</span>
          <h2>{propsMode ? asset.name : `${person.name} — ${person.role}`}</h2>
          <p>
            {propsMode
              ? 'Simple shapes. Clear silhouettes. Consistent style. Built from the same palette.'
              : 'Simple geometry. Consistent proportions. Easy to model. Game-ready.'}
          </p>
        </div>
      </section>
    </main>
  );
}
