import { describe, expect, it } from "vitest";
import { SFX_CONFIG } from "./Audio";

describe("authored SFX configuration", () => {
  it("maps high-value positive events to the extracted completion asset", () => {
    expect(SFX_CONFIG["product.ready"].file).toBe("sfx/completion.mp3");
    expect(SFX_CONFIG.research.file).toBe("sfx/completion.mp3");
    expect(SFX_CONFIG["business.major"].file).toBe("sfx/completion.mp3");
    expect(SFX_CONFIG.research.playbackRate).toBeGreaterThan(1);
  });

  it("maps meaningful negative feedback to the authored error asset", () => {
    expect(SFX_CONFIG.crisis.file).toBe("sfx/error.mp3");
    expect(SFX_CONFIG.crisis.gain).toBeGreaterThan(0);
  });

  it("keeps every semantic ID on an authored file or an explicit legacy fallback", () => {
    for (const config of Object.values(SFX_CONFIG)) {
      expect(config.file.startsWith("sfx/")).toBe(true);
      expect(config.gain).toBeGreaterThan(0);
    }
    expect(SFX_CONFIG["ui.click"].file).toBe("sfx/ui-click.wav");
    expect(SFX_CONFIG["product.launch"].file).toBe("sfx/launch.wav");
  });
});
