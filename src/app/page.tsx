"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Leaf,
  ShieldCheck,
  Clock,
  Sparkles,
  Truck,
  BadgeCheck,
  Wallet,
  Soup,
  Flame,
  Cookie,
  CookingPot,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import ProductCard from "../components/ProductCard";
import PromoPosters from "../components/PromoPosters";
import { getCategoryIcon } from "../utils/categoryIcon";
import { API_BASE } from "../config/env";
import { normalizeRemoteUrl, resolveAssetUrl } from "../utils/assetUrl";
import { useTheme } from "../context/ThemeContext";
import EditableText from "../components/theme/EditableText";
import { useCategories } from "../context/CategoriesContext";

const landingImages = [
  "/images/slide1.jpg",
  "/images/slide2.jpg",
  "/images/slide3.jpg",
  "/images/slide4.jpg",
];

const fallbackHeroStats = [
  { title: "20-30 min", text: "Avg delivery" },
  { title: "Quality checked", text: "Every order" },
  { title: "Freshness", text: "Guaranteed" },
];

const fallbackHighlights = [
  {
    title: "Homemade flavors",
    text: "Authentic dishes and pastes prepared with real ingredients.",
    icon: Sparkles,
  },
  {
    title: "Smart savings",
    text: "Daily deals and bundles tailored to your kitchen.",
    icon: Wallet,
  },
  {
    title: "Fast support",
    text: "Friendly help whenever you need it, before or after delivery.",
    icon: ShieldCheck,
  },
  {
    title: "Fresh ingredients",
    text: "Handpicked pantry goods with verified freshness.",
    icon: Leaf,
  },
  {
    title: "Same-day delivery",
    text: "Quick dispatch so staples reach you in time.",
    icon: Truck,
  },
  {
    title: "Quality checked",
    text: "Every order reviewed for taste and standards.",
    icon: BadgeCheck,
  },
];
const fallbackCategories = [
  { name: "Dishes", icon: Soup, color: "bg-green-50" },
  { name: "Pastes", icon: CookingPot, color: "bg-amber-50" },
  { name: "Spices", icon: Flame, color: "bg-amber-50" },
  { name: "Snacks", icon: Cookie, color: "bg-amber-50" },
];

type Category = { _id: string; name: string }
type Product = {
  _id: string
  name: string
  price: number
  image?: string
  imageUrl?: string
  category?: Category
}

const PRODUCTS_API = `${API_BASE}/v1/products`;

