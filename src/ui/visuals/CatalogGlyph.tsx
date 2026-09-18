import { perkVisualIds, promoVisualIds } from "../../visuals/registry";

const perkPaths = {
  coffee: ["M7 7h9v8a4 4 0 0 1-4 4h-1a4 4 0 0 1-4-4z", "M16 9h2a3 3 0 0 1 0 6h-2", "M9 3c-1 1 1 2 0 3M13 3c-1 1 1 2 0 3"],
  desks: ["M3 9h18v4H3z", "M6 13v8M18 13v8", "M9 6h6v3"],
  food: ["M5 10h14l-1 10H6z", "M8 10a4 4 0 0 1 8 0", "M12 6V3M9 4l3 2 3-2"],
  rest: ["M4 13h16v6H4z", "M6 13V8h5a4 4 0 0 1 4 4v1", "M4 19v2M20 19v2"],
  play: ["M6 9h12l3 7-3 2-3-3H9l-3 3-3-2z", "M8 12v3M6.5 13.5h3M16.5 12h.1M18.5 14h.1"],
  life: ["M12 21s-8-4.6-8-11a4 4 0 0 1 7-2.6L12 9l1-1.6A4 4 0 0 1 20 10c0 6.4-8 11-8 11z"],
  transit: ["M5 16V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9", "M4 16h16v3H4z", "M7 19v2M17 19v2", "M8 8h8"],
  gym: ["M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"],
} satisfies Record<keyof typeof perkVisualIds, string[]>;

const promoPaths = {
  launch: ["M4 19h16", "M7 16V8h10v8", "M9 8l3-5 3 5", "M10 12h4"],
  "viral-demo": ["M7 4h10v16H7z", "M10 8l5 3-5 3z", "M9 18h6"],
  benchmark: ["M4 20V4M4 20h16", "M7 16l4-5 3 2 5-7"],
  podcast: ["M9 4h6v10H9z", "M6 11v1a6 6 0 0 0 12 0v-1", "M12 18v3M8 21h8"],
  conference: ["M4 5h16v11H4z", "M8 20h8M12 16v4", "M8 12l3-3 2 2 3-4"],
  influencer: ["M8 4h8v16H8z", "M10 8h4M10 16h4", "M18 7a4 4 0 0 1 0 6M20 5a7 7 0 0 1 0 10"],
  keynote: ["M3 17h18", "M5 17V6h14v11", "M9 13l3-5 3 5", "M12 17v4"],
  "agi-soon": ["M5 7h14v10H5z", "M8 12h2l2-3 2 6 2-3h2", "M9 20h6"],
} satisfies Record<keyof typeof promoVisualIds, string[]>;

export function CatalogGlyph({ kind, id, className = "" }: { kind: "perk" | "promo"; id: string; className?: string }) {
  const paths = kind === "perk" ? perkPaths[id as keyof typeof perkPaths] : promoPaths[id as keyof typeof promoPaths];
  if (!paths) throw new Error(`Missing ${kind} glyph definition: ${id}`);
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {paths.map((path, index) => <path key={index} d={path} />)}
  </svg>;
}
