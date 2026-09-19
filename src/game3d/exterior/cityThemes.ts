/**
 * The exterior scene is deliberately data driven.  A theme describes a small
 * set of material and silhouette decisions; ExteriorEnvironment owns the
 * reusable geometry used to display them.
 */

export type CityLocationId =
  | "sf"
  | "seattle"
  | "nyc"
  | "london"
  | "paris"
  | "toronto"
  | "bangalore"
  | "singapore"
  | "taipei"
  | "tokyo"
  | "austin"
  | "abudhabi";

export const CITY_LOCATION_IDS = [
  "sf",
  "seattle",
  "nyc",
  "london",
  "paris",
  "toronto",
  "bangalore",
  "singapore",
  "taipei",
  "tokyo",
  "austin",
  "abudhabi",
] as const satisfies readonly CityLocationId[];

export type CityVegetation = "coastal" | "evergreen" | "urban" | "broadleaf" | "lush" | "subtropical" | "palm" | "liveOak" | "cherryBlossom";
export type CityArchitecture = "bay" | "pnw" | "dense" | "brick" | "stone" | "northAmerican" | "tech" | "tropical" | "eastAsian" | "japanese" | "austin" | "gulf";

export interface CityTheme {
  /** Stable location id. The home fallback uses the reserved id `home`. */
  id: CityLocationId | "home";
  name: string;
  region: string;
  /** Background and low-ground colors are kept muted so the office remains the focal point. */
  sky: string;
  ground: string;
  plaza: string;
  sidewalk: string;
  curb: string;
  road: string;
  lane: string;
  building: readonly string[];
  buildingAccent: string;
  window: string;
  vegetation: CityVegetation;
  architecture: CityArchitecture;
  /** 0..1 controls how many shared pieces are placed at medium/high quality. */
  density: number;
  /** Keeps skyline silhouettes below or near the office wall height. */
  heightScale: number;
  /** A small, deterministic grade cue for hilly locations. */
  slope: number;
  /** Used by the simple road dressing and intentionally independent from simulation. */
  trafficSide: "right" | "left";
  signage: "none" | "urban" | "vertical";
  vegetationColor: string;
  vegetationAccent: string;
  vehicleAccent: string;
}

const HOME_THEME: CityTheme = {
  id: "home",
  name: "Home",
  region: "Headquarters",
  sky: "#e8e9e4",
  ground: "#c9c4b4",
  plaza: "#ded3c3",
  sidewalk: "#c8c9bf",
  curb: "#9da7a2",
  road: "#525a60",
  lane: "#e7cf91",
  building: ["#d6d9d2", "#b9c4c0", "#aab8b8"],
  buildingAccent: "#71848d",
  window: "#8eaeba",
  vegetation: "coastal",
  architecture: "bay",
  density: 0.38,
  heightScale: 0.72,
  slope: 0,
  trafficSide: "right",
  signage: "none",
  vegetationColor: "#5c8646",
  vegetationAccent: "#8ea27d",
  vehicleAccent: "#e06b3a",
};

/**
 * Exactly one visual definition per purchasable location. Keep this record in
 * lockstep with src/data/locations.ts; tests intentionally assert the key set.
 */
