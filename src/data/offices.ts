export interface OfficeDef {
  level: number;
  id: string;
  name: string;
  capacity: number;
  cost: number;
  rent: number;
  description: string;
}

export const offices: OfficeDef[] = [
  { level: 0, id: "apartment", name: "Apartment", capacity: 6, cost: 0, rent: 2200, description: "Two desks, one sad plant, a whiteboard that used to be a door." },
  { level: 1, id: "garage-office", name: "Tiny Office", capacity: 12, cost: 180_000, rent: 8_500, description: "A lease, a kitchenette, a server rack performing confidence." },
  { level: 2, id: "hq", name: "Startup HQ", capacity: 48, cost: 1_800_000, rent: 42_000, description: "Rooms with names. A lounge that is also a meeting." },
  { level: 3, id: "lab", name: "AI Lab", capacity: 120, cost: 12_000_000, rent: 180_000, description: "GPU noise as culture. Badges that mean something." },
  { level: 4, id: "campus", name: "Campus", capacity: 400, cost: 80_000_000, rent: 900_000, description: "A courtyard, a visitor center, a logo you can see from the air." },
  { level: 5, id: "mega", name: "Megacampus", capacity: 2000, cost: 400_000_000, rent: 3_200_000, description: "Fewer people. More machines. The lights stay on anyway." },
];

export const officeByLevel = Object.fromEntries(offices.map((o) => [o.level, o]));
