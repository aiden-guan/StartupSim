import { describe, expect, it } from "vitest";
import { createNewGame } from "../simulation/newGame";
import { channelGains, MUSIC_STAGES, MUSIC_TRACKS, musicStateChanged, selectMusicState } from "./musicState";

const game = () => createNewGame({ founderName: "Ada", companyName: "Compounding", cofounderId: "dustin-moskovitz", skipTutorial: true, seed: 42 });

describe("adaptive music", () => {
  it("maps each physical office tier to the intended authored track", () => {
    const state = game();
    expect(selectMusicState(state, "playing")).toBe("apartment");
    for (const [level, stage] of MUSIC_STAGES.entries()) {
      state.company.officeLevel = level;
      expect(selectMusicState(state, "playing")).toBe(stage);
      expect(selectMusicState(state, "market")).toBe(stage);
      expect(selectMusicState(state, "playing", true)).toBe(stage);
    }
    state.company.officeLevel = 5;
    state.endingId = "ipo";
    expect(selectMusicState(state, "ended")).toBe("global");
    expect(selectMusicState(null, "title")).toBe("apartment");
  });

  it("uses explicit normalized tracks with clean loop bounds", () => {
    expect(MUSIC_TRACKS.apartment.file).toBe("compounding.mp3");
    expect(MUSIC_TRACKS.office.file).toBe("first-real-office.mp3");
    expect(MUSIC_TRACKS.scaleup.file).toBe("scale-up-velocity.mp3");
    expect(MUSIC_TRACKS.lab.file).toBe("compounding-intelligence.mp3");
    expect(MUSIC_TRACKS.campus.file).toBe("compounding-the-future.mp3");
    expect(MUSIC_TRACKS.global.file).toBe("global-headquarters.mp3");
    for (const stage of MUSIC_STAGES) {
      expect(MUSIC_TRACKS[stage].loopStart).toBeGreaterThan(0);
      expect(MUSIC_TRACKS[stage].loopEnd).toBeGreaterThan(MUSIC_TRACKS[stage].loopStart);
    }
  });

  it("does not treat a same-stage update as a music transition", () => {
    expect(musicStateChanged("apartment", "apartment")).toBe(false);
    expect(musicStateChanged("apartment", "office")).toBe(true);
  });

  it("keeps bus volumes independent behind the common master and mute", () => {
    const settings = game().settings;
    const initial = channelGains(settings);
    const musicOnly = channelGains({ ...settings, musicVolume: 0 });
    expect(musicOnly.music).toBe(0);
    expect(musicOnly.sfx).toBe(initial.sfx);
    expect(musicOnly.ambient).toBe(initial.ambient);
    const sfxOnly = channelGains({ ...settings, sfxVolume: 0 });
    expect(sfxOnly.sfx).toBe(0);
    expect(sfxOnly.music).toBe(initial.music);
    const ambientOnly = channelGains({ ...settings, ambientVolume: 0 });
    expect(ambientOnly.ambient).toBe(0);
    expect(ambientOnly.music).toBe(initial.music);
    expect(channelGains({ ...settings, mute: true }).master).toBe(0);
    expect(channelGains({ ...settings, masterVolume: 0 }).master).toBe(0);
  });
});
