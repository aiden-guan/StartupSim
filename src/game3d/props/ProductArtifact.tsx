import * as THREE from 'three';
import { Bevel } from '../geometry/Bevel';
import { Composition } from './products/Parts';
import type { Part } from './products/Parts';
import { recipeDesignFor, primitiveDesignFor, type ProductDesign } from './products/catalog';
const copper = '#d06a3c';

export function productArtifactSpec(a:string,b:string) {
  return { parts:[a,b].sort() as [string,string], design:recipeDesignFor(a,b) };
}
export function PrimitiveArtifact({id}:{id:string}) {
  return <Composition parts={primitiveDesignFor(id).parts}/>;
}
export function fallbackProductDesign(a: string, b: string): ProductDesign {
  const [first, second] = [a, b].sort() as [string, string];
  const pa = primitiveDesignFor(first);
  const pb = primitiveDesignFor(second);
  const parts: Part[] = [
    ...pa.parts.map((part) => ({
      ...part,
      at: [part.at[0] - 0.38, part.at[1] ?? 0, part.at[2]] as [number, number, number],
      scale: (part.scale ?? 1) * 0.75,
    })),
    ...pb.parts.map((part) => ({
      ...part,
      at: [part.at[0] + 0.38, part.at[1] ?? 0, part.at[2]] as [number, number, number],
      scale: (part.scale ?? 1) * 0.75,
    })),
  ];
  return { concept: `${pa.concept} + ${pb.concept}`, parts };
}
export function ProductArtifact({a,b,allowFallback=false}:{a:string;b:string;allowFallback?:boolean}) {
  const design=recipeDesignFor(a,b) ?? (allowFallback ? fallbackProductDesign(a,b) : undefined);
  return design ? <Composition parts={design.parts}/> : <QuestionMarkArtifact/>;
}

// A broad, extruded glyph: legible at thumbnail size, with a real front face
// and softly beveled edges instead of a bent tube. Shared across previews.
const questionShape = new THREE.Shape();
questionShape.moveTo(-.42, .91);
questionShape.bezierCurveTo(-.4, 1.24, -.18, 1.4, .12, 1.4);
questionShape.bezierCurveTo(.45, 1.4, .62, 1.23, .62, .97);
questionShape.bezierCurveTo(.62, .76, .51, .64, .32, .53);
questionShape.bezierCurveTo(.19, .45, .16, .4, .16, .27);
questionShape.lineTo(-.09, .27);
questionShape.bezierCurveTo(-.09, .52, -.02, .61, .18, .74);
questionShape.bezierCurveTo(.33, .83, .36, .89, .36, .99);
questionShape.bezierCurveTo(.36, 1.1, .27, 1.16, .12, 1.16);
questionShape.bezierCurveTo(-.04, 1.16, -.14, 1.08, -.16, .91);
questionShape.closePath();
const questionGeometry = new THREE.ExtrudeGeometry(questionShape, {
  depth:.12, bevelEnabled:true, bevelThickness:.025,
  bevelSize:.025, bevelSegments:1, steps:1, curveSegments:8,
});

/** A sealed concept token. No ingredient-specific imagery leaks the discovery. */
export function QuestionMarkArtifact() {
  return <group rotation={[0,.3,0]}>
    <Bevel position={[0,.08,0]} size={[1.58,.16,.86]} color="#c89e6e" radius={.045}/>
    <Bevel position={[0,.18,-.04]} size={[1.27,.08,.38]} color="#282c30" radius={.025}/>
    <Bevel position={[0,.98,-.09]} size={[1.25,1.56,.19]} color="#2b3e55" radius={.09}/>
    <mesh geometry={questionGeometry} dispose={null} position={[-.09,.39,.03]} castShadow receiveShadow>
      <meshStandardMaterial color={copper} roughness={.9}/>
    </mesh>
    <Bevel position={[-.055,.46,.09]} size={[.25,.23,.16]} color={copper} radius={.04}/>
  </group>;
}
