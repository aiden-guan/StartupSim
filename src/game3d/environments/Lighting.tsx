import { ContactShadows } from "@react-three/drei";

export function OfficeLighting({
  level,
  quality,
}: {
  level: number;
  quality: "low" | "medium" | "high";
}) {
  const cool = level >= 3;
  const late = level >= 4;
  const shadows = quality !== "low";
  return (
    <>
      <color attach="background" args={[late ? "#b8c2c0" : cool ? "#c5d0c4" : "#d4c4ae"]} />
      <fog attach="fog" args={[late ? "#b8c2c0" : cool ? "#c5d0c4" : "#d4c4ae", quality === "high" ? 28 : 40, quality === "low" ? 80 : 60]} />
      <hemisphereLight args={[cool ? "#e8eef2" : "#fff6e8", cool ? "#6d7788" : "#8a7a68", late ? 0.42 : 0.55]} />
      <ambientLight intensity={cool ? 0.22 : 0.18} />
      <directionalLight
        position={cool ? [10, 16, 8] : [6.5, 12, 5]}
        intensity={quality === "low" ? 0.85 : 1.15}
        color={cool ? "#f2f5f7" : "#ffe6c2"}
        castShadow={shadows}
        shadow-mapSize={quality === "high" ? 2048 : 1024}
      />
      {level <= 1 ? <pointLight position={[4.4, 1.6, -3.2]} intensity={0.45} distance={7} color="#ffd9a8" /> : null}
      {quality !== "low" && level > 0 ? <ContactShadows opacity={0.35} scale={level >= 3 ? 40 : 16} blur={2.2} far={8} /> : null}
    </>
  );
}
