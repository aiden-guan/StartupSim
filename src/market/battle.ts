import { BALANCE } from "../config/balance";
import { competitors as competitorDefs } from "../data/competitors";
import type { GameState, HexPos, MarketBattle, MarketPiece, MarketTile, Product } from "../simulation/types";
import { launchCosts, requiredFor, setProductEconomics } from "../simulation/products";
import type { Rng } from "../simulation/rng";
import { uid } from "../simulation/rng";
import { manhattan, neighbors, posKey, samePos } from "./hex";

const ROWS = 9;
const COLS = 12;

function valid(p: HexPos): boolean {
  return p.row >= 0 && p.row < ROWS && p.col >= 0 && p.col < COLS;
}

function adjacentTiles(tiles: MarketTile[], pos: HexPos): MarketTile[] {
  const map = new Map(tiles.map((t) => [posKey(t.pos), t]));
  return neighbors(pos)
    .filter(valid)
    .map((p) => map.get(posKey(p)))
    .filter((t): t is MarketTile => Boolean(t));
}

export function tileCount(state: GameState): number {
  return Math.min(
    BALANCE.MARKET_TILE_CAP,
    BALANCE.MARKET_BASE_TILES + state.company.locations.length + 3 * Math.max(1, state.company.verticals.length),
  );
}

function randomTile(rng: Rng, first: boolean, id: string, pos: HexPos): MarketTile {
  if (first) {
    return incomeTile(rng, id, pos);
  }
  const roll = rng.next();
  if (roll < BALANCE.TILE_EMPTY) {
    return { id, pos, kind: "empty", income: 0, owner: null, captured: 0, baseCost: 0 };
  }
  if (roll < BALANCE.TILE_EMPTY + BALANCE.TILE_INFLUENCER) {
    return { id, pos, kind: "influencer", income: 0, owner: null, captured: 0, baseCost: BALANCE.BASE_CAPTURE_COST + 1 };
  }
  return incomeTile(rng, id, pos);
}

function incomeTile(rng: Rng, id: string, pos: HexPos): MarketTile {
  const roll = rng.next();
  let acc = 0;
  let income = 0;
  for (let i = 0; i < BALANCE.INCOME_DISTRIBUTION.length; i++) {
    acc += BALANCE.INCOME_DISTRIBUTION[i]!;
    if (roll <= acc) {
      income = i;
      break;
    }
  }
  const enterprise = income >= 2 && rng.chance(0.35);
  return {
    id,
    pos,
    kind: enterprise ? "enterprise" : "customer",
    income,
    owner: null,
    captured: 0,
    baseCost: BALANCE.BASE_CAPTURE_COST + income + (enterprise ? 1 : 0),
  };
}

function designCompetitorLevels(product: Product, difficulty: number): Product {
  const p: Product = {
    ...product,
    points: { ...product.points },
    levels: { deployment: 0, capability: 0, distribution: 0 },
    combo: [product.combo[0], product.combo[1]],
    riskTags: [...product.riskTags],
  };
  const scale = 0.7 + difficulty * 0.25;
  p.points.engineering *= scale;
  p.points.product *= scale;
  p.points.growth *= scale;
  const stats = ["deployment", "capability", "distribution"] as const;
  for (let i = 0; i < 18; i++) {
    const options = stats.filter((s) => {
      const cost = launchCosts(p)[s];
      return p.levels[s] < 10 && requiredFor(s).every((k) => p.points[k] >= cost);
    });
    if (!options.length) break;
    const s = options[i % options.length]!;
    const cost = launchCosts(p)[s];
    for (const k of requiredFor(s)) p.points[k] -= cost;
    p.levels[s] += 1;
  }
  return p;
}

function makePieces(rng: Rng, owner: "player" | "ai", product: Product, start: HexPos, first: boolean): MarketPiece[] {
  const qty = first && owner === "ai" ? 1 : Math.max(1, product.levels.deployment + 1);
  const hp = first && owner === "ai" ? 2 : Math.max(2, product.levels.capability + 2);
  const mv = first && owner === "ai" ? 1 : Math.max(1, product.levels.distribution + 1);
  const pieces: MarketPiece[] = [];
  for (let i = 0; i < qty; i++) {
    pieces.push({
      id: uid(rng, owner === "player" ? "pp" : "ap"),
      owner,
      pos: { ...start },
      health: hp,
      maxHealth: hp,
      moves: mv,
      movement: mv,
      done: false,
    });
  }
  return pieces;
}

