import { identity } from "../../branding/identity";
import { useGame } from "../../state/store";
import { SavePanel } from "../SavePanel";
import { GameButton } from "../shared/controls";

export function TitleOverlay() {
  const setScreen = useGame((s) => s.setScreen);
  const loadGame = useGame((s) => s.loadGame);
  const resetSetup = useGame((s) => s.resetSetup);
  const setSettingsOpen = useGame((s) => s.setSettingsOpen);
  const setCreditsOpen = useGame((s) => s.setCreditsOpen);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-between py-16 text-ink">
      <div />
      <div className="pointer-events-auto text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.45em] text-copper">November 2022</div>
        <h1 className="mt-3 font-display text-7xl leading-none tracking-tight text-paper drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
          {identity.title}
        </h1>
        <p className="mt-3 font-display text-xl text-paper/90">{identity.subtitle}</p>
        <div className="mt-10 flex flex-col items-center gap-2">
          <GameButton
            tone="primary"
            className="w-64 text-center"
            onClick={() => {
              resetSetup();
              setScreen("setup");
            }}
          >
            New company
          </GameButton>
          <SavePanel game={null} onLoad={loadGame} variant="title" />
          <GameButton className="w-64 border-white/30 text-paper" onClick={() => setSettingsOpen(true)}>
            Settings
          </GameButton>
          <GameButton className="w-64 border-white/30 text-paper" onClick={() => setCreditsOpen(true)}>
            Credits
          </GameButton>
        </div>
      </div>
      <div className="pointer-events-none font-mono text-[10px] text-paper/70">{identity.version}</div>
    </div>
  );
}
