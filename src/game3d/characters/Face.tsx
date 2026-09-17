import type { ExpressionId, FaceId } from "../../simulation/types";

export function FaceMesh({
  skin,
  expression,
  faceId,
}: {
  skin: string;
  expression: ExpressionId;
  faceId: FaceId;
}) {
  const browY = expression === "surprised" || expression === "happy" ? 0.08 : expression === "angry" ? 0.02 : 0.05;
  const browRot = expression === "angry" ? 0.35 : expression === "stressed" ? -0.25 : expression === "confident" ? 0.15 : 0;
  const lid = expression === "tired" ? 0.035 : 0.02;
  const mouthY = expression === "happy" || expression === "confident" ? -0.07 : expression === "surprised" ? -0.06 : -0.08;
  const mouthW = expression === "surprised" ? 0.05 : expression === "happy" ? 0.1 : 0.08;
  const mouthH = expression === "surprised" ? 0.06 : expression === "angry" ? 0.02 : 0.025;
  const headScale = faceId === "round" ? 1.06 : faceId === "angular" ? 0.94 : 1;
  return (
    <group scale={headScale}>
      <mesh castShadow>
        <sphereGeometry args={[0.24, 16, 14]} />
        <meshStandardMaterial color={skin} roughness={0.58} />
      </mesh>
      <mesh position={[0, -0.12, 0.06]} scale={[0.78, 0.55, 0.7]}>
        <sphereGeometry args={[0.2, 12, 10]} />
        <meshStandardMaterial color={skin} roughness={0.58} />
      </mesh>
      <mesh position={[-0.08, 0.04, 0.18]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#f7f4ef" />
      </mesh>
      <mesh position={[0.08, 0.04, 0.18]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#f7f4ef" />
      </mesh>
      <mesh position={[-0.08, 0.04, 0.215]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#1b2230" />
      </mesh>
      <mesh position={[0.08, 0.04, 0.215]}>
        <sphereGeometry args={[0.022, 8, 8]} />
        <meshStandardMaterial color="#1b2230" />
      </mesh>
      <mesh position={[-0.08, 0.055 + lid, 0.2]} scale={[1, expression === "tired" ? 0.45 : 0.25, 1]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color={skin} roughness={0.58} />
      </mesh>
      <mesh position={[0.08, 0.055 + lid, 0.2]} scale={[1, expression === "tired" ? 0.45 : 0.25, 1]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color={skin} roughness={0.58} />
      </mesh>
      <mesh position={[-0.08, browY, 0.2]} rotation={[0, 0, browRot]} scale={[1, 0.22, 0.4]}>
        <boxGeometry args={[0.09, 0.04, 0.04]} />
        <meshStandardMaterial color="#1b2230" />
      </mesh>
      <mesh position={[0.08, browY, 0.2]} rotation={[0, 0, -browRot]} scale={[1, 0.22, 0.4]}>
        <boxGeometry args={[0.09, 0.04, 0.04]} />
        <meshStandardMaterial color="#1b2230" />
      </mesh>
      <mesh position={[0, -0.01, 0.23]} rotation={[0.4, 0, 0]}>
        <coneGeometry args={[0.035, 0.08, 6]} />
        <meshStandardMaterial color={skin} roughness={0.6} />
      </mesh>
      <mesh position={[0, mouthY, 0.22]}>
        <boxGeometry args={[mouthW, mouthH, 0.03]} />
        <meshStandardMaterial color={expression === "angry" ? "#7a2f2f" : "#5a3030"} />
      </mesh>
    </group>
  );
}
