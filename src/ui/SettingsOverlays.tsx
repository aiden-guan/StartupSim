import { identity } from "../branding/identity";
import { useGame } from "../state/store";
import { GameButton } from "./shared/controls";

export function SettingsOverlay() {
  const open = useGame((s) => s.settingsOpen);
  const setOpen = useGame((s) => s.setSettingsOpen);
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const setGalleryOpen = useGame((s) => s.setGalleryOpen);
  if (!open) return null;
  const settings = game?.settings;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="game-panel w-[min(440px,92vw)] p-5">
        <h2 className="font-display text-2xl">Settings</h2>
        {settings ? (
          <div className="mt-4 space-y-3 text-sm">
            <label className="flex justify-between">
              Graphics
              <select className="bg-panel px-2 py-1" value={settings.graphics} onChange={(e) => dispatch({ type: "setSettings", patch: { graphics: e.target.value as typeof settings.graphics } })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="flex justify-between">
              Master
              <input type="range" min={0} max={1} step={0.05} value={settings.masterVolume} onChange={(e) => dispatch({ type: "setSettings", patch: { masterVolume: Number(e.target.value) } })} />
            </label>
            <label className="flex justify-between">
              Music
              <input type="range" min={0} max={1} step={0.05} value={settings.musicVolume} onChange={(e) => dispatch({ type: "setSettings", patch: { musicVolume: Number(e.target.value) } })} />
            </label>
            <label className="flex justify-between">
              SFX
              <input type="range" min={0} max={1} step={0.05} value={settings.sfxVolume} onChange={(e) => dispatch({ type: "setSettings", patch: { sfxVolume: Number(e.target.value) } })} />
            </label>
            <label className="flex justify-between">
              Ambient
              <input type="range" min={0} max={1} step={0.05} value={settings.ambientVolume} onChange={(e) => dispatch({ type: "setSettings", patch: { ambientVolume: Number(e.target.value) } })} />
            </label>
            <label className="flex items-center justify-between">
              Mute
              <input type="checkbox" checked={settings.mute} onChange={(e) => dispatch({ type: "setSettings", patch: { mute: e.target.checked } })} />
            </label>
            <label className="flex items-center justify-between">
              Reduced motion
              <input type="checkbox" checked={settings.reducedMotion} onChange={(e) => dispatch({ type: "setSettings", patch: { reducedMotion: e.target.checked } })} />
            </label>
            <label className="flex justify-between">
              NPC density
              <input type="range" min={0.3} max={1.2} step={0.1} value={settings.npcDensity} onChange={(e) => dispatch({ type: "setSettings", patch: { npcDensity: Number(e.target.value) } })} />
            </label>
            <label className="flex justify-between">
              UI scale
              <input type="range" min={0.85} max={1.2} step={0.05} value={settings.uiScale} onChange={(e) => dispatch({ type: "setSettings", patch: { uiScale: Number(e.target.value) } })} />
            </label>
            <label className="flex items-center justify-between">
              Pause on events
              <input type="checkbox" checked={settings.pauseOnEvents} onChange={(e) => dispatch({ type: "setSettings", patch: { pauseOnEvents: e.target.checked } })} />
            </label>
            {game.onboarding.tutorialEnabled ? (
              <GameButton onClick={() => dispatch({ type: "skipTutorial" })}>Skip tutorial</GameButton>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#9aa3b2]">Start or load a company to use settings.</p>
        )}
        <GameButton className="mt-3 w-full" onClick={() => { setOpen(false); useGame.getState().setAchievementsOpen(true); }}>
          🏆 View Achievements ({(game?.achievements ?? []).length} Unlocked)
        </GameButton>
        {import.meta.env.DEV ? (
          <GameButton className="mt-3" onClick={() => setGalleryOpen(true)}>
            Visual gallery
          </GameButton>
        ) : null}
        <GameButton className="mt-4" onClick={() => setOpen(false)}>
          Close
        </GameButton>
      </div>
    </div>
  );
}

export function CreditsOverlay() {
  const open = useGame((s) => s.creditsOpen);
  const setOpen = useGame((s) => s.setCreditsOpen);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
      <div className="game-panel w-[min(440px,92vw)] p-5">
        <h2 className="font-display text-2xl">{identity.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[#d8d1c4]">
          Inspired by systems in The Founder (Francis Tseng, MIT). Original names, art, and copy are not used.
        </p>
        <p className="mt-2 text-sm text-[#9aa3b2]">Designer-toy characters and office kit authored for this game.</p>
        <GameButton className="mt-4" onClick={() => setOpen(false)}>
          Close
        </GameButton>
      </div>
    </div>
  );
}
