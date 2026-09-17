import type { GameState, PauseReason } from './types';

const LABELS: Record<PauseReason, string> = {
  manual: 'Paused', tutorial: 'Mentor', market: 'Market', event: 'Inbox needs a response',
  productReady: 'Product ready', results: 'Launch results', settings: 'Settings', ended: 'Closed',
};
export function syncPause(state: GameState) {
  state.clock.paused = state.clock.speed === 0 || state.clock.pauseReasons.length > 0;
  state.clock.reasonPaused = state.clock.pauseReasons.map(r => LABELS[r]).join(' · ') || null;
}
export function setPause(state: GameState, reason: PauseReason, enabled: boolean) {
  state.clock.pauseReasons = state.clock.pauseReasons.filter(r => r !== reason);
  if (enabled) state.clock.pauseReasons.push(reason);
  syncPause(state);
}
