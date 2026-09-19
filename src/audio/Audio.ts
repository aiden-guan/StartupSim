import type { GameState } from "../simulation/types";
import { channelGains, MUSIC_MIX, MUSIC_STEMS, type MusicState, type MusicStem } from "./musicState";

type Settings = Pick<GameState["settings"], "mute" | "masterVolume" | "sfxVolume" | "musicVolume" | "ambientVolume">;
type LegacySfx = "click" | "success" | "warn" | "notify" | "complete" | "capture";
export type SfxId = "ui.click" | "ui.select" | "money.gain" | "money.spend" | "research" | "product.ready" | "product.launch" | "people.stamp" | "business.major" | "market.capture" | "market.rival" | "message" | "crisis";
type AmbientKind = "apartment" | "office" | "lab" | null;

const DEFAULTS: Settings = { mute: false, masterVolume: .72, sfxVolume: .8, musicVolume: .35, ambientVolume: .28 };
const SFX_FILES: Record<SfxId, string> = {
  "ui.click": "ui-click", "ui.select": "ui-select", "money.gain": "money-gain", "money.spend": "money-spend",
  research: "research", "product.ready": "product-ready", "product.launch": "launch", "people.stamp": "paper-stamp",
  "business.major": "major", "market.capture": "market-capture", "market.rival": "market-rival", message: "notify", crisis: "crisis",
};
const LEGACY: Record<LegacySfx, SfxId> = {
  click: "ui.click", success: "ui.select", warn: "crisis", notify: "message", complete: "product.ready", capture: "market.capture",
};
interface AmbientVoice { source: AudioBufferSourceNode; hum: OscillatorNode; gain: GainNode }

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private settings: Settings = DEFAULTS;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private music = new Map<MusicStem, { source: AudioBufferSourceNode; gain: GainNode }>();
  private musicState: MusicState = "title";
  private musicLoading = false;
  private ambientKind: AmbientKind = null;
  private ambientVoice: AmbientVoice | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private activeSfx = 0;
  private lastSfx = new Map<SfxId, number>();
  private duckEnd = 0;

  private context(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (this.ctx) return this.ctx;
    try {
      const ctx = new AudioContext();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.sfxBus = ctx.createGain();
      this.musicBus = ctx.createGain();
      this.ambientBus = ctx.createGain();
      this.duckGain = ctx.createGain();
      this.sfxBus.connect(this.master);
      this.musicBus.connect(this.duckGain);
      this.duckGain.connect(this.master);
      this.ambientBus.connect(this.master);
      this.master.connect(ctx.destination);
      this.applySettings();
      return ctx;
    } catch { return null; }
  }

  private applySettings() {
    if (!this.ctx || !this.master || !this.sfxBus || !this.musicBus || !this.ambientBus) return;
    const gains = channelGains(this.settings);
    const at = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(gains.master, at, .03);
    this.sfxBus.gain.setTargetAtTime(gains.sfx * .9, at, .03);
    this.musicBus.gain.setTargetAtTime(gains.music * .58, at, .08);
    this.ambientBus.gain.setTargetAtTime(gains.ambient * .32, at, .08);
  }
  configure(settings?: Partial<Settings>) { if (settings) this.settings = { ...this.settings, ...settings }; this.applySettings(); }
  unlock() {
    const ctx = this.context();
    if (!ctx) return;
    void ctx.resume().then(() => {
      this.startMusic();
      if (this.ambientKind && !this.ambientVoice) this.startAmbient(this.ambientKind);
    }).catch(() => undefined);
  }
  pause() { if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => undefined); }
  resume() { if (this.ctx) this.unlock(); }

  private buffer(path: string): Promise<AudioBuffer | null> {
    const old = this.buffers.get(path);
    if (old) return old;
    const ctx = this.context();
    if (!ctx) return Promise.resolve(null);
    const request = fetch(`${import.meta.env.BASE_URL}assets/audio/${path}`)
      .then((response) => response.ok ? response.arrayBuffer() : Promise.reject(new Error("Audio asset unavailable")))
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null);
    this.buffers.set(path, request);
    return request;
  }
  private fallback(id: SfxId) {
    if (!this.ctx || !this.sfxBus) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = id === "crisis" ? 180 : id === "product.launch" ? 392 : 540;
    gain.gain.setValueAtTime(.025, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + .12);
    osc.connect(gain).connect(this.sfxBus);
    osc.start(); osc.stop(this.ctx.currentTime + .12);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  playSfx(id: SfxId, settings?: Partial<Settings>, options?: { pitchVariance?: number; gainVariance?: number }) {
    this.configure(settings);
    if (this.settings.mute || this.settings.masterVolume <= 0 || this.settings.sfxVolume <= 0) return;
    const now = typeof performance === "undefined" ? 0 : performance.now();
    if (now - (this.lastSfx.get(id) ?? -Infinity) < (id === "ui.click" ? 45 : 90) || this.activeSfx >= 10) return;
    this.lastSfx.set(id, now);
    this.unlock();
    void this.buffer(`sfx/${SFX_FILES[id]}.wav`).then((buffer) => {
      if (!this.ctx || !this.sfxBus || this.settings.mute) return;
      if (!buffer) { this.fallback(id); return; }
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      source.buffer = buffer;
      source.playbackRate.value = 1 + (Math.random() * 2 - 1) * (options?.pitchVariance ?? .018);
      gain.gain.value = .75 * (1 + (Math.random() * 2 - 1) * (options?.gainVariance ?? .045));
      source.connect(gain).connect(this.sfxBus);
      this.activeSfx++;
      source.onended = () => { this.activeSfx--; source.disconnect(); gain.disconnect(); };
      source.start();
    });
  }
  play(kind: LegacySfx, settings?: Partial<Settings>) { this.playSfx(LEGACY[kind], settings); }

  setMusicState(state: MusicState) {
    if (this.musicState === state) return;
    this.musicState = state;
    this.applyMusicMix();
  }
  private startMusic() {
    if (this.musicLoading || this.music.size || !this.ctx || !this.musicBus) return;
    this.musicLoading = true;
    void Promise.all(MUSIC_STEMS.map((stem) => this.buffer(`music/${stem}.wav`))).then((buffers) => {
      if (!this.ctx || !this.musicBus || this.ctx.state !== "running") return;
      const startAt = this.ctx.currentTime + .08;
      for (let i = 0; i < MUSIC_STEMS.length; i++) {
        const buffer = buffers[i];
        if (!buffer) continue;
        const stem = MUSIC_STEMS[i]!;
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        source.buffer = buffer; source.loop = true; gain.gain.value = 0;
        source.connect(gain).connect(this.musicBus);
        source.start(startAt);
        this.music.set(stem, { source, gain });
      }
      this.applyMusicMix();
    }).finally(() => { this.musicLoading = false; });
  }
  private applyMusicMix() {
    if (!this.ctx) return;
    const mix = MUSIC_MIX[this.musicState];
    for (const stem of MUSIC_STEMS) this.music.get(stem)?.gain.gain.setTargetAtTime(mix[stem], this.ctx.currentTime, 1.1);
  }
  duck(duration = 1.3, depth = .52) {
    if (!this.ctx || !this.duckGain) return;
    const now = this.ctx.currentTime;
    const gain = this.duckGain.gain;
    this.duckEnd = Math.max(this.duckEnd, now + duration);
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(depth, now + .10);
    gain.setValueAtTime(depth, this.duckEnd);
    gain.linearRampToValueAtTime(1, this.duckEnd + .65);
  }

  private noise(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buffer;
    return buffer;
  }
  private stopAmbient(voice: AmbientVoice) {
    if (!this.ctx) return;
    voice.gain.gain.setTargetAtTime(0, this.ctx.currentTime, .45);
    window.setTimeout(() => {
      try { voice.source.stop(); voice.hum.stop(); } catch { /* already stopped */ }
      voice.source.disconnect(); voice.hum.disconnect(); voice.gain.disconnect();
    }, 1800);
  }
  private startAmbient(kind: Exclude<AmbientKind, null>) {
    if (!this.ctx || !this.ambientBus) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const hum = this.ctx.createOscillator();
    source.buffer = this.noise(this.ctx); source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = kind === "lab" ? 340 : kind === "office" ? 550 : 760;
    hum.type = "sine";
    hum.frequency.value = kind === "lab" ? 84 : kind === "office" ? 60 : 52;
    source.connect(filter).connect(gain);
    hum.connect(gain);
    gain.connect(this.ambientBus);
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(kind === "lab" ? .048 : kind === "office" ? .036 : .024, this.ctx.currentTime, .65);
    source.start(); hum.start();
    this.ambientVoice = { source, hum, gain };
  }
  setAmbient(kind: AmbientKind, settings?: Partial<Settings>) {
    this.configure(settings);
    if (kind === this.ambientKind && (kind === null || this.ambientVoice || !this.ctx)) return;
    this.ambientKind = kind;
    if (this.ambientVoice) { this.stopAmbient(this.ambientVoice); this.ambientVoice = null; }
    if (kind && this.ctx?.state === "running") this.startAmbient(kind);
  }
}

export const audio = new AudioEngine();
