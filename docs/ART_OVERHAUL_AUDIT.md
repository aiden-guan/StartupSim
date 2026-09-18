# Product and workplace art audit

## Findings

The original product renderer reduced 76 unique recipe pairs to 14 families with hash-derived colors and four variations. The first four chat products shared one paper sculpture. Geometry was frequently suspended above the floor. No primitive 3D catalog existed; primitive line icons were already distinct and are retained. GLB overrides were empty.

## Architecture

`products/catalog.ts` explicitly authors each stable sorted pair and primitive ID. `Parts.tsx`, `SpecialtyParts.tsx`, and `Geometry.tsx` provide reusable grounded components, cached bevel geometry and matte real-object colors. No runtime randomness, ingredient priority, or named-recipe fallback. Experimental pairs retain the generic discovery token. The duplicate legal/writing definition still resolves to Contract Mill, preserving recipe behavior.

`ProductArtifact` serves the studio and office showcase. A single selected primitive also previews its miniature. Unknown combinations use a static extruded question mark, navy plaque and wood base, replacing the tube, sphere and floating ring. All ProductPreview canvases use demand rendering.

## Inspection tooling

Development only: `?gallery=1` → Full catalog audit. Four categories, eight simultaneous previews, direct asset selector, previous/next arrows and grayscale comparison. Uses the actual ProductPreview and MiniaturePreview renderers.

Unsaved real-office fixtures: `?world=0&artifact=chat.code&cultureTier=0` and `?world=5&artifact=auto-research.self-improve&cultureTier=2`. `artifact` takes a sorted recipe ID; `cultureTier` is zero-based and filters unavailable office requirements. Autosave is disabled. The gallery query and render are now DEV-gated.

## Retain / refine / rebuild inventory

### Culture (all 23 tiers)

| Tier | Decision | Result |
| --- | --- | --- |
| Better Coffee | REFINE | Retained machine and counter; material/framing adjustment. |
| Espresso Bar | REFINE | Retained counter/machine; added grinder and service cup. |
| Third-Wave Lab | REFINE | Supported shelf, storage jars and grinder replace floating shelf/repeated machine. |
| Standing Desks | KEEP | Existing desk/chair geometry retained. |
| Fancy Chairs | KEEP | Existing desk/chair geometry retained. |
| Focus Pods | REFINE | Grounded enclosure with roof and corrected height. |
| Stocked Fridge | KEEP | Existing fridge retained and centered. |
| Free Meals | REFINE | Retained fridge/counter; food service trays. |
| Private Chef | REBUILD | Range, pots and supported extraction hood. |
| Nap Pods | REBUILD | Visible mattress/pillow and partial canopy. |
| Meditation Room | REBUILD | Floor cushions, mat, screen and plant. |
| On-site Doctor | REBUILD | Examination bed and diagnostic trolley. |
| Ping-Pong | REFINE | Four legs, court stripe and paddle. |
| Gaming Room | REFINE | Retained sofa; arcade controls and tighter composition. |
| Executive Dining | REFINE | Retained desk/chairs; chairs face table and place settings added. |
| Dog-Friendly | REBUILD | Recognizable dog, bed and bowl. |
| Therapy Benefit | KEEP | Existing sofa/plant retained; tighter placement. |
| Childcare | REBUILD | Child-sized activity table, seat and toy storage. |
| Employee Housing | REFINE | Door, step, windows and framing. |
| Shuttle | REFINE | Grounded four-wheel chassis and divided windows. |
| Private Transit | REFINE | Longer cream vehicle, dark roof and visible windscreen. |
| Gym Stipend | REFINE | Barbell lowered to mat. |
| On-site Gym | REBUILD | Bench and supported barbell rack. |

Apartment perk slots moved away from built-in kitchen and desks. PerkVisual validates every supported tier. Prices, effects and requirements are unchanged.

### Promotions

| Campaign | Decision | Result |
| --- | --- | --- |
| Product Launch | KEEP | Existing stage/laptop composition. |
| Viral Demo | REFINE | Upright phone and supported ring light. |
| Benchmark Announcement | KEEP | Existing chart board/base. |
| Founder Podcast | REBUILD | Recognizable microphone and supported headset. |
| Developer Conference | REFINE | Existing stage, badge and lectern; badge support added. |
| Influencer Campaign | REBUILD | Camera, upright phone and physical backdrop. |
| Massive Keynote | KEEP | Existing large stage/screen/lectern. |
| AGI Soon | KEEP | Existing intentionally grandiose announcement board. |

### Primitives

All 39 line icons are KEEP. The following miniatures are NEW (there was no former 3D primitive catalog):

