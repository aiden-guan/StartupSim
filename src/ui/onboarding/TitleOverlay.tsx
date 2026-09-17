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
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-ink bg-gradient-to-t from-[#1b2230]/75 via-transparent to-[#1b2230]/40">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/20 bg-[#1b2230]/88 p-8 text-center shadow-2xl backdrop-blur-md">
        <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-copper">November 2022 · The AI Boom</div>
        <h1 className="mt-2 font-display text-5xl font-bold tracking-tight text-[#fcf9f1] drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
          {identity.title}
        </h1>
        <p className="mt-2 font-display text-lg text-[#d8d1c4]">{identity.subtitle}</p>
        <div className="mt-8 flex flex-col items-center gap-2.5">
          <GameButton
            tone="primary"
            className="w-72 py-2.5 text-center text-base font-medium shadow-md transition-transform hover:scale-[1.02]"
            onClick={() => {
              resetSetup();
              setScreen("setup");
            }}
          >
            Start new company →
          </GameButton>
          <div className="w-72">
            <SavePanel game={null} onLoad={loadGame} variant="title" />
          </div>
          <div className="flex w-72 gap-2">
            <GameButton className="flex-1 border-white/20 text-[#efe8dc] hover:bg-white/10" onClick={() => setSettingsOpen(true)}>
              Settings
            </GameButton>
            <GameButton className="flex-1 border-white/20 text-[#efe8dc] hover:bg-white/10" onClick={() => setCreditsOpen(true)}>
              Credits
            </GameButton>
          </div>
        </div>
        <div className="mt-6 font-mono text-[10px] tracking-wider text-[#9aa3b2]/80">
          v{identity.version} · Ideas compound here.
        </div>
      </div>
    </div>
  );
}
