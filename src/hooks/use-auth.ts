// ============================================================
// Auth Hook — Zustand-based auth state management
// ============================================================
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isUsingMockData, getMockCreatorById } from "@/lib/mock-data";
import type { Creator } from "@/types";

interface AuthState {
  user: Creator | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string, displayName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Creator>) => void;
  checkSession: () => Promise<void>;
  setHasHydrated: (state: boolean) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true, // Start as true to prevent flash redirect before hydration
      _hasHydrated: false,

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          let data;
          try {
            data = await response.json();
          } catch {
            set({ isLoading: false });
            return {
              success: false,
              error: `Server error: ${response.status} ${response.statusText}`,
            };
          }

          if (data.success && data.data) {
            set({ user: data.data, isAuthenticated: true, isLoading: false });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: data.error || "Login failed" };
        } catch (error) {
          set({ isLoading: false });
          const message =
            error instanceof Error ? error.message : "Network error. Please try again.";
          return { success: false, error: message };
        }
      },

      signup: async (email: string, password: string, username: string, displayName: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, username, displayName }),
          });

          let data;
          try {
            data = await response.json();
          } catch {
            set({ isLoading: false });
            return {
              success: false,
              error: `Server error: ${response.status} ${response.statusText}`,
            };
          }

          if (data.success && data.data) {
            set({ user: data.data, isAuthenticated: true, isLoading: false });
            return { success: true };
          }

          set({ isLoading: false });
          return { success: false, error: data.error || "Signup failed" };
        } catch (error) {
          set({ isLoading: false });
          const message =
            error instanceof Error ? error.message : "Network error. Please try again.";
          return { success: false, error: message };
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // Ignore errors
        }
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates: Partial<Creator>) => {
        const current = get().user;
        if (current) {
          set({ user: { ...current, ...updates } });
        }
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const response = await fetch("/api/auth/login", {
            method: "GET",
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              set({ user: data.data, isAuthenticated: true, isLoading: false });
              return;
            }
          }

          // If in mock mode, try to restore from persisted state
          if (isUsingMockData()) {
            const current = get();
            if (current.user && current.isAuthenticated) {
              set({ isLoading: false });
              return;
            }
          }

          set({ user: null, isAuthenticated: false, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: "keevan-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // After rehydration, if we have persisted auth state, mark loading as false
        // If not, check session to determine auth status
        if (state?.user && state?.isAuthenticated) {
          state.isLoading = false;
        }
        // If no persisted auth, checkSession will be called by the layout
      },
    }
  )
);
