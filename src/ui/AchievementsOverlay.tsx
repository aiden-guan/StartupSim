import { useState, useEffect } from "react";
import { ACHIEVEMENTS } from "../data/achievements";
import { getLifetimeAchievements } from "../simulation/achievements";
import { useGame } from "../state/store";
import { GameButton } from "./shared/controls";

export function AchievementToast() {
  const recent = useGame((s) => s.recentAchievement);
  const dismiss = useGame((s) => s.dismissAchievement);
  const setAchievementsOpen = useGame((s) => s.setAchievementsOpen);

  useEffect(() => {
    if (!recent) return;
    const timer = setTimeout(() => {
      dismiss();
    }, 4500);
    return () => clearTimeout(timer);
  }, [recent, dismiss]);

  if (!recent) return null;

  return (
    <div
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3.5 px-5 py-3.5 rounded-lg shadow-2xl bg-[#1b2433] border-2 border-[#c9a227] text-white cursor-pointer transition-all hover:scale-105 animate-bounce-once"
      role="status"
      aria-live="polite"
      onClick={() => {
        dismiss();
        setAchievementsOpen(true);
      }}
      title="Click to view all achievements"
    >
      <div className="text-3xl flex items-center justify-center p-1.5 rounded-md bg-[#c9a227]/20 border border-[#c9a227]/40 shrink-0">
        {recent.icon}
      </div>
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#c9a227]">
            🏆 Achievement Unlocked
          </span>
        </div>
        <strong className="text-sm font-display font-semibold text-[#efe8dc]">{recent.name}</strong>
        <p className="text-xs text-[#9aa3b2] max-w-sm line-clamp-1">{recent.description}</p>
      </div>
      <button
        type="button"
        className="ml-2 text-xs text-[#9aa3b2] hover:text-white p-1"
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  );
}

export function AchievementsOverlay() {
  const open = useGame((s) => s.achievementsOpen);
  const setOpen = useGame((s) => s.setAchievementsOpen);
  const game = useGame((s) => s.game);

  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [category, setCategory] = useState<string>("all");

  if (!open) return null;

  // Unlocked in current game or lifetime
  const currentGameAchievements = new Set(game?.achievements ?? []);
  const lifetimeAchievements = new Set(getLifetimeAchievements());
  const allUnlocked = new Set([...currentGameAchievements, ...lifetimeAchievements]);

  const totalCount = ACHIEVEMENTS.length;
  const unlockedCount = ACHIEVEMENTS.filter((a) => allUnlocked.has(a.id)).length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const filtered = ACHIEVEMENTS.filter((a) => {
    const isUnlocked = allUnlocked.has(a.id);
    if (filter === "unlocked" && !isUnlocked) return false;
    if (filter === "locked" && isUnlocked) return false;
    if (category !== "all" && a.category !== category) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="game-panel w-[min(720px,96vw)] max-h-[90vh] flex flex-col p-6 rounded-xl border border-[#c4622d]/30 shadow-2xl text-[#efe8dc]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#cfc5b6]/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h2 className="font-display text-2xl tracking-wide font-bold">Achievements</h2>
              <p className="text-xs text-[#9aa3b2]">
                Permanent company milestones and boardroom conquests
              </p>
            </div>
          </div>
          <button
            type="button"
            className="text-lg p-2 text-[#9aa3b2] hover:text-white transition-colors"
            onClick={() => setOpen(false)}
            aria-label="Close achievements"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="my-4 p-3.5 rounded-lg bg-[#141b26] border border-[#cfc5b6]/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#c9a227] font-semibold">
              {unlockedCount} of {totalCount} Completed
            </span>
            <span className="text-[#9aa3b2]">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#1b2433] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c4622d] to-[#c9a227] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 text-xs border-b border-[#cfc5b6]/15">
          <div className="flex items-center gap-1.5 bg-[#141b26] p-1 rounded-md">
            {(["all", "unlocked", "locked"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`px-3 py-1 rounded font-medium transition-all ${
                  filter === f
                    ? "bg-[#c4622d] text-white shadow-sm"
                    : "text-[#9aa3b2] hover:text-[#efe8dc]"
                }`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {["all", "founders", "chaos", "growth", "business", "tech"].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-all ${
                  category === cat
                    ? "bg-[#c9a227]/30 text-[#c9a227] font-bold border border-[#c9a227]/50"
                    : "text-[#9aa3b2] hover:text-white"
                }`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 panel-scroll">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[#9aa3b2] text-sm">
              No achievements match the selected filters.
            </div>
          ) : (
            filtered.map((item) => {
              const isUnlocked = allUnlocked.has(item.id);
              const isSpecial = item.id === "the-social-network";

              return (
                <div
                  key={item.id}
                  className={`flex items-start gap-3.5 p-3.5 rounded-lg border transition-all ${
                    isUnlocked
                      ? isSpecial
                        ? "bg-[#1f2839] border-[#c9a227] shadow-[0_0_15px_rgba(201,162,39,0.15)]"
                        : "bg-[#182130] border-[#c4622d]/40 shadow-sm"
                      : "bg-[#141b26]/70 border-[#cfc5b6]/10 opacity-60"
                  }`}
                >
                  <div
                    className={`text-2xl p-2 rounded-md flex items-center justify-center shrink-0 ${
                      isUnlocked
                        ? isSpecial
                          ? "bg-[#c9a227]/20 border border-[#c9a227]/50"
                          : "bg-[#c4622d]/20 border border-[#c4622d]/40"
                        : "bg-[#1b2433] border border-white/5 grayscale"
                    }`}
                  >
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-display text-sm font-semibold text-[#efe8dc] flex items-center gap-2">
                        {item.name}
                        {isSpecial && (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#c9a227]/20 text-[#c9a227] border border-[#c9a227]/30">
                            Iconic
                          </span>
                        )}
                      </h4>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          isUnlocked
                            ? "bg-[#1f6b4a]/40 text-[#4ade80] border border-[#4ade80]/30 font-bold"
                            : "bg-black/30 text-[#9aa3b2]"
                        }`}
                      >
                        {isUnlocked ? "✓ Unlocked" : "Locked"}
                      </span>
                    </div>
                    <p className="text-xs text-[#9aa3b2] mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#cfc5b6]/20 flex justify-end">
          <GameButton onClick={() => setOpen(false)}>Close</GameButton>
        </div>
      </div>
    </div>
  );
}
