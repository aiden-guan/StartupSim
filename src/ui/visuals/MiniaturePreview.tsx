import { ContactShadows, OrthographicCamera } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { PerkVisual } from "../../game3d/props/PerkSet";
import { PromoVisual } from "../../game3d/props/PromoVisuals";
import { ModelVisual } from "../../game3d/props/ModelVisuals";
import { Bevel } from "../../game3d/geometry/Bevel";

type PreviewItem =
  | { kind: "perk"; id: string; level: number }
  | { kind: "promo"; id: string }
  | { kind: "model"; id: string };

function CameraAim() {
  const { camera } = useThree();
  useLayoutEffect(() => camera.lookAt(0, .8, 0), [camera]);
  return null;
}

export function MiniaturePreview({ item, label }: { item: PreviewItem; label: string }) {
  return <div className="miniature-preview" role="img" aria-label={label}>
    <Canvas shadows="basic" dpr={1} frameloop="demand" gl={{ antialias: true, powerPreference: "low-power" }}>
      <color attach="background" args={["#e9e2d5"]} />
      <OrthographicCamera makeDefault position={[4.2, 3.5, 5]} zoom={53} near={.1} far={50} />
      <CameraAim />
      <hemisphereLight args={["#fffaf0", "#9da9a5", 1.5]} />
      <ambientLight intensity={.45} />
      <directionalLight position={[-3, 6, 4]} intensity={2.2} castShadow shadow-mapSize={512} />
      <group position={[0, 0, 0]}>
        <Bevel position={[0, -.08, 0]} size={[3.3, .16, 2.5]} color="#ded3c3" />
        {item.kind === "perk" ? <PerkVisual perk={{ id: item.id, level: item.level }} /> : item.kind === "promo" ? <PromoVisual id={item.id} /> : <ModelVisual modelId={item.id} />}
      </group>
      <ContactShadows opacity={.25} scale={7} blur={2.6} far={4} resolution={256} />
    </Canvas>
  </div>;
}
