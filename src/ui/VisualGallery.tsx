import { Canvas } from "@react-three/fiber";
import { ACCESSORIES, GLASSES_IDS, HAIR_STYLES, TOP_IDS, normalizeLook } from "../simulation/look";
import { cofounders } from "../data/cofounders";
import { MENTOR_LOOK } from "../game3d/characters/HeroLooks";
import { Character, type CharacterActivity } from "../game3d/characters/Character";
import { DEFAULT_FOUNDER_LOOK } from "../simulation/look";
import { useGame } from "../state/store";
import type { CharacterLook, ExpressionId } from "../simulation/types";
import { GameButton } from "./shared/controls";

function Cell({
  look,
  label,
  activity = "idle",
  expression,
  robot = false,
}: {
  look: CharacterLook;
  label: string;
  activity?: CharacterActivity;
  expression?: ExpressionId;
  robot?: boolean;
}) {
  return (
    <div className="border border-white/10">
      <div className="h-40 bg-[#cbb59a]">
        <Canvas camera={{ position: [0.2, 1.4, 2.2], fov: 30 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[2, 3, 2]} />
          <Character look={look} activity={activity} expression={expression} robot={robot} preview />
        </Canvas>
      </div>
      <div className="px-2 py-1 font-mono text-[10px] text-paper">{label}</div>
    </div>
  );
}

export function VisualGallery() {
  const setGalleryOpen = useGame((s) => s.setGalleryOpen);
  return (
    <div className="absolute inset-0 z-50 overflow-auto bg-[#1b2433] p-6 text-paper">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-display text-3xl">Visual gallery</h1>
        <GameButton onClick={() => setGalleryOpen(false)}>Close</GameButton>
      </div>
      <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-gold">Hair</h2>
      <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
        {HAIR_STYLES.map((hairStyle) => (
          <Cell key={hairStyle} label={hairStyle} look={normalizeLook({ ...DEFAULT_FOUNDER_LOOK, hairStyle })} />
        ))}
      </div>
      <h2 className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-gold">Tops</h2>
      <div className="grid grid-cols-4 gap-2 md:grid-cols-6">
        {TOP_IDS.map((topId) => (
          <Cell key={topId} label={topId} look={normalizeLook({ ...DEFAULT_FOUNDER_LOOK, topId })} />
        ))}
      </div>
      <h2 className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-gold">Accessories</h2>
      <div className="grid grid-cols-4 gap-2">
        {ACCESSORIES.map((accessory) => (
          <Cell key={accessory} label={accessory} look={normalizeLook({ ...DEFAULT_FOUNDER_LOOK, accessory })} />
        ))}
        {GLASSES_IDS.map((glassesId) => (
          <Cell key={glassesId} label={glassesId} look={normalizeLook({ ...DEFAULT_FOUNDER_LOOK, glassesId, glasses: glassesId !== "none" })} />
        ))}
      </div>
      <h2 className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-gold">Heroes</h2>
      <div className="grid grid-cols-4 gap-2">
        <Cell label="Founder" look={DEFAULT_FOUNDER_LOOK} />
        {cofounders.map((c) => (
          <Cell key={c.id} label={c.name} look={c.look} />
        ))}
        <Cell label="Marcus Vale" look={MENTOR_LOOK} activity="talking" />
        <Cell label="Robot" look={DEFAULT_FOUNDER_LOOK} robot />
      </div>
      <h2 className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-gold">Expressions</h2>
      <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
        {(["neutral", "happy", "stressed", "angry", "tired", "confident", "surprised"] as const).map((expression) => (
          <Cell key={expression} label={expression} look={DEFAULT_FOUNDER_LOOK} expression={expression} />
        ))}
      </div>
      <h2 className="mb-2 mt-6 font-mono text-xs uppercase tracking-widest text-gold">Activities</h2>
      <div className="grid grid-cols-4 gap-2">
        {(["idle", "walking", "working", "talking", "celebrate", "tired"] as CharacterActivity[]).map((activity) => (
          <Cell key={activity} label={activity} look={DEFAULT_FOUNDER_LOOK} activity={activity} />
        ))}
      </div>
    </div>
  );
}
