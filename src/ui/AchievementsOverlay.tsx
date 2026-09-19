import { useState, useEffect } from "react";
import { ACHIEVEMENTS } from "../data/achievements";
import { getLifetimeAchievements } from "../simulation/achievements";
import { useGame } from "../state/store";

const FILTER_OPTIONS = [
  { value: "all", label: "All records" },
  { value: "unlocked", label: "Unlocked" },
  { value: "locked", label: "Locked" },
] as const;

const CATEGORY_OPTIONS = ["all", "founders", "chaos", "growth", "business", "tech"] as const;

function categoryLabel(category: string) {
  return category === "all" ? "All categories" : category;
}

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
      className="achievement-toast"
      role="status"
      aria-live="polite"
      onClick={() => {
        dismiss();
        setAchievementsOpen(true);
      }}
      title="Click to view all achievements"
    >
      <div className="achievement-toast-mark" aria-hidden="true">
        {recent.icon}
      </div>
      <div className="achievement-toast-copy">
        <span className="achievement-eyebrow">New entry · achievement unlocked</span>
        <strong>{recent.name}</strong>
        <p>{recent.description}</p>
      </div>
      <div className="achievement-toast-points">
        <strong>+{recent.points.toLocaleString()}</strong>
        <span>pts</span>
      </div>
      <button
        type="button"
        className="achievement-toast-close"
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
    // A secret record should not reveal its category through category filters.
    if (category !== "all" && a.secret && !isUnlocked) return false;
    if (category !== "all" && a.category !== category) return false;
    return true;
  });

  return (
    <div className="achievement-overlay">
      <section className="achievement-sheet" role="dialog" aria-modal="true" aria-labelledby="achievements-title">
        <header className="achievement-sheet-header">
          <div>
            <div className="achievement-kicker">
              <span>Company archive</span>
              <span>{game?.company.name ?? "Permanent record"}</span>
            </div>
            <div className="achievement-title-row">
              <span className="achievement-crest" aria-hidden="true">🏆</span>
              <div>
                <h2 id="achievements-title">Achievements</h2>
                <p>Milestones worth keeping on the wall.</p>
              </div>
            </div>
          </div>
          <div className="achievement-summary" aria-label={`${unlockedCount} of ${totalCount} achievements recorded`}>
            <strong>{unlockedCount}</strong>
            <span>of {totalCount}<small>recorded</small></span>
          </div>
          <button
            type="button"
            className="achievement-sheet-close"
            onClick={() => setOpen(false)}
            aria-label="Close achievements"
          >
            ✕
          </button>
        </header>

        <div className="achievement-progress">
          <div className="achievement-progress-label">
            <span>Lifetime completion</span>
            <strong>{progressPercent}%</strong>
          </div>
          <div className="achievement-progress-track" aria-hidden="true">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="achievement-controls">
          <div className="achievement-filter-group" role="group" aria-label="Achievement status">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={filter === option.value}
                className="achievement-filter"
                onClick={() => setFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="achievement-categories" role="group" aria-label="Achievement category">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                aria-pressed={category === cat}
                className="achievement-category-filter"
                onClick={() => setCategory(cat)}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        <div className="achievement-list panel-scroll">
          {filtered.length === 0 ? (
            <div className="achievement-empty">No achievements match the selected filters.</div>
          ) : (
            <div className="achievement-grid">
              {filtered.map((item) => {
                const isUnlocked = allUnlocked.has(item.id);
                const isUnknown = Boolean(item.secret && !isUnlocked);
                const isSpecial = item.id === "the-social-network" && isUnlocked;

                return (
                  <article
                    key={item.id}
                    className={`achievement-card ${isUnlocked ? "is-unlocked" : "is-locked"} ${isUnknown ? "is-unknown" : ""} ${isSpecial ? "is-special" : ""}`}
                  >
                    <div className="achievement-card-topline">
                      <div className="achievement-icon" aria-hidden="true">{isUnknown ? "?" : item.icon}</div>
                      <span className="achievement-status">
                        {isUnlocked ? "✓ recorded" : isUnknown ? "unknown" : "locked"}
                      </span>
                    </div>
                    {isUnknown ? (
                      <div className="achievement-card-copy">
                        <div className="achievement-card-meta">
                          <span>Classified record</span>
                        </div>
                        <h3>Unknown</h3>
                        <p className="achievement-subtitle">Details sealed</p>
                        <p className="achievement-description">Unlock this record to reveal what happened.</p>
                      </div>
                    ) : (
                      <div className="achievement-card-copy">
                        <div className="achievement-card-meta">
                          <span>{categoryLabel(item.category)}</span>
                          <span>{item.points.toLocaleString()} pts</span>
                        </div>
                        <h3>{item.name}{isSpecial ? <em>Iconic</em> : null}</h3>
                        <p className="achievement-subtitle">{item.subtitle}</p>
                        <p className="achievement-description">{item.description}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <footer className="achievement-sheet-footer">
          <span>Achievements persist across every company in this browser.</span>
          <button type="button" className="achievement-footer-close" onClick={() => setOpen(false)}>
            Close archive
          </button>
        </footer>
      </section>
    </div>
  );
}
