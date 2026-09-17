import { models } from "../../data/models";
import type { DepartmentId, GameState } from "../../simulation/types";
import { isModelAvailable, providerForModel } from "../../simulation/effects";
import { useGame } from "../../state/store";
import { fixedComputeCost, inferenceCoverage, monthlyCompute } from "../../simulation/derived";
import { money } from "../format";
import { GameButton } from "../shared/controls";

const DEPTS: DepartmentId[] = ["engineering", "support", "sales", "marketing", "finance", "recruiting", "legal", "research", "management"];
const SERVICE_PRODUCT_STATUSES = new Set(["active", "mature", "declining"]);

export function ComputePanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const demand = game.products.filter((p) => SERVICE_PRODUCT_STATUSES.has(p.status)).reduce((s, p) => s + p.weeklyInference, 0);
  const coverage = inferenceCoverage(game);
  const load = coverage > 0 ? Math.min(100, demand / coverage * 100) : 0;
  const outage = game.providerOutages.find((item) => item.untilTick > game.clock.tick);
  const affectedProducts = outage ? game.products.filter((product) => SERVICE_PRODUCT_STATUSES.has(product.status) && providerForModel(product.modelId) === outage.provider) : [];
  const outageDays = outage ? Math.max(1, outage.untilTick - game.clock.tick) : 0;

  return <div className="compute-console">
    <div className="workspace-intro">
      <div><span className="eyebrow">Infrastructure control</span><h3>Keep the lights on.</h3></div>
      <span className={`system-online ${outage ? "disrupted" : ""}`}>{outage ? `● ${outage.provider} disruption` : "● Systems online"}</span>
    </div>
    {outage ? <section className="provider-outage-banner" role="status">
      <div><span className="eyebrow">Active gameplay event</span><strong>{outage.provider} is unavailable</strong></div>
      <p>{affectedProducts.length ? `${affectedProducts.length} active product${affectedProducts.length > 1 ? "s are" : " is"} using this provider.` : "No active product is currently exposed."} Revenue collection is reduced until you migrate or service returns.</p>
      <small>{outageDays} days remaining · Open the Inbox event to choose a fallback model.</small>
    </section> : null}
    <section className="capacity-display" data-tutorial="compute-capacity"><div className="rack-graphic">{Array.from({ length: 5 }, (_, i) => <div key={i}><i /><i /><span /></div>)}</div><div><span className="eyebrow">Self-hosted inference</span><strong>{money(coverage)}<small>equivalent API cost covered / week</small></strong><div className="progress-track"><i style={{ width: `${load}%` }} /></div><p>{coverage ? `${Math.round(load)}% capacity in use` : "Using hosted APIs · no dedicated GPUs"} · {money(Math.max(0, demand - coverage))}/week served by APIs</p></div></section>
    <div className="compute-metrics">{[["API credits", money(game.compute.apiCredits)], ["Fixed cloud / month", money(fixedComputeCost(game))], ["Total compute / month", money(monthlyCompute(game))]].map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
    <div className="gpu-controls"><div><h4>Rent GPU capacity</h4><p>Each GPU covers $800 of weekly inference and costs $2,400/month. Unused capacity still costs money.</p></div><div className="stepper"><button aria-label="Rent fewer GPUs" disabled={game.compute.rentedGpus === 0} onClick={() => dispatch({ type: "rentGpus", count: game.compute.rentedGpus - 1 })}>−</button><output>{game.compute.rentedGpus}</output><button aria-label="Rent more GPUs" onClick={() => dispatch({ type: "rentGpus", count: game.compute.rentedGpus + 1 })}>+</button></div></div>
    <div className="cluster-row"><p>Owned cluster · {game.compute.ownedCluster} units<br /><small>Four units add $480/week of coverage with no rental charge.</small></p><GameButton disabled={game.company.cash < 400_000} title={game.company.cash < 400_000 ? `Need ${money(400_000 - game.company.cash)} more` : "Add four owned compute units"} onClick={() => dispatch({ type: "buyCluster" })}>Buy cluster · $400k</GameButton></div>
    <h4 className="console-heading">Default model for new products</h4>
    <p className="model-help">Provider outages disable that provider’s models until service is restored. Migrate affected products from the Inbox event.</p>
    <div className="model-cards">{models.filter((m) => m.provider !== "You" || game.ownedModels.includes(m.id)).map((m) => {
      const available = isModelAvailable(game, m.id);
      const providerOutage = game.providerOutages.find((item) => item.provider === m.provider && item.untilTick > game.clock.tick);
      const days = Math.max(1, (providerOutage?.untilTick ?? game.clock.tick) - game.clock.tick);
      return <button key={m.id} disabled={!available} className={`${game.currentModelId === m.id ? "selected" : ""} ${available ? "" : "unavailable"}`} title={available ? `Use ${m.name} for new products` : `${m.provider} is unavailable for ${days} more days`} onClick={() => dispatch({ type: "setCompanyModel", modelId: m.id })}>
        <small>{m.provider}</small><strong>{m.name}</strong><span>{money(m.costPerMTok)} / million tokens</span><em>{available ? (game.currentModelId === m.id ? "✓ Selected" : "Select model") : `${m.provider} offline · ${days}d`}</em>
      </button>;
    })}</div>
    {game.unlocks.automation ? <section><h4 className="console-heading">Department automation</h4><div className="automation-grid">{DEPTS.map((d) => <label key={d}>{d}<output>{game.company.automation[d]}%</output><input aria-label={`${d} automation`} type="range" min="0" max="100" step="10" value={game.company.automation[d]} onChange={(e) => dispatch({ type: "setAutomation", department: d, percent: Number(e.target.value) })} /></label>)}</div><div className="choice-row">{(["engineering", "support", "sales", "research"] as const).map((kind) => <GameButton key={kind} onClick={() => dispatch({ type: "deployAiWorker", kind })}>Deploy {kind} agent</GameButton>)}</div></section> : null}
  </div>;
}