- Chat (`chat`)
- Writing (`writing`)
- Search (`search`)
- Image (`image`)
- Code (`code`)
- Voice (`voice`)
- Video (`video`)
- Avatar (`avatar`)
- Memory (`memory`)
- Retrieval (`retrieval`)
- Reasoning (`reasoning`)
- Agent (`agent`)
- Browser (`browser`)
- Computer Use (`computer-use`)
- Workflow (`workflow`)
- Analytics (`analytics`)
- Simulation (`simulation`)
- Recommendation (`recommend`)
- Security (`security`)
- Robotics (`robotics`)
- Vision (`vision`)
- World Model (`world-model`)
- Scientific Research (`science`)
- Biology (`biology`)
- Finance (`finance`)
- Defense (`defense`)
- Education (`education`)
- Healthcare (`health`)
- Entertainment (`entertainment`)
- Social (`social`)
- Advertising (`ads`)
- Legal (`legal`)
- Commerce (`commerce`)
- Hardware (`hardware`)
- Data (`data`)
- API (`api`)
- Open Source (`opensource`)
- Autonomous Research (`auto-research`)
- Self-Improvement (`self-improve`)

### Recipes

| Product | Pair | Decision | Verification |
| --- | --- | --- | --- |
| Copywright | `chat.writing` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Answer Engine | `chat.search` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Coding Copilot | `chat.code` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Companion | `chat.memory` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Web Research Agent | `agent.browser` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Ops Autopilot | `agent.workflow` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Receptionist | `agent.voice` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Virtual Influencer | `avatar.video` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Studio Chat | `chat.image` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Doc Oracle | `chat.retrieval` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Software Factory | `agent.code` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Hypothesis Engine | `reasoning.science` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Drug Discovery Suite | `biology.science` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Floor Worker | `agent.robotics` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Perimeter Platform | `defense.robotics` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Reasoning API | `api.reasoning` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Public Copilot | `code.opensource` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Sponsored Answers | `ads.chat` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Tutor | `chat.education` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Chart Companion | `health.retrieval` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Contract Mill | `legal.writing` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Treasury Agent | `agent.finance` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Crowdcast | `avatar.social` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| RevOps Brain | `analytics.workflow` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Chief of Staff | `agent.memory` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Intent Graph | `analytics.search` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Ad Forge | `ads.image` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Voice Desk | `chat.voice` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Desktop Operator | `agent.computer-use` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| SOC Autopilot | `agent.security` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Infinite Show | `entertainment.video` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Taste Engine | `entertainment.recommend` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Corpus Broker | `api.data` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Inference Brick | `hardware.reasoning` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Generalist Body | `robotics.world-model` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Recursive Lab | `auto-research.self-improve` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Watchtower | `defense.vision` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Buyer Bot | `agent.commerce` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Classroom Agent | `agent.education` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Scan Reader | `health.vision` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Discovery Swarm | `agent.legal` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Risk Desk | `analytics.finance` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Hosted Commons | `api.opensource` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Insight Bot | `analytics.chat` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Repo Search | `code.search` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Catalog Dreamer | `commerce.image` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Language Partner | `education.voice` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Social Ledger | `memory.social` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Precedent Engine | `legal.retrieval` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Lab Scheduler | `agent.science` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Market Twin | `finance.simulation` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Wargame Cloud | `defense.simulation` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Attention Exchange | `ads.recommend` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Research Tab | `browser.search` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Compliance Flow | `legal.workflow` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Lecturer | `avatar.education` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Course Mill | `education.video` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Ward Assistant | `health.robotics` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Warehouse Hand | `commerce.robotics` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Anomaly Eye | `security.vision` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Phenotype Vault | `biology.data` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Speech API | `api.voice` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Public Palette | `image.opensource` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Self-Tuning Devtool | `code.self-improve` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Closed-Loop Wet Lab | `auto-research.biology` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| World Sandbox | `simulation.world-model` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Rack Oracle | `analytics.hardware` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Storybox | `chat.entertainment` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Slogan Press | `ads.writing` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Symptom Index | `health.search` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Media Buyer | `ads.agent` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Counsel | `legal.reasoning` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Staff Engineer | `code.reasoning` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Longitudinal Twin | `health.memory` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Deal Hunter | `browser.commerce` | REBUILD | Authored physical composition; reviewed in contact sheet. |
| Backoffice Hands | `computer-use.finance` | REBUILD | Authored physical composition; reviewed in contact sheet. |

## Verification and limits

Visually reviewed all 76 recipes, 39 primitives, 23 Culture tiers and 8 promotions in the running development contact sheets. Follow-up corrections replaced the rover, watchtower support, lecturer lectern, medical scanner and clinical robot. Product Studio tested with Copywright and unknown Search + Writing; unknown identity remains concealed. Apartment and megacampus fixtures inspected with actual ProductShowcase and PerkSet. Individual objects become small at megacampus overview, as expected from the existing office camera.

The contact sheet is the exhaustive asset check; real office placement was sampled at the endpoints, not every permutation of eight purchased perks across six offices. Existing Product Studio horizontal overflow at the narrow browser width remains outside this art-only change. No balance, simulation or save-schema files changed.
