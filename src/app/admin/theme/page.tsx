"use client";

import { useEffect, useState } from "react";
import { apiPath } from "../../../config/env";
import { sanitizeText } from "../../../utils/sanitize";
import { useAuth } from "../../../context/AuthContext";

type Theme = {
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
    buttonText: string;
    footerText: string;
    footerBlurb: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    newsletterButton: string;
    footerCopyright: string;
  };
  heroStats: { title: string; text: string }[];
  highlights: { title: string; text: string }[];
  company: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
};

const emptyTheme: Theme = {
  colors: {
    primary: "",
    secondary: "",
    background: "",
    text: "",
    accent: "",
  },
  content: {
    heroPill: "",
    heroTitle: "",
    heroSubtitle: "",
    heroPrimaryCta: "",
    heroSecondaryCta: "",
    categoryHeading: "",
    categoryViewAll: "",
    featuredHeading: "",
    featuredCategoriesLabel: "",
    featuredProductsLabel: "",
    announcement: "",
    buttonText: "",
    footerText: "",
    footerBlurb: "",
    newsletterTitle: "",
    newsletterSubtitle: "",
    newsletterButton: "",
    footerCopyright: "",
  },
  heroStats: [],
  highlights: [],
  company: {
    name: "",
    phone: "",
    email: "",
    address: "",
  },
};

export default function AdminThemePage() {
  const { user } = useAuth();
  const canManageTheme = (user?.permissions || []).includes("MANAGE_THEME");

  const [theme, setTheme] = useState<Theme>(emptyTheme);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const showMsg = (text: string, type: "error" | "success" = "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiPath("/v1/theme"), { credentials: "include" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load theme");
        setTheme({ ...emptyTheme, ...json.theme });
      } catch (e: any) {
        showMsg(e.message || "Failed to load theme");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateSection = <K extends keyof Theme>(
    section: K,
    key: keyof Theme[K],
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiPath("/v1/admin/theme"), {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(theme),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to update theme");
      setTheme({ ...emptyTheme, ...json.theme });
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
    </div>
  );
}

