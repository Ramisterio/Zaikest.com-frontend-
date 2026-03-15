// src/app/layout.tsx
"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect } from "react";
import Script from "next/script";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { ThemeProvider } from "../context/ThemeContext";
import { CategoriesProvider } from "../context/CategoriesContext";
import { FaWhatsapp } from "react-icons/fa";
import ThemeReadyGate from "../components/ThemeReadyGate";
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

        {/* Meta Pixel Code */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1357503302801249');
              fbq('track', 'PageView');
            `,
          }}
        />

        <AuthProvider>
          <ThemeProvider>
            <ThemeReadyGate>
              <CategoriesProvider>
                <CartProvider>

                  {children}

                  {/* WhatsApp Button */}
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
            </ThemeReadyGate>
          </ThemeProvider>
        </AuthProvider>

        {/* Meta Pixel NoScript */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1357503302801249&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

      </body>
    </html>
  );
}
