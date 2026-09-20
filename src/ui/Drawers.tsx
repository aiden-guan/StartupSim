import { useEffect, useRef } from "react";
import type { GameState } from "../simulation/types";
import { currentTutorialSlide } from "../simulation/tutorial";
import { useGame } from "../state/store";
import { ProductsPanel, TasksPanel } from "./products/panels";
import { NAV_GROUPS } from "./HUD";
import { CompanyPanel, ComputePanel, FinancePanel, FundingPanel, InboxPanel, PerksPanel, ResearchPanel, SocialPanel, WorldPanel } from "./systems/panels";
import { HiringPanel, PeoplePanel } from "./team/panels";

export function Drawers({ game }: { game: GameState }) {
  const drawer = useGame((s) => s.drawer);
  const setDrawer = useGame((s) => s.setDrawer);
  const bodyRef = useRef<HTMLDivElement>(null);
  const slide = currentTutorialSlide(game);
  const isIntroProductCreation = game.pendingMentor === "intro" && drawer === "tasks";
  const isWaitingNext = Boolean(game.pendingMentor && slide?.advance.type === "nextButton");
  const isScrollLocked = isIntroProductCreation || isWaitingNext;

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [drawer]);

  useEffect(() => {
    if (!isScrollLocked) return;
    const el = bodyRef.current;
    if (!el) return;
    const prevent = (e: Event) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      el.removeEventListener("wheel", prevent);
      el.removeEventListener("touchmove", prevent);
    };
  }, [isScrollLocked]);
  if (!drawer) return null;
  const body =
    drawer === "tasks" ? (
      <TasksPanel game={game} />
    ) : drawer === "products" ? (
      <ProductsPanel game={game} />
    ) : drawer === "people" ? (
      <PeoplePanel game={game} />
    ) : drawer === "hiring" ? (
      <HiringPanel game={game} />
    ) : drawer === "research" ? (
      <ResearchPanel game={game} />
    ) : drawer === "finance" ? (
      <FinancePanel game={game} />
    ) : drawer === "compute" ? (
      <ComputePanel game={game} />
    ) : drawer === "funding" ? (
      <FundingPanel game={game} />
    ) : drawer === "perks" ? (
      <PerksPanel game={game} />
    ) : drawer === "world" ? (
      <WorldPanel game={game} />
    ) : drawer === "inbox" ? (
      <InboxPanel game={game} />
    ) : drawer === "social" ? (
      <SocialPanel game={game} />
    ) : (
      <CompanyPanel game={game} />
    );
  const titles: Record<string, string> = {
    tasks: "Product lab",
    products: "Launches",
    people: "People",
    hiring: "Hiring",
    research: "Research",
    finance: "Finance",
    compute: "Compute",
    funding: "Funding",
    perks: "Culture",
    world: "World",
    inbox: "Inbox",
    social: "Radar",
    company: "Company",
  };
  const group = NAV_GROUPS.find(g=>g.items.some(i=>i.id===drawer));
  return <section className={`workspace workspace-${drawer}`} aria-label={titles[drawer] ?? drawer}>
    <header className="workspace-header"><div><span className="eyebrow">{group?.label} / {game.company.name}</span><h2>{titles[drawer] ?? drawer}</h2></div><button aria-label="Close workspace" onClick={()=>setDrawer(null)}>✕</button></header>
    {group && group.items.filter(i=>!i.need||game.unlocks[i.need]).length>1 && <nav className="workspace-tabs">{group.items.filter(i=>!i.need||game.unlocks[i.need]).map(item=><button key={item.id} aria-current={drawer===item.id?'page':undefined} onClick={()=>setDrawer(item.id)}>{item.label}</button>)}</nav>}
    <div
      ref={bodyRef}
      className={`workspace-body panel-scroll ${isScrollLocked ? "!overflow-y-hidden !overflow-x-hidden select-none" : ""}`}
      style={isScrollLocked ? { overflow: "hidden", overscrollBehavior: "none" } : undefined}
    >
      {body}
    </div>
  </section>;
}
