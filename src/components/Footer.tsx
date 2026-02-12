"use client";

import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaEnvelope, FaWhatsapp, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaTiktok, FaHeadset } from "react-icons/fa6";
import { useState } from "react";
import { motion } from "framer-motion";
import { sanitizeEmail } from "../utils/sanitize";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Subscribed with ${email}`);
    setEmail("");
  };

  return (
    <footer className="mt-16 bg-gradient-to-b from-[#9b1414] via-[#0f0f0f] to-[#070707] text-white">
      {/* TOP SECTION */}
      <div className="max-w-7xl mx-auto px-4 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 items-start">
        <div className="space-y-4">
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-32 h-32"
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
            Zaikest delivers homemade dishes, fresh pastes, and pantry essentials right to your door.
          </p>
        </div>

        <div className="text-sm text-green-100 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-white">Quick links</div>
          <div className="grid gap-2">
            <Link href="/products" className="hover:text-white transition-colors">Shop all</Link>
            <Link href="/products?category=Dishes" className="hover:text-white transition-colors">Dishes</Link>
            <Link href="/products?category=Pastes" className="hover:text-white transition-colors">Pastes</Link>
            <Link href="/products?category=Spices" className="hover:text-white transition-colors">Spices</Link>
          </div>
        </div>

        <div className="text-sm text-green-100 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-white">Contact</div>
          <div>Email: Zaikest.food@gmail.com</div>
          <div>Phone: +92 302 0284408</div>
          <div>Head Office: Karachi, Pakistan</div>
          <div className="inline-flex items-center gap-2 text-white">
            <FaHeadset />
            Customer Support: 24/7
          </div>
        </div>

        <div className="lg:justify-self-end">
          <div className="text-xs font-semibold uppercase tracking-wider text-white mb-4 text-left lg:text-right">Follow us</div>
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
          <h2 className="text-lg md:text-xl font-semibold mb-3">Subscribe to our Newsletter</h2>
          <p className="text-green-100 mb-5">New arrivals, seasonal picks, and exclusive bundles.</p>

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
            <button
              type="submit"
              className="px-7 py-3 bg-[#f3b451] text-gray-900 font-semibold rounded-full hover:bg-[#f2a93d] transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/10 py-5 text-center text-green-100 text-sm">
        Copyright {new Date().getFullYear()} Zaikest. All rights reserved. Developed by Naeem Rehman.
      </div>
    </footer>
  );
}

