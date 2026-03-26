"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Menu, X, Search, ChevronDown, MapPin, Sparkles, User, Tag } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCategories } from "../context/CategoriesContext";
import CartDrawer from "./CartDrawer";
import { sanitizeSearch } from "../utils/sanitize";
import { sanitizeInternalRedirect } from "../utils/urlRoute";
import EditableText from "./theme/EditableText";
import { resolveAssetUrl } from "../utils/assetUrl";
import ThemeMediaUploadButton from "./theme/ThemeMediaUploadButton";

export default function Navbar() {
  const { cart } = useCart();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const { user, logout } = useAuth();
  const isLoggedIn = !!user;
  const { theme, editMode, setEditMode, canManageTheme, updateTheme } = useTheme();

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
  const [announcementOpen, setAnnouncementOpen] = useState(false);


  const { categories } = useCategories();
  const categoryNames = categories.map((c) => c.name);

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

  const announcementText = theme?.content?.announcement?.trim() || "";
  const canEditAnnouncement = editMode && canManageTheme;
  const announcementEnabled = theme?.content?.announcementEnabled ?? true;
  const shouldRenderAnnouncement =
    (announcementEnabled && announcementText.length > 0) || canEditAnnouncement;
  const announcementDismissKey = "zaikest:announcement-dismissed:session";

  useEffect(() => {
    if (!shouldRenderAnnouncement) {
      setAnnouncementOpen(false);
      return;
    }
    if (typeof window === "undefined") return;
    try {
      const dismissed = window.sessionStorage.getItem(announcementDismissKey);
      setAnnouncementOpen(dismissed !== "true");
    } catch {
      setAnnouncementOpen(true);
    }
  }, [announcementText, shouldRenderAnnouncement, canEditAnnouncement]);

  const dismissAnnouncement = () => {
    setAnnouncementOpen(false);
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(announcementDismissKey, "true");
    } catch {
      // Ignore storage errors.
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBeforeUnload = () => {
      try {
        window.sessionStorage.removeItem(announcementDismissKey);
      } catch {
        // Ignore storage errors.
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const bannerContent = (
    <div className="announcement-shell announcement-wide announcement-corners announcement-motion text-[#2a1900]">
      <div className="announcement-inner announcement-inner-wide">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 text-[11px] sm:text-xs font-semibold">
          <span className="announcement-ribbon announcement-badge-pulse w-full sm:w-auto justify-center">
            <Tag size={12} />
            Eid offer
          </span>
          <span className="hidden sm:inline-flex items-center gap-2">
            <span className="announcement-accent" aria-hidden="true" />
            <span className="announcement-divider-wide" aria-hidden="true" />
          </span>
          <EditableText
            value={theme?.content?.announcement || ""}
            fallback="Seasonal deals and delivery updates appear here."
            editMode={canEditAnnouncement}
            onSave={(next) => updateTheme({ content: { announcement: next } })}
            className="flex-1 min-w-0 leading-snug break-words text-center sm:text-left"
          />
          <span className="announcement-cta hidden sm:inline-flex">
            <span className="announcement-cta-dot" aria-hidden="true" />
            Limited time
          </span>
          <button
            type="button"
            onClick={dismissAnnouncement}
            aria-label="Dismiss announcement"
            className="inline-flex items-center justify-center rounded-full p-1.5 bg-black text-white hover:bg-black/80 transition self-center sm:self-auto"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#c41d1d] to-[#0f0f0f] text-white"
    >
      {shouldRenderAnnouncement && (
        <div
          className={`transition-all duration-300 ${
            announcementOpen
              ? "max-h-[140px] sm:max-h-[120px] opacity-100 overflow-visible"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="hidden sm:block">
            <div className="w-full">{bannerContent}</div>
          </div>
        </div>
      )}

      <div
        className={`block transition-all duration-300 ${
          effectiveCompact ? "max-h-0 opacity-0 overflow-hidden" : "max-h-24 sm:max-h-16 opacity-100"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold">
          <EditableText
            value={theme?.content?.navbarDeliveryText || ""}
            fallback=""
            editMode={editMode && canManageTheme}
            onSave={(next) => updateTheme({ content: { navbarDeliveryText: next } })}
            className="inline-block leading-tight break-words max-w-full flex-1 text-left pr-2"
          />
          <span className="inline-flex items-center justify-end gap-1 leading-tight flex-1 text-right min-w-0">
            <Sparkles size={12} />
            <EditableText
              value={theme?.content?.navbarDealsText || ""}
              fallback=""
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { navbarDealsText: next } })}
              className="inline-block break-words"
            />
          </span>
        </div>
      </div>

      <div className="border-b border-white/10">
        <nav
          className={`max-w-7xl mx-auto px-4 flex flex-wrap md:flex-nowrap items-center gap-1.5 sm:gap-3 transition-all duration-300 min-w-0 ${
            effectiveCompact ? "py-2" : "py-2.5 sm:py-3"
          }`}
        >
          <div className="relative flex items-center shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src={resolveAssetUrl(theme.content.navbarLogoUrl, "/images/zaikest-logo1.png")}
                alt="Zaikest"
                width={96}
                height={28}
                className="object-contain w-[44px] sm:w-[56px] md:w-[64px] h-auto"
              />
            </Link>
            {editMode && canManageTheme && (
              <ThemeMediaUploadButton
                label="Upload Logo"
                fieldKey="navbarLogoUrl"
                className="ml-2"
              />
            )}
          </div>
          {shouldRenderAnnouncement && announcementOpen && (
            <div className="w-full sm:hidden">
              <div>{bannerContent}</div>
            </div>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full bg-white/10 border border-white/20 text-[10px] sm:text-sm font-semibold text-white hover:bg-white/20 transition"
          >
            {theme.content.navbarHomeText || "Home"}
          </Link>

          <button className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20 text-sm text-white hover:bg-white/20 transition">
            <MapPin size={16} className="text-white" />
            {theme.content.navbarDeliverToText || "Deliver to"}{" "}
            <span className="font-semibold">
              {theme.content.navbarDeliverToLocation || "Home"}
            </span>
          </button>

          <form onSubmit={handleSearchSubmit} className="flex-1 hidden md:block relative">
            <input
              type="text"
              placeholder={theme.content.navbarSearchPlaceholder || "Search for dishes, pastes, spices"}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-white/20 bg-white text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-red-300"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c41d1d]"
            />
          </form>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
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
                  <>
                    <button
                      aria-label="Close user menu"
                      onClick={() => setUserMenuOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[calc(100vw-2rem)] max-w-[320px] sm:left-auto sm:translate-x-0 sm:right-0 sm:w-56">
                      <div
                        className="bg-white rounded-2xl shadow-lg border border-[#f1dede] overflow-hidden text-[#1a1a1a]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href="/profile"
                          className="block px-4 py-3 hover:bg-red-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          {theme.content.navbarProfileText || "Profile"}
                        </Link>

                        {user.role === "admin" && (
                          <Link
                            href="/admin/dashboard"
                            className="block px-4 py-3 hover:bg-red-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {theme.content.navbarAdminDashboardText || "Admin Dashboard"}
                          </Link>
                        )}

                        {canManageTheme && (
                          <Link
                            href="/admin/theme"
                            className="block px-4 py-3 hover:bg-red-50"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            {theme.content.navbarEditThemeText || "Edit Theme"}
                          </Link>
                        )}

                        {canManageTheme && (
                          <button
                            onClick={() => {
                              setEditMode(!editMode);
                              setUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-red-50"
                          >
                            {theme.content.navbarLiveEditText || "Live Edit"}:{" "}
                            {editMode
                              ? theme.content.navbarLiveEditOnText || "On"
                              : theme.content.navbarLiveEditOffText || "Off"}
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-[#c41d1d] hover:bg-red-50"
                        >
                          {theme.content.navbarLogoutText || "Logout"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setOpenLogin(true)}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white bg-white/10 border border-white/20 rounded-full px-2.5 sm:px-3 py-2 hover:bg-white/20 transition"
                aria-label="Open login"
              >
                <User size={18} />
                <span className="hidden sm:inline">{theme.content.navbarLoginText || "Login"}</span>
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 px-2.5 sm:px-4 py-2 rounded-full bg-amber-400 text-green-950 shadow hover:bg-amber-300 transition"
              aria-label="Open cart"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">{theme.content.navbarCartText || "Cart"}</span>
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
            {theme.content.navbarViewAllText || "View all"}
          </Link>
          {categoryNames.length === 0 ? (
            <span className="text-xs sm:text-sm text-white/70">
              {theme.content.navbarLoadingCategoriesText || "Loading categories..."}
            </span>
          ) : (
            categoryNames.map((cat) => (
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
              placeholder={theme.content.navbarMobileSearchPlaceholder || "Search for groceries"}
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
            {categoryNames.length === 0 ? (
              <span className="text-sm text-white/70">
                {theme.content.navbarLoadingCategoriesText || "Loading categories..."}
              </span>
            ) : (
              categoryNames.map((cat) => (
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
            router.replace(sanitizeInternalRedirect(redirectTo));
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
