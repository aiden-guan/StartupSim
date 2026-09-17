import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import type { CharacterLook, ExpressionId } from "../../simulation/types";
import { FaceMesh } from "./Face";
import { HairMesh } from "./Hair";
import { clipForActivity, type CharacterActivity } from "./Animations";

export type { CharacterActivity };

export function Character({
  look,
  activity = "idle",
  expression,
  exhausted = false,
  robot = false,
  preview = false,
}: {
  look: CharacterLook;
  activity?: CharacterActivity;
  expression?: ExpressionId;
  exhausted?: boolean;
  robot?: boolean;
  preview?: boolean;
}) {
  const ref = useRef<Group>(null);
  const leftArm = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null);
  const rightLeg = useRef<Group>(null);
  const head = useRef<Group>(null);
  const bodyScale = look.body === "slim" ? 0.9 : look.body === "broad" ? 1.12 : 1;
  const heightScale = look.height === "short" ? 0.9 : look.height === "tall" ? 1.08 : 1;
  const face: ExpressionId = expression ?? (exhausted ? "tired" : activity === "celebrate" ? "happy" : activity === "talking" ? "confident" : "neutral");
  const hoodie = look.topId === "hoodie";
  const coat = look.topId === "labcoat" || look.topId === "blazer" || look.topId === "jacket" || look.topId === "techjacket";
  const vest = look.topId === "vest";

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = ref.current;
    if (!g) return;
    const tired = exhausted || activity === "tired" ? 0.55 : 1;
    const walk = activity === "walking" ? 1 : 0;
    const work = activity === "working" ? 1 : 0;
    const talk = activity === "talking" ? 1 : 0;
    const cele = activity === "celebrate" ? 1 : 0;
    const sit = activity === "sit" ? 1 : 0;
    const idle = activity === "idle" || activity === "coffee" ? 1 : 0;
    const breath = Math.sin(t * 2.1) * 0.012 * idle;
    g.position.y = (sit ? -0.22 : 0) + Math.sin(t * 8) * 0.04 * walk * tired + cele * (0.08 + Math.abs(Math.sin(t * 6)) * 0.06);
    if (head.current) {
      head.current.rotation.x = exhausted ? 0.22 : work * 0.18 + Math.sin(t * 1.4) * 0.04 * talk;
      head.current.rotation.y = Math.sin(t * 2.4) * 0.12 * talk;
    }
    if (leftArm.current && rightArm.current) {
      leftArm.current.rotation.x = walk * Math.sin(t * 8) * 0.7 * tired + work * (-0.9 + Math.sin(t * 16) * 0.12) + talk * (-0.4 + Math.sin(t * 3) * 0.25) + cele * -1.4;
      rightArm.current.rotation.x = walk * Math.sin(t * 8 + Math.PI) * 0.7 * tired + work * (-0.85 + Math.sin(t * 16 + 0.4) * 0.12) + talk * -0.2 + cele * -1.5;
    }
    if (leftLeg.current && rightLeg.current) {
      leftLeg.current.rotation.x = walk * Math.sin(t * 8 + Math.PI) * 0.55 * tired + sit * -1.2;
      rightLeg.current.rotation.x = walk * Math.sin(t * 8) * 0.55 * tired + sit * -1.2;
    }
    g.scale.setScalar(preview ? 1 : 1);
    if (idle) g.rotation.y += Math.sin(t * 0.6) * 0.0008;
    void breath;
    void clipForActivity(activity);
  });

  const shoeGeo = useMemo(() => look.shoesId, [look.shoesId]);

  if (robot) {
    return (
      <group ref={ref} scale={[bodyScale, heightScale, bodyScale]}>
        <mesh position={[0, 0.62, 0]} castShadow>
          <boxGeometry args={[0.46, 0.62, 0.3]} />
          <meshStandardMaterial color="#6d7788" metalness={0.45} roughness={0.32} />
        </mesh>
        <mesh position={[0, 1.08, 0.02]} castShadow>
          <boxGeometry args={[0.32, 0.24, 0.26]} />
          <meshStandardMaterial color="#1b2433" emissive="#1f6b4a" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 1.28, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.22, 6]} />
          <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
        </mesh>
        <group ref={leftLeg} position={[-0.12, 0.28, 0]}>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.12, 0.22, 0.16]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
        <group ref={rightLeg} position={[0.12, 0.28, 0]}>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.12, 0.22, 0.16]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      </group>
    );
  }

  return (
    <group ref={ref} scale={[bodyScale, heightScale, bodyScale]}>
      <group ref={leftLeg} position={[-0.1, 0.42, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.32, 4, 8]} />
          <meshStandardMaterial color={look.pants} roughness={0.78} />
        </mesh>
        <mesh position={[0, -0.4, shoeGeo === "boots" ? 0.04 : 0.06]} castShadow>
          <boxGeometry args={[0.16, shoeGeo === "boots" ? 0.14 : 0.08, shoeGeo === "dress" ? 0.26 : 0.22]} />
          <meshStandardMaterial color={look.shoes} roughness={0.55} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.1, 0.42, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.075, 0.32, 4, 8]} />
          <meshStandardMaterial color={look.pants} roughness={0.78} />
        </mesh>
        <mesh position={[0, -0.4, shoeGeo === "boots" ? 0.04 : 0.06]} castShadow>
          <boxGeometry args={[0.16, shoeGeo === "boots" ? 0.14 : 0.08, shoeGeo === "dress" ? 0.26 : 0.22]} />
          <meshStandardMaterial color={look.shoes} roughness={0.55} />
        </mesh>
      </group>
      <mesh position={[0, 0.52, 0]} castShadow>
        <boxGeometry args={[look.pantsId === "joggers" ? 0.32 : 0.36, 0.18, look.pantsId === "trousers" ? 0.24 : 0.22]} />
        <meshStandardMaterial color={look.pants} roughness={look.pantsId === "jeans" ? 0.82 : 0.7} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow>
        <boxGeometry args={[hoodie || coat ? 0.5 : vest ? 0.46 : 0.42, 0.5, hoodie ? 0.32 : 0.26]} />
        <meshStandardMaterial color={look.top} roughness={hoodie ? 0.85 : 0.62} />
      </mesh>
      {hoodie ? (
        <mesh position={[0, 1.08, -0.04]}>
          <sphereGeometry args={[0.16, 10, 8, 0, Math.PI * 2, 0, 1.2]} />
          <meshStandardMaterial color={look.top} roughness={0.85} />
        </mesh>
      ) : null}
      {coat ? (
        <mesh position={[0, 0.7, 0.02]} scale={[1.12, 0.7, 1.08]}>
          <boxGeometry args={[0.5, 0.5, 0.28]} />
          <meshStandardMaterial color={look.top} roughness={0.55} />
        </mesh>
      ) : null}
      {look.topId === "labcoat" ? (
        <mesh position={[0.02, 0.78, 0.14]}>
          <boxGeometry args={[0.36, 0.42, 0.04]} />
          <meshStandardMaterial color="#f4f0e6" roughness={0.8} />
        </mesh>
      ) : null}
      <group ref={leftArm} position={[-0.28, 0.98, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
          <meshStandardMaterial color={look.top} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.34, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={look.skin} roughness={0.58} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.28, 0.98, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.32, 4, 8]} />
          <meshStandardMaterial color={look.top} roughness={0.62} />
        </mesh>
        <mesh position={[0, -0.34, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={look.skin} roughness={0.58} />
        </mesh>
        {look.accessory === "coffee" ? (
          <mesh position={[0.02, -0.42, 0.08]}>
            <cylinderGeometry args={[0.04, 0.035, 0.08, 10]} />
            <meshStandardMaterial color="#efe8dc" />
          </mesh>
        ) : null}
        {look.accessory === "phone" ? (
          <mesh position={[0.02, -0.4, 0.06]}>
            <boxGeometry args={[0.05, 0.09, 0.02]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ) : null}
        {look.accessory === "notebook" ? (
          <mesh position={[0.04, -0.32, 0.08]} rotation={[-0.4, 0.2, 0]}>
            <boxGeometry args={[0.1, 0.02, 0.14]} />
            <meshStandardMaterial color="#2b3a55" />
          </mesh>
        ) : null}
      </group>
      <group ref={head} position={[0, 1.22, 0]}>
        <FaceMesh skin={look.skin} expression={face} faceId={look.faceId} />
        <group position={[0, 0.12, 0]}>
          <HairMesh style={look.hairStyle} color={look.hair} />
        </group>
        {look.glassesId === "round" || (look.glasses && look.glassesId !== "rect" && look.glassesId !== "none") ? (
          <group>
            <mesh position={[-0.08, 0.04, 0.2]}>
              <torusGeometry args={[0.05, 0.008, 8, 12]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.3} />
            </mesh>
            <mesh position={[0.08, 0.04, 0.2]}>
              <torusGeometry args={[0.05, 0.008, 8, 12]} />
              <meshStandardMaterial color="#1a1a1a" metalness={0.4} roughness={0.3} />
            </mesh>
          </group>
        ) : null}
        {look.glassesId === "rect" ? (
          <mesh position={[0, 0.04, 0.21]}>
            <boxGeometry args={[0.26, 0.07, 0.03]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.35} roughness={0.28} />
          </mesh>
        ) : null}
        {look.accessory === "headphones" ? (
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.08, 0]}>
              <torusGeometry args={[0.2, 0.025, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[-0.2, 0.02, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.04, 10]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0.2, 0.02, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.04, 10]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          </group>
        ) : null}
      </group>
      {look.accessory === "badge" ? (
        <mesh position={[0.16, 0.86, 0.15]}>
          <boxGeometry args={[0.08, 0.1, 0.02]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>
      ) : null}
      {look.accessory === "scarf" ? (
        <mesh position={[0, 1.04, 0.08]}>
          <boxGeometry args={[0.28, 0.1, 0.16]} />
          <meshStandardMaterial color="#8a3b2f" roughness={0.85} />
        </mesh>
      ) : null}
      {look.accessory === "watch" ? (
        <mesh position={[0.28, 0.72, 0.02]}>
          <torusGeometry args={[0.04, 0.01, 8, 10]} />
          <meshStandardMaterial color="#c9a227" metalness={0.6} roughness={0.3} />
        </mesh>
      ) : null}
      {look.accessory === "backpack" ? (
        <mesh position={[0, 0.86, -0.2]}>
          <boxGeometry args={[0.28, 0.34, 0.12]} />
          <meshStandardMaterial color="#2b3a55" roughness={0.7} />
        </mesh>
      ) : null}
    </group>
  );
}
