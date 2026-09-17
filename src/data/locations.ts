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
  { id: "sf", name: "San Francisco", region: "North America", cost: 1_200_000, rent: 40_000, skills: { research: 8, engineering: 8, product: 6, growth: 8, productivity: 8 }, bonuses: "Talent and investors in walking distance, unfortunately.", effects: [{ type: "prestige", value: 4 }] },
  { id: "seattle", name: "Seattle", region: "North America", cost: 900_000, rent: 22_000, skills: { research: 6, engineering: 10, product: 4, growth: 4, productivity: 9 }, bonuses: "Cloud people who already know the outage is coming." },
  { id: "nyc", name: "New York", region: "North America", cost: 1_100_000, rent: 38_000, skills: { research: 4, engineering: 5, product: 8, growth: 10, productivity: 8 }, bonuses: "Media, finance, and a very fast no." },
  { id: "london", name: "London", region: "Europe", cost: 800_000, rent: 24_000, skills: { research: 5, engineering: 5, product: 6, growth: 7, productivity: 7 }, bonuses: "A bridge to Europe and a regulator with stationery." },
  { id: "paris", name: "Paris", region: "Europe", cost: 700_000, rent: 20_000, skills: { research: 6, engineering: 4, product: 8, growth: 5, productivity: 6 }, bonuses: "Taste, research, and lunches that are meetings." },
  { id: "toronto", name: "Toronto", region: "North America", cost: 500_000, rent: 14_000, skills: { research: 8, engineering: 6, product: 5, growth: 4, productivity: 7 }, bonuses: "Researchers who still believe in papers." },
  { id: "bangalore", name: "Bangalore", region: "Asia", cost: 350_000, rent: 8_000, skills: { research: 5, engineering: 10, product: 4, growth: 4, productivity: 10 }, bonuses: "Engineering density. Time zones as a feature.", effects: [{ type: "wageMultiplier", value: -0.08 }] },
  { id: "singapore", name: "Singapore", region: "Asia", cost: 650_000, rent: 18_000, skills: { research: 4, engineering: 6, product: 5, growth: 6, productivity: 8 }, bonuses: "A government that answers email." },
  { id: "taipei", name: "Taipei", region: "Asia", cost: 550_000, rent: 12_000, skills: { research: 5, engineering: 9, product: 4, growth: 3, productivity: 8 }, bonuses: "The supply chain has a face." },
  { id: "tokyo", name: "Tokyo", region: "Asia", cost: 800_000, rent: 22_000, skills: { research: 7, engineering: 8, product: 8, growth: 5, productivity: 8 }, bonuses: "Hardware culture and impeccable incident reports." },
  { id: "austin", name: "Austin", region: "North America", cost: 450_000, rent: 12_000, skills: { research: 4, engineering: 6, product: 5, growth: 6, productivity: 8 }, bonuses: "Energy, land, and a campus that wants to be a city." },
  { id: "abudhabi", name: "Abu Dhabi", region: "Middle East", cost: 1_000_000, rent: 16_000, skills: { research: 5, engineering: 5, product: 4, growth: 8, productivity: 7 }, bonuses: "Capital and electrons, both abundant.", effects: [{ type: "energyCost", value: -0.1 }] },
];
