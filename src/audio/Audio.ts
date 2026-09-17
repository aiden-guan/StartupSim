type Sfx = "click" | "success" | "warn" | "notify" | "complete" | "capture";
type AmbientKind = "apartment" | "office" | "lab" | null;

let ctx: AudioContext | null = null;
let ambientNodes: { stop: () => void } | null = null;

function context() {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  return ctx;
}

function beep(freq: number, dur: number, type: OscillatorType, vol: number, when = 0) {
  const ac = context();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + when + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + when);
  osc.stop(ac.currentTime + when + dur);
}

function startNoise(kind: Exclude<AmbientKind, null>, vol: number) {
  const ac = context();
  if (!ac || vol <= 0) return null;
  const buffer = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = kind === "lab" ? 280 : kind === "office" ? 420 : 620;
  const gain = ac.createGain();
  gain.gain.value = vol * (kind === "lab" ? 0.045 : 0.03);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start();
  const hum = ac.createOscillator();
  const humGain = ac.createGain();
  hum.type = "sine";
  hum.frequency.value = kind === "lab" ? 90 : 58;
  humGain.gain.value = vol * (kind === "apartment" ? 0.004 : 0.01);
  hum.connect(humGain);
  humGain.connect(ac.destination);
  hum.start();
  return {
    stop() {
      try {
        src.stop();
        hum.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}

export const audio = {
  play(kind: Sfx, settings?: { mute?: boolean; masterVolume?: number; sfxVolume?: number }) {
    if (settings?.mute) return;
    const vol = (settings?.masterVolume ?? 0.7) * (settings?.sfxVolume ?? 0.8) * 0.08;
    if (vol <= 0) return;
    if (kind === "click") beep(420, 0.05, "square", vol);
    if (kind === "success") {
      beep(520, 0.08, "triangle", vol);
      beep(740, 0.12, "triangle", vol * 0.8, 0.07);
    }
    if (kind === "warn") beep(180, 0.16, "sawtooth", vol * 0.7);
    if (kind === "notify") beep(640, 0.1, "sine", vol);
    if (kind === "complete") {
      beep(392, 0.1, "triangle", vol);
      beep(523, 0.12, "triangle", vol, 0.08);
      beep(784, 0.18, "triangle", vol * 0.9, 0.16);
    }
    if (kind === "capture") beep(300, 0.09, "square", vol * 0.6);
  },
  setAmbient(
    kind: AmbientKind,
    settings?: { mute?: boolean; masterVolume?: number; ambientVolume?: number },
  ) {
    ambientNodes?.stop();
    ambientNodes = null;
    if (!kind || settings?.mute) return;
    const vol = (settings?.masterVolume ?? 0.7) * (settings?.ambientVolume ?? 0.28);
    ambientNodes = startNoise(kind, vol);
  },
};
