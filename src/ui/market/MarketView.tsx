import { useState } from "react";
import { audio } from "../../audio/Audio";
import { competitors as competitorDefs } from "../../data/competitors";
import {
  getConnectedSupport,
  getLegalMoves,
  getOverallShares,
  getProductFit,
  previewAction,
} from "../../market/marketMap";
import { lookFromSeed } from "../../simulation/look";
import type { GameState } from "../../simulation/types";
import { useGame } from "../../state/store";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import { CompanyMark } from "../visuals/CompanyMark";

export function MarketView({ game }: { game: GameState }) {
  const session = game.marketBattle!;
  const dispatch = useGame((s) => s.dispatch);
  const [feedback, setFeedback] = useState<string>("Select a market segment to inspect expansion paths.");

  const product = game.products.find((p) => p.id === session.productId)!;
  const rival = competitorDefs.find((c) => c.id === session.competitorId);
  const locked = Boolean(game.pendingMentor);

  const overall = getOverallShares(session);
  const legal = getLegalMoves(session, "player", product?.levels.distribution ?? 0);

  const selectedNode = session.nodes.find((n) => n.id === session.selectedNodeId) ?? session.nodes[0]!;

  const canExpand = legal.expand.includes(selectedNode.id);
  const canReinforce = legal.reinforce.includes(selectedNode.id);
  const isLegal = canExpand || canReinforce;
  const actionType: "expand" | "reinforce" = canExpand ? "expand" : "reinforce";

  const preview = previewAction(
    session,
    selectedNode.id,
    "player",
    actionType,
    product?.levels.capability ?? 0,
    product?.combo ?? ["chat", "api"],
  );

  const supportCount = getConnectedSupport(session, selectedNode.id, "player");
  const productFit = getProductFit(selectedNode, product?.combo ?? ["chat", "api"]);
  const excessLoad = Math.max(0, session.playerScaleUsed - session.playerScaleCapacity);

  const reason = !isLegal
    ? selectedNode.playerDominated
      ? "Market already dominated"
      : selectedNode.rivalDominated
      ? "Competitor has dominated this market"
      : "Segment out of network reach"
    : "";

  function handleSelectNode(nodeId: string) {
    if (locked) return;
    dispatch({ type: "selectMarketNode", nodeId });
    const n = session.nodes.find((item) => item.id === nodeId);
    if (n) {
      if (legal.expand.includes(nodeId)) {
        setFeedback(`Adjacent opportunity: Expand into ${n.name}.`);
      } else if (legal.reinforce.includes(nodeId)) {
        setFeedback(`Established foothold: Reinforce ${n.name} to increase market share.`);
      } else if (n.playerDominated) {
        setFeedback(`${n.name} is dominated. Network support flows to adjacent markets.`);
      } else {
        setFeedback(`${n.name}: Connect adjacent segments first to reach this market.`);
      }
    }
  }

  function handleExecuteAction() {
    if (locked || !isLegal) return;
    const targetName = selectedNode.name;
    const beforeDom = selectedNode.playerDominated;

    dispatch({
      type: "marketAction",
      nodeId: selectedNode.id,
      action: actionType,
    });

    const afterSession = useGame.getState().game?.marketBattle;
    const updated = afterSession?.nodes.find((n) => n.id === selectedNode.id);

    if (updated?.playerDominated && !beforeDom) {
      audio.play("success", game.settings);
      setFeedback(`Market Dominated! ${targetName} now belongs decisively to your product.`);
    } else {
      audio.play("click", game.settings);
      setFeedback(
        actionType === "expand"
          ? `Foothold established in ${targetName}. Competitor responded.`
          : `Reinforced position in ${targetName}. Customer preference increased.`,
      );
    }
  }

  return (
    <main className="market-mode">
      {/* Top Header */}
      <header className="market-header">
        <div>
          <span className="eyebrow">Market Entry · Customer Map</span>
          <h1>{product.name}</h1>
        </div>

        <div className="market-score">
          <span>
            <small>Your Share</small>
            <strong style={{ color: "#a8c4b0" }}>{overall.player}%</strong>
          </span>
          <span>
            <small>{rival?.name ?? "Rival"}</small>
            <strong style={{ color: "#e4a880" }}>{overall.rival}%</strong>
          </span>
          <span>
            <small>Open Market</small>
            <strong style={{ color: "#d5d8c9" }}>{overall.neutral}%</strong>
          </span>
          <span>
            <small>Turns Window</small>
            <strong>
              {session.turnsLeft} <em>/ {session.totalTurns}</em>
            </strong>
          </span>
          <span>
            <small>Market Load</small>
            <strong style={{ color: excessLoad > 0 ? "#e4a880" : "#eff2e3" }}>
              {session.playerScaleUsed} <em>/ {session.playerScaleCapacity}</em>
            </strong>
          </span>
        </div>

        <span className="market-clock">Ⅱ Company paused</span>
      </header>

      {/* Main Layout */}
      <div className="market-layout">
        {/* SVG Strategic Graph Board */}
        <section
          className="tactical-board"
          data-tutorial="market-board"
          aria-label="Market Map Board"
        >
          <svg viewBox="0 0 600 420" role="group" aria-label="Customer Segment Graph">
            <defs>
              <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.4" />
              </filter>
              <linearGradient id="edge-player" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#679178" />
                <stop offset="100%" stopColor="#a8c4b0" />
              </linearGradient>
              <linearGradient id="edge-rival" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8d5f50" />
                <stop offset="100%" stopColor="#d6a396" />
              </linearGradient>
            </defs>

            {/* Edges */}
            {session.edges.map((edge, idx) => {
              const na = session.nodes.find((n) => n.id === edge.a);
              const nb = session.nodes.find((n) => n.id === edge.b);
              if (!na || !nb) return null;

              const isPlayerPath =
                (na.playerShare >= 40 || na.playerDominated) &&
                (nb.playerShare >= 40 || nb.playerDominated) &&
                !na.playerIsolated &&
                !nb.playerIsolated;

              const isRivalPath =
                (na.rivalShare >= 40 || na.rivalDominated) &&
                (nb.rivalShare >= 40 || nb.rivalDominated) &&
                !na.rivalIsolated &&
                !nb.rivalIsolated;

              let stroke = "#435d60";
              let strokeWidth = 1.5;
              let strokeDash: string | undefined = undefined;

              if (isPlayerPath) {
                stroke = "#7aa189";
                strokeWidth = 3;
              } else if (isRivalPath) {
                stroke = "#b07869";
                strokeWidth = 3;
              } else if (na.playerInfluence > 0 || nb.playerInfluence > 0) {
                stroke = "#567575";
                strokeWidth = 2;
                strokeDash = "4 3";
              }

              return (
                <line
                  key={`${edge.a}-${edge.b}-${idx}`}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDash}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              );
            })}

            {/* Nodes */}
            {session.nodes.map((node) => {
              const isSelected = node.id === selectedNode.id;
              const isReachable = legal.expand.includes(node.id) || legal.reinforce.includes(node.id);
              const isPlayerBeach = node.isPlayerBeachhead;
              const isRivalBeach = node.isRivalBeachhead;

              // Node tutorial tags
              const tutorialTag = isPlayerBeach
                ? "market-player"
                : isRivalBeach
                ? "market-rival"
                : node.segmentId === "enterprise"
                ? "market-value"
                : node.segmentId === "startups"
                ? "market-customer"
                : undefined;

              // Share arc or fills
              const r = 30;
              let borderColor = "#607c79";
              let borderWidth = 1.5;
              let bgColor = "#2c454a";

              if (node.playerDominated) {
                bgColor = "#3d6452";
                borderColor = "#a8c4b0";
                borderWidth = 2.5;
              } else if (node.rivalDominated) {
                bgColor = "#623e38";
                borderColor = "#d6a396";
                borderWidth = 2.5;
              } else if (node.playerShare > 0 || node.rivalShare > 0) {
                bgColor = "#334f54";
                borderColor = node.playerShare > node.rivalShare ? "#82a893" : "#bf8374";
                borderWidth = 2;
              }

              if (isSelected) {
                borderColor = "#fff7e5";
                borderWidth = 3;
              } else if (isReachable) {
                borderColor = "#e6804b";
                borderWidth = 2;
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x} ${node.y})`}
                  role="button"
                  tabIndex={locked ? -1 : 0}
                  aria-label={`${node.name}: ${node.playerShare}% You, ${node.rivalShare}% Rival${
                    node.playerDominated ? ", Dominated" : ""
                  }${node.playerIsolated ? ", Isolated" : ""}`}
                  data-tutorial={tutorialTag}
                  onClick={() => handleSelectNode(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectNode(node.id);
                    }
                  }}
                  className={`market-node ${isSelected ? "selected" : ""} ${
                    isReachable ? "reachable" : ""
                  }`}
                  style={{ cursor: "pointer", outline: "none" }}
                >
                  {/* Subtle shadow */}
                  <circle cx="0" cy="2" r={r} fill="#142427" opacity="0.35" />

                  {/* Main Node Background */}
                  <circle
                    cx="0"
                    cy="0"
                    r={r}
                    fill={bgColor}
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    strokeDasharray={node.playerIsolated ? "4 3" : undefined}
                  />

                  {/* Share Ring Progress Indicators */}
                  {node.playerShare > 0 && !node.playerDominated && !node.rivalDominated && (
                    <circle
                      cx="0"
                      cy="0"
                      r={r - 3}
                      fill="none"
                      stroke="#8cb59a"
                      strokeWidth="3.5"
                      strokeDasharray={`${(node.playerShare / 100) * 2 * Math.PI * (r - 3)} ${
                        2 * Math.PI * (r - 3)
                      }`}
                      transform="rotate(-90)"
                      opacity="0.9"
                    />
                  )}
                  {node.rivalShare > 0 && !node.playerDominated && !node.rivalDominated && (
                    <circle
                      cx="0"
                      cy="0"
                      r={r - 3}
                      fill="none"
                      stroke="#c98a7b"
                      strokeWidth="3.5"
                      strokeDasharray={`${(node.rivalShare / 100) * 2 * Math.PI * (r - 3)} ${
                        2 * Math.PI * (r - 3)
                      }`}
                      transform={`rotate(${node.playerShare * 3.6 - 90})`}
                      opacity="0.9"
                    />
                  )}

                  {/* Segment Icon / Value Indicator */}
                  <text
                    x="0"
                    y="-7"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#f0f3e8"
                    letterSpacing="0.04em"
                  >
                    {"$".repeat(Math.min(3, node.value))}
                  </text>

                  {/* Node Title */}
                  <text
                    x="0"
                    y="5"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill="#eaf0e2"
                  >
                    {node.name.length > 11 ? node.name.slice(0, 9) + "…" : node.name}
                  </text>

                  {/* Status subtitle / share */}
                  <text
                    x="0"
                    y="17"
                    textAnchor="middle"
                    fontSize="8"
                    fill={
                      node.playerDominated
                        ? "#a8c4b0"
                        : node.rivalDominated
                        ? "#e4a880"
                        : "#9cb4ab"
                    }
                  >
                    {node.playerDominated
                      ? "DOMINATED"
                      : node.rivalDominated
                      ? "RIVAL HELD"
                      : node.playerIsolated
                      ? "ISOLATED"
                      : `${node.playerShare}% / ${node.rivalShare}%`}
                  </text>

                  {/* Beachhead badge */}
                  {isPlayerBeach && (
                    <circle cx={-r + 4} cy={-r + 4} r="5" fill="#e6804b" stroke="#fff" strokeWidth="1" />
                  )}
                  {isRivalBeach && (
                    <circle cx={r - 4} cy={-r + 4} r="5" fill="#4d637e" stroke="#fff" strokeWidth="1" />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Board Legend */}
          <div className="board-legend">
            <span>
              <i style={{ background: "#a8c4b0" }} /> Your Foothold
            </span>
            <span>
              <i style={{ background: "#d6a396" }} /> Rival Foothold
            </span>
            <span>
              <i style={{ background: "#3d6452", border: "1px solid #a8c4b0" }} /> Dominated
            </span>
            <span>
              <i style={{ border: "1px dashed #e4a880", background: "none" }} /> Isolated
            </span>
            <span>
              <i style={{ background: "#e6804b" }} /> Orange Dot = Beachhead
            </span>
          </div>
        </section>

        {/* Right Inspector Panel */}
        <aside className="market-orders">
          {/* Rival identity card */}
          <div className="rival-identity">
            <CompanyMark company={session.competitorId} />
            <CharacterPortrait look={lookFromSeed(session.competitorId, rival?.archetype)} />
            <div>
              <span className="eyebrow">The Competition</span>
              <h3>{rival?.name ?? "Independent Rival"}</h3>
              <small>
                {rival?.founder} · <em>{rival?.personality ?? "opportunistic"}</em>
              </small>
            </div>
          </div>

          {/* Selected Node Details Card */}
          <div className="order-card">
            <span className="eyebrow">Selected Segment</span>
            <h2>{selectedNode.name}</h2>
            <p>
              Value: <strong>{"$".repeat(selectedNode.value)}</strong> · Resistance:{" "}
              <strong>{selectedNode.resistance}</strong> · Load: <strong>{selectedNode.load}</strong>
            </p>

            {selectedNode.trait && (
              <div
                style={{
                  fontSize: 10,
                  background: "#e4ebd8",
                  padding: "4px 8px",
                  borderRadius: 3,
                  margin: "8px 0",
                  color: "#375043",
                  display: "inline-block",
                }}
              >
                Trait: <strong>{selectedNode.trait.replace("_", " ").toUpperCase()}</strong>
              </div>
            )}

            {/* Current vs Projected Shares */}
            <div className="capture-detail">
              <strong>Market Share Status</strong>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
                <span>You: <strong>{selectedNode.playerShare}%</strong></span>
                <span>Rival: <strong>{selectedNode.rivalShare}%</strong></span>
                <span>Open: <strong>{selectedNode.neutralShare}%</strong></span>
              </div>

              {/* Action Projected Preview */}
              {isLegal && (
                <div
                  style={{
                    background: "#d6e0ce",
                    padding: "8px 10px",
                    borderRadius: 3,
                    marginTop: 8,
                    fontSize: 11,
                  }}
                >
                  <span style={{ display: "block", color: "#486350", fontWeight: 600 }}>
                    Projected after {actionType.toUpperCase()}:
                  </span>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <span>
                      You: {selectedNode.playerShare}% →{" "}
                      <strong style={{ color: "#2d573d" }}>{preview.projectedPlayerShare}%</strong>
                    </span>
                    <span>
                      Rival: {selectedNode.rivalShare}% →{" "}
                      <strong style={{ color: "#7a4234" }}>{preview.projectedRivalShare}%</strong>
                    </span>
                  </div>
                  {preview.willDominate && (
                    <small style={{ color: "#bd663b", fontWeight: 700, display: "block", marginTop: 4 }}>
                      ★ WILL ACHIEVE DOMINANCE THIS TURN
                    </small>
                  )}
                </div>
              )}
            </div>

            {/* Conversion Influence Breakdown */}
            <details className="market-calculation"
              style={{
                fontSize: 10,
                borderTop: "1px solid #c9d6bf",
                paddingTop: 8,
                margin: "10px 0",
                color: "#526a57",
              }}
            >
              <summary>Why this result?</summary>
              <div className="market-calculation-body">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Base Capability</span>
                <strong>{preview.breakdown.base}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Product Fit</span>
                <strong>{productFit >= 0 ? `+${productFit}` : productFit}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Connected Support</span>
                <strong>+{supportCount}</strong>
              </div>
              {excessLoad > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#b55333" }}>
                  <span>Scale Overload</span>
                  <strong>-{preview.breakdown.overloadPenalty}%</strong>
                </div>
              )}
              {selectedNode.playerIsolated && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#b55333" }}>
                  <span>Isolation Penalty</span>
                  <strong>-25%</strong>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  borderTop: "1px dashed #b4c4aa",
                  paddingTop: 4,
                  marginTop: 4,
                }}
              >
                <span>Total Influence Added</span>
                <strong style={{ color: "#244033" }}>+{preview.influenceToAdd}</strong>
              </div>
              </div>
            </details>

            {/* Main Action Button */}
            <button
              className="primary-action"
              data-tutorial="market-capture"
              disabled={locked || !isLegal}
              title={reason || `Execute ${actionType} on ${selectedNode.name}`}
              onClick={handleExecuteAction}
            >
              {actionType === "expand" ? "Expand Into Market →" : "Reinforce Position →"}
            </button>
            <small className="disabled-reason">
              {reason ||
                (actionType === "expand"
                  ? "Establishes a customer foothold from adjacent supported positions."
                  : "Strengthens current market share and prepares support for adjacent nodes.")}
            </small>
          </div>

          {/* Feedback & Last Rival Move */}
          <p className="market-feedback" role="status">
            {feedback}
          </p>

          {session.lastRivalMove && (
            <div
              style={{
                fontSize: 10,
                background: "#e4ded0",
                padding: "8px 10px",
                borderRadius: 3,
                marginBottom: 12,
                color: "#4d3930",
              }}
            >
              <span className="eyebrow" style={{ fontSize: 9, color: "#8a5747" }}>
                Rival Counter-Move
              </span>
              <div>
                <strong>{rival?.name ?? "Rival"}</strong> {session.lastRivalMove.action}ed in{" "}
                <strong>{session.lastRivalMove.nodeName}</strong>.
              </div>
            </div>
          )}

          {/* End Turn / Pass Action */}
          <button
            className="end-turn"
            data-tutorial="market-end-turn"
            disabled={locked}
            onClick={() => {
              dispatch({ type: "marketEndTurn" });
              setFeedback("Turn passed. Rival evaluated their next strategic expansion.");
            }}
          >
            Pass Turn →
          </button>

          {/* Market Strategy Rules Compact Help */}
          <div className="market-help">
            <b>Expand · Connect · Dominate</b>
            <p>
              Expand into adjacent segments to build your network. Strongly held nodes give +Support to
              neighbors. Decisive influence triggers Dominance, routing the rival out of that segment.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
