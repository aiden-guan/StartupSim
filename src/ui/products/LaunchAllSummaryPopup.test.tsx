import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LaunchAllSummaryPopup } from "./LaunchAllSummaryPopup";

describe("LaunchAllSummaryPopup", () => {
  it("renders a compact bulk-launch summary instead of a full market report", () => {
    const markup = renderToStaticMarkup(
      <LaunchAllSummaryPopup
        summary={{
          launchedCount: 3,
          totalWeeklyRevenue: 42_500,
          totalWeeklyNetContribution: 38_200,
          totalUsers: 7_250,
          averageMarketShare: 12.4,
        }}
        onClose={vi.fn()}
      />,
    );

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain("Launch all complete");
    expect(markup).toContain("3 products are now live.");
    expect(markup).toContain("$42.5k");
    expect(markup).toContain("$38.2k");
    expect(markup).toContain("7,250");
    expect(markup).toContain("12%");
    expect(markup).toContain("Back to launches →");
    expect(markup).not.toContain("Market penetration");
  });
});
