// Precision monetary math helpers using integer paise to avoid IEEE-754 floating point issues

/**
 * Converts Rupees to integer Paise (1 INR = 100 Paise)
 */
export function toPaise(rupees: number): number {
  if (isNaN(rupees) || !isFinite(rupees)) return 0;
  return Math.round((rupees + Number.EPSILON) * 100);
}

/**
 * Converts integer Paise back to Rupees with exactly 2 decimal places
 */
export function toRupees(paise: number): number {
  if (isNaN(paise) || !isFinite(paise)) return 0;
  return Number((paise / 100).toFixed(2));
}

/**
 * Decimal-safe addition for currency values (Rupees)
 */
export function addMoney(a: number, b: number): number {
  return toRupees(toPaise(a) + toPaise(b));
}

/**
 * Decimal-safe subtraction for currency values (Rupees)
 */
export function subMoney(a: number, b: number): number {
  return toRupees(toPaise(a) - toPaise(b));
}

/**
 * Decimal-safe multiplication: (amount in Rs * factor) rounded to 2 decimal places
 */
export function mulMoney(amount: number, factor: number): number {
  if (isNaN(amount) || isNaN(factor)) return 0;
  // Calculate with high precision then round to paise
  return toRupees(Math.round((amount * factor + Number.EPSILON) * 100));
}

/**
 * Decimal-safe division: (amount in Rs / divisor) rounded to 2 decimal places
 */
export function divMoney(amount: number, divisor: number): number {
  if (!divisor || isNaN(amount) || isNaN(divisor)) return 0;
  return toRupees(Math.round(((amount / divisor) + Number.EPSILON) * 100));
}

/**
 * Round any number to specified decimal places safely
 */
export function roundTo(val: number, decimals: number = 2): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}
