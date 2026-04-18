"use client";

import { createContext, useContext } from "react";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

const CurrencyContext = createContext("INR");

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/** Hook: returns a formatter function bound to the current currency */
export function useFmt() {
  const currency = useContext(CurrencyContext);
  return (amount: number, opts?: { maximumFractionDigits?: number; compact?: boolean }) =>
    formatCurrency(amount, currency, opts);
}

export function useCurrencySymbol() {
  const currency = useContext(CurrencyContext);
  return getCurrencySymbol(currency);
}
