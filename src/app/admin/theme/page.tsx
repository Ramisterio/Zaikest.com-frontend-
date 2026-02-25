"use client";

import { useEffect, useMemo, useState } from "react";
import { apiPath } from "../../../config/env";
import { sanitizeText } from "../../../utils/sanitize";
import { useAuth } from "../../../context/AuthContext";
import { Theme, ThemePatch, defaultTheme } from "../../../context/ThemeContext";

export default function AdminThemePage() {
  const { user } = useAuth();
  const canManageTheme = (user?.permissions || []).includes("MANAGE_THEME");

  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [originalTheme, setOriginalTheme] = useState<Theme>(defaultTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [version, setVersion] = useState<string | number | null>(null);

  const mergeTheme = useMemo(
    () => (base: Theme, patch: Partial<Theme>): Theme => ({
        ...base,
        ...patch,
        colors: { ...base.colors, ...(patch.colors || {}) },
        content: { ...base.content, ...(patch.content || {}) },
        company: { ...base.company, ...(patch.company || {}) },
        heroStats: patch.heroStats ?? base.heroStats,
        highlights: patch.highlights ?? base.highlights,
        promoCards: patch.promoCards ?? base.promoCards,
      }),
    []
  );

  const buildPatch = useMemo(
    () => (next: Theme, base: Theme): ThemePatch => {
        const patch: ThemePatch = {};

        if (next.themeSchemaVersion !== base.themeSchemaVersion) {
          patch.themeSchemaVersion = next.themeSchemaVersion;
        }

        const colorsPatch: Partial<Theme["colors"]> = {};
        (Object.keys(next.colors) as (keyof Theme["colors"])[]).forEach((key) => {
          if (next.colors[key] !== base.colors[key]) colorsPatch[key] = next.colors[key];
        });
        if (Object.keys(colorsPatch).length) patch.colors = colorsPatch;

        const contentPatch: Partial<Theme["content"]> = {};
        (Object.keys(next.content) as (keyof Theme["content"])[]).forEach((key) => {
          if (next.content[key] !== base.content[key]) contentPatch[key] = next.content[key];
        });
        if (Object.keys(contentPatch).length) patch.content = contentPatch;

        const companyPatch: Partial<Theme["company"]> = {};
        (Object.keys(next.company) as (keyof Theme["company"])[]).forEach((key) => {
          if (next.company[key] !== base.company[key]) companyPatch[key] = next.company[key];
        });
        if (Object.keys(companyPatch).length) patch.company = companyPatch;

        if (JSON.stringify(next.heroStats ?? []) !== JSON.stringify(base.heroStats ?? [])) {
          patch.heroStats = next.heroStats;
        }
        if (JSON.stringify(next.highlights ?? []) !== JSON.stringify(base.highlights ?? [])) {
          patch.highlights = next.highlights;
        }
        if (JSON.stringify(next.promoCards ?? []) !== JSON.stringify(base.promoCards ?? [])) {
          patch.promoCards = next.promoCards;
        }

        return patch;
      },
    []
  );

  const showMsg = (text: string, type: "error" | "success" = "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const extractThemePayload = (json: any) => {
    const serverTheme = json?.theme ?? json?.data?.theme;
    const nextVersion = json?.version ?? json?.data?.version ?? serverTheme?.version ?? null;
    return { serverTheme, nextVersion };
  };

  useEffect(() => {
    (async () => {
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
        if (!res.ok || !serverTheme) throw new Error(json?.message || "Failed to load theme");
        setTheme(serverTheme as Theme);
        setOriginalTheme(serverTheme as Theme);
        setVersion(nextVersion);
      } catch (e: any) {
        showMsg(e.message || "Failed to load theme");
      } finally {
        setLoading(false);
      }
    })();
  }, [mergeTheme]);

  const updateSection = <
    S extends "colors" | "content" | "company",
    K extends keyof Theme[S]
  >(
    section: S,
    key: K,
    value: string
  ) => {
    setTheme((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const updateArrayItem = (
    key: "heroStats" | "highlights",
    index: number,
    field: "title" | "text",
    value: string
  ) => {
    setTheme((prev) => {
      const next = [...(prev[key] || [])];
      if (!next[index]) next[index] = { title: "", text: "" };
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [key]: next };
    });
  };

  const addArrayItem = (key: "heroStats" | "highlights") => {
    setTheme((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), { title: "", text: "" }],
    }));
  };

  const removeArrayItem = (key: "heroStats" | "highlights", index: number) => {
    setTheme((prev) => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index),
    }));
  };

  const updatePromoCard = (
    index: number,
    field: "badge" | "title" | "text" | "enabled",
    value: string | boolean
  ) => {
    setTheme((prev) => {
      const next = [...(prev.promoCards || [])];
      if (!next[index]) next[index] = { badge: "", title: "", text: "", enabled: true };
      next[index] = { ...next[index], [field]: value };
      return { ...prev, promoCards: next };
    });
  };

  const addPromoCard = () => {
    setTheme((prev) => ({
      ...prev,
      promoCards: [
        ...(prev.promoCards || []),
        { badge: "", title: "", text: "", enabled: true },
      ],
    }));
  };

  const removePromoCard = (index: number) => {
    setTheme((prev) => ({
      ...prev,
      promoCards: (prev.promoCards || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const patch = buildPatch(theme, originalTheme);
      if (Object.keys(patch).length === 0) {
        showMsg("No changes to save.", "success");
        return;
      }
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
        const latestRes = await fetch(apiPath("/v1/theme"), {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const latestJson = await latestRes.json();
        const { serverTheme: latestTheme, nextVersion: latestVersion } =
          extractThemePayload(latestJson);
        if (latestRes.ok && latestTheme) {
          setTheme(latestTheme as Theme);
          setOriginalTheme(latestTheme as Theme);
          setVersion(latestVersion);
        }
        showMsg("Theme changed, reloaded latest.", "error");
        return;
      }
      const { serverTheme, nextVersion } = extractThemePayload(json);
      if (!res.ok || !serverTheme) throw new Error(json?.message || "Failed to update theme");
      setTheme(serverTheme as Theme);
      setOriginalTheme(serverTheme as Theme);
      setVersion(nextVersion);
      showMsg("Theme updated", "success");
    } catch (e: any) {
      showMsg(e.message || "Failed to update theme");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-center py-10">Loading…</p>;

  if (!canManageTheme) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-2">Theme Settings</h1>
        <p className="text-gray-600">You do not have permission to edit theme settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Theme Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded text-lg font-semibold ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Colors</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Primary
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.colors.primary}
              onChange={(e) => updateSection("colors", "primary", sanitizeText(e.target.value))}
              placeholder="#1a1a1a"
            />
          </label>
          <label className="text-sm">
            Secondary
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.colors.secondary}
              onChange={(e) => updateSection("colors", "secondary", sanitizeText(e.target.value))}
              placeholder="#f5f5f5"
            />
          </label>
          <label className="text-sm">
            Background
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.colors.background}
              onChange={(e) => updateSection("colors", "background", sanitizeText(e.target.value))}
              placeholder="#ffffff"
            />
          </label>
          <label className="text-sm">
            Text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.colors.text}
              onChange={(e) => updateSection("colors", "text", sanitizeText(e.target.value))}
              placeholder="#111111"
            />
          </label>
          <label className="text-sm">
            Accent
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.colors.accent}
              onChange={(e) => updateSection("colors", "accent", sanitizeText(e.target.value))}
              placeholder="#ff6b35"
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Hero pill
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.heroPill}
              onChange={(e) => updateSection("content", "heroPill", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Hero title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.heroTitle}
              onChange={(e) => updateSection("content", "heroTitle", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Hero subtitle
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.heroSubtitle}
              onChange={(e) =>
                updateSection("content", "heroSubtitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Hero primary CTA
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.heroPrimaryCta}
              onChange={(e) =>
                updateSection("content", "heroPrimaryCta", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Hero secondary CTA
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.heroSecondaryCta}
              onChange={(e) =>
                updateSection("content", "heroSecondaryCta", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Category heading
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.categoryHeading}
              onChange={(e) =>
                updateSection("content", "categoryHeading", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Category view all
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.categoryViewAll}
              onChange={(e) =>
                updateSection("content", "categoryViewAll", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Featured heading
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.featuredHeading}
              onChange={(e) =>
                updateSection("content", "featuredHeading", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Featured categories label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.featuredCategoriesLabel}
              onChange={(e) =>
                updateSection("content", "featuredCategoriesLabel", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Featured products label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.featuredProductsLabel}
              onChange={(e) =>
                updateSection("content", "featuredProductsLabel", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Announcement
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.announcement}
              onChange={(e) =>
                updateSection("content", "announcement", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Button text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.buttonText}
              onChange={(e) =>
                updateSection("content", "buttonText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer contact title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerContactTitle}
              onChange={(e) =>
                updateSection("content", "footerContactTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer email label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerEmailLabel}
              onChange={(e) =>
                updateSection("content", "footerEmailLabel", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer phone label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerPhoneLabel}
              onChange={(e) =>
                updateSection("content", "footerPhoneLabel", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer head office label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerHeadOfficeLabel}
              onChange={(e) =>
                updateSection("content", "footerHeadOfficeLabel", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer support label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerSupportLabel}
              onChange={(e) =>
                updateSection("content", "footerSupportLabel", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer follow us title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerFollowUsTitle}
              onChange={(e) =>
                updateSection("content", "footerFollowUsTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Footer text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerText}
              onChange={(e) =>
                updateSection("content", "footerText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Footer blurb
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerBlurb}
              onChange={(e) =>
                updateSection("content", "footerBlurb", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer quick links title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerQuickLinksTitle}
              onChange={(e) =>
                updateSection("content", "footerQuickLinksTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer quick link: Shop all
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerQuickLinkShopAll}
              onChange={(e) =>
                updateSection("content", "footerQuickLinkShopAll", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer quick link: Dishes
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerQuickLinkDishes}
              onChange={(e) =>
                updateSection("content", "footerQuickLinkDishes", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer quick link: Pastes
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerQuickLinkPastes}
              onChange={(e) =>
                updateSection("content", "footerQuickLinkPastes", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Footer quick link: Spices
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerQuickLinkSpices}
              onChange={(e) =>
                updateSection("content", "footerQuickLinkSpices", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Newsletter title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.newsletterTitle}
              onChange={(e) =>
                updateSection("content", "newsletterTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Newsletter subtitle
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.newsletterSubtitle}
              onChange={(e) =>
                updateSection("content", "newsletterSubtitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Newsletter button
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.newsletterButton}
              onChange={(e) =>
                updateSection("content", "newsletterButton", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Footer copyright
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.footerCopyright}
              onChange={(e) =>
                updateSection("content", "footerCopyright", sanitizeText(e.target.value))
              }
              placeholder="Use {year} for current year"
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Navbar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Delivery Text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarDeliveryText}
              onChange={(e) =>
                updateSection("content", "navbarDeliveryText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Deals Text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarDealsText}
              onChange={(e) =>
                updateSection("content", "navbarDealsText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Home text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarHomeText}
              onChange={(e) =>
                updateSection("content", "navbarHomeText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Deliver to label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarDeliverToText}
              onChange={(e) =>
                updateSection("content", "navbarDeliverToText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Deliver to location
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarDeliverToLocation}
              onChange={(e) =>
                updateSection("content", "navbarDeliverToLocation", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Search placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarSearchPlaceholder}
              onChange={(e) =>
                updateSection("content", "navbarSearchPlaceholder", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Mobile search placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarMobileSearchPlaceholder}
              onChange={(e) =>
                updateSection(
                  "content",
                  "navbarMobileSearchPlaceholder",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Profile text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarProfileText}
              onChange={(e) =>
                updateSection("content", "navbarProfileText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Admin dashboard text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarAdminDashboardText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "navbarAdminDashboardText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Edit theme text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarEditThemeText}
              onChange={(e) =>
                updateSection("content", "navbarEditThemeText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Live edit label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarLiveEditText}
              onChange={(e) =>
                updateSection("content", "navbarLiveEditText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Login text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarLoginText}
              onChange={(e) =>
                updateSection("content", "navbarLoginText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Cart text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarCartText}
              onChange={(e) =>
                updateSection("content", "navbarCartText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            View all text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarViewAllText}
              onChange={(e) =>
                updateSection("content", "navbarViewAllText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Loading categories text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarLoadingCategoriesText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "navbarLoadingCategoriesText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Products Page</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Products hero title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productsHeroTitle}
              onChange={(e) =>
                updateSection("content", "productsHeroTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Products hero subtitle
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productsHeroSubtitle}
              onChange={(e) =>
                updateSection("content", "productsHeroSubtitle", sanitizeText(e.target.value))
              }
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Cart Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Cart title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartTitle}
              onChange={(e) => updateSection("content", "cartTitle", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Cart empty title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartEmptyTitle}
              onChange={(e) =>
                updateSection("content", "cartEmptyTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Cart empty subtitle
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartEmptySubtitle}
              onChange={(e) =>
                updateSection("content", "cartEmptySubtitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Cart orders CTA
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartOrdersCta}
              onChange={(e) =>
                updateSection("content", "cartOrdersCta", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Cart continue CTA
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartContinueCta}
              onChange={(e) =>
                updateSection("content", "cartContinueCta", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Cart summary title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartSummaryTitle}
              onChange={(e) =>
                updateSection("content", "cartSummaryTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Cart checkout CTA
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartCheckoutCta}
              onChange={(e) =>
                updateSection("content", "cartCheckoutCta", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Cart clear CTA
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartClearCta}
              onChange={(e) =>
                updateSection("content", "cartClearCta", sanitizeText(e.target.value))
              }
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Orders Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Orders title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersTitle}
              onChange={(e) =>
                updateSection("content", "ordersTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Orders helper text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersHelperText}
              onChange={(e) =>
                updateSection("content", "ordersHelperText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Orders button text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersButtonText}
              onChange={(e) =>
                updateSection("content", "ordersButtonText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Orders loading text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersLoadingText}
              onChange={(e) =>
                updateSection("content", "ordersLoadingText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Orders empty text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersEmptyText}
              onChange={(e) =>
                updateSection("content", "ordersEmptyText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Orders footer hint
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersFooterHint}
              onChange={(e) =>
                updateSection("content", "ordersFooterHint", sanitizeText(e.target.value))
              }
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Checkout Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Checkout title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutTitle}
              onChange={(e) =>
                updateSection("content", "checkoutTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Checkout empty title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutEmptyTitle}
              onChange={(e) =>
                updateSection("content", "checkoutEmptyTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Checkout empty CTA
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutEmptyCta}
              onChange={(e) =>
                updateSection("content", "checkoutEmptyCta", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Checkout delivery title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutDeliveryTitle}
              onChange={(e) =>
                updateSection("content", "checkoutDeliveryTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Checkout order summary title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutOrderSummaryTitle}
              onChange={(e) =>
                updateSection("content", "checkoutOrderSummaryTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Checkout place order text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutPlaceOrderText}
              onChange={(e) =>
                updateSection("content", "checkoutPlaceOrderText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Checkout confirmed title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutConfirmedTitle}
              onChange={(e) =>
                updateSection("content", "checkoutConfirmedTitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Checkout confirmed subtitle
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutConfirmedSubtitle}
              onChange={(e) =>
                updateSection("content", "checkoutConfirmedSubtitle", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Checkout continue shopping text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutContinueShoppingText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "checkoutContinueShoppingText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Checkout download slip text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutDownloadSlipText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "checkoutDownloadSlipText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Product Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Product special label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productSpecialLabel}
              onChange={(e) =>
                updateSection("content", "productSpecialLabel", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Product fallback description
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productFallbackDescription}
              onChange={(e) =>
                updateSection(
                  "content",
                  "productFallbackDescription",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Product feature one
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productFeatureOne}
              onChange={(e) =>
                updateSection("content", "productFeatureOne", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Product feature two
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productFeatureTwo}
              onChange={(e) =>
                updateSection("content", "productFeatureTwo", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Product feature three
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productFeatureThree}
              onChange={(e) =>
                updateSection("content", "productFeatureThree", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Back to products text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productBackToProductsText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "productBackToProductsText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Product card add-to-cart text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productCardAddToCartText}
              onChange={(e) =>
                updateSection("content", "productCardAddToCartText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Product card ready text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productCardReadyToShipText}
              onChange={(e) =>
                updateSection("content", "productCardReadyToShipText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Product card uncategorized text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productCardUncategorizedText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "productCardUncategorizedText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Product detail loading text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productDetailLoadingText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "productDetailLoadingText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Product detail not-found text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productDetailNotFoundText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "productDetailNotFoundText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Product detail add-to-cart text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productDetailAddToCartText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "productDetailAddToCartText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Auth Content</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Login title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authLoginTitle}
              onChange={(e) => updateSection("content", "authLoginTitle", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Login email placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authLoginEmailPlaceholder}
              onChange={(e) =>
                updateSection("content", "authLoginEmailPlaceholder", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Login password placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authLoginPasswordPlaceholder}
              onChange={(e) =>
                updateSection(
                  "content",
                  "authLoginPasswordPlaceholder",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Login button text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authLoginButtonText}
              onChange={(e) => updateSection("content", "authLoginButtonText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Login loading text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authLoginLoadingText}
              onChange={(e) => updateSection("content", "authLoginLoadingText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Login secondary button text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authLoginRegisterButtonText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "authLoginRegisterButtonText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Register title
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authRegisterTitle}
              onChange={(e) => updateSection("content", "authRegisterTitle", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Register name placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authRegisterNamePlaceholder}
              onChange={(e) =>
                updateSection(
                  "content",
                  "authRegisterNamePlaceholder",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Register email placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authRegisterEmailPlaceholder}
              onChange={(e) =>
                updateSection(
                  "content",
                  "authRegisterEmailPlaceholder",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Register password placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authRegisterPasswordPlaceholder}
              onChange={(e) =>
                updateSection(
                  "content",
                  "authRegisterPasswordPlaceholder",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Register phone placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authRegisterPhonePlaceholder}
              onChange={(e) =>
                updateSection(
                  "content",
                  "authRegisterPhonePlaceholder",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
          <label className="text-sm">
            Register button text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authRegisterButtonText}
              onChange={(e) =>
                updateSection("content", "authRegisterButtonText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Register loading text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authRegisterLoadingText}
              onChange={(e) =>
                updateSection("content", "authRegisterLoadingText", sanitizeText(e.target.value))
              }
            />
          </label>
          <label className="text-sm">
            Register secondary button text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.authRegisterLoginButtonText}
              onChange={(e) =>
                updateSection(
                  "content",
                  "authRegisterLoginButtonText",
                  sanitizeText(e.target.value)
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Extended Storefront Text</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Navbar live edit ON text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarLiveEditOnText}
              onChange={(e) => updateSection("content", "navbarLiveEditOnText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Navbar live edit OFF text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarLiveEditOffText}
              onChange={(e) => updateSection("content", "navbarLiveEditOffText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Navbar logout text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.navbarLogoutText}
              onChange={(e) => updateSection("content", "navbarLogoutText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Home featured view-all text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.homeFeaturedViewAllText}
              onChange={(e) => updateSection("content", "homeFeaturedViewAllText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Home no-products text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.homeNoProductsText}
              onChange={(e) => updateSection("content", "homeNoProductsText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Products loading text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productsLoadingText}
              onChange={(e) => updateSection("content", "productsLoadingText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Products view-all text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productsViewAllText}
              onChange={(e) => updateSection("content", "productsViewAllText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Products no-results text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productsNoResultsText}
              onChange={(e) => updateSection("content", "productsNoResultsText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Products no-results-for prefix
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productsNoResultsForText}
              onChange={(e) => updateSection("content", "productsNoResultsForText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Products no-category-results text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.productsNoCategoryResultsText}
              onChange={(e) => updateSection("content", "productsNoCategoryResultsText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Cart remove text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartRemoveText}
              onChange={(e) => updateSection("content", "cartRemoveText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Cart items label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartItemsLabel}
              onChange={(e) => updateSection("content", "cartItemsLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Cart delivery label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartDeliveryLabel}
              onChange={(e) => updateSection("content", "cartDeliveryLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Cart free text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartFreeText}
              onChange={(e) => updateSection("content", "cartFreeText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Cart total label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.cartTotalLabel}
              onChange={(e) => updateSection("content", "cartTotalLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout name label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutNameLabel}
              onChange={(e) => updateSection("content", "checkoutNameLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout email label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutEmailLabel}
              onChange={(e) => updateSection("content", "checkoutEmailLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout phone label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutPhoneLabel}
              onChange={(e) => updateSection("content", "checkoutPhoneLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout phone placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutPhonePlaceholder}
              onChange={(e) => updateSection("content", "checkoutPhonePlaceholder", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout address label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutAddressLabel}
              onChange={(e) => updateSection("content", "checkoutAddressLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout address placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutAddressPlaceholder}
              onChange={(e) => updateSection("content", "checkoutAddressPlaceholder", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout use-current-location text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutUseCurrentLocationText}
              onChange={(e) => updateSection("content", "checkoutUseCurrentLocationText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout getting-location text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutGettingLocationText}
              onChange={(e) => updateSection("content", "checkoutGettingLocationText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout placing text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutPlacingText}
              onChange={(e) => updateSection("content", "checkoutPlacingText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout subtotal label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutSubtotalLabel}
              onChange={(e) => updateSection("content", "checkoutSubtotalLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout delivery label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutDeliveryLabel}
              onChange={(e) => updateSection("content", "checkoutDeliveryLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout total label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutTotalLabel}
              onChange={(e) => updateSection("content", "checkoutTotalLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout free text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutFreeText}
              onChange={(e) => updateSection("content", "checkoutFreeText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout required-fields error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutRequiredFieldsError}
              onChange={(e) => updateSection("content", "checkoutRequiredFieldsError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout Karachi-only error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutKarachiOnlyError}
              onChange={(e) => updateSection("content", "checkoutKarachiOnlyError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout empty-cart error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutCartEmptyError}
              onChange={(e) => updateSection("content", "checkoutCartEmptyError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout success text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutOrderPlacedSuccess}
              onChange={(e) => updateSection("content", "checkoutOrderPlacedSuccess", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout network error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutNetworkError}
              onChange={(e) => updateSection("content", "checkoutNetworkError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout location-unsupported error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutLocationUnsupportedError}
              onChange={(e) => updateSection("content", "checkoutLocationUnsupportedError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout location-access error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutLocationAccessError}
              onChange={(e) => updateSection("content", "checkoutLocationAccessError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout location fallback error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutLocationFallbackError}
              onChange={(e) => updateSection("content", "checkoutLocationFallbackError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Checkout location cached notice
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.checkoutLocationCachedNotice}
              onChange={(e) => updateSection("content", "checkoutLocationCachedNotice", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders phone-required error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersPhoneRequiredError}
              onChange={(e) => updateSection("content", "ordersPhoneRequiredError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders load-failed error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersLoadFailedError}
              onChange={(e) => updateSection("content", "ordersLoadFailedError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders network error
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersNetworkError}
              onChange={(e) => updateSection("content", "ordersNetworkError", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders home link text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersHomeLinkText}
              onChange={(e) => updateSection("content", "ordersHomeLinkText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders continue-shopping text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersContinueShoppingText}
              onChange={(e) => updateSection("content", "ordersContinueShoppingText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders phone placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersPhonePlaceholder}
              onChange={(e) => updateSection("content", "ordersPhonePlaceholder", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders order-id placeholder
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersOrderIdPlaceholder}
              onChange={(e) => updateSection("content", "ordersOrderIdPlaceholder", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders go-back-home text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersGoBackHomeText}
              onChange={(e) => updateSection("content", "ordersGoBackHomeText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders order label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersOrderLabel}
              onChange={(e) => updateSection("content", "ordersOrderLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders recent text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersRecentText}
              onChange={(e) => updateSection("content", "ordersRecentText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders pending text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersPendingText}
              onChange={(e) => updateSection("content", "ordersPendingText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders buyer label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersBuyerLabel}
              onChange={(e) => updateSection("content", "ordersBuyerLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders customer fallback text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersCustomerFallbackText}
              onChange={(e) => updateSection("content", "ordersCustomerFallbackText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders phone label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersPhoneLabel}
              onChange={(e) => updateSection("content", "ordersPhoneLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders item fallback text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersItemFallbackText}
              onChange={(e) => updateSection("content", "ordersItemFallbackText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders total label
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersTotalLabel}
              onChange={(e) => updateSection("content", "ordersTotalLabel", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders download-receipt text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersDownloadReceiptText}
              onChange={(e) => updateSection("content", "ordersDownloadReceiptText", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Orders download-slip text
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.content.ordersDownloadSlipText}
              onChange={(e) => updateSection("content", "ordersDownloadSlipText", sanitizeText(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Hero Stats</h2>
          <button
            onClick={() => addArrayItem("heroStats")}
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            + Add Stat
          </button>
        </div>
        <div className="space-y-3">
          {(theme.heroStats || []).map((stat, index) => (
            <div key={`stat-${index}`} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
              <input
                className="border p-2 rounded sm:col-span-2"
                value={stat.title}
                placeholder="Title"
                onChange={(e) => updateArrayItem("heroStats", index, "title", sanitizeText(e.target.value))}
              />
              <input
                className="border p-2 rounded sm:col-span-2"
                value={stat.text}
                placeholder="Text"
                onChange={(e) => updateArrayItem("heroStats", index, "text", sanitizeText(e.target.value))}
              />
              <button
                onClick={() => removeArrayItem("heroStats", index)}
                className="text-sm px-3 py-2 rounded border text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
          {(!theme.heroStats || theme.heroStats.length === 0) && (
            <p className="text-sm text-gray-500">No hero stats yet.</p>
          )}
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Highlights</h2>
          <button
            onClick={() => addArrayItem("highlights")}
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            + Add Highlight
          </button>
        </div>
        <div className="space-y-3">
          {(theme.highlights || []).map((item, index) => (
            <div key={`highlight-${index}`} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
              <input
                className="border p-2 rounded sm:col-span-2"
                value={item.title}
                placeholder="Title"
                onChange={(e) => updateArrayItem("highlights", index, "title", sanitizeText(e.target.value))}
              />
              <input
                className="border p-2 rounded sm:col-span-2"
                value={item.text}
                placeholder="Text"
                onChange={(e) => updateArrayItem("highlights", index, "text", sanitizeText(e.target.value))}
              />
              <button
                onClick={() => removeArrayItem("highlights", index)}
                className="text-sm px-3 py-2 rounded border text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))}
          {(!theme.highlights || theme.highlights.length === 0) && (
            <p className="text-sm text-gray-500">No highlights yet.</p>
          )}
        </div>
      </section>
      {/* Image editing removed: text content only */}

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <h2 className="text-lg font-semibold">Company Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="text-sm">
            Name
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.company.name}
              onChange={(e) => updateSection("company", "name", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Phone
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.company.phone}
              onChange={(e) => updateSection("company", "phone", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm">
            Email
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.company.email}
              onChange={(e) => updateSection("company", "email", sanitizeText(e.target.value))}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Address
            <input
              className="mt-1 w-full border p-2 rounded"
              value={theme.company.address}
              onChange={(e) => updateSection("company", "address", sanitizeText(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="bg-white border rounded p-4 shadow space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Promo Cards</h2>
          <button
            onClick={addPromoCard}
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            + Add Card
          </button>
        </div>
        <div className="space-y-3">
          {(theme.promoCards || []).map((card, index) => (
            <div
              key={`promo-${index}`}
              className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center"
            >
              <input
                className="border p-2 rounded sm:col-span-1"
                value={card.badge}
                placeholder="Badge"
                onChange={(e) =>
                  updatePromoCard(index, "badge", sanitizeText(e.target.value))
                }
              />
              <input
                className="border p-2 rounded sm:col-span-2"
                value={card.title}
                placeholder="Title"
                onChange={(e) =>
                  updatePromoCard(index, "title", sanitizeText(e.target.value))
                }
              />
              <input
                className="border p-2 rounded sm:col-span-2"
                value={card.text}
                placeholder="Text"
                onChange={(e) =>
                  updatePromoCard(index, "text", sanitizeText(e.target.value))
                }
              />
              <div className="flex items-center gap-3 sm:col-span-1">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={card.enabled ?? true}
                    onChange={(e) => updatePromoCard(index, "enabled", e.target.checked)}
                  />
                  Enabled
                </label>
                <button
                  onClick={() => removePromoCard(index)}
                  className="text-sm px-3 py-2 rounded border text-red-600 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          {(!theme.promoCards || theme.promoCards.length === 0) && (
            <p className="text-sm text-gray-500">No promo cards yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

