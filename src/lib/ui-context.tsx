"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type UIState = {
  incomeOpen: boolean;
  openIncome: () => void;
  closeIncome: () => void;
};

const UIContext = createContext<UIState | null>(null);

export function useUI(): UIState {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within <UIProvider>");
  return ctx;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [incomeOpen, setIncomeOpen] = useState(false);
  return (
    <UIContext.Provider
      value={{
        incomeOpen,
        openIncome: () => setIncomeOpen(true),
        closeIncome: () => setIncomeOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
