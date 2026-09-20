import { useState } from "react";
import { audio, type SfxId } from "../../audio/Audio";
import { MUSIC_STAGES, MUSIC_TRACKS, type MusicStage } from "../../audio/musicState";
import { useGame } from "../../state/store";
import "./WorldQaToolbar.css";

const LABELS: Record<MusicStage, string> = {
  apartment: "01 · Compounding",
  office: "02 · First Real Office",
  scaleup: "03 · Scale-Up Velocity",
  lab: "04 · Compounding Intelligence",
  campus: "05 · Compounding the Future",
  global: "06 · Global Headquarters",
};

const PREMIUM_SFX: Array<{ id: SfxId; label: string }> = [
  { id: "product.ready", label: "Completion" },
  { id: "crisis", label: "Error" },
];

export function AudioQaToolbar() {
  const settings = useGame((state) => state.game?.settings);
  const [stage, setStage] = useState<MusicStage>("apartment");
  const playStage = (next: MusicStage) => {
    audio.unlock();
    audio.setMusicState(next);
    setStage(next);
  };
  const playSfx = (id: SfxId) => {
    audio.unlock();
    audio.playSfx(id, settings);
  };

  return (
    <details className="world-qa-toolbar">
      <summary>
        <span className="world-qa-title">Audio QA</span>
        <span className="world-qa-summary">{LABELS[stage]} · {MUSIC_TRACKS[stage].loopStart}s loop overlap</span>
        <span className="world-qa-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="world-qa-form">
        <div className="world-qa-grid">
          {MUSIC_STAGES.map((next) => (
            <button key={next} type="button" className="world-qa-reload" onClick={() => playStage(next)}>
              {LABELS[next]}
            </button>
          ))}
        </div>
        <div className="world-qa-grid">
          {PREMIUM_SFX.map(({ id, label }) => (
            <button key={id} type="button" className="world-qa-reload" onClick={() => playSfx(id)}>
              Play {label}
            </button>
          ))}
        </div>
        <p className="world-qa-note">DEV only. Music uses authored full tracks; stage changes crossfade over 3 seconds.</p>
      </div>
    </details>
  );
}
