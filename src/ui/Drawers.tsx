import type { GameState } from "../simulation/types";
import { useGame } from "../state/store";
import { ProductsPanel, TasksPanel } from "./products/panels";
import { GamePanel } from "./shared/controls";
import { CompanyPanel, ComputePanel, FinancePanel, FundingPanel, InboxPanel, PerksPanel, ResearchPanel, WorldPanel } from "./systems/panels";
import { HiringPanel, PeoplePanel } from "./team/panels";

export function Drawers({ game }: { game: GameState }) {
  const drawer = useGame((s) => s.drawer);
  const setDrawer = useGame((s) => s.setDrawer);
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
    ) : (
      <CompanyPanel game={game} />
    );
  const titles: Record<string, string> = {
    tasks: "Workbench",
    products: "Catalog",
    people: "People",
    hiring: "Hiring",
    research: "Research",
    finance: "Ledger",
    compute: "Compute",
    funding: "Term sheets",
    perks: "Culture",
    world: "World",
    inbox: "Inbox",
    company: "Company",
  };
  const variants: Record<string, "default" | "paper" | "mail" | "workbench" | "tree" | "cards"> = {
    tasks: "workbench",
    products: "workbench",
    finance: "paper",
    funding: "paper",
    inbox: "mail",
    research: "tree",
    hiring: "cards",
    people: "cards",
  };
  return (
    <GamePanel title={titles[drawer] ?? drawer} variant={variants[drawer] ?? "default"} onClose={() => setDrawer(null)}>
      {body}
    </GamePanel>
  );
}
