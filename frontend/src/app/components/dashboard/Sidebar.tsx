"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  ScanLine,
  ShieldPlus,
  User,
  X,
} from "lucide-react";
import Logo from "@/app/components/ui/Logo";
import Button from "@/app/components/ui/Button";
import { useAuth } from "@/app/components/auth/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Medication check", icon: LayoutDashboard },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/report", label: "Clinical reports", icon: ClipboardList },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = false, onClose, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border-app bg-white transition-all duration-300 md:static md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} w-[290px] ${isCollapsed ? "md:w-[72px]" : "md:w-[290px]"}`}
      >
        {/* Header */}
        <div className="flex h-24 items-center justify-between border-b border-border-app px-4">
          {/* Logo: always full on mobile, icon-only when collapsed on desktop */}
          <div className="md:hidden">
            <Logo href="/dashboard" showTagline={false} />
          </div>
          <div className="hidden md:block">
            {isCollapsed ? (
              <ShieldPlus className="h-7 w-7 text-primary-blue" />
            ) : (
              <Logo href="/dashboard" showTagline={false} />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Mobile close */}
            <button
              onClick={onClose}
              className="rounded-2xl border border-border-app p-2 text-text-muted md:hidden"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={onToggle}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-xl border border-border-app text-text-muted hover:bg-surface-app hover:text-text-primary transition"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`mt-6 flex-1 space-y-1 ${isCollapsed ? "px-3" : "px-4"}`}>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-2xl py-3 text-sm font-bold transition ${isCollapsed ? "justify-center px-3" : "px-4"} ${active ? "bg-primary-blue text-white shadow-soft" : "text-text-secondary hover:bg-surface-app hover:text-text-primary"}`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border-app p-4">
          {/* User info */}
          {!isCollapsed ? (
            <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border-app bg-surface-app px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-blue text-sm font-black text-white">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-text-primary">{user?.name ?? "User"}</p>
                <p className="truncate text-xs font-medium text-text-muted">{user?.email ?? ""}</p>
              </div>
            </div>
          ) : (
            <div className="mb-3 flex justify-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-blue text-sm font-black text-white">
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </div>
          )}

          {!isCollapsed && (
            <div className="mb-3 rounded-[24px] bg-surface-app p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-primary-blue">
                <ScanLine className="h-4 w-4" />
                Scan-ready workspace
              </div>
              <p className="mt-2 text-xs font-medium leading-5 text-text-secondary">
                Camera and OCR flows are prepared for medication labels. Barcode scan is coming soon.
              </p>
            </div>
          )}
          <button
            onClick={() => setLogoutOpen(true)}
            title={isCollapsed ? "Sign out" : undefined}
            className={`flex w-full items-center gap-3 rounded-2xl py-3 text-sm font-bold text-text-secondary transition hover:bg-danger-red/10 hover:text-danger-red ${isCollapsed ? "justify-center px-3" : "px-4"}`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!isCollapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {logoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[34px] border border-border-app bg-white p-7 shadow-premium">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-danger-red/10 mx-auto">
              <LogOut className="h-6 w-6 text-danger-red" />
            </div>
            <h3 className="mt-5 text-center text-xl font-black text-text-primary">Sign out?</h3>
            <p className="mt-2 text-center text-sm font-medium text-text-secondary">
              You will be returned to the login page. Your history and reports are saved to your account.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                variant="danger"
                onClick={() => { setLogoutOpen(false); logout(); }}
                className="w-full py-3"
              >
                Yes, sign out
              </Button>
              <Button
                variant="secondary"
                onClick={() => setLogoutOpen(false)}
                className="w-full py-3"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