export default function HomePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const { categories } = useCategories();
  const { theme, editMode, canManageTheme, updateTheme } = useTheme();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -400 : 400,
      behavior: "smooth",
    });
  };

  const scrollCategories = (direction: "left" | "right") => {
    if (!categoryScrollRef.current) return;

    categoryScrollRef.current.scrollBy({
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(PRODUCTS_API, { credentials: "include" });
        const json = await res.json();
        const items: Product[] = json.data || [];
        const normalized = items.map((p) => ({
          ...p,
          imageUrl: normalizeRemoteUrl(p.imageUrl || resolveAssetUrl(p.image, "")),
        }));
        setProducts(normalized);
      } catch {
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  const categoryCards = useMemo(() => {
    if (!categories.length) return fallbackCategories;
  const colors = [
    "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200",
    "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200",
    "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200",
    "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200",
  ];
    return categories.map((cat, index) => {
      const name = cat.name || "Category";
      const lower = name.toLowerCase();
      const icon = getCategoryIcon(name);
      return {
        name,
        icon,
        color: colors[index % colors.length],
      };
    });
  }, [categories]);

  const heroStats = theme.heroStats?.length ? theme.heroStats : fallbackHeroStats;
  const highlightCards = theme.highlights?.length
    ? theme.highlights.map((item, index) => ({
        ...item,
        icon: fallbackHighlights[index % fallbackHighlights.length].icon,
      }))
    : fallbackHighlights;

  const heroBg =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=80";
  const bannerBg =
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=2000&q=80";

  const updateHeroStat = (index: number, key: "title" | "text", value: string) => {
    const next = heroStats.map((stat, i) =>
      i === index ? { ...stat, [key]: value } : stat
    );
    updateTheme({ heroStats: next });
  };

  const updateHighlight = (index: number, key: "title" | "text", value: string) => {
    const next = highlightCards.map((card, i) =>
      i === index
        ? { title: key === "title" ? value : card.title, text: key === "text" ? value : card.text }
        : { title: card.title, text: card.text }
    );
    updateTheme({ highlights: next.map(({ title, text }) => ({ title, text })) });
  };


  return (
    <>
      <Navbar />

      <main className="bg-transparent pt-[var(--nav-h)]">
        <section className="max-w-7xl mx-auto px-4 pt-8 sm:pt-10 pb-8">
          <div className="relative overflow-hidden rounded-3xl border border-green-200 bg-white/10">
            <div
              className="absolute inset-0 bg-cover bg-center animate-hero-pan"
              style={{
                backgroundImage: `url(${heroBg})`,
              }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0b0b0b]/85 via-[#2a0d12]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#11090b]/70 via-transparent to-transparent" />
            <div className="relative px-6 py-14 sm:px-12 sm:py-20 lg:py-24 max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur">
                <Leaf size={14} />
                <EditableText
                  value={theme.content.heroPill}
                  fallback="Zaikest fresh pantry"
                  editMode={editMode && canManageTheme}
                  onSave={(next) => updateTheme({ content: { heroPill: next } })}
                />
              </div>
              <EditableText
                as="h1"
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-5"
                value={theme.content.heroTitle}
                fallback="Homemade flavors and pantry essentials delivered fast."
                editMode={editMode && canManageTheme}
                onSave={(next) => updateTheme({ content: { heroTitle: next } })}
                multiline
              />
              <EditableText
                as="p"
                className="text-sm sm:text-base md:text-lg text-white/90 mt-3 max-w-2xl"
                value={theme.content.heroSubtitle}
                fallback="Shop daily kitchen favorites, made with care and brought to your door in minutes."
                editMode={editMode && canManageTheme}
                onSave={(next) => updateTheme({ content: { heroSubtitle: next } })}
                multiline
              />
              <div className="flex flex-wrap gap-3 mt-6">
                {editMode && canManageTheme ? (
                  <>
                    <span className="px-6 py-3 rounded-full bg-amber-400 text-green-950 font-semibold shadow">
                      <EditableText
                        value={theme.content.heroPrimaryCta}
                        fallback="Start shopping"
                        editMode={true}
                        onSave={(next) => updateTheme({ content: { heroPrimaryCta: next } })}
                      />
                    </span>
                    <span className="px-6 py-3 rounded-full bg-white/10 border border-white/40 text-white font-semibold">
                      <EditableText
                        value={theme.content.heroSecondaryCta}
                        fallback="Explore deals"
                        editMode={true}
                        onSave={(next) => updateTheme({ content: { heroSecondaryCta: next } })}
                      />
                    </span>
                  </>
                ) : (
                  <>
                    <Link
                      href="/products"
                      className="px-6 py-3 rounded-full bg-amber-400 text-green-950 font-semibold shadow hover:bg-amber-300 transition"
                    >
                      {theme.content.heroPrimaryCta || "Start shopping"}
                    </Link>
                    <Link
                      href="/products"
                      className="px-6 py-3 rounded-full bg-white/10 border border-white/40 text-white font-semibold hover:bg-white/20 transition"
                    >
                      {theme.content.heroSecondaryCta || "Explore deals"}
                    </Link>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-8 text-xs sm:text-sm">
                <div className="bg-white/15 border border-white/20 rounded-2xl p-3 text-center text-white">
                  <Clock size={18} className="mx-auto" />
                  <EditableText
                    as="p"
                    className="font-semibold"
                    value={heroStats[0]?.title || fallbackHeroStats[0].title}
                    fallback={fallbackHeroStats[0].title}
                    editMode={editMode && canManageTheme}
                    onSave={(next) => updateHeroStat(0, "title", next)}
                  />
                  <EditableText
                    as="p"
                    className="text-white/80"
                    value={heroStats[0]?.text || fallbackHeroStats[0].text}
                    fallback={fallbackHeroStats[0].text}
                    editMode={editMode && canManageTheme}
                    onSave={(next) => updateHeroStat(0, "text", next)}
                  />
                </div>
                <div className="bg-white/15 border border-white/20 rounded-2xl p-3 text-center text-white">
                  <ShieldCheck size={18} className="mx-auto" />
                  <EditableText
                    as="p"
                    className="font-semibold"
                    value={heroStats[1]?.title || fallbackHeroStats[1].title}
                    fallback={fallbackHeroStats[1].title}
                    editMode={editMode && canManageTheme}
                    onSave={(next) => updateHeroStat(1, "title", next)}
                  />
                  <EditableText
                    as="p"
                    className="text-white/80"
                    value={heroStats[1]?.text || fallbackHeroStats[1].text}
                    fallback={fallbackHeroStats[1].text}
                    editMode={editMode && canManageTheme}
                    onSave={(next) => updateHeroStat(1, "text", next)}
                  />
                </div>
                <div className="bg-white/15 border border-white/20 rounded-2xl p-3 text-center text-white">
                  <Leaf size={18} className="mx-auto" />
                  <EditableText
                    as="p"
                    className="font-semibold"
                    value={heroStats[2]?.title || fallbackHeroStats[2].title}
                    fallback={fallbackHeroStats[2].title}
                    editMode={editMode && canManageTheme}
                    onSave={(next) => updateHeroStat(2, "title", next)}
                  />
                  <EditableText
                    as="p"
                    className="text-white/80"
                    value={heroStats[2]?.text || fallbackHeroStats[2].text}
                    fallback={fallbackHeroStats[2].text}
                    editMode={editMode && canManageTheme}
                    onSave={(next) => updateHeroStat(2, "text", next)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PromoPosters removed per request */}

        <section className="max-w-7xl mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-5">
            <EditableText
              as="h2"
              className="text-2xl font-bold text-green-950"
              value={theme.content.categoryHeading}
              fallback="Shop by category"
              editMode={editMode && canManageTheme}
              onSave={(next) => updateTheme({ content: { categoryHeading: next } })}
            />
            {editMode && canManageTheme ? (
              <span className="text-sm font-semibold text-green-700">
                <EditableText
                  value={theme.content.categoryViewAll}
                  fallback="View all"
                  editMode={true}
                  onSave={(next) => updateTheme({ content: { categoryViewAll: next } })}
                />
              </span>
            ) : (
              <Link href="/products" className="text-sm font-semibold text-green-700 hover:text-green-800">
                {theme.content.categoryViewAll || "View all"}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryCards.map((cat) => (
              <Link
                key={cat.name}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className={`px-4 py-2 rounded-full border text-sm font-semibold inline-flex items-center gap-2 ${cat.color}`}
              >
                <cat.icon size={14} />
                {cat.name}
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="relative overflow-hidden rounded-3xl border border-green-200 min-h-[420px] sm:min-h-[520px]">
            <div
              className="absolute inset-0 bg-cover bg-center animate-hero-pan"
              style={{
                backgroundImage: `url(${bannerBg})`,
              }}
              aria-hidden
            />
            <div className="absolute inset-0 bg-black/65" aria-hidden />
            <div className="relative px-6 py-12 sm:px-12 sm:py-16">
              <div className="flex items-center justify-between mb-4">
                <EditableText
                  as="h2"
                  className="text-2xl font-bold text-white drop-shadow-[0_6px_18px_rgba(0,0,0,0.45)]"
                  value={theme.content.featuredHeading}
                  fallback="Fresh picks for you"
                  editMode={editMode && canManageTheme}
                  onSave={(next) => updateTheme({ content: { featuredHeading: next } })}
                />
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <EditableText
                    as="span"
                    className="text-sm font-semibold text-white/90"
                    value={theme.content.featuredCategoriesLabel}
                    fallback="Categories"
                    editMode={editMode && canManageTheme}
                    onSave={(next) => updateTheme({ content: { featuredCategoriesLabel: next } })}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => scrollCategories("left")}
                      className="p-2 rounded-full bg-white/90 border border-white/30 hover:bg-white transition"
                      aria-label="Scroll categories left"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      onClick={() => scrollCategories("right")}
                      className="p-2 rounded-full bg-white/90 border border-white/30 hover:bg-white transition"
                      aria-label="Scroll categories right"
                    >
                      <ChevronRight />
                    </button>
                  </div>
                </div>
                <div
                  ref={categoryScrollRef}
                  className="flex items-center gap-3 overflow-x-auto pb-2"
                >
                  <Link
                    href="/products"
                    className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/25 text-white text-sm font-semibold hover:bg-white/15 transition"
                  >
                    {theme.content.homeFeaturedViewAllText || "View all"}
                  </Link>
                  {categoryCards.map((cat) => (
                    <Link
                      key={`fresh-${cat.name}`}
                      href={`/products?category=${encodeURIComponent(cat.name)}`}
                      className="whitespace-nowrap px-4 py-2 rounded-full bg-white/10 border border-white/25 text-white text-sm font-semibold hover:bg-white/20 transition inline-flex items-center gap-2"
                    >
                      <cat.icon size={14} />
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 mt-6">
                <EditableText
                  as="span"
                  className="text-sm font-semibold text-white/90"
                  value={theme.content.featuredProductsLabel}
                  fallback="Products"
                  editMode={editMode && canManageTheme}
                  onSave={(next) => updateTheme({ content: { featuredProductsLabel: next } })}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scroll("left")}
                    className="p-2 rounded-full bg-white/90 border border-white/30 hover:bg-white transition"
                    aria-label="Scroll products left"
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    onClick={() => scroll("right")}
                    className="p-2 rounded-full bg-white/90 border border-white/30 hover:bg-white transition"
                    aria-label="Scroll products right"
                  >
                    <ChevronRight />
                  </button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-2 mt-4"
              >
                {products.length ? (
                  products.slice(0, 8).map((product) => (
                    <div key={product._id} className="min-w-[180px] sm:min-w-[200px]">
                      <ProductCard product={product} compact />
                    </div>
                  ))
                ) : (
                  <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-white/90">
                    {theme.content.homeNoProductsText || "No products found."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 pb-14">
          <div className="marquee py-2">
            <div className="marquee-track gap-6 px-4">
              {highlightCards.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="min-w-[240px] sm:min-w-[280px] bg-[#0f2a1a] rounded-2xl p-5 shadow-md hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
                      <item.icon size={18} />
                    </span>
                    <EditableText
                      as="h3"
                      className="text-lg font-bold text-white"
                      value={item.title}
                      fallback={item.title}
                      editMode={editMode && canManageTheme}
                      onSave={(next) => updateHighlight(index, "title", next)}
                    />
                  </div>
                  <EditableText
                    as="p"
                    className="text-white font-semibold"
                    value={item.text}
                    fallback={item.text}
                    editMode={editMode && canManageTheme}
                    onSave={(next) => updateHighlight(index, "text", next)}
                    multiline
                  />
                </div>
              ))}
              {highlightCards.map((item, index) => (
                <div
                  key={`${item.title}-dup-${index}`}
                  className="min-w-[240px] sm:min-w-[280px] bg-[#0f2a1a] rounded-2xl p-5 shadow-md hover:shadow-lg transition"
                  aria-hidden
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">
                      <item.icon size={18} />
                    </span>
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  </div>
                  <p className="text-white font-semibold">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
