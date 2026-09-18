import { isLifeOrDeathEvent, setPause, syncPause } from "./pause";
import type { TutorialAction } from "../data/onboarding";
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
import {
  applyAction,
  applyMarketEntryResults,
  getLegalMoves,
  shouldEndSession,
  startMarketSession,
} from "../market/marketMap";
import { OPS_COST, marketPowerFor, processRivalTurn, resolveEndTurn, resolveTacticalAction } from "../market/turns";
import type { MarketTactic } from "../market/types";
import { applyEffects, isModelAvailable } from "./effects";
import { monthlyArr } from "./conditions";
import { generateEmployee, evaluateHireOffer } from "./candidates";
import { buyLaunchStat, createProduct, refundLaunchStat, requiredProgress } from "./products";
import { Rng, uid } from "./rng";
import { applyAutoAssign } from "./staffing";
import { assign, makeTask } from "./tasks";
import type { DepartmentId, GameState, HexPos, LaunchStat } from "./types";
import { createNewGame, type NewGameInput } from "./newGame";
import { tickDay, checkOnboarding } from "./tick";
import { employeeScore, minSalaryFor } from "./workers";
import { valuationOf } from "./derived";
import { detectEnding } from "./endings";
import { applyAdvanceMentor, applyBackMentor, finishMentorStep, skipTutorial, recordTutorialEvent, currentTutorialSlide } from "./tutorial";
import { checkAchievements, isEduardoSaverin, unlockAchievement } from "./achievements";
import { handleFor } from "./social";

export type GameCommand =
  | { type: "newGame"; input: NewGameInput }
  | { type: "dilute"; workerId: string; percentage: number }
  | { type: "tickDay" }
  | { type: "tutorialEvent"; action: TutorialAction }
  | { type: "selectPrimitive"; slot: "a" | "b"; primitive: string }
  | { type: "continueMarketResults" }
  | { type: "passCandidate"; candidateId: string }
  | { type: "pauseLock"; reason: "settings"; enabled: boolean }
  | { type: "setSpeed"; speed: 0 | 1 | 2 | 4 | 8 }
  | { type: "setPaused"; paused: boolean; reason?: string | null }
  | { type: "dismissMentor" }
  | { type: "advanceMentor" }
  | { type: "backMentor" }
  | { type: "beginTutorial" }
  | { type: "skipTutorial" }
  | { type: "setSettings"; patch: Partial<GameState["settings"]> }
  | { type: "startProduct"; a: string; b: string; name?: string }
  | { type: "renameProduct"; productId: string; name: string }
  | { type: "assign"; taskId: string; workerId: string; confirm?: boolean }
  | { type: "autoAssign"; taskId?: string }
  | { type: "unassign"; workerId: string }
  | { type: "buyStat"; productId: string; stat: LaunchStat }
  | { type: "refundStat"; productId: string; stat: LaunchStat }
  | { type: "setModel"; productId: string; modelId: string }
  | { type: "setBusinessModel"; productId: string; model: GameState["products"][0]["businessModel"] }
  | { type: "setGtmStrategy"; productId: string; strategy: GameState["products"][0]["gtmStrategy"] }
  | { type: "enterMarket"; productId: string }
  | { type: "selectMarketNode"; nodeId: string | null }
  | { type: "marketAction"; nodeId: string; action?: "expand" | "reinforce" | "contest"; tactic?: MarketTactic }
  | { type: "marketExpand"; nodeId: string }
  | { type: "marketReinforce"; nodeId: string }
  | { type: "selectPiece"; pieceId: string | null }
  | { type: "marketMove"; dest: HexPos }
  | { type: "marketCapture" }
  | { type: "marketEndTurn" }
  | { type: "delegateMarket"; productId: string; strategy?: "balanced" | "aggressive" | "niche" | "expansion" }
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
  | { type: "readNews"; newsId: string }
  | { type: "readSocialDm"; dmId?: string; actorId?: string }
  | { type: "likeSocialPost"; postId: string }
  | { type: "killProduct"; productId: string }
  | { type: "retire" }
  | { type: "debug"; action: string; amount?: number; id?: string };

function rng(state: GameState): Rng {
  return new Rng(state.meta.rngState);
}

function commit(state: GameState, r: Rng): void {
  state.meta.rngState = r.seed;
}

type DelegationStrategy = "balanced" | "aggressive" | "niche" | "expansion";
type DelegatedAction = "expand" | "reinforce" | "contest";

