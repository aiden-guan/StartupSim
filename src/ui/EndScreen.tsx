import { useState } from "react";
import { identity } from "../branding/identity";
import { submitRunToLeaderboard } from "../leaderboard/client";
import { calculateGameScore } from "../leaderboard/scoring";
import type { ScoreTier } from "../leaderboard/types";
import { ACHIEVEMENTS, evaluateAchievements } from "../simulation/achievements";
import { biography, ENDINGS } from "../simulation/endings";
import type { GameState } from "../simulation/types";
import { useGame } from "../state/store";
import { money } from "./format";
import { GameButton } from "./shared/controls";

const TIER_CONFIG: Record<ScoreTier, { title: string; color: string; bg: string; border: string }> = {
  SSS: { title: "Supreme Titan", color: "text-amber-300", bg: "bg-amber-500/20", border: "border-amber-400" },
  SS: { title: "Frontier Pioneer", color: "text-purple-300", bg: "bg-purple-500/20", border: "border-purple-400" },
  S: { title: "Unicorn Master", color: "text-blue-300", bg: "bg-blue-500/20", border: "border-blue-400" },
  A: { title: "Elite Operator", color: "text-emerald-300", bg: "bg-emerald-500/20", border: "border-emerald-400" },
  B: { title: "Venture Veteran", color: "text-yellow-300", bg: "bg-yellow-500/20", border: "border-yellow-400" },
  C: { title: "Founder", color: "text-zinc-300", bg: "bg-zinc-500/20", border: "border-zinc-400" },
};

