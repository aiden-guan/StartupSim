import type { SocialActor } from "../simulation/types";

export const SOCIAL_ACTORS: SocialActor[] = [
  {
    id: "chad",
    name: "Chad Vance",
    handle: "chadvance",
    bio: "Angel, vibe maximalist. Ex-frat. Grind never stops. 🚀",
    role: "bully",
    avatarBg: "#c45b38",
    avatarInitial: "C",
    verified: true,
  },
  {
    id: "elena",
    name: "Dr. Elena Rostova",
    handle: "elena_ai",
    bio: "Research scientist. AI safety, scaling laws & distributed models.",
    role: "skeptic_friend",
    avatarBg: "#34667a",
    avatarInitial: "E",
    verified: true,
  },
  {
    id: "marcus",
    name: "Marcus Sterling",
    handle: "marcus_vc",
    bio: "Partner @ BluePeak Ventures. Backing high-conviction day-zero founders.",
    role: "investor_reject",
    avatarBg: "#3b6b55",
    avatarInitial: "M",
    verified: true,
  },
  {
    id: "sam",
    name: "Sam Rivera",
    handle: "sam_codes",
    bio: "Indie builder & hacker. Building in public. Ship or sink.",
    role: "supporter",
    avatarBg: "#556b3e",
    avatarInitial: "S",
    verified: false,
  },
  {
    id: "sarah",
    name: "Sarah Lin",
    handle: "sarah_lin_pm",
    bio: "Product Lead. Ex-coworker. Building software that respects humans.",
    role: "former_coworker",
    avatarBg: "#6d4a7a",
    avatarInitial: "S",
    verified: false,
  },
  {
    id: "viktor",
    name: "Viktor Brandt",
    handle: "viktor_nex",
    bio: "Founder & CEO @ NexaAI. Frontier enterprise infrastructure.",
    role: "rival",
    avatarBg: "#334155",
    avatarInitial: "V",
    verified: true,
  },
  {
    id: "techdispatch",
    name: "TechDispatch",
    handle: "techdispatch",
    bio: "Real-time Silicon Valley intelligence, funding rounds, and leaks.",
    role: "journalist",
    avatarBg: "#1e293b",
    avatarInitial: "T",
    verified: true,
  },
  {
    id: "tech_memes",
    name: "Silicon Silly",
    handle: "siliconsilly",
    bio: "Chronicling the AI bubble one GPU bill at a time.",
    role: "influencer",
    avatarBg: "#8a5832",
    avatarInitial: "S",
    verified: false,
  },
  {
    id: "enterprise_buyer",
    name: "Jordan Hayes",
    handle: "jhayes_tech",
    bio: "VP of Engineering. Deploying ML that actually works.",
    role: "customer",
    avatarBg: "#2d545e",
    avatarInitial: "J",
    verified: true,
  },
];

export const ACTOR_BY_ID = Object.fromEntries(SOCIAL_ACTORS.map((a) => [a.id, a]));

export interface SocialMilestoneDef {
  id: string;
  name: string;
  posts: Array<{
    actorId: string;
    text: string;
    kind?: "post" | "quote" | "reply";
    replyToActorId?: string;
    quotePost?: { author: string; handle: string; text: string };
  }>;
  dms: Array<{
    actorId: string;
    text: string;
  }>;
}

