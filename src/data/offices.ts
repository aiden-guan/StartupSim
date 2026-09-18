export interface OfficeDef {
  level: number;
  id: string;
  name: string;
  capacity: number;
  cost: number;
  rent: number;
  description: string;
  morale: number;
  productivity: number;
  recruiting: number;
  retention: number;
  prestige: number;
}

export const offices: OfficeDef[] = [
  { level: 0, id: "apartment", name: "Apartment", capacity: 6, cost: 0, rent: 2_200, morale: 0, productivity: 0, recruiting: 0, retention: 0, prestige: 0, description: "Two desks, one sad plant, a whiteboard that used to be a door." },
  { level: 1, id: "garage-office", name: "Tiny Office", capacity: 12, cost: 420_000, rent: 18_000, morale: 5, productivity: 3, recruiting: 1, retention: 3, prestige: 4, description: "A lease, a kitchenette, a server rack performing confidence." },
  { level: 2, id: "hq", name: "Startup HQ", capacity: 48, cost: 5_400_000, rent: 110_000, morale: 10, productivity: 6, recruiting: 3, retention: 6, prestige: 10, description: "Rooms with names. A lounge that is also a meeting." },
  { level: 3, id: "lab", name: "AI Lab", capacity: 120, cost: 38_000_000, rent: 480_000, morale: 14, productivity: 11, recruiting: 6, retention: 9, prestige: 18, description: "GPU noise as culture. Badges that mean something." },
  { level: 4, id: "campus", name: "Campus", capacity: 400, cost: 210_000_000, rent: 2_400_000, morale: 18, productivity: 15, recruiting: 10, retention: 12, prestige: 26, description: "A courtyard, a visitor center, a logo you can see from the air." },
  { level: 5, id: "mega", name: "Megacampus", capacity: 2000, cost: 920_000_000, rent: 9_200_000, morale: 20, productivity: 17, recruiting: 14, retention: 14, prestige: 34, description: "Fewer people. More machines. The lights stay on anyway." },
];

export const officeByLevel = Object.fromEntries(offices.map((o) => [o.level, o]));

export function officeAnnualBurden(office: OfficeDef): number {
  return office.rent * 12 + office.cost / 36;
}
