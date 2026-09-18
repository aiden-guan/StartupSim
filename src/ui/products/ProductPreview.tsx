import { ContactShadows, OrthographicCamera } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useLayoutEffect } from 'react';
import { ProductArtifact, PrimitiveArtifact, QuestionMarkArtifact } from '../../game3d/props/ProductArtifact';
import { primitiveById } from '../../data/primitives';
import { findRecipe } from '../../data/recipes';
import { GameIcon } from '../shared/Icons';

function Aim() {
  const { camera } = useThree();
  useLayoutEffect(() => camera.lookAt(0, .72, 0), [camera]);
  return null;
}

export function ProductPreview({ a, b }: { a: string | null; b: string | null }) {
  const discovered = Boolean(a && b && findRecipe(a, b));
  const label = a && b
    ? discovered
      ? `${primitiveById[a]?.name ?? a} and ${primitiveById[b]?.name ?? b} product model`
      : `${primitiveById[a]?.name ?? a} and ${primitiveById[b]?.name ?? b} undiscovered combination`
    : a ? `${primitiveById[a]?.name ?? a} technology miniature` : 'Select two technologies to preview a product model';
  return <div className="product-model-preview" role="img" aria-label={label}>
    {a ? <Canvas shadows="basic" dpr={1} frameloop="demand" gl={{ antialias: true, powerPreference: 'low-power' }}>
      <color attach="background" args={['#e9e2d5']} />
      <OrthographicCamera makeDefault position={[3.4, 2.8, 4.8]} zoom={58} near={.1} far={50} />
      <Aim />
      <hemisphereLight args={['#fffaf0', '#9da9a5', 1.5]} />
      <ambientLight intensity={.45} />
      <directionalLight position={[-3, 6, 4]} intensity={2.2} castShadow shadow-mapSize={512} />
      {!b ? <PrimitiveArtifact id={a}/> : discovered ? <ProductArtifact key={[a, b].sort().join(':')} a={a} b={b} /> : <QuestionMarkArtifact key="undiscovered" />}
      <ContactShadows opacity={.26} scale={5} blur={2.6} far={4} resolution={256} />
    </Canvas> : <div className="product-model-empty" aria-hidden="true">
      <span><GameIcon name={a ?? 'products'} /></span>
      <i>+</i>
      <span><GameIcon name={b ?? 'products'} /></span>
    </div>}
    <span className="product-model-label" style={{fontSize:8, bottom:3, padding:3}}>{a && b ? discovered ? 'Catalog product' : 'Undiscovered combination · discovery pending' : a ? 'Technology miniature' : 'Select a pair to see its model'}</span>
  </div>;
}
