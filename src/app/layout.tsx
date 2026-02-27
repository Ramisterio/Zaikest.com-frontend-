// src/app/layout.tsx
"use client";

import { useEffect } from "react";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";
import { CategoriesProvider } from "../context/CategoriesContext";
import { FaWhatsapp } from "react-icons/fa";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const blockedTypes = new Set([
      "button",
      "submit",
      "reset",
      "checkbox",
      "radio",
      "file",
      "range",
      "color",
      "date",
      "datetime-local",
      "month",
      "time",
      "week",
    ]);

    const handleTabAsSpace = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.defaultPrevented) return;

      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      if (target instanceof HTMLInputElement && blockedTypes.has(target.type)) return;
      if (target.disabled || target.readOnly) return;

      event.preventDefault();
      const value = target.value;
      const start = target.selectionStart ?? value.length;
      const end = target.selectionEnd ?? value.length;
      const nextValue = `${value.slice(0, start)} ${value.slice(end)}`;
      target.value = nextValue;
      target.selectionStart = start + 1;
      target.selectionEnd = start + 1;
      target.dispatchEvent(new Event("input", { bubbles: true }));
    };

    document.addEventListener("keydown", handleTabAsSpace);
    return () => document.removeEventListener("keydown", handleTabAsSpace);
  }, []);

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <CategoriesProvider>
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
            </CategoriesProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
