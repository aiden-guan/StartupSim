import { monthlyArr } from "./conditions";
import { grossMargin, monthlyBurn } from "./derived";
import type { GameState } from "./types";

export const ENDINGS: Record<string, { title: string; line: string }> = {
  bankruptcy: { title: "Runway Zero", line: "The apartment lights stayed on a few extra days out of habit." },
  "board-out": { title: "Forced Resignation", line: "They thanked you for your service in a font you did not choose." },
  acquisition: { title: "Sold", line: "The number was large. The product kept the name for a quarter." },
  "quiet-profit": { title: "Quiet Profitability", line: "Nobody on the timeline remembers you. The bank does." },
  unicorn: { title: "Unicorn", line: "A valuation with a horn. Still losing money, tastefully." },
  ipo: { title: "Public", line: "The ticker is a mood. The quarters are a religion." },
  monopoly: { title: "Infrastructure", line: "Most of the digital economy routes through you." },
  "open-source": { title: "The Commons", line: "You gave the weights away. The industry had to sit down." },
  "automated-company": { title: "Minority Human", line: "The office is loud with machines and quiet with people." },
  "automated-ceo": { title: "Replaced", line: "A system with better margins took the seat." },
  "research-lab": { title: "Lab, Not a Company", line: "You stopped chasing growth. Papers piled up instead." },
  commoditization: { title: "Commoditized", line: "Intelligence got cheap. Margins went with it." },
  regulated: { title: "Stagnation", line: "The forms arrived faster than the products." },
  "safety-crisis": { title: "Incident", line: "The demo did something nobody had a slide for." },
  "ai-science": { title: "Discovery Engine", line: "The lab started answering questions you had not asked." },
  robotics: { title: "Bodies", line: "The warehouse learned to walk." },
  unknown: { title: "Unknown", line: "The capability curve left the chart. So did you, a little." },
};

export function detectEnding(state: GameState): { id: string; note: string } | null {
  const arr = monthlyArr(state) * 12;
  const humans = state.employees.filter((e) => e.role !== "ai" && e.role !== "robot").length;
  const autoAvg =
    Object.values(state.company.automation).reduce((s, n) => s + n, 0) /
    Math.max(1, Object.keys(state.company.automation).length);
  const projects = state.company.specialProjects;
  const openish = state.products.filter((p) => p.combo.includes("opensource") && p.status === "active").length;

  if (state.company.cash < 0 && (monthlyArr(state) < 1000 || state.company.cash < -10_000 || monthlyBurn(state) > 0)) {
    return { id: "bankruptcy", note: ENDINGS.bankruptcy.line };
  }
  if (state.board && state.board.approval <= 12) {
    return { id: "board-out", note: ENDINGS["board-out"].line };
  }
  if (state.company.ceoAutomated) {
    return { id: "automated-ceo", note: ENDINGS["automated-ceo"].line };
  }
  if (state.stats.scandals >= 3 && state.company.trust < 16) {
    return { id: "safety-crisis", note: ENDINGS["safety-crisis"].line };
  }
  if (arr > 8_000_000_000) {
    return { id: "monopoly", note: ENDINGS.monopoly.line };
  }
  if (state.world.aiCapability >= 90) {
    return { id: "unknown", note: ENDINGS.unknown.line };
  }
  if (state.world.regulation >= 88 && arr < 2_000_000) {
    return { id: "regulated", note: ENDINGS.regulated.line };
  }
  if (autoAvg >= 85 && humans <= 6) {
    return { id: "automated-company", note: ENDINGS["automated-company"].line };
  }
  if (projects.includes("autonomous-lab")) {
    return { id: "ai-science", note: ENDINGS["ai-science"].line };
  }
  if (projects.includes("general-robot") || projects.includes("robot-line")) {
    return { id: "robotics", note: ENDINGS.robotics.line };
  }
  if (projects.includes("research-lab") && state.company.productsLaunched < 4 && state.clock.date.year >= 2026) {
    return { id: "research-lab", note: ENDINGS["research-lab"].line };
  }
  if (openish >= 2 && state.company.hype > 20) {
    return { id: "open-source", note: ENDINGS["open-source"].line };
  }
  if (state.company.ownership.investors > 0.35 && state.company.valuation >= 4_000_000_000) {
    return { id: "ipo", note: ENDINGS.ipo.line };
  }
  if (state.company.valuation >= 1_000_000_000) {
    return { id: "unicorn", note: ENDINGS.unicorn.line };
  }
  if (state.economy === "creditCrunch" && grossMargin(state) < 0 && arr > 0) {
    return { id: "commoditization", note: ENDINGS.commoditization.line };
  }
  if (state.company.cash > 8_000_000 && !state.board && grossMargin(state) > 0.2) {
    return { id: "quiet-profit", note: ENDINGS["quiet-profit"].line };
  }
  if (state.company.acquisitions.length >= 3) {
    return { id: "acquisition", note: ENDINGS.acquisition.line };
  }
  return null;
}

export function biography(state: GameState): string[] {
  const ending = ENDINGS[state.endingId ?? ""] ?? { title: "Closed", line: state.endingNote ?? "" };
  return [
    `${state.company.name}, ${state.clock.date.year}.`,
    ending.line,
    `Launched ${state.stats.productsLaunched} products. Hired ${state.stats.employeesHired}. Peak headcount ${state.stats.peakEmployees}.`,
    `Peak valuation ${Math.round(state.stats.peakValuation).toLocaleString()}. Compute burned: ${Math.round(state.stats.computeConsumed).toLocaleString()}.`,
    state.company.ceoAutomated ? "The CEO seat is a process." : `Founder still listed: ${state.founder.name}.`,
  ];
}
