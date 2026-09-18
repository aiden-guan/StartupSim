import { perkVisualIds, promoVisualIds } from "../../visuals/registry";
import type { ReactNode } from "react";

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

// These are deliberately small object studies rather than generic category marks.
// They echo the low-poly props in the office while remaining crisp at catalog size.
const objectGlyphs: Record<string, ReactNode> = {
  coffee: <><path d="M6 8h9v8H6z" fill="currentColor" opacity=".78"/><path d="M15 10h2a2 2 0 0 1 0 4h-2"/><path d="M5 18h12"/><path d="M8 5h6v3H8z" fill="currentColor" opacity=".32"/><circle cx="9" cy="11" r=".7" fill="#f7f0e2"/><circle cx="12" cy="11" r=".7" fill="#f7f0e2"/></>,
  desks: <><path d="M3 9h18v3H3z" fill="currentColor" opacity=".78"/><path d="M6 12v8M18 12v8M9 6h6v3"/><path d="M9 15h6v4H9z" fill="currentColor" opacity=".28"/></>,
  food: <><path d="M4 10h16l-1 9H5z" fill="currentColor" opacity=".7"/><path d="M5 10 8 6h8l3 4" fill="currentColor" opacity=".3"/><path d="M10 12h4M9 15h6"/><path d="M17 5v-2M14 5V2"/></>,
  rest: <><path d="M4 12h16v7H4z" fill="currentColor" opacity=".76"/><path d="M6 12V8h5a4 4 0 0 1 4 4M4 19v2M20 19v2"/><path d="M6 15h13" stroke="#f7f0e2"/></>,
  play: <><path d="m4 9 3-2h10l3 2-2 8-4-3H10l-4 3z" fill="currentColor" opacity=".76"/><path d="M8 11v4M6 13h4"/><circle cx="16" cy="12" r=".8" fill="#f7f0e2"/><circle cx="18" cy="14" r=".8" fill="#f7f0e2"/></>,
  life: <><path d="M12 20S4 16 4 10a4 4 0 0 1 7-2.7L12 9l1-1.7A4 4 0 0 1 20 10c0 6-8 10-8 10z" fill="currentColor" opacity=".7"/><path d="M8 12h3l1-2 1 4 1-2h2" stroke="#f7f0e2"/></>,
  transit: <><path d="M6 5h12a3 3 0 0 1 3 3v9H3V8a3 3 0 0 1 3-3z" fill="currentColor" opacity=".7"/><path d="M3 12h18M7 19v2M17 19v2M8 8h8"/><circle cx="8" cy="15.5" r="1" fill="#f7f0e2"/><circle cx="16" cy="15.5" r="1" fill="#f7f0e2"/></>,
  gym: <><path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12" strokeWidth="2.2"/><path d="M9 9h6v6H9z" fill="currentColor" opacity=".42"/></>,
  launch: <><path d="M5 18h14V8H5z" fill="currentColor" opacity=".6"/><path d="m8 8 4-5 4 5M9 13h6M12 10v6"/><path d="M3 20h18"/></>,
  "viral-demo": <><rect x="7" y="3" width="10" height="18" rx="1.2" fill="currentColor" opacity=".7"/><path d="m10 9 5 3-5 3z" fill="#f7f0e2"/><path d="M18 8a4 4 0 0 1 0 8M20 6a7 7 0 0 1 0 12"/></>,
  benchmark: <><path d="M4 20V4M4 20h17"/><path d="M7 16v-3h3v3M11 16V9h3v7M15 16v-5h3v5" fill="currentColor" opacity=".65"/><path d="m7 10 4-4 3 2 4-4"/></>,
  podcast: <><rect x="9" y="4" width="6" height="11" rx="2" fill="currentColor" opacity=".72"/><path d="M6 11v1a6 6 0 0 0 12 0v-1M12 18v3M8 21h8"/><path d="M12 7v5" stroke="#f7f0e2"/></>,
  conference: <><path d="M4 5h16v11H4z" fill="currentColor" opacity=".5"/><path d="M8 20h8M12 16v4M8 12l3-3 2 2 3-4"/><path d="M6 8h12" stroke="#f7f0e2"/></>,
  influencer: <><rect x="8" y="3" width="8" height="18" rx="1" fill="currentColor" opacity=".68"/><circle cx="12" cy="17" r="1" fill="#f7f0e2"/><path d="M18 8a4 4 0 0 1 0 8M20 6a7 7 0 0 1 0 12"/><path d="M10 7h4"/></>,
  keynote: <><path d="M4 17h16M6 17V6h12v11" fill="currentColor" opacity=".5"/><path d="m9 13 3-5 3 5M12 17v4"/><path d="M3 21h18"/></>,
  "agi-soon": <><path d="M5 7h14v10H5z" fill="currentColor" opacity=".68"/><path d="M8 12h2l2-3 2 6 2-3h2" stroke="#f7f0e2"/><path d="M9 20h6"/><circle cx="12" cy="5" r="1" fill="currentColor"/></>,
};

export function CatalogGlyph({ kind, id, className = "" }: { kind: "perk" | "promo"; id: string; className?: string }) {
  const paths = kind === "perk" ? perkPaths[id as keyof typeof perkPaths] : promoPaths[id as keyof typeof promoPaths];
  if (!paths) throw new Error(`Missing ${kind} glyph definition: ${id}`);
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {objectGlyphs[id] ?? paths.map((path, index) => <path key={index} d={path} />)}
  </svg>;
}
