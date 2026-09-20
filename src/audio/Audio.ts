import type { GameState } from "../simulation/types";
import { channelGains, MUSIC_TRACKS, musicStateChanged, type MusicStage, type MusicState } from "./musicState";

type Settings = Pick<GameState["settings"], "mute" | "masterVolume" | "sfxVolume" | "musicVolume" | "ambientVolume">;
type LegacySfx = "click" | "success" | "warn" | "notify" | "complete" | "capture";
export type SfxId = "ui.click" | "ui.select" | "money.gain" | "money.spend" | "research" | "product.ready" | "product.launch" | "people.stamp" | "business.major" | "market.capture" | "market.rival" | "message" | "crisis";
export interface SfxPlaybackOptions {
  pitchVariance?: number;
  gainVariance?: number;
  playbackRate?: number;
  gain?: number;
}
type AmbientKind = "apartment" | "office" | "lab" | null;

const DEFAULTS: Settings = { mute: false, masterVolume: .72, sfxVolume: .8, musicVolume: .35, ambientVolume: .28 };
const CROSSFADE_SECONDS = 3;
const INITIAL_MUSIC_FADE_SECONDS = .8;
const MUSIC_BUFFER_CACHE_LIMIT = 2;

export interface SfxConfig {
  file: string;
  gain: number;
  playbackRate?: number;
}

/** Multiple semantic events intentionally share the two authored source files. */
export const SFX_CONFIG: Record<SfxId, SfxConfig> = {
  "ui.click": { file: "sfx/ui-click.wav", gain: .7 },
  "ui.select": { file: "sfx/ui-select.wav", gain: .7 },
  "money.gain": { file: "sfx/money-gain.wav", gain: .62 },
  "money.spend": { file: "sfx/money-spend.wav", gain: .62 },
  // Premium positive cue: research gets a slightly brighter, restrained variation.
  research: { file: "sfx/completion.mp3", gain: .38, playbackRate: 1.035 },
  // Premium positive cue: product readiness stays at the reference pitch.
  "product.ready": { file: "sfx/completion.mp3", gain: .42, playbackRate: 1 },
  "product.launch": { file: "sfx/launch.wav", gain: .7 },
  "people.stamp": { file: "sfx/paper-stamp.wav", gain: .62 },
  // Business milestones use the same authored cue with a slightly heavier presentation.
  "business.major": { file: "sfx/completion.mp3", gain: .44, playbackRate: .99 },
  "market.capture": { file: "sfx/market-capture.wav", gain: .7 },
  "market.rival": { file: "sfx/market-rival.wav", gain: .62 },
  message: { file: "sfx/notify.wav", gain: .6 },
  // Premium negative cue for crisis/burnout; trivial invalid actions remain procedural.
  crisis: { file: "sfx/error.mp3", gain: .34, playbackRate: 1 },
};

const LEGACY: Record<LegacySfx, SfxId> = {
  click: "ui.click", success: "ui.select", warn: "crisis", notify: "message", complete: "product.ready", capture: "market.capture",
};

