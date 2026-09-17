import type { ExpressionId, FaceId } from '../../simulation/types';
import { Bevel } from '../geometry/Bevel';

export function FaceMesh({
  skin,
  expression,
  faceId,
}: {
  skin: string;
  expression: ExpressionId;
  faceId: FaceId;
}) {
  const width = faceId === 'round' ? 0.46 : faceId === 'angular' ? 0.42 : 0.44;
  const eyeHeight = expression === 'tired' ? 0.024 : expression === 'surprised' ? 0.068 : 0.056;
  const browY = expression === 'surprised' ? 0.058 : expression === 'tired' ? 0.038 : 0.046;
  const browAngle = expression === 'angry' ? 0.22 : expression === 'stressed' ? -0.18 : expression === 'confident' ? 0.1 : 0;

  return (
    <group>
      {/* Clean rounded-cube head */}
      <Bevel size={[width, 0.45, 0.39]} color={skin} radius={faceId === 'angular' ? 0.085 : 0.105} />

      {/* Symmetrical ears, vertical capsule eyes, subtle brows */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Ear */}
          <Bevel position={[side * (width / 2 + 0.005), -0.04, -0.005]} size={[0.074, 0.11, 0.085]} radius={0.032} color={skin} />

          {/* Two vertical capsule eyes - no nose, flat-planed face */}
          <Bevel position={[side * 0.083, -0.008, 0.2]} size={[0.028, eyeHeight, 0.014]} radius={0.012} color="#23272e" />

          {/* Subtle brow line */}
          <Bevel
            position={[side * 0.083, browY, 0.201]}
            rotation={[0, 0, side * browAngle]}
            size={[0.052, 0.011, 0.01]}
            color="#38302a"
            radius={0.003}
          />
        </group>
      ))}

      {/* Subtle mouth line: small clean horizontal mark, slightly curved when happy */}
      {expression === 'happy' ? (
        <mesh position={[0, -0.114, 0.198]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.035, 0.006, 4, 10, Math.PI]} />
          <meshStandardMaterial color="#8a5a48" roughness={1} />
        </mesh>
      ) : (
        <Bevel position={[0, -0.112, 0.2]} size={[0.065, 0.01, 0.01]} color="#8a5a48" radius={0.003} />
      )}
    </group>
  );
}
