import { useState } from "react";
import { BALANCE } from "../../config/balance";
import { models } from "../../data/models";
import { calculateModelImpact } from "../../simulation/modelImpact";
import type { DepartmentId, GameState } from "../../simulation/types";
import { isModelAvailable, providerForModel } from "../../simulation/effects";
import { useGame } from "../../state/store";
import { DATA_CENTER_MONTHLY_COST, DATA_CENTER_WEEKLY_COVERAGE, fixedComputeCost, inferenceCoverage, monthlyCompute, MAX_RENTED_GPUS, OWNED_COMPUTE_PURCHASE_OPTIONS, OWNED_COMPUTE_UNIT_COST, OWNED_COMPUTE_UNIT_WEEKLY_COVERAGE, RENTED_GPU_MONTHLY_COST, RENTED_GPU_WEEKLY_COVERAGE } from "../../simulation/derived";
import { allocateTrainingCompute, rentedGpusNeededForTraining, trainingCapacityBreakdown, weeklyInferenceDemand } from "../../simulation/compute";
import { modelTags } from "../../visuals/registry";
import { compact, modelPricePerMTok, money } from "../format";
import { GameButton } from "../shared/controls";
import { CompanyMark } from "../visuals/CompanyMark";
import { MiniaturePreview } from "../visuals/MiniaturePreview";
import { ModelGlyph } from "../visuals/ModelGlyph";

