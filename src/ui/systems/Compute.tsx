import { useState } from "react";
import { models } from "../../data/models";
import type { DepartmentId, GameState } from "../../simulation/types";
import { isModelAvailable, providerForModel } from "../../simulation/effects";
import { useGame } from "../../state/store";
import { fixedComputeCost, inferenceCoverage, monthlyCompute } from "../../simulation/derived";
import { modelTags } from "../../visuals/registry";
import { modelPricePerMTok, money } from "../format";
import { GameButton } from "../shared/controls";
import { CompanyMark } from "../visuals/CompanyMark";
import { MiniaturePreview } from "../visuals/MiniaturePreview";
import { ModelGlyph } from "../visuals/ModelGlyph";

const DEPTS: DepartmentId[] = ["engineering", "support", "sales", "marketing", "finance", "recruiting", "legal", "research", "management"];
const SERVICE_PRODUCT_STATUSES = new Set(["active", "mature", "declining"]);

export function ComputePanel({ game }: { game: GameState }) {
  const dispatch = useGame((state) => state.dispatch);
  const [selectedId, setSelectedId] = useState(game.currentModelId);
  const demand = game.products.filter((product) => SERVICE_PRODUCT_STATUSES.has(product.status)).reduce((sum, product) => sum + product.weeklyInference, 0);
  const coverage = inferenceCoverage(game);
  const load = coverage > 0 ? Math.min(100, demand / coverage * 100) : 0;
  const outage = game.providerOutages.find((item) => item.untilTick > game.clock.tick);
  const affectedProducts = outage ? game.products.filter((product) => SERVICE_PRODUCT_STATUSES.has(product.status) && providerForModel(product.modelId) === outage.provider) : [];
  const outageDays = outage ? Math.max(1, outage.untilTick - game.clock.tick) : 0;
  const visibleModels = models.filter((model) => model.provider !== "You" || game.ownedModels.includes(model.id));
  const selected = visibleModels.find((model) => model.id === selectedId) ?? visibleModels.find((model) => model.id === game.currentModelId) ?? visibleModels[0]!;
  const selectedAvailable = isModelAvailable(game, selected.id);

  return <div className="compute-console">
    <div className="workspace-intro">
      <div><span className="eyebrow">Infrastructure control</span><h3>Keep the lights on.</h3></div>
      <span className={`system-online ${outage ? "disrupted" : ""}`}>{outage ? `● ${outage.provider} disruption` : "● Systems online"}</span>
    </div>
    {outage && <section className="provider-outage-banner" role="status"><CompanyMark name={outage.provider} /><div><span className="eyebrow">Active gameplay event</span><strong>{outage.provider} is unavailable</strong><p>{affectedProducts.length ? `${affectedProducts.length} active product${affectedProducts.length > 1 ? "s are" : " is"} exposed. Revenue is reduced until you migrate or service returns.` : "No active product is currently exposed. The provider remains unavailable for new selections."}</p><small>{outageDays} days remaining · choose a fallback in the Inbox event</small></div></section>}
    <section className="capacity-display" data-tutorial="compute-capacity"><div className="rack-graphic">{Array.from({ length: 5 }, (_, index) => <div key={index}><i /><i /><span /></div>)}</div><div><span className="eyebrow">Self-hosted inference</span><strong>{money(coverage)}<small>equivalent API cost covered / week</small></strong><div className="progress-track"><i style={{ width: `${load}%` }} /></div><p>{coverage ? `${Math.round(load)}% capacity in use` : "Using hosted APIs · no dedicated GPUs"} · {money(Math.max(0, demand - coverage))}/week served by APIs</p></div></section>
    <div className="compute-metrics">{[["API credits", money(game.compute.apiCredits)], ["Fixed cloud / month", money(fixedComputeCost(game))], ["Total compute / month", money(monthlyCompute(game))]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    <div className="gpu-controls"><div><h4>Rent GPU capacity</h4><p>Each GPU covers $800 of weekly inference and costs $2,400/month. Unused capacity still costs money.</p></div><div className="stepper"><button aria-label="Rent fewer GPUs" disabled={game.compute.rentedGpus === 0} onClick={() => dispatch({ type: "rentGpus", count: game.compute.rentedGpus - 1 })}>−</button><output>{game.compute.rentedGpus}</output><button aria-label="Rent more GPUs" onClick={() => dispatch({ type: "rentGpus", count: game.compute.rentedGpus + 1 })}>+</button></div></div>
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
          <div className="detail-heading"><div><span className="eyebrow">{selected.provider}</span><h3>{selected.name}</h3></div><CompanyMark name={selected.provider} /></div>
          <MiniaturePreview item={{ kind: "model", id: selected.id }} label={`${selected.name} model miniature`} />
          <div className="model-strengths">{modelTags(selected).map((tag) => <span key={tag}>{tag}</span>)}</div>
          <p>{selected.open ? "Open weights make this model flexible to run and adapt." : selected.capability >= 9 ? "Frontier capability, priced for work that justifies it." : selected.speed >= 8 ? "A fast model for products that value response time." : "A balanced hosted model for everyday product work."}</p>
          <div className="model-summary"><span><small>Cost</small><strong>{modelPricePerMTok(selected.costPerMTok)} / MTok</strong></span><span><small>Best read</small><strong>{modelTags(selected)[0]}</strong></span></div>
          <details className="advanced-details"><summary>Compare exact stats</summary><dl>{[["Capability", selected.capability], ["Speed", selected.speed], ["Reliability", selected.reliability], ["Context", selected.context], ["Safety", selected.safety]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value} / 10</dd></div>)}</dl></details>
          {!selectedAvailable && <p className="inline-requirement">{selected.provider} is offline. Choose another provider.</p>}
          <GameButton className="detail-action" tone="primary" disabled={!selectedAvailable || game.currentModelId === selected.id} title={!selectedAvailable ? `${selected.provider} is unavailable` : game.currentModelId === selected.id ? "Already the default model" : `Use ${selected.name} for new products`} onClick={() => dispatch({ type: "setCompanyModel", modelId: selected.id })}>{game.currentModelId === selected.id ? "Current default" : "Set as default"}</GameButton>
        </aside>
      </div>
    </section>
    {game.unlocks.automation && <section><h4 className="console-heading">Department automation</h4><div className="automation-grid">{DEPTS.map((department) => <label key={department}>{department}<output>{game.company.automation[department]}%</output><input aria-label={`${department} automation`} type="range" min="0" max="100" step="10" value={game.company.automation[department]} onChange={(event) => dispatch({ type: "setAutomation", department, percent: Number(event.target.value) })} /></label>)}</div><div className="choice-row">{(["engineering", "support", "sales", "research"] as const).map((kind) => <GameButton key={kind} onClick={() => dispatch({ type: "deployAiWorker", kind })}>Deploy {kind} agent</GameButton>)}</div></section>}
  </div>;
}
