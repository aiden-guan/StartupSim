import { useEffect, useMemo, useState } from "react";
import { offices } from "../../data/offices";
import { perks } from "../../data/perks";
import { promotionCost, promos } from "../../data/promos";
import type { GameState } from "../../simulation/types";
import { useGame } from "../../state/store";
import { promotionEffort } from "../../visuals/registry";
import { money } from "../format";
import { GameButton } from "../shared/controls";
import { CatalogGlyph } from "../visuals/CatalogGlyph";
import { MiniaturePreview } from "../visuals/MiniaturePreview";

type Mode = "culture" | "promotion";

function EffectSummary({ happiness, productivity, prestige }: { happiness: number; productivity?: number; prestige?: number }) {
  const arrows = (value: number) => value >= 7 ? "↑↑↑" : value >= 4 ? "↑↑" : "↑";
  return <div className="effect-summary" aria-label="Upgrade effects">
    {happiness > 0 && <span>Morale <b>{arrows(happiness)}</b></span>}
    {!!productivity && <span>Productivity <b>{arrows(productivity)}</b></span>}
    {!!prestige && <span>Prestige <b>{arrows(prestige)}</b></span>}
  </div>;
}

export function CulturePromotionPanel({ game }: { game: GameState }) {
  const dispatch = useGame((state) => state.dispatch);
  const [mode, setMode] = useState<Mode>("culture");
  const [perkId, setPerkId] = useState(perks[0]!.id);
  const [promoId, setPromoId] = useState(promos[0]!.id);
  const [recent, setRecent] = useState<string | null>(null);
  useEffect(() => {
    if (!recent) return;
    const timer = window.setTimeout(() => setRecent(null), 720);
    return () => window.clearTimeout(timer);
  }, [recent]);

  const selectedPerk = perks.find((item) => item.id === perkId) ?? perks[0]!;
  const selectedOwned = game.company.perks.find((item) => item.id === selectedPerk.id);
  const currentUpgrade = selectedOwned ? selectedPerk.upgrades[selectedOwned.level] : undefined;
  const nextUpgrade = selectedPerk.upgrades[selectedOwned ? selectedOwned.level + 1 : 0];
  const previewLevel = selectedOwned?.level ?? 0;
  const perkReason = !nextUpgrade
    ? "All upgrades in this category are installed."
    : game.company.officeLevel < nextUpgrade.requiredOffice
      ? `Requires ${offices[nextUpgrade.requiredOffice]?.name ?? `office level ${nextUpgrade.requiredOffice}`}`
      : game.company.cash < nextUpgrade.cost
        ? `Need ${money(nextUpgrade.cost - game.company.cash)} more`
        : "";

  const selectedPromo = promos.find((item) => item.id === promoId) ?? promos[0]!;
  const selectedPromoCost = promotionCost(selectedPromo, game.company.officeLevel);
  const selectedTask = game.tasks.find((task) => task.promoId === selectedPromo.id);
  const activePromoTasks = useMemo(() => game.tasks.filter((task) => task.type === "promo"), [game.tasks]);
  const promoReason = game.company.cash < selectedPromoCost ? `Need ${money(selectedPromoCost - game.company.cash)} more` : "";

  return <div className="culture-workspace">
    <nav className="culture-mode-tabs" aria-label="Culture and promotion modes">
      <button aria-pressed={mode === "culture"} onClick={() => setMode("culture")}>
        <CatalogGlyph kind="perk" id="desks" /><span><strong>Culture</strong><small>Persistent workplace upgrades that appear in your office.</small></span>
      </button>
      <button aria-pressed={mode === "promotion"} disabled={!game.unlocks.promo} title={game.unlocks.promo ? "Open promotion campaigns" : "Promotion unlocks as the company grows"} onClick={() => setMode("promotion")}>
        <CatalogGlyph kind="promo" id="conference" /><span><strong>Promotion</strong><small>{game.unlocks.promo ? "Team campaigns that turn work into company hype." : "Locked until your company is ready to campaign."}</small></span>
      </button>
    </nav>

    {mode === "culture" ? <div className="visual-choice-layout">
      <section>
        <div className="choice-section-heading"><div><span className="eyebrow">Company culture</span><h3>Improve the workplace.</h3></div><p>Choose a category. Each purchase changes company metrics and transforms the workplace.</p></div>
        <div className="culture-catalog">
          {perks.map((perk) => {
            const owned = game.company.perks.find((item) => item.id === perk.id);
            const next = perk.upgrades[owned ? owned.level + 1 : 0];
            const locked = Boolean(next && game.company.officeLevel < next.requiredOffice);
            const state = !next ? "Maxed" : owned ? "Installed" : locked ? "Locked" : "Available";
            return <button key={perk.id} className={`${perk.id === selectedPerk.id ? "selected" : ""} ${recent === perk.id ? "recently-updated" : ""}`} aria-pressed={perk.id === selectedPerk.id} onClick={() => setPerkId(perk.id)}>
              <span className="catalog-illustration"><CatalogGlyph kind="perk" id={perk.id} /></span>
              <span className="catalog-title"><strong>{perk.name}</strong><em>{state}</em></span>
              <small>{next ? `Next · ${next.name}` : perk.upgrades[perk.upgrades.length - 1]?.name}</small>
              <span className="catalog-footer">{locked ? `Requires ${offices[next!.requiredOffice]?.name}` : next ? money(next.cost) : "Collection complete"}</span>
            </button>;
          })}
        </div>
      </section>
      <aside className="choice-detail">
        <div className="detail-heading"><div><span className="eyebrow">{selectedPerk.name}</span><h3>{currentUpgrade?.name ?? nextUpgrade?.name ?? selectedPerk.name}</h3></div><span className="state-stamp">{nextUpgrade ? selectedOwned ? "Installed" : "Available" : "Maxed"}</span></div>
        <MiniaturePreview item={{ kind: "perk", id: selectedPerk.id, level: previewLevel }} label={`${selectedPerk.name} office miniature`} />
        <div className="upgrade-comparison"><div><small>In the office now</small><strong>{currentUpgrade?.name ?? "Nothing installed"}</strong><p>{currentUpgrade?.description ?? "No upgrade installed."}</p></div><div><small>{nextUpgrade ? "Next upgrade" : "Collection"}</small><strong>{nextUpgrade?.name ?? "Fully upgraded"}</strong><p>{nextUpgrade?.description ?? "All upgrades installed."}</p></div></div>
        {nextUpgrade && <EffectSummary happiness={nextUpgrade.happiness} productivity={nextUpgrade.productivity} prestige={nextUpgrade.prestige} />}
        <details className="advanced-details"><summary>Exact effects</summary>{nextUpgrade ? <p>Happiness +{nextUpgrade.happiness}{nextUpgrade.productivity ? ` · Productivity +${nextUpgrade.productivity}` : ""}{nextUpgrade.prestige ? ` · Prestige +${nextUpgrade.prestige}` : ""}. Core simulation values are unchanged.</p> : <p>All upgrades in this category are installed.</p>}</details>
        {perkReason && <p className="inline-requirement">{perkReason}</p>}
        <GameButton tone="primary" className="detail-action" disabled={!!perkReason} title={perkReason || `Install ${nextUpgrade?.name}`} onClick={() => {
          if (!nextUpgrade) return;
          dispatch({ type: "buyPerk", perkId: selectedPerk.id });
          setRecent(selectedPerk.id);
        }}>{nextUpgrade ? `${selectedOwned ? "Upgrade" : "Install"} · ${money(nextUpgrade.cost)}` : "Maxed"}</GameButton>
      </aside>
    </div> : <div className="visual-choice-layout promotion-layout">
      <section>
        <div className="choice-section-heading"><div><span className="eyebrow">Campaign desk</span><h3>Turn attention into momentum.</h3></div><p>Choose campaign → pay launch cost → assign employees → finish the work → gain hype.</p></div>
        {activePromoTasks.length > 0 && <div className="campaign-status" role="status"><div><span className="eyebrow">Campaigns in progress</span><strong>{activePromoTasks.length} active project{activePromoTasks.length > 1 ? "s" : ""}</strong></div><GameButton onClick={() => useGame.getState().setDrawer("tasks")}>Assign staff →</GameButton></div>}
        <div className="promotion-catalog">
          {promos.map((promo) => {
            const task = game.tasks.find((item) => item.promoId === promo.id);
            const cost = promotionCost(promo, game.company.officeLevel);
            return <button key={promo.id} className={promo.id === selectedPromo.id ? "selected" : ""} aria-pressed={promo.id === selectedPromo.id} onClick={() => setPromoId(promo.id)}>
              <span className="catalog-illustration"><CatalogGlyph kind="promo" id={promo.id} /></span>
              <strong>{promo.name}</strong><small>{promotionEffort(promo.requiredProgress)} · {money(cost)}</small>
              <span className="catalog-footer">{task ? `${Math.min(100, task.progress / task.requiredProgress * 100).toFixed(0)}% in progress` : promo.description}</span>
            </button>;
          })}
        </div>
      </section>
      <aside className="choice-detail">
        <div className="detail-heading"><div><span className="eyebrow">{promotionEffort(selectedPromo.requiredProgress)}</span><h3>{selectedPromo.name}</h3></div>{selectedTask && <span className="state-stamp">In progress</span>}</div>
        <MiniaturePreview item={{ kind: "promo", id: selectedPromo.id }} label={`${selectedPromo.name} campaign miniature`} />
        <p className="detail-copy">{selectedPromo.description}</p>
        <div className="campaign-loop" aria-label="Campaign gameplay loop"><span>Launch</span><i>→</i><span>Assign staff</span><i>→</i><span>Complete</span><i>→</i><span>Gain hype</span></div>
        {selectedTask ? <div className="active-campaign-detail"><div className="progress-label"><span>Campaign progress</span><strong>{Math.min(100, selectedTask.progress / selectedTask.requiredProgress * 100).toFixed(0)}%</strong></div><div className="progress-track"><i style={{ width: `${Math.min(100, selectedTask.progress / selectedTask.requiredProgress * 100)}%` }} /></div><GameButton className="detail-action" tone="primary" onClick={() => useGame.getState().setDrawer("tasks")}>Assign staff in Product lab →</GameButton></div> : <><div className="promo-outcome"><span><small>Launch cost</small><strong>{money(selectedPromoCost)}</strong></span><span><small>Team effort</small><strong>{promotionEffort(selectedPromo.requiredProgress).replace(" campaign", "")}</strong></span><span><small>Outcome</small><strong>Company hype ↑</strong></span></div>{promoReason && <p className="inline-requirement">{promoReason}</p>}<GameButton className="detail-action" tone="primary" disabled={!!promoReason} title={promoReason || `Launch ${selectedPromo.name}`} onClick={() => dispatch({ type: "startPromo", promoId: selectedPromo.id })}>Start campaign · {money(selectedPromoCost)}</GameButton></>}
      </aside>
    </div>}
  </div>;
}
