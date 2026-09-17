# Founder Mode art bible

Visual identity for a stylized management game about building an AI company from a cramped apartment into something colder and more automated.

## Signature

Designer-toy figurines living in a physical dollhouse office. UI sits on top like printed term sheets and player-aid cards, not like a SaaS dashboard.

## Characters

- About 3.5 heads tall. Oversized head, compact torso, short limbs, chunky shoes.
- Readable silhouette from an isometric-ish camera.
- Simplified faces: eyes, brows, a nose wedge, a mouth. Expressions swap those parts. No realistic skin pores, no anime, no capsules, no Funko copies, no Roblox.
- Hair is modeled geometry, never a box glued to a sphere.
- Materials are mostly matte. Roughness 0.45–0.8. Metal only on glasses, watches, laptop hinges, server faces.
- Hero characters (founder, cofounders, mentor, notable CEOs) get stronger silhouettes and unique accessories.
- Employees use the same kit. Looks are deterministic from employee id/seed.
- Burnout is tired eyes, slumped idle, slower walk — not only a grey multiplier.
- Do not reproduce real-person faces or trademarked outfits.

## Environment

- Early: warm plaster, oak, paper, copper lamps, personal clutter composed on purpose.
- Mid: cooler daylight, glass, better desks, company marks.
- Late: graphite, steel, emissive racks, fewer humans, more empty chairs.
- Props share a material library. No one-off default `meshStandardMaterial` rainbow.
- Clutter is storytelling, not noise. Apartment density is high; campus density is strategic.
- Interactive objects: hover outline and a tooltip. No permanent world labels.

## Lighting

- Apartment: warm practicals, window fill, soft shadows.
- Offices: daylight plus interior warmth.
- Labs/compute: cooler key, emissive screens, restrained bloom if any.
- Never neon cyberpunk.

## UI

- Display serif for titles and narrative beats.
- UI sans (Sora) for controls.
- Mono for money, dates, skills, and other metrics.
- Persistent HUD: company, cash, runway, date, speed, urgent marks. Everything else lives in grouped navigation.
- Motion: 140ms feedback, 220ms panels, ~900ms cinematics.
- Honor reduced motion: snap cameras, skip bob and pulse.

## Color

- Paper `#efe8dc`, ink `#1b2230`, copper `#c4622d`, ledger `#1f6b4a`, alert `#9b2f2f`, gold `#c9a227`.
- Company brand color tints signage and a few screens. It does not retheme the whole HUD.

## What not to do

- Capsule people, Minecraft voxels, generic marketplace NPC packs.
- Twelve equal-weight nav buttons.
- Dumping a tutorial paragraph.
- Letting 3D pathfinding drive simulation.
- Scraping unlicensed assets.
- Exact founder likenesses.
