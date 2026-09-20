import { locations } from "../../data/locations";
import { lobbies } from "../../data/lobbies";
import { specialProjects } from "../../data/specialProjects";
import { verticals } from "../../data/verticals";
import type { ReactNode } from "react";
import type { GameState } from "../../simulation/types";
import { useGame } from "../../state/store";
import { money } from "../format";
import { GameButton } from "../shared/controls";
import {
  describeLobbyEffects,
  describeLocationBenefits,
  describeLocationProfile,
  describeProjectEffects,
  describeProjectRequirements,
  describeVerticalUnlocks,
} from "./expansionInsights";

type CardState = "available" | "locked" | "active" | "complete" | "viewing";
const NO_ACTIVE_OUTCOME = "Completion recorded; no immediate company bonus.";

function statusLabel(state: CardState): string {
  switch (state) {
    case "active":
      return "Active";
    case "complete":
      return "Completed";
    case "viewing":
      return "Viewing";
    case "locked":
      return "Locked";
    default:
      return "Available";
  }
}

function CardStatus({ state, label }: { state: CardState; label?: string }) {
  return <span className={`expansion-status expansion-status-${state}`}>{label ?? statusLabel(state)}</span>;
}

function InsightList({ lines, label }: { lines: string[]; label: string }) {
  if (!lines.length) return null;
  return (
    <div className="expansion-insight-group">
      <span className="expansion-detail-label">{label}</span>
      <ul>
        {lines.map((line) => <li key={line}>{line}</li>)}
      </ul>
    </div>
  );
}

