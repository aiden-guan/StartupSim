import { produce } from "immer";
import { BALANCE } from "../config/balance";
import { recruitingChannels } from "../data/recruiting";
import { offices } from "../data/offices";
import { perks } from "../data/perks";
import { promos } from "../data/promos";
import { specialProjects } from "../data/specialProjects";
import { technologies, techById } from "../data/technologies";
import { lobbies } from "../data/lobbies";
import { locations } from "../data/locations";
import { verticals } from "../data/verticals";
import { models } from "../data/models";
import { primitiveById } from "../data/primitives";
import { aiTakeTurn, applyBattleResults, capture, movePiece, resetTurn, shouldEnd, startBattle, validMoves } from "../market/battle";
import { applyEffects } from "./effects";
import { monthlyArr } from "./conditions";
import { generateEmployee } from "./names";
import { buyLaunchStat, createProduct, refundLaunchStat, requiredProgress } from "./products";
import { Rng } from "./rng";
import { assign, makeTask } from "./tasks";
import type { DepartmentId, GameState, HexPos, LaunchStat } from "./types";
import { createNewGame, type NewGameInput } from "./newGame";
import { tickDay } from "./tick";
import { employeeScore, minSalaryFor } from "./workers";
import { valuationOf } from "./derived";
import { detectEnding } from "./endings";

export type GameCommand =
  | { type: "newGame"; input: NewGameInput }
  | { type: "tickDay" }
  | { type: "setSpeed"; speed: 0 | 1 | 2 | 4 | 8 }
  | { type: "setPaused"; paused: boolean; reason?: string | null }
  | { type: "dismissMentor" }
  | { type: "startProduct"; a: string; b: string }
  | { type: "assign"; taskId: string; workerId: string }
  | { type: "unassign"; workerId: string }
  | { type: "buyStat"; productId: string; stat: LaunchStat }
  | { type: "refundStat"; productId: string; stat: LaunchStat }
  | { type: "setModel"; productId: string; modelId: string }
  | { type: "setBusinessModel"; productId: string; model: GameState["products"][0]["businessModel"] }
  | { type: "enterMarket"; productId: string }
  | { type: "selectPiece"; pieceId: string | null }
  | { type: "marketMove"; dest: HexPos }
  | { type: "marketCapture" }
  | { type: "marketEndTurn" }
  | { type: "delegateMarket"; productId: string }
  | { type: "recruit"; channelId: string }
  | { type: "hire"; candidateId: string; salary: number }
  | { type: "fire"; workerId: string }
  | { type: "startResearch"; techId: string }
  | { type: "startPromo"; promoId: string }
  | { type: "startProject"; projectId: string }
  | { type: "startLobby"; lobbyId: string }
  | { type: "buyPerk"; perkId: string }
  | { type: "upgradeOffice" }
  | { type: "buyLocation"; locationId: string }
  | { type: "buyVertical"; verticalId: string }
  | { type: "generateFunding" }
  | { type: "acceptOffer"; offerId: string }
  | { type: "rentGpus"; count: number }
  | { type: "buyCluster" }
  | { type: "setCompanyModel"; modelId: string }
  | { type: "setAutomation"; department: DepartmentId; percent: number }
  | { type: "deployAiWorker"; kind: "engineering" | "support" | "sales" | "research" }
  | { type: "acquire"; competitorId: string }
  | { type: "mailChoice"; mailId: string; choiceId: string }
  | { type: "readMail"; mailId: string }
  | { type: "killProduct"; productId: string }
  | { type: "retire" }
  | { type: "debug"; action: string; amount?: number };

function rng(state: GameState): Rng {
  return new Rng(state.meta.rngState);
}

function commit(state: GameState, r: Rng): void {
  state.meta.rngState = r.seed;
}

