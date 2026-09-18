import type { Rng } from "./rng";

const first = [
  "Maya", "James", "Priya", "Noah", "Elena", "Kai", "Sofia", "Marcus", "Amina", "Leo",
  "Hana", "Owen", "Zara", "Theo", "Mei", "Ibrahim", "Lucia", "Soren", "Asha", "Felix",
  "Nia", "Hugo", "Ines", "Ravi", "June", "Omar", "Vera", "Kenji", "Pia", "Andre",
];
const last = [
  "Chen", "Adeyemi", "Park", "Silva", "Nguyen", "Kowalski", "Patel", "Berg", "Okafor", "Rossi",
  "Khan", "Nakamura", "Duarte", "Larsen", "Mensah", "Cohen", "Iyer", "Novak", "Wahl", "Sato",
];

export const namesList = { first, last };

export function randomName(rng: Rng): string {
  return `${rng.pick(first)} ${rng.pick(last)}`;
}

