import { useState } from "react";
import { recruitingChannels } from "../../data/recruiting";
import type { GameState } from "../../simulation/types";
import { useGame } from "../../state/store";
import { money } from "../format";
import { CharacterPortrait } from "../shared/CharacterPortrait";
import { CharacterCard, GameButton } from "../shared/controls";

export function PeoplePanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const selected = useGame((s) => s.selectedEmployeeId);
  return (
    <div className="space-y-3">
      {game.employees.map((w) => (
        <section key={w.id} className={`flex gap-3 border p-3 ${selected === w.id ? "border-copper" : "border-white/10"}`}>
          <CharacterPortrait look={w.look} robot={w.role === "robot"} className="h-16 w-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{w.name}</div>
                <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
                  {w.title} · {w.role}
                  {w.burnoutDays > 0 ? " · burned out" : ""}
                  {w.remote ? " · remote" : ""}
                </div>
              </div>
              <div className="font-mono text-xs">{money(w.salary)}/yr</div>
            </div>
            <div className="mt-2 grid grid-cols-5 gap-1 font-mono text-[10px]">
              {(["research", "engineering", "product", "growth", "productivity"] as const).map((k) => (
                <div key={k}>
                  {k.slice(0, 1).toUpperCase()} {w.skills[k].toFixed(1)}
                </div>
              ))}
            </div>
            {w.role !== "founder" ? (
              <button type="button" className="mt-2 text-[11px] text-[#e07a7a]" onClick={() => dispatch({ type: "fire", workerId: w.id })}>
                Let go
              </button>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}

export function HiringPanel({ game }: { game: GameState }) {
  const dispatch = useGame((s) => s.dispatch);
  const [offers, setOffers] = useState<Record<string, number>>({});
  return (
    <div className="space-y-4">
      <p className="text-[#9aa3b2]">A channel costs cash and returns a short list. Lowball them and they walk.</p>
      {game.hiring.cooldownDays > 0 ? <p className="font-mono text-xs">Cooldown {game.hiring.cooldownDays}d</p> : null}
      <div className="grid gap-2">
        {recruitingChannels
          .filter((c) => !c.robots || game.company.technologies.includes("agents"))
          .map((c) => (
            <GameButton key={c.id} className="text-left" disabled={game.hiring.cooldownDays > 0 || game.company.cash < c.cost} onClick={() => dispatch({ type: "recruit", channelId: c.id })}>
              <div className="font-medium">{c.name}</div>
              <div className="text-[11px] text-[#9aa3b2]">
                {c.description} · {money(c.cost)}
              </div>
            </GameButton>
          ))}
      </div>
      {game.hiring.candidates.map((c) => {
        const salary = offers[c.employee.id] ?? c.minSalary;
        return (
          <CharacterCard key={c.employee.id}>
            <CharacterPortrait look={c.employee.look} className="h-16 w-14 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">{c.employee.name}</div>
              <div className="font-mono text-[10px] uppercase text-[#9aa3b2]">
                {c.employee.title} · {c.personality}
              </div>
              <label className="mt-2 block text-xs">
                Offer
                <input type="number" className="ml-2 w-32 bg-[#243044] px-2 py-1" value={salary} onChange={(e) => setOffers({ ...offers, [c.employee.id]: Number(e.target.value) })} />
              </label>
              <GameButton tone="primary" className="mt-2" onClick={() => dispatch({ type: "hire", candidateId: c.employee.id, salary })}>
                Hire
              </GameButton>
            </div>
          </CharacterCard>
        );
      })}
    </div>
  );
}
