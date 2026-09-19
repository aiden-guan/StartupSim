import { useEffect } from "react";
import { BALANCE } from "../config/balance";
import { currentTutorialSlide } from "../simulation/tutorial";
import { useGame } from "./store";

export function useSimClock() {
  const game = useGame((s) => s.game);
  const screen = useGame((s) => s.screen);

  useEffect(() => {
    if (!game || screen !== "playing") return;
    const isMentorBlocking = Boolean(
      game.pendingMentor && game.onboarding.tutorialEnabled && currentTutorialSlide(game)
    );
    if (game.clock.paused || game.clock.speed === 0 || isMentorBlocking || game.marketBattle || game.endingId) {
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
    game?.onboarding.tutorialEnabled,
    Boolean(game?.marketBattle),
    game?.endingId,
  ]);
}
