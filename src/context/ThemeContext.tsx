"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { apiPath } from "../config/env";
import { useAuth } from "./AuthContext";

export type ThemeHighlight = { title: string; text: string };
export type ThemeStat = { title: string; text: string };
export type ThemePromoCard = { title: string; text: string; badge: string; enabled?: boolean };

export type Theme = {
  themeSchemaVersion?: number;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  content: {
    heroPill: string;
    heroTitle: string;
    heroSubtitle: string;
    heroPrimaryCta: string;
    heroSecondaryCta: string;
    categoryHeading: string;
    categoryViewAll: string;
    featuredHeading: string;
    featuredCategoriesLabel: string;
    featuredProductsLabel: string;
    announcement: string;
    navbarDeliveryText: string;
    navbarDealsText: string;
    navbarHomeText: string;
    navbarDeliverToText: string;
    navbarDeliverToLocation: string;
    navbarSearchPlaceholder: string;
    navbarMobileSearchPlaceholder: string;
    navbarProfileText: string;
    navbarAdminDashboardText: string;
    navbarEditThemeText: string;
    navbarLiveEditText: string;
    navbarLoginText: string;
    navbarCartText: string;
    navbarViewAllText: string;
    navbarLoadingCategoriesText: string;
    buttonText: string;
    footerText: string;
    footerBlurb: string;
    footerQuickLinksTitle: string;
    footerQuickLinkShopAll: string;
    footerQuickLinkDishes: string;
    footerQuickLinkPastes: string;
    footerQuickLinkSpices: string;
    footerContactTitle: string;
    footerEmailLabel: string;
    footerPhoneLabel: string;
    footerHeadOfficeLabel: string;
    footerSupportLabel: string;
    footerFollowUsTitle: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    newsletterButton: string;
    footerCopyright: string;
    productsHeroTitle: string;
    productsHeroSubtitle: string;
    cartTitle: string;
    cartEmptyTitle: string;
    cartEmptySubtitle: string;
    cartOrdersCta: string;
    cartContinueCta: string;
    cartSummaryTitle: string;
    cartCheckoutCta: string;
    cartClearCta: string;
    ordersTitle: string;
    ordersHelperText: string;
    ordersButtonText: string;
    ordersLoadingText: string;
    ordersEmptyText: string;
    ordersFooterHint: string;
    checkoutTitle: string;
    checkoutEmptyTitle: string;
    checkoutEmptyCta: string;
    checkoutDeliveryTitle: string;
    checkoutOrderSummaryTitle: string;
    checkoutPlaceOrderText: string;
    checkoutConfirmedTitle: string;
    checkoutConfirmedSubtitle: string;
    checkoutContinueShoppingText: string;
    checkoutDownloadSlipText: string;
    productSpecialLabel: string;
    productFallbackDescription: string;
    productFeatureOne: string;
    productFeatureTwo: string;
    productFeatureThree: string;
    productBackToProductsText: string;
    productCardAddToCartText: string;
    productCardReadyToShipText: string;
    productCardUncategorizedText: string;
    productDetailLoadingText: string;
    productDetailNotFoundText: string;
    productDetailAddToCartText: string;
    authLoginTitle: string;
    authLoginEmailPlaceholder: string;
    authLoginPasswordPlaceholder: string;
    authLoginButtonText: string;
    authLoginLoadingText: string;
    authLoginRegisterButtonText: string;
    authRegisterTitle: string;
    authRegisterNamePlaceholder: string;
    authRegisterEmailPlaceholder: string;
    authRegisterPasswordPlaceholder: string;
    authRegisterPhonePlaceholder: string;
    authRegisterButtonText: string;
    authRegisterLoadingText: string;
    authRegisterLoginButtonText: string;
    navbarLiveEditOnText: string;
    navbarLiveEditOffText: string;
    navbarLogoutText: string;
    homeFeaturedViewAllText: string;
    homeNoProductsText: string;
    productsLoadingText: string;
    productsViewAllText: string;
    productsNoResultsText: string;
    productsNoResultsForText: string;
    productsNoCategoryResultsText: string;
    cartRemoveText: string;
    cartItemsLabel: string;
    cartDeliveryLabel: string;
    cartFreeText: string;
    cartTotalLabel: string;
    checkoutNameLabel: string;
    checkoutEmailLabel: string;
    checkoutPhoneLabel: string;
    checkoutPhonePlaceholder: string;
    checkoutAddressLabel: string;
    checkoutAddressPlaceholder: string;
    checkoutUseCurrentLocationText: string;
    checkoutGettingLocationText: string;
    checkoutPlacingText: string;
    checkoutSubtotalLabel: string;
    checkoutDeliveryLabel: string;
    checkoutTotalLabel: string;
    checkoutFreeText: string;
    checkoutRequiredFieldsError: string;
    checkoutKarachiOnlyError: string;
    checkoutCartEmptyError: string;
    checkoutOrderPlacedSuccess: string;
    checkoutNetworkError: string;
    checkoutLocationUnsupportedError: string;
    checkoutLocationAccessError: string;
    checkoutLocationFallbackError: string;
    checkoutLocationCachedNotice: string;
    ordersPhoneRequiredError: string;
    ordersLoadFailedError: string;
    ordersNetworkError: string;
    ordersHomeLinkText: string;
    ordersContinueShoppingText: string;
    ordersPhonePlaceholder: string;
    ordersOrderIdPlaceholder: string;
    ordersGoBackHomeText: string;
    ordersOrderLabel: string;
    ordersRecentText: string;
    ordersPendingText: string;
    ordersBuyerLabel: string;
    ordersCustomerFallbackText: string;
    ordersPhoneLabel: string;
    ordersItemFallbackText: string;
    ordersTotalLabel: string;
    ordersDownloadReceiptText: string;
    ordersDownloadSlipText: string;
  };
  heroStats: ThemeStat[];
  highlights: ThemeHighlight[];
  promoCards: ThemePromoCard[];
  company: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
};

