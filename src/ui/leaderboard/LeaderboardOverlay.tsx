import { useEffect, useState } from "react";
import { identity } from "../../branding/identity";
import { fetchLeaderboard } from "../../leaderboard/client";
import type { LeaderboardEntry, LeaderboardFilter, ScoreTier } from "../../leaderboard/types";
import { ACHIEVEMENT_MAP } from "../../simulation/achievements";
import { useGame } from "../../state/store";
import { money } from "../format";

const FILTERS: { id: LeaderboardFilter; label: string }[] = [
  { id: "all", label: "All records" },
  { id: "unicorn", label: "Unicorn" },
  { id: "ipo", label: "Public" },
  { id: "monopoly", label: "Monopoly" },
  { id: "quiet-profit", label: "Quiet profit" },
  { id: "bootstrapped", label: "Bootstrapped" },
];

const TIER_STYLES: Record<ScoreTier, { marker: string; text: string; label: string }> = {
  SSS: { marker: "bg-[#c9a227]", text: "text-[#8a6810]", label: "Titan" },
  SS: { marker: "bg-[#8c7761]", text: "text-[#665340]", label: "Pioneer" },
  S: { marker: "bg-[#9c6648]", text: "text-[#7c432b]", label: "Unicorn" },
  A: { marker: "bg-[#2e704e]", text: "text-[#2e704e]", label: "Operator" },
  B: { marker: "bg-[#b78b42]", text: "text-[#806329]", label: "Veteran" },
  C: { marker: "bg-[#7d8587]", text: "text-[#5c6466]", label: "Founder" },
};

type LeaderboardSource = "global" | "local";

