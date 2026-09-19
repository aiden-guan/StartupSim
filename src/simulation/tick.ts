import { produce } from "immer";
import { BALANCE } from "../config/balance";
import { events } from "../data/events";
import { NEWS_CHAINS, type NewsChain, type NewsStage } from "../data/news";
import { modelById, models } from "../data/models";
import { reconcileTutorial, recordTutorialEvent, updateUnlocks } from "./tutorial";
import { isLifeOrDeathEvent, isMinorFee, setPause } from "./pause";
import { specialProjects } from "../data/specialProjects";
import { techById } from "../data/technologies";
import { applyMarketEntryResults } from "../market/marketMap";
import { applyEffects, isProviderAvailable, providerForModel } from "./effects";
import { allSatisfied, monthlyArr } from "./conditions";
import { addDays, isMonthStart, isQuarterStart, isWeekStart, isYearStart } from "./date";
import { fixedComputeCost, inferenceCoverage, monthlyBurn, monthlyCompanyOperations, monthlyPayroll, monthlyRent, valuationOf } from "./derived";
import { allocateTrainingCompute, consumeTrainingCompute } from "./compute";
import { companyStage, eventFitsStage, scaleEffects, severityForEvent } from "./eventEconomy";
import { departureImpact } from "./staffing";
import { Rng, uid } from "./rng";
import { developTask, makeTask, unassignAll } from "./tasks";
import { harvestProduct } from "./products";
import type { GameState, Mail, Task } from "./types";
import { detectEnding } from "./endings";
import { growWorker, updateBurnout } from "./workers";
import { handleFor, tickSocial } from "./social";
import { buildAcquisitionMail } from "./acquisitionMail";
import { checkAchievements } from "./achievements";

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
    state.news.unshift({
      id: uid(r, "news"),
      at: { ...state.clock.date },
      headline: `${p?.name ?? task.name} is ready to configure`,
      body: "Development finished. Launch points can be spent and the product can enter the market.",
      tone: "hype",
      createdTick: state.clock.tick,
      impact: "Open Products to configure the launch.",
      read: false,
      source: "Studio",
      category: "internal",
    });
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
      sender: {
        name: "Internal Ops",
        role: "Incident Command",
        organization: state.company.name,
        handle: `ops@${handleFor(state.company.name)}.ai`,
        avatarInitial: "O",
        avatarColor: "#475569",
      },
      recipient: {
        name: state.founder.name || "Founder",
        organization: state.company.name,
        handle: `${handleFor(state.founder.name || "Founder")}@${handleFor(state.company.name)}.ai`,
      },
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
  const task = employee.taskId ? state.tasks.find((t) => t.id === employee.taskId) : undefined;
  const leaveHit = departureImpact(state, employee).lossPct;
  const projectImpact = task && leaveHit > 0
    ? `${employee.title} on ${task.name}. Expected development rate decreases by ~${leaveHit}% if they leave.`
    : task
      ? `${employee.title} on ${task.name}.`
      : "Not currently assigned to an active project.";
  mail.employeeId = employee.id;
  mail.sender = {
    name: "Marcus Vance",
    role: "Partner",
    organization: "Apex Executive Search",
    handle: "mvance@apexsearch.io",
    avatarInitial: "A",
    avatarColor: "#b33939",
  };
  mail.recipient = {
    name: state.founder.name || "Founder",
    organization: state.company.name,
    handle: `${handleFor(state.founder.name || "Founder")}@${handleFor(state.company.name)}.ai`,
  };
  mail.profile = {
    employeeId: employee.id,
    name: employee.name,
    title: employee.title,
    role: employee.role,
    look: employee.look,
    skills: employee.skills,
    salary: employee.salary,
    taskName: task?.name ?? null,
    tenureDays: employee.tenureDays,
    projectImpact,
  };
  mail.subject = `${employee.name} received an outside offer`;
  mail.body = `${employee.name} received a written offer from a frontier lab. They will stay if you match the base salary. No signing bonus is due today.`;
  mail.context = [
    { label: "Current salary", value: `$${Math.round(employee.salary).toLocaleString()}/yr` },
    { label: "Competing offer", value: `$${offer.toLocaleString()}/yr` },
    { label: "Added payroll", value: `+$${increase.toLocaleString()}/yr` },
    { label: "Runway impact", value: `${currentRunway.toFixed(1)} mo → ${nextRunway.toFixed(1)} mo` },
    { label: "Current project", value: task?.name ?? "Unassigned" },
    { label: "If they leave", value: projectImpact },
  ];
  mail.warning = nextRunway < 2.5 ? "Matching leaves less than 2.5 months of runway at the current burn rate." : undefined;
  mail.choices = [
    { id: "match", label: "Match the offer", effects: [{ type: "setSalary", value: { employeeId: employee.id, salary: offer } }, { type: "morale", value: 6 }], consequences: [`Salary becomes $${offer.toLocaleString()}/yr`, `Monthly payroll increases by $${Math.round(increase / 12).toLocaleString()}`], warning: mail.warning },
    { id: "let-go", label: "Let them walk", effects: [{ type: "loseEmployee", value: employee.id }, { type: "competitorBoost", value: 1 }], consequences: [`${employee.name} leaves immediately`, projectImpact, "A competitor gains technical capability"] },
  ];
  mail.impact = `Choose between ${employee.name}'s higher payroll or losing a trained employee immediately. ${projectImpact}`;
  mail.requiresResponse = true;
  return mail;
}

