"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getAuthHeaders() {
  return { "Content-Type": "application/json" };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.auth.profile();
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    api.auth
      .profile()
      .then((response) => {
        if (isActive) setUser(response.data);
      })
      .catch(() => {
        if (isActive) setUser(null);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email"];
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
    const isDashboardRoute = pathname.startsWith("/dashboard");

    if (user && isAuthRoute) {
      router.replace("/dashboard");
    }

    if (!user && isDashboardRoute) {
      router.replace("/login");
    }
  }, [isLoading, pathname, router, user]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    setUser(response.data.user);
    toast.success("Welcome back. Your safety workspace is ready.");
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const response = await api.auth.register({ name, email, password });
    setUser(response.data.user);
    toast.success("Account created. Let's keep your medications safer.");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      toast.success("Signed out successfully.");
      router.push("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, register, user],
  );

  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isLoading && isDashboardRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-app">
        <div className="rounded-[28px] border border-border-app bg-white p-8 text-center shadow-premium">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-blue/20 border-t-primary-blue" />
          <p className="mt-4 text-sm font-semibold text-text-secondary">Verifying your secure session...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
