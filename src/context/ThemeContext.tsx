"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiPath } from "../config/env";
import { useAuth } from "./AuthContext";

export type ThemeHighlight = { title: string; text: string };
export type ThemeStat = { title: string; text: string };
export type ThemePromoCard = { title: string; text: string; badge: string; enabled?: boolean };

export type Theme = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  content: {
    heroPill: string;
    heroTitle: string;
    heroSubtitle: string;
    heroPrimaryCta: string;
    heroSecondaryCta: string;
    categoryHeading: string;
    categoryViewAll: string;
    featuredHeading: string;
    featuredCategoriesLabel: string;
    featuredProductsLabel: string;
    announcement: string;
    buttonText: string;
    footerText: string;
    footerBlurb: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    newsletterButton: string;
    footerCopyright: string;
  };
  heroStats: ThemeStat[];
  highlights: ThemeHighlight[];
  promoCards: ThemePromoCard[];
  company: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
};

export type ThemePatch = Partial<Omit<Theme, "colors" | "content" | "company">> & {
  colors?: Partial<Theme["colors"]>;
  content?: Partial<Theme["content"]>;
  company?: Partial<Theme["company"]>;
};

const defaultTheme: Theme = {
  colors: {
    primary: "#1a1a1a",
    secondary: "#f5f5f5",
    background: "#ffffff",
    text: "#111111",
    accent: "#ff6b35",
  },
  content: {
    heroPill: "Zaikest fresh pantry",
    heroTitle: "Homemade flavors and pantry essentials delivered fast.",
    heroSubtitle:
      "Shop daily kitchen favorites, made with care and brought to your door in minutes.",
    heroPrimaryCta: "Start shopping",
    heroSecondaryCta: "Explore deals",
    categoryHeading: "Shop by category",
    categoryViewAll: "View all",
    featuredHeading: "Fresh picks for you",
    featuredCategoriesLabel: "Categories",
    featuredProductsLabel: "Products",
    announcement: "",
    buttonText: "Shop now",
    footerText: "",
    footerBlurb:
      "Zaikest delivers homemade dishes, fresh pastes, and pantry essentials right to your door.",
    newsletterTitle: "Subscribe to our Newsletter",
    newsletterSubtitle: "New arrivals, seasonal picks, and exclusive bundles.",
    newsletterButton: "Subscribe",
    footerCopyright:
      "Copyright {year} Zaikest. All rights reserved. Developed by Naeem Rehman.",
  },
  heroStats: [
    { title: "20-30 min", text: "Avg delivery" },
    { title: "Quality checked", text: "Every order" },
    { title: "Freshness", text: "Guaranteed" },
  ],
  highlights: [
    {
      title: "Homemade flavors",
      text: "Authentic dishes and pastes prepared with real ingredients.",
    },
    {
      title: "Smart savings",
      text: "Daily deals and bundles tailored to your kitchen.",
    },
    {
      title: "Fast support",
      text: "Friendly help whenever you need it, before or after delivery.",
    },
    {
      title: "Fresh ingredients",
      text: "Handpicked pantry goods with verified freshness.",
    },
    {
      title: "Same-day delivery",
      text: "Quick dispatch so staples reach you in time.",
    },
    {
      title: "Quality checked",
      text: "Every order reviewed for taste and standards.",
    },
  ],
  promoCards: [
    {
      badge: "Limited",
      title: "Weekend Feast Packs",
      text: "Curated bundles with extra savings on family favorites.",
      enabled: true,
    },
    {
      badge: "Fast",
      title: "Express Delivery",
      text: "Get hot dishes to your door in 20-30 minutes.",
      enabled: true,
    },
    {
      badge: "New",
      title: "Chef Specials",
      text: "New seasonal recipes, crafted fresh every day.",
      enabled: true,
    },
    {
      badge: "Assured",
      title: "Quality Checked",
      text: "Every order is packed with care and verified.",
      enabled: true,
    },
  ],
  company: {
    name: "",
    phone: "",
    email: "",
    address: "",
  },
};

type ThemeContextType = {
  theme: Theme;
  loading: boolean;
  editMode: boolean;
  canManageTheme: boolean;
  setEditMode: (next: boolean) => void;
  refreshTheme: () => Promise<void>;
  updateTheme: (patch: ThemePatch) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const mergeTheme = (prev: Theme, patch: ThemePatch): Theme => ({
  ...prev,
  ...patch,
  colors: { ...prev.colors, ...patch.colors },
  content: { ...prev.content, ...patch.content },
  company: { ...prev.company, ...patch.company },
  heroStats: patch.heroStats ?? prev.heroStats,
  highlights: patch.highlights ?? prev.highlights,
  promoCards: patch.promoCards ?? prev.promoCards,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const canManageTheme = useMemo(
    () => user?.role === "admin" && (user.permissions || []).includes("MANAGE_THEME"),
    [user]
  );

  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const refreshTheme = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath("/v1/theme"), { credentials: "include" });
      const json = await res.json();
      if (res.ok && json?.theme) {
        setTheme(mergeTheme(defaultTheme, json.theme));
      }
    } catch {
      // keep defaults on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTheme();
  }, [refreshTheme]);

  useEffect(() => {
    if (!canManageTheme && editMode) {
      setEditMode(false);
    }
  }, [canManageTheme, editMode]);

  const updateTheme = useCallback(
    async (patch: ThemePatch) => {
      setTheme((prev) => mergeTheme(prev, patch));
      if (!canManageTheme) return;
      try {
        const res = await fetch(apiPath("/v1/admin/theme"), {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (res.ok && json?.theme) {
          setTheme(mergeTheme(defaultTheme, json.theme));
        } else {
          await refreshTheme();
        }
      } catch {
        await refreshTheme();
      }
    },
    [canManageTheme, refreshTheme]
  );

  const value: ThemeContextType = {
    theme,
    loading,
    editMode,
    canManageTheme,
    setEditMode,
    refreshTheme,
    updateTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};
