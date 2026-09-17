import { useEffect } from "react";
import { BALANCE } from "../config/balance";
import { OfficeCanvas } from "../office3d/OfficeCanvas";
import { useGame } from "../state/store";
import type { DrawerId } from "../simulation/types";
import { DebugPanel } from "./DebugPanel";
import { Drawers } from "./Drawers";
import { EndScreen } from "./EndScreen";
import { HUD } from "./HUD";
import { Mentor } from "./Mentor";
import { SetupFlow } from "./SetupFlow";
import { TitleScreen } from "./TitleScreen";
import { MarketView } from "./market/MarketView";

const OBJECT_DRAWERS: Record<string, DrawerId> = {
  coffee: "perks",
  board: "tasks",
  plant: "company",
  servers: "compute",
  lab: "research",
  logo: "company",
};

export function App() {
  const game = useGame((s) => s.game);
  const screen = useGame((s) => s.screen);
  const selectEmployee = useGame((s) => s.selectEmployee);
  const setDrawer = useGame((s) => s.setDrawer);
  const toggleDebug = useGame((s) => s.toggleDebug);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === "1" || import.meta.env.DEV) {
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "`") toggleDebug();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    return undefined;
  }, [toggleDebug]);

  useEffect(() => {
    if (!game || screen !== "playing") return;
    if (game.clock.paused || game.clock.speed === 0 || game.pendingMentor || game.marketBattle || game.endingId) {
      return;
    }
    const ms = BALANCE.MS_PER_DAY_AT_1X / game.clock.speed;
    const id = window.setInterval(() => useGame.getState().dispatch({ type: "tickDay" }), ms);
    return () => window.clearInterval(id);
  }, [
    screen,
    game?.clock.paused,
    game?.clock.speed,
    game?.pendingMentor,
    Boolean(game?.marketBattle),
    game?.endingId,
  ]);

  if (screen === "title") return <TitleScreen />;
  if (screen === "setup") return <SetupFlow />;
  if (screen === "ended" && game) return <EndScreen game={game} />;
  if (!game) return <TitleScreen />;

  if (screen === "market" && game.marketBattle) {
    return (
      <div className="relative h-full bg-[#1b2230]">
        <MarketView game={game} />
        <DebugPanel />
      </div>
    );
  }

  return (
    <div className="relative h-full bg-[#cfc4b2]">
      <OfficeCanvas
        game={game}
        onEmployee={selectEmployee}
        onObject={(id) => {
          const drawer = OBJECT_DRAWERS[id];
          if (drawer && (drawer === "tasks" || drawer === "company" || game.unlocks[drawer as keyof typeof game.unlocks] !== false)) {
            setDrawer(drawer);
          } else {
            setDrawer("company");
          }
        }}
      />
      <HUD game={game} />
      <Drawers game={game} />
      <Mentor />
      <DebugPanel />
    </div>
  );
}
