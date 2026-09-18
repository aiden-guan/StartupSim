import { useMemo } from 'react';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { primitiveIconPaths } from '../../ui/shared/PrimitiveIcons';
import { Bevel } from '../geometry/Bevel';

const accents = ['#c8764d', '#d39a55', '#7e9e91', '#7294a5', '#9d8fa9', '#b38979'];

export type ProductForm = 'screen' | 'speaker' | 'machine' | 'lab' | 'terminal';

export function productArtifactSpec(a: string, b: string) {
  const parts = [a, b].sort() as [string, string];
  const seed = [...parts.join(':')].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  const has = (ids: string[]) => parts.some((part) => ids.includes(part));
  const form: ProductForm = has(['robotics', 'hardware', 'computer-use']) ? 'machine'
    : has(['science', 'biology', 'health', 'auto-research']) ? 'lab'
    : has(['voice']) ? 'speaker'
    : has(['image', 'video', 'vision', 'avatar', 'entertainment']) ? 'screen'
    : 'terminal';
  return { parts, seed, form, accent: accents[seed % accents.length]!, fins: 1 + (seed % 3) };
}

function RaisedIcon({ id, x, color }: { id: string; x: number; color: string }) {
  const path = primitiveIconPaths[id];
  const strokes = useMemo(() => {
    if (!path) return [];
    const drawing = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${path}" fill="none" stroke="#fff" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
    return drawing.paths.flatMap((shape) => shape.subPaths
      .filter((subPath) => subPath.getPoints().length > 1)
      .map((subPath) => SVGLoader.pointsToStroke(subPath.getPoints(8), SVGLoader.getStrokeStyle(1.65, '#fff', 'round', 'round'))));
  }, [path]);
  return <group position={[x, .92, .405]}>
    <Bevel size={[.65, .65, .035]} color="#34474a" radius={.045} />
    <group position={[0, 0, .025]} scale={[.023, -.023, .023]}>
      {strokes.map((geometry, index) => <mesh key={index} geometry={geometry} position={[-12, -12, 0]}><meshStandardMaterial color={color} roughness={.75} side={2}/></mesh>)}
    </group>
  </group>;
}

function Silhouette({ form, accent, fins, seed }: { form: ProductForm; accent: string; fins: number; seed: number }) {
  if (form === 'screen') return <>
    <Bevel position={[0, 1.84, -.16]} size={[1.9, .2, .22]} color={accent} radius={.06} />
    <Bevel position={[-.77, 1.98, -.13]} size={[.13, .12, .16]} color="#f2e7ce" />
    <Bevel position={[.77, 1.98, -.13]} size={[.13, .12, .16]} color="#f2e7ce" />
    {Array.from({length:fins}, (_, i) => <Bevel key={i} position={[-.39 + i * .39, 1.88, .01]} size={[.22, .045, .04]} color="#f2e7ce" />)}
  </>;
  if (form === 'speaker') return <>
    {[-.77, .77].map((x) => <group key={x} position={[x, 1.86, -.18]}>
      <Bevel size={[.33, .68, .4]} color={accent} radius={.11} />
      <mesh position={[0, .12, .205]}><torusGeometry args={[.075, .025, 5, 16]}/><meshStandardMaterial color="#30464b" /></mesh>
    </group>)}
    <mesh position={[0, 2.12, -.13]}><sphereGeometry args={[.17, 12, 8]}/><meshStandardMaterial color={accent} roughness={.75}/></mesh>
  </>;
  if (form === 'machine') return <>
    <Bevel position={[-.62, 1.88, -.18]} size={[.16, .57, .2]} rotation={[0, 0, -.4]} color={accent} />
    <mesh position={[-.71, 2.14, -.18]}><sphereGeometry args={[.15, 10, 8]}/><meshStandardMaterial color="#34474a" /></mesh>
    <Bevel position={[-.32, 2.24, -.18]} size={[.65, .13, .18]} rotation={[0, 0, .26]} color={accent} />
    <Bevel position={[.78, 1.84, -.16]} size={[.26, .5, .31]} color="#526a69" />
    <Bevel position={[.78, 2.14, -.16]} size={[.38, .12, .38]} color={accent} />
  </>;
  if (form === 'lab') return <>
    {[-.54, .54].map((x, i) => <group key={x} position={[x, 1.94, -.18]}>
      <mesh><cylinderGeometry args={[i ? .14 : .2, .25, .65, 10]}/><meshStandardMaterial color={i ? '#b6cfca' : accent} roughness={.43} metalness={.1}/></mesh>
      <Bevel position={[0, -.31, 0]} size={[.4, .07, .4]} color="#34474a" />
    </group>)}
    <Bevel position={[0, 2.24, -.17]} size={[.63, .11, .18]} color={accent} />
  </>;
  return <>
    {Array.from({length:fins + 1}, (_, i) => <Bevel key={i} position={[-.67 + i * (1.34 / fins), 1.86 + ((seed >> i) % 2) * .13, -.17]} size={[.18, .33 + ((seed >> i) % 2) * .25, .22]} color={i % 2 ? '#6b8986' : accent} radius={.04} />)}
  </>;
}

/** A deterministic, compact physical artifact for any pair of technologies. */
export function ProductArtifact({ a, b }: { a: string; b: string }) {
  const spec = productArtifactSpec(a, b);
  return <group>
    <Bevel position={[0, .09, 0]} size={[2.2, .18, 1.38]} color="#c9b9a0" radius={.09} />
    <Bevel position={[0, .22, -.04]} size={[1.97, .13, 1.11]} color="#364b4b" radius={.07} />
    <Bevel position={[0, 1.01, -.08]} size={[spec.form === 'screen' ? 2.04 : 1.9, spec.form === 'lab' || spec.form === 'machine' ? 1.27 : 1.48, spec.form === 'screen' ? .36 : .63]} color="#e3dbc9" radius={.12} />
    <Bevel position={[0, .95, .3]} size={[1.72, 1.2, .12]} color="#253d44" radius={.08} />
    <Bevel position={[0, 1.57, .31]} size={[1.73, .09, .14]} color={spec.accent} radius={.035} />
    <RaisedIcon id={spec.parts[0]} x={-.42} color="#f1eadb" />
    <RaisedIcon id={spec.parts[1]} x={.42} color="#f1eadb" />
    <Bevel position={[0, .91, .42]} size={[.12, .12, .03]} rotation={[0, 0, Math.PI / 4]} color={spec.accent} />
    <Silhouette form={spec.form} accent={spec.accent} fins={spec.fins} seed={spec.seed} />
    <Bevel position={[0, .34, .42]} size={[.78, .055, .06]} color={spec.accent} radius={.02} />
    {[-.76, .76].map((x) => <mesh key={x} position={[x, .34, .42]}><sphereGeometry args={[.028, 8, 6]}/><meshStandardMaterial color="#ebdfc5"/></mesh>)}
  </group>;
}