function ProgressMeter({ progress, required, label }: { progress: number; required: number; label: string }) {
  const value = required > 0 ? Math.max(0, Math.min(100, (progress / required) * 100)) : 0;
  return (
    <div className="expansion-progress" aria-label={label}>
      <div className="expansion-progress-label"><span>{label}</span><strong>{value.toFixed(0)}%</strong></div>
      <div className="expansion-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function DetailAction({ children, disabled, title, onClick, tone = "primary" }: { children: ReactNode; disabled?: boolean; title?: string; onClick: () => void; tone?: "plain" | "primary" }) {
  return <GameButton type="button" tone={tone} className="expansion-action" disabled={disabled} title={title} onClick={onClick}>{children}</GameButton>;
}

function SectionHeading({ eyebrow, title, caption }: { eyebrow: string; title: string; caption: string }) {
  return <header className="expansion-section-heading"><div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3></div><p>{caption}</p></header>;
}

function LocationCard({ game, location, unlocked }: { game: GameState; location: (typeof locations)[number]; unlocked: boolean }) {
  const dispatch = useGame((state) => state.dispatch);
  const owned = game.company.locations.includes(location.id);
  const viewing = game.company.activeLocationId === location.id && owned;
  const canBuy = game.company.cash >= location.cost;
  const lockedByUnlock = !owned && !unlocked;
  const state: CardState = viewing ? "viewing" : owned ? "active" : lockedByUnlock || !canBuy ? "locked" : "available";
  const benefits = describeLocationBenefits(location);
  const purpose = describeLocationProfile(location).join(" · ");

  return (
    <details className={`expansion-card expansion-location-card expansion-card-${state}`}>
      <summary>
        <span className="expansion-summary-copy"><span className="expansion-card-kicker">{location.region}</span><strong>{location.name}</strong><small>{purpose}</small></span>
        <span className="expansion-summary-meta"><CardStatus state={state} label={owned && !viewing ? "Established" : undefined} />{!owned && <b>{money(location.cost)}</b>}</span>
      </summary>
      <div className="expansion-card-detail">
        <p className="expansion-description">{purpose}</p>
        <InsightList label="Office profile" lines={benefits} />
        <div className="expansion-actions">
          {!owned ? (
            <DetailAction disabled={lockedByUnlock || !canBuy} title={lockedByUnlock ? "Expand headquarters before establishing another office" : canBuy ? `Establish ${location.name}` : `Need ${money(location.cost - game.company.cash)} more`} onClick={() => dispatch({ type: "buyLocation", locationId: location.id })}>
              {lockedByUnlock ? "Expand headquarters first" : `Establish office · ${money(location.cost)}`}
            </DetailAction>
          ) : (
            <DetailAction disabled={viewing} tone={viewing ? "plain" : "primary"} title={viewing ? "This is the current office view" : `View the ${location.name} office`} onClick={() => dispatch({ type: "setActiveLocation", locationId: location.id })}>
              {viewing ? "Current office" : "Visit office"}
            </DetailAction>
          )}
          {lockedByUnlock ? <span className="expansion-action-note">Requires office expansion.</span> : null}
        </div>
      </div>
    </details>
  );
}

function HomeOfficeCard({ game }: { game: GameState }) {
  const dispatch = useGame((state) => state.dispatch);
  const viewing = game.company.activeLocationId === null;
  return (
    <article className={`expansion-home-card ${viewing ? "is-viewing" : ""}`}>
      <div><span className="expansion-card-kicker">Headquarters</span><strong>Home office</strong><p>The original company office and default world view.</p></div>
      <div className="expansion-home-action">
        <CardStatus state={viewing ? "viewing" : "active"} />
        <DetailAction disabled={viewing} tone={viewing ? "plain" : "primary"} onClick={() => dispatch({ type: "setActiveLocation", locationId: null })}>{viewing ? "Current office" : "Return home"}</DetailAction>
      </div>
    </article>
  );
}

function VerticalCard({ game, vertical }: { game: GameState; vertical: (typeof verticals)[number] }) {
  const dispatch = useGame((state) => state.dispatch);
  const active = game.company.verticals.includes(vertical.id);
  const canBuy = game.company.cash >= vertical.cost;
  const state: CardState = active ? "active" : canBuy ? "available" : "locked";
  const summary = describeVerticalUnlocks(vertical);
  return (
    <details className={`expansion-card expansion-vertical-card expansion-card-${state}`}>
      <summary>
        <span className="expansion-summary-copy"><span className="expansion-card-kicker">{summary.profile}</span><strong>{vertical.name}</strong><small>{vertical.description}</small></span>
        <span className="expansion-summary-meta"><CardStatus state={state} /><b>{active ? "Active" : money(vertical.cost)}</b></span>
      </summary>
      <div className="expansion-card-detail">
        <p className="expansion-description">{vertical.description}</p>
        <InsightList label="Product building blocks" lines={summary.primitives} />
        <InsightList label="Research path" lines={summary.technologies} />
        <InsightList label="Project path" lines={summary.projects} />
        <InsightList label="Product examples" lines={summary.productExamples} />
        <div className="expansion-actions">
          <DetailAction disabled={active || !canBuy} title={active ? `${vertical.name} is already active` : canBuy ? `Open the ${vertical.name} vertical` : `Need ${money(vertical.cost - game.company.cash)} more`} onClick={() => dispatch({ type: "buyVertical", verticalId: vertical.id })}>
            {active ? "Active" : `Open vertical · ${money(vertical.cost)}`}
          </DetailAction>
        </div>
      </div>
    </details>
  );
}

function ProjectCard({ game, project }: { game: GameState; project: (typeof specialProjects)[number] }) {
  const dispatch = useGame((state) => state.dispatch);
  const task = game.tasks.find((item) => item.projectId === project.id);
  const complete = game.company.specialProjects.includes(project.id);
  const missing = project.requiresTechs.filter((technologyId) => !game.company.technologies.includes(technologyId));
  const affordable = game.company.cash >= project.cost;
  const state: CardState = complete ? "complete" : task ? "active" : missing.length || !affordable ? "locked" : "available";
  const requirements = describeProjectRequirements(project);
  const effects = describeProjectEffects(project);
  const purpose = effects.length ? project.description : "Project initiative";
  const isTerminalProject = project.id === "automate-ceo";
  const reason = complete ? "Project completed" : task ? "Assign a team from Tasks" : missing.length ? `Requires ${missing.length} research prerequisite${missing.length > 1 ? "s" : ""}` : !affordable ? `Need ${money(project.cost - game.company.cash)} more` : undefined;

  return (
    <details className={`expansion-card expansion-project-card expansion-card-${state}`}>
      <summary>
        <span className="expansion-summary-copy"><span className="expansion-card-kicker">Special project</span><strong>{project.name}</strong><small>{purpose}</small></span>
        <span className="expansion-summary-meta"><CardStatus state={state} /><b>{complete || task ? (complete ? "Done" : "In progress") : money(project.cost)}</b></span>
      </summary>
      <div className="expansion-card-detail">
        <p className="expansion-description">{purpose}</p>
        {task ? <ProgressMeter progress={task.progress} required={task.requiredProgress} label="Project progress" /> : null}
        <InsightList label="Requires" lines={requirements} />
        <InsightList label={effects.length ? "Effects" : "Outcome"} lines={effects.length ? effects : [NO_ACTIVE_OUTCOME]} />
        {isTerminalProject ? <p className="expansion-ending-warning"><strong>Endgame warning:</strong> when this project completes, the game ends with the “Replaced” outcome.</p> : null}
        <div className="expansion-actions">
          {task ? (
            <DetailAction onClick={() => useGame.getState().setDrawer("tasks")} title="Open Tasks to assign this project">Assign team →</DetailAction>
          ) : (
            <DetailAction disabled={complete || Boolean(missing.length) || !affordable} title={isTerminalProject ? "Starting this project commits the company to the Replaced ending" : reason ?? `Start ${project.name}`} onClick={() => dispatch({ type: "startProject", projectId: project.id })}>
              {complete ? "Completed" : `Start project · ${money(project.cost)}`}
            </DetailAction>
          )}
          {reason && !task && !complete ? <span className="expansion-action-note">{reason}</span> : null}
        </div>
      </div>
    </details>
  );
}

function LobbyCard({ game, lobby }: { game: GameState; lobby: (typeof lobbies)[number] }) {
  const dispatch = useGame((state) => state.dispatch);
  const task = game.tasks.find((item) => item.lobbyId === lobby.id);
  const complete = game.company.lobbies.includes(lobby.id);
  const affordable = game.company.cash >= lobby.cost;
  const state: CardState = complete ? "complete" : task ? "active" : affordable ? "available" : "locked";
  const effects = describeLobbyEffects(lobby);
  const purpose = effects.length ? lobby.description : "Policy initiative";
  return (
    <details className={`expansion-card expansion-lobby-card expansion-card-${state}`}>
      <summary>
        <span className="expansion-summary-copy"><span className="expansion-card-kicker">Public policy</span><strong>{lobby.name}</strong><small>{purpose}</small></span>
        <span className="expansion-summary-meta"><CardStatus state={state} /><b>{complete || task ? (complete ? "Done" : "In progress") : money(lobby.cost)}</b></span>
      </summary>
      <div className="expansion-card-detail">
        <p className="expansion-description">{purpose}</p>
        {task ? <ProgressMeter progress={task.progress} required={task.requiredProgress} label="Policy progress" /> : null}
        <InsightList label="Required work" lines={[`${lobby.requiredProgress} progress`]} />
        <InsightList label={effects.length ? "Effect" : "Outcome"} lines={effects.length ? effects : [NO_ACTIVE_OUTCOME]} />
        <div className="expansion-actions">
          {task ? <DetailAction onClick={() => useGame.getState().setDrawer("tasks")} title="Open Tasks to assign this policy">Assign team →</DetailAction> : <DetailAction disabled={complete || !affordable} title={complete ? "Policy completed" : affordable ? `Start ${lobby.name}` : `Need ${money(lobby.cost - game.company.cash)} more`} onClick={() => dispatch({ type: "startLobby", lobbyId: lobby.id })}>{complete ? "Completed" : `Start policy · ${money(lobby.cost)}`}</DetailAction>}
          {!task && !complete && !affordable ? <span className="expansion-action-note">Need {money(lobby.cost - game.company.cash)} more</span> : null}
        </div>
      </div>
    </details>
  );
}

export function ExpansionPanel({ game }: { game: GameState }) {
  const ownedLocation = locations.find((location) => location.id === game.company.activeLocationId && game.company.locations.includes(location.id));
  return (
    <div className="expansion-panel">
      <header className="expansion-intro">
        <div><span className="eyebrow">Company reach</span><h3>Expand the company.</h3></div>
        <p>Open offices, markets, and long projects. Each card shows its cost, requirements, and effect.</p>
      </header>
      <section className="expansion-section expansion-locations-section">
        <SectionHeading eyebrow="Offices" title={ownedLocation ? `Viewing ${ownedLocation.name}` : "Choose an office to visit"} caption="Own an office for its skill profile. Visit changes the office you see." />
        <HomeOfficeCard game={game} />
        <div className="expansion-card-grid">{locations.map((location) => <LocationCard key={location.id} game={game} location={location} unlocked={game.unlocks.locations} />)}</div>
      </section>
      {game.unlocks.verticals ? <section className="expansion-section">
        <SectionHeading eyebrow="Markets" title="Open a vertical" caption="Verticals add building blocks and show the research and project paths they open." />
        <div className="expansion-card-grid">{verticals.map((vertical) => <VerticalCard key={vertical.id} game={game} vertical={vertical} />)}</div>
      </section> : null}
      <section className="expansion-section">
        <SectionHeading eyebrow="Long projects" title="Fund a capability" caption="Start the work, then assign a team from Tasks. Progress remains visible here." />
        <div className="expansion-card-grid">{specialProjects.map((project) => <ProjectCard key={project.id} game={game} project={project} />)}</div>
      </section>
      {game.unlocks.lobbying ? <section className="expansion-section">
        <SectionHeading eyebrow="Public policy" title="Shape the operating climate" caption="Policy work takes time and a growth team. Its effect applies when the task completes." />
        <div className="expansion-card-grid">{lobbies.map((lobby) => <LobbyCard key={lobby.id} game={game} lobby={lobby} />)}</div>
      </section> : null}
    </div>
  );
}
