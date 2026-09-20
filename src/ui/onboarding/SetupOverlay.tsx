import { useState } from "react";
import { identity } from "../../branding/identity";
import { cofounders, resolveCofounder } from "../../data/cofounders";
import { traitById } from "../../data/traits";
import { referenceLooks } from "../../game3d/characters/ReferenceLooks";
import {
  ACCESSORIES,
  GLASSES_IDS,
  HAIR_COLORS,
  HAIR_STYLES,
  PANTS_COLORS,
  PANTS_IDS,
  SHOES_IDS,
  SKIN_TONES,
  TOP_IDS,
} from "../../simulation/look";
import type { CharacterLook } from "../../simulation/types";
import { useGame } from "../../state/store";
import { GameButton, StatBar } from "../shared/controls";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import { BrandStudio } from "../visuals/BrandStudio";

const COMPANY_PRESETS = [
  "Northstar Labs",
  "Nexus AI",
  "Synthetix",
  "Cognitive",
  "Hyperion Dynamics",
  "Aetheric",
  "OpenMind",
  "Vanguard AI",
  "Vector Works",
  "Cortex Systems",
];

function formatOption(val: string): string {
  if (!val || val === "none") return "None";
  return val.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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
        <button
          type="button"
          className="h-6 w-6 rounded border border-line bg-white/60 text-xs hover:bg-white"
          onClick={() => onChange(options[(i + options.length - 1) % options.length]!)}
        >
          ←
        </button>
        <span className="w-28 text-center text-xs font-medium">{formatOption(value)}</span>
        <button
          type="button"
          className="h-6 w-6 rounded border border-line bg-white/60 text-xs hover:bg-white"
          onClick={() => onChange(options[(i + 1) % options.length]!)}
        >
          →
        </button>
      </div>
    </div>
  );
}

function ColorSwatches({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (val: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#cfc5b6] py-2">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        {options.map((col) => (
          <button
            key={col}
            type="button"
            className={`h-5 w-5 rounded-full border transition-transform ${
              value === col ? "scale-125 border-ink shadow-sm ring-1 ring-copper" : "border-black/20 hover:scale-110"
            }`}
            style={{ background: col }}
            onClick={() => onChange(col)}
            aria-label={`${label} color`}
          />
        ))}
      </div>
    </div>
  );
}

