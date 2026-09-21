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
import { LeaderboardOverlay } from "./leaderboard/LeaderboardOverlay";
import { AchievementsOverlay, AchievementToast } from "./AchievementsOverlay";
import { VisualGallery } from "./VisualGallery";
import { MarketResults } from "./market/MarketResults";
import { EmployeeInspector } from "./team/panels";
import { MarketView } from "./market/MarketView";
import { MentorCard, Spotlight } from "./onboarding/MentorCard";
import { RevealCaption } from "./onboarding/RevealCaption";
import { SetupOverlay } from "./onboarding/SetupOverlay";
import { TitleOverlay } from "./onboarding/TitleOverlay";
import { audio } from "../audio/Audio";
import { selectMusicState } from "../audio/musicState";
import { startMarketSession, applyMarketEntryResults } from "../market/marketMap";
import { applyCommand } from "../simulation/commands";
import { createNewGame } from "../simulation/newGame";
import { ENDINGS } from "../simulation/endings";
import { createEnvironmentPreviewGame } from '../game3d/environment/devEnvironmentPreview';
import { createProduct } from "../simulation/products";
import { Rng } from "../simulation/rng";
import { WorldQaToolbar } from "./visuals/WorldQaToolbar";
import { AudioQaToolbar } from "./visuals/AudioQaToolbar";
import { LaunchAllSummaryPopup } from "./products/LaunchAllSummaryPopup";

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

function useAudioScene() {
  const screen = useGame((s) => s.screen);
  const game = useGame((s) => s.game);
  const level = game?.company.officeLevel ?? 0;
  const settings = useGame((s) => s.game?.settings);
  useEffect(() => {
    audio.configure(settings);
  }, [settings?.mute, settings?.masterVolume, settings?.sfxVolume, settings?.musicVolume, settings?.ambientVolume]);
  useEffect(() => {
    audio.setMusicState(selectMusicState(game, screen));
    audio.setAmbient(screen === "market" || screen === "ended" ? null : level <= 0 ? "apartment" : level >= 3 ? "lab" : "office");
  }, [screen, level]);
  useEffect(() => {
    const unlock = () => audio.unlock();
    const visibility = () => document.hidden ? audio.pause() : audio.resume();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", visibility);
      audio.setAmbient(null);
    };
  }, []);
}

