import type { Condition, GameState } from "./types";

function num(cond: Condition): number {
  return typeof cond.val === "number" ? cond.val : Number(cond.val);
}

function cmp(op: Condition["op"], a: number, b: number): boolean {
  switch (op) {
    case "eq":
      return a === b;
    case "gt":
      return a > b;
    case "ge":
      return a >= b;
    case "lt":
      return a < b;
    case "le":
      return a <= b;
    default:
      return false;
  }
}

export function monthlyArr(state: GameState): number {
  return state.products
    .filter((p) => p.status === "active" || p.status === "mature")
    .reduce((s, p) => s + p.weeklyRevenue * 4.33, 0);
}

export function conditionSatisfied(cond: Condition, state: GameState): boolean {
  switch (cond.type) {
    case "cash":
      return cmp(cond.op, state.company.cash, num(cond));
    case "hype":
      return cmp(cond.op, state.company.hype, num(cond));
    case "employees":
      return cmp(cond.op, state.employees.length, num(cond));
    case "productsLaunched":
      return cmp(cond.op, state.company.productsLaunched, num(cond));
    case "activeProducts":
      return cmp(cond.op, state.products.filter((p) => p.status === "active").length, num(cond));
    case "readyProducts":
      return cmp(cond.op, state.products.filter((p) => p.status === "ready").length, num(cond));
    case "tasks":
      return cmp(cond.op, state.tasks.length, num(cond));
    case "productDeveloping":
      return cond.val === state.tasks.some((t) => t.type === "product");
    case "officeLevel":
      return cmp(cond.op, state.company.officeLevel, num(cond));
    case "year":
      return cmp(cond.op, state.clock.date.year, num(cond));
    case "day":
      return cmp(cond.op, state.clock.tick, num(cond));
    case "hasBoard":
      return Boolean(state.board) === Boolean(cond.val);
    case "arr":
      return cmp(cond.op, monthlyArr(state) * 12, num(cond));
    case "automation": {
      const avg =
        Object.values(state.company.automation).reduce((s, n) => s + n, 0) /
        Math.max(1, Object.keys(state.company.automation).length);
      return cmp(cond.op, avg, num(cond));
    }
    case "hasTag":
      return state.products.some((p) => p.riskTags.includes(String(cond.val)));
    case "tech":
      return cond.op === "notHas"
        ? !state.company.technologies.includes(String(cond.val))
        : state.company.technologies.includes(String(cond.val));
    default:
      return true;
  }
}

export function allSatisfied(conds: Condition[] | undefined, state: GameState): boolean {
  if (!conds || conds.length === 0) return true;
  return conds.every((c) => conditionSatisfied(c, state));
}