const SERVICE_PRODUCT_STATUSES = new Set(["active", "mature", "declining"]);

export function buildProviderOutageMail(state: GameState, r: Rng, mail: Mail): boolean {
  const affectedProducts = state.products.filter((product) => {
    if (!SERVICE_PRODUCT_STATUSES.has(product.status)) return false;
    const provider = providerForModel(product.modelId);
    return Boolean(provider && (state.providerOutages ?? []).every((outage) => outage.provider !== provider || outage.untilTick <= state.clock.tick));
  });
  const providers = [...new Set(affectedProducts.map((product) => providerForModel(product.modelId)).filter((provider): provider is string => Boolean(provider)))];
  const provider = r.pick(providers);
  if (!provider) return false;
  const affected = affectedProducts.filter((product) => providerForModel(product.modelId) === provider);
  if (!affected.length) return false;
  const durationDays = r.int(21, 35);
  const fallbackModels = models
    .filter((model) => model.provider !== provider && (model.provider !== "You" || state.ownedModels.includes(model.id)))
    .filter((model) => isProviderAvailable(state, model.provider))
    .slice(0, 4);
  if (!fallbackModels.length) return false;
  const names = affected.map((product) => product.name);
  const productLabel = names.length === 1 ? names[0]! : `${names.length} active products`;
  mail.sender = {
    name: `${provider} Status & Incident Ops`,
    role: "Incident Commander",
    organization: provider,
    handle: `incident-response@${handleFor(provider)}.status.io`,
    avatarInitial: provider[0],
    avatarColor: "#b55400",
  };
  mail.recipient = {
    name: state.founder.name || "Founder",
    organization: state.company.name,
    handle: `${handleFor(state.founder.name || "Founder")}@${handleFor(state.company.name)}.ai`,
  };
  mail.subject = `${provider} is down — ${productLabel} affected`;
  mail.body = `${provider} has taken its inference API offline for an incident window. Your deployed products using this provider are still running, but requests are failing and only a fraction of weekly revenue will be collected until you migrate or service returns.`;
  mail.context = [
    { label: "Provider status", value: `${provider} · unavailable now` },
    { label: "Recovery window", value: `${durationDays} days` },
    { label: "Products exposed", value: names.join(", ") },
    { label: "While down", value: "45% less weekly revenue collected" },
  ];
  mail.warning = `Models from ${provider} are disabled while the incident is active. New products cannot select them.`;
  mail.impact = `${productLabel} collects 45% less weekly revenue while ${provider} is unavailable. Migrate now or absorb the outage for about ${durationDays} days.`;
  mail.choices = fallbackModels.map((model) => {
    const previousModels = affected.map((product) => modelById[product.modelId]).filter(Boolean);
    const strongestPrevious = Math.max(...previousModels.map((previous) => previous!.capability));
    const capability = model.capability >= strongestPrevious ? "capability holds or improves" : "capability steps down slightly";
    return {
      id: `migrate-${model.id}`,
      label: `Migrate to ${model.name}`,
      effects: [{ type: "migrateProducts", value: { fromProvider: provider, modelId: model.id } }],
      consequences: [
        `Move ${productLabel} to ${model.name}`,
        `Inference price resets to ${model.costPerMTok}/MTok`,
        `Model ${capability}; the provider lockout is bypassed now`,
      ],
    };
  });
  mail.choices.push({
    id: "wait-for-recovery",
    label: "Wait for recovery",
    effects: [],
    consequences: [
      `Keep ${productLabel} on ${provider}`,
      `Collect 45% less weekly revenue for about ${durationDays} days`,
      "The original models become selectable when service returns",
    ],
    warning: "No migration happens now; the revenue penalty applies at each weekly collection while the provider is down.",
  });
  mail.requiresResponse = true;
  applyEffects(state, [{ type: "providerOutage", value: { provider, durationDays } }]);
  return true;
}

