export interface PerkDef {
  id: string;
  name: string;
  upgrades: {
    name: string;
    cost: number;
    requiredOffice: number;
    requiredTech?: string;
    happiness: number;
    productivity?: number;
    prestige?: number;
    description: string;
    object: string;
  }[];
}

export const perks: PerkDef[] = [
  {
    id: "coffee",
    name: "Coffee",
    upgrades: [
      { name: "Better Coffee", cost: 8_000, requiredOffice: 0, happiness: 2, productivity: 1, description: "The kettle is no longer an insult.", object: "coffee" },
      { name: "Espresso Bar", cost: 40_000, requiredOffice: 1, happiness: 4, productivity: 2, description: "A machine louder than the standup.", object: "espresso" },
      { name: "Third-Wave Lab", cost: 180_000, requiredOffice: 2, happiness: 6, productivity: 2, description: "Single origin, single personality.", object: "espresso" },
    ],
  },
  {
    id: "desks",
    name: "Desks",
    upgrades: [
      { name: "Standing Desks", cost: 14_000, requiredOffice: 0, happiness: 2, description: "Everyone is taller, briefly.", object: "desk" },
      { name: "Fancy Chairs", cost: 35_000, requiredOffice: 1, happiness: 4, description: "Mesh. Lumbar. Status.", object: "chair" },
      { name: "Focus Pods", cost: 220_000, requiredOffice: 2, happiness: 5, productivity: 2, description: "A room for not being in a room.", object: "pod" },
    ],
  },
  {
    id: "food",
    name: "Food",
    upgrades: [
      { name: "Stocked Fridge", cost: 12_000, requiredOffice: 0, happiness: 3, description: "La Croix and leftovers of ambition.", object: "fridge" },
      { name: "Free Meals", cost: 90_000, requiredOffice: 1, happiness: 5, productivity: 1, description: "Leaving for lunch is now a cultural failure.", object: "kitchen" },
      { name: "Private Chef", cost: 400_000, requiredOffice: 2, happiness: 8, prestige: 2, description: "The tasting menu has a Slack channel.", object: "kitchen" },
    ],
  },
  {
    id: "rest",
    name: "Rest",
    upgrades: [
      { name: "Nap Pods", cost: 25_000, requiredOffice: 1, happiness: 4, description: "Sleep, but branded.", object: "nap" },
      { name: "Meditation Room", cost: 70_000, requiredOffice: 1, happiness: 5, description: "Silence with a booking link.", object: "zen" },
      { name: "On-site Doctor", cost: 500_000, requiredOffice: 3, happiness: 7, prestige: 2, description: "Healthcare as a perk, not a right.", object: "clinic" },
    ],
  },
  {
    id: "play",
    name: "Play",
    upgrades: [
      { name: "Ping-Pong", cost: 6_000, requiredOffice: 0, happiness: 3, description: "The sound of a company that is not shipping.", object: "pingpong" },
      { name: "Gaming Room", cost: 80_000, requiredOffice: 1, happiness: 5, description: "GPUs, misallocated.", object: "arcade" },
      { name: "Executive Dining", cost: 350_000, requiredOffice: 3, happiness: 4, prestige: 3, description: "A table the ICs have heard of.", object: "dining" },
    ],
  },
  {
    id: "life",
    name: "Life Admin",
    upgrades: [
      { name: "Dog-Friendly", cost: 9_000, requiredOffice: 0, happiness: 4, description: "A good boy on the all-hands.", object: "dog" },
      { name: "Therapy Benefit", cost: 45_000, requiredOffice: 1, happiness: 6, description: "Feelings, subsidized.", object: "therapy" },
      { name: "Childcare", cost: 280_000, requiredOffice: 2, happiness: 8, description: "The future of work includes snacks for smaller humans.", object: "kids" },
      { name: "Employee Housing", cost: 2_000_000, requiredOffice: 4, happiness: 10, prestige: 3, description: "A company town, but with kombucha.", object: "housing" },
    ],
  },
  {
    id: "transit",
    name: "Transit",
    upgrades: [
      { name: "Shuttle", cost: 120_000, requiredOffice: 2, happiness: 4, productivity: 1, description: "Wi-Fi on a bus that people yell at.", object: "shuttle" },
      { name: "Private Transit", cost: 900_000, requiredOffice: 4, happiness: 6, prestige: 2, description: "The street is optional.", object: "shuttle" },
    ],
  },
  {
    id: "gym",
    name: "Body",
    upgrades: [
      { name: "Gym Stipend", cost: 18_000, requiredOffice: 0, happiness: 2, description: "A membership they will not use.", object: "gym" },
      { name: "On-site Gym", cost: 260_000, requiredOffice: 2, happiness: 5, description: "Deadlifts next to the evals cluster.", object: "gym" },
    ],
  },
];

export const perkById = Object.fromEntries(perks.map((p) => [p.id, p]));
