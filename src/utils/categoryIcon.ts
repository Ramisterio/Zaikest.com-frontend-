import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Banana,
  Beef,
  CakeSlice,
  Carrot,
  Coffee,
  Cookie,
  CookingPot,
  Drumstick,
  Egg,
  Fish,
  Flame,
  Grape,
  LeafyGreen,
  Milk,
  Salad,
  Soup,
  Tag,
  Wheat,
} from "lucide-react";

const includesAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword));

export const getCategoryIcon = (name?: string): LucideIcon => {
  const value = (name || "").toLowerCase();

  if (!value) return Tag;

  if (includesAny(value, ["dish", "dishes", "meal", "curry", "recipe"])) return Soup;
  if (includesAny(value, ["paste", "pastes", "pasta", "sauce", "chutney", "chutni"])) {
    return CookingPot;
  }
  if (includesAny(value, ["spice", "spices", "masala", "chili", "chilli", "pepper", "season"])) {
    return Flame;
  }
  if (includesAny(value, ["snack", "snacks", "chips", "cookie", "biscuit"])) return Cookie;
  if (includesAny(value, ["tea", "chai", "coffee", "beverage", "drink"])) return Coffee;
  if (includesAny(value, ["pickle", "pickles", "achar", "achaar"])) return Salad;
  if (includesAny(value, ["bread", "flour", "atta", "grain", "grains", "wheat", "rice"])) {
    return Wheat;
  }
  if (includesAny(value, ["milk", "dairy", "cheese", "butter", "yogurt", "cream"])) return Milk;
  if (includesAny(value, ["egg", "eggs"])) return Egg;
  if (includesAny(value, ["fish", "seafood", "prawn", "shrimp"])) return Fish;
  if (includesAny(value, ["chicken", "drumstick"])) return Drumstick;
  if (includesAny(value, ["meat", "beef", "mutton", "lamb"])) return Beef;
  if (includesAny(value, ["cake", "dessert", "sweet"])) return CakeSlice;
  if (includesAny(value, ["banana"])) return Banana;
  if (includesAny(value, ["grape"])) return Grape;
  if (includesAny(value, ["apple"])) return Apple;
  if (includesAny(value, ["carrot", "tomato", "onion", "potato", "vegetable", "vegetables", "veg", "leaf", "greens", "herb"])) {
    return LeafyGreen;
  }

  return Tag;
};
