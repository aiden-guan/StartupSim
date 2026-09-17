import { create } from "zustand";
import { layoutFor } from '../navigation/layout';

export type CameraMode = "PLAYER" | "CINEMATIC" | "FOCUS" | "TRANSITIONING";

export interface CameraGoal {
  position: [number, number, number];
  target: [number, number, number];
  duration: number;
  mode: CameraMode;
}

interface CameraState {
  goal: CameraGoal;
  restored: CameraGoal | null;
  orbitEnabled: boolean;
  setGoal: (goal: Partial<CameraGoal> & Pick<CameraGoal, "position" | "target">) => void;
  overview: (level: number) => void;
  focusPoint: (position: [number, number, number], target?: [number, number, number], duration?: number) => void;
  restorePlayer: (level: number) => void;
  setOrbitEnabled: (enabled: boolean) => void;
}

export function overviewShot(level: number): CameraGoal {
  const {camera}=layoutFor(level);
  return {position:camera.overview,target:camera.target,duration:.9,mode:'PLAYER'};
}

export const TITLE_SHOT: CameraGoal = {
  position: [9, 9, 11],
  target: [0.2, 0.25, -0.7],
  duration: 1.2,
  mode: "CINEMATIC",
};

export const PREVIEW_SHOT: CameraGoal = {
  position: [0.2, 2.4, 4.6],
  target: [0, 1.05, 0],
  duration: 0.7,
  mode: "FOCUS",
};

export const useCameraDirector = create<CameraState>((set, get) => ({
  goal: TITLE_SHOT,
  restored: null,
  orbitEnabled: false,
  setGoal: (goal) =>
    set({
      goal: {
        ...get().goal,
        duration: 0.8,
        mode: "TRANSITIONING",
        ...goal,
      },
    }),
  overview: (level) => {
    const shot = overviewShot(level);
    set({ goal: shot, orbitEnabled: true, restored: shot });
  },
  focusPoint: (position, target = [position[0], 1, position[2]], duration = 0.8) => {
    const current = get().goal;
    set({
      restored: get().restored ?? current,
      orbitEnabled: false,
      goal: { position, target, duration, mode: "FOCUS" },
    });
  },
  restorePlayer: (level) => {
    const shot = get().restored ?? overviewShot(level);
    set({ goal: { ...shot, duration: 0.7, mode: "PLAYER" }, orbitEnabled: true });
  },
  setOrbitEnabled: (enabled) => set({ orbitEnabled: enabled }),
}));
