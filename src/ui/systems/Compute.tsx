import { useState } from "react";
import { models } from "../../data/models";
import { calculateModelImpact } from "../../simulation/modelImpact";
import type { DepartmentId, GameState } from "../../simulation/types";
import { isModelAvailable, providerForModel } from "../../simulation/effects";
import { useGame } from "../../state/store";
import { fixedComputeCost, inferenceCoverage, monthlyCompute } from "../../simulation/derived";
import { allocateTrainingCompute, leftoverCapacityDaily, weeklyInferenceDemand } from "../../simulation/compute";
import { modelTags } from "../../visuals/registry";
import { modelPricePerMTok, money } from "../format";
import { GameButton } from "../shared/controls";
import { CompanyMark } from "../visuals/CompanyMark";
import { MiniaturePreview } from "../visuals/MiniaturePreview";
import { ModelGlyph } from "../visuals/ModelGlyph";
import { deriveEnvironmentVisualState } from "../../game3d/environment/environmentVisualState";
import { computeRackLayout, requestedComputeRacks } from "../../game3d/environment/computeLayout";

const DEPTS: DepartmentId[] = ["engineering", "support", "sales", "marketing", "finance", "recruiting", "legal", "research", "management"];
const SERVICE_PRODUCT_STATUSES = new Set(["active", "mature", "declining"]);