function releaseExpiredProviderOutages(state: GameState, r: Rng): void {
  const outages = state.providerOutages ?? [];
  const expired = outages.filter((outage) => outage.untilTick <= state.clock.tick);
  if (!expired.length) return;
  state.providerOutages = outages.filter((outage) => outage.untilTick > state.clock.tick);
  for (const outage of expired) {
    state.inbox.unshift({
      id: uid(r, "mail"),
      at: { ...state.clock.date },
      from: "compute",
      sender: {
        name: `${outage.provider} Status Operations`,
        role: "Incident Resolution",
        organization: outage.provider,
        handle: `incident-response@${handleFor(outage.provider)}.status.io`,
        avatarInitial: outage.provider[0],
        avatarColor: "#2d6a4f",
      },
      recipient: {
        name: state.founder.name || "Founder",
        organization: state.company.name,
        handle: `${handleFor(state.founder.name || "Founder")}@${handleFor(state.company.name)}.ai`,
      },
      subject: `${outage.provider} service restored`,
      body: `${outage.provider} has cleared the incident. Its models are available again for new products and product migrations.`,
      eventKind: "recovery",
      impact: `Models from ${outage.provider} are selectable again. Products that stayed on the provider recover their normal revenue collection.`,
      createdTick: state.clock.tick,
      read: false,
      requiresResponse: false,
    });
  }
}

