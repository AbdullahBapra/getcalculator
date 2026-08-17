"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextValue>({ currency: "USD", setCurrency: () => {} });

const STORAGE_KEY = "gc:currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState("USD");

  useEffect(() => {
    // Client-only sync from localStorage, deferred to after mount so server and client
    // markup match (same pattern as the theme script and CalculatorShell's history load).
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrencyState(stored);
      }
    } catch {
      // private browsing / corrupted storage — default currency still works
    }
  }, []);

  function setCurrency(code: string) {
    setCurrencyState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // ignore — selection just won't persist
    }
  }

  return <CurrencyContext.Provider value={{ currency, setCurrency }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
