"use client";

import { useState } from "react";
import Sidebar from "@/app/components/dashboard/Sidebar";
import Logo from "@/app/components/ui/Logo";
import { Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-app">
      <Sidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-app bg-white px-5 md:hidden">
          <Logo href="/dashboard" showTagline={false} />
          <button
            onClick={() => setIsMobileOpen(true)}
            className="rounded-2xl border border-border-app p-2 text-text-secondary hover:bg-surface-app"
            aria-label="Open Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-5 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
