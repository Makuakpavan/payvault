export const BASE_CURRENCY = "USD";
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "NGN", "JPY", "CAD", "AUD", "GHS", "KES", "ZAR", "INR", "CNY", "AED"] as const;
export const CURRENCIES: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  NGN: "Nigerian Naira",
  JPY: "Japanese Yen",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  GHS: "Ghanaian Cedi",
  KES: "Kenyan Shilling",
  ZAR: "South African Rand",
  INR: "Indian Rupee",
  CNY: "Chinese Yuan",
  AED: "UAE Dirham",
};
export const CODES = Object.keys(CURRENCIES) as [string, ...string[]];
export const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  NGN: 1540,
  JPY: 157,
  CAD: 1.36,
  AUD: 1.51,
  GHS: 12.2,
  KES: 129,
  ZAR: 18.4,
  INR: 83.5,
  CNY: 7.26,
  AED: 3.67,
};

export function digitsFor(currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
}

export function toMinor(amount: number, currency = BASE_CURRENCY) {
  return Math.round(amount * 10 ** digitsFor(currency));
}

export function fromMinor(minor: number, currency = BASE_CURRENCY) {
  return minor / 10 ** digitsFor(currency);
}

export function fmt(minor: number, currency = BASE_CURRENCY) {
  const value = fromMinor(minor, currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function convertUsdToCurrency(amountUsd: number, target: string) {
  const base = FALLBACK_RATES[target] ?? 1;
  return amountUsd / 100 / (base === 0 ? 1 : base);
}

export function convertToUsd(amount: number, from: string) {
  if (!from || from === BASE_CURRENCY) return amount;
  const rate = FALLBACK_RATES[from] ?? 1;
  return amount * rate;
}

export function formatMoneyFromUsd(amountUsd: number, currency: string) {
  const value = convertUsdToCurrency(amountUsd, currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatUsd(amountUsd: number) {
  return fmt(amountUsd, BASE_CURRENCY);
}

export function centsFromUsd(amountUsd: number) {
  return Math.round(amountUsd * 100);
}

export function usdFromCents(cents: number) {
  return cents / 100;
}

export function normalizeCurrency(code: string) {
  return (code || BASE_CURRENCY).toUpperCase();
}
