// src/app/(user)/layout.tsx
"use client";

import "../globals.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { CartProvider } from "../../context/CartContext";
import { ReactNode } from "react";

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  return (
    <CartProvider>
      <Navbar />
      <main className="flex-1 relative pt-[var(--nav-h)]">{children}</main>
      <Footer />
    </CartProvider>
  );
}
