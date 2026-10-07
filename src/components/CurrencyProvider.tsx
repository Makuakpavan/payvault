"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BASE_CURRENCY, FALLBACK_RATES, SUPPORTED_CURRENCIES } from "@/lib/money";

type CurrencyContextValue = {
  selectedCurrency: string;
  setSelectedCurrency: (currency: string) => void;
  rates: Record<string, number>;
  convert: (amount: number, fromCurrency?: string, toCurrency?: string) => number;
  format: (amount: number, currencyOverride?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [selectedCurrency, setSelectedCurrencyState] = useState<string>("USD");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);

  useEffect(() => {
    const stored = window.localStorage.getItem("payvault.currency");
    if (stored && SUPPORTED_CURRENCIES.includes(stored as (typeof SUPPORTED_CURRENCIES)[number])) {
      setSelectedCurrencyState(stored);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/rates", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setRates({ ...FALLBACK_RATES, ...(data.rates || {}) });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const setSelectedCurrency = useCallback((currency: string) => {
    const normalized = (currency || BASE_CURRENCY).toUpperCase();
    setSelectedCurrencyState(normalized);
    window.localStorage.setItem("payvault.currency", normalized);
  }, []);

  const convert = useCallback(
    (amount: number, fromCurrency = BASE_CURRENCY, toCurrency = selectedCurrency) => {
      if (!Number.isFinite(amount)) return 0;
      const from = (fromCurrency || BASE_CURRENCY).toUpperCase();
      const to = (toCurrency || BASE_CURRENCY).toUpperCase();
      const fromRate = rates[from] ?? 1;
      const toRate = rates[to] ?? 1;
      const usdAmount = from === BASE_CURRENCY ? amount : amount / fromRate;
      return to === BASE_CURRENCY ? usdAmount : usdAmount * toRate;
    },
    [rates, selectedCurrency]
  );

  const format = useCallback(
    (amount: number, currencyOverride?: string) => {
      const currency = (currencyOverride || selectedCurrency || BASE_CURRENCY).toUpperCase();
      const value = convert(amount, BASE_CURRENCY, currency);
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    },
    [convert, selectedCurrency]
  );

  const value = useMemo(
    () => ({ selectedCurrency, setSelectedCurrency, rates, convert, format }),
    [selectedCurrency, setSelectedCurrency, rates, convert, format]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("CurrencyContext is missing.");
  return context;
}
