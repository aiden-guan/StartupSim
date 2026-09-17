import { BALANCE } from "../config/balance";

export function communicationPairs(n: number): number {
  return (n * (n - 1)) / 2;
}

export function communicationBand(n: number): 0 | 1 | 2 {
  const overhead = communicationPairs(n);
  if (overhead <= BALANCE.OVERHEAD_LOW) return 0;
  if (overhead <= BALANCE.OVERHEAD_MID) return 1;
  return 2;
}

export function communicationMultiplier(n: number, managementBonus = 0): number {
  const effective = Math.max(1, n - managementBonus);
  return BALANCE.COMMUNICATION_MULTIPLIERS[communicationBand(effective)];
}
