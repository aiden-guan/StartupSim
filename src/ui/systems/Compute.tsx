import { useState } from "react";
import { models } from "../../data/models";
import { calculateModelImpact } from "../../simulation/modelImpact";
import type { DepartmentId, GameState } from "../../simulation/types";
import { isModelAvailable, providerForModel } from "../../simulation/effects";
import { useGame } from "../../state/store";
import { fixedComputeCost, inferenceCoverage, monthlyCompute, MAX_RENTED_GPUS, OWNED_COMPUTE_PURCHASE_OPTIONS, OWNED_COMPUTE_UNIT_COST, OWNED_COMPUTE_UNIT_WEEKLY_COVERAGE, RENTED_GPU_MONTHLY_COST, RENTED_GPU_WEEKLY_COVERAGE } from "../../simulation/derived";
import { allocateTrainingCompute, availableTrainingCompute, rentedGpusNeededForTraining, weeklyInferenceDemand } from "../../simulation/compute";
import { modelTags } from "../../visuals/registry";
import { compact, modelPricePerMTok, money } from "../format";
import { GameButton } from "../shared/controls";
import { CompanyMark } from "../visuals/CompanyMark";
import { MiniaturePreview } from "../visuals/MiniaturePreview";
import { ModelGlyph } from "../visuals/ModelGlyph";

const DEPTS: DepartmentId[] = ["engineering", "support", "sales", "marketing", "finance", "recruiting", "legal", "research", "management"];
const SERVICE_PRODUCT_STATUSES = new Set(["active", "mature", "declining"]);
const RENTED_GPU_ADJUSTMENTS = [-100, -10, -1, 1, 10, 100] as const;

function ownedComputeCost(units: number): number {
  return units * OWNED_COMPUTE_UNIT_COST;
}