interface AmbientVoice { source: AudioBufferSourceNode; hum: OscillatorNode; gain: GainNode }
interface MusicVoice { stage: MusicStage; file: string; source: AudioBufferSourceNode; gain: GainNode }

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private settings: Settings = DEFAULTS;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private musicData = new Map<string, Promise<ArrayBuffer | null>>();
  private musicBuffers = new Map<string, { buffer: AudioBuffer; usedAt: number }>();
  private musicBufferUse = 0;
  private musicVoice: MusicVoice | null = null;
  private retiringMusic: MusicVoice | null = null;
  private retireTimer: number | null = null;
  private musicPendingPath: string | null = null;
  private musicTransitionToken = 0;
  private musicState: MusicState = "apartment";
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

  private assetUrl(path: string): string {
    return `${import.meta.env.BASE_URL}assets/audio/${path}`;
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

  configure(settings?: Partial<Settings>) {
    if (settings) this.settings = { ...this.settings, ...settings };
    this.applySettings();
  }

  unlock() {
    const ctx = this.context();
    if (!ctx) return;
    void ctx.resume().then(() => {
      this.startMusic();
      if (this.ambientKind && !this.ambientVoice) this.startAmbient(this.ambientKind);
    }).catch(() => undefined);
  }

  pause() {
    if (this.ctx?.state === "running") void this.ctx.suspend().catch(() => undefined);
  }

  resume() {
    if (this.ctx) this.unlock();
  }

  private buffer(path: string): Promise<AudioBuffer | null> {
    const old = this.buffers.get(path);
    if (old) return old;
    const ctx = this.context();
    if (!ctx) return Promise.resolve(null);
    const request = fetch(this.assetUrl(path))
      .then((response) => response.ok ? response.arrayBuffer() : Promise.reject(new Error("Audio asset unavailable")))
      .then((data) => ctx.decodeAudioData(data))
      .catch(() => null);
    this.buffers.set(path, request);
    return request;
  }

  private musicDataBuffer(path: string): Promise<ArrayBuffer | null> {
    const old = this.musicData.get(path);
    if (old) return old;
    const request = fetch(this.assetUrl(path))
      .then((response) => response.ok ? response.arrayBuffer() : Promise.reject(new Error("Music asset unavailable")))
      .catch(() => null);
    this.musicData.set(path, request);
    return request;
  }

  private trimMusicBufferCache() {
    const protectedFiles = new Set<string>();
    if (this.musicVoice) protectedFiles.add(this.musicVoice.file);
    if (this.retiringMusic) protectedFiles.add(this.retiringMusic.file);
    if (this.musicPendingPath) protectedFiles.add(this.musicPendingPath);
    while (this.musicBuffers.size > MUSIC_BUFFER_CACHE_LIMIT) {
      const candidate = [...this.musicBuffers.entries()]
        .filter(([file]) => !protectedFiles.has(file))
        .sort((a, b) => a[1].usedAt - b[1].usedAt)[0];
      if (!candidate) break;
      this.musicBuffers.delete(candidate[0]);
    }
  }

  private musicBuffer(stage: MusicStage): Promise<AudioBuffer | null> {
    const track = MUSIC_TRACKS[stage];
    const cached = this.musicBuffers.get(track.file);
    if (cached) {
      cached.usedAt = ++this.musicBufferUse;
      return Promise.resolve(cached.buffer);
    }
    const ctx = this.context();
    if (!ctx) return Promise.resolve(null);
    return this.musicDataBuffer(`music/${track.file}`).then((data) => {
      if (!data || this.ctx !== ctx) return null;
      return ctx.decodeAudioData(data.slice(0)).catch(() => null);
    }).then((buffer) => {
      if (!buffer) return null;
      this.musicBuffers.set(track.file, { buffer, usedAt: ++this.musicBufferUse });
      this.trimMusicBufferCache();
      return buffer;
    });
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
    osc.start();
    osc.stop(this.ctx.currentTime + .12);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }

  playSfx(id: SfxId, settings?: Partial<Settings>, options?: SfxPlaybackOptions) {
    this.configure(settings);
    if (this.settings.mute || this.settings.masterVolume <= 0 || this.settings.sfxVolume <= 0) return;
    const now = typeof performance === "undefined" ? 0 : performance.now();
    if (now - (this.lastSfx.get(id) ?? -Infinity) < (id === "ui.click" ? 45 : 90) || this.activeSfx >= 10) return;
    this.lastSfx.set(id, now);
    this.unlock();
    const config = SFX_CONFIG[id];
    void this.buffer(config.file).then((buffer) => {
      if (!this.ctx || !this.sfxBus || this.settings.mute) return;
      if (!buffer) { this.fallback(id); return; }
      const source = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      source.buffer = buffer;
      const pitchVariance = options?.pitchVariance ?? .018;
      const gainVariance = options?.gainVariance ?? .045;
      const playbackRate = options?.playbackRate ?? config.playbackRate ?? 1;
      source.playbackRate.value = playbackRate * (1 + (Math.random() * 2 - 1) * pitchVariance);
      gain.gain.value = (options?.gain ?? config.gain) * (1 + (Math.random() * 2 - 1) * gainVariance);
      source.connect(gain).connect(this.sfxBus);
      this.activeSfx++;
      source.onended = () => { this.activeSfx--; source.disconnect(); gain.disconnect(); };
      source.start();
    });
  }

  play(kind: LegacySfx, settings?: Partial<Settings>) {
    this.playSfx(LEGACY[kind], settings);
  }

  setMusicState(state: MusicState) {
    if (!musicStateChanged(this.musicState, state)) return;
    this.musicState = state;
    this.startMusic();
  }

  private createMusicVoice(stage: MusicStage, buffer: AudioBuffer): MusicVoice | null {
    if (!this.ctx || !this.musicBus) return null;
    const track = MUSIC_TRACKS[stage];
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const loopEnd = Math.min(Math.max(track.loopEnd, .05), buffer.duration);
    const loopStart = Math.min(Math.max(track.loopStart, 0), Math.max(.01, loopEnd - .01));
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = loopStart;
    source.loopEnd = loopEnd;
    source.connect(gain).connect(this.musicBus);
    return { stage, file: track.file, source, gain };
  }

  private holdGain(gain: GainNode, at: number) {
    gain.gain.cancelScheduledValues(at);
    gain.gain.setValueAtTime(gain.gain.value, at);
  }

  private disposeMusicVoice(voice: MusicVoice) {
    try { voice.source.stop(); } catch { /* already stopped */ }
    voice.source.disconnect();
    voice.gain.disconnect();
  }

  private clearRetiringMusic() {
    if (this.retireTimer !== null) window.clearTimeout(this.retireTimer);
    this.retireTimer = null;
    if (this.retiringMusic) this.disposeMusicVoice(this.retiringMusic);
    this.retiringMusic = null;
  }

  private transitionMusic(stage: MusicStage, fadeSeconds: number) {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || !this.musicBus) return;
    const token = ++this.musicTransitionToken;
    const outgoing = this.musicVoice;
    const track = MUSIC_TRACKS[stage];
    this.musicPendingPath = track.file;
    void this.musicBuffer(stage).then((buffer) => {
      if (!buffer || this.ctx !== ctx || ctx.state !== "running" || token !== this.musicTransitionToken || this.musicState !== stage) {
        if (token === this.musicTransitionToken) this.musicPendingPath = null;
        return;
      }
      if (this.musicVoice?.stage === stage) {
        this.musicPendingPath = null;
        return;
      }
      this.clearRetiringMusic();
      const incoming = this.createMusicVoice(stage, buffer);
      if (!incoming) {
        this.musicPendingPath = null;
        return;
      }
      const now = ctx.currentTime;
      const end = now + fadeSeconds;
      incoming.gain.gain.setValueAtTime(0, now);
      incoming.gain.gain.linearRampToValueAtTime(track.gain, end);
      incoming.source.start(now + .03);
      if (outgoing) {
        this.holdGain(outgoing.gain, now);
        outgoing.gain.gain.linearRampToValueAtTime(0, end);
        this.retiringMusic = outgoing;
        this.retireTimer = window.setTimeout(() => {
          if (this.retiringMusic !== outgoing) return;
          this.disposeMusicVoice(outgoing);
          this.retiringMusic = null;
          this.retireTimer = null;
          this.trimMusicBufferCache();
        }, (fadeSeconds + .15) * 1000);
      }
      this.musicVoice = incoming;
      this.musicPendingPath = null;
      this.trimMusicBufferCache();
    }).catch(() => {
      if (token === this.musicTransitionToken) this.musicPendingPath = null;
    });
  }

  private startMusic() {
    if (!this.ctx || this.ctx.state !== "running") return;
    if (this.musicVoice?.stage === this.musicState) return;
    this.transitionMusic(this.musicState, this.musicVoice ? CROSSFADE_SECONDS : INITIAL_MUSIC_FADE_SECONDS);
  }

  duck(duration = 1.3, depth = .52) {
    if (!this.ctx || !this.duckGain) return;
    const now = this.ctx.currentTime;
    const gain = this.duckGain.gain;
    this.duckEnd = Math.max(this.duckEnd, now + duration);
    this.holdGain(this.duckGain, now);
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
      voice.source.disconnect();
      voice.hum.disconnect();
      voice.gain.disconnect();
    }, 1800);
  }

  private startAmbient(kind: Exclude<AmbientKind, null>) {
    if (!this.ctx || !this.ambientBus) return;
    const source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const hum = this.ctx.createOscillator();
    source.buffer = this.noise(this.ctx);
    source.loop = true;
    filter.type = "lowpass";
    filter.frequency.value = kind === "lab" ? 340 : kind === "office" ? 550 : 760;
    hum.type = "sine";
    hum.frequency.value = kind === "lab" ? 84 : kind === "office" ? 60 : 52;
    source.connect(filter).connect(gain);
    hum.connect(gain);
    gain.connect(this.ambientBus);
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(kind === "lab" ? .048 : kind === "office" ? .036 : .024, this.ctx.currentTime, .65);
    source.start();
    hum.start();
    this.ambientVoice = { source, hum, gain };
  }

  setAmbient(kind: AmbientKind, settings?: Partial<Settings>) {
    this.configure(settings);
    if (kind === this.ambientKind && (kind === null || this.ambientVoice || !this.ctx)) return;
    this.ambientKind = kind;
    if (this.ambientVoice) {
      this.stopAmbient(this.ambientVoice);
      this.ambientVoice = null;
    }
    if (kind && this.ctx?.state === "running") this.startAmbient(kind);
  }
}

export const audio = new AudioEngine();
