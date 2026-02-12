// src/app/layout.tsx
"use client";

import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { FaWhatsapp } from "react-icons/fa";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
            <a
              href="https://wa.me/923020284408"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition"
            >
              <FaWhatsapp className="h-7 w-7" />
            </a>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
