import { create } from "zustand";

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
  if (level >= 5) return { position: [22, 24, 22], target: [0, 0.6, 0], duration: 0.9, mode: "PLAYER" };
  if (level >= 3) return { position: [16, 18, 18], target: [0, 0.5, 0], duration: 0.9, mode: "PLAYER" };
  if (level >= 1) return { position: [12, 13, 13], target: [0, 0.5, 0], duration: 0.9, mode: "PLAYER" };
  return { position: [10, 11, 13], target: [0.2, 0.4, -0.5], duration: 0.9, mode: "PLAYER" };
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
