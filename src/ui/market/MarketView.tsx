import { useState, useEffect } from "react";
import { competitors as competitorDefs } from "../../data/competitors";
import {
  getLegalMoves,
  getOverallShares,
} from "../../market/marketMap";
import { OPS_COST, previewSideAction } from "../../market/turns";
import type { MarketLogEntry, MarketTactic, MarketTrait } from "../../market/types";
import { lookFromSeed } from "../../simulation/look";
import type { GameState } from "../../simulation/types";
import { useGame } from "../../state/store";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import { CompanyMark } from "../visuals/CompanyMark";

const TRAIT_INFO: Record<MarketTrait, { icon: string; label: string; desc: string }> = {
  platform_hub: { icon: "⚡", label: "Platform Hub", desc: "Dominating grants +1 Ops point per turn" },
  viral: { icon: "🌐", label: "Viral Growth", desc: "Spreads passive influence to adjacent markets at turn end" },
  enterprise: { icon: "🏢", label: "Enterprise", desc: "5x revenue value; high resistance requires heavy push" },
  early_adopter: { icon: "🚀", label: "Early Adopter", desc: "Low resistance; dominating awards +1 Momentum" },
  community_driven: { icon: "👥", label: "Community", desc: "High loyalty; doubles resistance against rival contest" },
  high_value: { icon: "💎", label: "High Value", desc: "Enhanced economic yield per active customer" },
  regulated: { icon: "⚖️", label: "Regulated", desc: "Requires careful compliance and steady positioning" },
};

type PlayerTactic = Extract<MarketTactic, "pitch" | "fortify" | "poach">;

const TACTICS: Record<PlayerTactic, { label: string; icon: string; description: string }> = {
  pitch: { label: "Promote", icon: "↗", description: "Open a connected segment. Distribution 3+ can reach two hops." },
  fortify: { label: "Reinforce", icon: "◆", description: "Add influence to a foothold and protect it from the rival this round." },
  poach: { label: "Poach", icon: "⇄", description: "Challenge a rival hold that touches your network or one you already contest." },
};

function tacticForMove(canReinforce: boolean, canContest: boolean): PlayerTactic {
  if (canContest) return "poach";
  if (canReinforce) return "fortify";
  return "pitch";
}

function actionForTactic(tactic: PlayerTactic): "expand" | "reinforce" | "contest" {
  if (tactic === "fortify") return "reinforce";
  if (tactic === "poach") return "contest";
  return "expand";
}

function visibleMoveLabel(entry: MarketLogEntry): string {
  if (entry.tactic === "fortify") return "Reinforce";
  if (entry.tactic === "poach") return "Poach";
  return "Promote";
}