export function App() {
  const game = useGame((s) => s.game);
  const screen = useGame((s) => s.screen);
  const revealPlaying = useGame((s) => s.revealPlaying);
  const galleryOpen = useGame((s) => s.galleryOpen);
  const leaderboardOpen = useGame((s) => s.leaderboardOpen);
  const toggleDebug = useGame((s) => s.toggleDebug);
  const setGalleryOpen = useGame((s) => s.setGalleryOpen);
  const launchAllSummary = useGame((s) => s.launchAllSummary);
  const dismissLaunchAllSummary = useGame((s) => s.dismissLaunchAllSummary);
  useSimClock();
  useTutorialCamera();
  useAudioScene();
  const drawer = useGame(s=>s.drawer);
  const slide = game ? currentTutorialSlide(game) : null;
  useEffect(()=>{
    if (screen !== 'playing' || revealPlaying || !slide || slide.workspace === undefined) return;
    if (drawer !== slide.workspace) useGame.getState().setDrawer(slide.workspace);
  },[screen,revealPlaying,slide?.id,slide?.workspace,drawer]);
  const uiScale = game?.settings.uiScale ?? 1;
  const worldQaEnabled = import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("world");
  const audioQaEnabled = import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("audio") === "1";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (import.meta.env.DEV && params.get("gallery") === "1") setGalleryOpen(true);
    if (import.meta.env.DEV && params.has('world')) {
      useGame.getState().loadGame(createEnvironmentPreviewGame(Number(params.get('world')) || 0));
    }
    if (params.get("market") === "1" || (import.meta.env.DEV && params.get("market") === "large")) {
      const g = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "dustin-moskovitz", skipTutorial: true });
      const p = createProduct(g, "code", "agent", new Rng(1));
      const largeMarket = params.get("market") === "large";
      if (largeMarket) {
        g.company.seenMarket = true;
        for (const competitor of g.competitors) competitor.disabled = competitor.id !== "foundry";
        p.levels = { deployment: 6, capability: 6, distribution: 6 };
        p.points = { engineering: 500, product: 500, growth: 500, research: 500 };
      } else {
        p.levels = { deployment: 1, capability: 2, distribution: 1 };
      }
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
    if (import.meta.env.DEV && params.get("postmortem") === "1") {
      const g = createNewGame({ founderName: "Ada", companyName: "Northstar Systems", cofounderId: "reya", skipTutorial: true });
      const products = [
        createProduct(g, "code", "agent", new Rng(11)),
        createProduct(g, "search", "image", new Rng(12)),
        createProduct(g, "chat", "writing", new Rng(13)),
      ];
      const productRevenue = [1_840_000_000, 720_000_000, 315_000_000];
      products.forEach((product, index) => {
        product.status = "active";
        product.earnedRevenue = productRevenue[index]!;
        g.products.push(product);
      });
      g.clock.date = { year: 2034, month: 8, day: 18 };
      g.company.cash = 827_140_000;
      g.company.valuation = 8_650_000_000;
      g.company.lifetimeRevenue = 4_275_400_000;
      g.company.lifetimeCosts = 2_910_800_000;
      g.company.ownership.founder = 0.318;
      g.funding.raisedTotal = 640_000_000;
      g.stats.productsLaunched = 18;
      g.stats.employeesHired = 53;
      g.stats.employeesFired = 11;
      g.stats.peakEmployees = 70;
      g.stats.peakValuation = 12_850_000_000;
      g.stats.researchCompleted = 14;
      g.stats.acquisitions = 3;
      g.history = [
        { year: 2034, month: 6, cash: 640_000_000, revenue: 280_000_000, burn: 24_000_000, hype: 72, trust: 68, employees: 66, valuation: 10_400_000_000 },
        { year: 2034, month: 7, cash: 745_000_000, revenue: 390_000_000, burn: 22_000_000, hype: 77, trust: 71, employees: 70, valuation: 12_850_000_000 },
      ];
      g.endingId = "ipo";
      g.endingNote = ENDINGS.ipo.line;
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (e.code === "Space") {
        const state = useGame.getState();
        if (state.screen === "playing" && state.game && !state.settingsOpen && !state.achievementsOpen) {
          e.preventDefault();
          const eventReason = state.game.clock.pauseReasons.includes("event") ? "Inbox" : undefined;
          state.dispatch({ type: "setPaused", paused: !state.game.clock.paused, reason: eventReason });
        }
      } else if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4") {
        const state = useGame.getState();
        if (state.screen === "playing" && state.game && !state.settingsOpen && !state.achievementsOpen) {
          const speeds: Record<string, 1 | 2 | 4 | 8> = { "1": 1, "2": 2, "3": 4, "4": 8 };
          const sp = speeds[e.key];
          if (sp) {
            if (state.game.clock.pauseReasons.includes("event")) {
              state.dispatch({ type: "setPaused", paused: false, reason: "Inbox" });
            }
            state.dispatch({ type: "setSpeed", speed: sp });
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (import.meta.env.DEV && galleryOpen) return (
    <>
      <VisualGallery />
      <Analytics />
    </>
  );
  if (screen === "ended" && game) return (
    <>
      <EndScreen game={game} />
      {leaderboardOpen && <LeaderboardOverlay />}
      <Analytics />
    </>
  );

  if (screen === "market" && game?.marketResult) return (
    <>
      <MarketResults game={game} />
      {leaderboardOpen && <LeaderboardOverlay />}
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
        {leaderboardOpen && <LeaderboardOverlay />}
        <Analytics />
      </div>
    );
  }

  return (
    <div
      className={`relative h-full bg-[#cbb9a1] ${game?.settings.reducedMotion ? "game-reduced-motion" : ""}`}
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
      {leaderboardOpen && <LeaderboardOverlay />}
      <AchievementsOverlay />
      <AchievementToast />
      <DebugPanel />
      {launchAllSummary ? <LaunchAllSummaryPopup summary={launchAllSummary} onClose={dismissLaunchAllSummary} /> : null}
      {worldQaEnabled ? <WorldQaToolbar /> : null}
      {audioQaEnabled ? <AudioQaToolbar /> : null}
      <Analytics />
    </div>
  );
}
