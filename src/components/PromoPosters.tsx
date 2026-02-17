"use client";
import {
  Sparkles as LucideSparkles,
  ShieldCheck as LucideShieldCheck,
  Truck as LucideTruck,
  Tag as LucideTag,
} from "lucide-react";

type Poster = {
  title: string;
  text: string;
  badge: string;
  icon: React.ComponentType<{ size?: number; className?: string }>,
};

const posters: Poster[] = [
  {
    title: "Weekend Feast Packs",
    text: "Curated bundles with extra savings on family favorites.",
    badge: "Limited",
    icon: (props) => <LucideTag {...props} />,
  },
  {
    title: "Express Delivery",
    text: "Get hot dishes to your door in 20-30 minutes.",
    badge: "Fast",
   icon: (props) => <LucideTruck {...props} />,
  },
  {
    title: "Chef Specials",
    text: "New seasonal recipes, crafted fresh every day.",
    badge: "New",
    icon: (props) => <LucideSparkles {...props} />,
  },
  {
    title: "Quality Checked",
    text: "Every order is packed with care and verified.",
    badge: "Assured",
    icon: (props) => <LucideShieldCheck {...props} />,
  },
];

export default function PromoPosters() {
  return ( 
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {posters.map((poster) => {
        const Icon = poster.icon;
        return (
          <div
            key={poster.title}
            className="rounded-2xl border border-green-100 bg-white/90 shadow-sm p-4 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-green-800 bg-green-50 px-3 py-1 rounded-full">
                <Icon size={14} className="text-green-700" />
                {poster.badge}
              </span>
              <span className="text-xs text-[#5f6f61]">Zaikest</span>
            </div>
            <div>
              <p className="font-semibold text-green-950">{poster.title}</p>
              <p className="text-sm text-[#5f6f61]">{poster.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
