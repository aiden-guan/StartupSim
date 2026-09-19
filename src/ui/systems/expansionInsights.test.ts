import { describe, expect, it } from "vitest";
import { lobbies } from "../../data/lobbies";
import { locations } from "../../data/locations";
import { specialProjects } from "../../data/specialProjects";
import { verticals } from "../../data/verticals";
import {
  describeEffectForUi,
  describeLobbyEffects,
  describeLocationBenefits,
  describeLocationProfile,
  describeProjectEffects,
  describeProjectRequirements,
  describeVerticalUnlocks,
  technologiesForVertical,
} from "./expansionInsights";

describe("expansion insight presentation", () => {
  it("derives vertical technology paths from requiredVertical", () => {
    expect(technologiesForVertical("hardware").map((technology) => technology.name)).toContain("AI Chip Design");
    expect(technologiesForVertical("science").map((technology) => technology.name)).toContain("AI Science");
    expect(technologiesForVertical("developer")).toEqual([]);
    expect(technologiesForVertical("consumer")).toEqual([]);
  });

  it("derives a readable vertical path from primitives, technologies, projects, and recipes", () => {
    const summary = describeVerticalUnlocks(verticals.find((vertical) => vertical.id === "robotics")!);
    expect(summary.profile).toBe("Robotics · medium regulation");
    expect(summary.primitives).toContain("Robotics");
    expect(summary.technologies).toContain("General Robotics");
    expect(summary.projects).toContain("Robotics Division");
    expect(summary.productExamples).toContain("Floor Worker");
  });

  it("describes a location with its real bonus and strongest skill profile", () => {
    const benefits = describeLocationBenefits(locations.find((location) => location.id === "bangalore")!);
    expect(benefits).toContain("Engineering +1.25 team output before company modifiers");
    expect(benefits).toContain("Productivity +1.25 team output before company modifiers");
    expect(benefits).toContain("Revenue reach +3% per owned office");
    expect(benefits).toContain("Wage rate -8%");
    expect(describeLocationProfile(locations.find((location) => location.id === "bangalore")!)).toEqual(["Engineering hub", "Productivity hub"]);

    const abuDhabiBenefits = describeLocationBenefits(locations.find((location) => location.id === "abudhabi")!);
    expect(abuDhabiBenefits).toContain("Energy costs -10%");
  });

  it("keeps project requirements tied to canonical technology and team values", () => {
    const project = specialProjects.find((item) => item.id === "foundation-model")!;
    expect(describeProjectRequirements(project)).toEqual([
      "Research: Synthetic Data · Reasoning",
      "Work target: 290 progress · Research 400 · Engineering 350 · Product 120",
    ]);
  });

  it("translates project and lobby effects without exposing internal effect IDs", () => {
    const projectEffects = describeProjectEffects("foundation-model");
    expect(projectEffects).toContain("Unlocks In-House Frontier");
    expect(projectEffects).toContain("AI capability +8");
    expect(projectEffects.join(" ")).not.toContain("unlockModel");

    expect(describeProjectEffects("research-lab")).toEqual(["Research speed +15%", "Prestige +8"]);

    const lobbyEffects = describeLobbyEffects(lobbies.find((lobby) => lobby.id === "safety-standards")!);
    expect(lobbyEffects).toEqual(["Trust +8", "Regulation +4"]);
    expect(describeLobbyEffects("rd-credit")).toEqual([]);
  });

  it("returns no invented copy for unknown effects", () => {
    expect(describeEffectForUi({ type: "futureEffect", value: "future-value" })).toBeNull();
  });
});