const DEPTS: DepartmentId[] = ["engineering", "support", "sales", "marketing", "finance", "recruiting", "legal", "research", "management"];
const DEPARTMENT_LABELS: Record<DepartmentId, string> = {
  engineering: "Engineering",
  support: "Support",
  sales: "Sales",
  marketing: "Marketing",
  finance: "Finance",
  recruiting: "Recruiting",
  legal: "Legal",
  research: "Research",
  management: "Management",
};
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
  const trainingCapacity = trainingCapacityBreakdown(game);
  const trainingPercent = training.demand > 0 ? Math.min(100, Math.round(trainingCapacity.total / training.demand * 100)) : 100;
  const gpusNeeded = rentedGpusNeededForTraining(game);
  const inferencePercent = demand > 0 ? Math.min(100, Math.round(coverage / demand * 100)) : coverage > 0 ? 100 : 0;
  const inferenceShortfall = Math.max(0, demand - coverage);
  const rentedGpuCost = game.compute.rentedGpus * RENTED_GPU_MONTHLY_COST;
  const rentedGpuCoverage = game.compute.rentedGpus * RENTED_GPU_WEEKLY_COVERAGE;
  const ownedPurchaseOptions = OWNED_COMPUTE_PURCHASE_OPTIONS.map((units) => ({ units, cost: ownedComputeCost(units) }));
  const inferenceConsumesHeadroom = training.blocked && inferenceShortfall > 0;
  const trainingHeadline = training.demand <= 0 ? "Ready for work" : training.blocked ? inferenceConsumesHeadroom ? "Inference has taken the headroom" : "Training is blocked" : training.ratio < 1 ? "Training is throttled" : "Training fully covered";
  const trainingDescription = training.demand <= 0 ? "Start a product or research project to see its daily compute need." : training.blocked ? inferenceConsumesHeadroom ? "Live products are using all owned and rented capacity. Hosted credits are empty, so product and research work cannot advance." : "No spare owned or rented capacity is available, and hosted credits are empty. Add capacity to resume work." : training.ratio < 1 ? `Live inference is using most capacity. Work is progressing at ${trainingPercent}%; add ${gpusNeeded || 1} GPU${(gpusNeeded || 1) === 1 ? "" : "s"} to restore full speed.` : "Your live products are covered, with enough headroom to run active product and research work at full speed.";
  const gpuLabel = (amount: number) => `${amount} GPU${amount === 1 ? "" : "s"}`;
  const outage = game.providerOutages.find((item) => item.untilTick > game.clock.tick);
  const affectedProducts = outage ? game.products.filter((product) => SERVICE_PRODUCT_STATUSES.has(product.status) && providerForModel(product.modelId) === outage.provider) : [];
  const outageDays = outage ? Math.max(1, outage.untilTick - game.clock.tick) : 0;
  const visibleModels = models.filter((model) => model.provider !== "You" || game.ownedModels.includes(model.id));
  const selected = visibleModels.find((model) => model.id === selectedId) ?? visibleModels.find((model) => model.id === game.currentModelId) ?? visibleModels[0]!;
  const selectedAvailable = isModelAvailable(game, selected.id);
  const adjustRentedGpus = (delta: number) => dispatch({ type: "rentGpus", count: Math.max(0, Math.min(MAX_RENTED_GPUS, game.compute.rentedGpus + delta)) });
  const configuredDepartments = Object.values(game.company.automation).filter((value) => value > 0).length;

  return <div className="compute-console">
    <div className="workspace-intro">
      <div><span className="eyebrow">Infrastructure control</span><h3>Keep the lights on.</h3></div>
      <span className={`system-online ${outage ? "disrupted" : ""}`}>{outage ? `● ${outage.provider} disruption` : "● Systems online"}</span>
    </div>
    {outage && <section className="provider-outage-banner" role="status"><CompanyMark name={outage.provider} /><div><span className="eyebrow">Active gameplay event</span><strong>{outage.provider} is unavailable</strong><p>{affectedProducts.length ? `${affectedProducts.length} active product${affectedProducts.length > 1 ? "s are" : " is"} exposed. Revenue is reduced until you migrate or service returns.` : "No active product is currently exposed. The provider remains unavailable for new selections."}</p><small>{outageDays} days remaining · choose a fallback in the Inbox event</small></div></section>}
    <section className={`compute-health ${training.blocked ? "is-blocked" : training.ratio < 1 ? "is-throttled" : "is-ready"}`} data-tutorial="compute-capacity">
      <header className="compute-health-header"><div><span className="eyebrow">Capacity status</span><h3>{trainingHeadline}</h3><p>{trainingDescription}</p></div><strong className="compute-health-mark">{training.demand > 0 ? `${trainingPercent}%` : "Ready"}</strong></header>
      <div className="compute-health-grid">
        <div className="compute-health-metric"><div className="compute-health-metric-header"><span>Training headroom / day</span><strong>{training.demand > 0 ? compact(trainingCapacity.total) : "—"}<small>{training.demand > 0 ? ` / ${compact(training.demand)} needed` : " no active demand"}</small></strong></div><div className="progress-track"><i style={{ width: `${training.demand > 0 ? trainingPercent : 0}%` }} /></div><small>{training.demand > 0 ? `${compact(trainingCapacity.gpuHeadroom)} from spare GPUs · ${compact(trainingCapacity.hostedCredits)} hosted credits` : "No active projects"}</small></div>
        <div className="compute-health-metric"><div className="compute-health-metric-header"><span>Live inference / week</span><strong>{money(coverage)}<small>{demand > 0 ? ` / ${money(demand)} needed` : " available"}</small></strong></div><div className="progress-track"><i style={{ width: `${inferencePercent}%` }} /></div><small>{demand <= 0 ? "No live products · all capacity can train" : inferenceShortfall > 0 ? `${money(inferenceShortfall)}/week falls back to cash` : `${money(Math.max(0, coverage - demand))}/week spare capacity feeds training`}</small></div>
      </div>
    </section>
    {gpusNeeded > 0 && <div className="capacity-recommendation capacity-recommendation-primary"><div><strong>Add {gpuLabel(gpusNeeded)} to unblock training</strong><span>{money(gpusNeeded * RENTED_GPU_MONTHLY_COST)}/month recurring · covers live inference first, then frees training headroom.</span></div><GameButton tone="primary" disabled={game.compute.rentedGpus + gpusNeeded > MAX_RENTED_GPUS} aria-label={`Rent ${gpuLabel(gpusNeeded)} to restore full training speed`} onClick={() => adjustRentedGpus(gpusNeeded)}>Rent {gpuLabel(gpusNeeded)} →</GameButton></div>}
    <div className="compute-metrics" aria-label="Compute costs"><div><small>Hosted credits</small><strong>{compact(game.compute.apiCredits)}</strong><span>{game.compute.apiCredits > 0 ? "buffer for inference + training" : inferenceShortfall > 0 ? "empty · inference uses cash" : "empty · spare GPUs can still train"}</span></div><div><small>Capacity cost / month</small><strong>{money(fixedComputeCost(game))}</strong><span>GPU rent, cloud + facilities</span></div><div><small>Estimated compute / month</small><strong>{money(monthlyCompute(game))}</strong><span>capacity + uncovered inference</span></div></div>
    <div className="compute-rule" role="note"><span className="eyebrow">How the limit works</span><p><strong>Inference first.</strong> Live products consume owned and rented capacity. Spare capacity trains active work. Hosted credits fill gaps; when both credits and spare capacity are gone, training stops. Company ownership gives you control of the budget, not free cloud capacity.</p></div>
    <section className="capacity-sources">
      <div className="capacity-sources-heading"><div><span className="eyebrow">Capacity sources</span><h3>Add headroom</h3></div><p>Live inference uses capacity first. Anything left over trains product and research work.</p></div>
      <div className="capacity-source-row"><div className="capacity-source-copy"><h4>Rented GPUs</h4><p>Each GPU covers {money(RENTED_GPU_WEEKLY_COVERAGE)}/week of live inference. Spare capacity adds about {compact(RENTED_GPU_WEEKLY_COVERAGE / 7)} training units/day.</p><small>{game.compute.rentedGpus} rented · {money(rentedGpuCoverage)}/week covered · {money(rentedGpuCost)}/month rental</small></div><div className="capacity-stepper" role="group" aria-label="Adjust rented GPUs"><span className="capacity-control-label">GPUs rented</span><div className="capacity-stepper-controls"><div className="capacity-stepper-side" role="group" aria-label="Decrease rented GPUs">{RENTED_GPU_ADJUSTMENTS.filter((step) => step < 0).map((step) => { const amount = Math.abs(step); return <button key={step} className="capacity-step-button" aria-label={`Release ${gpuLabel(amount)}`} disabled={game.compute.rentedGpus < amount} onClick={() => adjustRentedGpus(step)}>−{amount}</button>; })}</div><output className="capacity-stepper-value" aria-live="polite" aria-label="Rented GPUs">{game.compute.rentedGpus}</output><div className="capacity-stepper-side" role="group" aria-label="Increase rented GPUs">{RENTED_GPU_ADJUSTMENTS.filter((step) => step > 0).map((step) => <button key={step} className="capacity-step-button" aria-label={`Rent ${gpuLabel(step)}`} disabled={game.compute.rentedGpus + step > MAX_RENTED_GPUS} onClick={() => adjustRentedGpus(step)}>+{step}</button>)}</div></div></div></div>
      <div className="capacity-source-row"><div className="capacity-source-copy"><h4>Owned capacity</h4><p>{game.compute.ownedCluster} units owned. Each adds {money(OWNED_COMPUTE_UNIT_WEEKLY_COVERAGE)}/week of live inference coverage; spare capacity also trains work.</p><small>{money(game.compute.ownedCluster * OWNED_COMPUTE_UNIT_WEEKLY_COVERAGE)}/week covered · one-time purchase · no monthly rental</small></div><div className="cluster-action"><div className="cluster-purchase-options" role="group" aria-label="Buy owned capacity">{ownedPurchaseOptions.map(({ units, cost }) => { const canAfford = game.company.cash >= cost; return <GameButton key={units} className="cluster-purchase-option" tone="plain" disabled={!canAfford} title={canAfford ? `Buy ${units} units for ${money(cost)}` : `Need ${money(cost - game.company.cash)} more cash`} aria-label={canAfford ? `Buy ${units} owned capacity units for ${money(cost)}` : `Cannot afford ${units} owned capacity units; need ${money(cost - game.company.cash)} more cash`} onClick={() => dispatch({ type: "buyCluster", units })}><strong>+{units} units</strong><small>{money(cost)}</small></GameButton>; })}</div><small>Choose a pack you can cover with cash.</small></div></div>
      {game.compute.dataCenters > 0 && <div className="capacity-source-row"><div className="capacity-source-copy"><h4>Data-center fleet</h4><p>{`${game.compute.dataCenters === 1 ? "1 owned facility" : `${game.compute.dataCenters} owned facilities`}. Each covers ${money(DATA_CENTER_WEEKLY_COVERAGE)}/week of live inference demand; spare capacity trains work.`}</p><small>{money(game.compute.dataCenters * DATA_CENTER_WEEKLY_COVERAGE)}/week covered · {money(game.compute.dataCenters * DATA_CENTER_MONTHLY_COST)}/month facilities cost</small></div><div className="cluster-action"><strong>Infrastructure online</strong><small>Build additional facilities from Company expansion.</small></div></div>}
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
    {game.unlocks.automation && <details className="compute-advanced-section automation-section"><summary><span>Department automation</span><small>{configuredDepartments ? `${configuredDepartments} department${configuredDepartments === 1 ? "" : "s"} configured` : "Not configured"}</small></summary><section><div className="automation-explainer" role="note"><span className="eyebrow">What the sliders do</span><p><strong>Automation amplifies assigned work.</strong> Every 10% adds 5% to the skill contribution of people in that department; 100% means 1.5× output. It does not replace staffing.</p><small>Raising automation lowers non-founder morale and advances automation-risk events.</small></div><div className="automation-grid">{DEPTS.map((department) => { const percent = game.company.automation[department]; const teammateCount = game.employees.filter((worker) => worker.department === department).length; return <label key={department}><span className="automation-label"><strong>{DEPARTMENT_LABELS[department]}</strong><small>{teammateCount} teammate{teammateCount === 1 ? "" : "s"}</small></span><output>{percent}% <small>· +{Math.round(percent * BALANCE.AUTOMATION_OUTPUT_PER_PERCENT * 100)}% output</small></output><input aria-label={`${DEPARTMENT_LABELS[department]} automation`} type="range" min="0" max="100" step="10" value={percent} onChange={(event) => dispatch({ type: "setAutomation", department, percent: Number(event.target.value) })} /></label>; })}</div><div className="automation-agents"><div><span className="eyebrow">Digital teammates</span><p>Agents are tireless employees you assign to projects separately. Each adds {money(BALANCE.AI_WORKER_MONTHLY_COST)}/month to the cloud bill.</p></div><div className="choice-row">{(["engineering", "support", "sales", "research"] as const).map((kind) => <GameButton key={kind} onClick={() => dispatch({ type: "deployAiWorker", kind })}>Deploy {DEPARTMENT_LABELS[kind]} agent</GameButton>)}</div></div></section></details>}
  </div>;
}
