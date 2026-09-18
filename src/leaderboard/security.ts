import { ACHIEVEMENT_MAP } from "../simulation/achievements.js";
import { ENDINGS } from "../simulation/endings.js";
import { calculateScoreFromComponents } from "./scoring.js";
import type { LeaderboardEntry, LeaderboardSubmission, ScoreBreakdown } from "./types.js";

const RUN_SALT = "compounding_ai_seed_salt_982348_prod";

// Lightweight, pure TypeScript SHA-256 implementation to guarantee zero-dependency
// execution in Node serverless, edge, browser Web Worker, and test environments.
export function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 300; i += candidate) {
        isPrime[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while ((ascii.length % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15];
      const w2 = w[i - 2];

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp1 =
        hash[7] +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ch +
        k[i] +
        (w[i] =
          i < 16
            ? w[i]
            : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
      const temp2 =
        (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
        maj;

      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? "0" : "") + byte.toString(16);
    }
  }
  return result;
}

export function computeRunSeal(params: {
  runId: string;
  seed: number;
  endingId: string;
  daysElapsed: number;
  peakValuation: number;
  productsLaunched: number;
  scandals: number;
}): string {
  const payload = [
    params.runId,
    params.seed,
    params.endingId,
    params.daysElapsed,
    Math.round(params.peakValuation),
    params.productsLaunched,
    params.scandals,
    RUN_SALT,
  ].join("::");
  return sha256Sync(payload);
}

export function sanitizeHandle(raw: string): string {
  const clean = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 16);
  return clean || "FOUNDER";
}

export function sanitizeQuote(raw: string | undefined): string {
  if (!raw) return "";
  return raw
    .trim()
    .replace(/[<>{}]/g, "")
    .slice(0, 90);
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  verifiedEntry?: LeaderboardEntry;
  scoreBreakdown?: ScoreBreakdown;
}

export function validateRunIntegrity(sub: LeaderboardSubmission): ValidationResult {
  if (!sub || typeof sub !== "object") {
    return { valid: false, reason: "Malformed submission payload" };
  }

  // 1. Basic field checks
  if (!sub.runId || typeof sub.runId !== "string" || sub.runId.length > 64) {
    return { valid: false, reason: "Invalid runId" };
  }
  if (!sub.companyName || typeof sub.companyName !== "string") {
    return { valid: false, reason: "Invalid company name" };
  }
  if (!sub.endingId || !ENDINGS[sub.endingId]) {
    return { valid: false, reason: `Unknown ending: ${sub.endingId}` };
  }

  // 2. Temporal invariants
  const days = sub.clock?.daysElapsed;
  if (typeof days !== "number" || days < 1 || days > 365 * 25) {
    return { valid: false, reason: `Invalid elapsed days count: ${days}` };
  }

  // 3. Peak valuation & scale invariants
  const peakVal = sub.stats?.peakValuation ?? 0;
  if (typeof peakVal !== "number" || isNaN(peakVal) || peakVal < 0) {
    return { valid: false, reason: "Invalid peak valuation" };
  }
  // Max plausible valuation in the simulation economy: $50 Trillion
  if (peakVal > 50_000_000_000_000) {
    return { valid: false, reason: "Peak valuation exceeds economy physical bound" };
  }

  // If claimed peak valuation > $25M, player must have launched products or raised funding
  const products = sub.stats?.productsLaunched ?? 0;
  const raised = sub.company?.raisedTotal ?? 0;
  if (peakVal > 25_000_000 && products === 0 && raised === 0) {
    return { valid: false, reason: "Impossible valuation without products or capital" };
  }

  // 4. Ending requirements verification
  if (sub.endingId === "unicorn" && peakVal < 1_000_000_000) {
    return { valid: false, reason: "Unicorn ending requires at least $1B valuation" };
  }
  if (sub.endingId === "ipo" && peakVal < 3_000_000_000) {
    return { valid: false, reason: "IPO ending requires late-stage valuation" };
  }
  if (sub.endingId === "quiet-profit" && (sub.company?.cash ?? 0) < 5_000_000) {
    return { valid: false, reason: "Quiet profit ending requires healthy treasury" };
  }

  // 5. Cash sanity bounds
  const cash = sub.company?.cash ?? 0;
  if (typeof cash !== "number" || isNaN(cash)) {
    return { valid: false, reason: "Invalid cash value" };
  }
  // Cash cannot exceed reasonable max treasury
  if (cash > 25_000_000_000_000) {
    return { valid: false, reason: "Treasury exceeds plausible bounds" };
  }

  // 6. Cryptographic seal verification
  const expectedSeal = computeRunSeal({
    runId: sub.runId,
    seed: sub.seed,
    endingId: sub.endingId,
    daysElapsed: days,
    peakValuation: peakVal,
    productsLaunched: products,
    scandals: sub.stats?.scandals ?? 0,
  });

  if (sub.seal !== expectedSeal) {
    return { valid: false, reason: "Tamper detection: run seal mismatch" };
  }

  // 7. Verified achievements: filter out any invalid or non-existent achievement IDs
  const validAchievements: string[] = [];
  if (Array.isArray(sub.achievements)) {
    for (const ach of sub.achievements) {
      if (ACHIEVEMENT_MAP.has(ach)) {
        // Enforce criteria for highest-tier achievements
        if (ach === "unicorn-club" && peakVal < 1_000_000_000) continue;
        if (ach === "decacorn" && peakVal < 10_000_000_000) continue;
        if (ach === "bootstrapped" && raised > 0) continue;
        if (ach === "ring-the-bell" && sub.endingId !== "ipo") continue;
        if (ach === "infrastructure-monopoly" && sub.endingId !== "monopoly") continue;
        if (ach === "quiet-operator" && sub.endingId !== "quiet-profit") continue;
        validAchievements.push(ach);
      }
    }
  }

  // 8. Canonical server-side score calculation (client cannot dictate score)
  const breakdown = calculateScoreFromComponents({
    peakValuation: peakVal,
    cash,
    arr: Math.max(0, sub.arr ?? 0),
    endingId: sub.endingId,
    daysElapsed: days,
    productsLaunched: products,
    achievements: validAchievements,
    trust: sub.company?.trust ?? 50,
    hype: sub.company?.hype ?? 10,
    scandals: sub.stats?.scandals ?? 0,
  });

  const cleanHandle = sanitizeHandle(sub.handle);
  const cleanQuote = sanitizeQuote(sub.quote);
  const endingTitle = ENDINGS[sub.endingId]?.title ?? "Concluded";

  const entry: LeaderboardEntry = {
    id: sub.runId,
    handle: cleanHandle,
    companyName: sub.companyName.trim().slice(0, 32),
    founderName: (sub.founderName ?? cleanHandle).trim().slice(0, 32),
    score: breakdown.totalScore,
    tier: breakdown.tier,
    endingId: sub.endingId,
    endingTitle,
    valuation: peakVal,
    cash,
    arr: Math.max(0, sub.arr ?? 0),
    year: sub.clock?.year ?? 2024,
    daysElapsed: days,
    productsCount: products,
    employeesCount: sub.stats?.peakEmployees ?? 2,
    achievements: validAchievements,
    quote: cleanQuote,
    verified: true,
    createdAt: Date.now(),
  };

  return {
    valid: true,
    verifiedEntry: entry,
    scoreBreakdown: breakdown,
  };
}
