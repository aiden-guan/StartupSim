import { produce } from "immer";
import { BALANCE } from "../config/balance";
import { events } from "../data/events";
import { NEWS_CHAINS, type NewsChain, type NewsStage } from "../data/news";
import { reconcileTutorial, recordTutorialEvent, updateUnlocks } from "./tutorial";
import { setPause } from "./pause";
import { specialProjects } from "../data/specialProjects";
import { techById } from "../data/technologies";
import { applyMarketEntryResults } from "../market/marketMap";
import { applyEffects } from "./effects";
import { allSatisfied, monthlyArr } from "./conditions";
import { addDays, isMonthStart, isQuarterStart, isWeekStart, isYearStart } from "./date";
import { fixedComputeCost, inferenceCoverage, monthlyBurn, monthlyCompanyOperations, monthlyPayroll, monthlyRent, valuationOf } from "./derived";
import { harvestProduct } from "./products";
import { Rng, uid } from "./rng";
import { developTask, makeTask, unassignAll } from "./tasks";
import type { GameState, Mail, Task } from "./types";
import { detectEnding } from "./endings";
import { growWorker, updateBurnout } from "./workers";

function rng(state: GameState): Rng {
  return new Rng(state.meta.rngState);
}

function commit(state: GameState, r: Rng): void {
  state.meta.rngState = r.seed;
}

function finishTask(state: GameState, task: Task, r: Rng): void {
  unassignAll(task, state);
  state.tasks = state.tasks.filter((t) => t.id !== task.id);
  if (task.type === "product") {
    const p = state.products.find((x) => x.id === task.productId);
    if (p) {
      p.status = "ready";
      if (state.company.productsLaunched === 0) {
        p.points.engineering += 48;
        p.points.product += 48;
        p.points.growth += 48;
        p.points.research += 12;
      }
    }
    setPause(state, "productReady", true);
    recordTutorialEvent(state, "firstProductReady");
    return;
  }
  if (task.type === "research" && task.techId) {
    const tech = techById[task.techId];
    if (tech && !state.company.technologies.includes(tech.id)) {
      state.company.technologies.push(tech.id);
      for (const prim of tech.unlockPrimitives ?? []) {
        if (!state.company.primitives.includes(prim)) state.company.primitives.push(prim);
      }
      applyEffects(state, tech.effects as never);
      state.stats.researchCompleted += 1;
      state.company.hype += 3;
    }
  }
  if (task.type === "promo") {
    let hype = (task.skillVal ?? 4) * (task.dueWeeks ?? 2);
    if (r.chance(0.08)) hype *= 1.8;
    else if (r.chance(0.08)) hype *= 0.7;
    state.company.hype += hype;
    if (state.company.backlash > 10) {
      state.company.hype += 4;
      state.company.backlash *= 0.92;
    }
  }
  if (task.type === "crisis") {
    const success = (task.skillVal ?? 0) >= (task.skillNeed ?? 1);
    applyEffects(state, success ? task.successEffects : task.failureEffects);
    state.inbox.unshift({
      id: uid(r, "mail"),
      at: { ...state.clock.date },
      from: "ops",
      subject: success ? `${task.name} contained` : `${task.name} leaked`,
      body: success ? task.successBody ?? "Handled." : task.failureBody ?? "Not handled.",
      read: false,
      requiresResponse: false,
    });
    if (!success) state.stats.scandals += 1;
  }
  if (task.type === "special" && task.projectId) {
    if (!state.company.specialProjects.includes(task.projectId)) {
      state.company.specialProjects.push(task.projectId);
    }
    const proj = specialProjects.find((p) => p.id === task.projectId);
    applyEffects(state, proj?.effects);
  }
  if (task.type === "lobby" && task.lobbyId) {
    state.company.lobbies.push(task.lobbyId);
  }
  if (task.type === "hiring") {
    state.unlocks.hiring = true;
  }
}

