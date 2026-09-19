import type { GameState, ScreenId } from "../simulation/types";

export type MusicState = "title" | "apartment" | "early" | "growth" | "scale" | "hypergrowth" | "market" | "crisis" | "ending";
export type MusicStem = "pad" | "pulse" | "bass" | "lead" | "market" | "tension";

export const MUSIC_STEMS: MusicStem[] = ["pad", "pulse", "bass", "lead", "market", "tension"];

export function selectMusicState(game: GameState | null, screen: ScreenId, critical = false): MusicState {
  if (screen === "title" || !game) return "title";
  if (screen === "ended" || game.endingId) return "ending";
  if (screen === "market") return "market";
  if (critical) return "crisis";
  if (game.company.officeLevel <= 0) return "apartment";
  const valuation = Math.max(game.company.valuation, game.stats.peakValuation);
  if (game.company.officeLevel >= 5 || valuation >= 1_000_000_000) return "hypergrowth";
  if (game.company.officeLevel >= 3 || valuation >= 100_000_000) return "scale";
  if (game.company.officeLevel >= 2 || valuation >= 10_000_000) return "growth";
  return "early";
}

export const MUSIC_MIX: Record<MusicState, Record<MusicStem, number>> = {
  title:       { pad: 0.42, pulse: 0,    bass: 0,    lead: 0,    market: 0,    tension: 0 },
  apartment:   { pad: 0.52, pulse: 0,    bass: 0,    lead: 0,    market: 0,    tension: 0 },
  early:       { pad: 0.58, pulse: 0.20, bass: 0,    lead: 0,    market: 0,    tension: 0 },
  growth:      { pad: 0.64, pulse: 0.28, bass: 0.31, lead: 0,    market: 0,    tension: 0 },
  scale:       { pad: 0.69, pulse: 0.36, bass: 0.42, lead: 0.22, market: 0,    tension: 0 },
  hypergrowth: { pad: 0.72, pulse: 0.42, bass: 0.48, lead: 0.38, market: 0,    tension: 0 },
  market:      { pad: 0.25, pulse: 0,    bass: 0.20, lead: 0,    market: 0.58, tension: 0 },
  crisis:      { pad: 0.24, pulse: 0,    bass: 0.12, lead: 0,    market: 0,    tension: 0.48 },
  ending:      { pad: 0.75, pulse: 0.16, bass: 0.32, lead: 0.50, market: 0,    tension: 0 },
};

export function channelGains(settings: Pick<GameState["settings"], "mute" | "masterVolume" | "sfxVolume" | "musicVolume" | "ambientVolume">) {
  const master = settings.mute ? 0 : Math.max(0, Math.min(1, settings.masterVolume));
  return {
    master,
    sfx: Math.max(0, Math.min(1, settings.sfxVolume)),
    music: Math.max(0, Math.min(1, settings.musicVolume)),
    ambient: Math.max(0, Math.min(1, settings.ambientVolume)),
  };
}