export function applyCommand(state: GameState | null, command: GameCommand): GameState | null {
  if (command.type === "newGame") return createNewGame(command.input);
  if (!state) return state;
  if (command.type === "tickDay") return tickDay(state);

  return produce(state, (draft) => {
    const r = rng(draft);
    switch (command.type) {
      case "setSpeed":
        draft.clock.speed = command.speed;
        if (command.speed > 0) {
          draft.clock.paused = false;
          draft.clock.reasonPaused = null;
        } else {
          draft.clock.paused = true;
          draft.clock.reasonPaused = draft.clock.reasonPaused ?? "Paused";
        }
        break;
      case "setPaused":
        draft.clock.paused = command.paused;
        draft.clock.reasonPaused = command.reason ?? null;
        break;
      case "dismissMentor":
        if (draft.pendingMentor) {
          draft.onboarding.finished.push(draft.pendingMentor);
          draft.pendingMentor = null;
          draft.clock.paused = false;
          draft.clock.reasonPaused = null;
        }
        break;
      case "startProduct": {
        const a = primitiveById[command.a];
        const b = primitiveById[command.b];
        if (!a || !b) break;
        if (!draft.company.primitives.includes(a.id) || !draft.company.primitives.includes(b.id)) break;
        const product = createProduct(draft, a.id, b.id, r);
        draft.products.push(product);
        draft.tasks.push(
          makeTask(r, {
            type: "product",
            name: `Build ${product.name}`,
            requiredProgress: requiredProgress(product.difficulty, draft.company.productsLaunched === 0),
            productId: product.id,
          }),
        );
        break;
      }
      case "assign": {
        const task = draft.tasks.find((t) => t.id === command.taskId);
        const worker = draft.employees.find((w) => w.id === command.workerId);
        if (task && worker && worker.burnoutDays <= 0) assign(task, worker);
        break;
      }
      case "unassign": {
        const worker = draft.employees.find((w) => w.id === command.workerId);
        if (worker) worker.taskId = null;
        break;
      }
      case "buyStat": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p) buyLaunchStat(p, command.stat);
        break;
      }
      case "refundStat": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p) refundLaunchStat(p, command.stat);
        break;
      }
      case "setModel": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p && draft.ownedModels.includes(command.modelId)) p.modelId = command.modelId;
        break;
      }
      case "setBusinessModel": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p) p.businessModel = command.model;
        break;
      }
      case "enterMarket": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (!p || p.status !== "ready") break;
        draft.marketBattle = startBattle(draft, p, r);
        draft.clock.paused = true;
        draft.clock.reasonPaused = "Market";
        break;
      }
      case "selectPiece":
        if (draft.marketBattle) draft.marketBattle.selectedPieceId = command.pieceId;
        break;
      case "marketMove": {
        const b = draft.marketBattle;
        if (!b || b.current !== "player") break;
        const piece = b.pieces.find((p) => p.id === b.selectedPieceId);
        if (!piece) break;
        movePiece(b, piece, command.dest, r);
        break;
      }
      case "marketCapture": {
        const b = draft.marketBattle;
        if (!b) break;
        const piece = b.pieces.find((p) => p.id === b.selectedPieceId);
        if (piece) capture(b, piece);
        break;
      }
      case "marketEndTurn": {
        const b = draft.marketBattle;
        if (!b) break;
        const finish = () => {
          if (!shouldEnd(b)) return false;
          applyBattleResults(draft, b, r);
          draft.marketBattle = null;
          draft.clock.paused = false;
          draft.clock.reasonPaused = null;
          return true;
        };
        if (finish()) break;
        b.turnsLeft -= 1;
        resetTurn(b, "ai");
        aiTakeTurn(b, r);
        if (finish()) break;
        resetTurn(b, "player");
        break;
      }
      case "delegateMarket": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (!p || p.status !== "ready") break;
        if (draft.company.productsLaunched < BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE) break;
        const share = r.float(18, 55);
        p.marketShare = share;
        p.status = "active";
        p.weeklyRevenue = 4000 * (p.difficulty / 2) * (share / 30);
        p.weeklyInference = p.weeklyRevenue * 0.35;
        p.users = 2000 * (share / 20);
        draft.company.productsLaunched += 1;
        draft.stats.productsLaunched += 1;
        break;
      }
      case "recruit": {
        const ch = recruitingChannels.find((c) => c.id === command.channelId);
        if (!ch || draft.company.cash < ch.cost || draft.hiring.cooldownDays > 0) break;
        if (ch.robots && !draft.company.technologies.includes("agents")) break;
        draft.company.cash -= ch.cost;
        draft.hiring.channelId = ch.id;
        const n = r.int(2, 5);
        draft.hiring.candidates = [];
        for (let i = 0; i < n; i++) {
          const emp = generateEmployee(r, ch.targetScore + r.int(-4, 4), ch.id === "network" ? r.chance(0.2) : false);
          if (ch.robots) {
            emp.role = "robot";
            emp.name = `PROletariat ${r.int(100, 999)}`;
            emp.traits = ["tireless"];
          }
          draft.hiring.candidates.push({
            employee: emp,
            minSalary: minSalaryFor(emp, draft),
            personality: r.pick(["builder", "climber", "mission", "mercenary"]),
          });
        }
        draft.hiring.cooldownDays = 10;
        break;
      }
      case "hire": {
        const cand = draft.hiring.candidates.find((c) => c.employee.id === command.candidateId);
        if (!cand) break;
        const office = offices[draft.company.officeLevel];
        if (draft.employees.length >= (office?.capacity ?? 6)) break;
        const accept = command.salary >= cand.minSalary || r.next() < 1 - (cand.minSalary - command.salary) / cand.minSalary;
        if (!accept) {
          cand.employee.offMarketDays = 18;
          draft.hiring.candidates = draft.hiring.candidates.filter((c) => c.employee.id !== cand.employee.id);
          break;
        }
        cand.employee.salary = command.salary;
        cand.employee.equity = 0.002;
        draft.employees.push(cand.employee);
        draft.hiring.candidates = [];
        draft.stats.employeesHired += 1;
        draft.unlocks.hiring = true;
        break;
      }
      case "fire": {
        const w = draft.employees.find((e) => e.id === command.workerId);
        if (!w || w.role === "founder") break;
        draft.employees = draft.employees.filter((e) => e.id !== w.id);
        draft.stats.employeesFired += 1;
        for (const e of draft.employees) e.happiness -= 1.2;
        draft.company.backlash += 3;
        draft.company.prestige -= 2;
        break;
      }
      case "startResearch": {
        const tech = techById[command.techId];
        if (!tech) break;
        if (tech.requires.some((id) => !draft.company.technologies.includes(id))) break;
        if (tech.requiredVertical && !draft.company.verticals.includes(tech.requiredVertical)) break;
        if (draft.company.cash < tech.cost) break;
        draft.company.cash -= tech.cost;
        draft.tasks.push(
          makeTask(r, {
            type: "research",
            name: tech.name,
            requiredProgress: tech.requiredProgress,
            techId: tech.id,
          }),
        );
        break;
      }
      case "startPromo": {
        const promo = promos.find((p) => p.id === command.promoId);
        if (!promo || draft.company.cash < promo.cost) break;
        draft.company.cash -= promo.cost;
        draft.tasks.push(
          makeTask(r, {
            type: "promo",
            name: promo.name,
            requiredProgress: promo.requiredProgress,
            promoId: promo.id,
            skillVal: 0,
          }),
        );
        break;
      }
      case "startProject": {
        const proj = specialProjects.find((p) => p.id === command.projectId);
        if (!proj || draft.company.cash < proj.cost) break;
        if (proj.requiresTechs.some((t) => !draft.company.technologies.includes(t))) break;
        draft.company.cash -= proj.cost;
        draft.tasks.push(
          makeTask(r, {
            type: "special",
            name: proj.name,
            requiredProgress: (proj.required.research + proj.required.engineering + proj.required.product) / 3,
            projectId: proj.id,
          }),
        );
        break;
      }
      case "startLobby": {
        const lobby = lobbies.find((p) => p.id === command.lobbyId);
        if (!lobby || draft.company.cash < lobby.cost) break;
        draft.company.cash -= lobby.cost;
        draft.tasks.push(
          makeTask(r, {
            type: "lobby",
            name: lobby.name,
            requiredProgress: lobby.requiredProgress,
            lobbyId: lobby.id,
          }),
        );
        break;
      }
      case "buyPerk": {
        const def = perks.find((p) => p.id === command.perkId);
        if (!def) break;
        const owned = draft.company.perks.find((p) => p.id === def.id);
        const nextLevel = owned ? owned.level + 1 : 0;
        const up = def.upgrades[nextLevel];
        if (!up || draft.company.officeLevel < up.requiredOffice || draft.company.cash < up.cost) break;
        draft.company.cash -= up.cost;
        if (owned) owned.level = nextLevel;
        else draft.company.perks.push({ id: def.id, level: 0 });
        for (const w of draft.employees) w.happiness += up.happiness * 0.15;
        break;
      }
      case "upgradeOffice": {
        const next = offices[draft.company.officeLevel + 1];
        if (!next || draft.company.cash < next.cost) break;
        draft.company.cash -= next.cost;
        draft.company.officeLevel = next.level;
        draft.company.hype += 6;
        draft.company.prestige += 5;
        break;
      }
      case "buyLocation": {
        const loc = locations.find((l) => l.id === command.locationId);
        if (!loc || draft.company.locations.includes(loc.id) || draft.company.cash < loc.cost) break;
        draft.company.cash -= loc.cost;
        draft.company.locations.push(loc.id);
        applyEffects(draft, loc.effects);
        break;
      }
      case "buyVertical": {
        const v = verticals.find((x) => x.id === command.verticalId);
        if (!v || draft.company.verticals.includes(v.id) || draft.company.cash < v.cost) break;
        draft.company.cash -= v.cost;
        draft.company.verticals.push(v.id);
        for (const p of v.primitives) if (!draft.company.primitives.includes(p)) draft.company.primitives.push(p);
        break;
      }
      case "generateFunding": {
        if (draft.funding.cooldownDays > 0) break;
        const arr = monthlyArr(draft);
        const val = valuationOf(draft);
        const rounds = ["pre-seed", "seed", "a", "b", "c", "growth", "mega"];
        const idx = Math.min(rounds.length - 1, (draft.funding.lastRound ? rounds.indexOf(draft.funding.lastRound) + 1 : 0));
        const round = rounds[idx]!;
        const archetypes = [
          { id: "top", name: "Apex Horizon", notes: "Top-tier. They will want a chart." },
          { id: "growth", name: "Northline Growth", notes: "Growth at any reasonable temperature." },
          { id: "strategic", name: "Macrosoft Ventures", notes: "Distribution, with strings." },
          { id: "defense", name: "Redoubt Capital", notes: "They like dual-use more than they like press." },
          { id: "mission", name: "Signal Fund", notes: "They will ask about safety and then about growth." },
        ];
        draft.funding.offers = r.pickN(archetypes, 3).map((a, i) => {
          const cash = Math.round((80_000 * (idx + 1) ** 2 + arr * (0.4 + i * 0.1)) / 1000) * 1000;
          const valuation = Math.max(val, cash * 4);
          return {
            id: `${round}-${a.id}`,
            round,
            investor: a.name,
            archetype: a.id,
            cash,
            valuation,
            dilution: Math.min(0.28, 0.18 - idx * 0.01 + i * 0.02),
            boardPressure: 8 + idx * 4,
            notes: a.notes,
          };
        });
        break;
      }
      case "acceptOffer": {
        const offer = draft.funding.offers.find((o) => o.id === command.offerId);
        if (!offer) break;
        draft.company.cash += offer.cash;
        draft.funding.raisedTotal += offer.cash;
        draft.funding.lastRound = offer.round;
        draft.funding.offers = [];
        draft.funding.cooldownDays = 80;
        const inv = Math.min(0.7, draft.company.ownership.investors + offer.dilution);
        const scale = (1 - offer.dilution);
        draft.company.ownership.founder *= scale;
        draft.company.ownership.cofounder *= scale;
        draft.company.ownership.employees *= scale;
        draft.company.ownership.investors = inv;
        draft.company.valuation = offer.valuation;
        draft.board = {
          approval: BALANCE.BOARD_START_APPROVAL,
          arrTarget: Math.max(monthlyArr(draft) * 1.4, 20_000),
          members: [offer.investor],
          lastReviewMonth: draft.clock.date.month,
          graceMonths: BALANCE.BOARD_GRACE_MONTHS,
          pressure: offer.archetype === "mission" ? "safety" : offer.archetype === "defense" ? "research" : "growth",
        };
        draft.company.hype += 10;
        break;
      }
      case "rentGpus":
        draft.compute.rentedGpus = Math.max(0, command.count);
        break;
      case "buyCluster":
        if (draft.company.cash < 400_000) break;
        draft.company.cash -= 400_000;
        draft.compute.ownedCluster += 4;
        break;
      case "setCompanyModel":
        if (draft.ownedModels.includes(command.modelId) || models.some((m) => m.id === command.modelId && m.provider !== "You")) {
          draft.currentModelId = command.modelId;
          if (!draft.ownedModels.includes(command.modelId)) draft.ownedModels.push(command.modelId);
        }
        break;
      case "setAutomation":
        draft.company.automation[command.department] = Math.max(0, Math.min(100, command.percent));
        for (const w of draft.employees) if (w.role !== "founder") w.happiness -= command.percent * 0.01 * BALANCE.AUTOMATION_MORALE_HIT;
        draft.world.automation += 0.2;
        draft.world.economicDisruption += 0.1;
        break;
      case "deployAiWorker": {
        if (!draft.company.technologies.includes("agents")) break;
        const bot = generateEmployee(r, 18, true);
        bot.role = "ai";
        bot.name = `${command.kind} agent ${r.int(10, 99)}`;
        bot.title = "Digital Worker";
        bot.salary = 0;
        bot.traits = ["tireless"];
        bot.department = command.kind === "sales" ? "sales" : command.kind;
        draft.employees.push(bot);
        draft.stats.aiWorkersDeployed += 1;
        draft.compute.monthlyCloudBill += 1_200;
        break;
      }
      case "acquire": {
        const c = draft.competitors.find((x) => x.id === command.competitorId);
        if (!c || c.disabled) break;
        const price = Math.max(2_000_000, c.funding * 0.4);
        if (draft.company.cash < price) break;
        draft.company.cash -= price;
        c.disabled = true;
        draft.company.acquisitions.push(c.id);
        draft.stats.acquisitions += 1;
        draft.company.cash += c.cash * 0.05;
        break;
      }
      case "mailChoice": {
        const mail = draft.inbox.find((m) => m.id === command.mailId);
        const choice = mail?.choices?.find((c) => c.id === command.choiceId);
        if (!mail || !choice) break;
        applyEffects(draft, choice.effects);
        mail.requiresResponse = false;
        mail.read = true;
        mail.choices = undefined;
        break;
      }
      case "readMail": {
        const mail = draft.inbox.find((m) => m.id === command.mailId);
        if (mail) mail.read = true;
        break;
      }
      case "killProduct": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p) p.status = "deprecated";
        break;
      }
      case "retire": {
        const ending = detectEnding(draft) ?? {
          id: "quiet-profit",
          note: "You closed the books before the industry closed them for you.",
        };
        draft.endingId = ending.id;
        draft.endingNote = ending.note;
        draft.clock.paused = true;
        draft.clock.reasonPaused = "Closed";
        break;
      }
      case "debug": {
        if (command.action === "cash") draft.company.cash += command.amount ?? 1_000_000;
        if (command.action === "hype") draft.company.hype += command.amount ?? 20;
        if (command.action === "time") {
          let next: GameState = draft as GameState;
          for (let i = 0; i < (command.amount ?? 7); i++) next = tickDay(next);
          Object.keys(next).forEach((k) => {
            (draft as unknown as Record<string, unknown>)[k] = (next as unknown as Record<string, unknown>)[k];
          });
        }
        if (command.action === "tech") {
          for (const t of technologies) {
            if (!draft.company.technologies.includes(t.id)) draft.company.technologies.push(t.id);
            for (const p of t.unlockPrimitives ?? []) if (!draft.company.primitives.includes(p)) draft.company.primitives.push(p);
          }
        }
        if (command.action === "office") draft.company.officeLevel = Math.min(5, draft.company.officeLevel + 1);
        if (command.action === "hire") {
          const e = generateEmployee(r, 22);
          e.salary = 140_000;
          draft.employees.push(e);
        }
        break;
      }
      default:
        break;
    }
    commit(draft, r);
  });
}

export function legalMarketMoves(state: GameState): HexPos[] {
  const b = state.marketBattle;
  if (!b?.selectedPieceId) return [];
  const piece = b.pieces.find((p) => p.id === b.selectedPieceId);
  if (!piece) return [];
  return validMoves(b, piece);
}

export { employeeScore };
