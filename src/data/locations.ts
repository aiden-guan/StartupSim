export interface LocationDef {
  id: string;
  name: string;
  region: string;
  cost: number;
  rent: number;
  skills: { research: number; engineering: number; product: number; growth: number; productivity: number };
  bonuses: string;
  effects?: { type: string; value: number }[];
}

export const locations: LocationDef[] = [
  { id: "sf", name: "San Francisco", region: "North America", cost: 35_000_000, rent: 800_000, skills: { research: 8, engineering: 8, product: 6, growth: 8, productivity: 8 }, bonuses: "Strong talent and investor access.", effects: [{ type: "prestige", value: 4 }] },
  { id: "seattle", name: "Seattle", region: "North America", cost: 22_000_000, rent: 450_000, skills: { research: 6, engineering: 10, product: 4, growth: 4, productivity: 9 }, bonuses: "Strong engineering and cloud talent." },
  { id: "nyc", name: "New York", region: "North America", cost: 30_000_000, rent: 750_000, skills: { research: 4, engineering: 5, product: 8, growth: 10, productivity: 8 }, bonuses: "Media, finance, and growth talent." },
  { id: "london", name: "London", region: "Europe", cost: 20_000_000, rent: 500_000, skills: { research: 5, engineering: 5, product: 6, growth: 7, productivity: 7 }, bonuses: "European access and regulatory experience." },
  { id: "paris", name: "Paris", region: "Europe", cost: 18_000_000, rent: 400_000, skills: { research: 6, engineering: 4, product: 8, growth: 5, productivity: 6 }, bonuses: "Product and research talent." },
  { id: "toronto", name: "Toronto", region: "North America", cost: 9_000_000, rent: 225_000, skills: { research: 8, engineering: 6, product: 5, growth: 4, productivity: 7 }, bonuses: "Strong research talent." },
  { id: "bangalore", name: "Bangalore", region: "Asia", cost: 5_000_000, rent: 100_000, skills: { research: 5, engineering: 10, product: 4, growth: 4, productivity: 10 }, bonuses: "Engineering density and lower wages.", effects: [{ type: "wageMultiplier", value: -0.08 }] },
  { id: "singapore", name: "Singapore", region: "Asia", cost: 15_000_000, rent: 350_000, skills: { research: 4, engineering: 6, product: 5, growth: 6, productivity: 8 }, bonuses: "Government access and high productivity." },
  { id: "taipei", name: "Taipei", region: "Asia", cost: 12_000_000, rent: 250_000, skills: { research: 5, engineering: 9, product: 4, growth: 3, productivity: 8 }, bonuses: "Engineering and hardware supply-chain access." },
  { id: "tokyo", name: "Tokyo", region: "Asia", cost: 20_000_000, rent: 500_000, skills: { research: 7, engineering: 8, product: 8, growth: 5, productivity: 8 }, bonuses: "Hardware, engineering, and product talent." },
  { id: "austin", name: "Austin", region: "North America", cost: 7_500_000, rent: 175_000, skills: { research: 4, engineering: 6, product: 5, growth: 6, productivity: 8 }, bonuses: "Lower-cost space and high productivity." },
  { id: "abudhabi", name: "Abu Dhabi", region: "Middle East", cost: 25_000_000, rent: 300_000, skills: { research: 5, engineering: 5, product: 4, growth: 8, productivity: 7 }, bonuses: "Capital access and lower energy costs.", effects: [{ type: "energyCost", value: -0.1 }] },
];
