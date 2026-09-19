import { ContactShadows } from "@react-three/drei";

export function OfficeLighting({
  level,
  quality,
  sky,
}: {
  level: number;
  sky?: string;
  quality: "low" | "medium" | "high";
}) {
  const cool = level >= 3;
  const late = level >= 4;
  const background=sky ?? (late ? "#b8c2c0" : cool ? "#c5d0c4" : "#e8e9e4");
  const fogStart=[38,52,74,105,155,240][level]??38;
  const shadows = quality !== "low";
  return (
    <>
      <color attach="background" args={[background]} />
      <fog attach="fog" args={[background, fogStart, fogStart*2.1]} />
      <hemisphereLight args={[cool ? "#e8eef2" : "#fffdf7", cool ? "#6d7788" : "#a0a9b3", 1.25]} />
      <ambientLight intensity={0.45} />
      <directionalLight
        position={cool ? [10, 16, 8] : [6.5, 12, 5]}
        intensity={quality === "low" ? 2 : 2.6}
        color={cool ? "#f2f5f7" : "#fff9ef"}
        castShadow={shadows}
        shadow-mapSize={quality === "high" ? 2048 : 1024}
        shadow-camera-left={level>=5?-52:level>=4?-36:-20} shadow-camera-right={level>=5?52:level>=4?36:20} shadow-camera-top={level>=5?52:level>=4?36:20} shadow-camera-bottom={level>=5?-52:level>=4?-36:-20} shadow-camera-far={level>=5?145:level>=4?100:60} shadow-normalBias={0.035} shadow-bias={-0.00015} shadow-radius={3}
      />
      {level <= 1 ? <pointLight position={[4.4, 1.6, -3.2]} intensity={0.45} distance={7} color="#ffd9a8" /> : null}
      {quality !== "low" && level > 0 && level<=3 ? <ContactShadows opacity={0.35} scale={level >= 3 ? 44 : 16} blur={2.2} far={8} /> : null}
    </>
  );
}
