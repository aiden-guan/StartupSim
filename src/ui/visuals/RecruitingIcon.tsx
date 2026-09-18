import { recruitingVisualIds } from "../../visuals/registry";

const paths = {
  network: ["M7 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6", "M2 20v-2a5 5 0 0 1 10 0v2M12 20v-2a5 5 0 0 1 10 0v2", "M10 8h4"],
  board: ["M4 5h16v14H4z", "M8 9h8M8 13h6M8 17h4", "M7 3v4M17 3v4"],
  university: ["M3 10 12 4l9 6-9 4z", "M6 12v6M10 14v4M14 14v4M18 12v6", "M4 20h16"],
  recruiter: ["M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M3 21v-3a6 6 0 0 1 12 0v3", "M16 9h5v7h-5zM17 9V7h3v2"],
  exec: ["M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M3 21v-3a6 6 0 0 1 10-4", "M15 15a4 4 0 1 0 0 6 4 4 4 0 0 0-6-4M18 18l4 4"],
  conference: ["M7 4h10v7H7z", "M12 11v4", "M8 21l4-6 4 6", "M9 7h6"],
  poach: ["M5 7h5v10H5zM14 7h5v10h-5z", "M9 12h7", "M13 9l3 3-3 3"],
  acqui: ["M4 5h7v7H4zM13 12h7v7h-7z", "M8 16c1-3 3-5 6-6", "M12 7l3 3-3 3"],
  robots: ["M6 8h12v10H6z", "M9 12h.1M15 12h.1M9 16h6", "M12 8V4M10 4h4", "M3 11h3M18 11h3"],
} satisfies Record<keyof typeof recruitingVisualIds, string[]>;

export function RecruitingIcon({ id }: { id: string }) {
  const iconPaths = paths[id as keyof typeof paths];
  if (!iconPaths) throw new Error(`Missing recruiting glyph definition: ${id}`);
  return <svg className="recruiting-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {iconPaths.map((path, index) => <path key={index} d={path} />)}
  </svg>;
}