function maybeEvents(state: GameState, r: Rng): void {
  if (!state.company.seenMarket || state.pendingMentor || state.marketResult || state.marketBattle) return;
  if (state.inbox.some((mail) => mail.requiresResponse) || state.tasks.some((task) => task.type === "crisis")) return;
  const lastEventTick = state.inbox.reduce((latest, mail) => mail.eventId && mail.createdTick !== undefined ? Math.max(latest, mail.createdTick) : latest, -1);
  if (lastEventTick >= state.clock.tick - BALANCE.GAMEPLAY_EVENT_COOLDOWN_DAYS) return;
  if (!r.chance(BALANCE.GAMEPLAY_EVENT_CHANCE_PER_WEEK)) return;

  const eligible = events.filter((ev) => {
    if (!ev.eventKind && !ev.effects?.length && !ev.choices?.length && !ev.crisis) return false;
    if (!allSatisfied(ev.conditions, state)) return false;
    if (!eventFitsStage(ev.id, companyStage(state))) return false;
    const previous = state.inbox.find((mail) => mail.eventId === ev.id || mail.subject === ev.title);
    if (!ev.repeatable && previous) return false;
    return !(ev.repeatable && previous?.createdTick !== undefined && state.clock.tick - previous.createdTick < ev.cooldownDays);
  });
  if (!eligible.length) return;
  const weighted = eligible.flatMap((ev) => Array.from({ length: Math.max(1, ev.weight) }, () => ev));
  const ev = r.pick(weighted);
  const severity = severityForEvent(ev.eventKind, ev.id);
  const scaledChoices = ev.choices
    ? structuredClone(ev.choices).map((choice) => ({
        ...choice,
        effects: scaleEffects(state, choice.effects, severity, r) ?? choice.effects,
      }))
    : undefined;
  const mail: Mail = {
    id: uid(r, "mail"),
    at: { ...state.clock.date },
    from: ev.from,
    subject: ev.title,
    body: ev.body,
    eventKind: ev.eventKind,
    impact: ev.impact,
    choices: scaledChoices,
    read: false,
    requiresResponse: Boolean(ev.choices?.length),
    createdTick: state.clock.tick,
    eventId: ev.id,
  };
  if (ev.id === "poach" && !buildPoachMail(state, r, mail)) return;
  if (ev.id === "provider-outage" && !buildProviderOutageMail(state, r, mail)) return;
  if (ev.id === "acquisition-inbound") {
    buildAcquisitionMail(state, r, mail);
  }
  if (isMinorFee(mail, state) || isMinorFee(mail)) {
    mail.autoChargeDays = BALANCE.MINOR_FEE_AUTO_CHARGE_DAYS;
    mail.deadlineDays = BALANCE.MINOR_FEE_AUTO_CHARGE_DAYS;
    if (mail.impact) {
      mail.impact += ` · Auto-charges in ${mail.autoChargeDays} days if not contested.`;
    }
  } else if (mail.requiresResponse) {
    mail.deadlineDays = BALANCE.DECISION_EVENT_DEADLINE_DAYS;
    if (mail.impact) {
      mail.impact += ` · Response deadline: ${mail.deadlineDays} days.`;
    }
  }
  if (!mail.recipient) {
    mail.recipient = {
      name: state.founder.name || "Founder",
      organization: state.company.name,
      handle: `${handleFor(state.founder.name || "Founder")}@${handleFor(state.company.name)}.ai`,
    };
  }
  if (!mail.sender) {
    mail.sender = {
      name: ev.from.charAt(0).toUpperCase() + ev.from.slice(1),
      role: "Industry Contact",
      organization: ev.from,
      handle: `${handleFor(ev.from)}@ecosystem.ai`,
      avatarInitial: ev.from[0]?.toUpperCase() ?? "E",
      avatarColor: "#4f46e5",
    };
  }
  state.inbox.unshift(mail);
  applyEffects(state, scaleEffects(state, ev.effects, severity, r));
  if (ev.crisis) {
    const t = makeTask(r, {
      type: "crisis",
      name: ev.crisis.name,
      requiredProgress: ev.crisis.dueWeeks,
      skillTarget: ev.crisis.skill,
      skillNeed: ev.crisis.need,
      skillVal: 0,
      dueWeeks: ev.crisis.dueWeeks,
      dueDays: ev.crisis.dueWeeks * 7,
      successEffects: scaleEffects(state, ev.crisis.success, severity, r),
      failureEffects: scaleEffects(state, ev.crisis.failure, severity, r),
      successBody: ev.crisis.successBody,
      failureBody: ev.crisis.failureBody,
    });
    state.tasks.push(t);
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
          sender: {
            name: extra.name,
            role: extra.title,
            organization: state.company.name,
            handle: `${handleFor(extra.name)}@${handleFor(state.company.name)}.ai`,
            avatarInitial: extra.name[0],
            avatarColor: "#57534e",
          },
          recipient: {
            name: state.founder.name || "Founder",
            organization: state.company.name,
            handle: `${handleFor(state.founder.name || "Founder")}@${handleFor(state.company.name)}.ai`,
          },
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
      read: false,
      source: "The Wire",
      category: stage.tone === "markets" ? "markets" : stage.tone === "panic" ? "regulation" : "industry",
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

  if (!r.chance(BALANCE.NEWS_FLASH_CHANCE_PER_WEEK)) return;
  const eligible = NEWS_CHAINS.filter((chain) => chain.minYear <= state.clock.date.year && !state.news.some((item) => item.chainId === chain.id));
  if (!eligible.length) return;
  const weighted = eligible.flatMap((chain) => Array.from({ length: chain.weight }, () => chain));
  const chain = r.pick(weighted);
  publish(chain, chain.stages[0]!, 0);
}

export function checkOnboarding(state: GameState): void {
  reconcileTutorial(state);
}

const TERMINAL = new Set(["bankruptcy", "board-out", "automated-ceo", "safety-crisis", "monopoly"]);

function checkEndings(state: GameState): void {
  if (state.endingId) return;
  const found = detectEnding(state);
  if (!found || !TERMINAL.has(found.id)) return;
  state.endingId = found.id;
  state.endingNote = found.note;
  setPause(state, "ended", true);
}

export function processEventDeadlines(state: GameState, r: Rng): void {
  for (const mail of state.inbox) {
    if (!mail.requiresResponse || mail.autoCharged) continue;
    if (
      mail.eventId === "acquisition-inbound" ||
      mail.from === "macrosoft" ||
      mail.choices?.some((c) => c.effects?.some((e) => e.type === "ending" && e.value === "acquisition"))
    ) {
      continue;
    }

    const isFee = isMinorFee(mail, state) || isMinorFee(mail) || Boolean(mail.autoChargeDays);
    const deadlineDays =
      mail.deadlineDays ??
      mail.autoChargeDays ??
      (isFee ? BALANCE.MINOR_FEE_AUTO_CHARGE_DAYS : BALANCE.DECISION_EVENT_DEADLINE_DAYS);
    if (mail.createdTick === undefined) {
      mail.createdTick = state.clock.tick;
    }
    const elapsed = state.clock.tick - mail.createdTick;
    if (elapsed >= deadlineDays) {
      if (isFee) {
        const payChoice =
          mail.choices?.find(
            (c) =>
              c.id === "pay" ||
              (c.label.toLowerCase().startsWith("pay") &&
                c.effects?.some((e) => e.type === "cash" && Number(e.value) < 0))
          ) ?? mail.choices?.[0];

        if (payChoice) {
          if (payChoice.effects) {
            applyEffects(state, payChoice.effects);
          }
          mail.requiresResponse = false;
          mail.choices = undefined;
          mail.autoCharged = true;

          const cashEffect = payChoice.effects?.find(
            (e) => e.type === "cash" && typeof e.value === "number"
          );
          const chargedAmount = cashEffect ? Math.abs(Number(cashEffect.value)) : 0;
          const formattedAmount = chargedAmount > 0 ? `$${chargedAmount.toLocaleString()}` : "fee";

          mail.impact = `Auto-charged ${formattedAmount} after ${deadlineDays} days without response.`;
          mail.body = `${mail.body}\n\n[Auto-Charged: ${formattedAmount} debited automatically after ${deadlineDays} days with no contest or payment.]`;

          state.news.unshift({
            id: uid(r, "news"),
            at: { ...state.clock.date },
            headline: `Auto-debit: ${mail.subject}`,
            body: `An unaddressed invoice from ${mail.from} (${formattedAmount}) reached payment terms (${deadlineDays} days) and was debited automatically.`,
            tone: "neutral",
            createdTick: state.clock.tick,
            impact: `Cash debited: -${formattedAmount}`,
            read: false,
            source: "Accounting",
            category: "ledger",
          });
        }
      } else if (mail.choices && mail.choices.length > 0) {
        const fallbackChoice =
          mail.choices.find(
            (c) =>
              c.id === "let-go" ||
              c.id === "quiet" ||
              c.id === "accept-churn" ||
              c.id === "ship-without-it" ||
              c.id === "no" ||
              c.id === "refuse" ||
              c.id === "fight"
          ) ?? mail.choices[mail.choices.length - 1]!;

        if (fallbackChoice.effects) {
          applyEffects(state, fallbackChoice.effects);
        }
        mail.requiresResponse = false;
        mail.choices = undefined;
        mail.autoCharged = true;

        mail.impact = `Decision deadline expired after ${deadlineDays} days. Default action applied: ${fallbackChoice.label}.`;
        mail.body = `${mail.body}\n\n[Decision Deadline Expired: ${deadlineDays} days passed with no response. Default action applied: ${fallbackChoice.label}.]`;

        state.news.unshift({
          id: uid(r, "news"),
          at: { ...state.clock.date },
          headline: `Decision Expired: ${mail.subject}`,
          body: `The decision window closed with no response. Default action was applied: ${fallbackChoice.label}.`,
          tone: "neutral",
          createdTick: state.clock.tick,
          impact: fallbackChoice.consequences?.join(" · ") ?? "Decision window closed.",
          read: false,
          source: mail.from,
          category: "internal",
        });
      }
    }
  }
}

export function processMinorFeeAutoCharges(state: GameState, r: Rng): void {
  processEventDeadlines(state, r);
}

export function checkDeadlineAutopause(state: GameState): boolean {
  if (!state.settings.pauseOnEvents || state.pendingMentor || state.marketBattle || state.marketResult) {
    return false;
  }

  // 1. Check inbox life-or-death decision events
  for (const mail of state.inbox) {
    if (!mail.requiresResponse || mail.autoCharged || mail.deadlinePaused) continue;
    if (!isLifeOrDeathEvent(mail, state)) continue;

    const deadlineDays =
      mail.deadlineDays ??
      mail.autoChargeDays ??
      (isMinorFee(mail, state) || isMinorFee(mail)
        ? BALANCE.MINOR_FEE_AUTO_CHARGE_DAYS
        : BALANCE.DECISION_EVENT_DEADLINE_DAYS);
    const createdTick = mail.createdTick ?? state.clock.tick;
    const elapsed = state.clock.tick - createdTick;
    const daysRemaining = deadlineDays - elapsed;

    if (daysRemaining === 1) {
      mail.deadlinePaused = true;
      if (!state.clock.prePauseSpeed) {
        state.clock.prePauseSpeed = state.clock.speed > 0 ? state.clock.speed : 1;
      }
      setPause(state, "event", true);
      state.clock.reasonPaused = `Critical event deadline tomorrow: ${mail.subject}`;
      return true;
    }
  }

  // 2. Check active crisis tasks
  for (const task of state.tasks) {
    if (task.type !== "crisis" || task.deadlinePaused) continue;
    const isResolved = (task.skillVal ?? 0) >= (task.skillNeed ?? 1);
    if (isResolved) continue;

    const daysRemaining = task.dueDays ?? ((task.dueWeeks ?? 1) * 7);
    if (daysRemaining === 1) {
      task.deadlinePaused = true;
      if (!state.clock.prePauseSpeed) {
        state.clock.prePauseSpeed = state.clock.speed > 0 ? state.clock.speed : 1;
      }
      setPause(state, "event", true);
      state.clock.reasonPaused = `Crisis deadline tomorrow: ${task.name}`;
      return true;
    }
  }

  return false;
}

export function tickDay(state: GameState): GameState {
  return produce(state, (draft) => {
    if (draft.endingId || draft.marketBattle || draft.marketResult) return;
    const r = rng(draft);
    draft.clock.date = addDays(draft.clock.date, 1);
    draft.clock.tick += 1;
    tickSocial(draft, r);
    releaseExpiredProviderOutages(draft, r);
    draft.hiring.cooldownDays = Math.max(0, draft.hiring.cooldownDays - 1);
    draft.funding.cooldownDays = Math.max(0, draft.funding.cooldownDays - 1);

    const allocation = allocateTrainingCompute(draft);
    consumeTrainingCompute(draft, allocation);
    for (const task of [...draft.tasks]) {
      const done = developTask(draft, task, allocation);
      if (task.type === "crisis") {
        task.dueDays = (task.dueDays ?? ((task.dueWeeks ?? 1) * 7)) - 1;
        task.dueWeeks = Math.max(0, Math.ceil(task.dueDays / 7));
        if (isWeekStart(draft.clock.date)) {
          task.progress += 1;
        }
      }
      if (done) finishTask(draft, task, r);
    }

    processEventDeadlines(draft, r);
    checkDeadlineAutopause(draft);

    for (const w of draft.employees) {
      updateBurnout(draft, r, w);
      growWorker(w, r);
    }

    if (isWeekStart(draft.clock.date)) {
      let rev = 0;
      let inf = 0;
      let operations = 0;
      for (const p of draft.products) {
        const provider = providerForModel(p.modelId);
        const serviceMultiplier = provider && !isProviderAvailable(draft, provider) ? 0.55 : 1;
        const h = harvestProduct(p, r, serviceMultiplier);
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
      const operatingNet = draft.company.currentMonthBreakdown.revenue -
        draft.company.currentMonthBreakdown.inference -
        draft.company.currentMonthBreakdown.productOperations -
        draft.company.currentMonthBreakdown.payroll -
        draft.company.currentMonthBreakdown.office -
        draft.company.currentMonthBreakdown.fixedCompute -
        draft.company.currentMonthBreakdown.companyOperations;
      const statementOpeningCash = draft.company.cashAtLastStatement ?? (draft.company.cash - operatingNet);
      draft.company.lastMonthlyCashChange = draft.company.cash - statementOpeningCash;
      draft.company.cashAtLastStatement = draft.company.cash;
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
        sender: {
          name: "Lead Board Director",
          role: "Board of Directors",
          organization: "Investor Syndicate",
          handle: `board@${handleFor(draft.company.name)}.ai`,
          avatarInitial: "B",
          avatarColor: "#1e3a8a",
        },
        recipient: {
          name: draft.founder.name || "Founder",
          organization: draft.company.name,
          handle: `${handleFor(draft.founder.name || "Founder")}@${handleFor(draft.company.name)}.ai`,
        },
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
    checkAchievements(draft);
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
