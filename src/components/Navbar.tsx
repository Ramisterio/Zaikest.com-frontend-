"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Menu, X, Search, ChevronDown, MapPin, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import CartDrawer from "./CartDrawer";
import { sanitizeSearch } from "../utils/sanitize";
import { apiPath } from "../config/env";

export default function Navbar() {
  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const { user, logout } = useAuth();
  const isLoggedIn = !!user;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openLogin, setOpenLogin] = useState(false);
  const [openRegister, setOpenRegister] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [showCategories, setShowCategories] = useState(true);
  const effectiveCompact = false;
  const headerRef = useRef<HTMLElement | null>(null);


  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(apiPath("/v1/categories"), {
          credentials: "include",
        });
        const json = await res.json();
        const names = (json?.data || []).map((c: { name: string }) => c.name);
        setCategories(names);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    setShowCategories(true);
  }, []);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const updateNavHeight = () => {
      const nextHeight = headerEl.offsetHeight || 0;
      document.documentElement.style.setProperty("--nav-h", `${nextHeight}px`);
    };

    updateNavHeight();
    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(headerEl);
    window.addEventListener("resize", updateNavHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateNavHeight);
    };
  }, []);


  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      router.back();
      setMobileMenuOpen(false);
      return;
    }
    router.push(`/products?search=${encodeURIComponent(query)}`);
    setMobileMenuOpen(false);
  };

  const handleSearchChange = (value: string) => {
    const nextValue = sanitizeSearch(value);
    setSearchTerm(nextValue);

    if (!nextValue && pathname === "/products" && searchParams.get("search")) {
      router.replace("/products");
    }
  };

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#c41d1d] to-[#0f0f0f] text-white"
    >
      <div
        className={`hidden md:block transition-all duration-300 ${
          effectiveCompact ? "max-h-0 opacity-0 overflow-hidden" : "max-h-12 opacity-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-xs font-semibold">
          <span>Delivery in 20-30 min in select areas</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles size={12} />
            Fresh deals every day
          </span>
        </div>
      </div>

      <div className="border-b border-white/10">
        <nav
          className={`max-w-7xl mx-auto px-4 flex items-center gap-2 sm:gap-4 transition-all duration-300 min-w-0 ${
            effectiveCompact ? "py-2" : "py-2.5 sm:py-3"
          }`}
        >
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/images/zaikest-logo1.png"
              alt="Zaikest"
              width={96}
              height={28}
              className="object-contain w-[44px] sm:w-[56px] md:w-[64px] h-auto"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full bg-white/10 border border-white/20 text-[11px] sm:text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            Home
          </Link>

          <button className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20 transition">
            <MapPin size={16} className="text-white" />
            Deliver to <span className="font-semibold">Home</span>
          </button>

          <form onSubmit={handleSearchSubmit} className="flex-1 hidden md:block relative">
            <input
              type="text"
              placeholder="Search for dishes, pastes, spices"
              className="w-full pl-12 pr-4 py-3 rounded-full border border-white/20 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-red-300"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41d1d]"
            />
          </form>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-full px-2.5 sm:px-4 py-2 hover:bg-white/20 transition"
                >
                  <User size={18} />
                  <span className="hidden sm:inline">{user.name}</span>
                  <ChevronDown size={14} className="hidden sm:inline" />
                </button>

                {userMenuOpen && (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-0 sm:static sm:mt-2 sm:flex-none"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <div
                      className="w-full max-w-[320px] sm:w-52 bg-white rounded-2xl shadow-lg border border-[#f1dede] overflow-hidden text-[#1a1a1a]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href="/profile"
                        className="block px-4 py-3 hover:bg-red-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>

                      {user.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          className="block px-4 py-3 hover:bg-red-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-[#c41d1d] hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setOpenLogin(true)}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-full px-2.5 sm:px-3 py-2 hover:bg-white/20 transition"
                aria-label="Open login"
              >
                <User size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-full bg-amber-400 text-green-950 shadow hover:bg-amber-300 transition"
              aria-label="Open cart"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#0f0f0f] text-xs font-bold text-white w-5 h-5 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full border border-white/20 bg-white/10"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </div>

      <div className={`border-b border-white/10 ${effectiveCompact ? "hidden" : ""}`}>
        <div
          className={`max-w-7xl mx-auto px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 overflow-x-auto scroll-smooth transition-transform transition-opacity duration-300 will-change-transform ${
            showCategories ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <Link
            href="/products"
            className="text-xs sm:text-sm font-semibold text-white border border-dashed border-white/50 px-3 sm:px-4 h-9 sm:h-10 rounded-full hover:bg-white/10 transition inline-flex items-center justify-center whitespace-nowrap leading-none"
          >
            View all
          </Link>
          {categories.length === 0 ? (
            <span className="text-xs sm:text-sm text-white/70">Loading categories...</span>
          ) : (
            categories.map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${encodeURIComponent(cat)}`}
                className="text-xs sm:text-sm font-semibold text-white bg-white/10 border border-white/20 px-3 sm:px-4 h-9 sm:h-10 rounded-full hover:bg-white/20 transition inline-flex items-center justify-center whitespace-nowrap leading-none"
              >
                {cat}
              </Link>
            ))
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-white/10 px-4 py-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search for groceries"
              className="w-full pl-11 pr-4 py-3 rounded-full border border-white/20 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-red-300"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41d1d]"
            />
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {categories.length === 0 ? (
              <span className="text-sm text-white/70">Loading categories...</span>
            ) : (
              categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  className="text-center font-semibold text-white bg-white/10 border border-white/20 px-3 h-10 rounded-full inline-flex items-center justify-center leading-none text-xs sm:text-sm min-w-0"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="truncate">{cat}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      <Modal open={openLogin} onClose={() => setOpenLogin(false)}>
        <LoginForm
          onLoginSuccess={({ redirectTo }) => {
            setOpenLogin(false);
            router.replace(redirectTo || "/");
          }}
          onRegisterClick={() => {
            setOpenLogin(false);
            setOpenRegister(true);
          }}
        />
      </Modal>

      <Modal open={openRegister} onClose={() => setOpenRegister(false)}>
        <RegisterForm
          onLoginClick={() => {
            setOpenRegister(false);
            setOpenLogin(true);
          }}
        />
      </Modal>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
