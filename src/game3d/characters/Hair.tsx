import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { HairStyle } from '../../simulation/types';
import { Bevel } from '../geometry/Bevel';

/** Closed, faceted scalp with an uneven hairline; no floating helmet or stacked spheres. */
export function HairMesh({ style, color }: { style: HairStyle; color: string }) {
  const cap = useMemo(() => {
    const geo = new BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    const short = style === 'buzz' || style === 'fade';

    for (let ring = 0; ring < 3; ring++) {
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const front = Math.cos(angle);
        const x = Math.sin(angle);
        const width = ring === 2 ? 0.13 : 0.228;
        const depth = ring === 2 ? 0.12 : 0.208;
        const hairline = front > 0.5 ? 0.105 : front < -0.5 ? -0.115 : -0.055;
        const y = ring === 0 ? hairline : ring === 1 ? (short ? 0.195 : 0.215) : short ? 0.235 : 0.285;
        vertices.push(x * width + (ring === 2 && style === 'swept' ? -0.02 : 0), y, front * depth - 0.012);
      }
    }
    for (let ring = 0; ring < 2; ring++) {
      for (let i = 0; i < 8; i++) {
        const a = ring * 8 + i;
        const b = ring * 8 + ((i + 1) % 8);
        const c = a + 8;
        const d = b + 8;
        indices.push(a, b, c, b, d, c);
      }
    }
    vertices.push(0, short ? 0.248 : 0.305, -0.025);
    for (let i = 0; i < 8; i++) indices.push(16 + i, 16 + ((i + 1) % 8), 24);
    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [style]);

  // Continuous seamless horseshoe balding hair band for Steve Jobs
  const baldingGeo = useMemo(() => {
    if (style !== 'balding') return null;
    const geo = new BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // 9 points wrapping from right temple -> right ear -> back -> left ear -> left temple
    const arcPoints = [
      { x: 0.225, z: 0.05, topY: 0.04, botY: -0.08 },   // right temple
      { x: 0.228, z: -0.04, topY: 0.08, botY: -0.11 },  // right ear
      { x: 0.218, z: -0.12, topY: 0.09, botY: -0.13 },  // right ear back
      { x: 0.170, z: -0.19, topY: 0.095, botY: -0.135 },// right nape corner
      { x: 0.0,   z: -0.208, topY: 0.095, botY: -0.135 },// center nape
      { x: -0.170, z: -0.19, topY: 0.095, botY: -0.135 },// left nape corner
      { x: -0.218, z: -0.12, topY: 0.09, botY: -0.13 }, // left ear back
      { x: -0.228, z: -0.04, topY: 0.08, botY: -0.11 }, // left ear
      { x: -0.225, z: 0.05, topY: 0.04, botY: -0.08 },  // left temple
    ];

    arcPoints.forEach((p) => {
      // Inner vertex against skull
      vertices.push(p.x, p.topY, p.z);
      vertices.push(p.x, p.botY, p.z);
      // Outer vertex with slight hair thickness
      const normLen = Math.hypot(p.x, p.z) || 1;
      const ox = p.x + (p.x / normLen) * 0.016;
      const oz = p.z + (p.z / normLen) * 0.016;
      vertices.push(ox, p.topY + 0.005, oz);
      vertices.push(ox, p.botY - 0.005, oz);
    });

    for (let i = 0; i < arcPoints.length - 1; i++) {
      const b = i * 4;
      const n = (i + 1) * 4;
      // Outer quad
      indices.push(b + 2, n + 2, b + 3);
      indices.push(n + 2, n + 3, b + 3);
      // Top quad
      indices.push(b, n, b + 2);
      indices.push(n, n + 2, b + 2);
      // Bottom quad
      indices.push(b + 1, b + 3, n + 1);
      indices.push(n + 1, b + 3, n + 3);
    }

    geo.setAttribute('position', new Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [style]);

  // Jeff Bezos: clean bald head (returns null)
  if (style === 'bald' || style === 'shaved') return null;

  // Reed Hastings: snug dark charcoal knit beanie skullcap
  if (style === 'beanie') {
    return (
      <group>
        {/* Upper knit dome fitting head closely */}
        <Bevel position={[0, 0.165, -0.01]} size={[0.455, 0.25, 0.405]} color={color} radius={0.11} />
        {/* Folded knit cuff hugging forehead and ears (no protruding brim) */}
        <Bevel position={[0, 0.065, 0]} size={[0.468, 0.085, 0.418]} color={color} radius={0.035} />
      </group>
    );
  }

  // Steve Jobs: continuous low-poly receding hair band wrapping around ears and back
  if (style === 'balding') {
    if (!baldingGeo) return null;
    return (
      <group>
        <mesh geometry={baldingGeo} castShadow receiveShadow>
          <meshStandardMaterial color={color} roughness={1} flatShading />
        </mesh>
      </group>
    );
  }

  const curly = style === 'curly' || style === 'textured';

  return (
    <group>
      <mesh geometry={cap} castShadow>
        <meshStandardMaterial color={color} roughness={1} flatShading />
      </mesh>

      {/* Swept silver hair (Jensen Huang style) */}
      {style === 'swept' && (
        <>
          {/* Smooth swept-back pompadour volume */}
          <Bevel position={[0, 0.24, -0.01]} rotation={[-0.14, 0, 0]} size={[0.41, 0.14, 0.35]} radius={0.042} color={color} />
          <Bevel position={[0, 0.21, 0.07]} rotation={[-0.12, 0, 0]} size={[0.39, 0.10, 0.22]} radius={0.035} color={color} />
          {[-1, 1].map((side) => (
            <Bevel key={side} position={[side * 0.215, 0.07, -0.01]} size={[0.024, 0.18, 0.36]} radius={0.015} color={color} />
          ))}
        </>
      )}

      {/* Side-part with neat fringe (Bill Gates style) */}
      {style === 'side-part' && (
        <>
          {/* Neat side part on left with angled fringe across forehead */}
          <Bevel position={[-0.04, 0.20, 0.08]} rotation={[0.04, 0, -0.12]} size={[0.34, 0.11, 0.24]} radius={0.035} color={color} />
          <Bevel position={[0.12, 0.17, 0.08]} rotation={[0.06, 0, 0.14]} size={[0.16, 0.10, 0.22]} radius={0.03} color={color} />
          {[-1, 1].map((side) => (
            <Bevel key={side} position={[side * 0.215, 0.07, -0.01]} size={[0.024, 0.18, 0.36]} radius={0.015} color={color} />
          ))}
        </>
      )}

      {/* Quiff / pompadour front (Elon Musk style) */}
      {style === 'messy' && (
        <>
          {/* Front quiff swept up and back smoothly */}
          <Bevel position={[0, 0.23, 0.08]} rotation={[-0.15, 0, 0]} size={[0.36, 0.12, 0.24]} radius={0.038} color={color} />
          <Bevel position={[0.03, 0.25, -0.04]} rotation={[-0.08, 0.05, 0.05]} size={[0.32, 0.10, 0.26]} radius={0.03} color={color} />
          {[-1, 1].map((side) => (
            <Bevel key={side} position={[side * 0.215, 0.07, -0.01]} size={[0.024, 0.18, 0.36]} radius={0.015} color={color} />
          ))}
        </>
      )}

      {/* Mark Zuckerberg & Sam Altman: Cohesive, stylish low-poly curly volume */}
      {curly && (
        <group>
          {/* Temples and side coverage */}
          {[-1, 1].map((side) => (
            <Bevel key={side} position={[side * 0.216, 0.06, -0.01]} size={[0.028, 0.19, 0.37]} radius={0.016} color={color} />
          ))}
          {/* Back of head coverage */}
          <Bevel position={[0, 0.04, -0.198]} size={[0.42, 0.21, 0.028]} radius={0.016} color={color} />
          {/* Sculpted crown volume */}
          <Bevel position={[0, 0.22, -0.01]} size={[0.42, 0.13, 0.37]} radius={0.045} color={color} />
          {/* Integrated curly facet clusters */}
          {[
            { x: -0.12, y: 0.23, z: 0.08, s: 0.10 },
            { x: 0.0,   y: 0.24, z: 0.09, s: 0.11 },
            { x: 0.12,  y: 0.23, z: 0.08, s: 0.10 },
            { x: -0.14, y: 0.24, z: -0.03, s: 0.105 },
            { x: 0.0,   y: 0.25, z: -0.02, s: 0.115 },
            { x: 0.14,  y: 0.24, z: -0.03, s: 0.105 },
            { x: -0.10, y: 0.22, z: -0.13, s: 0.10 },
            { x: 0.08,  y: 0.22, z: -0.13, s: 0.10 },
          ].map((c, i) => (
            <mesh key={i} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.82, c.s]} rotation={[0.1, i * 0.65, 0.05]} castShadow>
              <icosahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={color} flatShading roughness={1} />
            </mesh>
          ))}
        </group>
      )}

      {style === 'bun' && (
        <mesh position={[0, 0.21, -0.226]} castShadow>
          <icosahedronGeometry args={[0.12, 1]} />
          <meshStandardMaterial color={color} flatShading roughness={1} />
        </mesh>
      )}

      {(style === 'long' || style === 'ponytail') && (
        <Bevel position={[0, -0.12, -0.18]} size={[style === 'long' ? 0.41 : 0.14, 0.46, 0.15]} radius={0.045} color={color} />
      )}
    </group>
  );
}