export function LeaderboardOverlay({ onClose }: { onClose?: () => void }) {
  const setLeaderboardOpen = useGame((state) => state.setLeaderboardOpen);
  const [filter, setFilter] = useState<LeaderboardFilter>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [source, setSource] = useState<LeaderboardSource>("global");
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [retry, setRetry] = useState(0);

  const handleClose = () => {
    onClose?.();
    if (!onClose) setLeaderboardOpen(false);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchLeaderboard(filter, 100)
      .then((result) => {
        if (!active) return;
        setEntries(result.entries);
        setSource(result.source ?? "global");
        setSelectedEntry(null);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setEntries([]);
        setSource("global");
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filter, retry]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#1b2230]/65 p-3 backdrop-blur-[3px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="leaderboard-title"
    >
      <div className="relative flex h-[min(92dvh,820px)] w-full max-w-6xl flex-col overflow-hidden rounded-[4px] border border-[#b9ad9d] bg-paper text-ink shadow-[0_24px_80px_rgba(27,34,48,0.35)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-copper" />

        <header className="flex shrink-0 items-start justify-between gap-6 border-b border-line bg-[#f9f4e7] px-5 py-5 sm:px-8 sm:py-6">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-copper">
              {identity.shortTitle} · validated runs
            </p>
            <h2 id="leaderboard-title" className="mt-2 font-display text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
              Leaderboard
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              Real companies. Real outcomes. No legends in the record.
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-4">
            <div className="hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted sm:flex">
              <span className={`h-2 w-2 rounded-full ${source === "global" ? "bg-ledger" : "bg-copper"}`} />
              {source === "global" ? "Global leaderboard" : "Local records"}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="border-b border-ink/30 pb-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted transition-colors hover:border-copper hover:text-copper"
            >
              Close <span className="ml-1 text-[9px]">[Esc]</span>
            </button>
          </div>
        </header>

        <div className="flex shrink-0 flex-col gap-3 border-b border-line bg-[#e5dccf] px-5 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-8">
          <div className="flex min-w-0 gap-5 overflow-x-auto" role="tablist" aria-label="Leaderboard filters">
            {FILTERS.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(item.id)}
                  className={`whitespace-nowrap border-b-2 pb-2 pt-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "border-copper text-ink"
                      : "border-transparent text-muted hover:border-ink/25 hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {source === "global" ? "Public records" : "Offline · local records only"}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <section className="panel-scroll min-w-0 flex-1 overflow-auto px-4 py-4 sm:px-8 sm:py-6" aria-label="Published runs">
            {loading ? (
              <LoadingRows />
            ) : entries.length === 0 ? (
              <EmptyLeaderboard source={source} onRetry={() => setRetry((value) => value + 1)} />
            ) : (
              <>
                <div className="mb-3 hidden grid-cols-[4rem_minmax(0,1fr)_minmax(8rem,0.8fr)_7rem_7rem] gap-4 border-b border-line px-4 pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted sm:grid">
                  <span>Rank</span>
                  <span>Company / founder</span>
                  <span>Outcome</span>
                  <span className="text-right">Peak value</span>
                  <span className="text-right">Score</span>
                </div>
                <div className="divide-y divide-line/80 border-y border-line">
                  {entries.map((entry) => (
                    <LeaderboardRow
                      key={entry.id}
                      entry={entry}
                      selected={selectedEntry?.id === entry.id}
                      onSelect={() => setSelectedEntry(entry)}
                    />
                  ))}
                </div>
                <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                  {entries.length} validated {entries.length === 1 ? "record" : "records"} · ranked by score, then arrival
                </p>
                {selectedEntry ? (
                  <div className="mt-5 lg:hidden">
                    <RunDossier entry={selectedEntry} onClose={() => setSelectedEntry(null)} compact />
                  </div>
                ) : null}
              </>
            )}
          </section>

          {selectedEntry ? (
            <aside className="hidden w-[min(360px,34%)] shrink-0 overflow-auto border-l border-[#3c4653] bg-ink text-paper lg:block">
              <RunDossier entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
            </aside>
          ) : (
            <aside className="hidden w-[min(260px,26%)] shrink-0 flex-col justify-end border-l border-line bg-[#e5dccf] p-6 lg:flex">
              <div className="border-t border-copper pt-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-copper">Archive note</p>
                <p className="mt-2 font-display text-lg leading-snug text-ink">
                  The first clean run is worth more than a room full of invented legends.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Select a record to open its postmortem dossier.
                </p>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="border-y border-line" aria-label="Loading records" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-[3.5rem_minmax(0,1fr)_6rem] gap-4 border-b border-line/70 px-4 py-5 last:border-b-0 sm:grid-cols-[4rem_minmax(0,1fr)_8rem_7rem]">
          <span className="h-5 w-8 bg-ink/10" />
          <span className="space-y-2">
            <span className="block h-4 w-2/5 bg-ink/10" />
            <span className="block h-3 w-3/5 bg-ink/10" />
          </span>
          <span className="hidden h-4 w-20 bg-ink/10 sm:block" />
          <span className="h-5 w-16 justify-self-end bg-ink/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyLeaderboard({ source, onRetry }: { source: LeaderboardSource; onRetry: () => void }) {
  return (
    <div className="grid min-h-[360px] place-items-center border-y border-line px-6 py-12 text-center">
      <div className="max-w-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center border border-copper/50 font-display text-2xl text-copper">—</div>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.22em] text-copper">
          {source === "global" ? "No ranked runs yet" : "Global leaderboard unavailable"}
        </p>
        <h3 className="mt-2 font-display text-2xl text-ink">
          {source === "global" ? "The first record is still waiting." : "Only local records are available."}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {source === "global"
            ? "Finish a company, survive the postmortem, and publish a validated run to take your place."
            : "Reconnect to the global leaderboard to see published runs. Your local records remain on this device."}
        </p>
        {source === "local" ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 border-b border-copper pb-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-copper hover:text-ink"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  selected,
  onSelect,
}: {
  entry: LeaderboardEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const tier = TIER_STYLES[entry.tier] ?? TIER_STYLES.C;
  const rank = entry.rank ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group grid w-full grid-cols-[3.5rem_minmax(0,1fr)_6rem] gap-4 px-4 py-4 text-left transition-colors sm:grid-cols-[4rem_minmax(0,1fr)_minmax(8rem,0.8fr)_7rem_7rem] ${
        selected ? "bg-[#e5dccf]" : "bg-[#f3ecdf] hover:bg-[#e8decf]"
      }`}
      aria-pressed={selected}
    >
      <div className="flex items-start gap-2">
        <span className="font-mono text-lg tabular-nums text-ink">{String(rank).padStart(2, "0")}</span>
        <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tier.marker}`} title={`${entry.tier} · ${tier.label}`} />
      </div>

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-sm font-semibold tracking-[0.08em] text-ink">{entry.handle}</span>
          <span className={`hidden shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] sm:inline ${tier.text}`}>
            {entry.tier}
          </span>
        </div>
        <p className="mt-1 truncate font-display text-sm text-muted">{entry.companyName}</p>
        <p className="mt-0.5 truncate text-[10px] text-muted/80">Founder · {entry.founderName}</p>
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="truncate font-display text-sm text-ink">{entry.endingTitle}</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{entry.year} · {entry.daysElapsed} days</p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="font-mono text-sm tabular-nums text-ink">{money(entry.valuation)}</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">peak value</p>
      </div>

      <div className="text-right">
        <p className="font-mono text-base font-semibold tabular-nums text-copper">{entry.score.toLocaleString()}</p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">points</p>
      </div>
    </button>
  );
}

function RunDossier({ entry, onClose, compact = false }: { entry: LeaderboardEntry; onClose: () => void; compact?: boolean }) {
  const tier = TIER_STYLES[entry.tier] ?? TIER_STYLES.C;
  const rank = entry.rank ? `#${entry.rank}` : "Unranked";

  return (
    <div className={`${compact ? "bg-ink text-paper" : "min-h-full"} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`font-mono text-[9px] uppercase tracking-[0.2em] ${compact ? "text-[#d89869]" : "text-copper"}`}>
            Run dossier · {rank}
          </p>
          <h3 className={`mt-2 font-mono text-2xl font-semibold tracking-[0.08em] ${compact ? "text-paper" : "text-ink"}`}>
            {entry.handle}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`font-mono text-[10px] uppercase tracking-[0.16em] ${compact ? "text-fog hover:text-white" : "text-muted hover:text-ink"}`}
        >
          Close
        </button>
      </div>

      <p className={`mt-1 font-display text-lg ${compact ? "text-fog" : "text-muted"}`}>{entry.companyName}</p>
      <p className={`mt-1 text-xs ${compact ? "text-[#aeb5ba]" : "text-muted"}`}>Founder · {entry.founderName}</p>

      <div className={`mt-5 border-y py-4 ${compact ? "border-white/15" : "border-line"}`}>
        <p className={`font-mono text-[9px] uppercase tracking-[0.18em] ${compact ? "text-[#aeb5ba]" : "text-muted"}`}>Outcome</p>
        <p className={`mt-1 font-display text-xl ${compact ? "text-paper" : "text-ink"}`}>{entry.endingTitle}</p>
        <p className={`mt-1 font-mono text-[10px] uppercase tracking-[0.12em] ${compact ? "text-[#d89869]" : tier.text}`}>
          Tier {entry.tier} · {tier.label}
        </p>
      </div>

      {entry.quote ? (
        <blockquote className={`mt-5 border-l-2 px-3 font-display text-base italic leading-relaxed ${compact ? "border-[#d89869] text-fog" : "border-copper text-muted"}`}>
          “{entry.quote}”
        </blockquote>
      ) : null}

      <div className={`mt-5 grid grid-cols-2 gap-px border ${compact ? "border-white/10 bg-white/10" : "border-line bg-line"}`}>
        <DossierStat label="Score" value={`${entry.score.toLocaleString()} pts`} compact={compact} accent />
        <DossierStat label="Peak value" value={money(entry.valuation)} compact={compact} />
        <DossierStat label="Annual ARR" value={money(entry.arr)} compact={compact} />
        <DossierStat label="Treasury" value={money(entry.cash)} compact={compact} />
        <DossierStat label="Products" value={String(entry.productsCount)} compact={compact} />
        <DossierStat label="Employees" value={String(entry.employeesCount)} compact={compact} />
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className={`font-mono text-[9px] uppercase tracking-[0.18em] ${compact ? "text-[#aeb5ba]" : "text-muted"}`}>Achievements</p>
          <span className={`font-mono text-[10px] ${compact ? "text-[#d89869]" : "text-copper"}`}>{entry.achievements.length} unlocked</span>
        </div>
        {entry.achievements.length ? (
          <div className="mt-3 space-y-2">
            {entry.achievements.map((id) => {
              const achievement = ACHIEVEMENT_MAP.get(id);
              if (!achievement) return null;
              return (
                <div key={id} className={`flex items-center gap-2 border px-2.5 py-2 ${compact ? "border-white/10 bg-white/5" : "border-line bg-[#f3ecdf]"}`}>
                  <span className="text-base">{achievement.icon}</span>
                  <span className={`min-w-0 flex-1 truncate font-mono text-[10px] ${compact ? "text-fog" : "text-ink"}`}>{achievement.title}</span>
                  <span className={`font-mono text-[9px] ${compact ? "text-[#aeb5ba]" : "text-muted"}`}>+{achievement.points.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={`mt-3 text-xs italic ${compact ? "text-[#aeb5ba]" : "text-muted"}`}>No achievements recorded.</p>
        )}
      </div>

      <div className={`mt-6 border-t pt-4 font-mono text-[9px] uppercase tracking-[0.14em] ${compact ? "border-white/15 text-[#9eb3a0]" : "border-line text-ledger"}`}>
        <span className="mr-2">●</span> Verified run signature accepted
      </div>
    </div>
  );
}

function DossierStat({ label, value, compact, accent = false }: { label: string; value: string; compact: boolean; accent?: boolean }) {
  return (
    <div className={`p-3 ${compact ? "bg-ink" : "bg-[#f3ecdf]"}`}>
      <p className={`font-mono text-[9px] uppercase tracking-[0.12em] ${compact ? "text-[#aeb5ba]" : "text-muted"}`}>{label}</p>
      <p className={`mt-1 truncate font-mono text-sm tabular-nums ${accent ? (compact ? "text-[#d89869]" : "text-copper") : compact ? "text-paper" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
