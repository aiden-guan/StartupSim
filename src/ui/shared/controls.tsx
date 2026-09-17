import type { ButtonHTMLAttributes, ReactNode } from "react";

export function GameButton({
  children,
  tone = "plain",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "plain" | "primary" | "ghost" | "danger" }) {
  const tones = {
    primary: "bg-copper text-white hover:bg-[#a85224]",
    plain: "border border-white/15 bg-white/5 hover:bg-white/10",
    ghost: "hover:bg-white/10",
    danger: "text-[#e07a7a] hover:bg-[#9b2f2f]/20",
  };
  return (
    <button
      type="button"
      {...props}
      className={`game-btn px-3 py-2 text-sm disabled:opacity-40 ${tones[tone]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function GamePanel({
  title,
  children,
  onClose,
  variant = "default",
}: {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  variant?: "default" | "paper" | "mail" | "workbench" | "tree" | "cards";
}) {
  const skin =
    variant === "paper" || variant === "mail"
      ? "term-sheet text-ink"
      : variant === "workbench"
        ? "game-panel border-copper/40"
        : "game-panel";
  return (
    <aside className={`${skin} pointer-events-auto absolute bottom-3 right-3 top-24 z-20 flex w-[min(440px,44vw)] flex-col shadow-2xl`}>
      <header className={`flex items-center justify-between px-4 py-3 ${variant === "paper" || variant === "mail" ? "border-b border-line" : "border-b border-white/10"}`}>
        <h2 className="font-display text-xl">{title}</h2>
        {onClose ? (
          <button type="button" className="font-mono text-[10px] uppercase tracking-widest text-[#9aa3b2]" onClick={onClose}>
            Close
          </button>
        ) : null}
      </header>
      <div className="panel-scroll min-h-0 flex-1 overflow-auto p-4 text-sm">{children}</div>
    </aside>
  );
}

export function NotificationBadge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="ml-1 inline-flex min-w-4 items-center justify-center bg-copper px-1 font-mono text-[9px] text-white">{count}</span>;
}

export function CharacterCard({ children }: { children: ReactNode }) {
  return <section className="flex gap-3 border border-white/10 p-3">{children}</section>;
}

export function StatBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const n = Math.max(0, Math.min(max, value));
  return (
    <div className="flex items-center gap-2">
      <span className="w-24 font-mono text-[10px] uppercase tracking-widest text-[#9aa3b2]">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={`h-2 w-2 ${i < n ? "bg-copper" : "bg-white/15"}`} />
        ))}
      </div>
    </div>
  );
}

export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="group relative">
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden -translate-x-1/2 whitespace-nowrap border border-white/10 bg-panel-2 px-2 py-1 font-mono text-[10px] text-paper group-hover:block">
        {text}
      </span>
    </span>
  );
}