export function ComputePanel({ game }: { game: GameState }) {
  const dispatch = useGame((state) => state.dispatch);
  const [selectedId, setSelectedId] = useState(game.currentModelId);
  const demand = weeklyInferenceDemand(game);
  const coverage = inferenceCoverage(game);
  const training = allocateTrainingCompute(game);
  const trainingCapacity = availableTrainingCompute(game);
  const trainingPercent = training.demand > 0 ? Math.min(100, Math.round(trainingCapacity / training.demand * 100)) : 100;
  const trainingShortfall = Math.max(0, training.demand - trainingCapacity);
  const gpusNeeded = rentedGpusNeededForTraining(game);
  const inferencePercent = demand > 0 ? Math.min(100, Math.round(coverage / demand * 100)) : coverage > 0 ? 100 : 0;
  const inferenceShortfall = Math.max(0, demand - coverage);
  const rentedGpuCost = game.compute.rentedGpus * RENTED_GPU_MONTHLY_COST;
  const rentedGpuCoverage = game.compute.rentedGpus * RENTED_GPU_WEEKLY_COVERAGE;
  const ownedPurchaseOptions = OWNED_COMPUTE_PURCHASE_OPTIONS.map((units) => ({ units, cost: ownedComputeCost(units) }));
  const computeUnits = (value: number) => `${compact(value)} units`;
  const trainingHeadline = training.demand <= 0 ? "No active training" : training.blocked ? "Work is blocked" : training.ratio < 1 ? `${trainingPercent}% training speed` : "Training fully covered";
  const trainingDescription = training.demand <= 0 ? "Start a product or research project to use training capacity." : training.blocked ? "Active product and research work cannot advance until capacity is available." : training.ratio < 1 ? "Your active work is sharing too little capacity. Add GPUs to bring it back to full speed." : "All active product and research work has enough capacity to run at full speed.";
  const outage = game.providerOutages.find((item) => item.untilTick > game.clock.tick);
  const affectedProducts = outage ? game.products.filter((product) => SERVICE_PRODUCT_STATUSES.has(product.status) && providerForModel(product.modelId) === outage.provider) : [];
  const outageDays = outage ? Math.max(1, outage.untilTick - game.clock.tick) : 0;
  const visibleModels = models.filter((model) => model.provider !== "You" || game.ownedModels.includes(model.id));
  const selected = visibleModels.find((model) => model.id === selectedId) ?? visibleModels.find((model) => model.id === game.currentModelId) ?? visibleModels[0]!;
  const selectedAvailable = isModelAvailable(game, selected.id);
  const adjustRentedGpus = (delta: number) => dispatch({ type: "rentGpus", count: Math.max(0, Math.min(MAX_RENTED_GPUS, game.compute.rentedGpus + delta)) });

  return <div className="compute-console">
    <div className="workspace-intro">
      <div><span className="eyebrow">Infrastructure control</span><h3>Keep the lights on.</h3></div>
      <span className={`system-online ${outage ? "disrupted" : ""}`}>{outage ? `● ${outage.provider} disruption` : "● Systems online"}</span>
    </div>
    {outage && <section className="provider-outage-banner" role="status"><CompanyMark name={outage.provider} /><div><span className="eyebrow">Active gameplay event</span><strong>{outage.provider} is unavailable</strong><p>{affectedProducts.length ? `${affectedProducts.length} active product${affectedProducts.length > 1 ? "s are" : " is"} exposed. Revenue is reduced until you migrate or service returns.` : "No active product is currently exposed. The provider remains unavailable for new selections."}</p><small>{outageDays} days remaining · choose a fallback in the Inbox event</small></div></section>}
    <section className={`compute-health ${training.blocked ? "is-blocked" : training.ratio < 1 ? "is-throttled" : "is-ready"}`} data-tutorial="compute-capacity">
      <header className="compute-health-header"><div><span className="eyebrow">Capacity status</span><h3>{trainingHeadline}</h3><p>{trainingDescription}</p></div><strong className="compute-health-mark">{training.demand > 0 ? `${trainingPercent}%` : "Ready"}</strong></header>
      <div className="compute-health-grid">
        <div className="compute-health-metric"><div className="compute-health-metric-header"><span>Training today</span><strong>{training.demand > 0 ? compact(trainingCapacity) : "—"}<small>{training.demand > 0 ? ` / ${compact(training.demand)} units` : " no active demand"}</small></strong></div><div className="progress-track"><i style={{ width: `${training.demand > 0 ? trainingPercent : 0}%` }} /></div><small>{training.demand > 0 ? `${computeUnits(trainingShortfall)} short` : "No active projects"}</small></div>
        <div className="compute-health-metric"><div className="compute-health-metric-header"><span>Inference coverage</span><strong>{money(coverage)}<small> / week</small></strong></div><div className="progress-track"><i style={{ width: `${inferencePercent}%` }} /></div><small>{demand <= 0 ? "No live products" : inferenceShortfall > 0 ? `${money(inferenceShortfall)}/week uses hosted APIs` : `${money(Math.max(0, coverage - demand))}/week headroom`}</small></div>
      </div>
    </section>
    <div className="compute-metrics" aria-label="Compute costs"><div><small>API credits</small><strong>{compact(game.compute.apiCredits)}</strong><span>credits left</span></div><div><small>Fixed cost / month</small><strong>{money(fixedComputeCost(game))}</strong><span>GPU rent + cloud</span></div><div><small>Total compute / month</small><strong>{money(monthlyCompute(game))}</strong><span>fixed + hosted inference</span></div></div>
    <section className="capacity-sources">
      <div className="capacity-sources-heading"><div><span className="eyebrow">Capacity sources</span><h3>Add headroom</h3></div><p>Rent flexible capacity for active work. Buy owned units when you want permanent inference coverage.</p></div>
      <div className="capacity-source-row"><div className="capacity-source-copy"><h4>Rented GPUs</h4><p>Each GPU adds {money(RENTED_GPU_WEEKLY_COVERAGE)}/week of inference coverage. Any unused coverage trains models.</p><small>{money(rentedGpuCoverage)}/week covered · {money(rentedGpuCost)}/month rental</small></div><div className="capacity-stepper" role="group" aria-label="Adjust rented GPUs"><span className="capacity-control-label">GPUs rented</span><div className="capacity-stepper-controls"><div className="capacity-stepper-side" role="group" aria-label="Decrease rented GPUs">{RENTED_GPU_ADJUSTMENTS.filter((step) => step < 0).map((step) => { const amount = Math.abs(step); return <button key={step} className="capacity-step-button" aria-label={`Rent ${amount} fewer GPUs`} disabled={game.compute.rentedGpus < amount} onClick={() => adjustRentedGpus(step)}>−{amount}</button>; })}</div><output className="capacity-stepper-value" aria-live="polite" aria-label="Rented GPUs">{game.compute.rentedGpus}</output><div className="capacity-stepper-side" role="group" aria-label="Increase rented GPUs">{RENTED_GPU_ADJUSTMENTS.filter((step) => step > 0).map((step) => <button key={step} className="capacity-step-button" aria-label={`Rent ${step} more GPUs`} disabled={game.compute.rentedGpus + step > MAX_RENTED_GPUS} onClick={() => adjustRentedGpus(step)}>+{step}</button>)}</div></div></div></div>
      {gpusNeeded > 0 && <p className="capacity-recommendation"><strong>About {gpusNeeded} more rented GPU{gpusNeeded === 1 ? "" : "s"}</strong> would bring active training to full speed at today&apos;s demand. This is a recurring {money(gpusNeeded * RENTED_GPU_MONTHLY_COST)}/month commitment.</p>}
      <div className="capacity-source-row"><div className="capacity-source-copy"><h4>Owned capacity</h4><p>{game.compute.ownedCluster} units owned. Every four units add {money(4 * OWNED_COMPUTE_UNIT_WEEKLY_COVERAGE)}/week of coverage with no monthly rental.</p><small>{money(game.compute.ownedCluster * OWNED_COMPUTE_UNIT_WEEKLY_COVERAGE)}/week current coverage · one-time purchase</small></div><div className="cluster-action"><div className="cluster-purchase-options" role="group" aria-label="Buy owned capacity">{ownedPurchaseOptions.map(({ units, cost }) => { const canAfford = game.company.cash >= cost; return <GameButton key={units} className="cluster-purchase-option" tone="plain" disabled={!canAfford} title={canAfford ? `Buy ${units} units for ${money(cost)}` : `Need ${money(cost - game.company.cash)} more cash`} aria-label={canAfford ? `Buy ${units} owned capacity units for ${money(cost)}` : `Cannot afford ${units} owned capacity units; need ${money(cost - game.company.cash)} more cash`} onClick={() => dispatch({ type: "buyCluster", units })}><strong>+{units} units</strong><small>{money(cost)}</small></GameButton>; })}</div><small>Choose a pack you can cover with cash.</small></div></div>
    </section>

    <details className="compute-advanced-section">
      <summary><span>Default model</span><small>{selected.name} · {selected.provider}</small></summary>
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
                <div className="model-strategic-impact">
                  <span className="eyebrow model-strategic-label">Strategic profile</span>
                  <div className="model-strategic-grid">
                    <div><strong>Dev speed:</strong> {devPct >= 0 ? `+${devPct}%` : `${devPct}%`}</div>
                    <div><strong>Baseline demand:</strong> {capPct >= 0 ? `+${capPct}%` : `${capPct}%`}</div>
                    <div><strong>Reliability:</strong> {selected.reliability}/10 ({(impact.reliabilityContribution * 100).toFixed(0)} pts)</div>
                    <div><strong>Effective token:</strong> {modelPricePerMTok(impact.effectiveTokenPrice)}/M</div>
                  </div>
                  {impact.strengths.length > 0 && <div className="model-strength-callout positive">✓ {impact.strengths[0]}</div>}
                  {impact.tradeoffs.length > 0 && <div className="model-strength-callout negative">⚠ {impact.tradeoffs[0]}</div>}
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
    </details>
    {game.unlocks.automation && <details className="compute-advanced-section"><summary><span>Department automation</span><small>{Object.values(game.company.automation).filter((value) => value > 0).length} departments configured</small></summary><section><div className="automation-grid">{DEPTS.map((department) => <label key={department}>{department}<output>{game.company.automation[department]}%</output><input aria-label={`${department} automation`} type="range" min="0" max="100" step="10" value={game.company.automation[department]} onChange={(event) => dispatch({ type: "setAutomation", department, percent: Number(event.target.value) })} /></label>)}</div><div className="choice-row">{(["engineering", "support", "sales", "research"] as const).map((kind) => <GameButton key={kind} onClick={() => dispatch({ type: "deployAiWorker", kind })}>Deploy {kind} agent</GameButton>)}</div></section></details>}
  </div>;
}