export function EndScreen({ game }: { game: GameState }) {
  const setScreen = useGame((s) => s.setScreen);
  const setLeaderboardOpen = useGame((s) => s.setLeaderboardOpen);

  const ending = ENDINGS[game.endingId ?? ""] ?? { title: "Closed", line: game.endingNote ?? "" };
  const lines = biography(game);

  const unlocked = evaluateAchievements(game);
  const unlockedIds = unlocked.map((a) => a.id);
  const breakdown = calculateGameScore(game, unlockedIds);
  const tierInfo = TIER_CONFIG[breakdown.tier] ?? TIER_CONFIG.C;

  const [showBreakdown, setShowBreakdown] = useState(false);

  // Initial callsign derived from founder name
  const defaultCallsign = game.founder.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 16) || "FOUNDER";

  const [callsign, setCallsign] = useState(defaultCallsign);
  const [quote, setQuote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedRank, setPublishedRank] = useState<number | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function handlePublish() {
    if (isSubmitting || publishedRank !== null) return;
    setIsSubmitting(true);
    setPublishError(null);

    try {
      const res = await submitRunToLeaderboard(game, callsign, quote);
      if (res.success && res.entry) {
        setPublishedRank(res.rank ?? 1);
      } else {
        setPublishError(res.error || "Submission rejected by security check");
      }
    } catch (err: any) {
      setPublishError(err?.message || "Failed to publish run");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-full overflow-auto bg-[#efe8dc] text-[#1b2230] panel-scroll">
      <div className="mx-auto max-w-3xl px-6 py-14">
        {/* Postmortem Eyebrow & Ending Title */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-[#c4622d]">
            {identity.shortTitle} · postmortem & final audit
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold tracking-tight text-[#1b2230]">
            {ending.title}
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-[#5d6573]">{ending.line}</p>
        </div>

        {/* Arcade Final Score Card */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#1b2230]/20 bg-[#1b2230] p-7 text-[#fcf9f1] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#c4622d]">
                Arcade High Score
              </span>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-mono text-5xl font-extrabold tracking-tight text-[#ffc58a]">
                  {breakdown.totalScore.toLocaleString()}
                </span>
                <span className="font-mono text-sm font-semibold text-[#9aa3b2]">PTS</span>
              </div>
            </div>

            {/* Rank Tier Badge */}
            <div className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${tierInfo.border} ${tierInfo.bg}`}>
              <div className="text-right font-mono">
                <div className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Performance Tier</div>
                <div className={`text-base font-bold ${tierInfo.color}`}>
                  TIER {breakdown.tier} · {tierInfo.title}
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Score Breakdown */}
          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-2 font-mono text-xs text-[#d8d1c4] transition-colors hover:text-[#ffc58a]"
            >
              <span>{showBreakdown ? "▾ Hide" : "▸ Show"} Itemized Score Breakdown</span>
            </button>

            {showBreakdown && (
              <div className="mt-4 grid grid-cols-1 gap-2.5 rounded-xl border border-white/10 bg-white/5 p-4 font-mono text-xs sm:grid-cols-2">
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-[#9aa3b2]">Valuation Points</span>
                  <span className="font-semibold text-paper">+{breakdown.valuationPoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-[#9aa3b2]">Cash Reserves</span>
                  <span className="font-semibold text-paper">+{breakdown.cashPoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-[#9aa3b2]">ARR Yield</span>
                  <span className="font-semibold text-paper">+{breakdown.arrPoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-[#9aa3b2]">Ending Bonus ({ending.title})</span>
                  <span className="font-semibold text-paper">+{breakdown.endingBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-[#9aa3b2]">Survival Bonus</span>
                  <span className="font-semibold text-paper">+{breakdown.survivalBonus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-[#9aa3b2]">Achievements ({unlocked.length})</span>
                  <span className="font-semibold text-paper">+{breakdown.achievementPoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-[#9aa3b2]">Reputation (Trust & Hype)</span>
                  <span className="font-semibold text-paper">+{breakdown.reputationPoints.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 py-1">
                  <span className="text-[#9aa3b2]">Scandals Penalty</span>
                  <span className={`font-semibold ${breakdown.scandalPenalty > 0 ? "text-red-400" : "text-[#9aa3b2]"}`}>
                    -{breakdown.scandalPenalty.toLocaleString()}
                  </span>
                </div>
                {breakdown.speedMultiplier > 1 && (
                  <div className="flex justify-between py-1 sm:col-span-2 text-emerald-400">
                    <span>Speed / Efficiency Velocity Multiplier</span>
                    <span className="font-bold">×{breakdown.speedMultiplier.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Narrative Biography Summary */}
        <div className="mt-8 rounded-xl border border-[#cfc5b6] bg-[#f9f4e7] p-6 text-sm leading-relaxed text-[#3a4454]">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c4622d]">Official Chronicle</h3>
          <div className="mt-3 space-y-2">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[#cfc5b6] pt-4 font-mono text-xs sm:grid-cols-4">
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Cash</dt>
              <dd className="font-bold text-[#1b2230]">{money(game.company.cash)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Valuation</dt>
              <dd className="font-bold text-[#1b2230]">{money(game.company.valuation)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Hype / Trust</dt>
              <dd className="font-bold text-[#1b2230]">
                {game.company.hype.toFixed(0)} / {game.company.trust.toFixed(0)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Final Year</dt>
              <dd className="font-bold text-[#1b2230]">{game.clock.date.year}</dd>
            </div>
          </dl>
        </div>

        {/* Achievements Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-[#c4622d]">
              Achievements Unlocked ({unlocked.length} / {ACHIEVEMENTS.length})
            </h3>
          </div>

          {unlocked.length === 0 ? (
            <p className="mt-3 text-sm italic text-[#5d6573]">
              No achievements unlocked in this run. Scale further, innovate deeper, or survive longer in your next venture.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {unlocked.map((ach) => (
                <div
                  key={ach.id}
                  className="flex items-start gap-3 rounded-xl border border-[#cfc5b6] bg-[#fdfbf7] p-3.5 shadow-sm"
                >
                  <span className="text-2xl">{ach.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-mono text-xs font-bold text-[#1b2230]">{ach.title}</h4>
                      <span className="font-mono text-[10px] font-semibold text-[#c4622d]">
                        +{ach.points.toLocaleString()} PTS
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#5d6573]">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Arcade Publishing Terminal */}
        <div className="mt-10 rounded-2xl border border-[#c4622d]/40 bg-[#1b2230] p-6 text-[#fcf9f1] shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c4622d]">
                Arcade Terminal
              </span>
              <h3 className="font-display text-2xl font-bold text-paper">Publish to Hall of Fame</h3>
            </div>
            <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] text-emerald-400">
              ✓ Anti-Cheat Invariant Verified
            </span>
          </div>

          {publishedRank !== null ? (
            <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/15 p-5 text-center">
                <div className="font-mono text-3xl font-extrabold text-amber-300">
                RECORDED · RANK #{publishedRank}
              </div>
              <p className="mt-2 text-sm text-[#d8d1c4]">
                Your verified score of <strong className="text-paper">{breakdown.totalScore.toLocaleString()} PTS</strong> is now in the global ledger.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <GameButton tone="primary" onClick={() => setLeaderboardOpen(true)}>
                  View the ledger →
                </GameButton>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#9aa3b2]">
                    Founder Callsign / Handle (Max 16 chars)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2 font-mono text-sm tracking-wider text-paper placeholder:text-[#5d6573] focus:border-[#c4622d] focus:outline-none"
                    placeholder="E.G. SATOSHI"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#9aa3b2]">
                    Run Motto / Postmortem Quote (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={90}
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/20 bg-white/5 px-3.5 py-2 font-mono text-sm text-paper placeholder:text-[#5d6573] focus:border-[#c4622d] focus:outline-none"
                    placeholder="E.g. Shipped before the credit crunch."
                  />
                </div>
              </div>

              {publishError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                  {publishError}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="font-mono text-[11px] text-[#9aa3b2]">
                  Run ID: <span className="text-[#d8d1c4]">{game.meta.runId || "local"}</span>
                </div>
                <GameButton
                  tone="primary"
                  disabled={isSubmitting || !callsign.trim()}
                  onClick={() => void handlePublish()}
                  className="px-6 py-2.5 font-mono text-sm font-bold tracking-wider"
                >
                  {isSubmitting ? "Verifying & Publishing..." : "PUBLISH TO LEADERBOARD"}
                </GameButton>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#cfc5b6] pt-6">
          <button
            type="button"
            className="font-mono text-xs font-semibold uppercase tracking-wider text-[#c4622d] hover:underline"
            onClick={() => setLeaderboardOpen(true)}
          >
            View verified run ledger
          </button>

          <button
            type="button"
            className="rounded-lg bg-[#1b2230] px-6 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:bg-[#253043]"
            onClick={() => setScreen("title")}
          >
            Start another company →
          </button>
        </div>
      </div>
    </div>
  );
}
