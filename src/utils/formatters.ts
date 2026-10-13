// Indian numbering and date/time formatters

/**
 * Formats a number as Indian Rupee (INR) currency: e.g., ₹1,50,250.00
 */
export function formatINR(
  amount: number,
  options: { showSign?: boolean; decimals?: number; includeSymbol?: boolean } = {}
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0.00';
  }

  const { showSign = false, decimals = 2, includeSymbol = true } = options;
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format integer and fractional part using Indian numbering system
  const fixedStr = absAmount.toFixed(decimals);
  const [intPart, decPart] = fixedStr.split('.');

  // Indian grouping: last 3 digits, then groups of 2 digits
  let formattedInt = '';
  if (intPart.length <= 3) {
    formattedInt = intPart;
  } else {
    const lastThree = intPart.substring(intPart.length - 3);
    const remaining = intPart.substring(0, intPart.length - 3);
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${groups},${lastThree}`;
  }

  const formattedNum = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  const symbol = includeSymbol ? '₹' : '';

  if (isNegative) {
    return `-${symbol}${formattedNum}`;
  }
  if (showSign && amount > 0) {
    return `+${symbol}${formattedNum}`;
  }
  return `${symbol}${formattedNum}`;
}

/**
 * Format date to standard Indian format DD/MM/YYYY
 */
export function formatDateIndian(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    // YYYY-MM-DD to DD/MM/YYYY
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format date to readable DD MMM YYYY (e.g. 15 Oct 2026)
 */
export function formatDateReadable(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format time to HH:MM AM/PM
 */
export function formatTime(timeStr?: string): string {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const strHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${strHours}:${minutes} ${ampm}`;
  }
  return timeStr;
}

/**
 * Returns color class for P&L amounts
 */
export function getPnLColorClass(amount: number): string {
  if (amount > 0) return 'text-emerald-400';
  if (amount < 0) return 'text-rose-400';
  return 'text-slate-400';
}

/**
 * Returns background color class for badges
 */
export function getPnLBadgeClass(amount: number): string {
  if (amount > 0) return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
  if (amount < 0) return 'bg-rose-950/60 text-rose-400 border-rose-800/60';
  return 'bg-slate-800 text-slate-300 border-slate-700';
}