export type ThemePatch = Partial<Omit<Theme, "colors" | "content" | "company">> & {
  colors?: Partial<Theme["colors"]>;
  content?: Partial<Theme["content"]>;
  company?: Partial<Theme["company"]>;
};

export const defaultTheme: Theme = {
  themeSchemaVersion: 1,
  colors: {
    primary: "#1a1a1a",
    secondary: "#f5f5f5",
    background: "#ffffff",
    text: "#111111",
    accent: "#ff6b35",
  },
  content: {
    heroPill: "Zaikest fresh pantry",
    heroTitle: "",
    heroSubtitle:
      "Shop daily kitchen favorites, made with care and brought to your door in minutes.",
    heroPrimaryCta: "Start shopping",
    heroSecondaryCta: "Explore deals",
    categoryHeading: "Shop by category",
    categoryViewAll: "View all",
    featuredHeading: "Fresh picks for you",
    featuredCategoriesLabel: "Categories",
    featuredProductsLabel: "Products",
    announcement: "",
    navbarDeliveryText: "",
    navbarDealsText: "",
    navbarHomeText: "Home",
    navbarDeliverToText: "Deliver to",
    navbarDeliverToLocation: "Home",
    navbarSearchPlaceholder: "Search for dishes, pastes, spices",
    navbarMobileSearchPlaceholder: "Search for groceries",
    navbarProfileText: "Profile",
    navbarAdminDashboardText: "Admin Dashboard",
    navbarEditThemeText: "Edit Theme",
    navbarLiveEditText: "Live Edit",
    navbarLoginText: "Login",
    navbarCartText: "Cart",
    navbarViewAllText: "View all",
    navbarLoadingCategoriesText: "Loading categories...",
    buttonText: "Shop now",
    footerText: "",
    footerBlurb:
      "Zaikest delivers homemade dishes, fresh pastes, and pantry essentials right to your door.",
    footerQuickLinksTitle: "Quick links",
    footerQuickLinkShopAll: "Shop all",
    footerQuickLinkDishes: "Dishes",
    footerQuickLinkPastes: "Pastes",
    footerQuickLinkSpices: "Spices",
    footerContactTitle: "Contact",
    footerEmailLabel: "Email",
    footerPhoneLabel: "Phone",
    footerHeadOfficeLabel: "Head Office",
    footerSupportLabel: "Customer Support",
    footerFollowUsTitle: "Follow us",
    newsletterTitle: "Subscribe to our Newsletter",
    newsletterSubtitle: "New arrivals, seasonal picks, and exclusive bundles.",
    newsletterButton: "Subscribe",
    footerCopyright:
      "Copyright {year} Zaikest. All rights reserved. Developed by Naeem Rehman.",
    productsHeroTitle: "Zaikest Grocery",
    productsHeroSubtitle:
      "Shop category wise for dishes, pastes, spices, snacks, and pantry staples.",
    cartTitle: "Shopping Cart",
    cartEmptyTitle: "Your cart is empty",
    cartEmptySubtitle: "Looks like you have not added anything yet.",
    cartOrdersCta: "My Orders",
    cartContinueCta: "Continue shopping",
    cartSummaryTitle: "Order Summary",
    cartCheckoutCta: "Proceed to Checkout",
    cartClearCta: "Clear Cart",
    ordersTitle: "View Orders",
    ordersHelperText: "Enter your phone number to fetch your orders and status updates.",
    ordersButtonText: "View Orders",
    ordersLoadingText: "Loading orders...",
    ordersEmptyText: "No orders found yet.",
    ordersFooterHint:
      "Orders will show status updates as they move from pending to shipped and delivered.",
    checkoutTitle: "Checkout",
    checkoutEmptyTitle: "Your cart is empty",
    checkoutEmptyCta: "Browse Products",
    checkoutDeliveryTitle: "Delivery Details",
    checkoutOrderSummaryTitle: "Order Summary",
    checkoutPlaceOrderText: "Place Order",
    checkoutConfirmedTitle: "Order Confirmed",
    checkoutConfirmedSubtitle: "Thank you for shopping with Zaikest",
    checkoutContinueShoppingText: "Continue Shopping",
    checkoutDownloadSlipText: "Download Summary Slip",
    productSpecialLabel: "Zaikest special",
    productFallbackDescription: "Freshly prepared and ready to deliver.",
    productFeatureOne: "Handmade with authentic spices",
    productFeatureTwo: "Delivered fresh and sealed",
    productFeatureThree: "Ready in 20-30 minutes",
    productBackToProductsText: "Back to products",
    productCardAddToCartText: "Add to Cart",
    productCardReadyToShipText: "Ready to ship",
    productCardUncategorizedText: "Uncategorized",
    productDetailLoadingText: "Loading product...",
    productDetailNotFoundText: "Product not found",
    productDetailAddToCartText: "Add to Cart",
    authLoginTitle: "Login",
    authLoginEmailPlaceholder: "Email",
    authLoginPasswordPlaceholder: "Password",
    authLoginButtonText: "Login",
    authLoginLoadingText: "Logging in...",
    authLoginRegisterButtonText: "Register",
    authRegisterTitle: "Register",
    authRegisterNamePlaceholder: "Full Name",
    authRegisterEmailPlaceholder: "Email",
    authRegisterPasswordPlaceholder: "Password",
    authRegisterPhonePlaceholder: "Phone",
    authRegisterButtonText: "Register",
    authRegisterLoadingText: "Registering...",
    authRegisterLoginButtonText: "Login",
    navbarLiveEditOnText: "On",
    navbarLiveEditOffText: "Off",
    navbarLogoutText: "Logout",
    homeFeaturedViewAllText: "View all",
    homeNoProductsText: "No products found.",
    productsLoadingText: "Loading products...",
    productsViewAllText: "View all",
    productsNoResultsText: "No products found.",
    productsNoResultsForText: "No products found for",
    productsNoCategoryResultsText: "No products found in this category.",
    cartRemoveText: "Remove",
    cartItemsLabel: "Items",
    cartDeliveryLabel: "Delivery",
    cartFreeText: "Free",
    cartTotalLabel: "Total",
    checkoutNameLabel: "Full name",
    checkoutEmailLabel: "Email address",
    checkoutPhoneLabel: "Phone number",
    checkoutPhonePlaceholder: "Enter phone number",
    checkoutAddressLabel: "Delivery address",
    checkoutAddressPlaceholder: "Enter delivery address",
    checkoutUseCurrentLocationText: "Use current location",
    checkoutGettingLocationText: "Getting location...",
    checkoutPlacingText: "Placing...",
    checkoutSubtotalLabel: "Subtotal",
    checkoutDeliveryLabel: "Delivery",
    checkoutTotalLabel: "Total",
    checkoutFreeText: "Free",
    checkoutRequiredFieldsError: "Please fill all required fields.",
    checkoutKarachiOnlyError: "Delivery address must be within Karachi",
    checkoutCartEmptyError: "Your cart is empty",
    checkoutOrderPlacedSuccess: "Order placed successfully.",
    checkoutNetworkError: "Network error. Please try again.",
    checkoutLocationUnsupportedError: "Location is not supported on this device.",
    checkoutLocationAccessError: "Unable to access location. Please allow location access.",
    checkoutLocationFallbackError: "Exact address not found. Coordinates were added instead.",
    checkoutLocationCachedNotice: "Using last known saved location for this area.",
    ordersPhoneRequiredError: "Please enter your phone number to view orders.",
    ordersLoadFailedError: "Failed to load orders. Please try again.",
    ordersNetworkError: "Network error. Please try again.",
    ordersHomeLinkText: "Home",
    ordersContinueShoppingText: "Continue shopping",
    ordersPhonePlaceholder: "03xx-xxxxxxx",
    ordersOrderIdPlaceholder: "Order ID (optional)",
    ordersGoBackHomeText: "Go back home",
    ordersOrderLabel: "Order",
    ordersRecentText: "Recent",
    ordersPendingText: "Pending",
    ordersBuyerLabel: "Buyer",
    ordersCustomerFallbackText: "Customer",
    ordersPhoneLabel: "Phone",
    ordersItemFallbackText: "Item",
    ordersTotalLabel: "Total",
    ordersDownloadReceiptText: "Download receipt",
    ordersDownloadSlipText: "Download slip",
  },
  heroStats: [
    { title: "20-30 min", text: "Avg delivery" },
    { title: "Quality checked", text: "Every order" },
    { title: "Freshness", text: "Guaranteed" },
  ],
  highlights: [
    {
      title: "Homemade flavors",
      text: "Authentic dishes and pastes prepared with real ingredients.",
    },
    {
      title: "Smart savings",
      text: "Daily deals and bundles tailored to your kitchen.",
    },
    {
      title: "Fast support",
      text: "Friendly help whenever you need it, before or after delivery.",
    },
    {
      title: "Fresh ingredients",
      text: "Handpicked pantry goods with verified freshness.",
    },
    {
      title: "Same-day delivery",
      text: "Quick dispatch so staples reach you in time.",
    },
    {
      title: "Quality checked",
      text: "Every order reviewed for taste and standards.",
    },
  ],
  promoCards: [
    {
      badge: "Limited",
      title: "Weekend Feast Packs",
      text: "Curated bundles with extra savings on family favorites.",
      enabled: true,
    },
    {
      badge: "Fast",
      title: "Express Delivery",
      text: "Get hot dishes to your door in 20-30 minutes.",
      enabled: true,
    },
    {
      badge: "New",
      title: "Chef Specials",
      text: "New seasonal recipes, crafted fresh every day.",
      enabled: true,
    },
    {
      badge: "Assured",
      title: "Quality Checked",
      text: "Every order is packed with care and verified.",
      enabled: true,
    },
  ],
  company: {
    name: "Zaikest",
    phone: "+92 302 0284408",
    email: "Zaikest.food@gmail.com",
    address: "Karachi, Pakistan",
  },
};