export function ComputePanel({ game }: { game: GameState }) {
  const dispatch = useGame((state) => state.dispatch);
  const [selectedId, setSelectedId] = useState(game.currentModelId);
  const demand = weeklyInferenceDemand(game);
  const coverage = inferenceCoverage(game);
  const load = coverage > 0 ? Math.min(100, demand / coverage * 100) : 0;
  const training = allocateTrainingCompute(game);
  const leftover = leftoverCapacityDaily(game);
  const outage = game.providerOutages.find((item) => item.untilTick > game.clock.tick);
  const affectedProducts = outage ? game.products.filter((product) => SERVICE_PRODUCT_STATUSES.has(product.status) && providerForModel(product.modelId) === outage.provider) : [];
  const outageDays = outage ? Math.max(1, outage.untilTick - game.clock.tick) : 0;
  const visibleModels = models.filter((model) => model.provider !== "You" || game.ownedModels.includes(model.id));
  const selected = visibleModels.find((model) => model.id === selectedId) ?? visibleModels.find((model) => model.id === game.currentModelId) ?? visibleModels[0]!;
  const selectedAvailable = isModelAvailable(game, selected.id);
  const visualState = deriveEnvironmentVisualState(game);
  const rackPlan = computeRackLayout(game.company.officeLevel, requestedComputeRacks(visualState));

  return <div className="compute-console">
    <div className="workspace-intro">
      <div><span className="eyebrow">Infrastructure control</span><h3>Keep the lights on.</h3></div>
      <span className={`system-online ${outage ? "disrupted" : ""}`}>{outage ? `● ${outage.provider} disruption` : "● Systems online"}</span>
    </div>
    {outage && <section className="provider-outage-banner" role="status"><CompanyMark name={outage.provider} /><div><span className="eyebrow">Active gameplay event</span><strong>{outage.provider} is unavailable</strong><p>{affectedProducts.length ? `${affectedProducts.length} active product${affectedProducts.length > 1 ? "s are" : " is"} exposed. Revenue is reduced until you migrate or service returns.` : "No active product is currently exposed. The provider remains unavailable for new selections."}</p><small>{outageDays} days remaining · choose a fallback in the Inbox event</small></div></section>}
    <section className="capacity-display" data-tutorial="compute-capacity"><div className="rack-graphic">{Array.from({ length: 5 }, (_, index) => <div key={index}><i /><i /><span /></div>)}</div><div><span className="eyebrow">Self-hosted inference</span><strong>{money(coverage)}<small>equivalent API cost covered / week</small></strong><div className="progress-track"><i style={{ width: `${load}%` }} /></div><p>{coverage ? `${Math.round(load)}% capacity in use` : "Using hosted APIs · no dedicated GPUs"} · {money(Math.max(0, demand - coverage))}/week served by APIs</p><small className="compute-footprint-note">Office footprint · {rackPlan.shown} of {rackPlan.requested} rack{rackPlan.requested === 1 ? "" : "s"} shown{rackPlan.overflow ? ` · ${rackPlan.overflow} stays off-floor` : ""}</small></div></section>
    <div className="compute-metrics">{[["API credits", money(game.compute.apiCredits)], ["Training budget / day", money(game.compute.apiCredits + leftover)], ["Training demand / day", money(training.demand)], ["Fixed cloud / month", money(fixedComputeCost(game))], ["Total compute / month", money(monthlyCompute(game))]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    {training.blocked && <p className="inline-warning">Blocked by compute. Product and research work cannot advance until you rent GPUs, buy a cluster, or restore API credits.</p>}
    {training.demand > 0 && !training.blocked && training.ratio < 1 && <p className="inline-warning">Training compute is oversubscribed. Development is running at {Math.round(training.ratio * 100)}% speed. Add capacity or pause a project.</p>}
    <div className="gpu-controls"><div><h4>Rent GPU capacity</h4><p>Each GPU covers $800 of weekly inference and leftover capacity can train models. Unused racks still cost money.</p></div><div className="stepper"><button aria-label="Rent fewer GPUs" disabled={game.compute.rentedGpus === 0} onClick={() => dispatch({ type: "rentGpus", count: game.compute.rentedGpus - 1 })}>−</button><output>{game.compute.rentedGpus}</output><button aria-label="Rent more GPUs" onClick={() => dispatch({ type: "rentGpus", count: game.compute.rentedGpus + 1 })}>+</button></div></div>
    <div className="cluster-row"><p>Owned cluster · {game.compute.ownedCluster} units<br /><small>Four units add $480/week of coverage with no rental charge.</small></p><GameButton disabled={game.company.cash < 400_000} title={game.company.cash < 400_000 ? `Need ${money(400_000 - game.company.cash)} more` : "Add four owned compute units"} onClick={() => dispatch({ type: "buyCluster" })}>Buy cluster · $400k</GameButton></div>

    <section className="model-selector">
      <div className="choice-section-heading"><div><span className="eyebrow">Default for new products</span><h3>Choose your model.</h3></div><p>Provider identity, operating cost, and the strongest tradeoffs first. Exact model stats remain one layer deeper.</p></div>
      <div className="model-choice-layout">
        <div className="model-cards">{visibleModels.map((model) => {
          const available = isModelAvailable(game, model.id);
          const providerOutage = game.providerOutages.find((item) => item.provider === model.provider && item.untilTick > game.clock.tick);
          const days = Math.max(1, (providerOutage?.untilTick ?? game.clock.tick) - game.clock.tick);
          return <button key={model.id} className={`${selected.id === model.id ? "inspecting" : ""} ${game.currentModelId === model.id ? "selected" : ""} ${available ? "" : "unavailable"}`} aria-pressed={selected.id === model.id} onClick={() => setSelectedId(model.id)}><ModelGlyph modelId={model.id} /><span className="model-card-copy"><small>{model.provider}</small><strong>{model.name}</strong><span>{modelPricePerMTok(model.costPerMTok)} / million tokens</span><span className="model-tags">{modelTags(model).map((tag) => <em key={tag}>{tag}</em>)}</span><b>{available ? game.currentModelId === model.id ? "Current default" : "Available" : `${model.provider} offline · ${days}d`}</b></span></button>;
        })}</div>
        <aside className={`model-detail ${selectedAvailable ? "" : "unavailable"}`}>
          {(() => {
            const impact = calculateModelImpact({ model: selected, technologies: game.company.technologies });
            const devPct = Math.round((impact.devSpeedMultiplier - 1) * 100);
            const capPct = Math.round((impact.demandMultiplier - 1) * 100);
            return (
              <>
                <div className="detail-heading"><div><span className="eyebrow">{selected.provider}</span><h3>{selected.name}</h3></div><CompanyMark name={selected.provider} /></div>
                <MiniaturePreview item={{ kind: "model", id: selected.id }} label={`${selected.name} model miniature`} />
                <div className="model-strengths">{modelTags(selected).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <p>{selected.open ? "Open weights: gives you hosting independence and a 10% self-hosting token cost discount." : selected.capability >= 9 ? "Frontier intelligence: highest market quality and demand conversion, priced for work that justifies premium compute." : selected.speed >= 8 ? "High velocity: accelerates product development speed and keeps runtime fast." : "A balanced hosted model for reliable everyday product workloads."}</p>
                <div className="model-strategic-impact" style={{ margin: '10px 0', padding: '10px', background: '#eef2e7', borderRadius: 6, fontSize: 11 }}>
                  <span className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>Strategic profile</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', lineHeight: 1.4 }}>
                    <div><strong>Dev speed:</strong> {devPct >= 0 ? `+${devPct}%` : `${devPct}%`}</div>
                    <div><strong>Baseline demand:</strong> {capPct >= 0 ? `+${capPct}%` : `${capPct}%`}</div>
                    <div><strong>Reliability:</strong> {selected.reliability}/10 ({(impact.reliabilityContribution * 100).toFixed(0)} pts)</div>
                    <div><strong>Effective token:</strong> {modelPricePerMTok(impact.effectiveTokenPrice)}/M</div>
                  </div>
                  {impact.strengths.length > 0 && <div style={{ marginTop: 6, color: '#3d6148' }}>✓ {impact.strengths[0]}</div>}
                  {impact.tradeoffs.length > 0 && <div style={{ marginTop: 2, color: '#8f4f38' }}>⚠ {impact.tradeoffs[0]}</div>}
                </div>
                <div className="model-summary"><span><small>Cost</small><strong>{modelPricePerMTok(selected.costPerMTok)} / MTok</strong></span><span><small>Best fit</small><strong>{modelTags(selected)[0]}</strong></span></div>
                <details className="advanced-details"><summary>Compare exact stats</summary><dl>{[["Capability", selected.capability], ["Speed", selected.speed], ["Reliability", selected.reliability], ["Context", selected.context], ["Safety", selected.safety]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value} / 10</dd></div>)}</dl></details>
                {!selectedAvailable && <p className="inline-requirement">{selected.provider} is offline. Choose another provider.</p>}
                <GameButton className="detail-action" tone="primary" disabled={!selectedAvailable || game.currentModelId === selected.id} title={!selectedAvailable ? `${selected.provider} is unavailable` : game.currentModelId === selected.id ? "Already the default model" : `Use ${selected.name} for new products`} onClick={() => dispatch({ type: "setCompanyModel", modelId: selected.id })}>{game.currentModelId === selected.id ? "Current default" : "Set as default"}</GameButton>
              </>
            );
          })()}
        </aside>
      </div>
    </section>
    {game.unlocks.automation && <section><h4 className="console-heading">Department automation</h4><div className="automation-grid">{DEPTS.map((department) => <label key={department}>{department}<output>{game.company.automation[department]}%</output><input aria-label={`${department} automation`} type="range" min="0" max="100" step="10" value={game.company.automation[department]} onChange={(event) => dispatch({ type: "setAutomation", department, percent: Number(event.target.value) })} /></label>)}</div><div className="choice-row">{(["engineering", "support", "sales", "research"] as const).map((kind) => <GameButton key={kind} onClick={() => dispatch({ type: "deployAiWorker", kind })}>Deploy {kind} agent</GameButton>)}</div></section>}
  </div>;
}
