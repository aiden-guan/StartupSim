import type { GameCommand } from "../simulation/commands";
import type { GameState } from "../simulation/types";
import { isLifeOrDeathEvent } from "../simulation/pause";

export type FeedbackTier = 0 | 1 | 2 | 3 | 4 | 5;
export type FeedbackKind =
  | "ui.select" | "assignment" | "product.started" | "product.ready" | "product.launching" | "product.launched"
  | "launch.result" | "launch.homecoming" | "research.started" | "research.completed" | "employee.hired"
  | "employee.fired" | "employee.burnout" | "funding.closed" | "office.upgraded"
  | "location.opened" | "market.move" | "market.captured" | "market.rival"
  | "crisis.started" | "message.received" | "social.received" | "achievement.unlocked"
  | "money.gained" | "money.spent" | "milestone" | "acquisition" | "ending";

export interface FeedbackEvent {
  type: FeedbackKind;
  tier: FeedbackTier;
  id?: string;
  label?: string;
  amount?: number;
}

const milestoneBands = {
  revenue: [1, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000, 100_000_000_000, 1_000_000_000_000],
  valuation: [1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000, 100_000_000_000, 1_000_000_000_000],
  users: [1_000, 10_000, 100_000, 1_000_000, 10_000_000],
  team: [10, 50, 100],
  products: [1, 5, 10],
} as const;

function crossed(before: number, after: number, bands: readonly number[]): number | null {
  return [...bands].reverse().find((band) => before < band && after >= band) ?? null;
}

function compact(value: number): string {
  if (value >= 1_000_000_000_000) return `$${value / 1_000_000_000_000}T`;
  if (value >= 1_000_000_000) return `$${value / 1_000_000_000}B`;
  if (value >= 1_000_000) return `$${value / 1_000_000}M`;
  if (value >= 1_000) return `$${value / 1_000}K`;
  return `$${value}`;
}