export const SOCIAL_MILESTONES: SocialMilestoneDef[] = [
  {
    id: "genesis",
    name: "Company Founded",
    posts: [
      {
        actorId: "chad",
        text: "bro you're still doing that startup thing 💀 'Founder' in the bio is crazy just get a real job",
      },
      {
        actorId: "sam",
        text: "Excited to see what @{founderHandle} builds with @{companyHandle}. The world needs more independent builders shipping code.",
      },
      {
        actorId: "tech_memes",
        text: "Starting an AI company in your apartment with zero GPUs: 10/10 bravery, 2/10 survival probability.",
      },
    ],
    dms: [
      {
        actorId: "chad",
        text: "yo {founder} please tell me you're applying to real internships this summer man 😂 you can't live off savings forever",
      },
      {
        actorId: "sarah",
        text: "Hey {founder}! Saw on LinkedIn that you took the plunge to build {company}. Brave move leaving big tech! Let's catch up sometime soon.",
      },
    ],
  },
  {
    id: "first_launch",
    name: "First Product Launch",
    posts: [
      {
        actorId: "techdispatch",
        text: "LAUNCH: Early-stage AI lab {company} has released its inaugural product, {product}. Initial focus appears to be lean vertical workflows.",
      },
      {
        actorId: "chad",
        text: "just saw {product} on my timeline lol. wait people are actually paying for this??",
      },
      {
        actorId: "viktor",
        text: "Another wrapper hits the timeline. Cute demo, but let's see how the unit economics survive once token volumes pick up.",
      },
      {
        actorId: "sam",
        text: "Just tested {product} from @{companyHandle}. Refreshingly fast UX compared to bloated incumbents. Rooting for you guys.",
      },
    ],
    dms: [
      {
        actorId: "chad",
        text: "alright man I saw {product}. gotta admit the website doesn't look totally terrible. did your cofounder build the whole thing? 😉",
      },
      {
        actorId: "marcus",
        text: "Hi {founder}, caught your launch of {product}. Not quite at the institutional scale for BluePeak right now, but please keep us updated as you hit retention milestones.",
      },
    ],
  },
  {
    id: "arr_10k",
    name: "First $10k ARR Traction",
    posts: [
      {
        actorId: "elena",
        text: "Early paid conversion data on @{companyHandle} is somewhat intriguing. Still curious how long-term retention holds up after initial novelty fades.",
      },
      {
        actorId: "tech_memes",
        text: "Nothing hits quite like your first $10k ARR. You're officially no longer a hobby, you're an extremely underpaid enterprise vendor.",
      },
      {
        actorId: "sam",
        text: "Hearing great things from teams using @{companyHandle}'s workflow. Proof that tight customer focus beats raw model size.",
      },
    ],
    dms: [
      {
        actorId: "chad",
        text: "wait are people actually paying recurring subscriptions for {company}?? ngl I thought this was gonna die in two weeks",
      },
    ],
  },
  {
    id: "arr_100k",
    name: "Crossing $100k ARR",
    posts: [
      {
        actorId: "techdispatch",
        text: "Sources: Bootstrapped AI startup {company} quietly crosses $100K ARR run-rate with high capital efficiency.",
      },
      {
        actorId: "chad",
        text: "ngl I thought {company} was a meme but I keep seeing their product in group chats. did @{founderHandle} actually cook something?",
      },
      {
        actorId: "enterprise_buyer",
        text: "Replaced two legacy software seats with @{companyHandle} this week. ROI was immediate for our team.",
      },
    ],
    dms: [
      {
        actorId: "sarah",
        text: "Hey {founder}! Seeing {company} referenced on product Twitter today! So awesome seeing your bet pay off. Are you looking for PMs yet?",
      },
    ],
  },
  {
    id: "arr_1m",
    name: "$1M ARR Inflection",
    posts: [
      {
        actorId: "marcus",
        text: "Watching vertical workflow startups reach $1M ARR faster than previous SaaS cycles. Companies like @{companyHandle} demonstrate that speed of execution is the defensible moat.",
      },
      {
        actorId: "chad",
        text: "yo I keep seeing {company} everywhere on my feed. @{founderHandle} when are you buying me a drink in SF??",
      },
      {
        actorId: "elena",
        text: "Credit where due: @{companyHandle} has navigated model dependencies better than anticipated. Real customer stickiness.",
      },
    ],
    dms: [
      {
        actorId: "marcus",
        text: "Hey {founder}, hope you're having a productive quarter. We've been tracking {company}'s inflection from afar and are extremely impressed. Would love to grab coffee in Hayes Valley next week if you have 20 minutes.",
      },
      {
        actorId: "chad",
        text: "bro!! haven't talked in forever, how have you been? we should grab dinner next time you're back in the Bay 😂",
      },
    ],
  },
  {
    id: "first_funding",
    name: "First Institutional Capital",
    posts: [
      {
        actorId: "techdispatch",
        text: "VENTURE: {company} has secured institutional backing to expand its engineering team and compute capacity.",
      },
      {
        actorId: "viktor",
        text: "Capital is easy to find in this market. Converting compute credits into lasting gross margins is the hard part.",
      },
      {
        actorId: "sam",
        text: "Congrats to @{founderHandle} on the funding milestone! Stay true to the product roots.",
      },
    ],
    dms: [
      {
        actorId: "marcus",
        text: "Congratulations on closing the round, {founder}! Huge validation of your vision. Please keep us on your shortlist as you look ahead to the next stage of expansion.",
      },
    ],
  },
  {
    id: "arr_10m",
    name: "$10M ARR Scale",
    posts: [
      {
        actorId: "techdispatch",
        text: "BREAKING: {company} scales past $10M ARR milestone. Enterprise net revenue retention reported above industry benchmarks.",
      },
      {
        actorId: "viktor",
        text: "Credit where due to @{founderHandle}. Though as both of our platforms mature into the enterprise tier, the real battle begins now.",
      },
      {
        actorId: "enterprise_buyer",
        text: "@{companyHandle} has become foundational to our department's daily throughput. Hard to imagine operating without it now.",
      },
    ],
    dms: [
      {
        actorId: "chad",
        text: "YO {founder}!! $10M ARR?? I literally tell everyone at parties that I've known you since the beginning man! We gotta link up!",
      },
    ],
  },
  {
    id: "val_100m",
    name: "$100M Valuation Landmark",
    posts: [
      {
        actorId: "techdispatch",
        text: "VALUATION CHECK: Market analysts now place {company}'s enterprise valuation above $100M, citing strong workflow moats and compute leverage.",
      },
      {
        actorId: "elena",
        text: "In an ecosystem of speculative hype, @{companyHandle} is one of the few labs whose fundamentals and retention substantiate a nine-figure valuation.",
      },
      {
        actorId: "tech_memes",
        text: "Remember when people called @{companyHandle} a toy? Those same people are currently updating their resumes to apply there.",
      },
    ],
    dms: [
      {
        actorId: "sarah",
        text: "{founder}, $100M valuation?! That is absolutely unreal. Remember when you were sketching this out in that coffee shop? So, so proud of you.",
      },
    ],
  },
  {
    id: "unicorn",
    name: "$1B Unicorn Status",
    posts: [
      {
        actorId: "techdispatch",
        text: "🚨 UNICORN ALERT: @{companyHandle} officially achieves $1B+ enterprise valuation! Founder @{founderHandle} enters the elite Silicon Valley unicorn echelon.",
      },
      {
        actorId: "chad",
        text: "HOLY SHIT CONGRATS BRO!! always knew you'd do something crazy 😂🔥 everyone gotta respect the grind from day one!!",
      },
      {
        actorId: "marcus",
        text: "A monumental milestone for @{founderHandle} and @{companyHandle}. Rare conviction and operational execution defining the next generation of AI software.",
      },
      {
        actorId: "elena",
        text: "Credit given where earned: @{companyHandle} demonstrated that thoughtful systems engineering and deep model integration can build a true enterprise unicorn.",
      },
      {
        actorId: "sam",
        text: "From day 1 apartment hacking to a $1B unicorn. Proof that relentless focus wins. Major respect @{founderHandle}!",
      },
      {
        actorId: "viktor",
        text: "Congratulations to @{founderHandle} on joining the $1B club. The market is immense, and competing against the best brings out our best.",
      },
    ],
    dms: [
      {
        actorId: "chad",
        text: "BROOOOOO!! $1 BILLION?! Holy shit man! Always knew you were a certified genius 😂 we gotta celebrate next time you're in town, dinner on you obviously!!",
      },
      {
        actorId: "marcus",
        text: "{founder}, colossal achievement on the unicorn valuation. It has been a pleasure watching your trajectory. Whenever you begin considering late-stage growth rounds, our partnership would love to lead.",
      },
    ],
  },
  {
    id: "decacorn",
    name: "$10B Decacorn Powerhouse",
    posts: [
      {
        actorId: "techdispatch",
        text: "GLOBAL EXPANSION: {company} crosses $10B decacorn status, cementing its status as an epochal tech powerhouse alongside the platform giants.",
      },
      {
        actorId: "chad",
        text: "bro me and @{founderHandle} used to hang out back before all this. never doubted for a second 🙌 real recognize real",
      },
      {
        actorId: "tech_memes",
        text: "Decacorn status achieved. The apartment days are officially folklore.",
      },
    ],
    dms: [
      {
        actorId: "chad",
        text: "{founder}!! Bro you're a decacorn founder now! I have this crazy new consumer AI thesis, we gotta grab 15 minutes to jam on it!!",
      },
    ],
  },
  {
    id: "billionaire",
    name: "Founder Billionaire Net Worth",
    posts: [
      {
        actorId: "techdispatch",
        text: "WEALTH TRACKER: With {company}'s market valuation and founder equity ownership, @{founderHandle} officially enters the Bloomberg Billionaires index.",
      },
      {
        actorId: "tech_memes",
        text: "From 'Founder in bio is crazy' to three comma club. Put @{founderHandle}'s timeline in the history books.",
      },
      {
        actorId: "marcus",
        text: "A generational outcome for @{founderHandle}. Exceptional discipline from day zero to founder-billionaire status.",
      },
    ],
    dms: [
      {
        actorId: "chad",
        text: "MY MAN!! A literal billionaire!! Bro remember when I gave you that crucial early feedback on your deck back in the day? 😂 We really did it! Hit me up when you're free!",
      },
    ],
  },
  {
    id: "provider_outage",
    name: "Provider Infrastructure Outage",
    posts: [
      {
        actorId: "techdispatch",
        text: "DEVELOPING: Major model provider experiences global service interruption. Downstream AI applications reporting degraded latency and outages.",
      },
      {
        actorId: "sam",
        text: "Hoping @{companyHandle} has multi-provider fallback routing ready. Days like this expose fragile architectures.",
      },
      {
        actorId: "viktor",
        text: "Provider outages separate toy prototypes from battle-tested infrastructure.",
      },
    ],
    dms: [],
  },
  {
    id: "backlash_spike",
    name: "Public Backlash Controversy",
    posts: [
      {
        actorId: "elena",
        text: "Significant safety and trust concerns raised regarding @{companyHandle}'s latest deployments. Moving fast is no excuse for cutting alignment corners.",
      },
      {
        actorId: "chad",
        text: "drama on the timeline today haha @{companyHandle} taking some serious heat 👀",
      },
      {
        actorId: "tech_memes",
        text: "The three stages of an AI startup: 1. You are a wrapper 2. You are a genius 3. You are testifying before Congress.",
      },
    ],
    dms: [],
  },
];