export function buildPoachMail(state: GameState, r: Rng, mail: Mail): Mail | null {
  const employee = r.pick(state.employees.filter((worker) => worker.role === "employee"));
  if (!employee) return null;
  const offer = Math.round(Math.max(employee.salary * 1.38, employee.salary + 60_000) / 1_000) * 1_000;
  const increase = offer - employee.salary;
  const currentBurn = Math.max(1, monthlyBurn(state));
  const nextBurn = currentBurn + increase / 12;
  const currentRunway = state.company.cash / currentBurn;
  const nextRunway = state.company.cash / nextBurn;
  mail.subject = `${employee.name} received an outside offer`;
  mail.body = `${employee.name} received a written offer from a frontier lab. They will stay if you match the base salary. No signing bonus is due today.`;
  mail.context = [
    { label: "Current salary", value: `$${Math.round(employee.salary).toLocaleString()}/yr` },
    { label: "Competing offer", value: `$${offer.toLocaleString()}/yr` },
    { label: "Added payroll", value: `+$${increase.toLocaleString()}/yr` },
    { label: "Runway impact", value: `${currentRunway.toFixed(1)} mo → ${nextRunway.toFixed(1)} mo` },
  ];
  mail.warning = nextRunway < 2.5 ? "Matching leaves less than 2.5 months of runway at the current burn rate." : undefined;
  mail.choices = [
    { id: "match", label: "Match the offer", effects: [{ type: "setSalary", value: { employeeId: employee.id, salary: offer } }, { type: "morale", value: 6 }], consequences: [`Salary becomes $${offer.toLocaleString()}/yr`, `Monthly payroll increases by $${Math.round(increase / 12).toLocaleString()}`], warning: mail.warning },
    { id: "let-go", label: "Let them walk", effects: [{ type: "loseEmployee", value: employee.id }, { type: "competitorBoost", value: 1 }], consequences: [`${employee.name} leaves immediately`, "A competitor gains technical capability"] },
  ];
  mail.requiresResponse = true;
  return mail;
}

function maybeEvents(state: GameState, r: Rng): void {
  if (!state.company.seenMarket || state.pendingMentor || state.marketResult) return;
  for (const ev of events) {
    if (!allSatisfied(ev.conditions, state)) continue;
    const previous = state.inbox.find((m) => m.eventId === ev.id || m.subject === ev.title);
    if (!ev.repeatable && previous) continue;
    if (ev.repeatable && previous?.createdTick !== undefined && state.clock.tick - previous.createdTick < ev.cooldownDays) continue;
    if (!r.chance(0.08 * (ev.weight / 10))) continue;
    const mail: Mail = {
      id: uid(r, "mail"),
      at: { ...state.clock.date },
      from: ev.from,
      subject: ev.title,
      body: ev.body,
      choices: ev.choices ? structuredClone(ev.choices) : undefined,
      read: false,
      requiresResponse: Boolean(ev.choices?.length),
      createdTick: state.clock.tick,
      eventId: ev.id,
    };
    if (ev.id === "poach") {
      if (!buildPoachMail(state, r, mail)) continue;
    }
    state.inbox.unshift(mail);
    applyEffects(state, ev.effects);
    if (ev.crisis) {
      const t = makeTask(r, {
        type: "crisis",
        name: ev.crisis.name,
        requiredProgress: ev.crisis.dueWeeks,
        skillTarget: ev.crisis.skill,
        skillNeed: ev.crisis.need,
        skillVal: 0,
        dueWeeks: ev.crisis.dueWeeks,
        successEffects: ev.crisis.success,
        failureEffects: ev.crisis.failure,
        successBody: ev.crisis.successBody,
        failureBody: ev.crisis.failureBody,
      });
      state.tasks.push(t);
      setPause(state, "manual", true);
    }
    break;
  }
}

function competitorTick(state: GameState, r: Rng): void {
  for (const c of state.competitors) {
    if (c.disabled) continue;
    c.hype = Math.max(0, c.hype * 0.99 + r.float(0, 0.4));
    if (r.chance(0.12)) c.capability += r.float(0.2, 1.2);
    if (r.chance(0.08)) {
      const tech = r.pick(["prompt-engineering", "embeddings", "fine-tuning", "reasoning", "agents"]);
      if (!c.techs.includes(tech)) c.techs.push(tech);
    }
    if (r.chance(0.05) && c.products.length < 8) {
      c.products.push(r.pick(["chat", "agent", "api", "image", "workflow"]));
      c.hype += 3;
    }
    if (r.chance(0.06)) {
      c.marketShare = Math.min(40, c.marketShare + r.float(0.1, 0.8));
      for (const p of state.products) {
        if (p.status === "active") p.marketShare = Math.max(0, p.marketShare * 0.995);
      }
    }
    if (r.chance(0.04)) {
      const raise = r.int(2_000_000, 20_000_000);
      c.funding += raise;
      c.cash += raise * 0.9;
    }
    if (r.chance(0.015) && state.employees.length > 3 && r.chance(c.personality === "aggressive" ? 0.6 : 0.25)) {
      const extra = state.employees.find((e) => e.role === "employee");
      if (extra && extra.loyalty < 6) {
        extra.offMarketDays = 21;
        state.employees = state.employees.filter((e) => e.id !== extra.id);
        c.employees += 1;
        state.inbox.unshift({
          id: uid(r, "mail"),
          at: { ...state.clock.date },
          from: "people",
          subject: `${extra.name} left for ${c.name}`,
          body: "They took the offer. The desk is already empty.",
          read: false,
          requiresResponse: false,
        });
      }
    }
  }
}

