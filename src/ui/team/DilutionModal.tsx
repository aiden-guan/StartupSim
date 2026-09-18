import { useState } from "react";
import type { Employee, GameState } from "../../simulation/types";
import { isEduardoSaverin } from "../../data/achievements";
import { useGame } from "../../state/store";
import { GameButton } from "../shared/controls";
import { CharacterPortrait } from "../shared/CharacterPortrait";

export function DilutionModal({
  worker,
  game,
  onClose,
}: {
  worker: Employee;
  game: GameState;
  onClose: () => void;
}) {
  const dispatch = useGame((s) => s.dispatch);
  const isEduardo = isEduardoSaverin(worker);
  const isCofounder = worker.role === "cofounder";

  const [percentage, setPercentage] = useState<number>(isEduardo ? 99 : 50);

  const currentWorkerEquity = worker.equity;
  const cut = currentWorkerEquity * (percentage / 100);
  const newWorkerEquity = Math.max(0, currentWorkerEquity - cut);
  const currentFounderEquity = game.company.ownership.founder;
  const newFounderEquity = currentFounderEquity + cut;

  const handleDilute = () => {
    dispatch({
      type: "dilute",
      workerId: worker.id,
      percentage,
    });
    onClose();
  };

  const moraleHit = isCofounder ? (percentage >= 50 ? 2.8 : 1.8) : (percentage >= 50 ? 1.4 : 0.8);
  const trustLoss = isCofounder ? (percentage >= 50 ? 18 : 12) : (percentage >= 50 ? 10 : 6);
  const backlashGain = isCofounder ? (percentage >= 50 ? 16 : 10) : (percentage >= 50 ? 8 : 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="game-panel w-[min(540px,96vw)] p-6 rounded-xl border-2 border-[#9b2f2f]/60 shadow-2xl text-[#efe8dc]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#cfc5b6]/20 pb-4">
          <div className="flex items-center gap-3">
            <CharacterPortrait look={worker.look} robot={worker.role === "robot"} />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#ad7155] font-bold">
                Hostile Cap Table Restructuring
              </span>
              <h3 className="font-display text-xl font-bold text-[#efe8dc]">
                Dilute {worker.name}
              </h3>
              <p className="text-xs text-[#9aa3b2]">{worker.title} · {worker.role}</p>
            </div>
          </div>
          <button
            type="button"
            className="text-lg p-2 text-[#9aa3b2] hover:text-white transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Equity Preview */}
        <div className="my-4 grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-[#141b26] border border-[#cfc5b6]/10 text-center">
          <div className="p-2.5 rounded bg-[#1b2433]">
            <span className="text-[11px] text-[#9aa3b2] block font-mono">{worker.name.split(" ")[0]} Stake</span>
            <div className="text-sm line-through text-[#9aa3b2] mt-1">
              {(currentWorkerEquity * 100).toFixed(2)}%
            </div>
            <strong className="text-lg font-mono font-bold text-[#e06c75] block">
              {(newWorkerEquity * 100).toFixed(2)}%
            </strong>
            <small className="text-[10px] text-[#e06c75] font-mono">
              -{(cut * 100).toFixed(2)}%
            </small>
          </div>

          <div className="p-2.5 rounded bg-[#1b2433]">
            <span className="text-[11px] text-[#9aa3b2] block font-mono">Your Founder Stake</span>
            <div className="text-sm line-through text-[#9aa3b2] mt-1">
              {(currentFounderEquity * 100).toFixed(2)}%
            </div>
            <strong className="text-lg font-mono font-bold text-[#4ade80] block">
              {(newFounderEquity * 100).toFixed(2)}%
            </strong>
            <small className="text-[10px] text-[#4ade80] font-mono">
              +{(cut * 100).toFixed(2)}%
            </small>
          </div>
        </div>

        {/* Percentage Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#9aa3b2]">Dilution Severity:</span>
            <strong className="text-sm font-bold text-[#c9a227]">{percentage}%</strong>
          </div>

          <input
            type="range"
            min={5}
            max={100}
            step={1}
            value={percentage}
            onChange={(e) => setPercentage(Number(e.target.value))}
            className="w-full accent-[#c4622d] cursor-pointer"
          />

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[25, 50, 75, 90].map((val) => (
              <button
                key={val}
                type="button"
                className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                  percentage === val
                    ? "bg-[#c4622d] text-white font-bold"
                    : "bg-[#141b26] text-[#9aa3b2] hover:text-white"
                }`}
                onClick={() => setPercentage(val)}
              >
                {val}%
              </button>
            ))}
            {isEduardo && (
              <button
                type="button"
                className={`px-3 py-1 rounded text-xs font-mono transition-all border ${
                  percentage === 99
                    ? "bg-[#c9a227] text-black font-bold border-[#c9a227]"
                    : "bg-[#c9a227]/10 text-[#c9a227] border-[#c9a227]/40 hover:bg-[#c9a227]/20"
                }`}
                onClick={() => setPercentage(99)}
                title="Dilute Eduardo to 0.03% stake (The Social Network special)"
              >
                🎬 99% (The Social Network)
              </button>
            )}
          </div>
        </div>

        {/* Consequences / Internal Turmoil Warning */}
        <div className="mt-4 p-3.5 rounded-lg bg-[#9b2f2f]/15 border border-[#9b2f2f]/40 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-[#e06c75] font-bold font-mono">
            <span>⚠</span>
            <span>INTERNAL TURMOIL & CONSEQUENCES</span>
          </div>

          <ul className="list-disc list-inside space-y-1 text-[#d8d1c4] text-[11px] leading-relaxed">
            <li>
              <strong>{worker.name}</strong> will suffer a catastrophic morale and loyalty collapse with high burnout and strike risk.
            </li>
            <li>
              <strong>Company-wide turmoil:</strong> -{moraleHit.toFixed(1)} happiness and loyalty hit across all employees.
            </li>
            <li>
              <strong>Institutional damage:</strong> -{trustLoss} company trust, +{backlashGain} public backlash.
            </li>
            {isEduardo ? (
              <li className="text-[#c9a227] font-semibold">
                <strong>Legal Action:</strong> Eduardo Saverin will retain counsel and challenge the share issuance. Unlocks <em>"The Social Network"</em> achievement.
              </li>
            ) : (
              <li>
                <strong>Public fallout:</strong> A formal grievance will be lodged, and press leaks will hit the news wire.
              </li>
            )}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-[#cfc5b6]/20">
          <GameButton onClick={onClose}>Cancel</GameButton>
          <GameButton
            tone="danger"
            onClick={handleDilute}
            title="Execute dilution and reclaim equity"
          >
            Confirm Dilution ({percentage}%)
          </GameButton>
        </div>
      </div>
    </div>
  );
}
