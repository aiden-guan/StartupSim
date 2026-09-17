import type { HairStyle } from "../../simulation/types";

function HairMat({ color }: { color: string }) {
  return <meshStandardMaterial color={color} roughness={0.68} />;
}

export function HairMesh({ style, color }: { style: HairStyle; color: string }) {
  if (style === "bald" || style === "shaved") return null;
  if (style === "buzz") {
    return (
      <mesh position={[0, 0.16, 0.01]} scale={[1.02, 0.42, 1.05]}>
        <sphereGeometry args={[0.24, 14, 10]} />
        <HairMat color={color} />
      </mesh>
    );
  }
  if (style === "fade") {
    return (
      <group>
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.23, 12, 10]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[0, 0.02, 0.02]} rotation={[0.15, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.22, 0.12, 12]} />
          <HairMat color={color} />
        </mesh>
      </group>
    );
  }
  if (style === "short") {
    return (
      <group>
        <mesh position={[0, 0.2, -0.02]}>
          <sphereGeometry args={[0.245, 14, 12]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[0, 0.08, -0.12]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <HairMat color={color} />
        </mesh>
      </group>
    );
  }
  if (style === "messy") {
    const blobs: [number, number, number, number][] = [
      [0, 0.22, 0, 0.2],
      [0.12, 0.2, 0.04, 0.12],
      [-0.12, 0.18, 0.02, 0.12],
      [0.05, 0.28, -0.08, 0.11],
      [-0.08, 0.26, -0.1, 0.1],
      [0.14, 0.12, -0.1, 0.1],
      [-0.14, 0.1, -0.08, 0.09],
    ];
    return (
      <group>
        {blobs.map((b, i) => (
          <mesh key={i} position={[b[0], b[1], b[2]]}>
            <sphereGeometry args={[b[3], 10, 8]} />
            <HairMat color={color} />
          </mesh>
        ))}
      </group>
    );
  }
  if (style === "side-part") {
    return (
      <group>
        <mesh position={[-0.08, 0.2, 0]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[0.14, 0.16, 0.02]} scale={[0.7, 0.85, 1]}>
          <sphereGeometry args={[0.18, 10, 8]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[0.02, 0.26, -0.08]}>
          <sphereGeometry args={[0.14, 10, 8]} />
          <HairMat color={color} />
        </mesh>
      </group>
    );
  }
  if (style === "curly") {
    const curls: [number, number, number][] = [
      [0.1, 0.2, 0.06],
      [-0.1, 0.2, 0.06],
      [0.16, 0.12, -0.02],
      [-0.16, 0.12, -0.02],
      [0.08, 0.28, -0.06],
      [-0.08, 0.28, -0.06],
      [0, 0.22, -0.14],
      [0.18, 0.18, -0.12],
      [-0.18, 0.16, -0.1],
    ];
    return (
      <group>
        {curls.map((c, i) => (
          <mesh key={i} position={c}>
            <sphereGeometry args={[0.09, 8, 8]} />
            <HairMat color={color} />
          </mesh>
        ))}
      </group>
    );
  }
  if (style === "long") {
    return (
      <group>
        <mesh position={[0, 0.2, -0.02]}>
          <sphereGeometry args={[0.25, 12, 10]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[0, -0.08, -0.16]}>
          <capsuleGeometry args={[0.14, 0.38, 6, 10]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[0.12, -0.18, -0.12]} rotation={[0.2, 0.4, 0.1]}>
          <capsuleGeometry args={[0.08, 0.28, 4, 8]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[-0.12, -0.18, -0.12]} rotation={[0.2, -0.4, -0.1]}>
          <capsuleGeometry args={[0.08, 0.28, 4, 8]} />
          <HairMat color={color} />
        </mesh>
      </group>
    );
  }
  if (style === "bun") {
    return (
      <group>
        <mesh position={[0, 0.18, -0.04]}>
          <sphereGeometry args={[0.22, 12, 10]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[0, 0.3, -0.12]}>
          <sphereGeometry args={[0.11, 10, 8]} />
          <HairMat color={color} />
        </mesh>
      </group>
    );
  }
  if (style === "ponytail") {
    return (
      <group>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.23, 12, 10]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[0, 0.06, -0.22]} rotation={[0.9, 0, 0]}>
          <capsuleGeometry args={[0.06, 0.34, 4, 8]} />
          <HairMat color={color} />
        </mesh>
      </group>
    );
  }
  if (style === "swept") {
    return (
      <group>
        <mesh position={[0.08, 0.2, 0.04]} rotation={[0.2, 0.4, 0.2]} scale={[1.15, 0.7, 1]}>
          <sphereGeometry args={[0.24, 12, 10]} />
          <HairMat color={color} />
        </mesh>
        <mesh position={[-0.1, 0.12, 0.02]} scale={[0.7, 0.55, 0.8]}>
          <sphereGeometry args={[0.16, 10, 8]} />
          <HairMat color={color} />
        </mesh>
      </group>
    );
  }
  const nubs: [number, number, number][] = [
    [0.1, 0.2, 0.08],
    [-0.1, 0.2, 0.08],
    [0, 0.26, 0],
    [0.14, 0.14, -0.08],
    [-0.14, 0.14, -0.08],
    [0, 0.16, -0.16],
  ];
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <sphereGeometry args={[0.22, 12, 10]} />
        <HairMat color={color} />
      </mesh>
      {nubs.map((n, i) => (
        <mesh key={i} position={n}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <HairMat color={color} />
        </mesh>
      ))}
    </group>
  );
}
