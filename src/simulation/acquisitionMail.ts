import { money } from "../ui/format";
import { valuationOf } from "./derived";
import type { Rng } from "./rng";
import type { GameState, Mail } from "./types";
import { handleFor } from "./social";

export function buildAcquisitionMail(state: GameState, r: Rng, mail: Mail): Mail {
  const currentVal = Math.max(state.company.valuation ?? 0, valuationOf(state));
  const premium = r.float(1.25, 1.6);
  const offerVal = Math.round((currentVal * premium) / 100_000) * 100_000;
  const founderEquity = state.company.ownership.founder;
  const founderProceeds = Math.round(offerVal * founderEquity);

  const acquirers = [
    { name: "Macrosoft", sender: "Maya Chen", title: "Corporate Development", email: "mchen@corp.macrosoft.com" },
    { name: "MetaMind", sender: "David Sterling", title: "VP of Strategic M&A", email: "dsterling@metamind.ai" },
    { name: "OpenBrain", sender: "Rachel Vance", title: "Head of Corporate Development", email: "rvance@openbrain.com" },
  ];
  const buyer = r.pick(acquirers);
  const founderName = state.founder.name || "Founder";
  const companyName = state.company.name;
  const founderHandle = handleFor(founderName);
  const companyHandle = handleFor(companyName);

  mail.sender = {
    name: buyer.sender,
    role: buyer.title,
    organization: buyer.name,
    handle: buyer.email,
    avatarInitial: buyer.name[0],
    avatarColor: "#8f3f2d",
  };

  mail.recipient = {
    name: founderName,
    organization: companyName,
    handle: `${founderHandle}@${companyHandle}.ai`,
  };

  mail.from = buyer.name.toLowerCase();
  mail.subject = `Strategic combination inquiry: ${companyName}`;
  mail.body = `${founderName},

We have been closely tracking ${companyName}'s trajectory and product velocity in market. Our executive leadership believes there is an exceptional strategic and cultural fit between what your team has built and our platform roadmap.

We would like to formally explore acquiring ${companyName} at an indicative enterprise valuation of ${money(offerVal)}, representing a ${Math.round((premium - 1) * 100)}% premium over your current benchmark valuation of ${money(currentVal)}.

Under this structure, your personal equity payout would be approximately ${money(founderProceeds)}. We would integrate your core team and provide accelerated distribution across our global customer footprint.

Please let us know if you are open to convening an executive diligence session this week.`;

  mail.context = [
    { label: "Current valuation", value: money(currentVal) },
    { label: "Acquisition offer", value: `${money(offerVal)} (+${Math.round((premium - 1) * 100)}%)` },
    { label: "Your equity stake", value: `${(founderEquity * 100).toFixed(1)}%` },
    { label: "Your proceeds", value: money(founderProceeds) },
  ];

  mail.warning = "Selling the company concludes your independent founder story.";

  mail.choices = [
    {
      id: "sell",
      label: `Accept ${buyer.name}'s offer (${money(offerVal)})`,
      effects: [{ type: "ending", value: "acquisition" }],
      consequences: [
        `Company acquired by ${buyer.name} for ${money(offerVal)}`,
        `Founder receives ${money(founderProceeds)} in cash proceeds`,
        "Concludes your company's independent story",
      ],
      warning: "This immediately concludes the game with an acquisition exit.",
    },
    {
      id: "no",
      label: "Decline and stay independent",
      effects: [{ type: "hype", value: 8 }, { type: "morale", value: 4 }],
      consequences: [
        `Reject ${buyer.name}'s buyout and remain an independent company`,
        "+8 Company Hype as acquisition rumors leak to the press",
        "+4 Team Morale from betting on yourselves",
      ],
    },
  ];

  mail.impact = `Choose between a ${money(offerVal)} buyout exit or a hype & morale boost to stay independent.`;
  mail.requiresResponse = true;
  return mail;
}
