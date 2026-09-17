import { useGLTF } from "@react-three/drei";
import type { ReactNode } from "react";
import { Suspense } from "react";

/** Register a GLB here when an authored file lands in public/assets. */
const GLB_OVERRIDES = new Set<string>();

function GltfMesh({ path }: { path: string }) {
  const gltf = useGLTF(path);
  return <primitive object={gltf.scene.clone()} />;
}

export function KitOrGltf({
  id,
  path,
  fallback,
}: {
  id: string;
  path: string;
  fallback: ReactNode;
}) {
  if (!GLB_OVERRIDES.has(id)) return <>{fallback}</>;
  return (
    <Suspense fallback={fallback}>
      <GltfMesh path={path} />
    </Suspense>
  );
}

export function assetUrl(kind: "characters" | "environments" | "props" | "audio", name: string) {
  return `/assets/${kind}/${name}`;
}
