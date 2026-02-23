"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiPath } from "../config/env";

type Category = { _id: string; name: string };

type CategoriesContextType = {
  categories: Category[];
  loading: boolean;
  refresh: () => Promise<void>;
};

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined);

export const CategoriesProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath("/v1/categories"), { credentials: "include" });
      const json = await res.json();
      setCategories(json?.data || []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      categories,
      loading,
      refresh,
    }),
    [categories, loading]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
};

export const useCategories = () => {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return ctx;
};
