"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { API_BASE } from "../config/env";

/* ---------------- TYPES ---------------- */

type User = {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  permissions: string[];
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

/* ---------------- CONTEXT ---------------- */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH CURRENT USER ---------------- */

  const refreshUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/v1/auth/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();

      if (data?.success && data?.user) {
        const roleValue = data.user.role;
        const normalizedRoleRaw =
          typeof roleValue === "string" ? roleValue : roleValue?.name;
        const normalizedRole =
          normalizedRoleRaw === "admin" ? "admin" : "user";
        const permissions =
          data.user.permissions ||
          roleValue?.permissions ||
          [];
        const normalizedId =
          data.user.id || data.user.userId || data.user._id || "";
        setUser({
          id: normalizedId,
          name: data.user.name,
          email: data.user.email,
          role: normalizedRole,
          permissions,
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
      console.error("Error refreshing user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- INITIAL LOAD ---------------- */

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  /* ---------------- LOGOUT ---------------- */

  const logout = async () => {
    setLoading(true);
    try {
      await fetch(`${API_BASE}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  /* ---------------- CONTEXT VALUE ---------------- */

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    refreshUser,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ---------------- HOOK ---------------- */

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
