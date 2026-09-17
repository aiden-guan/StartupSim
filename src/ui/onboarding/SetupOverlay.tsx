import { BRAND_COLORS, identity } from "../../branding/identity";
import { cofounders } from "../../data/cofounders";
import { traitById } from "../../data/traits";
import {
  ACCESSORIES,
  GLASSES_IDS,
  HAIR_COLORS,
  HAIR_STYLES,
  PANTS_IDS,
  SHOES_IDS,
  SKIN_TONES,
  TOP_IDS,
} from "../../simulation/look";
import type { BrandMark, CharacterLook } from "../../simulation/types";
import { useGame } from "../../state/store";
import { GameButton, StatBar } from "../shared/controls";

function Cycle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const i = Math.max(0, options.indexOf(value));
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#cfc5b6] py-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onChange(options[(i + options.length - 1) % options.length]!)}>
          ←
        </button>
        <span className="w-28 text-center text-sm">{value}</span>
        <button type="button" onClick={() => onChange(options[(i + 1) % options.length]!)}>
          →
        </button>
      </div>
    </div>
  );
}

export function SetupOverlay() {
  const setup = useGame((s) => s.setup);
  const patch = useGame((s) => s.patchSetup);
  const dispatch = useGame((s) => s.dispatch);
  const setScreen = useGame((s) => s.setScreen);
  const look = setup.founderLook;
  const setLook = (next: Partial<CharacterLook>) => patch({ founderLook: { ...look, ...next } });
  const cofounder = cofounders.find((c) => c.id === setup.cofounderId) ?? cofounders[0]!;
  const cofIndex = cofounders.findIndex((c) => c.id === cofounder.id);
  const trait = traitById[cofounder.trait];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex">
      <div className="pointer-events-auto m-6 ml-auto w-[min(420px,38vw)] overflow-auto term-sheet p-6">
        {setup.step === "founder" ? (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-copper">01 · Founder</p>
            <h2 className="mt-1 font-display text-3xl">You, approximately.</h2>
            <label className="mt-4 block text-sm">
              Name
              <input
                className="mt-1 w-full border border-line bg-white px-3 py-2"
                value={setup.founderName}
                onChange={(e) => patch({ founderName: e.target.value })}
              />
            </label>
            <div className="mt-4">
              <Cycle label="Skin" value={look.skin} options={SKIN_TONES} onChange={(skin) => setLook({ skin })} />
              <Cycle label="Hair" value={look.hairStyle} options={HAIR_STYLES} onChange={(hairStyle) => setLook({ hairStyle })} />
              <Cycle label="Hair color" value={look.hair} options={HAIR_COLORS} onChange={(hair) => setLook({ hair })} />
              <Cycle label="Top" value={look.topId} options={TOP_IDS} onChange={(topId) => setLook({ topId })} />
              <Cycle label="Pants" value={look.pantsId} options={PANTS_IDS} onChange={(pantsId) => setLook({ pantsId })} />
              <Cycle label="Shoes" value={look.shoesId} options={SHOES_IDS} onChange={(shoesId) => setLook({ shoesId })} />
              <Cycle label="Glasses" value={look.glassesId} options={GLASSES_IDS} onChange={(glassesId) => setLook({ glassesId, glasses: glassesId !== "none" })} />
              <Cycle label="Extra" value={look.accessory} options={ACCESSORIES} onChange={(accessory) => setLook({ accessory })} />
            </div>
            <GameButton tone="primary" className="mt-6 w-full" onClick={() => patch({ step: "cofounder" })}>
              Continue
            </GameButton>
          </>
        ) : null}
        {setup.step === "cofounder" ? (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-copper">02 · Cofounder</p>
            <h2 className="mt-1 font-display text-3xl">{cofounder.name}</h2>
            <div className="font-mono text-[11px] uppercase tracking-widest text-copper">{cofounder.title}</div>
            <p className="mt-3 font-display text-lg leading-snug">“{cofounder.quote}”</p>
            <p className="mt-2 text-sm text-muted">{cofounder.pitch}</p>
            <div className="mt-4 space-y-1">
              <StatBar label="Research" value={cofounder.skills.research} />
              <StatBar label="Engineering" value={cofounder.skills.engineering} />
              <StatBar label="Product" value={cofounder.skills.product} />
              <StatBar label="Growth" value={cofounder.skills.growth} />
              <StatBar label="Speed" value={cofounder.skills.productivity} />
            </div>
            <div className="mt-4 text-sm">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Trait</div>
              <div>{trait?.name ?? cofounder.trait}</div>
              <p className="text-muted">{trait?.description}</p>
              <div className="mt-2 font-mono text-xs">Wants {Math.round(cofounder.equity * 100)}% equity</div>
            </div>
            <div className="mt-6 flex gap-2">
              <GameButton
                className="flex-1 border-line text-ink"
                onClick={() => patch({ cofounderId: cofounders[(cofIndex + cofounders.length - 1) % cofounders.length]!.id })}
              >
                Previous
              </GameButton>
              <GameButton tone="primary" className="flex-1" onClick={() => patch({ step: "company" })}>
                Choose {cofounder.name.split(" ")[0]}
              </GameButton>
              <GameButton
                className="flex-1 border-line text-ink"
                onClick={() => patch({ cofounderId: cofounders[(cofIndex + 1) % cofounders.length]!.id })}
              >
                Next
              </GameButton>
            </div>
          </>
        ) : null}
        {setup.step === "company" ? (
          <>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-copper">03 · The vehicle</p>
            <h2 className="mt-1 font-display text-3xl">Name the company.</h2>
            <label className="mt-4 block text-sm">
              Company
              <input
                className="mt-1 w-full border border-line bg-white px-3 py-2"
                value={setup.companyName}
                onChange={(e) => patch({ companyName: e.target.value })}
              />
            </label>
            <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted">Mark</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {BRAND_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-8 w-8 border ${setup.brand.color === color ? "border-ink" : "border-transparent"}`}
                  style={{ background: color }}
                  onClick={() => patch({ brand: { ...setup.brand, color } })}
                />
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              {(["wordmark", "circle", "bars", "spark"] as BrandMark[]).map((mark) => (
                <button
                  key={mark}
                  type="button"
                  className={`border px-2 py-1 text-xs ${setup.brand.mark === mark ? "border-copper" : "border-line"}`}
                  onClick={() => patch({ brand: { ...setup.brand, mark } })}
                >
                  {mark}
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={setup.skipTutorial} onChange={(e) => patch({ skipTutorial: e.target.checked })} />
              Skip tutorial
            </label>
            <GameButton
              tone="primary"
              className="mt-6 w-full"
              onClick={() =>
                dispatch({
                  type: "newGame",
                  input: {
                    founderName: setup.founderName,
                    companyName: setup.companyName || identity.companyFallback,
                    cofounderId: setup.cofounderId,
                    founderLook: setup.founderLook,
                    companyBrand: setup.brand,
                    skipTutorial: setup.skipTutorial,
                  },
                })
              }
            >
              Incorporate
            </GameButton>
            <button type="button" className="mt-3 text-xs text-muted" onClick={() => patch({ step: "cofounder" })}>
              Back
            </button>
          </>
        ) : null}
        <button type="button" className="mt-8 text-xs text-muted" onClick={() => setScreen("title")}>
          Return to title
        </button>
      </div>
    </div>
  );
}
