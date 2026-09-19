import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BALANCE } from "../../config/balance";
import { createNewGame } from "../../simulation/newGame";
import { createProduct } from "../../simulation/products";
import { Rng } from "../../simulation/rng";
import { ProductsPanel, TasksPanel } from "./panels";

describe("Products and Tasks UI Panels", () => {
  it("renders concise auto-assign feedback in TasksPanel", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "dustin-moskovitz", skipTutorial: true });
    game.lastStaffing = {
      taskId: null,
      lines: [
        "Assigned Maya to Copywright (Strongest match)",
        "Assigned Dustin to Research (Available)",
        "Assigned Ada to Engineering (Lead)",
      ],
      at: game.clock.tick,
    };
    const markup = renderToStaticMarkup(<TasksPanel game={game} />);
    expect(markup).toContain("Auto assign complete");
    expect(markup).not.toContain("Assigned Maya to Copywright");
  });

  it("renders compact product launch workspace with collapsible cards and delegation", () => {
    const game = createNewGame({ founderName: "Ada", companyName: "HyperScale", cofounderId: "dustin-moskovitz", skipTutorial: true });
    game.company.productsLaunched = BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE;

    const p1 = createProduct(game, "chat", "writing", new Rng(1));
    p1.status = "ready";
    p1.points = { engineering: 4, product: 3, growth: 2, research: 0 };
    p1.levels = { deployment: 1, capability: 2, distribution: 1 };

    const p2 = createProduct(game, "code", "agent", new Rng(2));
    p2.status = "active";
    p2.weeklyRevenue = 12000;
    p2.users = 4500;
    p2.marketShare = 15.5;

    const p3 = createProduct(game, "chat", "search", new Rng(3));
    p3.status = "mature";
    p3.weeklyRevenue = 8000;
    p3.users = 3000;
    p3.marketShare = 10.0;

    game.products = [p1, p2, p3];

    const markup = renderToStaticMarkup(<ProductsPanel game={game} />);

    // Catalog header bar
    expect(markup).toContain("Products (3)");
    expect(markup).toContain("1 ready to launch");
    expect(markup).toContain("2 active in market");
    expect(markup).toContain("Expand all");

    // Product cards and compact summary metrics for both active and mature products
    expect(markup).toContain("product-compact-badge");
    expect(markup).toContain("$12.0k/wk");
    expect(markup).toContain("4,500 users");
    expect(markup).toContain("16% share");
    expect(markup).toContain("$8,000/wk");
    expect(markup).toContain("3,000 users");
    expect(markup).toContain("10% share");

    // Auto-Delegate launch options
    expect(markup).toContain("Auto-Delegate:");
    expect(markup).toContain("Balanced");
    expect(markup).toContain("Aggressive");
    expect(markup).toContain("Niche");
    expect(markup).toContain("Expansion");

    // Tutorial markers preserved
    expect(markup).toContain('data-tutorial="product-ready"');
    expect(markup).toContain('data-tutorial="designer"');
    expect(markup).toContain('data-tutorial="enter-market"');
  });
});
