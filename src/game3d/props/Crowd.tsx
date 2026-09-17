import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import type { OfficeLayout } from "../navigation/layout";

export function CrowdSilhouettes({
  count,
  layout,
  cool,
}: {
  count: number;
  layout: OfficeLayout;
  cool?: boolean;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const n = Math.min(90, Math.max(0, count));

  useLayoutEffect(() => {
    const inst = mesh.current;
    if (!inst) return;
    const dummy = new THREE.Object3D();
    const bays = layout.points.filter((p) => p.kind === "idle" || p.kind === "desk" || p.kind === "meet" || p.kind === "lab");
    const origin = bays[0]?.position ?? layout.hub;
    for (let i = 0; i < n; i++) {
      const bay = bays[i % Math.max(1, bays.length)]?.position ?? origin;
      const col = i % 6;
      const row = Math.floor(i / 6);
      dummy.position.set(bay[0] + col * 0.55 - 1.4, 0.52, bay[2] + row * 0.48);
      dummy.scale.setScalar(0.85 + ((i * 17) % 10) * 0.02);
      dummy.rotation.set(0, (i % 5) * 0.2, 0);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.count = n;
    inst.instanceMatrix.needsUpdate = true;
  }, [n, layout]);

  if (n <= 0) return null;
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, Math.max(1, n)]} castShadow={false}>
      <boxGeometry args={[0.28, 1.05, 0.22]} />
      <meshStandardMaterial color={cool ? "#6d7788" : "#5a4a3c"} roughness={0.9} />
    </instancedMesh>
  );
}
