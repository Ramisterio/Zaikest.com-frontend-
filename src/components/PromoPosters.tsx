"use client";
import {
  Sparkles as LucideSparkles,
  ShieldCheck as LucideShieldCheck,
  Truck as LucideTruck,
  Tag as LucideTag,
  EyeOff,
  Eye,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import EditableText from "./theme/EditableText";

const promoIcons = [LucideTag, LucideTruck, LucideSparkles, LucideShieldCheck];

const fallbackPromoCards = [
  {
    title: "Weekend Feast Packs",
    text: "Curated bundles with extra savings on family favorites.",
    badge: "Limited",
    enabled: true,
  },
  {
    title: "Express Delivery",
    text: "Get hot dishes to your door in 20-30 minutes.",
    badge: "Fast",
    enabled: true,
  },
  {
    title: "Chef Specials",
    text: "New seasonal recipes, crafted fresh every day.",
    badge: "New",
    enabled: true,
  },
  {
    title: "Quality Checked",
    text: "Every order is packed with care and verified.",
    badge: "Assured",
    enabled: true,
  },
];

export default function PromoPosters() {
  const { theme, editMode, canManageTheme, updateTheme } = useTheme();

  const promoCards = theme.promoCards?.length ? theme.promoCards : fallbackPromoCards;

  const updatePromoCard = (index: number, key: "title" | "text" | "badge" | "enabled", value: string | boolean) => {
    const next = promoCards.map((card, i) =>
      i === index ? { ...card, [key]: value } : { ...card }
    );
    updateTheme({ promoCards: next });
  };

  const visibleCards =
    editMode && canManageTheme
      ? promoCards
      : promoCards.filter((card) => card.enabled !== false);

  return ( 
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {visibleCards.map((card, index) => {
        const Icon = promoIcons[index % promoIcons.length];
        const isHidden = card.enabled === false;
        return (
          <div
            key={`${card.title}-${index}`}
            className={`rounded-2xl border border-green-100 bg-white/90 shadow-sm p-4 flex flex-col gap-3 ${isHidden ? "opacity-60" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-800 bg-green-50 px-3 py-1 rounded-full">
                <Icon size={14} className="text-green-700" />
                {editMode && canManageTheme ? (
                  <EditableText
                    value={card.badge}
                    fallback={card.badge}
                    editMode={true}
                    onSave={(next) => updatePromoCard(index, "badge", next)}
                  />
                ) : (
                  card.badge
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#5f6f61]">Zaikest</span>
                {editMode && canManageTheme ? (
                  <button
                    type="button"
                    onClick={() =>
                      updatePromoCard(
                        index,
                        "enabled",
                        card.enabled === false ? true : false
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 hover:text-green-900"
                  >
                    {card.enabled === false ? <Eye size={12} /> : <EyeOff size={12} />}
                    {card.enabled === false ? "Show" : "Hide"}
                  </button>
                ) : null}
              </div>
            </div>
            <div>
              {editMode && canManageTheme ? (
                <EditableText
                  as="p"
                  className="font-semibold text-green-950"
                  value={card.title}
                  fallback={card.title}
                  editMode={true}
                  onSave={(next) => updatePromoCard(index, "title", next)}
                />
              ) : (
                <p className="font-semibold text-green-950">{card.title}</p>
              )}
              {editMode && canManageTheme ? (
                <EditableText
                  as="p"
                  className="text-sm text-[#5f6f61]"
                  value={card.text}
                  fallback={card.text}
                  editMode={true}
                  onSave={(next) => updatePromoCard(index, "text", next)}
                  multiline
                />
              ) : (
                <p className="text-sm text-[#5f6f61]">{card.text}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
