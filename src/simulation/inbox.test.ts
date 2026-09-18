import { describe, expect, it } from "vitest";
import { buildAcquisitionMail } from "./acquisitionMail";
import { createNewGame } from "./newGame";
import { Rng } from "./rng";
import { buildPoachMail, buildProviderOutageMail } from "./tick";
import type { Mail } from "./types";
import { createProduct } from "./products";

describe("Inbox & Communication System", () => {
  it("generates a dynamic, executive acquisition offer email", () => {
    const game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
    game.company.valuation = 50_000_000;
    game.company.ownership.founder = 0.6;
    const r = new Rng(42);

    const baseMail: Mail = {
      id: "mail-acq-test",
      at: { year: 2023, month: 6, day: 15 },
      from: "macrosoft",
      subject: "They would like to buy you",
      body: "Initial inquiry",
      read: false,
      requiresResponse: true,
    };

    const mail = buildAcquisitionMail(game, r, baseMail);

    expect(mail.sender).toBeDefined();
    expect(mail.sender?.name).toBeTruthy();
    expect(mail.sender?.role).toBeTruthy();
    expect(mail.sender?.organization).toBeTruthy();

    expect(mail.recipient).toBeDefined();
    expect(mail.recipient?.name).toBe("Elena");
    expect(mail.recipient?.organization).toBe("VectorPrime");

    expect(mail.body).toContain("VectorPrime");
    expect(mail.body).toContain("Elena");
    expect(mail.body).toContain("strategic and cultural fit");

    // Check context metrics
    expect(mail.context).toBeDefined();
    const currentValRow = mail.context?.find((c) => c.label === "Current valuation");
    expect(currentValRow?.value).toContain("$50.00M");

    const founderStakeRow = mail.context?.find((c) => c.label === "Your equity stake");
    expect(founderStakeRow?.value).toBe("60.0%");

    // Choices
    expect(mail.choices?.length).toBe(2);
    expect(mail.choices?.some((c) => c.id === "sell")).toBe(true);
    expect(mail.choices?.some((c) => c.id === "no")).toBe(true);
  });

  it("enriches poach offers with search firm metadata and financial impacts", () => {
    const game = createNewGame({ founderName: "Alex", companyName: "Hyperion", cofounderId: "marcus" });
    const r = new Rng(88);

    // Add employee to be poached
    game.employees.push({
      id: "emp-1",
      name: "Dmitri",
      title: "Senior AI Engineer",
      role: "employee",
      look: game.founder.look,
      skills: { research: 8, engineering: 9, product: 4, growth: 2, productivity: 8 },
      happiness: 8,
      burnoutDays: 0,
      burnoutRisk: 0,
      loyalty: 7,
      ambition: 7,
      ethics: 6,
      salary: 180_000,
      equity: 0.01,
      traits: [],
      taskId: null,
      remote: false,
      tenureDays: 120,
      offMarketDays: 0,
      department: "engineering",
    });

    const baseMail: Mail = {
      id: "poach-mail",
      at: { year: 2023, month: 7, day: 1 },
      from: "people",
      subject: "Outside offer",
      body: "Poach attempt",
      read: false,
      requiresResponse: true,
    };

    const mail = buildPoachMail(game, r, baseMail);
    expect(mail).not.toBeNull();
    expect(mail!.sender?.organization).toBe("Apex Executive Search");
    expect(mail!.recipient?.name).toBe("Alex");
    expect(mail!.profile?.name).toBe("Dmitri");
    expect(mail!.choices?.length).toBe(2);
  });

  it("enriches provider outage mail with incident command details and migration paths", () => {
    const game = createNewGame({ founderName: "Alex", companyName: "Hyperion", cofounderId: "marcus" });
    const r = new Rng(100);

    // Create an active product on Claudius Labs
    const product = createProduct(game, "chat", "code", r);
    product.modelId = "claudius-opus";
    product.status = "active";
    game.products.push(product);

    const baseMail: Mail = {
      id: "outage-mail",
      at: { year: 2023, month: 8, day: 10 },
      from: "compute",
      subject: "Outage",
      body: "API down",
      read: false,
      requiresResponse: true,
    };

    const built = buildProviderOutageMail(game, r, baseMail);
    expect(built).toBe(true);
    expect(baseMail.sender?.organization).toBe("Claudius Labs");
    expect(baseMail.sender?.role).toBe("Incident Commander");
    expect(baseMail.choices?.length).toBeGreaterThan(1);
    expect(baseMail.choices?.some((c) => c.id === "wait-for-recovery")).toBe(true);
  });
});
