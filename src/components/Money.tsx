"use client";

import { useCurrency } from "@/components/CurrencyProvider";

export function Money({ amount, currency }: { amount: number | bigint | string; currency?: string }) {
  const { selectedCurrency, format, convert } = useCurrency();
  const value = Number(amount ?? 0) / 100;
  const target = (currency || selectedCurrency || "USD").toUpperCase();
  const display = convert(value, "USD", target);

  return <>{new Intl.NumberFormat("en-US", { style: "currency", currency: target, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(display)}</>;
}
