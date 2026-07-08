"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type UIState = {
  incomeOpen: boolean;
  /** id of the income being edited; null when creating a new one */
  editingIncomeId: number | null;
  /** open the income form — pass an id to edit, omit to create. Safe to use directly as an onClick handler. */
  openIncome: (id?: number) => void;
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
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  return (
    <UIContext.Provider
      value={{
        incomeOpen,
        editingIncomeId,
        openIncome: (id) => {
          // guard: onClick handlers pass a MouseEvent as the first arg — treat only real numbers as an edit id
          setEditingIncomeId(typeof id === "number" ? id : null);
          setIncomeOpen(true);
        },
        closeIncome: () => {
          setIncomeOpen(false);
          setEditingIncomeId(null);
        },
      }}
    >
      {children}
    </UIContext.Provider>
  );
}
