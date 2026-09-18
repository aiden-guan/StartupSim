import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../../leaderboard/client";
import type { LeaderboardEntry, LeaderboardFilter, ScoreTier } from "../../leaderboard/types";
import { ACHIEVEMENT_MAP } from "../../simulation/achievements";
import { useGame } from "../../state/store";
import { money } from "../format";
import { GameButton } from "../shared/controls";

const TIER_STYLES: Record<ScoreTier, { bg: string; text: string; border: string }> = {
  SSS: { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-400/50" },
  SS: { bg: "bg-purple-500/20", text: "text-purple-300", border: "border-purple-400/50" },
  S: { bg: "bg-blue-500/20", text: "text-blue-300", border: "border-blue-400/50" },
  A: { bg: "bg-emerald-500/20", text: "text-emerald-300", border: "border-emerald-400/50" },
  B: { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-400/50" },
  C: { bg: "bg-zinc-500/20", text: "text-zinc-300", border: "border-zinc-400/50" },
};

export function LeaderboardOverlay({ onClose }: { onClose?: () => void }) {
  const setLeaderboardOpen = useGame((s) => s.setLeaderboardOpen);
  const [filter, setFilter] = useState<LeaderboardFilter>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);

  const handleClose = () => {
    if (onClose) onClose();
    else setLeaderboardOpen(false);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchLeaderboard(filter, 60)
      .then((res) => {
        if (active) {
          setEntries(res.entries);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const FILTERS: { id: LeaderboardFilter; label: string }[] = [
    { id: "all", label: "All Runs" },
    { id: "unicorn", label: "Unicorns ($1B+)" },
    { id: "ipo", label: "Public (IPO)" },
    { id: "monopoly", label: "Monopolies" },
    { id: "quiet-profit", label: "Quiet Profit" },
    { id: "bootstrapped", label: "Bootstrapped" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111722]/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-title"
    >
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#1b2230] text-[#fcf9f1] shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-8 py-5">
          <div>
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#c4622d]">
              Arcade Hall of Fame · Global Records
            </span>
            <h2 id="leaderboard-title" className="mt-1 font-display text-3xl font-bold tracking-tight text-paper">
              Compounding Leaderboard
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] text-[#9aa3b2] sm:inline">
              Verified Runs Only · Anti-Cheat Secured
            </span>
            <GameButton className="border-white/20 px-4 py-2 hover:bg-white/10" onClick={handleClose}>
              Close [ESC]
            </GameButton>
          </div>
        </header>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 bg-[#161c27] px-8 py-3">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-full px-3.5 py-1 font-mono text-xs transition-colors ${
                  active
                    ? "bg-[#c4622d] font-semibold text-white shadow-sm"
                    : "bg-white/5 text-[#9aa3b2] hover:bg-white/10 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Rankings Table */}
          <div className="flex-1 overflow-auto p-6 panel-scroll">
            {loading ? (
              <div className="flex h-64 items-center justify-center font-mono text-sm text-[#9aa3b2]">
                Synchronizing global records...
              </div>
            ) : entries.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <p className="font-display text-xl text-[#d8d1c4]">No runs found in this category.</p>
                <p className="mt-1 text-sm text-[#9aa3b2]">Complete a run and publish your score to be the first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => {
                  const rank = entry.rank ?? 0;
                  const isGold = rank === 1;
                  const isSilver = rank === 2;
                  const isBronze = rank === 3;
                  const isSelected = selectedEntry?.id === entry.id;
                  const tierStyle = TIER_STYLES[entry.tier] ?? TIER_STYLES.C;

                  return (
                    <div
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className={`group flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-[#c4622d] bg-[#c4622d]/15 shadow-md"
                          : "border-white/10 bg-[#212a3b]/60 hover:border-white/25 hover:bg-[#253043]"
                      }`}
                    >
                      {/* Left: Rank & Callsign */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${
                            isGold
                              ? "bg-amber-400 text-black shadow-lg shadow-amber-500/30"
                              : isSilver
                                ? "bg-slate-300 text-black"
                                : isBronze
                                  ? "bg-[#c4622d] text-white"
                                  : "bg-white/10 text-[#9aa3b2]"
                          }`}
                        >
                          #{rank}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-bold tracking-wider text-paper">
                              {entry.handle}
                            </span>
                            <span
                              className={`rounded border px-1.5 py-0.2 font-mono text-[10px] font-bold ${tierStyle.border} ${tierStyle.bg} ${tierStyle.text}`}
                            >
                              {entry.tier}
                            </span>
                            {entry.verified && (
                              <span className="text-xs text-emerald-400" title="Verified Run">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="truncate font-sans text-xs text-[#9aa3b2]">
                            {entry.companyName} · <span className="text-[#c7cfdc]">{entry.endingTitle}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Key Stats */}
                      <div className="hidden sm:flex items-center gap-6 text-right font-mono text-xs">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[#9aa3b2]">Peak Valuation</div>
                          <div className="font-semibold text-paper">{money(entry.valuation)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-[#9aa3b2]">Badges</div>
                          <div className="flex justify-end gap-1">
                            {entry.achievements.slice(0, 4).map((id) => {
                              const ach = ACHIEVEMENT_MAP.get(id);
                              return (
                                <span key={id} title={ach?.title} className="text-sm">
                                  {ach?.icon ?? "🏅"}
                                </span>
                              );
                            })}
                            {entry.achievements.length > 4 && (
                              <span className="text-[10px] text-[#9aa3b2]">
                                +{entry.achievements.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Arcade Score */}
                      <div className="ml-4 text-right">
                        <div className="font-mono text-lg font-bold tracking-tight text-[#ffc58a]">
                          {entry.score.toLocaleString()}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-[#9aa3b2]">
                          POINTS
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Detail Pane (When an entry is inspected) */}
          {selectedEntry && (
            <div className="hidden w-80 shrink-0 flex-col overflow-auto border-l border-white/10 bg-[#161c27] p-6 lg:flex panel-scroll">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#c4622d]">
                  Run Postmortem Audit
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="font-mono text-xs text-[#9aa3b2] hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mt-3">
                <h3 className="font-mono text-2xl font-bold tracking-wider text-paper">
                  {selectedEntry.handle}
                </h3>
                <p className="font-display text-base text-[#d8d1c4]">
                  {selectedEntry.companyName}
                </p>
                <p className="text-xs text-[#9aa3b2]">Founder: {selectedEntry.founderName}</p>
              </div>

              {selectedEntry.quote && (
                <blockquote className="mt-4 rounded-lg border-l-2 border-[#c4622d] bg-white/5 p-3 text-xs italic text-[#d8d1c4]">
                  "{selectedEntry.quote}"
                </blockquote>
              )}

              <div className="mt-5 space-y-3 rounded-xl border border-white/10 bg-[#1b2230] p-4 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#9aa3b2]">Score</span>
                  <span className="font-bold text-[#ffc58a]">{selectedEntry.score.toLocaleString()} PTS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa3b2]">Rank Tier</span>
                  <span className="font-bold text-paper">{selectedEntry.tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa3b2]">Ending</span>
                  <span className="font-semibold text-paper">{selectedEntry.endingTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa3b2]">Peak Valuation</span>
                  <span>{money(selectedEntry.valuation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa3b2]">Annual ARR</span>
                  <span>{money(selectedEntry.arr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa3b2]">Treasury Cash</span>
                  <span>{money(selectedEntry.cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa3b2]">Sim Days</span>
                  <span>{selectedEntry.daysElapsed} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa3b2]">Products Launched</span>
                  <span>{selectedEntry.productsCount}</span>
                </div>
              </div>

              {/* Achievements list */}
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-[11px] uppercase tracking-widest text-[#9aa3b2]">
                    Achievements ({selectedEntry.achievements.length})
                  </h4>
                </div>
                <div className="mt-3 space-y-2">
                  {selectedEntry.achievements.map((id) => {
                    const ach = ACHIEVEMENT_MAP.get(id);
                    if (!ach) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/5 p-2.5"
                      >
                        <span className="text-xl">{ach.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h5 className="font-mono text-xs font-semibold text-paper">{ach.title}</h5>
                            <span className="font-mono text-[10px] text-[#c4622d]">+{ach.points.toLocaleString()}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] leading-snug text-[#9aa3b2]">{ach.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 border-t border-white/10 pt-4 text-center font-mono text-[10px] text-emerald-400">
                ✓ Cryptographically Verified Run
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
