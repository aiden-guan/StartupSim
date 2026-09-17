import type { MeshStandardMaterialParameters } from "three";

export const mats = {
  plaster: { color: "#efe6d6", roughness: 0.92, metalness: 0 } satisfies MeshStandardMaterialParameters,
  plasterWarm: { color: "#e7dcc8", roughness: 0.9, metalness: 0 } satisfies MeshStandardMaterialParameters,
  wood: { color: "#c4a574", roughness: 0.72, metalness: 0.02 } satisfies MeshStandardMaterialParameters,
  woodDark: { color: "#6b5344", roughness: 0.74, metalness: 0.04 } satisfies MeshStandardMaterialParameters,
  oak: { color: "#b08968", roughness: 0.7, metalness: 0.02 } satisfies MeshStandardMaterialParameters,
  fabric: { color: "#8f3d2c", roughness: 0.88, metalness: 0 } satisfies MeshStandardMaterialParameters,
  fabricBlue: { color: "#3d4a63", roughness: 0.86, metalness: 0 } satisfies MeshStandardMaterialParameters,
  plastic: { color: "#d8d3c8", roughness: 0.46, metalness: 0.08 } satisfies MeshStandardMaterialParameters,
  plasticDark: { color: "#1b2433", roughness: 0.5, metalness: 0.12 } satisfies MeshStandardMaterialParameters,
  glass: { color: "#9ec5d8", roughness: 0.08, metalness: 0.15, transparent: true, opacity: 0.38 } satisfies MeshStandardMaterialParameters,
  screen: { color: "#1a2330", roughness: 0.28, metalness: 0.2, emissive: "#1f6b4a", emissiveIntensity: 0.35 } satisfies MeshStandardMaterialParameters,
  metal: { color: "#6d7788", roughness: 0.38, metalness: 0.55 } satisfies MeshStandardMaterialParameters,
  concrete: { color: "#c5c0b6", roughness: 0.95, metalness: 0 } satisfies MeshStandardMaterialParameters,
  plant: { color: "#2f5d45", roughness: 0.8, metalness: 0 } satisfies MeshStandardMaterialParameters,
  paper: { color: "#f4f0e6", roughness: 0.9, metalness: 0 } satisfies MeshStandardMaterialParameters,
  copper: { color: "#c4622d", roughness: 0.42, metalness: 0.35 } satisfies MeshStandardMaterialParameters,
  skin: { roughness: 0.62, metalness: 0 } satisfies MeshStandardMaterialParameters,
  hair: { roughness: 0.7, metalness: 0 } satisfies MeshStandardMaterialParameters,
  rubber: { color: "#1a1a1a", roughness: 0.85, metalness: 0 } satisfies MeshStandardMaterialParameters,
};