export function startBattle(state: GameState, product: Product, rng: Rng): MarketBattle {
  const first = !state.company.seenMarket;
  const n = tileCount(state);
  const center: HexPos = { row: 4, col: 5 };
  const tiles: MarketTile[] = [];
  const used = new Set<string>();
  const place = (pos: HexPos) => {
    if (!valid(pos) || used.has(posKey(pos))) return false;
    used.add(posKey(pos));
    tiles.push(randomTile(rng, first, uid(rng, "tl"), pos));
    return true;
  };
  place(center);
  while (tiles.length < n) {
    const fringe = tiles.flatMap((t) => neighbors(t.pos).filter(valid));
    const candidates = fringe.filter((p) => !used.has(posKey(p)));
    if (!candidates.length) break;
    place(rng.pick(candidates));
  }

  const starts = [...tiles.map((t) => t.pos)];
  const playerStart = rng.pick(starts);
  let best = playerStart;
  let bestScore = -1;
  for (const p of starts) {
    const score = manhattan(p, playerStart);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  const comp = rng.pick(state.competitors.filter((c) => !c.disabled));
  const def = competitorDefs.find((d) => d.id === comp.id);
  const designed = designCompetitorLevels(product, first ? 0 : def?.difficulty ?? 1);
  const playerPieces = makePieces(rng, "player", product, playerStart, first);
  const aiPieces = makePieces(rng, "ai", designed, best, first);
  const occupied = new Set<string>();
  for (const piece of [...playerPieces, ...aiPieces]) {
    const available = tiles.filter(t=>!occupied.has(posKey(t.pos))).sort((a,b)=>manhattan(a.pos,piece.pos)-manhattan(b.pos,piece.pos));
    if (available[0]) piece.pos = {...available[0].pos};
    occupied.add(posKey(piece.pos));
  }
  if (first) {
    // Make the first capture and the enterprise lesson visible on every seed.
    const startTile = tiles.find(t=>samePos(t.pos,playerPieces[0]!.pos))!;
    startTile.kind = "customer"; startTile.income = 1; startTile.baseCost = 2;
    const rich = tiles.find(t=>!occupied.has(posKey(t.pos)))!;
    rich.kind = "enterprise"; rich.income = 3; rich.baseCost = 5;
  }

  product.competitorId = comp.id;
  return {
    productId: product.id,
    competitorId: comp.id,
    turnsLeft: BALANCE.MARKET_MAX_TURNS,
    totalTurns: BALANCE.MARKET_MAX_TURNS,
    tiles,
    pieces: [...playerPieces, ...aiPieces],
    current: "player",
    selectedPieceId: playerPieces[0]?.id ?? null,
    tutorialStep: first ? 0 : 99,
    firstMarket: first,
  };
}

export function pieceAt(battle: MarketBattle, pos: HexPos): MarketPiece | undefined {
  return battle.pieces.find((p) => samePos(p.pos, pos) && p.health > 0);
}

export function tileAt(battle: MarketBattle, pos: HexPos): MarketTile | undefined {
  return battle.tiles.find((t) => samePos(t.pos, pos));
}

export function validMoves(battle: MarketBattle, piece: MarketPiece): HexPos[] {
  const out: HexPos[] = [];
  const seen = new Set<string>();
  const fringe: { pos: HexPos; dist: number }[] = [{ pos: piece.pos, dist: 0 }];
  seen.add(posKey(piece.pos));
  while (fringe.length) {
    const cur = fringe.shift()!;
    if (cur.dist >= piece.moves) continue;
    for (const n of adjacentTiles(battle.tiles, cur.pos)) {
      if (seen.has(posKey(n.pos))) continue;
      seen.add(posKey(n.pos));
      const occ = pieceAt(battle, n.pos);
      if (!occ || occ.owner !== piece.owner) out.push(n.pos);
      if (!occ || occ.owner === piece.owner) fringe.push({ pos: n.pos, dist: cur.dist + 1 });
    }
  }
  return out;
}

function power(piece: MarketPiece, rng: Rng): number {
  const bonus = rng.chance(0.05) ? 1 : 0;
  return Math.max(Math.floor(piece.health / 2 + bonus), 1);
}

export function attack(battle: MarketBattle, attacker: MarketPiece, defender: MarketPiece, rng: Rng): void {
  const atk = power(attacker, rng);
  defender.health -= atk;
  if (defender.health > 0) attacker.health -= power(defender, rng);
  attacker.moves = 0;
  attacker.done = true;
  if (defender.health <= 0) {
    attacker.pos = { ...defender.pos };
    battle.pieces = battle.pieces.filter((p) => p.id !== defender.id);
  }
  if (attacker.health <= 0) {
    battle.pieces = battle.pieces.filter((p) => p.id !== attacker.id);
  }
}

export function capture(battle: MarketBattle, piece: MarketPiece): boolean {
  const tile = tileAt(battle, piece.pos);
  if (!tile || tile.kind === "empty" || tile.baseCost <= 0) return false;
  if (tile.owner === piece.owner) return false;
  if (piece.moves <= 0) return false;
  tile.captured += piece.health;
  piece.moves = 0;
  piece.done = true;
  if (tile.captured >= tile.baseCost) {
    tile.owner = piece.owner;
    tile.captured = 0;
    return true;
  }
  return false;
}

export function movePiece(battle: MarketBattle, piece: MarketPiece, dest: HexPos, rng: Rng): string {
  const legal = validMoves(battle, piece);
  if (!legal.some((p) => samePos(p, dest))) return "illegal";
  const occ = pieceAt(battle, dest);
  if (occ && occ.owner !== piece.owner) {
    if (manhattan(piece.pos, dest) === 1) {
      attack(battle, piece, occ, rng);
      return "attack";
    }
    piece.pos = nearestStep(battle, piece, dest);
    piece.moves = Math.max(0, piece.moves - 1);
    return "step";
  }
  const dist = Math.max(1, manhattan(piece.pos, dest));
  piece.pos = { ...dest };
  piece.moves = Math.max(0, piece.moves - dist);
  if (piece.moves === 0) piece.done = true;
  return "move";
}

function nearestStep(battle: MarketBattle, piece: MarketPiece, dest: HexPos): HexPos {
  const opts = adjacentTiles(battle.tiles, piece.pos).filter((t) => !pieceAt(battle, t.pos));
  if (!opts.length) return piece.pos;
  return opts.sort((a, b) => manhattan(a.pos, dest) - manhattan(b.pos, dest))[0]!.pos;
}

export function marketShare(battle: MarketBattle): { player: number; ai: number } {
  const income = battle.tiles.filter((t) => t.kind === "customer" || t.kind === "enterprise" || t.kind === "government");
  const total = income.reduce((s, t) => s + t.income + 1, 0) || 1;
  const player = income.filter((t) => t.owner === "player").reduce((s, t) => s + t.income + 1, 0);
  const ai = income.filter((t) => t.owner === "ai").reduce((s, t) => s + t.income + 1, 0);
  return { player: (player / total) * 100, ai: (ai / total) * 100 };
}

export function shouldEnd(battle: MarketBattle): string | null {
  const liveP = battle.pieces.filter((p) => p.owner === "player");
  const liveA = battle.pieces.filter((p) => p.owner === "ai");
  const capturable = battle.tiles.filter((t) => t.kind !== "empty" && t.baseCost > 0 && !t.owner);
  if (battle.turnsLeft <= 0) return "Turns exhausted. The market moves on.";
  if (!capturable.length) return "Every meaningful tile has an owner.";
  if (!liveA.length) return "The competing product left the field.";
  if (!liveP.length) return "Your product was pushed out.";
  return null;
}

export function resetTurn(battle: MarketBattle, who: "player" | "ai"): void {
  battle.current = who;
  for (const p of battle.pieces) {
    if (p.owner === who) {
      p.moves = p.movement;
      p.done = false;
    }
  }
}

export function aiTakeTurn(battle: MarketBattle, rng: Rng): void {
  const personality = battle.firstMarket ? "opportunistic" : competitorDefs.find((d) => d.id === battle.competitorId)?.personality ?? "opportunistic";
  const pieces = battle.pieces.filter((p) => p.owner === "ai" && p.health > 0);
  for (const piece of pieces) {
    if (personality === "aggressive") {
      const foes = battle.pieces.filter((p) => p.owner === "player" && p.health > 0);
      const prey = foes.sort((a, b) => manhattan(piece.pos, a.pos) - manhattan(piece.pos, b.pos))[0];
      if (prey) {
        const moves = validMoves(battle, piece);
        const step = moves.sort((a, b) => manhattan(a, prey.pos) - manhattan(b, prey.pos))[0];
        if (step && manhattan(piece.pos, prey.pos) === 1) {
          attack(battle, piece, prey, rng);
          continue;
        }
        if (step) movePiece(battle, piece, step, rng);
        if (piece.moves > 0) capture(battle, piece);
        continue;
      }
    }
    const tiles = battle.tiles.filter((t) => t.kind !== "empty" && t.owner !== "ai" && t.baseCost > 0);
    tiles.sort((a, b) => {
      const distA = manhattan(piece.pos, a.pos) + 1;
      const distB = manhattan(piece.pos, b.pos) + 1;
      let va = (a.income + 1) / distA;
      let vb = (b.income + 1) / distB;
      if (personality === "expansionist") {
        va *= 1 + a.income;
        vb *= 1 + b.income;
      }
      if (personality === "defensive") {
        const own = battle.tiles.filter((t) => t.owner === "ai");
        const near = (t: typeof a) => own.reduce((s, o) => s + 1 / (manhattan(t.pos, o.pos) + 1), 0.2);
        va *= near(a);
        vb *= near(b);
      }
      if (personality === "opportunistic") {
        va += rng.float(0, 0.4);
        vb += rng.float(0, 0.4);
      }
      return vb - va;
    });
    const target = tiles[0];
    if (!target) continue;
    const enemy = pieceAt(battle, target.pos);
    if (samePos(piece.pos, target.pos)) {
      capture(battle, piece);
      continue;
    }
    const moves = validMoves(battle, piece);
    if (!moves.length) continue;
    const step = moves.sort((a, b) => manhattan(a, target.pos) - manhattan(b, target.pos))[0]!;
    if (enemy && samePos(step, enemy.pos)) attack(battle, piece, enemy, rng);
    else movePiece(battle, piece, step, rng);
    if (samePos(piece.pos, target.pos) && piece.moves > 0) capture(battle, piece);
  }
}

export function humanDone(battle: MarketBattle): boolean {
  return battle.pieces.filter((p) => p.owner === "player").every((p) => p.moves <= 0 || p.done);
}

export function applyBattleResults(state: GameState, battle: MarketBattle, _rng: Rng): void {
  const product = state.products.find((p) => p.id === battle.productId);
  if (!product) return;
  const share = marketShare(battle);
  product.marketShare = share.player;
  const captured = battle.tiles.filter((t) => t.owner === "player" && (t.kind === "customer" || t.kind === "enterprise"));
  const influencers = battle.tiles.filter((t) => t.owner === "player" && t.kind === "influencer").length;
  product.newDiscovery = product.recipeId !== "generic" && !state.company.discoveredRecipes.includes(product.recipeId);
  const hypeBefore = state.company.hype;
  setProductEconomics(product, state, captured.map((t) => ({ income: t.income })), influencers);
  product.status = "active";
  state.company.seenMarket = true;
  state.firstLaunchTick ??= state.clock.tick;
  state.company.productsLaunched += 1;
  state.stats.productsLaunched += 1;
  if (product.recipeId !== "generic" && !state.company.discoveredRecipes.includes(product.recipeId)) {
    state.company.discoveredRecipes.push(product.recipeId);
    product.newDiscovery = true;
    state.company.hype += 8;
  }
  for (const part of product.combo) {
    state.company.expertise[part] = Math.min(11, (state.company.expertise[part] ?? 0) + 1);
  }
  const v = (state.company.versions[product.name] ?? 0) + 1;
  state.company.versions[product.name] = v;
  product.version = v;
  state.marketResult = {
    productId: product.id, share: share.player, capturedTiles: captured.length,
    tileValue: captured.reduce((sum,t)=>sum+t.income+1,0), revenue: product.weeklyRevenue,
    inference: product.weeklyInference, users: product.users, hype: state.company.hype-hypeBefore,
    outcome: shouldEnd(battle) ?? "Market closed.",
  };
  if (v > 1) product.name = `${product.name.replace(/ \d+$/, "")} ${v}`;
}