function newsTick(state: GameState, r: Rng): void {
  const publish = (chain: NewsChain, stage: NewsStage, index: number) => {
    state.news.unshift({
      id: uid(r, "news"),
      at: { ...state.clock.date },
      headline: stage.headline,
      body: stage.body,
      tone: stage.tone,
      chainId: chain.id,
      chainStage: index,
      createdTick: state.clock.tick,
      impact: stage.impact,
    });
    applyEffects(state, stage.effects);
    state.news = state.news.slice(0, 60);
  };

  for (const chain of NEWS_CHAINS) {
    const latest = state.news.find((item) => item.chainId === chain.id);
    if (!latest || latest.chainStage === undefined || latest.createdTick === undefined) continue;
    const nextIndex = latest.chainStage + 1;
    const next = chain.stages[nextIndex];
    if (next && state.clock.tick - latest.createdTick >= next.delayWeeks * 7) {
      publish(chain, next, nextIndex);
      return;
    }
  }

  if (!r.chance(0.32)) return;
  const eligible = NEWS_CHAINS.filter((chain) => chain.minYear <= state.clock.date.year && !state.news.some((item) => item.chainId === chain.id));
  if (!eligible.length) return;
  const weighted = eligible.flatMap((chain) => Array.from({ length: chain.weight }, () => chain));
  const chain = r.pick(weighted);
  publish(chain, chain.stages[0]!, 0);
}

export function checkOnboarding(state: GameState): void {
  reconcileTutorial(state);
}

const TERMINAL = new Set(["bankruptcy", "board-out", "automated-ceo", "safety-crisis", "monopoly", "unknown"]);

function checkEndings(state: GameState): void {
  if (state.endingId) return;
  const found = detectEnding(state);
  if (!found || !TERMINAL.has(found.id)) return;
  state.endingId = found.id;
  state.endingNote = found.note;
  setPause(state, "ended", true);
}

