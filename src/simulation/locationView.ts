import { locations } from '../data/locations';
/** Ownership remains independent of the presentation-only office selection. */
export function normalizeActiveLocation(company: { locations: string[]; activeLocationId?: unknown }): string | null {
  const id = company.activeLocationId;
  return typeof id === 'string' && locations.some(location => location.id === id) && company.locations.includes(id) ? id : null;
}
