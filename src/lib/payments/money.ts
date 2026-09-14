export const GHS_CURRENCY = 'GHS' as const;

export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount) || amount < 0) throw new Error('Amount must be a non-negative finite number.');
  return Math.round(amount * 100);
}

export function fromMinorUnits(amountMinor: number): number {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) throw new Error('Minor-unit amount must be a non-negative integer.');
  return amountMinor / 100;
}

export function sumMinorUnits(...amounts: number[]): number {
  if (amounts.some((amount) => !Number.isInteger(amount) || amount < 0)) throw new Error('All minor-unit amounts must be non-negative integers.');
  return amounts.reduce((total, amount) => total + amount, 0);
}