type ThemeContextType = {
  theme: Theme;
  loading: boolean;
  editMode: boolean;
  canManageTheme: boolean;
  version: string | number | null;
  setEditMode: (next: boolean) => void;
  refreshTheme: () => Promise<void>;
  updateTheme: (patch: ThemePatch) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const mergeTheme = (prev: Theme, patch: ThemePatch): Theme => ({
  ...prev,
  ...patch,
  colors: { ...prev.colors, ...patch.colors },
  content: { ...prev.content, ...patch.content },
  company: { ...prev.company, ...patch.company },
  heroStats: patch.heroStats ?? prev.heroStats,
  highlights: patch.highlights ?? prev.highlights,
  promoCards: patch.promoCards ?? prev.promoCards,
});

const extractThemePayload = (json: any) => {
  const serverTheme = json?.theme ?? json?.data?.theme;
  const nextVersion = json?.version ?? json?.data?.version ?? serverTheme?.version ?? null;
  return { serverTheme, nextVersion };
};

const THEME_CACHE_KEY = "zaikest:theme-cache:v1";

const writeThemeCache = (theme: Theme, version: string | number | null) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ theme, version }));
  } catch {
    // Ignore cache write errors.
  }
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const canManageTheme = useMemo(
    () => user?.role === "admin" && (user.permissions || []).includes("MANAGE_THEME"),
    [user]
  );

  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [version, setVersion] = useState<string | number | null>(null);
  const lastUpdateAtRef = useRef(0);


  const refreshTheme = useCallback(async (force = false) => {
    const startedAt = Date.now();
    setLoading(true);
    try {
      const res = await fetch(apiPath("/v1/theme"), {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const json = await res.json();
      const { serverTheme, nextVersion } = extractThemePayload(json);
      if (res.ok && serverTheme) {
        if (!force && lastUpdateAtRef.current > startedAt) {
          return;
        }
        const nextTheme = serverTheme as Theme;
        setTheme(nextTheme);
        setVersion(nextVersion);
        writeThemeCache(nextTheme, nextVersion);
      }
    } catch {
      // keep current theme on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTheme();
  }, [refreshTheme]);

  useEffect(() => {
    if (!canManageTheme && editMode) {
      setEditMode(false);
    }
  }, [canManageTheme, editMode]);

  const updateTheme = useCallback(
    async (patch: ThemePatch) => {
      lastUpdateAtRef.current = Date.now();
      setTheme((prev) => mergeTheme(prev, patch));
      if (!canManageTheme) return;
      try {
        const res = await fetch(apiPath("/v1/admin/theme"), {
          method: "PUT",
          credentials: "include",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            ...(version ? { "If-Match": String(version) } : {}),
          },
          body: JSON.stringify(patch),
        });
        const json = await res.json();
        if (res.status === 409) {
          console.warn("Theme changed, reloaded latest.");
          await refreshTheme(true);
          return;
        }
        const { serverTheme, nextVersion } = extractThemePayload(json);
        if (res.ok && serverTheme) {
          const nextTheme = serverTheme as Theme;
          setTheme(nextTheme);
          setVersion(nextVersion);
          writeThemeCache(nextTheme, nextVersion);
        } else {
          await refreshTheme(true);
        }
      } catch {
        await refreshTheme(true);
      }
    },
    [canManageTheme, refreshTheme, version]
  );

  const value: ThemeContextType = {
    theme,
    loading,
    editMode,
    canManageTheme,
    version,
    setEditMode,
    refreshTheme,
    updateTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
};