export const AMBIENT_POST_TEMPLATES = [
  { actorId: "tech_memes", text: "People really be spending $20M on compute clusters to summarize 3-line emails." },
  { actorId: "elena", text: "Unpopular opinion: raw parameter count is commoditizing. Proprietary workflow context and evals are the real durable moat." },
  { actorId: "sam", text: "Nothing beats shipping a clean diff before 9 AM while everyone else is in standup." },
  { actorId: "techdispatch", text: "Venture debt availability tightening across mid-stage tech as investors scrutinize gross margins on inference." },
  { actorId: "enterprise_buyer", text: "If your B2B tool doesn't have SSO and audit logs, procurement won't even look at your demo." },
  { actorId: "chad", text: "cold plunging at 5am, reviewing term sheets by 6am. sleep is a social construct." },
  { actorId: "sam", text: "Seeing a lot of teams migrate away from closed APIs to open weights for latency control. The shift is real." },
  { actorId: "tech_memes", text: "Current market vibe: either you're raising $100M at pre-revenue or you're begging for a $500 GPU discount." },
  { actorId: "enterprise_buyer", text: "Shoutout to the teams prioritizing 99.9% uptime over flashy UI redesigns. Stability is the best feature." },
  { actorId: "techdispatch", text: "Frontier labs reportedly testing multi-token prediction and test-time compute scaling for upcoming releases." },
  { actorId: "chad", text: "everyone talking about AGI, I'm just trying to figure out how to write off my Equinox membership." },
  { actorId: "elena", text: "Evaluation benchmarks are saturated. Real-world business task completion rate is the only benchmark that matters." },
  { actorId: "sam", text: "Loving the latest updates from @{companyHandle}. You can tell an engineer built the hotkeys." },
  { actorId: "tech_memes", text: "Founder: 'We are revolutionizing knowledge work.' The app: a text box with a submit button." },
];
