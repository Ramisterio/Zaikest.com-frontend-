"use client";

import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaEnvelope, FaWhatsapp, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaTiktok, FaHeadset } from "react-icons/fa6";
import { useState } from "react";
import { motion } from "framer-motion";
import { sanitizeEmail } from "../utils/sanitize";
import { useTheme } from "../context/ThemeContext";
import EditableText from "./theme/EditableText";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { theme, editMode, canManageTheme, updateTheme } = useTheme();
  const footerCopyrightFallback =
    "Copyright {year} Zaikest. All rights reserved. Developed by Naeem Rehman.";
  const footerCopyrightTemplate = theme.content.footerCopyright || footerCopyrightFallback;
  const footerCopyrightText = footerCopyrightTemplate.replace(
    /\{year\}/g,
    String(new Date().getFullYear())
  );

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Subscribed with ${email}`);
    setEmail("");
  };

  return (
    <footer className="mt-16 bg-gradient-to-b from-[#9b1414] via-[#0f0f0f] to-[#070707] text-white">
      {/* TOP SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 items-start">
        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32"
          >
            <Link href="/">
              <Image
                src="/images/zaikest-logo1.png"
                alt="Zaikest Logo"
                fill
                priority
                className="object-contain cursor-pointer"
              />
            </Link>
          </motion.div>
          <p className="text-sm text-green-100 max-w-xs">
            <EditableText
              value={theme.content.footerBlurb}
              fallback="Zaikest delivers homemade dishes, fresh pastes, and pantry essentials right to your door."
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerBlurb: next } })}
              multiline
            />
          </p>
        </div>

        <div className="text-sm text-green-100 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-white">
            <EditableText
              value={theme.content.footerQuickLinksTitle}
              fallback="Quick links"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerQuickLinksTitle: next } })}
            />
          </div>
          <div className="grid gap-2">
            <Link href="/products" className="hover:text-white transition-colors">
              <EditableText
                value={theme.content.footerQuickLinkShopAll}
                fallback="Shop all"
                editMode={editMode && canManageTheme}
                onSave={(next) => updateTheme({ content: { footerQuickLinkShopAll: next } })}
              />
            </Link>
            <Link href="/products?category=Dishes" className="hover:text-white transition-colors">
              <EditableText
                value={theme.content.footerQuickLinkDishes}
                fallback="Dishes"
                editMode={editMode && canManageTheme}
                onSave={(next) => updateTheme({ content: { footerQuickLinkDishes: next } })}
              />
            </Link>
            <Link href="/products?category=Pastes" className="hover:text-white transition-colors">
              <EditableText
                value={theme.content.footerQuickLinkPastes}
                fallback="Pastes"
                editMode={editMode && canManageTheme}
                onSave={(next) => updateTheme({ content: { footerQuickLinkPastes: next } })}
              />
            </Link>
            <Link href="/products?category=Spices" className="hover:text-white transition-colors">
              <EditableText
                value={theme.content.footerQuickLinkSpices}
                fallback="Spices"
                editMode={editMode && canManageTheme}
                onSave={(next) => updateTheme({ content: { footerQuickLinkSpices: next } })}
              />
            </Link>
          </div>
        </div>

        <div className="text-sm text-green-100 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-white">
            <EditableText
              value={theme.content.footerContactTitle}
              fallback="Contact"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerContactTitle: next } })}
            />
          </div>
          <div>
            <EditableText
              value={theme.content.footerEmailLabel}
              fallback="Email"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerEmailLabel: next } })}
              className="inline"
            />
            {": "}
            <EditableText
              value={theme.company.email}
              fallback="Zaikest.food@gmail.com"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ company: { email: next } })}
              className="inline"
            />
          </div>
          <div>
            <EditableText
              value={theme.content.footerPhoneLabel}
              fallback="Phone"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerPhoneLabel: next } })}
              className="inline"
            />
            {": "}
            <EditableText
              value={theme.company.phone}
              fallback="+92 302 0284408"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ company: { phone: next } })}
              className="inline"
            />
          </div>
          <div>
            <EditableText
              value={theme.content.footerHeadOfficeLabel}
              fallback="Head Office"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerHeadOfficeLabel: next } })}
              className="inline"
            />
            {": "}
            <EditableText
              value={theme.company.address}
              fallback="Karachi, Pakistan"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ company: { address: next } })}
              className="inline"
            />
          </div>
          <div className="inline-flex items-center gap-2 text-white">
            <FaHeadset />
            <EditableText
              value={theme.content.footerSupportLabel}
              fallback="Customer Support"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerSupportLabel: next } })}
              className="inline"
            />
            {": "}
            <EditableText
              value={theme.content.footerText}
              fallback="24/7"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerText: next } })}
              className="inline"
            />
          </div>
        </div>

        <div className="lg:justify-self-end">
          <div className="text-xs font-semibold uppercase tracking-wider text-white mb-4 text-left lg:text-right">
            <EditableText
              value={theme.content.footerFollowUsTitle}
              fallback="Follow us"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { footerFollowUsTitle: next } })}
            />
          </div>
          <div className="flex lg:justify-end gap-3">
            <a
              href="https://facebook.com/zaikest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-lg transition-transform hover:scale-110 text-white"
            >
              <FaFacebookF />
            </a>
            <a
              href="https://instagram.com/zaikest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-lg transition-transform hover:scale-110 text-white"
            >
              <FaInstagram />
            </a>
            <a
              href="https://tiktok.com/@zaikest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-lg transition-transform hover:scale-110 text-white"
            >
              <FaTiktok />
            </a>
            <a
              href="https://youtube.com/@zaikest"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-lg transition-transform hover:scale-110 text-white"
            >
              <FaYoutube />
            </a>
            <a
              href="mailto:Zaikest.food@gmail.com"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-lg transition-transform hover:scale-110 text-white"
            >
              <FaEnvelope />
            </a>
            <a
              href="https://wa.me/923020284408"
              target="_blank"
              rel="noopener noreferrer"
              className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-lg transition-transform hover:scale-110 text-white"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      {/* NEWSLETTER */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="bg-white/10 border border-white/10 rounded-3xl p-6 text-center">
          <EditableText
            as="h2"
            className="text-lg md:text-xl font-semibold mb-3"
            value={theme.content.newsletterTitle}
            fallback="Subscribe to our Newsletter"
            editMode={editMode && canManageTheme}
            onSave={(next) => updateTheme({ content: { newsletterTitle: next } })}
          />
          <EditableText
            as="p"
            className="text-green-100 mb-5"
            value={theme.content.newsletterSubtitle}
            fallback="New arrivals, seasonal picks, and exclusive bundles."
            editMode={editMode && canManageTheme}
            onSave={(next) => updateTheme({ content: { newsletterSubtitle: next } })}
            multiline
          />

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 items-center"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full flex-1 p-3 rounded-full text-gray-900 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
              required
            />
            {editMode && canManageTheme ? (
              <span className="px-7 py-3 bg-[#f3b451] text-gray-900 font-semibold rounded-full">
                <EditableText
                  value={theme.content.newsletterButton}
                  fallback="Subscribe"
                  editMode={true}
                  onSave={(next) => updateTheme({ content: { newsletterButton: next } })}
                />
              </span>
            ) : (
              <button
                type="submit"
                className="px-7 py-3 bg-[#f3b451] text-gray-900 font-semibold rounded-full hover:bg-[#f2a93d] transition-all"
              >
                {theme.content.newsletterButton || "Subscribe"}
              </button>
            )}
          </form>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/10 py-5 text-center text-green-100 text-sm">
        {editMode && canManageTheme ? (
          <EditableText
            value={theme.content.footerCopyright}
            fallback={footerCopyrightFallback}
            editMode={true}
            onSave={(next) => updateTheme({ content: { footerCopyright: next } })}
          />
        ) : (
          <span>{footerCopyrightText}</span>
        )}
      </div>
    </footer>
  );
}

