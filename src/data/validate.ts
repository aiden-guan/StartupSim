import { z } from "zod";
import { primitives } from "./primitives";
import { recipes } from "./recipes";
import { technologies } from "./technologies";
import { models } from "./models";
import { cofounders } from "./cofounders";
import { events } from "./events";
import { onboarding } from "./onboarding";

const primitiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["capability", "vertical", "interface", "business"]),
  difficulty: z.number(),
  computeWeight: z.number(),
  description: z.string(),
});

const recipeSchema = z.object({
  id: z.string(),
  parts: z.tuple([z.string(), z.string()]),
  name: z.string(),
  description: z.string(),
  innovation: z.number(),
  vertical: z.string(),
  riskTags: z.array(z.string()),
});

const techSchema = z.object({
  id: z.string(),
  name: z.string(),
  era: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  description: z.string(),
  cost: z.number(),
  requiredProgress: z.number(),
  requires: z.array(z.string()),
});

export function validateCatalogs(): void {
  z.array(primitiveSchema).parse(primitives);
  z.array(recipeSchema).parse(recipes);
  z.array(techSchema).parse(technologies);
  z.array(z.object({ id: z.string(), name: z.string(), provider: z.string(), costPerMTok: z.number() })).parse(models);
  z.array(z.object({ id: z.string(), name: z.string(), skills: z.object({ research: z.number() }) })).parse(cofounders);
  z.array(z.object({ id: z.string(), title: z.string(), conditions: z.array(z.any()) })).parse(events);
  z.array(z.object({ id: z.string(), slides: z.array(z.object({ id: z.string(), text: z.string() })) })).parse(onboarding);
}
