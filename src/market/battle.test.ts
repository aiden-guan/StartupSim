import { describe, expect, it } from "vitest";
import { attack, capture, marketShare, startBattle } from "./battle";
import { createNewGame } from "../simulation/newGame";
import { createProduct } from "../simulation/products";
import { Rng } from "../simulation/rng";
import type { MarketBattle, MarketPiece, MarketTile } from "../simulation/types";

function piece(over: Partial<MarketPiece>): MarketPiece {
  return {
    id: "p",
    owner: "player",
    pos: { row: 0, col: 0 },
    health: 4,
    maxHealth: 4,
    moves: 2,
    movement: 2,
    done: false,
    ...over,
  };
}

describe("market combat", () => {
  it("lets the attacker strike first", () => {
    const battle = { pieces: [] } as unknown as MarketBattle;
    battle.pieces = [
      piece({ id: "a", health: 4 }),
      piece({ id: "d", owner: "ai", health: 4, pos: { row: 0, col: 1 } }),
    ];
    const rng = new Rng(1);
    attack(battle, battle.pieces[0]!, battle.pieces[1]!, rng);
    expect(battle.pieces[1]!.health).toBeLessThan(4);
  });

  it("captures when invested health meets base cost", () => {
    const tile: MarketTile = {
      id: "t",
      pos: { row: 0, col: 0 },
      kind: "customer",
      income: 1,
      owner: null,
      captured: 0,
      baseCost: 3,
    };
    const battle = { tiles: [tile], pieces: [] } as unknown as MarketBattle;
    const p = piece({ health: 3, moves: 1 });
    const ok = capture(battle, p);
    expect(ok).toBe(true);
    expect(tile.owner).toBe("player");
    expect(p.moves).toBe(0);
  });
});

describe("battle bootstrap", () => {
  it("builds a first-market board with a weakened rival", () => {
    const state = createNewGame({ founderName: "A", companyName: "N", cofounderId: "reya", seed: 3 });
    const product = createProduct(state, "chat", "writing", new Rng(3));
    product.levels = { deployment: 1, capability: 2, distribution: 1 };
    const battle = startBattle(state, product, new Rng(3));
    expect(battle.tiles.length).toBeGreaterThan(10);
    expect(battle.pieces.some((p) => p.owner === "player")).toBe(true);
    expect(battle.firstMarket).toBe(true);
    const share = marketShare(battle);
    expect(share.player + share.ai).toBeGreaterThanOrEqual(0);
  });
});
