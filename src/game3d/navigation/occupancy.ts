const held = new Map<string, string>();
const seats = new Map<string, Set<string>>();

export function occupancyReset() {
  held.clear();
  seats.clear();
}

export function releasePoint(agentId: string) {
  const point = held.get(agentId);
  if (!point) return;
  seats.get(point)?.delete(agentId);
  held.delete(agentId);
}

export function claimPoint(pointId: string, agentId: string, capacity: number): boolean {
  const current = held.get(agentId);
  if (current === pointId) return true;
  const set = seats.get(pointId) ?? new Set();
  if (set.size >= capacity && !set.has(agentId)) return false;
  releasePoint(agentId);
  set.add(agentId);
  seats.set(pointId, set);
  held.set(agentId, pointId);
  return true;
}

export function occupants(pointId: string): number {
  return seats.get(pointId)?.size ?? 0;
}