export function SetupOverlay() {
  const setup = useGame((s) => s.setup);
  const patch = useGame((s) => s.patchSetup);
  const dispatch = useGame((s) => s.dispatch);
  const setScreen = useGame((s) => s.setScreen);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const look = setup.founderLook;
  const setLook = (next: Partial<CharacterLook>) => patch({ founderLook: { ...look, ...next } });
  const cofounder = resolveCofounder(setup.cofounderId);
  const cofIndex = cofounders.findIndex((c) => c.id === cofounder.id);
  const trait = traitById[cofounder.trait];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex">
      <div key={setup.step} style={{ marginLeft: "auto" }} className="setup-sheet pointer-events-auto m-4 flex w-[min(440px,calc(100vw-2rem))] flex-col justify-between overflow-auto term-sheet p-4 shadow-2xl sm:m-6 sm:w-[min(440px,calc(100vw-3rem))] sm:p-6">
        {setup.step === "founder" ? (
          <div className="setup-step">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-copper">01 · Founder</p>
            <h2 className="mt-1 font-display text-3xl font-semibold">You, approximately.</h2>
            <label className="mt-4 block text-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Founder Name</span>
              <input
                className="mt-1 w-full border border-line bg-white px-3 py-2 text-sm font-medium"
                value={setup.founderName}
                placeholder="Founder"
                onChange={(e) => patch({ founderName: e.target.value })}
              />
            </label>

            <div className="mt-4">
              <span className="font-mono text-[10px] uppercase tracking-widest text-copper">Quick look</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {referenceLooks.map((ref) => (
                  <button
                    key={ref.name}
                    type="button"
                    className="truncate rounded border border-line bg-white/70 px-2.5 py-1.5 text-left text-xs font-medium hover:border-copper hover:bg-white transition-colors"
                    onClick={() => patch({ founderLook: { ...ref.look } })}
                    title={`${ref.name} — ${ref.role}`}
                  >
                    <div className="font-semibold leading-snug text-ink">{ref.name}</div>
                    <div className="text-[10px] text-muted truncate">{ref.role}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 founder-appearance">
              <button
                type="button"
                className="appearance-toggle"
                aria-expanded={showAppearance}
                onClick={() => setShowAppearance((value) => !value)}
              >
                <span>Appearance</span>
                <small>{showAppearance ? "Hide options" : "Customize later"}</small>
                <span aria-hidden="true">{showAppearance ? "−" : "+"}</span>
              </button>
              {showAppearance ? (
                <div className="appearance-options">
                  <ColorSwatches label="Skin" value={look.skin} options={SKIN_TONES} onChange={(skin) => setLook({ skin })} />
                  <Cycle label="Hair" value={look.hairStyle} options={HAIR_STYLES} onChange={(hairStyle) => setLook({ hairStyle })} />
                  <ColorSwatches
                    label="Hair color"
                    value={look.hair}
                    options={HAIR_COLORS}
                    onChange={(hair) => setLook({ hair, ...(look.beard ? { beardColor: hair } : {}) })}
                  />
                  <Cycle
                    label="Facial hair"
                    value={look.beard ? "beard" : "none"}
                    options={["none", "beard"] as const}
                    onChange={(b) => setLook({ beard: b === "beard", ...(b === "beard" ? { beardColor: look.beardColor ?? look.hair } : {}) })}
                  />
                  <Cycle label="Top" value={look.topId} options={TOP_IDS} onChange={(topId) => setLook({ topId })} />
                  <Cycle label="Pants" value={look.pantsId} options={PANTS_IDS} onChange={(pantsId) => setLook({ pantsId })} />
                  <ColorSwatches label="Pants color" value={look.pants} options={PANTS_COLORS} onChange={(pants) => setLook({ pants })} />
                  <Cycle label="Shoes" value={look.shoesId} options={SHOES_IDS} onChange={(shoesId) => setLook({ shoesId })} />
                  <Cycle
                    label="Glasses"
                    value={look.glassesId}
                    options={GLASSES_IDS}
                    onChange={(glassesId) => setLook({ glassesId, glasses: glassesId !== "none" })}
                  />
                  <Cycle label="Extra" value={look.accessory} options={ACCESSORIES} onChange={(accessory) => setLook({ accessory })} />
                </div>
              ) : null}
            </div>

            <GameButton tone="primary" className="mt-6 w-full py-2.5 text-sm font-medium" onClick={() => patch({ step: "cofounder" })}>
              Continue to cofounder →
            </GameButton>
          </div>
        ) : null}

        {setup.step === "cofounder" ? (
          <div className="setup-step">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-copper">02 · Cofounder</p>
            <h2 className="mt-1 font-display text-2xl font-semibold">Choose your cofounder.</h2>
            <p className="mt-1 text-xs text-muted">Select a card to preview their character and tradeoffs.</p>
            <div className="mt-3 grid grid-cols-2 gap-1.5" role="group" aria-label="Cofounder options">
              {cofounders.map((candidate) => {
                const selected = candidate.id === cofounder.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => patch({ cofounderId: candidate.id })}
                    className={`flex min-w-0 items-center gap-2 rounded border p-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copper ${selected ? "border-copper bg-copper/10 shadow-sm" : "border-line bg-white/60 hover:border-copper hover:bg-white"}`}
                  >
                    <CharacterPortrait look={candidate.look} className="h-11 w-10" />
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold leading-tight text-ink">{candidate.name}</span>
                      <span className="mt-0.5 block truncate text-[9px] leading-tight text-muted">{candidate.title}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display text-2xl font-semibold leading-tight">{cofounder.name}</h3>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-copper">{cofounder.title}</div>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted">{cofIndex + 1} / {cofounders.length}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{cofounder.pitch}</p>
            <div className="mt-3 space-y-1 rounded border border-line/60 bg-white/40 p-3">
              <StatBar label="Research" value={cofounder.skills.research} />
              <StatBar label="Engineering" value={cofounder.skills.engineering} />
              <StatBar label="Product" value={cofounder.skills.product} />
              <StatBar label="Growth" value={cofounder.skills.growth} />
              <StatBar label="Speed" value={cofounder.skills.productivity} />
            </div>
            <div className="mt-2 rounded border border-line/60 bg-white/40 p-3 text-sm">
              <div className="font-mono text-[10px] uppercase tracking-widest text-gold">Trait · {trait?.name ?? cofounder.trait}</div>
              <p className="mt-0.5 text-xs text-muted">{trait?.description}</p>
              <div className="mt-2 font-mono text-xs font-semibold text-ink">Asks {Math.round(cofounder.equity * 100)}% equity stake</div>
            </div>
            <div className="mt-4 flex gap-2">
              <GameButton
                className="flex-1 border-line text-ink"
                onClick={() => patch({ cofounderId: cofounders[(cofIndex + cofounders.length - 1) % cofounders.length]!.id })}
              >
                ← Prev
              </GameButton>
              <GameButton tone="primary" className="flex-1 py-2" onClick={() => patch({ step: "company" })}>
                Choose {cofounder.name.split(" ")[0]} →
              </GameButton>
              <GameButton
                className="flex-1 border-line text-ink"
                onClick={() => patch({ cofounderId: cofounders[(cofIndex + 1) % cofounders.length]!.id })}
              >
                Next →
              </GameButton>
            </div>
          </div>
        ) : null}

        {setup.step === "company" ? (
          <div className="setup-step">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-copper">03 · Company</p>
            <h2 className="mt-1 font-display text-3xl font-semibold">Name the company.</h2>
            <label className="mt-4 block text-sm">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted">Legal Entity Name</span>
              <div className="mt-1 flex gap-2">
                <input
                  className="flex-1 border border-line bg-white px-3 py-2 text-sm font-medium"
                  value={setup.companyName}
                  onChange={(e) => patch({ companyName: e.target.value })}
                />
                <button
                  type="button"
                  className="border border-line bg-white/70 px-3 py-2 text-xs font-mono hover:bg-white"
                  title="Randomize company name"
                  onClick={() => {
                    const pick = COMPANY_PRESETS[Math.floor(Math.random() * COMPANY_PRESETS.length)]!;
                    patch({ companyName: pick });
                  }}
                >
                  🎲 Roll
                </button>
              </div>
            </label>
            <div className="mt-4 company-branding">
              <button
                type="button"
                className="appearance-toggle"
                aria-expanded={showBranding}
                onClick={() => setShowBranding((value) => !value)}
              >
                <span>Branding</span>
                <small>{showBranding ? "Choose your mark" : "Optional"}</small>
                <span aria-hidden="true">{showBranding ? "−" : "+"}</span>
              </button>
              {showBranding ? (
                <div className="branding-options">
                  <BrandStudio
                    brand={setup.brand}
                    companyName={setup.companyName}
                    onChange={(brandPatch) => patch({ brand: { ...setup.brand, ...brandPatch } })}
                  />
                </div>
              ) : null}
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={!setup.skipTutorial} onChange={(e) => patch({ skipTutorial: !e.target.checked })} />
              <span className="text-xs text-muted">Play the guided first run</span>
            </label>
            <GameButton
              tone="primary"
              className="mt-6 w-full py-2.5 text-sm font-medium"
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
              Incorporate company →
            </GameButton>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4 text-xs">
          {setup.step !== "founder" ? (
            <button
              type="button"
              className="text-muted hover:text-ink"
              onClick={() => patch({ step: setup.step === "company" ? "cofounder" : "founder" })}
            >
              ← Back
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="text-muted hover:text-ink" onClick={() => setScreen("title")}>
            Return to title
          </button>
        </div>
      </div>
    </div>
  );
}
