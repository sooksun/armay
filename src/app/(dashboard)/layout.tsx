"use client";

import { UIProvider } from "@/lib/ui-context";
import { Sidebar } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { BottomNav } from "@/components/shell/BottomNav";
import { AddIncomeModal } from "@/components/AddIncomeModal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <UIProvider>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          color: "var(--text)",
          position: "relative",
          overflow: "hidden",
          background: "var(--bg)",
        }}
      >
        <Sidebar />

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <Topbar />
          <main data-shell-main style={{ flex: 1, overflowY: "auto", padding: "24px 26px 40px" }}>
            {children}
          </main>
        </div>

        <BottomNav />
        <AddIncomeModal />
      </div>
    </UIProvider>
  );
}
