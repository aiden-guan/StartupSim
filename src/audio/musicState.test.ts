import { describe, expect, it } from "vitest";
import { createNewGame } from "../simulation/newGame";
import { channelGains, MUSIC_MIX, selectMusicState } from "./musicState";

const game = () => createNewGame({ founderName: "Ada", companyName: "Compounding", cofounderId: "dustin-moskovitz", skipTutorial: true, seed: 42 });

describe("adaptive music", () => {
  it("selects apartment, market, crisis, scale and ending scenes", () => {
    const state = game();
    expect(selectMusicState(state, "playing")).toBe("apartment");
    expect(selectMusicState(state, "market")).toBe("market");
    expect(selectMusicState(state, "playing", true)).toBe("crisis");
    state.company.officeLevel = 4;
    expect(selectMusicState(state, "playing")).toBe("scale");
    state.endingId = "ipo";
    expect(selectMusicState(state, "ended")).toBe("ending");
    expect(MUSIC_MIX.apartment.pulse).toBe(0);
    expect(MUSIC_MIX.scale.pulse).toBeGreaterThan(0);
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
