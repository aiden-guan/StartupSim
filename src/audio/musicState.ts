import type { GameState, ScreenId } from "../simulation/types";

/** The six authored songs follow the physical company stage, not valuation alone. */
export type MusicStage = "apartment" | "office" | "scaleup" | "lab" | "campus" | "global";
export type MusicState = MusicStage;

export interface MusicTrack {
  file: string;
  /** Linear compensation retained as a final safety trim after offline mastering. */
  gain: number;
  /** The processed runtime asset crossfades its tail into its opening; loop from this point. */
  loopStart: number;
  loopEnd: number;
}

export const MUSIC_STAGES: readonly MusicStage[] = ["apartment", "office", "scaleup", "lab", "campus", "global"];

export const MUSIC_TRACKS: Record<MusicStage, MusicTrack> = {
  apartment: { file: "compounding.mp3", gain: 1, loopStart: 2.5, loopEnd: 177.84 },
  office: { file: "first-real-office.mp3", gain: 1, loopStart: 2.5, loopEnd: 118.8 },
  scaleup: { file: "scale-up-velocity.mp3", gain: 1, loopStart: 2.5, loopEnd: 180.048 },
  lab: { file: "compounding-intelligence.mp3", gain: 1, loopStart: 2.5, loopEnd: 118.78 },
  // This short source measured about 1 dB louder after loop preparation; keep the stage trim explicit.
  campus: { file: "compounding-the-future.mp3", gain: 0.88, loopStart: 2.5, loopEnd: 29.76 },
  global: { file: "global-headquarters.mp3", gain: 1, loopStart: 2.5, loopEnd: 29.46 },
};

function stageForOfficeLevel(officeLevel: number): MusicStage {
  const level = Math.max(0, Math.min(MUSIC_STAGES.length - 1, Math.floor(officeLevel)));
  return MUSIC_STAGES[level] ?? "apartment";
}

/**
 * Selects only the song that belongs to the physical office tier.
 * Title/setup, market, crisis, and ending are contexts layered over that same stage.
 */
export function selectMusicState(game: GameState | null, _screen: ScreenId, _critical = false): MusicState {
  return stageForOfficeLevel(game?.company.officeLevel ?? 0);
}

export function musicStateChanged(previous: MusicState, next: MusicState): boolean {
  return previous !== next;
}

export function channelGains(settings: Pick<GameState["settings"], "mute" | "masterVolume" | "sfxVolume" | "musicVolume" | "ambientVolume">) {
  const master = settings.mute ? 0 : Math.max(0, Math.min(1, settings.masterVolume));
  return {
    master,
    sfx: Math.max(0, Math.min(1, settings.sfxVolume)),
    music: Math.max(0, Math.min(1, settings.musicVolume)),
    ambient: Math.max(0, Math.min(1, settings.ambientVolume)),
  };
}
