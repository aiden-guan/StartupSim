import { modelVisualFor } from "../../visuals/registry";
import { CompanyMark } from "./CompanyMark";

export function ModelGlyph({ modelId }: { modelId: string }) {
  const visual = modelVisualFor(modelId);
  return <span className={`model-glyph tier-${visual.tier}`} aria-hidden="true">
    <CompanyMark company={visual.provider} />
    <i /><i /><i />
  </span>;
}
