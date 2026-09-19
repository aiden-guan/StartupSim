import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WorldQaToolbar, readWorldQaSelection, worldQaQuery } from "./WorldQaToolbar";

describe("World QA toolbar", () => {
  it("reads supported fixture controls and keeps a home view explicit", () => {
    expect(readWorldQaSelection("?world=4&location=tokyo&cultureTier=max&quality=low&motion=reduced")).toEqual({
      world: 4,
      location: "tokyo",
      cultureTier: "max",
      quality: "low",
      reducedMotion: true,
    });
    expect(readWorldQaSelection("?world=99&location=unknown&cultureTier=bad&quality=bad").location).toBe("home");
    expect(readWorldQaSelection("?world=99").world).toBe(5);
  });

  it("replaces QA query values while preserving unrelated options", () => {
    const query = worldQaQuery("?world=1&location=tokyo&artifact=answer-engine&gallery=1", {
      world: 3,
      location: "home",
      cultureTier: "2",
      quality: "medium",
      reducedMotion: false,
    });
    expect(query).toContain("world=3");
    expect(query).not.toContain("location=");
    expect(query).toContain("cultureTier=2");
    expect(query).toContain("quality=medium");
    expect(query).not.toContain("motion=");
    expect(query).toContain("artifact=answer-engine");
    expect(query).toContain("gallery=1");
  });

  it("renders the collapsed status summary on the server", () => {
    const markup = renderToStaticMarkup(<WorldQaToolbar search="?world=3&location=tokyo&cultureTier=2&quality=low&motion=reduced" />);
    expect(markup).toContain("World QA");
    expect(markup).toContain("AI Lab · Tokyo · Tier 2 · low · Reduced motion");
    expect(markup).toContain("Reload fixture");
  });
});