interface DelegationProfile {
  valueWeight: number;
  resistanceWeight: number;
  actionBias: Record<DelegatedAction, number>;
  anchorBonus: number;
  contestRivalMultiplier: number;
}

const DELEGATION_PROFILES: Record<DelegationStrategy, DelegationProfile> = {
  balanced: {
    valueWeight: 2,
    resistanceWeight: 1,
    actionBias: { expand: 3, reinforce: 0.5, contest: 2 },
    anchorBonus: 6,
    contestRivalMultiplier: 0.84,
  },
  aggressive: {
    valueWeight: 1.8,
    resistanceWeight: 0.8,
    actionBias: { expand: 1.5, reinforce: 0, contest: 7 },
    anchorBonus: 8,
    contestRivalMultiplier: 0.72,
  },
  niche: {
    valueWeight: 4,
    resistanceWeight: 1.2,
    actionBias: { expand: 1.5, reinforce: -0.5, contest: 4 },
    anchorBonus: 5,
    contestRivalMultiplier: 0.8,
  },
  expansion: {
    valueWeight: 1.8,
    resistanceWeight: 1.4,
    actionBias: { expand: 6.5, reinforce: -1.5, contest: 1 },
    anchorBonus: 4,
    contestRivalMultiplier: 0.86,
  },
};

function delegationTactic(strategy: DelegationStrategy, action: DelegatedAction): MarketTactic {
  if (action === "contest" && strategy === "aggressive") return "poach";
  if (strategy === "niche" && action === "reinforce") return "fortify";
  return "pitch";
}

