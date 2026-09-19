import { useEffect } from "react";
import type { LaunchAllSummary } from "../../state/store";
import { money, pct } from "../format";

interface LaunchAllSummaryPopupProps {
  summary: LaunchAllSummary;
  onClose: () => void;
}

export function LaunchAllSummaryPopup({ summary, onClose }: LaunchAllSummaryPopupProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const productLabel = summary.launchedCount === 1 ? "product is" : "products are";

  return (
    <div className="launch-summary-overlay" role="presentation">
      <section
        className="launch-summary-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="launch-summary-title"
      >
        <header className="launch-summary-header">
          <span className="launch-summary-eyebrow">Launch report / bulk run</span>
          <button type="button" className="launch-summary-close" aria-label="Close launch summary" onClick={onClose}>
            ✕
          </button>
        </header>
        <div className="launch-summary-content">
          <span className="launch-summary-mark" aria-hidden="true">⚡</span>
          <h2 id="launch-summary-title">Launch all complete</h2>
          <p className="launch-summary-intro">
            {summary.launchedCount} {productLabel} now live.
          </p>
          <div className="launch-summary-stats">
            <div>
              <small>Weekly revenue</small>
              <strong>{money(summary.totalWeeklyRevenue)}</strong>
            </div>
            <div>
              <small>Net contribution / week</small>
              <strong className={summary.totalWeeklyNetContribution >= 0 ? "is-positive" : "is-negative"}>
                {money(summary.totalWeeklyNetContribution)}
              </strong>
            </div>
            <div>
              <small>Customers</small>
              <strong>{Math.round(summary.totalUsers).toLocaleString()}</strong>
            </div>
            <div>
              <small>Average share</small>
              <strong>{pct(summary.averageMarketShare)}</strong>
            </div>
          </div>
          <p className="launch-summary-note">All products were configured and delegated through Auto-Delegate.</p>
          <button type="button" className="primary-action launch-summary-action" onClick={onClose}>
            Back to launches →
          </button>
          <small className="launch-summary-paused">Time remains paused until you continue.</small>
        </div>
      </section>
    </div>
  );
}
