import { describe, expect, it } from "vitest";
import { validateCatalogs } from "./validate";

describe("catalogs", () => {
  it("parse with zod", () => {
    expect(() => validateCatalogs()).not.toThrow();
  });
});
