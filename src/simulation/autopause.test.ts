import { describe, expect, it } from "vitest";
import { produce } from "immer";
import { isLifeOrDeathEvent, isMinorFee } from "./pause";
import { createNewGame } from "./newGame";
import { Rng } from "./rng";
import { buildAcquisitionMail } from "./acquisitionMail";
import { applyCommand } from "./commands";
import type { Mail } from "./types";
import { events } from "../data/events";
import { tickDay } from "./tick";
import { BALANCE } from "../config/balance";

describe("Event Autopause & Speed Restoration", () => {
  it("never treats acquisition offers as life-or-death events", () => {
    const game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
    const r = new Rng(42);

    const baseMail: Mail = {
      id: "acq-1",
      at: { year: 2024, month: 3, day: 1 },
      from: "macrosoft",
      subject: "Buyout inquiry",
      body: "Offer",
      read: false,
      requiresResponse: true,
    };
    const mail = buildAcquisitionMail(game, r, baseMail);

    expect(isLifeOrDeathEvent(mail, game)).toBe(false);

    // Also verify event definition from data/events
    const acqDef = events.find((e) => e.id === "acquisition-inbound")!;
    const defMail: Mail = {
      id: "acq-def",
      at: { ...game.clock.date },
      from: acqDef.from,
      subject: acqDef.title,
      body: acqDef.body,
      eventKind: acqDef.eventKind,
      impact: acqDef.impact,
      choices: acqDef.choices ? structuredClone(acqDef.choices) : undefined,
      read: false,
      requiresResponse: true,
      eventId: acqDef.id,
    };
    expect(isLifeOrDeathEvent(defMail, game)).toBe(false);
  });

  it("does not treat routine events as life-or-death when the company is financially stable", () => {
    const game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
    game.company.cash = 1_000_000;

    // Routine contractor invoice ($8k)
    const contractorDef = events.find((e) => e.id === "contractor-invoice")!;
    const mail: Mail = {
      id: "mail-contractor",
      at: { ...game.clock.date },
      from: contractorDef.from,
      subject: contractorDef.title,
      body: contractorDef.body,
      eventKind: contractorDef.eventKind,
      impact: contractorDef.impact,
      choices: contractorDef.choices ? structuredClone(contractorDef.choices) : undefined,
      read: false,
      requiresResponse: true,
      eventId: contractorDef.id,
    };

    expect(isLifeOrDeathEvent(mail, game)).toBe(false);

    // Support surge ($12k or 10% demand loss)
    const supportDef = events.find((e) => e.id === "support-surge")!;
    const supportMail: Mail = {
      id: "mail-support",
      at: { ...game.clock.date },
      from: supportDef.from,
      subject: supportDef.title,
      body: supportDef.body,
      eventKind: supportDef.eventKind,
      impact: supportDef.impact,
      choices: supportDef.choices ? structuredClone(supportDef.choices) : undefined,
      read: false,
      requiresResponse: true,
      eventId: supportDef.id,
    };

    expect(isLifeOrDeathEvent(supportMail, game)).toBe(false);
  });

  it("identifies explicit crisis events as life-or-death", () => {
    const game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
    game.company.cash = 2_000_000;

    const securityDef = events.find((e) => e.id === "security-incident")!;
    const mail: Mail = {
      id: "mail-sec",
      at: { ...game.clock.date },
      from: securityDef.from,
      subject: securityDef.title,
      body: securityDef.body,
      eventKind: securityDef.eventKind,
      impact: securityDef.impact,
      choices: securityDef.choices ? structuredClone(securityDef.choices) : undefined,
      read: false,
      requiresResponse: true,
      eventId: securityDef.id,
    };

    expect(isLifeOrDeathEvent(mail, game)).toBe(true);
  });

  it("treats costs that would exceed available cash as life-or-death", () => {
    const game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
    game.company.cash = 5_000; // only $5,000 cash!

    const contractorDef = events.find((e) => e.id === "contractor-invoice")!;
    const mail: Mail = {
      id: "mail-contractor",
      at: { ...game.clock.date },
      from: contractorDef.from,
      subject: contractorDef.title,
      body: contractorDef.body,
      eventKind: contractorDef.eventKind,
      choices: contractorDef.choices ? structuredClone(contractorDef.choices) : undefined,
      read: false,
      requiresResponse: true,
      eventId: contractorDef.id,
    };

    // The contractor invoice costs $8,000, which exceeds $5,000 cash and would cause bankruptcy
    expect(isLifeOrDeathEvent(mail, game)).toBe(true);
  });

  it("treats events under low runway as life-or-death", () => {
    const game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
    game.company.cash = 10_000; // Low cash

    const outageMail: Mail = {
      id: "mail-outage",
      at: { ...game.clock.date },
      from: "compute",
      subject: "Provider outage",
      body: "Outage",
      eventKind: "outage",
      choices: [
        { id: "wait", label: "Wait", effects: [{ type: "demand", value: { multiplier: 0.55 } }] }
      ],
      read: false,
      requiresResponse: true,
    };

    expect(isLifeOrDeathEvent(outageMail, game)).toBe(true);
  });

  it("automatically unpauses and restores original speed when a decision is made", () => {
    let state = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus", skipTutorial: true });

    // 1. Player is running game at 4x speed
    state = applyCommand(state, { type: "setSpeed", speed: 4 })!;
    state = applyCommand(state, { type: "setPaused", paused: false })!;
    expect(state.clock.paused).toBe(false);
    expect(state.clock.speed).toBe(4);

    // 2. Critical event arrives and causes autopause
    const criticalMail: Mail = {
      id: "mail-crit-1",
      at: { ...state.clock.date },
      from: "security",
      subject: "Security breach",
      body: "Keys leaked",
      eventKind: "crisis",
      choices: [
        { id: "contain", label: "Contain", effects: [{ type: "cash", value: -10_000 }] },
        { id: "ignore", label: "Ignore", effects: [{ type: "trust", value: -10 }] },
      ],
      read: false,
      requiresResponse: true,
    };
    state = produce(state, (draft) => {
      draft.inbox.unshift(criticalMail);
    });

    // Autopause command dispatched
    state = applyCommand(state, { type: "setPaused", paused: true, reason: "Inbox" })!;
    expect(state.clock.paused).toBe(true);
    expect(state.clock.pauseReasons).toContain("event");
    expect(state.clock.prePauseSpeed).toBe(4);

    // 3. Player makes decision via mailChoice
    state = applyCommand(state, { type: "mailChoice", mailId: "mail-crit-1", choiceId: "contain" })!;

    // Player should automatically be unpaused and returned to 4x speed!
    expect(state.clock.paused).toBe(false);
    expect(state.clock.speed).toBe(4);
    expect(state.clock.pauseReasons).not.toContain("event");
    expect(state.clock.prePauseSpeed).toBeUndefined();
  });

  it("restores original speed even if another non-critical event like an acquisition offer is in the inbox", () => {
    let state = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus", skipTutorial: true });

    // Player is running game at 2x speed
    state = applyCommand(state, { type: "setSpeed", speed: 2 })!;
    state = applyCommand(state, { type: "setPaused", paused: false })!;
    expect(state.clock.paused).toBe(false);
    expect(state.clock.speed).toBe(2);

    // Acquisition offer is sitting in inbox
    const acqMail: Mail = {
      id: "mail-acq",
      at: { ...state.clock.date },
      from: "macrosoft",
      subject: "Acquisition offer",
      body: "We want to buy you",
      eventKind: "decision",
      eventId: "acquisition-inbound",
      choices: [
        { id: "sell", label: "Sell", effects: [{ type: "ending", value: "acquisition" }] },
        { id: "no", label: "Stay independent", effects: [{ type: "hype", value: 8 }] },
      ],
      read: false,
      requiresResponse: true,
    };
    state = produce(state, (draft) => {
      draft.inbox.push(acqMail);
    });

    // Critical event arrives and autopauses
    const criticalMail: Mail = {
      id: "mail-crit-2",
      at: { ...state.clock.date },
      from: "security",
      subject: "Incident",
      body: "Threat",
      eventKind: "crisis",
      choices: [
        { id: "resolve", label: "Resolve", effects: [] },
      ],
      read: false,
      requiresResponse: true,
    };
    state = produce(state, (draft) => {
      draft.inbox.unshift(criticalMail);
    });

    state = applyCommand(state, { type: "setPaused", paused: true, reason: "Inbox" })!;
    expect(state.clock.paused).toBe(true);

    // Player resolves the critical event
    state = applyCommand(state, { type: "mailChoice", mailId: "mail-crit-2", choiceId: "resolve" })!;

    // Despite acquisition offer still having requiresResponse: true,
    // the game MUST automatically unpause and return to 2x speed!
    expect(state.clock.paused).toBe(false);
    expect(state.clock.speed).toBe(2);
    expect(state.clock.pauseReasons).not.toContain("event");
  });

  it("does not unpause if choice leads to an ending (e.g. accepting acquisition)", () => {
    let state = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus", skipTutorial: true });
    state = applyCommand(state, { type: "setSpeed", speed: 2 })!;
    state = applyCommand(state, { type: "setPaused", paused: false })!;

    const acqMail: Mail = {
      id: "mail-acq-exit",
      at: { ...state.clock.date },
      from: "macrosoft",
      subject: "Acquisition offer",
      body: "Buyout",
      eventKind: "decision",
      eventId: "acquisition-inbound",
      choices: [
        { id: "sell", label: "Sell", effects: [{ type: "ending", value: "acquisition" }] },
      ],
      read: false,
      requiresResponse: true,
    };
    state = produce(state, (draft) => {
      draft.inbox.push(acqMail);
    });

    state = applyCommand(state, { type: "mailChoice", mailId: "mail-acq-exit", choiceId: "sell" })!;
    expect(state.endingId).toBe("acquisition");
    expect(state.clock.paused).toBe(true);
  });

  it("evaluates autopause condition correctly for critical vs acquisition events", () => {
    const game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus", skipTutorial: true });
    game.company.seenMarket = true;
    game.clock.paused = false;
    game.clock.speed = 2;
    game.clock.pauseReasons = [];
    game.settings.pauseOnEvents = true;

    const acqMail: Mail = {
      id: "mail-acq-store",
      at: { ...game.clock.date },
      from: "macrosoft",
      subject: "Buyout Offer",
      body: "We want to buy you",
      eventKind: "decision",
      eventId: "acquisition-inbound",
      choices: [
        { id: "sell", label: "Sell", effects: [{ type: "ending", value: "acquisition" }] },
        { id: "no", label: "Decline", effects: [{ type: "hype", value: 8 }] },
      ],
      read: false,
      requiresResponse: true,
    };

    const critMail: Mail = {
      id: "mail-crit-store",
      at: { ...game.clock.date },
      from: "security",
      subject: "Critical Incident",
      body: "Emergency",
      eventKind: "crisis",
      choices: [
        { id: "fix", label: "Fix", effects: [] },
      ],
      read: false,
      requiresResponse: true,
    };

    const prev = game;
    const nextWithAcq = produce(prev, (draft) => {
      draft.inbox.unshift(acqMail);
    });
    const nextWithCrit = produce(prev, (draft) => {
      draft.inbox.unshift(critMail);
    });

    // Check condition for acquisition offer: MUST NOT autopause
    const shouldAutopauseAcq = nextWithAcq.inbox.some(
      (m) => m.requiresResponse && isLifeOrDeathEvent(m, nextWithAcq) && !prev.inbox.some((p) => p.id === m.id)
    );
    expect(shouldAutopauseAcq).toBe(false);

    // Check condition for critical crisis: MUST autopause
    const shouldAutopauseCrit = nextWithCrit.inbox.some(
      (m) => m.requiresResponse && isLifeOrDeathEvent(m, nextWithCrit) && !prev.inbox.some((p) => p.id === m.id)
    );
    expect(shouldAutopauseCrit).toBe(true);
  });

  describe("Minor Fee Auto-Charge", () => {
    it("correctly identifies minor fees vs critical or acquisition events", () => {
      const game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
      game.company.cash = 1_000_000;

      const contractorDef = events.find((e) => e.id === "contractor-invoice")!;
      const contractorMail: Mail = {
        id: "m-contractor",
        at: { ...game.clock.date },
        from: contractorDef.from,
        subject: contractorDef.title,
        body: contractorDef.body,
        choices: contractorDef.choices ? structuredClone(contractorDef.choices) : undefined,
        requiresResponse: true,
        read: false,
        eventId: contractorDef.id,
      };

      const recruiterDef = events.find((e) => e.id === "recruiter-fee")!;
      const recruiterMail: Mail = {
        id: "m-recruiter",
        at: { ...game.clock.date },
        from: recruiterDef.from,
        subject: recruiterDef.title,
        body: recruiterDef.body,
        choices: recruiterDef.choices ? structuredClone(recruiterDef.choices) : undefined,
        requiresResponse: true,
        read: false,
        eventId: recruiterDef.id,
      };

      const acqMail: Mail = {
        id: "m-acq",
        at: { ...game.clock.date },
        from: "macrosoft",
        subject: "Acquisition",
        body: "Offer",
        choices: [
          { id: "sell", label: "Sell", effects: [{ type: "ending", value: "acquisition" }] },
          { id: "no", label: "Decline", effects: [] },
        ],
        requiresResponse: true,
        read: false,
        eventId: "acquisition-inbound",
      };

      const crisisMail: Mail = {
        id: "m-crisis",
        at: { ...game.clock.date },
        from: "sec",
        subject: "Crisis",
        body: "Incident",
        eventKind: "crisis",
        choices: [{ id: "c1", label: "Resolve", effects: [] }],
        requiresResponse: true,
        read: false,
        eventId: "security-incident",
      };

      expect(isMinorFee(contractorMail, game)).toBe(true);
      expect(isMinorFee(recruiterMail, game)).toBe(true);
      expect(isMinorFee(acqMail, game)).toBe(false);
      expect(isMinorFee(crisisMail, game)).toBe(false);
    });

    it("automatically charges minor fees when ignored after 14 days in tickDay", () => {
      let game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
      game = produce(game, (draft) => {
        draft.company.cash = 1_000_000;
        draft.company.seenMarket = true;
        draft.pendingMentor = null;
        draft.tasks = [];
        draft.products = [];
        draft.employees = []; // isolate payroll costs
      });

      const contractorDef = events.find((e) => e.id === "contractor-invoice")!;
      const contractorMail: Mail = {
        id: "m-auto-charge",
        at: { ...game.clock.date },
        from: contractorDef.from,
        subject: contractorDef.title,
        body: contractorDef.body,
        eventKind: contractorDef.eventKind,
        impact: contractorDef.impact,
        choices: contractorDef.choices ? structuredClone(contractorDef.choices) : undefined,
        requiresResponse: true,
        read: false,
        eventId: contractorDef.id,
        createdTick: game.clock.tick,
        autoChargeDays: BALANCE.MINOR_FEE_AUTO_CHARGE_DAYS,
      };

      game = produce(game, (draft) => {
        draft.inbox.unshift(contractorMail);
      });

      // Advance 13 days: should NOT have charged yet
      for (let day = 0; day < 13; day++) {
        game = tickDay(game);
        const mail = game.inbox.find((m) => m.id === "m-auto-charge")!;
        expect(mail.requiresResponse).toBe(true);
        expect(mail.autoCharged).toBeFalsy();
      }

      // Advance 14th day: Net 14 terms expire -> auto-charge fires!
      game = tickDay(game);
      const chargedMail = game.inbox.find((m) => m.id === "m-auto-charge")!;
      expect(chargedMail.requiresResponse).toBe(false);
      expect(chargedMail.choices).toBeUndefined();
      expect(chargedMail.autoCharged).toBe(true);
      expect(chargedMail.impact).toContain("Auto-charged $8,000 after 14 days");
      expect(chargedMail.body).toContain("[Auto-Charged: $8,000 debited automatically");

      // Verify cash was debited by $8,000 (apartment rent may run if month rolled, so check accounting debit)
      expect(game.news.some((n) => n.headline.includes("Auto-debit") && n.impact?.includes("-$8,000"))).toBe(true);
    });

    it("does not auto-charge if the player explicitly disputes before 14 days", () => {
      let game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
      game = produce(game, (draft) => {
        draft.company.cash = 1_000_000;
        draft.company.seenMarket = true;
        draft.pendingMentor = null;
        draft.tasks = [];
        draft.products = [];
        draft.employees = [];
      });

      const recruiterDef = events.find((e) => e.id === "recruiter-fee")!;
      const recruiterMail: Mail = {
        id: "m-recruiter-refuse",
        at: { ...game.clock.date },
        from: recruiterDef.from,
        subject: recruiterDef.title,
        body: recruiterDef.body,
        choices: recruiterDef.choices ? structuredClone(recruiterDef.choices) : undefined,
        requiresResponse: true,
        read: false,
        eventId: recruiterDef.id,
        createdTick: game.clock.tick,
        autoChargeDays: 14,
      };

      game = produce(game, (draft) => {
        draft.inbox.unshift(recruiterMail);
      });

      // Advance 5 days
      for (let d = 0; d < 5; d++) {
        game = tickDay(game);
      }

      // Player disputes (refuses) the fee on day 5
      const initialBacklash = game.company.backlash;
      game = applyCommand(game, { type: "mailChoice", mailId: "m-recruiter-refuse", choiceId: "refuse" })!;
      expect(game.company.backlash).toBeGreaterThan(initialBacklash);

      const mailAfterRefuse = game.inbox.find((m) => m.id === "m-recruiter-refuse")!;
      expect(mailAfterRefuse.requiresResponse).toBe(false);

      // Advance another 15 days (past the 14-day threshold)
      for (let d = 0; d < 15; d++) {
        game = tickDay(game);
      }

      const finalMail = game.inbox.find((m) => m.id === "m-recruiter-refuse")!;
      expect(finalMail.autoCharged).toBeFalsy();
      expect(game.news.some((n) => n.headline.includes("Auto-debit"))).toBe(false);
    });

    it("never auto-charges major strategic decisions or crisis events", () => {
      let game = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus" });
      game = produce(game, (draft) => {
        draft.company.cash = 1_000_000;
        draft.company.seenMarket = true;
        draft.pendingMentor = null;
        draft.tasks = [];
        draft.products = [];
        draft.employees = [];
      });

      const acqMail: Mail = {
        id: "m-major-acq",
        at: { ...game.clock.date },
        from: "macrosoft",
        subject: "Strategic Acquisition Offer",
        body: "Offer details...",
        choices: [
          { id: "sell", label: "Sell", effects: [{ type: "ending", value: "acquisition" }] },
          { id: "no", label: "Decline", effects: [{ type: "hype", value: 5 }] },
        ],
        requiresResponse: true,
        read: false,
        eventId: "acquisition-inbound",
        createdTick: game.clock.tick,
      };

      game = produce(game, (draft) => {
        draft.inbox.unshift(acqMail);
      });

      // Advance 20 days
      for (let d = 0; d < 20; d++) {
        game = tickDay(game);
      }

      const mail = game.inbox.find((m) => m.id === "m-major-acq")!;
      expect(mail.requiresResponse).toBe(true);
      expect(mail.autoCharged).toBeFalsy();
      expect(mail.choices?.length).toBe(2);
    });
  });

  describe("Player Unpausing & Speed Controls", () => {
    it("allows the player to explicitly unpause when productReady is active", () => {
      let state = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus", skipTutorial: true });
      state = applyCommand(state, { type: "setSpeed", speed: 2 })!;
      state = produce(state, (draft) => {
        draft.clock.pauseReasons = ["productReady"];
        draft.clock.paused = true;
      });

      // Player unpauses via setPaused(false)
      state = applyCommand(state, { type: "setPaused", paused: false })!;
      expect(state.clock.paused).toBe(false);
      expect(state.clock.pauseReasons).not.toContain("productReady");

      // Set productReady pause again
      state = produce(state, (draft) => {
        draft.clock.pauseReasons = ["productReady"];
        draft.clock.paused = true;
      });

      // Player selects speed 4x: clears productReady and resumes
      state = applyCommand(state, { type: "setSpeed", speed: 4 })!;
      expect(state.clock.paused).toBe(false);
      expect(state.clock.speed).toBe(4);
      expect(state.clock.pauseReasons).not.toContain("productReady");
    });

    it("allows explicit unpause of inbox event via reason: Inbox", () => {
      let state = createNewGame({ founderName: "Elena", companyName: "VectorPrime", cofounderId: "marcus", skipTutorial: true });
      state = applyCommand(state, { type: "setSpeed", speed: 4 })!;
      state = applyCommand(state, { type: "setPaused", paused: true, reason: "Inbox" })!;
      expect(state.clock.paused).toBe(true);
      expect(state.clock.prePauseSpeed).toBe(4);

      // Player explicitly unpauses
      state = applyCommand(state, { type: "setPaused", paused: false, reason: "Inbox" })!;
      expect(state.clock.paused).toBe(false);
      expect(state.clock.speed).toBe(4);
      expect(state.clock.pauseReasons).not.toContain("event");
      expect(state.clock.prePauseSpeed).toBeUndefined();
    });
  });
});

