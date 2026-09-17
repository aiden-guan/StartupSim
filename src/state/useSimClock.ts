import { useEffect } from "react";
import { BALANCE } from "../config/balance";
import { useGame } from "./store";

export function useSimClock() {
  const game = useGame((s) => s.game);
  const screen = useGame((s) => s.screen);

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
}