export function MarketView({ game }: { game: GameState }) {
  const session = game.marketBattle!;
  const dispatch = useGame((s) => s.dispatch);
  const [feedback, setFeedback] = useState<string>("Select a segment.");
  const [selectedTactic, setSelectedTactic] = useState<PlayerTactic>("pitch");
  const [moveReveals, setMoveReveals] = useState<MarketLogEntry[]>([]);

  const product = game.products.find((p) => p.id === session.productId)!;
  const rival = competitorDefs.find((c) => c.id === session.competitorId);
  const isRivalTurn = session.current === "rival";
  const locked = Boolean(game.pendingMentor) || isRivalTurn;

  const overall = getOverallShares(session);
  const legal = getLegalMoves(session, "player", product?.levels.distribution ?? 0);

  const selectedNode = session.nodes.find((n) => n.id === session.selectedNodeId) ?? session.nodes[0]!;

  const canExpand = legal.expand.includes(selectedNode.id);
  const canReinforce = legal.reinforce.includes(selectedNode.id);
  const canContest = legal.contest.includes(selectedNode.id);
  const isReachable = canExpand || canReinforce || canContest;
  const availableTactic = tacticForMove(canReinforce, canContest);
  const activeMove = moveReveals[0] ?? null;

  useEffect(() => {
    if (!activeMove) return;
    const timer = window.setTimeout(
      () => setMoveReveals((current) => current.slice(1)),
      game.settings.reducedMotion ? 650 : 1150,
    );
    return () => window.clearTimeout(timer);
  }, [activeMove?.id, game.settings.reducedMotion]);

  useEffect(() => {
    if (!isRivalTurn || activeMove || game.pendingMentor) return;
    const timer = window.setTimeout(() => {
      const beforeIds = new Set(useGame.getState().game?.marketBattle?.actionLog.map((entry) => entry.id) ?? []);
      dispatch({ type: "marketRivalStep" });
      const after = useGame.getState().game?.marketBattle;
      const fresh = after?.actionLog.find((entry) => !beforeIds.has(entry.id) && entry.side === "rival");
      if (fresh) {
        setMoveReveals((current) => [...current, fresh]);
        setFeedback(fresh.summary);
      } else if (after?.current === "player") {
        setFeedback("Your turn. Choose a segment.");
      }
    }, game.settings.reducedMotion ? 300 : 550);
    return () => window.clearTimeout(timer);
  }, [activeMove, dispatch, game.pendingMentor, game.settings.reducedMotion, isRivalTurn, session.rivalOps, session.turnNonce]);

  // Auto-tune default tactic when user selects a different node
  useEffect(() => {
    setSelectedTactic(availableTactic);
  }, [selectedNode.id, availableTactic]);

  const cost = OPS_COST[selectedTactic] ?? 1;
  const hasOps = (session.playerOps ?? 0) >= cost;
  const selectedAction = actionForTactic(selectedTactic);
  const tacticIsLegal = selectedTactic === "pitch"
    ? canExpand
    : selectedTactic === "fortify"
    ? canReinforce
    : canContest;
  const preview = tacticIsLegal
    ? previewSideAction(game, session, "player", selectedAction, selectedNode.id, product.levels, product.combo, selectedTactic)
    : null;
  const excessLoad = Math.max(0, session.playerScaleUsed - session.playerScaleCapacity);

  let disabledReason = "";
  if (!isReachable) {
    disabledReason = selectedNode.playerDominated && !canReinforce
      ? "Market already dominated"
      : selectedNode.rivalDominated && !canContest
      ? "Rival hold is out of reach. Promote through an adjacent segment first."
      : "No connected opening here. Promote next to your network; Distribution 3+ reaches two hops.";
  } else if (!tacticIsLegal) {
    disabledReason = selectedNode.rivalDominated || selectedNode.rivalShare >= 55
      ? "This is a rival hold. Poach it instead."
      : selectedNode.playerInfluence > 0
      ? "You already have a foothold here. Reinforce it instead."
      : `${TACTICS[availableTactic].label} is the move this segment allows.`;
  } else if (!hasOps) {
    disabledReason = `Not enough Ops (${session.playerOps ?? 0}/${cost}). End your turn to replenish!`;
  }

  const isExecutable = isReachable && tacticIsLegal && hasOps && !locked;

  function enqueueNewMoves(beforeIds: Set<string>) {
    const after = useGame.getState().game?.marketBattle;
    if (!after) return;
    const fresh = after.actionLog
      .filter((entry) => !beforeIds.has(entry.id) && entry.side !== "network" && entry.tactic !== "pass")
      .reverse();
    if (fresh.length) setMoveReveals((current) => [...current, ...fresh]);
  }

  function handleSelectNode(nodeId: string) {
    if (locked) return;
    dispatch({ type: "selectMarketNode", nodeId });
    const n = session.nodes.find((item) => item.id === nodeId);
    if (n) {
      if (legal.contest.includes(nodeId)) {
        setFeedback(`Contested territory: Challenge ${rival?.name ?? "incumbent"} in ${n.name}.`);
      } else if (legal.expand.includes(nodeId)) {
        setFeedback(`Adjacent opportunity: Promote into ${n.name}.`);
      } else if (legal.reinforce.includes(nodeId)) {
        setFeedback(`Foothold established: Reinforce your position in ${n.name}.`);
      } else if (n.playerDominated) {
        setFeedback(`${n.name} is dominated. Network support flows to adjacent markets.`);
      } else {
        setFeedback(`${n.name}: Connect adjacent segments first to reach this market.`);
      }
    }
  }

  function handleExecuteAction() {
    if (!isExecutable) return;
    const beforeIds = new Set(session.actionLog.map((entry) => entry.id));
    dispatch({
      type: "marketAction",
      nodeId: selectedNode.id,
      tactic: selectedTactic,
    });
    const after = useGame.getState().game;
    const result = after?.marketBattle?.lastResolution;
    const summary = result?.summary ?? `Unable to ${TACTICS[selectedTactic].label.toLowerCase()} this segment.`;
    setFeedback(summary);
    enqueueNewMoves(beforeIds);
  }

  function handleEndTurn() {
    if (locked) return;
    const beforeIds = new Set(session.actionLog.map((entry) => entry.id));
    dispatch({ type: "marketBeginRivalTurn" });
    setFeedback(`${rival?.name ?? "Rival"} is moving…`);
    enqueueNewMoves(beforeIds);
  }

  const playerOps = session.playerOps ?? 0;
  const playerMaxOps = session.playerMaxOps ?? 3;
  const bankedOps = session.bankedOps ?? 0;

  return (
    <main className={`market-mode ${game.settings.reducedMotion ? "reduced-motion" : ""} ${isRivalTurn ? "rival-turn" : ""}`}>
      {/* Top Header */}
      <header className="market-header">
        <div>
          <span className="eyebrow">Market entry</span>
          <h1>{product.name}</h1>
        </div>

        <div className="market-score">
          {/* Ops Points Meter */}
          <span title="Action points available this round. Bank up to 1 unused Ops for next round.">
            <small>Turn Ops</small>
            <div className="ops-meter" style={{ marginTop: 3 }}>
              <div className="ops-pips">
                {Array.from({ length: Math.max(playerMaxOps, playerOps) }).map((_, i) => (
                  <span
                    key={i}
                    className={`ops-pip ${i < playerOps ? "filled" : i < playerOps + bankedOps ? "banked" : "empty"}`}
                  />
                ))}
              </div>
              <strong style={{ color: playerOps > 0 ? "#70c995" : "#e4a880", fontSize: 20 }}>
                {playerOps} <em style={{ fontSize: 13 }}>/ {playerMaxOps}</em>
              </strong>
            </div>
          </span>

          <span>
            <small>Your Share</small>
            <strong style={{ color: "#a8c4b0" }}>{overall.player}%</strong>
          </span>
          <span>
            <small>{rival?.name ?? "Rival"}</small>
            <strong style={{ color: "#e4a880" }}>{overall.rival}%</strong>
          </span>
          <span>
            <small>Turns left</small>
            <strong>
              {session.turnsLeft} <em>/ {session.totalTurns}</em>
            </strong>
          </span>
          <span>
            <small>Momentum</small>
            <strong style={{ color: (session.playerMomentum ?? 0) >= 0 ? "#8ecbb0" : "#d68878" }}>
              {(session.playerMomentum ?? 0) >= 0 ? `+${session.playerMomentum ?? 0}` : session.playerMomentum}
            </strong>
          </span>
        </div>

        <span className="market-clock">{isRivalTurn ? `◆ ${rival?.name ?? "Rival"} moving` : "Ⅱ Company paused"}</span>
      </header>

      {/* Main Layout */}
      <div className="market-layout">
        {/* SVG Strategic Graph Board */}
        <section
          className="tactical-board"
          data-tutorial="market-board"
          aria-label="Market Map Board"
          aria-busy={isRivalTurn}
        >
          {activeMove && (
            <div
              key={activeMove.id}
              className={`market-move-reveal ${activeMove.side}`}
              role="status"
              aria-live="polite"
            >
              <span className="market-move-actor">{activeMove.side === "player" ? "Your move" : `${rival?.name ?? "Rival"}'s move`}</span>
              <strong><i>{activeMove.side === "player" ? "●" : "◆"}</i>{visibleMoveLabel(activeMove)}</strong>
              <span>{activeMove.nodeName}</span>
              <small className="success">Move landed</small>
            </div>
          )}
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
                <g key={`${edge.a}-${edge.b}-${idx}`}>
                <line
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
                {activeMove?.success && activeMove.side === "player" && (edge.a === activeMove.nodeId || edge.b === activeMove.nodeId) && (
                  <line className="market-capture-flow" x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke="#d6eac9" strokeWidth="3" strokeLinecap="round" />
                )}
                </g>
              );
            })}

            {/* Nodes */}
            {session.nodes.map((node) => {
              const isSelected = node.id === selectedNode.id;
              const isTargetReachable = legal.expand.includes(node.id) || legal.reinforce.includes(node.id) || legal.contest.includes(node.id);
              const isPlayerBeach = node.isPlayerBeachhead;
              const isRivalBeach = node.isRivalBeachhead;
              const traitMeta = node.trait ? TRAIT_INFO[node.trait] : null;

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

              const r = 32;
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
                borderWidth = 3.5;
              } else if (isTargetReachable) {
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
                  }${node.fortified ? ", Reinforced" : ""}`}
                  data-tutorial={tutorialTag}
                  onClick={() => handleSelectNode(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleSelectNode(node.id);
                    }
                  }}
                  className={`market-node ${isSelected ? "selected" : ""} ${
                    isTargetReachable ? "reachable" : ""
                  }`}
                  style={{ cursor: locked ? "default" : "pointer", outline: "none" }}
                >
                  {/* Subtle shadow */}
                  <circle cx="0" cy="2" r={r} fill="#142427" opacity="0.35" />

                  {activeMove?.nodeId === node.id && (
                    <circle
                      className={`market-action-target ${activeMove.side}`}
                      cx="0"
                      cy="0"
                      r={r + 9}
                      fill="none"
                      stroke={activeMove.side === "player" ? "#d9efcf" : "#efb09d"}
                      strokeWidth="3"
                    />
                  )}

                  {/* Fortified Moat Ring */}
                  {node.fortified && (
                    <circle
                      cx="0"
                      cy="0"
                      r={r + 4}
                      fill="none"
                      stroke="#d9a850"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      opacity="0.9"
                    />
                  )}

                  {/* Main Node Background */}
                  <circle
                    className="market-node-fill"
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

                  {/* Trait Icon & Value Badge */}
                  <text
                    x="0"
                    y="-9"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#f0f3e8"
                  >
                    {traitMeta ? `${traitMeta.icon} ` : ""}{"$".repeat(Math.min(3, node.value))}
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
                    y="18"
                    textAnchor="middle"
                    fontSize="8"
                    fill={
                      node.fortified
                        ? "#ffd685"
                        : node.playerDominated
                        ? "#a8c4b0"
                        : node.rivalDominated
                        ? "#e4a880"
                        : "#9cb4ab"
                    }
                  >
                    {node.fortified
                      ? "◆ REINFORCED"
                      : node.playerDominated
                      ? "DOMINATED"
                      : node.rivalDominated
                      ? "RIVAL HELD"
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
              <i style={{ border: "1px dashed #d9a850", background: "#334f54" }} /> Reinforced
            </span>
            <span>
              <i style={{ background: "#e6804b" }} /> Orange Dot = Beachhead
            </span>
          </div>
        </section>

        {/* Right Inspector Panel */}
        <aside className="market-orders" aria-busy={isRivalTurn}>
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

          {isRivalTurn && (
            <div className="rival-phase" role="status" aria-live="polite">
              <span>Rival turn</span>
              <strong>{activeMove?.side === "rival" ? `${visibleMoveLabel(activeMove)} · ${activeMove.nodeName}` : `${rival?.name ?? "Rival"} is choosing…`}</strong>
              <small>{session.rivalOps > 0 ? `${session.rivalOps} move${session.rivalOps === 1 ? "" : "s"} remaining` : "Returning control to you"}</small>
            </div>
          )}

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
                  margin: "6px 0 10px",
                  color: "#375043",
                  display: "block",
                  lineHeight: 1.4,
                }}
              >
                <strong>{TRAIT_INFO[selectedNode.trait]?.icon} {TRAIT_INFO[selectedNode.trait]?.label}:</strong>{" "}
                {TRAIT_INFO[selectedNode.trait]?.desc}
              </div>
            )}

            {/* Move selector: one short job statement per action. */}
            <div className="market-move-picker">
              <span className="eyebrow" style={{ fontSize: 9 }}>Move</span>
              <div className="tactical-selector">
                <button
                  type="button"
                  className={`tactical-btn ${selectedTactic === "pitch" ? "active" : ""}`}
                  onClick={() => setSelectedTactic("pitch")}
                  disabled={!canExpand || locked}
                  title={TACTICS.pitch.description}
                >
                  <span>{TACTICS.pitch.icon} Promote</span>
                  <small>Open · 1 Ops</small>
                </button>
                <button
                  type="button"
                  className={`tactical-btn ${selectedTactic === "fortify" ? "active" : ""}`}
                  onClick={() => setSelectedTactic("fortify")}
                  disabled={!canReinforce || locked}
                  title={TACTICS.fortify.description}
                >
                  <span>{TACTICS.fortify.icon} Reinforce</span>
                  <small>Hold · 1 Ops</small>
                </button>
                <button
                  type="button"
                  className={`tactical-btn ${selectedTactic === "poach" ? "active" : ""}`}
                  onClick={() => setSelectedTactic("poach")}
                  disabled={!canContest || locked}
                  title={TACTICS.poach.description}
                >
                  <span>{TACTICS.poach.icon} Poach</span>
                  <small>Take · 2 Ops</small>
                </button>
              </div>
            </div>

            {/* Current vs Projected Shares */}
            <div className="capture-detail" style={{ margin: "12px 0 10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", margin: "4px 0" }}>
                <span>You: <strong>{selectedNode.playerShare}%</strong></span>
                <span>Rival: <strong>{selectedNode.rivalShare}%</strong></span>
                <span>Open: <strong>{selectedNode.neutralShare}%</strong></span>
              </div>

              {/* Action Projected Preview */}
              {preview && (
                <div
                  style={{
                    background: "#d6e0ce",
                    padding: "8px 10px",
                    borderRadius: 3,
                    marginTop: 8,
                    fontSize: 11,
                  }}
                >
                  <span style={{ display: "block", color: "#486350", fontWeight: 600 }}>After move</span>
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
                      ★ Dominance secured
                    </small>
                  )}
                </div>
              )}
            </div>

            {/* Calculation Breakdown */}
            {preview && <details className="market-calculation"
              style={{
                fontSize: 10,
                borderTop: "1px solid #c9d6bf",
                paddingTop: 6,
                margin: "8px 0",
                color: "#526a57",
              }}
            >
              <summary>Why this result?</summary>
              <div className="market-calculation-body">
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Base Conversion</span>
                  <strong>{preview.breakdown.base}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Product Fit</span>
                  <strong>{preview.breakdown.fit >= 0 ? `+${preview.breakdown.fit}` : preview.breakdown.fit}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Connected Support</span>
                  <strong>+{preview.breakdown.support}</strong>
                </div>
                {excessLoad > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#b55333" }}>
                    <span>Scale Overload</span>
                    <strong>-{preview.breakdown.overloadPenalty}%</strong>
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
            </details>}

            {/* Main Action Button */}
            <button
              className="primary-action"
              data-tutorial="market-capture"
              disabled={!isExecutable}
              title={disabledReason || `${TACTICS[selectedTactic].label} ${selectedNode.name}`}
              onClick={handleExecuteAction}
            >
              {TACTICS[selectedTactic].label} {selectedNode.name} · {cost} Ops
            </button>
            <small className="disabled-reason">
              {isRivalTurn ? "Wait for the rival to finish." : disabledReason || TACTICS[selectedTactic].description}
            </small>
          </div>

          {/* Feedback & Last Action Summary */}
          <p className="market-feedback" role="status">
            {feedback}
          </p>

          {/* Tactical Combat Feed: useful on demand, but not another always-on wall of text. */}
          {session.actionLog && session.actionLog.length > 0 && (
            <details className="market-feed" role="log" aria-label="Tactical battle feed">
              <summary>Recent moves · {session.actionLog.length}</summary>
              <div className="market-feed-body">
                {session.actionLog.slice(0, 4).map((entry) => (
                  <div key={entry.id} className="market-feed-item">
                    <span className={`market-feed-tag ${entry.side}`}>
                      {entry.side === "player" ? "YOU" : entry.side === "rival" ? "RIVAL" : "NETWORK"}
                    </span>
                    <span>{entry.summary}</span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Strategic End Turn Button */}
          <button
            className={`end-turn ${playerOps === 0 && !isRivalTurn ? "ready-to-end" : ""}`}
            data-tutorial="market-end-turn"
            disabled={locked}
            onClick={handleEndTurn}
          >
            {playerOps > 0
              ? `End turn · Bank 1 Ops`
              : `Rival turn`}
          </button>
          <small style={{ fontSize: 9, color: "#62796c", display: "block", marginTop: 5, lineHeight: 1.4 }}>
            {playerOps > 0
              ? "Bank one unused Ops and defend held segments."
              : "The rival moves automatically."}
          </small>

          {/* Market Strategy Rules Compact Help */}
          <details className="market-help">
            <summary>How the market works</summary>
            <p>Promote opens a connected segment. Reinforce strengthens and protects your foothold. Poach takes on a reachable rival hold. Resistance reduces influence gained.</p>
          </details>
        </aside>
      </div>
    </main>
  );
}
