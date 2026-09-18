import type { GameState } from "../../simulation/types";
import { useGame } from "../../state/store";
import { money, pct } from "../format";
import { GameIcon } from "../shared/Icons";

export function MarketResults({ game }: { game: GameState }) {
  const r = game.marketResult!;
  const p = game.products.find((prod) => prod.id === r.productId);

  const isRout = r.outcomeType === "market-rout";
  const isDefeat = r.outcomeType === "routed";

  const grossProfit = r.revenue - r.inference;
  const grossMargin = r.revenue > 0 ? Math.round((grossProfit / r.revenue) * 100) : 0;
  const operatingCost = p?.weeklyOperatingCost ?? 0;
  const netContribution = grossProfit - operatingCost;

  const outcomeTitle =
    r.outcomeType === "market-rout"
      ? "MARKET ROUT"
      : r.outcomeType === "leader"
      ? "CATEGORY LEADER"
      : r.outcomeType === "strong"
      ? "STRONG ENTRY"
      : r.outcomeType === "competitive"
      ? "COMPETITIVE ENTRY"
      : r.outcomeType === "foothold"
      ? "FOOTHOLD ESTABLISHED"
      : r.outcomeType === "routed"
      ? "LAUNCH ROUTED"
      : "WEAK ENTRY";

  return (
    <main className="market-results">
      <article>
        <span className="eyebrow">
          Launch report / {game.company.name}
        </span>
        <div className="result-mark">
          <GameIcon name="products" />
        </div>

        <div
          style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            padding: "4px 12px",
            borderRadius: 3,
            marginBottom: 8,
            background: isRout
              ? "#3e644e"
              : isDefeat
              ? "#6e3b33"
              : "#465f5a",
            color: "#fff8ec",
          }}
        >
          {outcomeTitle}
        </div>

        <h1>{p?.name} is live.</h1>
        <p>{r.outcome}</p>

        {/* Big penetration share number */}
        <div className="result-share">
          <strong>{pct(r.share)}</strong>
          <span>Market Penetration · Rival {r.rivalName ?? "Competitor"}: {pct(r.rivalShare ?? 0)}</span>
        </div>

        {/* Ledger Breakdown */}
        <div className="result-ledger">
          <div>
            <span>Top segment</span>
            <strong>{r.topSegment ?? "Developers"}</strong>
          </div>
          <div>
            <span>Customers</span>
            <strong>{Math.round(r.users).toLocaleString()}</strong>
          </div>
          <div>
            <span>Revenue / week</span>
            <strong>{money(r.revenue)}</strong>
          </div>
          <div>
            <span>Inference / week</span>
            <strong>{money(r.inference)}</strong>
          </div>
          <div>
            <span>Gross profit / week</span>
            <strong style={{ color: grossProfit >= 0 ? "#3d7854" : "#b55333" }}>
              {money(grossProfit)} ({grossMargin}%)
            </strong>
          </div>
          <div>
            <span>Operating cost / week</span>
            <strong>{money(operatingCost)}</strong>
          </div>
          <div>
            <span>Net contribution / week</span>
            <strong style={{ color: netContribution >= 0 ? "#3d7854" : "#b55333" }}>{money(netContribution)}</strong>
          </div>
          <div>
            <span>Hype Impact</span>
            <strong>{r.hype >= 0 ? `+${r.hype}` : r.hype}</strong>
          </div>
        </div>

        {/* Segment Table if present */}
        {r.segments && r.segments.length > 0 && (
          <div style={{ margin: "10px 0 14px", textAlign: "left" }}>
            <span
              className="eyebrow"
              style={{ fontSize: 10, color: "#6a7d6e", display: "block", marginBottom: 6 }}
            >
              Segment Penetration
            </span>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: 8,
              }}
            >
              {r.segments.map((seg) => (
                <div
                  key={seg.id}
                  style={{
                    background: "#e8ede0",
                    padding: "6px 10px",
                    borderRadius: 3,
                    fontSize: 11,
                    border: "1px solid #d0dbc7",
                  }}
                >
                  <div style={{ fontWeight: 600, color: "#2d473e" }}>{seg.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span>Share:</span>
                    <strong style={{ color: "#365c49" }}>{seg.playerShare}%</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="result-note">
          {r.revenue > 0
            ? "Revenue arrives weekly. API credits cover inference before company cash is touched."
            : "No meaningful footholds this launch. Improve capability and expand reach before trying again."}
        </p>

        <button
          className="primary-action"
          onClick={() => useGame.getState().dispatch({ type: "continueMarketResults" })}
        >
          Continue →
        </button>
        <small>Time remains paused.</small>
      </article>
    </main>
  );
}
