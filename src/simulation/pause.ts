import type { GameState, Mail, PauseReason } from './types.js';
import { monthlyBurn, runwayMonths } from './derived.js';

const LABELS: Record<PauseReason, string> = {
  manual: 'Paused',
  tutorial: 'Mentor',
  market: 'Market',
  event: 'Critical event deadline tomorrow',
  productReady: 'Product ready',
  results: 'Launch results',
  settings: 'Settings',
  ended: 'Closed',
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

export function isLifeOrDeathEvent(mail: Mail, state: GameState): boolean {
  if (!mail.requiresResponse || !mail.choices || mail.choices.length === 0) {
    return false;
  }

  // Acquisition offers are strategic buyout opportunities or independence bets - never negative existential threats
  if (
    mail.eventId === "acquisition-inbound" ||
    mail.from === "macrosoft" ||
    mail.choices.some((c) => c.effects?.some((e) => e.type === "ending" && e.value === "acquisition"))
  ) {
    return false;
  }

  // Purely positive events are not threats
  const hasNegativeEffects = mail.choices.some((c) =>
    c.effects?.some((e) =>
      (e.type === "cash" && typeof e.value === "number" && e.value < 0) ||
      (e.type === "morale" && typeof e.value === "number" && e.value < 0) ||
      (e.type === "trust" && typeof e.value === "number" && e.value < 0) ||
      (e.type === "prestige" && typeof e.value === "number" && e.value < 0) ||
      (e.type === "backlash" && typeof e.value === "number" && e.value > 0) ||
      (e.type === "boardPressure" && typeof e.value === "number" && e.value > 0) ||
      e.type === "loseEmployee" ||
      (e.type === "demand" && e.value && typeof e.value === "object" && "multiplier" in e.value && (e.value.multiplier as number) < 1) ||
      (e.type === "ending" && e.value !== "acquisition")
    )
  );

  if (!hasNegativeEffects && !mail.warning && mail.eventKind !== "crisis") {
    return false;
  }

  // 1. Explicit crisis event (e.g. security-incident)
  if (mail.eventKind === "crisis") {
    return true;
  }

  // 2. Direct insolvency threat: will any cash choice drive cash to <= 0?
  const maxCashCost = Math.max(
    0,
    ...mail.choices.map((c) =>
      c.effects
        ?.filter((e) => e.type === "cash" && typeof e.value === "number" && e.value < 0)
        .reduce((sum, e) => sum + Math.abs(Number(e.value)), 0) ?? 0
    )
  );

  if (maxCashCost > 0 && state.company.cash - maxCashCost <= 0) {
    return true;
  }

  // 3. Current financial fragility: low runway or low cash with net burn
  const runway = runwayMonths(state);
  const burn = monthlyBurn(state);
  const isFinanciallyFragile = runway < 2.0 || (state.company.cash < 25_000 && burn > 0);

  if (isFinanciallyFragile) {
    if (maxCashCost > 0) return true;
    if (mail.eventKind === "outage") return true;
    if (mail.eventId === "poach" && (mail.warning?.toLowerCase().includes("runway") || runway < 1.5)) return true;
    if (mail.choices.some((c) => c.effects?.some((e) => e.type === "demand"))) return true;
  }

  // 4. Imminent board firing danger (board approval <= 20, game over is <= 12)
  if (state.board && state.board.approval <= 20) {
    const hurtsBoard = mail.choices.some((c) =>
      c.effects?.some((e) => e.type === "boardPressure" || (e.type === "trust" && typeof e.value === "number" && e.value < 0))
    );
    if (hurtsBoard) return true;
  }

  // 5. Imminent safety scandal crisis (scandals >= 2 and trust <= 25, game over is scandals >= 3 && trust < 16)
  if (state.stats.scandals >= 2 && state.company.trust <= 25) {
    const hurtsTrust = mail.choices.some((c) =>
      c.effects?.some((e) => (e.type === "trust" && typeof e.value === "number" && e.value < 0) || (e.type === "backlash" && typeof e.value === "number" && e.value >= 8))
    );
    if (hurtsTrust) return true;
  }

  return false;
}

export function isMinorFee(mail: Mail, state?: GameState): boolean {
  if (!mail.requiresResponse || !mail.choices || mail.choices.length === 0) {
    return false;
  }

  // Known minor fee event IDs
  if (mail.eventId === "contractor-invoice" || mail.eventId === "recruiter-fee") {
    if (state && isLifeOrDeathEvent(mail, state)) {
      return false;
    }
    return true;
  }

  // Any non-critical fee/bill with a pay choice and dispute/refusal choice
  const hasPayChoice = mail.choices.some(
    (c) => c.id === "pay" || (c.label.toLowerCase().startsWith("pay") && c.effects?.some((e) => e.type === "cash" && Number(e.value) < 0))
  );

  const hasDisputeChoice = mail.choices.some(
    (c) =>
      c.id === "fight" ||
      c.id === "refuse" ||
      c.id === "dispute" ||
      c.label.toLowerCase().includes("dispute") ||
      c.label.toLowerCase().includes("refuse")
  );

  if (hasPayChoice && (hasDisputeChoice || mail.choices.length === 2)) {
    if (state && isLifeOrDeathEvent(mail, state)) {
      return false;
    }
    return true;
  }

  return false;
}

