import { useMemo } from "react";
import { BALANCE } from "../../config/balance";
import { competitors as competitorDefs } from "../../data/competitors";
import { legalMarketMoves } from "../../simulation/commands";
import { marketShare } from "../../market/battle";
import { hexPoints, pixelFor, posKey, samePos } from "../../market/hex";
import type { GameState, HexPos } from "../../simulation/types";
import { useGame } from "../../state/store";
import { pct } from "../format";

const SIZE = 22;

function tileFill(kind: string, owner: string | null): string {
  if (owner === "player") return "#1f6b4a";
  if (owner === "ai") return "#9b2f2f";
  if (kind === "empty") return "#3a4454";
  if (kind === "enterprise") return "#c9a227";
  if (kind === "influencer") return "#7a5cff";
  if (kind === "government") return "#5d6573";
  return "#4d5d72";
}

export function MarketView({ game }: { game: GameState }) {
  const battle = game.marketBattle!;
  const dispatch = useGame((s) => s.dispatch);
  const legal = legalMarketMoves(game);
  const share = marketShare(battle);
  const selected = battle.pieces.find((p) => p.id === battle.selectedPieceId);
  const legalKeys = useMemo(() => new Set(legal.map(posKey)), [legal]);
  const product = game.products.find((p) => p.id === battle.productId);
  const rival = competitorDefs.find((c) => c.id === battle.competitorId)?.name ?? "Rival";

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const t of battle.tiles) {
      const { x, y } = pixelFor(t.pos, SIZE);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return { minX: minX - SIZE, minY: minY - SIZE, w: maxX - minX + SIZE * 2, h: maxY - minY + SIZE * 2 };
  }, [battle.tiles]);

  const onTile = (pos: HexPos) => {
    const occ = battle.pieces.find((p) => samePos(p.pos, pos) && p.health > 0);
    if (occ && occ.owner === "player") {
      dispatch({ type: "selectPiece", pieceId: occ.id });
      return;
    }
    if (selected && legalKeys.has(posKey(pos))) {
      dispatch({ type: "marketMove", dest: pos });
    }
  };

  return (
    <div className="flex h-full flex-col text-[#efe8dc]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c9a227]">Market capture</div>
          <div className="font-display text-2xl">{product?.name ?? "Product"} vs {rival}</div>
        </div>
        <div className="flex gap-6 font-mono text-sm">
          <div>You {pct(share.player)}</div>
          <div>Them {pct(share.ai)}</div>
          <div>Turns {battle.turnsLeft}</div>
          <div className="text-[#c4622d]">{battle.current === "player" ? "Your move" : "Resolving"}</div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-auto p-4">
          <svg viewBox={`${bounds.minX} ${bounds.minY} ${bounds.w} ${bounds.h}`} className="h-full w-full">
            {battle.tiles.map((t) => {
              const { x, y } = pixelFor(t.pos, SIZE);
              const highlight = legalKeys.has(posKey(t.pos));
              const here = selected && samePos(selected.pos, t.pos);
              return (
                <polygon
                  key={t.id}
                  points={hexPoints(x, y, SIZE - 1.2)}
                  fill={tileFill(t.kind, t.owner)}
                  stroke={here ? "#efe8dc" : highlight ? "#c4622d" : "#1b2230"}
                  strokeWidth={here ? 2.4 : highlight ? 2 : 1}
                  onClick={() => onTile(t.pos)}
                  className="cursor-pointer"
                />
              );
            })}
            {battle.pieces.map((p) => {
              const { x, y } = pixelFor(p.pos, SIZE);
              const sel = p.id === battle.selectedPieceId;
              return (
                <g key={p.id} onClick={() => p.owner === "player" && dispatch({ type: "selectPiece", pieceId: p.id })} className="cursor-pointer">
                  <circle cx={x} cy={y} r={8} fill={p.owner === "player" ? "#efe8dc" : "#1b2230"} stroke={sel ? "#c9a227" : "#c4622d"} strokeWidth={sel ? 3 : 1.5} />
                  <text x={x} y={y + 3} textAnchor="middle" fontSize="8" fill={p.owner === "player" ? "#1b2230" : "#efe8dc"}>
                    {p.health}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <aside className="w-72 shrink-0 border-l border-white/10 p-4 text-sm">
          <p className="text-[#9aa3b2]">
            Deployment is pieces. Capability is health. Distribution is movement. Capture spends remaining health into a tile.
          </p>
          {selected ? (
            <div className="mt-4 font-mono text-xs">
              Selected {selected.owner} · HP {selected.health}/{selected.maxHealth} · moves {selected.moves}
            </div>
          ) : (
            <p className="mt-4 text-xs text-[#9aa3b2]">Click one of your pieces.</p>
          )}
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              className="bg-[#c4622d] px-3 py-2 text-white disabled:opacity-40"
              disabled={!selected || selected.owner !== "player" || selected.moves <= 0}
              onClick={() => dispatch({ type: "marketCapture" })}
            >
              Capture this tile
            </button>
            <button type="button" className="border border-white/20 px-3 py-2" onClick={() => dispatch({ type: "marketEndTurn" })}>
              End turn
            </button>
            {game.company.productsLaunched >= BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE && product ? (
              <button
                type="button"
                className="border border-white/20 px-3 py-2 text-xs"
                onClick={() => dispatch({ type: "delegateMarket", productId: product.id })}
              >
                Delegate (auto-resolve)
              </button>
            ) : null}
          </div>
          <ul className="mt-6 space-y-1 font-mono text-[10px] text-[#9aa3b2]">
            <li>Green = yours · Red = theirs</li>
            <li>Gold = enterprise · Violet = influencer</li>
            <li>Copper outline = legal move</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
