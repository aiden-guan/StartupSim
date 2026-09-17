import { produce } from "immer";
import { BALANCE } from "../config/balance";
import { events } from "../data/events";
import { fillerNews, newsTemplates } from "../data/news";
import { onboarding } from "../data/onboarding";
import { specialProjects } from "../data/specialProjects";
import { techById } from "../data/technologies";
import { applyBattleResults } from "../market/battle";
import { applyEffects } from "./effects";
import { allSatisfied, monthlyArr } from "./conditions";
import { addDays, isMonthStart, isQuarterStart, isWeekStart, isYearStart } from "./date";
import { monthlyCompute, monthlyPayroll, monthlyRent, valuationOf } from "./derived";
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
    state.clock.paused = true;
    state.clock.reasonPaused = "Product ready to configure";
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

function maybeEvents(state: GameState, r: Rng): void {
  for (const ev of events) {
    if (!allSatisfied(ev.conditions, state)) continue;
    if (!ev.repeatable && state.inbox.some((m) => m.subject === ev.title)) continue;
    if (!r.chance(0.08 * (ev.weight / 10))) continue;
    const mail: Mail = {
      id: uid(r, "mail"),
      at: { ...state.clock.date },
      from: ev.from,
      subject: ev.title,
      body: ev.body,
      choices: ev.choices,
      read: false,
      requiresResponse: Boolean(ev.choices?.length),
    };
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
      state.clock.paused = true;
      state.clock.reasonPaused = "A crisis needs people";
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
  if (!r.chance(0.35)) return;
  const c = r.pick(state.competitors);
  const tmpl = r.pick(newsTemplates);
  const product = r.pick(c.products);
  state.news.unshift({
    id: uid(r, "news"),
    at: { ...state.clock.date },
    headline: tmpl.headline.replace("{{company}}", c.name).replace("{{product}}", product),
    body: r.pick(fillerNews),
    tone: tmpl.tone,
  });
  state.news = state.news.slice(0, 40);
}

function onboard(state: GameState): void {
  if (!state.onboarding.tutorialEnabled) return;
  if (state.pendingMentor) return;
  for (const step of onboarding) {
    if (state.onboarding.finished.includes(step.id)) continue;
    if (step.condition) {
      const ok = allSatisfied(
        [{ type: step.condition.type, op: step.condition.op as never, val: step.condition.val }],
        state,
      );
      if (!ok) continue;
    }
    if (step.after && !state.onboarding.finished.includes(step.after)) continue;
    state.pendingMentor = step.id;
    state.clock.paused = true;
    state.clock.reasonPaused = "Mentor";
    break;
  }
}

const TERMINAL = new Set(["bankruptcy", "board-out", "automated-ceo", "safety-crisis", "monopoly", "unknown"]);

function checkEndings(state: GameState): void {
  if (state.endingId) return;
  const found = detectEnding(state);
  if (!found || !TERMINAL.has(found.id)) return;
  state.endingId = found.id;
  state.endingNote = found.note;
  state.clock.paused = true;
  state.clock.reasonPaused = "Closed";
}

export function tickDay(state: GameState): GameState {
  return produce(state, (draft) => {
    if (draft.endingId) return;
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
      for (const p of draft.products) {
        const h = harvestProduct(p, r);
        rev += h.revenue;
        inf += h.inference;
      }
      draft.company.cash += rev;
      draft.company.lifetimeRevenue += rev;
      draft.company.monthlyRevenue += rev;
      draft.stats.computeConsumed += inf;
      if (draft.compute.apiCredits > 0) {
        const use = Math.min(draft.compute.apiCredits, inf);
        draft.compute.apiCredits -= use;
        inf -= use;
      }
      const ownedOffset = draft.compute.ownedCluster * 120 + draft.compute.dataCenters * 4000;
      inf = Math.max(0, inf - ownedOffset);
      draft.company.cash -= inf;
      draft.company.lifetimeCosts += inf;
      draft.company.monthlyCosts += inf;

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
      const compute = monthlyCompute(draft) * 0.15;
      const cost = pay + rent + compute;
      draft.company.cash -= cost;
      draft.company.lifetimeCosts += cost;
      draft.company.monthlyCosts += cost;
      draft.company.lastMonthlyRevenue = draft.company.monthlyRevenue;
      draft.company.lastMonthlyCosts = draft.company.monthlyCosts;
      draft.company.monthlyRevenue = 0;
      draft.company.monthlyCosts = 0;
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

    if (draft.clock.tick === 10 || draft.company.productsLaunched >= 1) draft.unlocks.hiring = true;
    if (draft.company.productsLaunched >= 1) {
      draft.unlocks.research = true;
      draft.unlocks.compute = true;
      draft.unlocks.promo = true;
      draft.unlocks.perks = true;
      draft.unlocks.models = true;
    }
    if (draft.company.productsLaunched >= 2) draft.unlocks.funding = true;
    if (draft.company.productsLaunched >= 3) draft.unlocks.world = true;
    if (draft.company.officeLevel >= 1) draft.unlocks.locations = true;
    if (draft.company.cash > 200_000) draft.unlocks.verticals = true;
    if (monthlyArr(draft) > 400_000) draft.unlocks.acquisitions = true;
    if (monthlyArr(draft) > 250_000) draft.unlocks.lobbying = true;
    if (draft.company.technologies.includes("agents")) draft.unlocks.automation = true;
    if (draft.company.technologies.includes("fine-tuning")) draft.unlocks.models = true;

    onboard(draft);
    checkEndings(draft);
    commit(draft, r);
  });
}

export function applyBattleToState(state: GameState): GameState {
  return produce(state, (draft) => {
    if (!draft.marketBattle) return;
    const r = rng(draft);
    applyBattleResults(draft, draft.marketBattle, r);
    draft.marketBattle = null;
    draft.clock.paused = false;
    draft.clock.reasonPaused = null;
    commit(draft, r);
  });
}
