import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    (
    <div className="dilution-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="dilution-sheet" role="dialog" aria-modal="true" aria-labelledby="dilution-title" aria-describedby="dilution-warning">
        <header className="dilution-header">
          <div className="dilution-subject">
            <CharacterPortrait look={worker.look} robot={worker.role === "robot"} className="dilution-portrait" />
            <div>
              <span className="dilution-kicker">Internal restructuring / Equity</span>
              <h2 id="dilution-title">Dilute {worker.name}</h2>
              <p>{worker.title} · {worker.role}</p>
            </div>
          </div>
          <button type="button" className="dilution-close" aria-label="Close dilution dialog" onClick={onClose}>×</button>
        </header>

        <div className="dilution-content">
          <section className="dilution-equity" aria-label="Projected ownership change">
            <div className="dilution-equity-card dilution-equity-loss">
              <span>{worker.name.split(" ")[0]} stake</span>
              <div className="dilution-equity-was">{(currentWorkerEquity * 100).toFixed(2)}%</div>
              <strong>{(newWorkerEquity * 100).toFixed(2)}%</strong>
              <small>−{(cut * 100).toFixed(2)}%</small>
            </div>
            <div className="dilution-equity-arrow" aria-hidden="true">→</div>
            <div className="dilution-equity-card dilution-equity-gain">
              <span>Your founder stake</span>
              <div className="dilution-equity-was">{(currentFounderEquity * 100).toFixed(2)}%</div>
              <strong>{(newFounderEquity * 100).toFixed(2)}%</strong>
              <small>+{(cut * 100).toFixed(2)}%</small>
            </div>
          </section>

          <section className="dilution-control" aria-label="Dilution severity">
            <div className="dilution-control-heading">
              <span>Equity reclaimed</span>
              <strong>{percentage}%</strong>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={1}
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="dilution-range"
            />
            <div className="dilution-presets">
              {[25, 50, 75, 90].map((val) => (
                <button key={val} type="button" className={percentage === val ? "is-selected" : ""} onClick={() => setPercentage(val)}>
                  {val}%
                </button>
              ))}
              {isEduardo && (
                <button
                  type="button"
                  className={`dilution-special ${percentage === 99 ? "is-selected" : ""}`}
                  onClick={() => setPercentage(99)}
                  title="Dilute Eduardo to 0.03% stake (The Social Network special)"
                >
                  99% · Social Network
                </button>
              )}
            </div>
          </section>

          <section className="dilution-warning" id="dilution-warning">
            <div className="dilution-warning-heading"><span aria-hidden="true">▲</span> Internal turmoil & consequences</div>
            <ul>
              <li><strong>{worker.name}</strong> faces a morale and loyalty collapse with high burnout and strike risk.</li>
              <li><strong>Company-wide:</strong> −{moraleHit.toFixed(1)} happiness and loyalty across all employees.</li>
              <li><strong>Institutional:</strong> −{trustLoss} company trust, +{backlashGain} public backlash.</li>
              {isEduardo ? (
                <li className="dilution-legal"><strong>Legal action:</strong> Eduardo Saverin retains counsel and challenges the issuance. Unlocks <em>“The Social Network”</em>.</li>
              ) : (
                <li><strong>Public fallout:</strong> A formal grievance and press leaks will hit the news wire.</li>
              )}
            </ul>
          </section>

          <footer className="dilution-footer">
            <span>Ownership changes are permanent.</span>
            <div>
              <GameButton onClick={onClose} className="dilution-cancel">Cancel</GameButton>
              <GameButton tone="danger" onClick={handleDilute} className="dilution-confirm" title="Execute dilution and reclaim equity">
                Confirm {percentage}%
              </GameButton>
            </div>
          </footer>
        </div>
      </section>
    </div>
    ),
    document.body,
  );
}
