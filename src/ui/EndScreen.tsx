import { useState } from "react";
import { identity } from "../branding/identity";
import { submitRunToLeaderboard } from "../leaderboard/client";
import { calculateGameScore } from "../leaderboard/scoring";
import { ACHIEVEMENTS, evaluateAchievements } from "../simulation/achievements";
import { biography, ENDINGS } from "../simulation/endings";
import { startupTierForValuation, type StartupTierId } from "../simulation/startupTiers";
import type { GameState } from "../simulation/types";
import { useGame } from "../state/store";
import { money } from "./format";
import { GameButton } from "./shared/controls";
import { useAnimatedMetric } from "./feel/useAnimatedMetric";

const TIER_CONFIG: Record<StartupTierId, { color: string; bg: string; border: string }> = {
  hectocorn: { color: "text-amber-200", bg: "bg-amber-400/15", border: "border-amber-300/70" },
  decacorn: { color: "text-orange-200", bg: "bg-orange-400/15", border: "border-orange-300/70" },
  unicorn: { color: "text-violet-200", bg: "bg-violet-400/15", border: "border-violet-300/70" },
  "scale-up": { color: "text-sky-200", bg: "bg-sky-400/15", border: "border-sky-300/70" },
  "venture-backed": { color: "text-emerald-200", bg: "bg-emerald-400/15", border: "border-emerald-300/70" },
  "early-stage": { color: "text-zinc-200", bg: "bg-white/10", border: "border-white/30" },
};

export function EndScreen({ game }: { game: GameState }) {
  const setScreen = useGame((s) => s.setScreen);
  const setLeaderboardOpen = useGame((s) => s.setLeaderboardOpen);

  const ending = ENDINGS[game.endingId ?? ""] ?? { title: "Closed", line: game.endingNote ?? "" };
  const lines = biography(game);

  const unlocked = evaluateAchievements(game);
  const unlockedIds = unlocked.map((a) => a.id);
  const breakdown = calculateGameScore(game, unlockedIds);
  const peakValuation = Math.max(game.stats.peakValuation, game.company.valuation);
  const startupTier = startupTierForValuation(peakValuation);
  const tierStyle = TIER_CONFIG[startupTier.id];
  const bestProduct = [...game.products].sort((a, b) => b.earnedRevenue - a.earnedRevenue)[0];
  const bestMonth = [...game.history].sort((a, b) => b.revenue - a.revenue)[0];
  const operatingYears = Math.max(1, game.clock.date.year - 2022);
  const founderOwnership = Math.max(0, game.company.ownership.founder * 100);
  const animatedRevenue = useAnimatedMetric(breakdown.totalScore, game.settings.reducedMotion, 1, 250, true);

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
    <div className={`end-screen panel-scroll h-full min-h-0 overflow-y-auto overscroll-contain bg-[#efe8dc] text-[#1b2230] ${game.settings.reducedMotion ? "reduced-motion" : ""}`}>
      <div className="mx-auto max-w-3xl px-6 py-14 pb-24">
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

        {/* Lifetime revenue record */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-[#1b2230]/20 bg-[#1b2230] p-7 text-[#fcf9f1] shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#c4622d]">
                Lifetime Revenue
              </span>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-mono text-4xl font-extrabold tracking-tight text-[#ffc58a] sm:text-5xl">
                  {money(animatedRevenue)}
                </span>
              </div>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-[#9aa3b2]">
                The leaderboard is ranked by total revenue collected. No multipliers, bonuses, or mystery points.
              </p>
            </div>

            <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${tierStyle.border} ${tierStyle.bg}`}>
              <div className="text-right font-mono">
                <div className="text-[10px] uppercase tracking-widest text-[#9aa3b2]">Company class</div>
                <div className={`text-lg font-bold ${tierStyle.color}`}>
                  {startupTier.label}
                </div>
                <div className="mt-0.5 text-[9px] text-[#9aa3b2]">{startupTier.description}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Narrative Biography Summary */}
        <div className="mt-8 rounded-xl border border-[#cfc5b6] bg-[#f9f4e7] p-6 text-sm leading-relaxed text-[#3a4454] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="flex items-baseline justify-between gap-4 border-b border-[#cfc5b6] pb-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c4622d]">Official Chronicle</h3>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8b8173]">Operating record · {operatingYears} {operatingYears === 1 ? "year" : "years"}</span>
          </div>
          <div className="mt-3 space-y-2">
            {lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <dl className="mt-6 grid grid-cols-2 border-l border-t border-[#cfc5b6] font-mono text-xs sm:grid-cols-4">
            {[
              ["Revenue generated", money(game.company.lifetimeRevenue), "all time"],
              ["Operating spend", money(game.company.lifetimeCosts), "all time"],
              ["Peak valuation", money(peakValuation), startupTier.label],
              ["Capital raised", money(game.funding.raisedTotal), `${founderOwnership.toFixed(1)}% founder owned`],
              ["Best month", money(bestMonth?.revenue ?? game.company.lastMonthlyRevenue), bestMonth ? `${bestMonth.month}/${bestMonth.year}` : "not recorded"],
              ["Top product", bestProduct?.name ?? "No launch", bestProduct ? `${money(bestProduct.earnedRevenue)} earned` : "—"],
              ["People", `${game.stats.employeesHired} hired`, `${game.stats.employeesFired} departures · ${game.stats.peakEmployees} peak`],
              ["Built", `${game.stats.productsLaunched} products`, `${game.stats.researchCompleted} research · ${game.stats.acquisitions} acquisitions`],
            ].map(([label, value, note]) => (
              <div key={label} className="min-w-0 border-b border-r border-[#cfc5b6] bg-white/30 p-3.5">
                <dt className="text-[9px] uppercase tracking-[0.14em] text-[#8b8173]">{label}</dt>
                <dd className="mt-1 truncate font-bold text-[#1b2230]" title={value}>{value}</dd>
                <dd className="mt-0.5 truncate text-[9px] text-[#8b8173]" title={note}>{note}</dd>
              </div>
            ))}
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
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[#c4622d]">Recorded</span>
                    </div>
                    <p className="mt-0.5 text-xs text-[#5d6573]">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue publishing terminal */}
        <div className="mt-10 rounded-2xl border border-[#c4622d]/40 bg-[#1b2230] p-6 text-[#fcf9f1] shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#c4622d]">
                Revenue Ledger
              </span>
              <h3 className="font-display text-2xl font-bold text-paper">Publish revenue record</h3>
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
                Your validated lifetime revenue of <strong className="text-paper">{money(breakdown.totalScore)}</strong> is now on the global leaderboard.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <GameButton tone="primary" onClick={() => setLeaderboardOpen(true)}>
                  View the leaderboard →
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
              View validated run leaderboard
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
