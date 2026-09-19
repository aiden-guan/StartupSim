import { describe, expect, it } from "vitest";
import { BALANCE } from "../config/balance";
import { modelById } from "../data/models";
import { exportSave, importSave } from "../state/save";
import { applyCommand } from "./commands";
import { createNewGame } from "./newGame";
import { calculateModelImpact } from "./modelImpact";
import { tickSocial } from "./social";
import { Rng } from "./rng";
import { buildAcquisitionMail } from "./acquisitionMail";
import type { Mail } from "./types";

describe("End-to-End Playtest Verification", () => {
  it("executes the full end-to-end founder experience cleanly", () => {
    // -------------------------------------------------------------
    // 1. FRESH START & PERSONALIZATION
    // -------------------------------------------------------------
    const founderName = "Samantha Cross";
    const companyName = "VortexAI";
    let state = createNewGame({
      founderName,
      companyName,
      cofounderId: "reya",
      seed: 777,
      skipTutorial: true,
    });
    state = applyCommand(state, { type: "setSpeed", speed: 1 })!;
    state = applyCommand(state, { type: "setPaused", paused: false })!;

    expect(state.founder.name).toBe("Samantha Cross");
    expect(state.company.name).toBe("VortexAI");

    // Check that social state has genesis initialized with personalized founder name
    expect(state.social).toBeDefined();
    expect(state.social.posts.length).toBeGreaterThan(0);
    const genesisChadDm = state.social.dms.find((d) => d.actorId === "chad");
    expect(genesisChadDm).toBeDefined();
    expect(genesisChadDm?.text).toContain("Samantha Cross");
    expect(genesisChadDm?.text).not.toContain("Aiden");

    // Dynamic acquisition email check
    const r = new Rng(1234);
    const dummyMail: Mail = {
      id: "acq-test",
      at: { ...state.clock.date },
      from: "macrosoft",
      subject: "Inbound",
      body: "Initial",
      read: false,
      requiresResponse: true,
    };
    const acqMail = buildAcquisitionMail(state, r, dummyMail);
    expect(acqMail.recipient?.name).toBe("Samantha Cross");
    expect(acqMail.recipient?.organization).toBe("VortexAI");
    expect(acqMail.body).toContain("Samantha Cross");
    expect(acqMail.body).toContain("VortexAI");
    expect(acqMail.body).not.toContain("Aiden");

    // -------------------------------------------------------------
    // 2. PRODUCT LIFECYCLE & DELEGATION PROGRESSION BUG FIX
    // -------------------------------------------------------------
    state = structuredClone(state);
    state.company.productsLaunched = BALANCE.MIN_PRODUCTS_BEFORE_DELEGATE;
    state = applyCommand(state, { type: "startProduct", a: "chat", b: "writing" })!;
    const product1 = state.products[0]!;
    const task1 = state.tasks.find((t) => t.productId === product1.id)!;

    for (const emp of state.employees) {
      state = applyCommand(state, { type: "assign", taskId: task1.id, workerId: emp.id })!;
    }

    // Tick until product reaches ready
    for (let i = 0; i < 90 && state.products[0]?.status !== "ready"; i++) {
      state = applyCommand(state, { type: "tickDay" })!;
    }
    expect(state.products[0]?.status).toBe("ready");
    expect(state.clock.pauseReasons).not.toContain("productReady");

    // Strategic Model Check on Ready Product (metamind-34b vs claudius-instant)
    const instant = modelById["claudius-instant"]!;
    const metamind = modelById["metamind-34b"]!;
    const instantImpact = calculateModelImpact({ model: instant, product: state.products[0]! });
    const metamindImpact = calculateModelImpact({ model: metamind, product: state.products[0]! });
    expect(instantImpact.effectiveTokenPrice).toBeGreaterThan(metamindImpact.effectiveTokenPrice);
    expect(instantImpact.reliabilityContribution).toBeGreaterThan(metamindImpact.reliabilityContribution);

    // Switch model to metamind-34b
    state = applyCommand(state, { type: "setModel", productId: product1.id, modelId: "metamind-34b" })!;
    expect(state.products[0]?.modelId).toBe("metamind-34b");

    // Delegate launch
    state = applyCommand(state, { type: "delegateMarket", productId: product1.id, strategy: "balanced" })!;
    expect(state.products[0]?.status).toBe("active");
    expect(state.clock.pauseReasons).not.toContain("productReady");
    expect(state.clock.pauseReasons).toContain("results");

    // Dismiss results and resume
    state = applyCommand(state, { type: "continueMarketResults" })!;
    state = applyCommand(state, { type: "setPaused", paused: false })!;
    expect(state.clock.paused).toBe(false);

    // Create second product
    state = applyCommand(state, { type: "startProduct", a: "search", b: "image" })!;
    expect(state.products.length).toBe(2);
    const product2 = state.products[1]!;
    const task2 = state.tasks.find((t) => t.productId === product2.id)!;
    const initialProgress = task2.progress;

    // Assign worker and tick
    const worker = state.employees[0]!;
    state = applyCommand(state, { type: "assign", taskId: task2.id, workerId: worker.id })!;
    state = applyCommand(state, { type: "tickDay" })!;

    const updatedTask2 = state.tasks.find((t) => t.id === task2.id)!;
    expect(updatedTask2.progress).toBeGreaterThan(initialProgress);
    expect(state.employees.find((e) => e.id === worker.id)?.taskId).toBe(task2.id);

    // -------------------------------------------------------------
    // 3. SOCIAL PROGRESSION & REACTION EVOLUTION
    // -------------------------------------------------------------
    // Verify first_launch milestone was automatically triggered during runtime tickDay
    expect(state.social.triggeredMilestones).toContain("first_launch");

    // Verify Chad's early hater/skeptic attitude
    const launchChadPost = state.social.posts.find((p) => p.actorId === "chad" && p.milestoneId === "first_launch");
    expect(launchChadPost?.text.toLowerCase()).toContain("wait people are actually paying");

    // Trigger Unicorn milestone ($1B valuation with 50% founder equity)
    state = structuredClone(state);
    state.company.valuation = 1_000_000_000;
    state.company.ownership.founder = 0.5;
    const unicornRes = tickSocial(state, r);
    expect(unicornRes.majorMilestone).toBe("unicorn");
    expect(state.social.triggeredMilestones).toContain("unicorn");

    // Verify Chad's complete pivot to opportunist / praise
    const unicornChadPost = state.social.posts.find((p) => p.actorId === "chad" && p.milestoneId === "unicorn");
    expect(unicornChadPost?.text.toLowerCase()).toContain("always knew");

    const unicornChadDm = state.social.dms.find((d) => d.actorId === "chad" && d.milestoneId === "unicorn");
    expect(unicornChadDm?.text.toLowerCase()).toContain("bro");

    // Ensure NO repeat burst on subsequent tick
    const subsequentSocialRes = tickSocial(state, r);
    expect(subsequentSocialRes.majorMilestone).toBeUndefined();

    // -------------------------------------------------------------
    // 4. SAVE & RESTORE INTEGRITY
    // -------------------------------------------------------------
    const saved = exportSave(state);
    const restored = importSave(saved);
    expect(restored).not.toBeNull();
    expect(restored!.founder.name).toBe("Samantha Cross");
    expect(restored!.company.name).toBe("VortexAI");
    expect(restored!.social.posts.length).toBe(state.social.posts.length);
    expect(restored!.social.dms.length).toBe(state.social.dms.length);
    expect(restored!.social.triggeredMilestones).toEqual(state.social.triggeredMilestones);

    // -------------------------------------------------------------
    // 5. EXISTING SUBSYSTEMS SPOT CHECKS
    // -------------------------------------------------------------
    // Technology Primitives
    expect(state.company.primitives.length).toBeGreaterThanOrEqual(2);
    // Capital & Ledger
    expect(state.company.cash).toBeGreaterThan(0);
    // Pause controls
    state = applyCommand(state, { type: "setPaused", paused: true })!;
    expect(state.clock.paused).toBe(true);
    state = applyCommand(state, { type: "setPaused", paused: false })!;
    expect(state.clock.paused).toBe(false);
  });
});
