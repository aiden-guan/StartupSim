# StartupSim 3D Style Guide & Art Bible

Low-poly, readable, consistent, and game-ready visual identity for **StartupSim** — a stylized management simulation about building an AI company from an apartment into an automated enterprise.

Inspired by *The Founder*, rebuilt around the modern AI boom.
Source of truth: `StartupSim 3D Style Guide: Simple People. Big Ideas.`

---

## 1. Core Signature & Philosophy

* **Simple people. Big ideas.**
* **Simplicity is intentional:** Clean low-poly geometric forms, readable silhouettes from an isometric camera, and cohesive palettes.
* **No designer toys, no glossy figurines, no vinyl collectibles, no photorealism.**
* Visual behavior correlates directly with company simulation: the 3D office physically reflects assigned tasks, burnout, automation, and company growth.
* The UI feels like an interactive tactical simulation and authentic company paperwork, never a generic SaaS admin dashboard.
* **Palette & Materials:**
  * Skin tones: variety (`#f2c8a2`, `#f3d1b0`, `#e0b184`, `#c68642`, `#8d5524`, `#5c3317`, `#f0d5b8`).
  * Charcoal: `#282c30` / `#2b2e32`.
  * Navy: `#2b3e55` / `#2d4972`.
  * Sage Green: `#5c6e5a`.
  * Startup Orange: `#e06b3a` / `#d94e28`.
  * Warm Beige: `#ded3c3`.
  * Wood Tone: `#c89e6e`.
  * Light Gray: `#dedede`.
  * Dark Gray: `#33373b`.
  * Screen Blue: `#5599ff`.
  * Plant Green: `#5c8646` / `#557f3f`.
  * Server Blue: `#1e78ff`.
  * Material notes: Matte, low-detail materials, flat or lightly shaded, no glossy/plastic look, optimized for game performance and readability at small scale.

---

## 2. Character Style & Anatomy

Proportions and modeling language strictly match the StartupSim reference sheet:

* **Height & Proportions:**
  * Clean humanoid silhouette.
  * Moderately oversized rectangular-cube head with rounded bevels (`size={[0.44, 0.45, 0.39]}`).
  * Rectangular, simple torso with beveled edges and gentle taper.
  * Straight simple limbs (arms and legs), clean joint pivots.
  * Flat-soled low-poly shoes with distinct white sneaker soles or clean dress leather.
  * No giant Funko balloon heads; no realistic fingers; no micro-details.
* **Facial Features:**
  * Minimalist, flat-planed face without any protruding 3D box noses.
  * Two vertical capsule/dot eyes in dark charcoal (`#23272e`), rounded and clean.
  * Subtle horizontal eyebrow lines above the eyes.
  * Small horizontal line mouth with subtle upward curve when happy.
  * Neat, trimmed facial hair for characters with beards/stubble.
* **Materials & Shading:**
  * Solid matte colors (`roughness: 0.8–1.0`, zero metallic sheen on skin or clothing).
  * Soft ambient and directional lighting without harsh specular highlights.

---

## 3. 8 Founder-Inspired Hero Characters

1. **Steve Jobs (Product vision):** Balding crown / receding hairline with short grey hair on sides/back, round wire glasses, black turtleneck, blue jeans, grey/white sneakers with white soles, stubble beard/goatee.
2. **Mark Zuckerberg (Builds relentlessly):** Curly brown textured hair, grey crewneck t-shirt with short sleeves showing forearms, blue denim jeans, white sneakers. Clean shaven.
3. **Bill Gates (Platform thinker):** Side-parted messy brown/grey hair, rectangular glasses, blue sweater with white shirt collar showing, khaki trousers, brown dress shoes. Clean shaven.
4. **Sam Altman (Capital + AI):** Wavy/curly brown hair, blue long-sleeve crewneck, dark charcoal trousers, white sneakers. Clean shaven.
5. **Jensen Huang (More compute):** Swept-back silver/gray hair with volume, black rectangular glasses, black leather jacket over black tee, black jeans, black shoes. Clean shaven.
6. **Elon Musk (Moonshot operator):** Quiff/pompadour brown hair styled upwards in front, dark charcoal blazer over dark tee, dark trousers, black shoes. Clean shaven.
7. **Reed Hastings (Company culture):** Dark grey beanie/knit cap, short grey/white beard and mustache, black long-sleeve, sage green trousers, white sneakers.
8. **Jeff Bezos (Operates at scale):** Completely smooth bald head, clean shaven, navy blazer over light blue collared shirt, khaki trousers, brown dress shoes.

---

## 4. Regular Employees & Cohesion

* Regular employees share the **exact same geometry kit, scale, and rig** as the hero founders.
* There is **no visual hierarchy or style divergence** between hero characters and everyday teammates.
* Personality and role are expressed through combinations of the 8 hairstyles, tops, bottoms, shoes, glasses, and accessories.

---

## 5. Office Prop Assets

Every office prop is modeled from clean primitives with soft bevels to match the style guide:

* **Whiteboard:** Frame with rolling casters/wheels on feet, marker tray with colored dry-erase markers, text/decals for "Build\nIterate\nShip\nRepeat" with an upward blue arrow. In the apartment, the whiteboard's front faces into the room and towards the camera.
* **Potted Plant:** Faceted low-poly broad leaves (`#5c8646` / `#557f3f`) branching upward from a clean light ceramic cylindrical pot (`#dedede`) with dark soil.
* **Laptop:** Metallic wedge base with recessed keyboard well and trackpad, open angled screen with glowing screen blue (`#5599ff`).
* **Monitor:** Thin-bezel widescreen monitor on sleek angled stand with flat rectangular base, screen glowing screen blue.
* **Keyboard:** Low-profile dark grey rectangular wedge with clean key grid.
* **Office Chair:** Ergonomic curved mesh backrest with lumbar curve, horizontal seat cushion, armrests, 5-star wheeled caster base with little wheels.
* **Desk:** Light oak wood top (`#c89e6e`) with clean beveled edges, dark metal under-frame, and 4 square dark metal legs.
* **Coffee Machine:** Modern espresso tower (`#33373b`) with rear reservoir, drip nozzle, and a white coffee mug on drip tray.
* **Server Rack:** Matte black cabinet with horizontal server blade trays and glowing server blue status LEDs (`#1e78ff`).
* **GPU Shipping Box:** Kraft cardboard box (`#b89065`) with bold black "GPU" stamped on the front and clear packing tape.
* **Pizza Box:** Kraft box with red/orange "PIZZA FUELS PROGRESS" print and triangular pizza slice decal.
* **Stack of Books:** 6 colorful books with distinct colored spines: Product (dark green), Technology (navy), People (blue), Scaling (gold), Better Decisions (light teal), A Kinder Internet (light grey/cream).
* **Couch:** Modern blue 2-seat sofa (`#2b3e55`) with cushions, armrests, and 4 short light wood peg legs.
* **Robot Assistant:** White rounded head with glossy black visor, glowing cyan eyes (`#50a8ff`), rounded body, and cute arms.
* **Accessories & Deskside Props:** Moleskine notebook with strap, over-ear headphones, conference badge with blue lanyard, smartphone, coffee mug, fridge.

---

## 6. Spatial Integrity & Office Behavior

* Characters face the object they are using (face monitors at desks, face whiteboard at board, face coffee machine at kitchen).
* No character clips through walls or hovers above the floor.
* Home desks provide spatial permanence.
* Occupancy is strictly tracked: moving away from an activity point immediately releases the claim.
