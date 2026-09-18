import { useState } from "react";
import { identity } from "../../branding/identity";
import { listSaves, type SaveMeta } from "../../state/save";
import { useGame } from "../../state/store";
import { SavePanel } from "../SavePanel";
import { GameButton } from "../shared/controls";

export function TitleOverlay() {
  const setScreen = useGame((s) => s.setScreen);
  const loadGame = useGame((s) => s.loadGame);
  const resetSetup = useGame((s) => s.resetSetup);
  const setSettingsOpen = useGame((s) => s.setSettingsOpen);
  const setCreditsOpen = useGame((s) => s.setCreditsOpen);
  const setLeaderboardOpen = useGame((s) => s.setLeaderboardOpen);
  const [newCompanyPrompt, setNewCompanyPrompt] = useState<SaveMeta[] | null>(null);

  function beginSetup() {
    resetSetup();
    setNewCompanyPrompt(null);
    setScreen("setup");
  }

  async function requestNewCompany() {
    try {
      const saves = await listSaves();
      if (saves.length) {
        setNewCompanyPrompt(saves);
        return;
      }
    } catch {
      // If IndexedDB is unavailable, the setup flow is still usable.
    }
    beginSetup();
  }

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
            onClick={() => void requestNewCompany()}
          >
            Start new company →
          </GameButton>
          <div className="w-72">
            <SavePanel game={null} onLoad={loadGame} variant="title" />
          </div>
          <GameButton
            className="flex w-72 items-center justify-center gap-2 border-white/20 text-[#efe8dc] hover:bg-white/10"
            onClick={() => setLeaderboardOpen(true)}
          >
            Open global run ledger
          </GameButton>
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
      {newCompanyPrompt ? (
        <div className="pointer-events-auto fixed inset-0 z-20 grid place-items-center bg-[#18252d]/45 p-5" role="presentation">
          <div className="w-full max-w-md border border-[#cfc5b6] bg-[#f9f4e7] p-6 text-left shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="new-company-confirm-title">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-copper">Existing company found</span>
            <h2 id="new-company-confirm-title" className="mt-2 font-display text-2xl font-semibold text-ink">Start a new company?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Starting a new company will replace the current autosave the next time the new company is saved. Manual slots stay safe.</p>
            <div className="mt-3 border-l-2 border-copper bg-[#efe3d0] px-3 py-2 font-mono text-[10px] text-[#76573f]">
              {newCompanyPrompt.slice(0, 2).map((save) => <div key={save.id}>{saveLabelForConfirm(save)} · {save.company}</div>)}
              {newCompanyPrompt.length > 2 ? <div>+ {newCompanyPrompt.length - 2} more saved file{newCompanyPrompt.length - 2 === 1 ? "" : "s"}</div> : null}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <GameButton className="border-line text-ink" onClick={() => setNewCompanyPrompt(null)}>Keep current company</GameButton>
              <GameButton tone="primary" onClick={beginSetup}>Start new company</GameButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function saveLabelForConfirm(save: SaveMeta): string {
  if (save.id === "autosave") return "Autosave";
  if (save.id.startsWith("slot-")) return `Slot ${save.id.slice(5)}`;
  return save.name;
}
