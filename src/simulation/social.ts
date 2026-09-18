import { BALANCE } from "../config/balance";
import { AMBIENT_POST_TEMPLATES, SOCIAL_MILESTONES, type SocialMilestoneDef } from "../data/social";
import { monthlyArr, valuationOf } from "./derived";
import { Rng, uid } from "./rng";
import type { GameState, SocialDm, SocialPost, SocialState } from "./types";

export function handleFor(name: string): string {
  const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  return sanitized.length > 0 ? sanitized : "founder";
}

export function resolveSocialTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    return vars[key] ?? match;
  });
}

export function getSocialTemplateVars(state: GameState): Record<string, string> {
  const founderName = state.founder.name || "Founder";
  const companyName = state.company.name || "Startup";
  const founderHandle = handleFor(founderName);
  const companyHandle = handleFor(companyName);
  const latestProduct = state.products[state.products.length - 1]?.name ?? "Product";

  return {
    founder: founderName,
    founderHandle,
    company: companyName,
    companyHandle,
    product: latestProduct,
  };
}

export function initSocialState(state: GameState, r: Rng): SocialState {
  const vars = getSocialTemplateVars(state);
  const genesis = SOCIAL_MILESTONES.find((m) => m.id === "genesis");
  const posts: SocialPost[] = [];
  const dms: SocialDm[] = [];

  if (genesis) {
    for (const postDef of genesis.posts) {
      posts.push({
        id: uid(r, "post"),
        actorId: postDef.actorId,
        text: resolveSocialTemplate(postDef.text, vars),
        tick: state.clock.tick,
        date: { ...state.clock.date },
        likes: r.int(4, 38),
        reposts: r.int(0, 12),
        milestoneId: "genesis",
        kind: postDef.kind ?? "post",
      });
    }

    for (const dmDef of genesis.dms) {
      dms.push({
        id: uid(r, "dm"),
        actorId: dmDef.actorId,
        text: resolveSocialTemplate(dmDef.text, vars),
        tick: state.clock.tick,
        date: { ...state.clock.date },
        read: false,
        milestoneId: "genesis",
      });
    }
  }

  return {
    posts,
    dms,
    triggeredMilestones: ["genesis"],
    lastAmbientTick: state.clock.tick,
  };
}

export function isMilestoneSatisfied(id: string, state: GameState): boolean {
  const arr = Math.max(state.company.lastMonthlyRevenue * 12, monthlyArr(state));
  const val = Math.max(state.company.valuation ?? 0, valuationOf(state));
  const founderNetWorth = state.company.ownership.founder * val;

  switch (id) {
    case "genesis":
      return true;
    case "first_launch":
      return state.company.productsLaunched >= 1;
    case "arr_10k":
      return arr >= 10_000;
    case "arr_100k":
      return arr >= 100_000;
    case "arr_1m":
      return arr >= 1_000_000;
    case "first_funding":
      return (state.funding.raisedTotal ?? 0) > 0;
    case "arr_10m":
      return arr >= 10_000_000;
    case "val_100m":
      return val >= 100_000_000;
    case "unicorn":
      return val >= 1_000_000_000;
    case "decacorn":
      return val >= 10_000_000_000;
    case "billionaire":
      return founderNetWorth >= 1_000_000_000;
    case "provider_outage":
      return state.providerOutages.some((o) => o.untilTick > state.clock.tick);
    case "backlash_spike":
      return state.company.backlash >= 40;
    default:
      return false;
  }
}

export function applySocialMilestone(
  state: GameState,
  milestone: SocialMilestoneDef,
  r: Rng,
): { newPosts: SocialPost[]; newDms: SocialDm[] } {
  const vars = getSocialTemplateVars(state);
  const newPosts: SocialPost[] = [];
  const newDms: SocialDm[] = [];

  const isMajor = milestone.id === "unicorn" || milestone.id === "decacorn" || milestone.id === "billionaire";
  const likeBase = isMajor ? 1200 : milestone.id === "val_100m" || milestone.id === "arr_10m" ? 340 : 45;
  const repostBase = isMajor ? 380 : milestone.id === "val_100m" || milestone.id === "arr_10m" ? 85 : 8;

  for (const p of milestone.posts) {
    newPosts.push({
      id: uid(r, "post"),
      actorId: p.actorId,
      text: resolveSocialTemplate(p.text, vars),
      tick: state.clock.tick,
      date: { ...state.clock.date },
      likes: likeBase + r.int(10, 400),
      reposts: repostBase + r.int(2, 120),
      milestoneId: milestone.id,
      kind: p.kind ?? "post",
    });
  }

  for (const d of milestone.dms) {
    newDms.push({
      id: uid(r, "dm"),
      actorId: d.actorId,
      text: resolveSocialTemplate(d.text, vars),
      tick: state.clock.tick,
      date: { ...state.clock.date },
      read: false,
      milestoneId: milestone.id,
    });
  }

  return { newPosts, newDms };
}

export function generateAmbientSocialPost(state: GameState, r: Rng): SocialPost {
  const vars = getSocialTemplateVars(state);
  const template = r.pick(AMBIENT_POST_TEMPLATES);
  const likes = r.int(12, 180);
  const reposts = r.int(1, 35);

  return {
    id: uid(r, "post"),
    actorId: template.actorId,
    text: resolveSocialTemplate(template.text, vars),
    tick: state.clock.tick,
    date: { ...state.clock.date },
    likes,
    reposts,
    kind: "post",
  };
}

export function tickSocial(state: GameState, r: Rng): { newPosts: SocialPost[]; newDms: SocialDm[]; majorMilestone?: string } {
  if (!state.social) {
    state.social = initSocialState(state, r);
  }

  const triggeredSet = new Set(state.social.triggeredMilestones);
  const newPosts: SocialPost[] = [];
  const newDms: SocialDm[] = [];
  let majorMilestone: string | undefined;

  // 1. Check milestone progression
  for (const milestone of SOCIAL_MILESTONES) {
    if (triggeredSet.has(milestone.id)) continue;
    if (isMilestoneSatisfied(milestone.id, state)) {
      triggeredSet.add(milestone.id);
      const res = applySocialMilestone(state, milestone, r);
      newPosts.push(...res.newPosts);
      newDms.push(...res.newDms);
      if (milestone.id === "unicorn" || milestone.id === "decacorn" || milestone.id === "billionaire") {
        majorMilestone = milestone.id;
      }
    }
  }
  state.social.triggeredMilestones = Array.from(triggeredSet);

  // 2. Ambient feed generation (paced every ~4-5 simulated days)
  const daysSinceLast = state.clock.tick - state.social.lastAmbientTick;
  if (daysSinceLast >= BALANCE.SOCIAL_AMBIENT_INTERVAL_DAYS) {
    state.social.lastAmbientTick = state.clock.tick;
    if (r.chance(0.65)) {
      newPosts.push(generateAmbientSocialPost(state, r));
    }
  }

  // 3. Prepend new posts & DMs while preserving caps
  if (newPosts.length > 0) {
    state.social.posts = [...newPosts, ...state.social.posts].slice(0, BALANCE.SOCIAL_POSTS_CAP);
  }
  if (newDms.length > 0) {
    state.social.dms = [...newDms, ...state.social.dms].slice(0, BALANCE.SOCIAL_DMS_CAP);
  }

  return { newPosts, newDms, majorMilestone };
}