export function applyCommand(state: GameState | null, command: GameCommand): GameState | null {
  if (command.type === "newGame") return createNewGame(command.input);
  if (!state) return state;
  if (command.type === "tickDay") return state.clock.paused ? state : tickDay(state);

  const next = produce(state, (draft) => {
    const r = rng(draft);
    switch (command.type) {
      case "pauseLock":
        setPause(draft, command.reason, command.enabled);
        break;
      case "tutorialEvent":
        recordTutorialEvent(draft, command.action);
        break;
      case "selectPrimitive": {
        if (!draft.company.primitives.includes(command.primitive)) break;
        if (draft.pendingMentor === "intro" && command.primitive !== (command.slot === "a" ? "chat" : "writing")) break;
        if (command.slot === "a") draft.onboarding.primitiveA = command.primitive;
        else draft.onboarding.primitiveB = command.primitive;
        recordTutorialEvent(draft, command.slot === "a" ? "selectedPrimitiveA" : "selectedPrimitiveB");
        break;
      }
      case "setSpeed":
        draft.clock.speed = command.speed;
        setPause(draft, "manual", command.speed === 0);
        if (command.speed > 0) {
          if (draft.clock.pauseReasons.includes("event")) {
            draft.clock.prePauseSpeed = command.speed;
          }
          if (currentTutorialSlide(draft)?.id === "start-clock" || currentTutorialSlide(draft)?.id === "team-ready") {
            recordTutorialEvent(draft, "startedClock");
          }
        }
        break;
      case "setPaused":
        if (command.reason === "Inbox") {
          if (command.paused) {
            if (!draft.clock.prePauseSpeed) {
              draft.clock.prePauseSpeed = draft.clock.speed > 0 ? draft.clock.speed : 1;
            }
          }
          setPause(draft, "event", command.paused);
          if (!command.paused) {
            if (draft.clock.prePauseSpeed) {
              draft.clock.speed = draft.clock.prePauseSpeed;
              draft.clock.prePauseSpeed = undefined;
            }
          }
        } else {
          setPause(draft, "manual", command.paused);
          if (!command.paused) {
            if (draft.clock.prePauseSpeed) {
              draft.clock.speed = draft.clock.prePauseSpeed;
              draft.clock.prePauseSpeed = undefined;
            }
          }
        }
        break;
      case "continueMarketResults":
        if (!draft.marketResult) break;
        draft.marketResult = null;
        setPause(draft, "results", false);
        setPause(draft, "productReady", false);
        recordTutorialEvent(draft, "continuedMarketResults");
        break;
      case "dismissMentor":
        finishMentorStep(draft);
        break;
      case "advanceMentor":
        applyAdvanceMentor(draft);
        break;
      case "backMentor":
        applyBackMentor(draft);
        break;
      case "beginTutorial":
        draft.onboarding.revealDone = true;
        if (draft.onboarding.tutorialEnabled && !draft.onboarding.finished.includes("intro") && !draft.pendingMentor) {
          draft.pendingMentor = "intro";
          draft.onboarding.slideIndex = 0;
          draft.clock.paused = true;
          draft.clock.reasonPaused = "Mentor";
        }
        break;
      case "skipTutorial":
        skipTutorial(draft);
        break;
      case "setSettings":
        draft.settings = { ...draft.settings, ...command.patch };
        break;
      case "startProduct": {
        const a = primitiveById[command.a];
        const b = primitiveById[command.b];
        if (!a || !b) break;
        if (!draft.company.primitives.includes(a.id) || !draft.company.primitives.includes(b.id)) break;
        if (draft.onboarding.tutorialEnabled && !draft.company.seenMarket) {
          if (draft.products.length || command.a !== "chat" || command.b !== "writing" || currentTutorialSlide(draft)?.id !== "start-first") break;
        }
        const product = createProduct(draft, a.id, b.id, r);
        if (command.name) {
          const trimmed = command.name.trim().slice(0, BALANCE.MAX_PRODUCT_NAME_LENGTH);
          if (trimmed) product.name = trimmed;
        }
        draft.products.push(product);
        if (!draft.onboarding.firstProductId) draft.onboarding.firstProductId = product.id;
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
        if (task && worker && worker.burnoutDays <= 0) {
          if (worker.taskId && worker.taskId !== task.id && !command.confirm) break;
          assign(task, worker);
          if (task.productId === draft.onboarding.firstProductId) {
            if (worker.role === "founder") recordTutorialEvent(draft, "assignedFounder");
            if (worker.role === "cofounder") recordTutorialEvent(draft, "assignedCofounder");
          }
        }
        break;
      }
      case "autoAssign": {
        const targetTask = command.taskId ? draft.tasks.find((t) => t.id === command.taskId) : undefined;
        const result = applyAutoAssign(draft, targetTask);
        const lines = result.assigned.map((row) => row.reason);
        if (!lines.length) {
          lines.push(
            targetTask
              ? "No available employees could be assigned without moving anyone off an existing project."
              : "No projects need staffing or no teammates are currently available."
          );
        }
        draft.lastStaffing = { taskId: targetTask ? targetTask.id : null, lines, at: draft.clock.tick };
        if (draft.onboarding.firstProductId) {
          for (const row of result.assigned) {
            const task = draft.tasks.find((t) => t.id === row.taskId);
            const worker = draft.employees.find((w) => w.id === row.workerId);
            if (task?.productId === draft.onboarding.firstProductId && worker) {
              if (worker.role === "founder") recordTutorialEvent(draft, "assignedFounder");
              if (worker.role === "cofounder") recordTutorialEvent(draft, "assignedCofounder");
            }
          }
        }
        break;
      }
      case "unassign": {
        const worker = draft.employees.find((w) => w.id === command.workerId);
        if (worker) worker.taskId = null;
        break;
      }
      case "buyStat": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p?.status === "ready" && !draft.marketBattle && buyLaunchStat(p, command.stat)) recordTutorialEvent(draft, "spentLaunchPoint");
        break;
      }
      case "refundStat": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p?.status === "ready" && !draft.marketBattle) refundLaunchStat(p, command.stat);
        break;
      }
      case "setModel": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p?.status === "ready" && !draft.marketBattle && draft.ownedModels.includes(command.modelId) && isModelAvailable(draft, command.modelId)) p.modelId = command.modelId;
        break;
      }
      case "setBusinessModel": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p?.status === "ready" && !draft.marketBattle) p.businessModel = command.model;
        break;
      }
      case "setGtmStrategy": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p?.status === "ready" && !draft.marketBattle) p.gtmStrategy = command.strategy;
        break;
      }
      case "renameProduct": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (!p) break;
        const trimmed = command.name.trim().slice(0, BALANCE.MAX_PRODUCT_NAME_LENGTH);
        if (!trimmed) break;
        const oldName = p.name;
        p.name = trimmed;
        if (draft.company.versions[oldName] !== undefined) {
          draft.company.versions[trimmed] = draft.company.versions[oldName];
          delete draft.company.versions[oldName];
        }
        const task = draft.tasks.find((t) => t.productId === p.id);
        if (task) {
          task.name = `Build ${trimmed}`;
        }
        break;
      }
      case "enterMarket": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (!p || p.status !== "ready" || draft.marketBattle || draft.marketResult) break;
        if (draft.onboarding.tutorialEnabled && !draft.company.seenMarket && currentTutorialSlide(draft)?.id !== "enter-market") break;
        draft.marketBattle = startMarketSession(draft, p, r);
        setPause(draft, "productReady", false);
        setPause(draft, "market", true);
        recordTutorialEvent(draft, "enteredFirstMarket");
        break;
      }
      case "selectMarketNode": {
        if (draft.marketBattle && !draft.pendingMentor) {
          draft.marketBattle.selectedNodeId = command.nodeId;
          recordTutorialEvent(draft, "selectedMarketPiece");
        }
        break;
      }
      case "selectPiece": {
        if (draft.marketBattle && !draft.pendingMentor) {
          draft.marketBattle.selectedNodeId = command.pieceId;
          recordTutorialEvent(draft, "selectedMarketPiece");
        }
        break;
      }
      case "marketAction":
      case "marketExpand":
      case "marketReinforce": {
        const b = draft.marketBattle;
        if (!b || b.current !== "player" || draft.pendingMentor) break;
        const p = draft.products.find((x) => x.id === b.productId);
        if (!p) break;
        const targetId = command.nodeId;
        const legal = getLegalMoves(b, "player", p.levels.distribution);
        const inferred = legal.contest.includes(targetId)
          ? "contest"
          : legal.expand.includes(targetId)
            ? "expand"
            : legal.reinforce.includes(targetId)
              ? "reinforce"
              : null;
        if (!inferred) break;
        const act = command.type === "marketExpand"
          ? (legal.contest.includes(targetId) ? "contest" : "expand")
          : command.type === "marketReinforce"
            ? "reinforce"
            : (command.action === "contest" || command.action === "expand" || command.action === "reinforce" ? command.action : inferred);

        const tactic: MarketTactic = ("tactic" in command && command.tactic)
          ? command.tactic
          : (act === "contest" ? "poach" : act === "reinforce" ? "pitch" : "pitch");

        const cost = OPS_COST[tactic] ?? 1;
        if (b.playerOps < cost) {
          resolveEndTurn(draft, r);
          if (!draft.marketBattle || draft.marketBattle.turnsLeft <= 0) break;
        }

        resolveTacticalAction(draft, r, { nodeId: targetId, tactic });
        break;
      }
      case "marketMove": {
        const b = draft.marketBattle;
        if (!b || b.current !== "player" || draft.pendingMentor) break;
        recordTutorialEvent(draft, "movedMarketPiece");
        break;
      }
      case "marketCapture": {
        const b = draft.marketBattle;
        if (!b || draft.pendingMentor || b.current !== "player") break;
        const p = draft.products.find((x) => x.id === b.productId);
        if (!p) break;
        const legal = getLegalMoves(b, "player", p.levels.distribution);
        const targetId = b.selectedNodeId && (legal.expand.includes(b.selectedNodeId) || legal.reinforce.includes(b.selectedNodeId) || legal.contest.includes(b.selectedNodeId))
          ? b.selectedNodeId
          : (legal.expand[0] ?? legal.contest[0] ?? legal.reinforce[0]);
        if (targetId) {
          const act = legal.contest.includes(targetId) ? "contest" : legal.expand.includes(targetId) ? "expand" : "reinforce";
          const tactic: MarketTactic = act === "contest" ? "poach" : "pitch";
          const cost = OPS_COST[tactic] ?? 1;
          if (b.playerOps < cost) {
            resolveEndTurn(draft, r);
            if (!draft.marketBattle || draft.marketBattle.turnsLeft <= 0) break;
          }
          resolveTacticalAction(draft, r, { nodeId: targetId, tactic });
        }
        break;
      }
      case "marketEndTurn": {
        const b = draft.marketBattle;
        if (!b || draft.pendingMentor || b.current !== "player") break;
        resolveEndTurn(draft, r);
        break;
      }
      case "delegateMarket": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (!p || p.status !== "ready") break;
        if (draft.company.productsLaunched < BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE) break;
        const session = startMarketSession(draft, p, r);
        for (let t = 0; t < session.maxTurns; t++) {
          if (shouldEndSession(session)) break;
          const pMoves = getLegalMoves(session, "player", p.levels.distribution);
          const allPMoves = [
            ...pMoves.expand.map((id) => ({ action: "expand" as const, nodeId: id })),
            ...pMoves.reinforce.map((id) => ({ action: "reinforce" as const, nodeId: id })),
            ...pMoves.contest.map((id) => ({ action: "contest" as const, nodeId: id })),
          ];
          const strategy: DelegationStrategy = command.strategy ?? "balanced";
          const profile = DELEGATION_PROFILES[strategy];
          if (allPMoves.length) {
            allPMoves.sort((a, b) => {
              const na = session.nodes.find((n) => n.id === a.nodeId)!;
              const nb = session.nodes.find((n) => n.id === b.nodeId)!;
              const scoreMove = (node: typeof na, action: DelegatedAction): number => {
                let score = node.value * profile.valueWeight - node.resistance * profile.resistanceWeight;
                score += profile.actionBias[action];

                // Do not spend the whole window polishing a segment that is already secure.
                if (action === "reinforce") {
                  score -= Math.max(0, node.playerShare - 55) / 7;
                }

                // Contests are more valuable when the rival actually controls the segment.
                if (action === "contest") {
                  score += Math.min(6, node.rivalShare * 0.08);
                }

                // Keep the original beachhead alive when the rival starts closing in.
                if (action === "reinforce" && node.isPlayerBeachhead && node.playerShare < 75) {
                  score += profile.anchorBonus;
                }

                return score;
              };
              const scoreA = scoreMove(na, a.action);
              const scoreB = scoreMove(nb, b.action);
              return scoreB - scoreA;
            });
            const chosen = allPMoves[0]!;
            const node = session.nodes.find((n) => n.id === chosen.nodeId);
            const tactic = delegationTactic(strategy, chosen.action);
            if (chosen.action === "contest") {
              if (node?.rivalDominated) {
                node.rivalDominated = false;
              }
              if (node) {
                node.rivalInfluence = Math.max(1, Math.round(node.rivalInfluence * profile.contestRivalMultiplier));
              }
            }
            applyAction(
              session,
              chosen.nodeId,
              "player",
              chosen.action === "contest" ? "expand" : chosen.action,
              p.levels.capability,
              p.combo,
              marketPowerFor(draft, p, session, "player"),
              tactic,
            );
            session.playerMomentum = Math.min(
              6,
              (session.playerMomentum ?? 0) + (chosen.action === "contest" ? 2 : 1),
            );
          }
          if (shouldEndSession(session)) break;
          processRivalTurn(draft, session, r);
          session.turnsLeft -= 1;
          session.turn += 1;
        }
        applyMarketEntryResults(draft, session, r);
        setPause(draft, "productReady", false);
        setPause(draft, "market", false);
        setPause(draft, "results", true);
        break;
      }
      case "recruit": {
        if (!draft.unlocks.hiring) break;
        const ch = recruitingChannels.find((c) => c.id === command.channelId);
        if (!ch || draft.company.cash < ch.cost || draft.hiring.cooldownDays > 0) break;
        if (ch.robots && !draft.company.technologies.includes("agents")) break;
        draft.company.cash -= ch.cost;
        draft.hiring.channelId = ch.id;
        const n = r.int(2, 5);
        draft.hiring.candidates = [];
        const officeBonus = offices[draft.company.officeLevel]?.recruiting ?? 0;
        for (let i = 0; i < n; i++) {
          const emp = generateEmployee(r, ch.targetScore + officeBonus + r.int(-3, 3), ch.id === "network" ? r.chance(0.2) : false, ch.id);
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
      case "passCandidate":
        draft.hiring.candidates = draft.hiring.candidates.filter(c => c.employee.id !== command.candidateId);
        break;
      case "hire": {
        if (!Number.isFinite(command.salary) || command.salary < 0) break;
        const cand = draft.hiring.candidates.find((c) => c.employee.id === command.candidateId);
        if (!cand) break;
        const office = offices[draft.company.officeLevel];
        if (draft.employees.length >= (office?.capacity ?? 6)) break;
        const verdict = evaluateHireOffer(r, command.salary, cand.minSalary);
        draft.hiring.candidates = draft.hiring.candidates.filter((c) => c.employee.id !== cand.employee.id);
        if (!verdict.accept) {
          cand.employee.offMarketDays = 18;
          draft.hiring.lastResult = {
            candidateId: cand.employee.id,
            name: cand.employee.name,
            accepted: false,
            reason: verdict.reason,
            at: draft.clock.tick,
          };
          break;
        }
        cand.employee.salary = command.salary;
        cand.employee.equity = 0.002;
        draft.employees.push(cand.employee);
        draft.stats.employeesHired += 1;
        draft.unlocks.hiring = true;
        draft.hiring.lastResult = {
          candidateId: cand.employee.id,
          name: cand.employee.name,
          accepted: true,
          role: cand.employee.title,
          salary: command.salary,
          at: draft.clock.tick,
        };
        recordTutorialEvent(draft, "hiredEmployee");
        break;
      }
      case "fire": {
        const w = draft.employees.find((e) => e.id === command.workerId);
        if (!w || w.role === "founder" || (w.role === "cofounder" && draft.onboarding.tutorialEnabled && !draft.company.seenMarket)) break;
        draft.employees = draft.employees.filter((e) => e.id !== w.id);
        draft.stats.employeesFired += 1;
        if (draft.company.cash >= 1_000_000) {
          unlockAchievement(draft, "cold-blooded");
        }
        for (const e of draft.employees) e.happiness -= 1.2;
        draft.company.backlash += 3;
        draft.company.prestige -= 2;
        break;
      }
      case "dilute": {
        const w = draft.employees.find((e) => e.id === command.workerId);
        if (!w || w.role === "founder" || w.equity <= 0) break;
        const pct = Math.max(1, Math.min(100, Math.round(command.percentage)));
        const cut = w.equity * (pct / 100);
        w.equity = Math.max(0, w.equity - cut);

        if (w.role === "cofounder") {
          draft.company.ownership.cofounder = Math.max(0, draft.company.ownership.cofounder - cut);
        } else {
          draft.company.ownership.employees = Math.max(0, draft.company.ownership.employees - cut);
        }
        draft.company.ownership.founder += cut;
        draft.founder.equity += cut;

        draft.stats.dilutionsCount = (draft.stats.dilutionsCount ?? 0) + 1;

        const isEduardo = isEduardoSaverin(w);
        const isCofounder = w.role === "cofounder";

        // Individual worker consequences:
        w.happiness = Math.max(0.5, w.happiness - (pct >= 50 ? 5.5 : 3.5));
        w.loyalty = Math.max(0.5, w.loyalty - (pct >= 50 ? 6.5 : 4.0));
        w.burnoutRisk = Math.min(1, w.burnoutRisk + (pct >= 50 ? 0.45 : 0.25));
        if (pct >= 50) {
          w.burnoutDays = Math.max(w.burnoutDays, 10);
        }

        // Company-wide internal turmoil consequences:
        const teamMoraleHit = isCofounder ? (pct >= 50 ? 2.8 : 1.8) : (pct >= 50 ? 1.4 : 0.8);
        for (const e of draft.employees) {
          if (e.id !== w.id && e.role !== "founder") {
            e.happiness = Math.max(0.5, e.happiness - teamMoraleHit);
            e.loyalty = Math.max(0.5, e.loyalty - teamMoraleHit * 0.7);
          }
        }

        const trustLoss = isCofounder ? (pct >= 50 ? 18 : 12) : (pct >= 50 ? 10 : 6);
        const backlashGain = isCofounder ? (pct >= 50 ? 16 : 10) : (pct >= 50 ? 8 : 4);
        draft.company.trust = Math.max(0, draft.company.trust - trustLoss);
        draft.company.culture.trust = Math.max(0, draft.company.culture.trust - trustLoss);
        draft.company.backlash += backlashGain;
        draft.company.prestige = Math.max(0, draft.company.prestige - (isCofounder ? 5 : 2));
        draft.company.culture.intensity = Math.min(100, draft.company.culture.intensity + (isCofounder ? 10 : 5));

        // Breaking News item
        draft.news.unshift({
          id: uid(r, "news"),
          at: { ...draft.clock.date },
          headline: isEduardo
            ? "Boardroom coup: Eduardo Saverin diluted in hostile restructuring"
            : isCofounder
              ? `Founding rupture: Co-founder ${w.name} diluted in internal shakeup`
              : `Equity clawback: ${draft.company.name} restructures employee pool`,
          body: isEduardo
            ? "Internal documents reveal founder forces drastic dilution of co-founder Eduardo Saverin's stake. Heated legal battle expected as Saverin retains counsel."
            : isCofounder
              ? `Co-founder ${w.name}'s equity stake was reduced by ${pct}%. Internal morale plunges as whispers of boardroom betrayal circulate.`
              : `Employee equity grant for ${w.name} was reduced by ${pct}%. Team members voice concern over corporate loyalty.`,
          tone: "panic",
          createdTick: draft.clock.tick,
          impact: `Internal turmoil: -${teamMoraleHit.toFixed(1)} team morale, -${trustLoss} company trust, +${backlashGain} backlash.`,
          read: false,
          source: "Silicon Insider",
          category: "corporate",
        });

        // Crisis Mail
        draft.inbox.unshift({
          id: uid(r, "mail"),
          at: { ...draft.clock.date },
          from: isEduardo ? "esaverin@saverincounsel.com" : `${handleFor(w.name)}@${handleFor(draft.company.name)}.ai`,
          sender: {
            name: isEduardo ? "Eduardo Saverin" : w.name,
            role: isEduardo ? "Co-founder (Contested)" : w.title,
            organization: isEduardo ? "Saverin Legal Counsel" : draft.company.name,
            handle: isEduardo ? "esaverin@saverincounsel.com" : `${handleFor(w.name)}@${handleFor(draft.company.name)}.ai`,
            avatarInitial: w.name[0] ?? "E",
            avatarColor: "#b33939",
          },
          recipient: {
            name: draft.founder.name,
            organization: draft.company.name,
            handle: `${handleFor(draft.founder.name)}@${handleFor(draft.company.name)}.ai`,
          },
          subject: isEduardo
            ? "LEGAL NOTICE: Fraudulent share issuance & fiduciary breach"
            : isCofounder
              ? "Formal objection: Unilateral equity dilution"
              : "Grievance: Equity reduction notice",
          body: isEduardo
            ? "You set up corporate restructurings and issued newly minted shares specifically to dilute my stake down while leaving everyone else intact. You think you can just push me out of the company I funded? I've retained legal counsel. You better lawyer up."
            : isCofounder
              ? `I poured everything into building this company with you. Slashing my founding equity by ${pct}% behind closed doors is an unforgivable betrayal. The rest of the team already knows what you did.`
              : `I received the notice regarding my equity grant being reduced by ${pct}%. Slashing agreed employee equity creates serious trust issues across the entire engineering floor.`,
          read: false,
          requiresResponse: false,
          eventKind: "crisis",
          impact: `Company trust -${trustLoss}, Backlash +${backlashGain}, Team happiness -${teamMoraleHit.toFixed(1)}`,
        });

        // Check achievements
        if (isEduardo) {
          unlockAchievement(draft, "the-social-network");
        }
        unlockAchievement(draft, "founder-mode");
        if (draft.company.cash >= 1_000_000) {
          unlockAchievement(draft, "cold-blooded");
        }
        if ((draft.stats.dilutionsCount ?? 0) >= 3) {
          unlockAchievement(draft, "ruthless-operator");
        }
        break;
      }
      case "startResearch": {
        const tech = techById[command.techId];
        if (!tech || !draft.unlocks.research || draft.company.technologies.includes(tech.id) || draft.tasks.some(t => t.techId === tech.id)) break;
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
        if (!proj || draft.company.cash < proj.cost || draft.company.specialProjects.includes(proj.id) || draft.tasks.some(t=>t.projectId===proj.id)) break;
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
        if (!lobby || draft.company.cash < lobby.cost || draft.company.lobbies.includes(lobby.id) || draft.tasks.some(t=>t.lobbyId===lobby.id)) break;
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
            dilution: cash / (valuation + cash),
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
        const inv = draft.company.ownership.investors * (1 - offer.dilution) + offer.dilution;
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
        unlockAchievement(draft, "term-sheet");
        break;
      }
      case "rentGpus":
        if (Number.isFinite(command.count)) draft.compute.rentedGpus = Math.min(10000, Math.max(0, Math.floor(command.count)));
        break;
      case "buyCluster":
        if (draft.company.cash < 400_000) break;
        draft.company.cash -= 400_000;
        draft.compute.ownedCluster += 4;
        unlockAchievement(draft, "sovereign-compute");
        break;
      case "setCompanyModel":
        if (isModelAvailable(draft, command.modelId) && (draft.ownedModels.includes(command.modelId) || models.some((m) => m.id === command.modelId && m.provider !== "You"))) {
          draft.currentModelId = command.modelId;
          if (!draft.ownedModels.includes(command.modelId)) draft.ownedModels.push(command.modelId);
        }
        break;
      case "setAutomation":
        if (!Number.isFinite(command.percent)) break;
        const prior = draft.company.automation[command.department];
        const nextPercent = Math.max(0, Math.min(100, command.percent));
        draft.company.automation[command.department] = nextPercent;
        for (const w of draft.employees) if (w.role !== "founder") w.happiness = Math.max(0, w.happiness - Math.max(0, nextPercent - prior) * 0.01 * BALANCE.AUTOMATION_MORALE_HIT);
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
        unlockAchievement(draft, "synthetic-workforce");
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

        const hasRemainingCritical = draft.inbox.some((m) => m.requiresResponse && isLifeOrDeathEvent(m, draft));
        if (!hasRemainingCritical && !draft.endingId) {
          setPause(draft, "event", false);
          setPause(draft, "manual", false);
          if (draft.clock.prePauseSpeed) {
            draft.clock.speed = draft.clock.prePauseSpeed;
            draft.clock.prePauseSpeed = undefined;
          } else if (draft.clock.speed === 0) {
            draft.clock.speed = 1;
          }
          syncPause(draft);
        }
        break;
      }
      case "readMail": {
        const mail = draft.inbox.find((m) => m.id === command.mailId);
        if (mail) mail.read = true;
        break;
      }
      case "readNews": {
        const item = draft.news.find((n) => n.id === command.newsId);
        if (item) item.read = true;
        break;
      }
      case "readSocialDm": {
        if (!draft.social?.dms) break;
        for (const dm of draft.social.dms) {
          if ((command.dmId && dm.id === command.dmId) || (command.actorId && dm.actorId === command.actorId)) {
            dm.read = true;
          }
        }
        break;
      }
      case "likeSocialPost": {
        if (!draft.social?.posts) break;
        const post = draft.social.posts.find((p) => p.id === command.postId);
        if (post) {
          post.likes = (post.likes ?? 0) + 1;
        }
        break;
      }
      case "killProduct": {
        const p = draft.products.find((x) => x.id === command.productId);
        if (p) p.status = "deprecated";
        const hasOtherReady = draft.products.some((other) => other.status === "ready");
        if (!hasOtherReady) setPause(draft, "productReady", false);
        break;
      }
      case "retire": {
        const ending = detectEnding(draft) ?? {
          id: "quiet-profit",
          note: "You closed the books before the industry closed them for you.",
        };
        draft.endingId = ending.id;
        draft.endingNote = ending.note;
        setPause(draft,"ended",true);
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
        if (command.action === "burnout") {
          for (const employee of draft.employees) {
            if (employee.role === "ai") continue;
            employee.burnoutDays = command.amount ?? 10;
          }
        }
        if (command.action === "completeProduct") {
          const task = draft.tasks.find((t) => t.type === "product");
          if (task) task.progress = task.requiredProgress;
        }
        if (command.action === "perk") {
          const id = command.id ?? "coffee";
          const existing = draft.company.perks.find((p) => p.id === id);
          if (existing) existing.level = Math.min(existing.level + 1, 2);
          else draft.company.perks.push({ id, level: 0 });
        }
        if (command.action === "skipTutorial") skipTutorial(draft);
        if (command.action === "jumpOnboard") {
          const id = command.id ?? onboardingSteps[command.amount ?? 0] ?? "intro";
          draft.onboarding.tutorialEnabled = true;
          draft.pendingMentor = id;
          draft.onboarding.slideIndex = 0;
          draft.clock.paused = true;
          draft.clock.reasonPaused = "Mentor";
        }
        break;
      }
      default:
        break;
    }
    if (command.type === "startProduct" && draft.products.length > state.products.length) recordTutorialEvent(draft, "startedFirstProduct");
    if (command.type === "recruit" && draft.hiring.candidates.length) recordTutorialEvent(draft, "recruitedCandidates");
    if (command.type === "startResearch" && draft.tasks.length > state.tasks.length) recordTutorialEvent(draft, "startedResearch");
    checkOnboarding(draft);
    checkAchievements(draft);
    commit(draft, r);
  });
  return next;
}

const onboardingSteps = ["intro", "assign", "clock", "designer", "market", "hire", "research", "compute", "funding"];

export function legalMarketNodes(state: GameState): { expand: string[]; reinforce: string[]; contest: string[] } {
  const b = state.marketBattle;
  if (!b) return { expand: [], reinforce: [], contest: [] };
  const p = state.products.find((x) => x.id === b.productId);
  return getLegalMoves(b, "player", p?.levels.distribution ?? 0);
}

export function legalMarketMoves(_state: GameState): HexPos[] {
  return [];
}

export { employeeScore };
