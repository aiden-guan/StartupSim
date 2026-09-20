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
      { name: "Better Coffee", cost: 12_000, requiredOffice: 0, happiness: 2, productivity: 1, description: "A basic coffee station.", object: "coffee" },
      { name: "Espresso Bar", cost: 60_000, requiredOffice: 1, happiness: 4, productivity: 2, description: "A dedicated coffee bar.", object: "espresso" },
      { name: "Third-Wave Lab", cost: 1_500_000, requiredOffice: 2, happiness: 6, productivity: 2, description: "A premium coffee program.", object: "espresso" },
    ],
  },
  {
    id: "desks",
    name: "Desks",
    upgrades: [
      { name: "Standing Desks", cost: 21_000, requiredOffice: 0, happiness: 2, description: "Standing desks for the team.", object: "desk" },
      { name: "Fancy Chairs", cost: 53_000, requiredOffice: 1, happiness: 4, description: "Ergonomic chairs for the team.", object: "chair" },
      { name: "Focus Pods", cost: 2_000_000, requiredOffice: 2, happiness: 5, productivity: 2, description: "Private rooms for focused work.", object: "pod" },
    ],
  },
  {
    id: "food",
    name: "Food",
    upgrades: [
      { name: "Stocked Fridge", cost: 18_000, requiredOffice: 0, happiness: 3, description: "A stocked office kitchen.", object: "fridge" },
      { name: "Free Meals", cost: 135_000, requiredOffice: 1, happiness: 5, productivity: 1, description: "Free meals for the team.", object: "kitchen" },
      { name: "Private Chef", cost: 4_000_000, requiredOffice: 2, happiness: 8, prestige: 2, description: "An on-site chef and dining service.", object: "kitchen" },
    ],
  },
  {
    id: "rest",
    name: "Rest",
    upgrades: [
      { name: "Nap Pods", cost: 38_000, requiredOffice: 1, happiness: 4, description: "Dedicated rest spaces.", object: "nap" },
      { name: "Meditation Room", cost: 105_000, requiredOffice: 1, happiness: 5, description: "A quiet room for recovery.", object: "zen" },
      { name: "On-site Doctor", cost: 10_000_000, requiredOffice: 3, happiness: 7, prestige: 2, description: "On-site medical support.", object: "clinic" },
    ],
  },
  {
    id: "play",
    name: "Play",
    upgrades: [
      { name: "Ping-Pong", cost: 9_000, requiredOffice: 0, happiness: 3, description: "A recreation area.", object: "pingpong" },
      { name: "Gaming Room", cost: 120_000, requiredOffice: 1, happiness: 5, description: "A dedicated gaming room.", object: "arcade" },
      { name: "Executive Dining", cost: 8_000_000, requiredOffice: 3, happiness: 4, prestige: 3, description: "A formal dining area.", object: "dining" },
    ],
  },
  {
    id: "life",
    name: "Life Admin",
    upgrades: [
      { name: "Dog-Friendly", cost: 14_000, requiredOffice: 0, happiness: 4, description: "A dog-friendly workplace.", object: "dog" },
      { name: "Therapy Benefit", cost: 68_000, requiredOffice: 1, happiness: 6, description: "Subsidized mental-health support.", object: "therapy" },
      { name: "Childcare", cost: 3_000_000, requiredOffice: 2, happiness: 8, description: "On-site childcare support.", object: "kids" },
      { name: "Employee Housing", cost: 250_000_000, requiredOffice: 4, happiness: 10, prestige: 3, description: "Housing support for employees.", object: "housing" },
    ],
  },
  {
    id: "transit",
    name: "Transit",
    upgrades: [
      { name: "Shuttle", cost: 1_250_000, requiredOffice: 2, happiness: 4, productivity: 1, description: "Company shuttle service.", object: "shuttle" },
      { name: "Private Transit", cost: 400_000_000, requiredOffice: 4, happiness: 6, prestige: 2, description: "Private transport for employees.", object: "shuttle" },
    ],
  },
  {
    id: "gym",
    name: "Body",
    upgrades: [
      { name: "Gym Stipend", cost: 27_000, requiredOffice: 0, happiness: 2, description: "A gym membership stipend.", object: "gym" },
      { name: "On-site Gym", cost: 2_500_000, requiredOffice: 2, happiness: 5, description: "An office gym.", object: "gym" },
    ],
  },
];

export const perkById = Object.fromEntries(perks.map((p) => [p.id, p]));