export const cityThemes: Record<CityLocationId, CityTheme> = {
  sf: {
    id: "sf",
    name: "San Francisco",
    region: "North America",
    sky: "#dce5e1",
    ground: "#c6c5b8",
    plaza: "#ddd5c7",
    sidewalk: "#c8cbc4",
    curb: "#9ba7a4",
    road: "#555e64",
    lane: "#e3c774",
    building: ["#e4d8c8", "#c7beb4", "#a9b8ba", "#d2d9d3"],
    buildingAccent: "#6f8490",
    window: "#87aebe",
    vegetation: "coastal",
    architecture: "bay",
    density: 0.68,
    heightScale: 0.82,
    slope: 0.08,
    trafficSide: "right",
    signage: "none",
    vegetationColor: "#5c8646",
    vegetationAccent: "#8a9f80",
    vehicleAccent: "#e06b3a",
  },
  seattle: {
    id: "seattle",
    name: "Seattle",
    region: "North America",
    sky: "#cbd7d9",
    ground: "#abb9b8",
    plaza: "#c7cecb",
    sidewalk: "#aeb9b8",
    curb: "#7d8d91",
    road: "#4a555b",
    lane: "#d9bd76",
    building: ["#879da3", "#aab7b6", "#667984", "#d1d9d5"],
    buildingAccent: "#536b76",
    window: "#7ba5b7",
    vegetation: "evergreen",
    architecture: "pnw",
    density: 0.64,
    heightScale: 0.84,
    slope: 0.03,
    trafficSide: "right",
    signage: "none",
    vegetationColor: "#3f694d",
    vegetationAccent: "#6f8d70",
    vehicleAccent: "#719b79",
  },
  nyc: {
    id: "nyc",
    name: "New York",
    region: "North America",
    sky: "#d2d5d2",
    ground: "#9fa5a4",
    plaza: "#c2c0b8",
    sidewalk: "#a9aaa6",
    curb: "#747d80",
    road: "#3f474d",
    lane: "#e8d59a",
    building: ["#8c9297", "#b4aaa0", "#69747d", "#c2c3be"],
    buildingAccent: "#4e5b68",
    window: "#7d9dae",
    vegetation: "urban",
    architecture: "dense",
    density: 1,
    heightScale: 0.98,
    slope: 0,
    trafficSide: "right",
    signage: "urban",
    vegetationColor: "#557f3f",
    vegetationAccent: "#879b74",
    vehicleAccent: "#d94e28",
  },
  london: {
    id: "london",
    name: "London",
    region: "Europe",
    sky: "#ccd4d3",
    ground: "#afb4b0",
    plaza: "#c9c4bb",
    sidewalk: "#b6b8b0",
    curb: "#828d8d",
    road: "#4f575b",
    lane: "#e1d08a",
    building: ["#a77f64", "#b99576", "#7e7773", "#d0c6b7"],
    buildingAccent: "#5f5b5a",
    window: "#849ca0",
    vegetation: "broadleaf",
    architecture: "brick",
    density: 0.76,
    heightScale: 0.78,
    slope: 0,
    trafficSide: "left",
    signage: "urban",
    vegetationColor: "#5d7b58",
    vegetationAccent: "#9aa384",
    vehicleAccent: "#c85b3d",
  },
  paris: {
    id: "paris",
    name: "Paris",
    region: "Europe",
    sky: "#dce0dc",
    ground: "#c4c1b7",
    plaza: "#d8d0c4",
    sidewalk: "#c6c2b8",
    curb: "#929697",
    road: "#535c5c",
    lane: "#e8d69c",
    building: ["#d4c8b5", "#c1b29f", "#e0d7ca", "#aaa79c"],
    buildingAccent: "#766e68",
    window: "#80989b",
    vegetation: "broadleaf",
    architecture: "stone",
    density: 0.76,
    heightScale: 0.76,
    slope: 0,
    trafficSide: "right",
    signage: "urban",
    vegetationColor: "#638159",
    vegetationAccent: "#a0a984",
    vehicleAccent: "#d06e3c",
  },
  toronto: {
    id: "toronto",
    name: "Toronto",
    region: "North America",
    sky: "#d0dadb",
    ground: "#b4bdbb",
    plaza: "#d0d0c8",
    sidewalk: "#b5bfbd",
    curb: "#7d8b8d",
    road: "#4a555b",
    lane: "#e1c979",
    building: ["#abb9bd", "#6e8795", "#c7c9c4", "#87949a"],
    buildingAccent: "#506b7a",
    window: "#79a1b4",
    vegetation: "evergreen",
    architecture: "northAmerican",
    density: 0.72,
    heightScale: 0.9,
    slope: 0,
    trafficSide: "right",
    signage: "none",
    vegetationColor: "#4c744d",
    vegetationAccent: "#799477",
    vehicleAccent: "#e09a45",
  },
  bangalore: {
    id: "bangalore",
    name: "Bangalore",
    region: "Asia",
    sky: "#dce0cb",
    ground: "#b3b08e",
    plaza: "#d0c3a2",
    sidewalk: "#bfb698",
    curb: "#8a866e",
    road: "#555957",
    lane: "#e2c977",
    building: ["#9cae9e", "#c9c0a1", "#718c82", "#d2d7ca"],
    buildingAccent: "#4e6f6c",
    window: "#6f9ba2",
    vegetation: "lush",
    architecture: "tech",
    density: 0.86,
    heightScale: 0.86,
    slope: 0,
    trafficSide: "left",
    signage: "urban",
    vegetationColor: "#4f824e",
    vegetationAccent: "#9aaf6f",
    vehicleAccent: "#e07c3c",
  },
  singapore: {
    id: "singapore",
    name: "Singapore",
    region: "Asia",
    sky: "#c8ddd6",
    ground: "#9fb9a6",
    plaza: "#cbd7c7",
    sidewalk: "#afc5b8",
    curb: "#7a958c",
    road: "#485b5b",
    lane: "#e8d988",
    building: ["#95b5ae", "#d3d6c9", "#688b86", "#b8c9bd"],
    buildingAccent: "#3f6f6c",
    window: "#79b1b4",
    vegetation: "lush",
    architecture: "tropical",
    density: 0.86,
    heightScale: 0.88,
    slope: 0,
    trafficSide: "left",
    signage: "none",
    vegetationColor: "#3f814f",
    vegetationAccent: "#9abf76",
    vehicleAccent: "#e06b3a",
  },
  taipei: {
    id: "taipei",
    name: "Taipei",
    region: "Asia",
    sky: "#cbd8d7",
    ground: "#9eaca5",
    plaza: "#c7c7bc",
    sidewalk: "#aeb9b2",
    curb: "#778483",
    road: "#475255",
    lane: "#e2ca83",
    building: ["#9daaa6", "#c6bca9", "#6b7d80", "#d4d5c9"],
    buildingAccent: "#4f686e",
    window: "#6e9cae",
    vegetation: "subtropical",
    architecture: "eastAsian",
    density: 0.94,
    heightScale: 0.9,
    slope: 0.04,
    trafficSide: "right",
    signage: "vertical",
    vegetationColor: "#4d7d56",
    vegetationAccent: "#9cac74",
    vehicleAccent: "#d94e28",
  },
  tokyo: {
    id: "tokyo",
    name: "Tokyo",
    region: "Asia",
    sky: "#d4dcd9",
    ground: "#afb9b4",
    plaza: "#c9cbc3",
    sidewalk: "#b7c0ba",
    curb: "#7d8986",
    road: "#424e52",
    lane: "#ead88f",
    building: ["#a4afb0", "#c7c6bb", "#6d7e87", "#d8d7cf"],
    buildingAccent: "#485d68",
    window: "#719cac",
    vegetation: "cherryBlossom",
    architecture: "japanese",
    density: 1,
    heightScale: 0.94,
    slope: 0,
    trafficSide: "left",
    signage: "vertical",
    vegetationColor: "#e58aa8",
    vegetationAccent: "#f7bfd2",
    vehicleAccent: "#e05c3a",
  },
  austin: {
    id: "austin",
    name: "Austin",
    region: "North America",
    sky: "#e4dfca",
    ground: "#c2b38f",
    plaza: "#d5c4a1",
    sidewalk: "#c5b692",
    curb: "#948866",
    road: "#565b58",
    lane: "#e5cd7e",
    building: ["#bdad91", "#839791", "#d4c6a9", "#6f817d"],
    buildingAccent: "#4e6e68",
    window: "#76a2a3",
    vegetation: "liveOak",
    architecture: "austin",
    density: 0.56,
    heightScale: 0.66,
    slope: 0,
    trafficSide: "right",
    signage: "none",
    vegetationColor: "#5c7e45",
    vegetationAccent: "#9ca86b",
    vehicleAccent: "#d8783d",
  },
  abudhabi: {
    id: "abudhabi",
    name: "Abu Dhabi",
    region: "Middle East",
    sky: "#e4d6bd",
    ground: "#c9b28c",
    plaza: "#ddc9a7",
    sidewalk: "#d5c09b",
    curb: "#aa8d63",
    road: "#5b5a55",
    lane: "#eee0a6",
    building: ["#d6c1a0", "#b5a17f", "#e3d5bb", "#9caaad"],
    buildingAccent: "#6c7c80",
    window: "#75a4aa",
    vegetation: "palm",
    architecture: "gulf",
    density: 0.72,
    heightScale: 0.92,
    slope: 0,
    trafficSide: "right",
    signage: "none",
    vegetationColor: "#5b8454",
    vegetationAccent: "#a6a56a",
    vehicleAccent: "#d5a84b",
  },
};

/** Resolve unknown, legacy, or home selections without ever throwing. */
export function cityThemeFor(id: string | null): CityTheme {
  if (id && Object.prototype.hasOwnProperty.call(cityThemes, id)) {
    return cityThemes[id as CityLocationId];
  }
  return HOME_THEME;
}

export { HOME_THEME };
