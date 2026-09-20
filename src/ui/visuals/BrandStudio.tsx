import type { CSSProperties } from "react";
import { BRAND_COLORS, BRAND_PATTERNS, BRAND_SECONDARY_COLORS } from "../../branding/identity";
import type { BrandMark, BrandPattern, CompanyBrand } from "../../simulation/types";

const MARKS: readonly BrandMark[] = ["wordmark", "circle", "bars", "spark"];
const MARK_LABELS: Record<BrandMark, string> = {
  wordmark: "Wordmark",
  circle: "Orbit",
  bars: "Signal",
  spark: "Spark",
};
const PATTERN_LABELS: Record<BrandPattern, string> = {
  solid: "Solid",
  split: "Split",
  stripes: "Stripes",
  frame: "Frame",
};

function resolvedBrand(brand: CompanyBrand) {
  return {
    color: brand.color || BRAND_COLORS[0],
    secondaryColor: brand.secondaryColor || BRAND_SECONDARY_COLORS[0],
    mark: brand.mark || "wordmark",
    pattern: brand.pattern || "solid",
    tagline: brand.tagline || "",
  } satisfies { color: string; secondaryColor: string; mark: BrandMark; pattern: BrandPattern; tagline: string };
}

function brandStyle(color: string, secondaryColor: string): CSSProperties {
  return {
    "--brand-primary": color,
    "--brand-secondary": secondaryColor,
  } as CSSProperties;
}

export function BrandGlyph({ mark, className = "" }: { mark: BrandMark; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {mark === "circle" ? <circle cx="12" cy="12" r="5.3" stroke="currentColor" strokeWidth="2.1" /> : null}
      {mark === "spark" ? (
        <path d="M12 3.8 13.9 10l6.3 2-6.3 2-1.9 6.2-1.9-6.2-6.3-2 6.3-2L12 3.8Z" fill="currentColor" />
      ) : null}
      {mark === "bars" ? (
        <path d="M5.2 17.5V9.6h3.1v7.9H5.2Zm5.3 0V6.5h3.1v11h-3.1Zm5.3 0V4.1h3.1v13.4h-3.1Z" fill="currentColor" />
      ) : null}
      {mark === "wordmark" ? (
        <path d="M4.4 7.1h15.2v2.1H4.4V7.1Zm0 3.9h10.7v2.1H4.4V11Zm0 3.9h6.8V17H4.4v-2.1Z" fill="currentColor" />
      ) : null}
    </svg>
  );
}

export function BrandPreview({ brand, companyName }: { brand: CompanyBrand; companyName: string }) {
  const current = resolvedBrand(brand);
  const name = companyName.trim() || "Your company";
  const tagline = current.tagline || "Ideas with room to compound.";
  return (
    <div
      className={`brand-preview brand-pattern-${current.pattern}`}
      style={brandStyle(current.color, current.secondaryColor)}
      aria-label={`${name} brand preview`}
    >
      <div className="brand-preview-surface">
        <div className="brand-preview-ghost" aria-hidden="true" />
        <div className="brand-preview-mark">
          <BrandGlyph mark={current.mark} />
        </div>
        <span className="brand-preview-rule" aria-hidden="true" />
      </div>
      <div className="brand-preview-copy">
        <span className="brand-preview-kicker">Company identity</span>
        <strong>{name}</strong>
        <span>{tagline}</span>
      </div>
      <div className="brand-preview-palette" aria-hidden="true">
        <i />
        <i />
        <span>{PATTERN_LABELS[current.pattern]}</span>
      </div>
    </div>
  );
}

export function BrandStudio({
  brand,
  companyName,
  onChange,
  compact = false,
}: {
  brand: CompanyBrand;
  companyName: string;
  onChange: (patch: Partial<CompanyBrand>) => void;
  compact?: boolean;
}) {
  const current = resolvedBrand(brand);
  const previewKey = `${companyName}-${current.color}-${current.secondaryColor}-${current.mark}-${current.pattern}-${current.tagline}`;
  return (
    <section className={`brand-studio ${compact ? "brand-studio-compact" : ""}`} aria-labelledby="brand-studio-title">
      <div className="brand-studio-heading">
        <div>
          <span className="eyebrow">Identity system</span>
          <h3 id="brand-studio-title">Make it unmistakably yours.</h3>
        </div>
        <span className="brand-studio-status">Live preview</span>
      </div>
      <div key={previewKey} className="brand-preview-reveal">
        <BrandPreview brand={current} companyName={companyName} />
      </div>

      <div className="brand-control-group">
        <div className="brand-control-label"><span>Primary color</span><small>the flag in the world</small></div>
        <div className="brand-color-row">
          {BRAND_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`brand-color-swatch ${current.color === color ? "is-selected" : ""}`}
              style={{ backgroundColor: color }}
              aria-label={`Primary color ${color}`}
              aria-pressed={current.color === color}
              onClick={() => onChange({ color })}
            />
          ))}
        </div>
      </div>

      <div className="brand-control-group">
        <div className="brand-control-label"><span>Signal color</span><small>the detail people remember</small></div>
        <div className="brand-color-row">
          {BRAND_SECONDARY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`brand-color-swatch brand-color-swatch-light ${current.secondaryColor === color ? "is-selected" : ""}`}
              style={{ backgroundColor: color }}
              aria-label={`Signal color ${color}`}
              aria-pressed={current.secondaryColor === color}
              onClick={() => onChange({ secondaryColor: color })}
            />
          ))}
        </div>
      </div>

      <div className="brand-control-group">
        <div className="brand-control-label"><span>Signature mark</span><small>your shorthand at a glance</small></div>
        <div className="brand-mark-grid">
          {MARKS.map((mark) => (
            <button
              key={mark}
              type="button"
              className={`brand-mark-choice ${current.mark === mark ? "is-selected" : ""}`}
              aria-label={MARK_LABELS[mark]}
              aria-pressed={current.mark === mark}
              onClick={() => onChange({ mark })}
            >
              <span className="brand-mark-icon"><BrandGlyph mark={mark} /></span>
              <span>{MARK_LABELS[mark]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="brand-control-group">
        <div className="brand-control-label"><span>Signage pattern</span><small>how the office carries it</small></div>
        <div className="brand-pattern-grid">
          {BRAND_PATTERNS.map((pattern) => (
            <button
              key={pattern}
              type="button"
              className={`brand-pattern-choice ${current.pattern === pattern ? "is-selected" : ""}`}
              aria-label={`${PATTERN_LABELS[pattern]} signage pattern`}
              aria-pressed={current.pattern === pattern}
              onClick={() => onChange({ pattern })}
            >
              <span className={`brand-pattern-sample brand-pattern-${pattern}`} style={brandStyle(current.color, current.secondaryColor)} />
              <span>{PATTERN_LABELS[pattern]}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="brand-tagline-field">
        <span className="brand-control-label"><span>Company line</span><small>optional · 48 characters</small></span>
        <input
          value={current.tagline}
          maxLength={48}
          placeholder="Ideas with room to compound."
          onChange={(event) => onChange({ tagline: event.target.value.slice(0, 48) })}
        />
      </label>
    </section>
  );
}