export function tickDay(state: GameState): GameState {
  return produce(state, (draft) => {
    if (draft.endingId || draft.marketBattle || draft.marketResult) return;
    const r = rng(draft);
    draft.clock.date = addDays(draft.clock.date, 1);
    draft.clock.tick += 1;
    draft.hiring.cooldownDays = Math.max(0, draft.hiring.cooldownDays - 1);
    draft.funding.cooldownDays = Math.max(0, draft.funding.cooldownDays - 1);

    for (const task of [...draft.tasks]) {
      const done = developTask(draft, task);
      if (task.type === "crisis" && isWeekStart(draft.clock.date)) {
        task.dueWeeks = (task.dueWeeks ?? 1) - 1;
        task.progress += 1;
      }
      if (done) finishTask(draft, task, r);
    }

    for (const w of draft.employees) {
      updateBurnout(draft, r, w);
      growWorker(w, r);
    }

    if (isWeekStart(draft.clock.date)) {
      let rev = 0;
      let inf = 0;
      let operations = 0;
      for (const p of draft.products) {
        const h = harvestProduct(p, r);
        rev += h.revenue;
        inf += h.inference;
        operations += h.operations;
      }
      draft.company.cash += rev;
      draft.company.lifetimeRevenue += rev;
      draft.company.monthlyRevenue += rev;
      draft.company.currentMonthBreakdown.revenue += rev;
      draft.stats.computeConsumed += inf;
      inf = Math.max(0, inf - inferenceCoverage(draft));
      if (draft.compute.apiCredits > 0) {
        const use = Math.min(draft.compute.apiCredits, inf);
        draft.compute.apiCredits -= use;
        inf -= use;
      }

      draft.company.cash -= inf;
      draft.company.lifetimeCosts += inf;
      draft.company.monthlyCosts += inf;
      draft.company.currentMonthBreakdown.inference += inf;
      draft.company.cash -= operations;
      draft.company.lifetimeCosts += operations;
      draft.company.monthlyCosts += operations;
      draft.company.currentMonthBreakdown.productOperations += operations;

      draft.company.hype *= BALANCE.HYPE_DECAY;
      draft.company.backlash *= BALANCE.BACKLASH_DECAY;
      draft.company.hype = Math.max(0, draft.company.hype - Math.sqrt(draft.company.backlash) / 80);
      draft.company.trust = Math.max(5, draft.company.trust + (draft.company.hype > 30 ? 0.1 : -0.05) - draft.company.backlash * 0.01);

      maybeEvents(draft, r);
      competitorTick(draft, r);
      newsTick(draft, r);
      draft.world.aiAdoption += 0.02;
      draft.world.computeDemand += 0.03;
    }

    if (isMonthStart(draft.clock.date)) {
      const pay = monthlyPayroll(draft);
      const rent = monthlyRent(draft);
      const compute = fixedComputeCost(draft);
      const operations = monthlyCompanyOperations(draft);
      const cost = pay + rent + compute + operations;
      draft.company.cash -= cost;
      draft.company.lifetimeCosts += cost;
      draft.company.monthlyCosts += cost;
      draft.company.currentMonthBreakdown.payroll += pay;
      draft.company.currentMonthBreakdown.office += rent;
      draft.company.currentMonthBreakdown.fixedCompute += compute;
      draft.company.currentMonthBreakdown.companyOperations += operations;
      draft.company.lastMonthlyRevenue = draft.company.monthlyRevenue;
      draft.company.lastMonthlyCosts = draft.company.monthlyCosts;
      draft.company.lastMonthlyBreakdown = { ...draft.company.currentMonthBreakdown };
      draft.company.monthlyRevenue = 0;
      draft.company.monthlyCosts = 0;
      draft.company.currentMonthBreakdown = { revenue: 0, inference: 0, productOperations: 0, payroll: 0, office: 0, fixedCompute: 0, companyOperations: 0 };
      draft.company.valuation = valuationOf(draft);
      draft.stats.peakValuation = Math.max(draft.stats.peakValuation, draft.company.valuation);
      draft.stats.peakEmployees = Math.max(draft.stats.peakEmployees, draft.employees.length);
      draft.history.push({
        year: draft.clock.date.year,
        month: draft.clock.date.month,
        cash: draft.company.cash,
        revenue: draft.company.lastMonthlyRevenue,
        burn: Math.max(0, draft.company.lastMonthlyCosts - draft.company.lastMonthlyRevenue),
        hype: draft.company.hype,
        trust: draft.company.trust,
        employees: draft.employees.length,
        valuation: draft.company.valuation,
      });
      draft.history = draft.history.slice(-BALANCE.HISTORY_MONTHS);
      draft.company.culture.bureaucracy = Math.min(100, 8 + draft.employees.length * 0.6);

      if (draft.board && draft.board.graceMonths > 0) draft.board.graceMonths -= 1;
    }

    if (isQuarterStart(draft.clock.date) && draft.board) {
      const arr = monthlyArr(draft);
      const ratio = arr / Math.max(1, draft.board.arrTarget);
      if (draft.board.graceMonths <= 0) {
        if (ratio >= 1) draft.board.approval += 8;
        else draft.board.approval -= (1 - ratio) * 18;
      }
      draft.board.arrTarget = Math.max(arr, draft.board.arrTarget) * (1 + BALANCE.BOARD_DESIRED_GROWTH);
      draft.inbox.unshift({
        id: uid(r, "mail"),
        at: { ...draft.clock.date },
        from: "board",
        subject: "Quarterly",
        body: `ARR vs target: ${(ratio * 100).toFixed(0)}%. Approval sits at ${draft.board.approval.toFixed(0)}.`,
        read: false,
        requiresResponse: false,
      });
    }

    if (isYearStart(draft.clock.date)) {
      draft.economy = draft.nextEconomy;
      if (r.chance(0.22)) {
        const order = ["recession", "slowdown", "normal", "boom", "aiBubble", "creditCrunch"] as const;
        draft.nextEconomy = r.pick(order);
      }
    }

    updateUnlocks(draft);
    if (monthlyArr(draft) > 400_000) draft.unlocks.acquisitions = true;
    if (monthlyArr(draft) > 250_000) draft.unlocks.lobbying = true;
    reconcileTutorial(draft);
    checkEndings(draft);
    commit(draft, r);
  });
}

export function applyBattleToState(state: GameState): GameState {
  return produce(state, (draft) => {
    if (!draft.marketBattle) return;
    const r = rng(draft);
    applyMarketEntryResults(draft, draft.marketBattle, r);
    draft.marketBattle = null;
    setPause(draft, "market", false);
    setPause(draft, "results", true);
    commit(draft, r);
  });
}
