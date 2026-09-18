import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { WorldCanvas } from "../game3d/WorldCanvas";
import { useCameraDirector } from "../game3d/camera/cameraStore";
import { layoutFor } from "../game3d/navigation/layout";
import { currentTutorialSlide } from "../simulation/tutorial";
import { useGame } from "../state/store";
import { useSimClock } from "../state/useSimClock";
import { DebugPanel } from "./DebugPanel";
import { Drawers } from "./Drawers";
import { EndScreen } from "./EndScreen";
import { FeelLayer } from "./feel/FeelLayer";
import { HUD } from "./HUD";
import { SettingsOverlay, CreditsOverlay } from "./SettingsOverlays";
import { VisualGallery } from "./VisualGallery";
import { MarketResults } from "./market/MarketResults";
import { EmployeeInspector } from "./team/panels";
import { MarketView } from "./market/MarketView";
import { MentorCard, Spotlight } from "./onboarding/MentorCard";
import { RevealCaption } from "./onboarding/RevealCaption";
import { SetupOverlay } from "./onboarding/SetupOverlay";
import { TitleOverlay } from "./onboarding/TitleOverlay";
import { audio } from "../audio/Audio";
import { startMarketSession, applyMarketEntryResults } from "../market/marketMap";
import { applyCommand } from "../simulation/commands";
import { createNewGame } from "../simulation/newGame";
import { createEnvironmentPreviewGame } from '../game3d/environment/devEnvironmentPreview';
import { createProduct } from "../simulation/products";
import { Rng } from "../simulation/rng";

function useTutorialCamera() {
  const pending = useGame((s) => s.game?.pendingMentor);
  const officeLevel = useGame((s) => s.game?.company.officeLevel ?? 0);
  const slideId = useGame((s) => {
    const g = s.game;
    return g ? currentTutorialSlide(g)?.id : null;
  });
  useEffect(() => {
    const game = useGame.getState().game;
    if (!game) return;
    const cam = useCameraDirector.getState();
    const layout = layoutFor(game.company.officeLevel);
    const slide = currentTutorialSlide(game);
    if (!slide?.focus) {
      cam.restorePlayer(game.company.officeLevel);
      return;
    }
    if (slide.focus.type === "camera") {
      cam.overview(game.company.officeLevel);
      return;
    }
    if (slide.focus.type === "employee") {
      const point = slide.focus.id === "cofounder" ? layout.points.find((p) => p.id === "desk-b") : layout.points.find((p) => p.id === "desk-a");
      if (point) cam.focusPoint([point.position[0] - 1.4, 2.6, point.position[2] + 3.2], [point.position[0], 1, point.position[2]]);
    }
    if (slide.focus.type === "officeObject") {
      const id = slide.focus.id === "founderDesk" ? "desk-a" : slide.focus.id;
      const point = layout.points.find((p) => p.id === id || p.kind === id);
      if (point) cam.focusPoint([point.position[0] - 1.2, 2.8, point.position[2] + 3], [point.position[0], 1, point.position[2]]);
    }
  }, [pending, slideId, officeLevel]);
}

function useAmbient() {
  const screen = useGame((s) => s.screen);
  const level = useGame((s) => s.game?.company.officeLevel ?? 0);
  const settings = useGame((s) => s.game?.settings);
  const mute = settings?.mute;
  const master = settings?.masterVolume;
  const amb = settings?.ambientVolume;
  useEffect(() => {
    const kind = screen === "title" || level <= 0 ? "apartment" : level >= 3 ? "lab" : "office";
    audio.setAmbient(kind, settings ?? { mute: false, masterVolume: 0.7, ambientVolume: 0.28 });
    return () => audio.setAmbient(null);
  }, [screen, level, mute, master, amb, settings]);
}

export function App() {
  const game = useGame((s) => s.game);
  const screen = useGame((s) => s.screen);
  const revealPlaying = useGame((s) => s.revealPlaying);
  const galleryOpen = useGame((s) => s.galleryOpen);
  const toggleDebug = useGame((s) => s.toggleDebug);
  const setGalleryOpen = useGame((s) => s.setGalleryOpen);
  useSimClock();
  useTutorialCamera();
  useAmbient();
  const drawer = useGame(s=>s.drawer);
  const slide = game ? currentTutorialSlide(game) : null;
  useEffect(()=>{
    if (screen !== 'playing' || revealPlaying || !slide || slide.workspace === undefined) return;
    if (drawer !== slide.workspace) useGame.getState().setDrawer(slide.workspace);
  },[screen,revealPlaying,slide?.id,slide?.workspace,drawer]);
  const uiScale = game?.settings.uiScale ?? 1;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (import.meta.env.DEV && params.get("gallery") === "1") setGalleryOpen(true);
    if (import.meta.env.DEV && params.has('world')) {
      useGame.getState().loadGame(createEnvironmentPreviewGame(Number(params.get('world')) || 0));
    }
    if (params.get("market") === "1") {
      const g = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "dustin-moskovitz", skipTutorial: true });
      const p = createProduct(g, "code", "agent", new Rng(1));
      p.levels = { deployment: 1, capability: 2, distribution: 1 };
      p.status = "ready";
      g.products.push(p);
      const withMarket = applyCommand(g, { type: "enterMarket", productId: p.id });
      if (withMarket) useGame.getState().loadGame(withMarket);
    }
    if (params.get("results") === "1") {
      const g = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "dustin-moskovitz", skipTutorial: true });
      const p = createProduct(g, "code", "agent", new Rng(1));
      p.levels = { deployment: 1, capability: 2, distribution: 1 };
      p.status = "ready";
      g.products.push(p);
      const session = startMarketSession(g, p, new Rng(1));
      applyMarketEntryResults(g, session, new Rng(1));
      useGame.getState().loadGame(g);
    }
    if (params.get("debug") === "1" || import.meta.env.DEV) {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "`") toggleDebug();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    return undefined;
  }, [toggleDebug, setGalleryOpen]);

  if (import.meta.env.DEV && galleryOpen) return (
    <>
      <VisualGallery />
      <Analytics />
    </>
  );
  if (screen === "ended" && game) return (
    <>
      <EndScreen game={game} />
      <Analytics />
    </>
  );

  if (screen === "market" && game?.marketResult) return (
    <>
      <MarketResults game={game} />
      <Analytics />
    </>
  );

  if (screen === "market" && game?.marketBattle) {
    return (
      <div className="relative h-full bg-[#1b2230]">
        <MarketView game={game} />
        <MentorCard />
        <Spotlight />
        <DebugPanel />
        <SettingsOverlay />
        <Analytics />
      </div>
    );
  }

  return (
    <div
      className="relative h-full bg-[#cbb9a1]"
      style={{ transform: uiScale === 1 ? undefined : `scale(${uiScale})`, transformOrigin: "top left", width: uiScale === 1 ? undefined : `${100 / uiScale}%`, height: uiScale === 1 ? undefined : `${100 / uiScale}%` }}
    >
      <WorldCanvas />
      {screen === "title" ? <TitleOverlay /> : null}
      {screen === "setup" ? <SetupOverlay /> : null}
      {screen === "playing" && game ? (
        <>
          <RevealCaption />
          {!revealPlaying ? (
            <>
              <HUD game={game} />
              <Drawers game={game} />
              <EmployeeInspector game={game} />
            </>
          ) : null}
          <MentorCard />
          <Spotlight />
          <FeelLayer />
        </>
      ) : null}
      <SettingsOverlay />
      <CreditsOverlay />
      <DebugPanel />
      <Analytics />
    </div>
  );
}
