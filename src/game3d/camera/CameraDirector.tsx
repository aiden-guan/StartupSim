import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useCameraDirector } from "./cameraStore";
import { useGame } from "../../state/store";

function ease(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function CameraDirector({
  reducedMotion,
  minDistance = 6,
  maxDistance = 36,
}: {
  reducedMotion: boolean;
  minDistance?: number;
  maxDistance?: number;
}) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const goal = useCameraDirector((s) => s.goal);
  const orbitEnabled = useCameraDirector((s) => s.orbitEnabled);
  const fromPos = useRef(new THREE.Vector3());
  const fromTarget = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3(...goal.target));
  const t = useRef(1);
  const skip = useRef(false);

  const controlsRef = useRef<any>(null);

  useEffect(() => {
    fromPos.current.copy(camera.position);
    fromTarget.current.copy(look.current);
    t.current = reducedMotion ? 1 : 0;
    skip.current = false;
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
    }
  }, [goal, camera, reducedMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " ") skip.current = true;
    };
    const onPointer = () => {
      skip.current = true;
    };
    window.addEventListener("keydown", onKey);
    gl.domElement.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      gl.domElement.removeEventListener("pointerdown", onPointer);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const duration = Math.max(0.05, goal.duration);
    t.current = skip.current || reducedMotion ? 1 : Math.min(1, t.current + dt / duration);
    const k = ease(t.current);
    const isTransitioning = t.current < 1;

    if (isTransitioning || !orbitEnabled || reducedMotion) {
      camera.position.lerpVectors(fromPos.current, new THREE.Vector3(...goal.position), k);
    }
    look.current.lerpVectors(fromTarget.current, new THREE.Vector3(...goal.target), k);

    if (isTransitioning || !orbitEnabled) {
      camera.lookAt(look.current);
    }

    if (!isTransitioning && orbitEnabled && controlsRef.current) {
      if (!controlsRef.current.enabled) {
        controlsRef.current.target.copy(look.current);
        controlsRef.current.update();
        controlsRef.current.enabled = true;
      }
    }

    if (goal.mode === "CINEMATIC" && !reducedMotion) {
      const drift = Math.sin(performance.now() / 4200) * 0.35;
      camera.position.x += drift * dt * 4;
      camera.lookAt(look.current);
    }
  });

  const drawer = useGame((s) => s.drawer);
  const pendingMentor = useGame((s) => s.game?.pendingMentor);

  return orbitEnabled ? (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableZoom={!drawer && !pendingMentor}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.8}
      minDistance={minDistance}
      maxDistance={maxDistance}
      target={look.current}
    />
  ) : null;
}