export function deriveFeedbackEvents(prev: GameState | null, next: GameState | null, cmd: GameCommand): FeedbackEvent[] {
  if (!prev || !next || prev === next || cmd.type === "newGame") return [];
  const events: FeedbackEvent[] = [];
  const add = (event: FeedbackEvent) => events.push(event);

  for (const product of next.products) {
    const old = prev.products.find((item) => item.id === product.id);
    if (old?.status === "development" && product.status === "ready")
      add({ type: "product.ready", tier: 3, id: product.id, label: `${product.name} is ready` });
    if (old?.status === "ready" && product.status === "active")
      add({ type: "product.launched", tier: 3, id: product.id, label: `${product.name} launched` });
  }
  if (!prev.marketBattle && next.marketBattle && cmd.type === "enterMarket")
    add({ type: "product.launching", tier: 4, id: cmd.productId });
  if (["optimizeLaunch", "delegateMarket", "launchAll"].includes(cmd.type) && !prev.marketResult && next.marketResult?.delegated)
    add({ type: "product.launching", tier: 4, id: next.marketResult.productId, label: "Delegated launch complete" });
  if (next.products.length > prev.products.length) add({ type: "product.started", tier: 2 });
  if (next.stats.researchCompleted > prev.stats.researchCompleted) {
    const unlocked = next.company.technologies.find((id) => !prev.company.technologies.includes(id));
    add({ type: "research.completed", tier: 3, id: unlocked, label: "Research complete" });
  }
  if (next.employees.length > prev.employees.length) {
    const arrival = next.employees.find((employee) => !prev.employees.some((old) => old.id === employee.id));
    add({ type: "employee.hired", tier: 2, id: arrival?.id, label: arrival ? `${arrival.name} joined the team` : "New team member" });
  }
  if (next.employees.length < prev.employees.length)
    add({ type: "employee.fired", tier: 2 });
  for (const worker of next.employees) {
    const old = prev.employees.find((item) => item.id === worker.id);
    if (old && old.burnoutDays <= 0 && worker.burnoutDays > 0)
      add({ type: "employee.burnout", tier: 2, id: worker.id, label: `${worker.name} needs rest` });
  }
  if (next.company.officeLevel > prev.company.officeLevel)
    add({ type: "office.upgraded", tier: 4, amount: next.company.officeLevel, label: "A larger office" });
  if (next.company.locations.length > prev.company.locations.length)
    add({ type: "location.opened", tier: 4, label: "New location opened" });
  if (next.funding.raisedTotal > prev.funding.raisedTotal) {
    const amount = next.funding.raisedTotal - prev.funding.raisedTotal;
    add({ type: "funding.closed", tier: 4, amount, label: `${compact(amount)} raised · ${(next.company.ownership.founder * 100).toFixed(1)}% founder owned` });
  }
  if (next.stats.acquisitions > prev.stats.acquisitions)
    add({ type: "acquisition", tier: 4, label: "Acquisition complete" });
  if (!prev.endingId && next.endingId) add({ type: "ending", tier: 5, label: "The final chapter" });
  for (const id of next.achievements) {
    if (!prev.achievements.includes(id)) add({ type: "achievement.unlocked", tier: 3, id, label: "Achievement unlocked" });
  }

  if (cmd.type === "startResearch" && next.tasks.some((task) => task.techId === cmd.techId && !prev.tasks.some((old) => old.id === task.id)))
    add({ type: "research.started", tier: 2 });
  if (["assign", "unassign", "autoAssign"].includes(cmd.type) && next !== prev)
    add({ type: "assignment", tier: 1 });
  if (["setModel", "setCompanyModel", "selectPrimitive", "selectMarketNode", "setGtmStrategy", "setBusinessModel", "buyStat", "refundStat"].includes(cmd.type))
    add({ type: "ui.select", tier: 1 });

  if (cmd.type === "marketAction" && next.marketBattle && prev.marketBattle && next.marketBattle.actionLog.length > prev.marketBattle.actionLog.length) {
    const result = next.marketBattle.lastResolution;
    if (result?.dominated) add({ type: "market.captured", tier: 3, id: cmd.nodeId, label: "Market captured" });
    else add({ type: "market.move", tier: 1 });
  }
  if (cmd.type === "marketEndTurn" && next.marketBattle?.lastRivalMove && next.marketBattle.lastRivalMove !== prev.marketBattle?.lastRivalMove)
    add({ type: "market.rival", tier: 2 });
  if (!prev.marketResult && next.marketResult)
    add({ type: "launch.result", tier: next.marketResult.share >= 25 ? 3 : 2, label: next.marketResult.outcome });
  if (cmd.type === "continueMarketResults" && prev.marketResult && !next.marketResult && prev.marketResult.share >= 25)
    add({ type: "launch.homecoming", tier: 3, label: "Launch momentum reaches the office" });

  for (const mail of next.inbox) {
    if (prev.inbox.some((old) => old.id === mail.id)) continue;
    const critical = mail.requiresResponse && mail.eventKind && isLifeOrDeathEvent(mail, next);
    add(critical
      ? { type: "crisis.started", tier: 4, id: mail.id, label: mail.subject }
      : { type: "message.received", tier: mail.requiresResponse ? 2 : 1, id: mail.id });
  }
  if (next.social?.dms?.length > (prev.social?.dms?.length ?? 0)) add({ type: "social.received", tier: 1 });

  // Passive daily accounting updates the HUD but does not score a sound or presentation.
  if (cmd.type !== "tickDay") {
    const cash = next.company.cash - prev.company.cash;
    const importantCash = Math.abs(cash) >= Math.max(10_000, Math.abs(prev.company.cash) * 0.08);
    if (importantCash && !events.some((event) => ["funding.closed", "acquisition"].includes(event.type)))
      add({ type: cash > 0 ? "money.gained" : "money.spent", tier: Math.abs(cash) >= 1_000_000 ? 3 : 2, amount: cash });
  }

  const milestones: Array<[string, number | null, FeedbackTier]> = [
    ["revenue", crossed(prev.company.lifetimeRevenue, next.company.lifetimeRevenue, milestoneBands.revenue), 4],
    ["valuation", crossed(prev.company.valuation, next.company.valuation, milestoneBands.valuation), 4],
    ["users", crossed(prev.products.reduce((sum, p) => sum + p.users, 0), next.products.reduce((sum, p) => sum + p.users, 0), milestoneBands.users), 4],
    ["team", crossed(prev.employees.length, next.employees.length, milestoneBands.team), 3],
    ["products", crossed(prev.stats.productsLaunched, next.stats.productsLaunched, milestoneBands.products), 3],
  ];
  for (const [kind, value, tier] of milestones) {
    if (value === null) continue;
    const label = kind === "users" ? `${value.toLocaleString()} users` : kind === "team" ? `${value} team members` : kind === "products" ? `${value} launches` : `${compact(value)} ${kind}`;
    add({ type: "milestone", tier: value >= 1_000_000_000 ? 5 : tier, id: `${kind}-${value}`, label: label.toUpperCase() });
  }
  return events;
}
