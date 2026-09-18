import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Bevel } from '../geometry/Bevel';

const accents = ['#c8764d', '#d39a55', '#7e9e91', '#7294a5', '#9d8fa9', '#b38979'];
const paper = '#ded3c3';
const navy = '#2b3e55';
const copper = '#d06a3c';
const charcoal = '#282c30';
const screen = '#5599ff';
const teal = '#486d68';

type SculptFamily = 'scribe' | 'portal' | 'orb' | 'lab' | 'machine' | 'voice' | 'screen' | 'ledger' | 'learning' | 'shield' | 'market' | 'terminal' | 'world' | 'recursive';

function hashParts(parts: [string, string]): number {
  return [...parts.join(':')].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function familyFor(parts: [string, string]): SculptFamily {
  const has = (ids: string[]) => parts.some((part) => ids.includes(part));
  if (has(['auto-research', 'self-improve'])) return 'recursive';
  if (has(['world-model', 'simulation'])) return 'world';
  if (has(['robotics', 'hardware'])) return 'machine';
  if (has(['science', 'biology', 'health'])) return 'lab';
  if (has(['voice'])) return 'voice';
  if (has(['vision', 'image', 'video', 'avatar', 'entertainment'])) return 'screen';
  if (has(['legal', 'finance'])) return 'ledger';
  if (has(['education'])) return 'learning';
  if (has(['defense', 'security'])) return 'shield';
  if (has(['commerce', 'ads', 'recommend'])) return 'market';
  if (has(['chat', 'writing'])) return 'scribe';
  if (has(['memory', 'social'])) return 'orb';
  if (has(['search', 'retrieval', 'browser'])) return 'portal';
  if (has(['code', 'agent', 'workflow', 'computer-use', 'api', 'opensource', 'data', 'analytics'])) return 'terminal';
  return 'terminal';
}

/** Stable, order-independent art direction for every possible technology pair. */
export function productArtifactSpec(a: string, b: string) {
  const parts = [a, b].sort() as [string, string];
  const seed = hashParts(parts);
  return {
    parts,
    seed,
    family: familyFor(parts),
    variant: seed % 4,
    accent: accents[seed % accents.length]!,
  };
}

function ScribeSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  const tilt = spec.variant % 2 ? -.12 : .12;
  return <group>
    <Bevel position={[0, 1.28, -.06]} rotation={[0, tilt, -.08]} size={[1.52, .12, 1.12]} color={paper} radius={.06}/>
    <Bevel position={[0, 1.48, .02]} rotation={[0, tilt, -.08]} size={[.9, .035, .08]} color={spec.accent} radius={.02}/>
    {[-.2, .03, .26].map((x, i) => <Bevel key={x} position={[x, 1.29 - i * .16, .02]} rotation={[0, tilt, -.08]} size={[.78 - i * .12, .025, .045]} color={i === 1 ? teal : '#8aa09a'} radius={.012}/>) }
    <Bevel position={[.55, 1.6, .02]} rotation={[0, 0, -.55]} size={[.1, .62, .1]} color={charcoal} radius={.035}/>
    <mesh position={[.76, 1.91, .02]} rotation={[0, 0, -.55]}><coneGeometry args={[.13, .23, 5]}/><meshStandardMaterial color={spec.accent} roughness={.82}/></mesh>
  </group>;
}

function PortalSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <mesh position={[0, 1.35, .05]} rotation={[0, spec.variant * .28, 0]}>
      <torusGeometry args={[.72, .12, 8, 24]}/>
      <meshStandardMaterial color={spec.accent} roughness={.7} metalness={.08}/>
    </mesh>
    <mesh position={[0, 1.35, .04]}><sphereGeometry args={[.5, 12, 8]}/><meshStandardMaterial color={navy} roughness={.76}/></mesh>
    <mesh position={[0, 1.35, .53]}><sphereGeometry args={[.2, 10, 6]}/><meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={.18} roughness={.7}/></mesh>
    {[-.8, .8].map((x, i) => <Bevel key={x} position={[x, 1.05 + i * .2, .02]} size={[.16, .44, .16]} color={i === spec.variant % 2 ? paper : teal} radius={.04}/>) }
  </group>;
}

function OrbSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <mesh position={[0, 1.3, .02]}><icosahedronGeometry args={[.62, 1]}/><meshStandardMaterial color={spec.accent} roughness={.58} flatShading/></mesh>
    <mesh position={[0, 1.3, .03]} rotation={[.35, .2 + spec.variant * .22, .18]}>
      <torusGeometry args={[.77, .055, 6, 18]}/><meshStandardMaterial color={paper} roughness={.78}/>
    </mesh>
    <Bevel position={[0, 1.98, .02]} size={[.08, .32, .08]} color={navy} radius={.03}/>
    <mesh position={[0, 2.18, .02]}><sphereGeometry args={[.12, 8, 6]}/><meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={.22}/></mesh>
    {[-.32, .32].map((x) => <mesh key={x} position={[x, .94, .02]}><sphereGeometry args={[.1, 8, 6]}/><meshStandardMaterial color={x < 0 ? paper : teal} roughness={.84}/></mesh>)}
  </group>;
}

function LabSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  const liquid = spec.variant % 2 ? '#86a9a1' : spec.accent;
  return <group>
    {[-.46, .46].map((x, i) => <group key={x} position={[x, .98, .02]}>
      <mesh><cylinderGeometry args={[i ? .16 : .21, .23, .58, 10]}/><meshStandardMaterial color={i ? paper : '#b9cfca'} roughness={.45}/></mesh>
      <mesh position={[0, .26, 0]}><cylinderGeometry args={[.12, .12, .18, 10]}/><meshStandardMaterial color={paper} roughness={.45}/></mesh>
      <mesh position={[0, -.05, .12]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[i ? .12 : .16, 10]}/><meshStandardMaterial color={liquid} emissive={liquid} emissiveIntensity={.05}/></mesh>
    </group>)}
    <Bevel position={[0, 1.78, .02]} size={[.68, .11, .2]} color={spec.accent} radius={.04}/>
    <mesh position={[0, 1.35, .16]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[.33, .035, 6, 16]}/><meshStandardMaterial color={navy} roughness={.75}/></mesh>
  </group>;
}

function MachineSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <Bevel position={[0, 1.25, 0]} size={[1.08, 1.08, .7]} color={navy} radius={.12}/>
    <Bevel position={[0, 1.3, .38]} size={[.56, .42, .035]} color={spec.accent} radius={.045}/>
    <Bevel position={[0, 1.3, .405]} size={[.2, .12, .02]} color={screen} emissive={screen} emissiveIntensity={.2} radius={.012}/>
    {[-.72, .72].map((x) => <group key={x} position={[x, 1.15, 0]} rotation={[0, 0, x < 0 ? -.38 : .38]}><Bevel size={[.16, .68, .17]} color={spec.accent} radius={.04}/><mesh position={[0, .4, 0]}><sphereGeometry args={[.14, 8, 6]}/><meshStandardMaterial color={charcoal}/></mesh></group>)}
    <Bevel position={[0, 1.92, 0]} size={[.08, .34, .08]} color={paper} radius={.025}/>
    <mesh position={[0, 2.15, 0]}><sphereGeometry args={[.11, 8, 6]}/><meshStandardMaterial color={copper}/></mesh>
  </group>;
}

function VoiceSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <Bevel position={[0, .98, 0]} size={[.7, .82, .56]} color={charcoal} radius={.12}/>
    {[.14, .35, .56].map((y) => <mesh key={y} position={[0, y + .72, .3]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.18, .025, 6, 16]}/><meshStandardMaterial color={spec.accent} roughness={.72}/></mesh>)}
    <group position={[.62, 1.42, 0]} rotation={[0, 0, -.18]}><Bevel size={[.14, .62, .14]} color={paper} radius={.05}/><mesh position={[0, .38, 0]}><capsuleGeometry args={[.15, .24, 6, 10]}/><meshStandardMaterial color={spec.accent}/></mesh></group>
    <Bevel position={[.62, .75, 0]} size={[.58, .07, .38]} color={teal} radius={.025}/>
  </group>;
}

function ScreenSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <Bevel position={[0, 1.42, -.06]} size={[1.72, 1.12, .16]} color={charcoal} radius={.08}/>
    <Bevel position={[0, 1.42, .04]} size={[1.45, .82, .025]} color={spec.accent} emissive={spec.accent} emissiveIntensity={.08} radius={.025}/>
    <Bevel position={[0, 1.02, .08]} size={[.5, .08, .05]} color={paper} radius={.02}/>
    {[-.48, 0, .48].map((x, i) => <mesh key={x} position={[x, 1.52 + (i === spec.variant % 3 ? .12 : 0), .1]}><sphereGeometry args={[.08 + i * .02, 8, 6]}/><meshStandardMaterial color={i === 1 ? copper : paper} emissive={i === 1 ? copper : undefined} emissiveIntensity={.1}/></mesh>)}
    <mesh position={[.74, .98, .16]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.22, .22, .16, 10]}/><meshStandardMaterial color={paper} metalness={.15} roughness={.55}/></mesh>
    <mesh position={[.74, .98, .26]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[.13, 12]}/><meshStandardMaterial color={navy}/></mesh>
  </group>;
}

function LedgerSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <Bevel position={[0, 1.06, 0]} size={[.12, 1.55, .12]} color={navy} radius={.025}/>
    <Bevel position={[0, 1.82, 0]} size={[1.48, .1, .12]} color={spec.accent} radius={.025}/>
    {[-.58, .58].map((x, i) => <group key={x} position={[x, 1.17, 0]}><Bevel position={[0, .25, 0]} size={[.07, .5, .07]} color={paper}/><mesh position={[0, -.06, .08]} rotation={[-Math.PI / 2, 0, 0]}><cylinderGeometry args={[.3, .23, .08, 10]}/><meshStandardMaterial color={i === spec.variant % 2 ? spec.accent : '#d7c28a'} metalness={.1} roughness={.65}/></mesh></group>)}
    <Bevel position={[0, 1.45, .2]} size={[.62, .08, .05]} color={teal} radius={.02}/>
  </group>;
}

function LearningSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    {[0, 1, 2].map((i) => <Bevel key={i} position={[-.05 + i * .03, .82 + i * .13, .02]} rotation={[0, 0, i === 2 ? -.08 : .03]} size={[1.3, .11, .72]} color={[navy, spec.accent, paper][i]!} radius={.025}/>) }
    <Bevel position={[0, 1.55, .05]} size={[.96, .62, .06]} color={teal} radius={.025}/>
    <Bevel position={[0, 1.55, .09]} size={[.05, .44, .02]} color={paper}/>
    <Bevel position={[0, 1.98, .05]} rotation={[0, 0, Math.PI / 4]} size={[.62, .08, .38]} color={spec.accent} radius={.02}/>
  </group>;
}

function ShieldSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <mesh position={[0, 1.3, .05]} scale={[.9, 1.12, .28]} rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[.7, 0]}/><meshStandardMaterial color={navy} roughness={.78}/></mesh>
    <Bevel position={[0, 1.3, .3]} size={[.13, .9, .08]} color={spec.accent} radius={.02}/>
    <Bevel position={[0, 1.3, .31]} size={[.78, .13, .08]} color={spec.accent} radius={.02}/>
    {[-.52, .52].map((x) => <Bevel key={x} position={[x, .72, 0]} size={[.14, .46, .14]} color={paper} radius={.03}/>) }
  </group>;
}

function MarketSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <Bevel position={[0, 1.04, 0]} size={[1.48, 1.18, .72]} color={paper} radius={.06}/>
    <Bevel position={[0, 1.56, .38]} size={[1.64, .18, .16]} color={spec.accent} radius={.04}/>
    {[-.62, -.2, .22, .64].map((x, i) => <Bevel key={x} position={[x, 1.56, .48]} size={[.24, .12, .08]} color={i % 2 ? paper : copper} radius={.015}/>) }
    <Bevel position={[0, 1.1, .38]} size={[.5, .44, .04]} color={navy} radius={.025}/>
    <Bevel position={[.78, .92, .2]} size={[.28, .35, .28]} rotation={[0, 0, -.18]} color={spec.accent} radius={.03}/>
    <Bevel position={[.78, 1.24, .2]} size={[.14, .08, .18]} color={paper} radius={.02}/>
  </group>;
}

function TerminalSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  const heights = spec.variant % 2 ? [.62, .98, .74] : [.82, .64, 1.08];
  return <group>
    {heights.map((height, i) => <group key={i} position={[-.56 + i * .56, .62 + height / 2, 0]}><Bevel size={[.42, height, .58]} color={i === spec.variant % 3 ? spec.accent : [navy, teal, paper][i]!} radius={.045}/><Bevel position={[0, .05, .31]} size={[.23, .06, .025]} color={screen} emissive={screen} emissiveIntensity={.12}/></group>)}
    <Bevel position={[0, 1.82, .04]} size={[.64, .1, .2]} rotation={[0, 0, spec.variant % 2 ? -.15 : .15]} color={paper} radius={.025}/>
    <mesh position={[0, 1.98, .04]}><sphereGeometry args={[.1, 8, 6]}/><meshStandardMaterial color={spec.accent}/></mesh>
  </group>;
}

function WorldSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    <mesh position={[0, 1.32, 0]}><sphereGeometry args={[.63, 12, 8]}/><meshStandardMaterial color={teal} roughness={.78}/></mesh>
    {[0, Math.PI / 2].map((rotation) => <mesh key={rotation} position={[0, 1.32, 0]} rotation={[rotation, 0, .2 + spec.variant * .1]}><torusGeometry args={[.68, .045, 6, 18]}/><meshStandardMaterial color={paper} roughness={.82}/></mesh>)}
    <Bevel position={[0, .72, 0]} size={[.9, .08, .5]} color={spec.accent} radius={.03}/>
    {[-.4, .4].map((x) => <mesh key={x} position={[x, 1.92, .04]}><sphereGeometry args={[.09, 8, 6]}/><meshStandardMaterial color={x < 0 ? copper : paper}/></mesh>)}
  </group>;
}

function RecursiveSculpt({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  return <group>
    {[.72, .48, .25].map((radius, i) => <mesh key={radius} position={[0, 1.3, .05]} rotation={[.2 + i * .35, i * .55 + spec.variant * .1, 0]}><torusGeometry args={[radius, .07 - i * .012, 6, 18]}/><meshStandardMaterial color={[spec.accent, paper, screen][i]!} emissive={i === 2 ? screen : undefined} emissiveIntensity={i === 2 ? .14 : 0} roughness={.7}/></mesh>)}
    <mesh position={[0, 1.3, .08]}><octahedronGeometry args={[.16, 0]}/><meshStandardMaterial color={navy}/></mesh>
    <Bevel position={[0, .76, 0]} size={[1.15, .1, .6]} color={teal} radius={.03}/>
  </group>;
}

function SculptedConcept({ spec }: { spec: ReturnType<typeof productArtifactSpec> }) {
  switch (spec.family) {
    case 'scribe': return <ScribeSculpt spec={spec}/>;
    case 'portal': return <PortalSculpt spec={spec}/>;
    case 'orb': return <OrbSculpt spec={spec}/>;
    case 'lab': return <LabSculpt spec={spec}/>;
    case 'machine': return <MachineSculpt spec={spec}/>;
    case 'voice': return <VoiceSculpt spec={spec}/>;
    case 'screen': return <ScreenSculpt spec={spec}/>;
    case 'ledger': return <LedgerSculpt spec={spec}/>;
    case 'learning': return <LearningSculpt spec={spec}/>;
    case 'shield': return <ShieldSculpt spec={spec}/>;
    case 'market': return <MarketSculpt spec={spec}/>;
    case 'world': return <WorldSculpt spec={spec}/>;
    case 'recursive': return <RecursiveSculpt spec={spec}/>;
    default: return <TerminalSculpt spec={spec}/>;
  }
}

/** A distinct low-poly concept maquette for each technology pairing. */
export function ProductArtifact({ a, b }: { a: string; b: string }) {
  const spec = productArtifactSpec(a, b);
  return <SculptedConcept spec={spec}/>;
}

function QuestionMarkCurve() {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.22, .68, .08),
      new THREE.Vector3(.15, 1.12, .08),
      new THREE.Vector3(.58, 1.08, .08),
      new THREE.Vector3(.52, .69, .08),
      new THREE.Vector3(.12, .5, .08),
      new THREE.Vector3(.02, .37, .08),
    ]);
    return new THREE.TubeGeometry(curve, 28, .105, 7, false);
  }, []);
  return <mesh geometry={geometry} castShadow>
    <meshStandardMaterial color={copper} roughness={.62} metalness={.08}/>
  </mesh>;
}

/** Unknown combinations stay intentionally unresolved until the player discovers them. */
export function QuestionMarkArtifact() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.elapsedTime * .42;
    ref.current.position.y = .06 + Math.sin(clock.elapsedTime * 1.4) * .055;
  });
  return <group ref={ref} position={[0, .06, 0]}>
    <Bevel position={[0, .04, 0]} size={[2.2, .12, 1.36]} color="#c9b9a0" radius={.08}/>
    <mesh position={[0, .12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[.7, .035, 6, 24]}/>
      <meshStandardMaterial color="#9a8067" roughness={.86}/>
    </mesh>
    <group position={[0, .2, 0]}>
      <QuestionMarkCurve/>
      <mesh position={[.02, .1, .08]}><sphereGeometry args={[.115, 8, 6]}/><meshStandardMaterial color={copper} roughness={.62}/></mesh>
    </group>
    <mesh position={[0, .22, -.01]}><sphereGeometry args={[.9, 16, 8]}/><meshStandardMaterial color="#f0e8d8" transparent opacity={.12} depthWrite={false}/></mesh>
  </group>;
}
