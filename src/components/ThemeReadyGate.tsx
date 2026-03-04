"use client";

import { ReactNode } from "react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeReadyGate({ children }: { children: ReactNode }) {
  const { loading } = useTheme();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return <>{children}</>;
}
