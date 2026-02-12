// src/app/(user)/layout.tsx
"use client";

import "../globals.css";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { CartProvider } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface UserLayoutProps {
  children: ReactNode;
}

export default function UserLayout({ children }: UserLayoutProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect admins away from user pages
    if (!loading && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [loading, user, router]);

  return (
    <CartProvider>
      <Navbar />
      <main className="flex-1 relative">{children}</main>
      <Footer />
    </CartProvider>
  );
}
