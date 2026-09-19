import { useState } from "react";
import { offices } from "../../data/offices";
import { locations } from "../../data/locations";
import type { GraphicsQuality } from "../../simulation/types";
import "./WorldQaToolbar.css";

export type WorldQaLocation = "home" | (typeof locations)[number]["id"];
export type WorldQaCultureTier = "none" | "0" | "1" | "2" | "max";

export interface WorldQaSelection {
  world: number;
  location: WorldQaLocation;
  cultureTier: WorldQaCultureTier;
  quality: GraphicsQuality;
  reducedMotion: boolean;
}

export const WORLD_QA_CULTURE_TIERS: Array<{ value: WorldQaCultureTier; label: string }> = [
  { value: "none", label: "None" },
  { value: "0", label: "Tier 0" },
  { value: "1", label: "Tier 1" },
  { value: "2", label: "Tier 2" },
  { value: "max", label: "Max available" },
];

const WORLD_QA_QUALITIES: GraphicsQuality[] = ["low", "medium", "high"];
const WORLD_QA_LOCATIONS: Array<{ id: WorldQaLocation; name: string }> = [
  { id: "home", name: "Home HQ" },
  ...locations.map((location) => ({ id: location.id as WorldQaLocation, name: location.name })),
];

const DEFAULT_WORLD_QA_SELECTION: WorldQaSelection = {
  world: 0,
  location: "home",
  cultureTier: "none",
  quality: "high",
  reducedMotion: false,
};

function isWorldQaLocation(value: string | null): value is WorldQaLocation {
  return value === "home" || locations.some((location) => location.id === value);
}

function isWorldQaCultureTier(value: string | null): value is WorldQaCultureTier {
  return WORLD_QA_CULTURE_TIERS.some((tier) => tier.value === value);
}

function isGraphicsQuality(value: string | null): value is GraphicsQuality {
  return value === "low" || value === "medium" || value === "high";
}

export function readWorldQaSelection(search: string): WorldQaSelection {
  const params = new URLSearchParams(search);
  const worldValue = Number(params.get("world"));
  const loc = params.get("location");
  const cult = params.get("cultureTier");
  const qual = params.get("quality");
  return {
    world: Number.isInteger(worldValue) ? Math.max(0, Math.min(offices.length - 1, worldValue)) : DEFAULT_WORLD_QA_SELECTION.world,
    location: isWorldQaLocation(loc) ? loc : DEFAULT_WORLD_QA_SELECTION.location,
    cultureTier: isWorldQaCultureTier(cult) ? cult : DEFAULT_WORLD_QA_SELECTION.cultureTier,
    quality: isGraphicsQuality(qual) ? qual : DEFAULT_WORLD_QA_SELECTION.quality,
    reducedMotion: params.get("motion") === "reduced",
  };
}

/** Preserve unrelated fixture/debug parameters while replacing QA controls. */
export function worldQaQuery(search: string, selection: WorldQaSelection): string {
  const params = new URLSearchParams(search);
  params.set("world", String(Math.max(0, Math.min(offices.length - 1, selection.world))));
  if (selection.location === "home") params.delete("location");
  else params.set("location", selection.location);
  params.set("cultureTier", selection.cultureTier);
  params.set("quality", selection.quality);
  if (selection.reducedMotion) params.set("motion", "reduced");
  else params.delete("motion");
  const query = params.toString();
  return query ? `?${query}` : "";
}

function locationLabel(locationId: WorldQaLocation): string {
  return WORLD_QA_LOCATIONS.find((location) => location.id === locationId)?.name ?? "Home HQ";
}

function cultureLabel(value: WorldQaCultureTier): string {
  return WORLD_QA_CULTURE_TIERS.find((tier) => tier.value === value)?.label ?? "None";
}

function selectionSummary(selection: WorldQaSelection): string {
  return `${offices[selection.world]?.name ?? "Apartment"} · ${locationLabel(selection.location)} · ${cultureLabel(selection.cultureTier)} · ${selection.quality}${selection.reducedMotion ? " · Reduced motion" : ""}`;
}

export function WorldQaToolbar({ search }: { search?: string } = {}) {
  const initialSearch = search ?? (typeof window === "undefined" ? "" : window.location.search);
  const [selection, setSelection] = useState<WorldQaSelection>(() => readWorldQaSelection(initialSearch));

  const reloadFixture = () => {
    if (typeof window === "undefined") return;
    const nextQuery = worldQaQuery(window.location.search, selection);
    window.location.assign(`${window.location.pathname}${nextQuery}${window.location.hash}`);
  };

  return (
    <details className="world-qa-toolbar">
      <summary>
        <span className="world-qa-title">World QA</span>
        <span className="world-qa-summary">{selectionSummary(selection)}</span>
        <span className="world-qa-chevron" aria-hidden="true">⌄</span>
      </summary>
      <form className="world-qa-form" onSubmit={(event) => { event.preventDefault(); reloadFixture(); }}>
        <div className="world-qa-grid">
          <label>
            <span>Office tier</span>
            <select value={selection.world} onChange={(event) => setSelection((current) => ({ ...current, world: Number(event.target.value) }))}>
              {offices.map((office) => <option key={office.level} value={office.level}>{office.level} · {office.name}</option>)}
            </select>
          </label>
          <label>
            <span>City view</span>
            <select value={selection.location} onChange={(event) => setSelection((current) => ({ ...current, location: event.target.value as WorldQaLocation }))}>
              {WORLD_QA_LOCATIONS.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </label>
          <label>
            <span>Culture</span>
            <select value={selection.cultureTier} onChange={(event) => setSelection((current) => ({ ...current, cultureTier: event.target.value as WorldQaCultureTier }))}>
              {WORLD_QA_CULTURE_TIERS.map((tier) => <option key={tier.value} value={tier.value}>{tier.label}</option>)}
            </select>
          </label>
          <label>
            <span>Quality</span>
            <select value={selection.quality} onChange={(event) => setSelection((current) => ({ ...current, quality: event.target.value as GraphicsQuality }))}>
              {WORLD_QA_QUALITIES.map((quality) => <option key={quality} value={quality}>{quality[0]!.toUpperCase() + quality.slice(1)}</option>)}
            </select>
          </label>
        </div>
        <label className="world-qa-check">
          <input type="checkbox" checked={selection.reducedMotion} onChange={(event) => setSelection((current) => ({ ...current, reducedMotion: event.target.checked }))} />
          <span>Reduced motion</span>
        </label>
        <button type="submit" className="world-qa-reload">Reload fixture</button>
        <p className="world-qa-note">Changes apply after reload and keep other URL options.</p>
      </form>
    </details>
  );
}

