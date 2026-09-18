import { describe, expect, it } from "vitest";
import { models } from "../data/models";
import { archetypeLabel, assertVisualRegistryComplete, modelTags, modelVisualFor, promotionEffort, recruitingPoolLabel, worldConditionLabel } from "./registry";
import { modelPricePerMTok } from "../ui/format";

describe("visual presentation registry", () => {
  it("covers every current visualized game entity", () => {
    expect(() => assertVisualRegistryComplete()).not.toThrow();
  });

  it("maps internal progress and recruiting scores to stable player language", () => {
    expect([70, 100, 220].map(promotionEffort)).toEqual(["Small campaign", "Medium campaign", "Major campaign"]);
    expect([10, 20, 30, 36].map(recruitingPoolLabel)).toEqual(["Familiar pool", "Broad pool", "Strong pool", "Elite pool"]);
  });

  it("derives model strengths from real stats", () => {
    expect(modelTags(models.find((model) => model.id === "openbrain-o4")!)).toContain("Frontier");
    expect(modelTags(models.find((model) => model.id === "metamind-34b")!)).toContain("Open");
    expect(modelTags(models.find((model) => model.id === "claudius-instant")!)).toContain("Fast");
  });

  it("keeps distinct model visuals explicit and never rounds small prices to zero", () => {
    expect(modelVisualFor("openbrain-o4")).toEqual({ provider: "openbrain", tier: 2 });
    expect(() => modelVisualFor("new-unmapped-model")).toThrow("Missing model visual definition");
    expect([0.4, 1.2, 2.4, 12].map(modelPricePerMTok)).toEqual(["$0.40", "$1.20", "$2.40", "$12"]);
  });

  it("uses directionally clear world labels and readable rival archetypes", () => {
    expect(worldConditionLabel("pressure", 130, 100)).toBe("Very high");
    expect(worldConditionLabel("pressure", 88, 100)).toBe("Easing");
    expect(worldConditionLabel("climate", 82, 50)).toBe("Enthusiastic");
    expect(worldConditionLabel("momentum", 20, 50)).toBe("Emerging");
    expect(archetypeLabel("opensource")).toBe("Open source");
  });
});
