"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Minus, Plus } from "lucide-react"
import { useCart } from "../context/CartContext"
import { normalizeRemoteUrl } from "../utils/assetUrl"
import { useTheme } from "../context/ThemeContext"

export type Product = {
  _id: string
  name: string
  price: number
  image?: string
  imageUrl?: string
  category?: string | { name?: string }
}

export default function ProductCard({
  product,
  onCategoryClick,
  compact,
  tone = "default",
  imageFit = "cover",
}: {
  product: Product
  onCategoryClick?: (category: string) => void
  compact?: boolean
  tone?: "default" | "gray"
  imageFit?: "cover" | "contain"
}) {
  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart()
  const { theme } = useTheme()
  const cartItem = cart.find((item) => item._id === product._id)
  const quantity = cartItem?.quantity ?? 0
  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || theme.content.productCardUncategorizedText || "Uncategorized"
  const primaryImageSrc = normalizeRemoteUrl(product.imageUrl)
  const fallbackImageSrc = primaryImageSrc
  const [imageSrc, setImageSrc] = useState(primaryImageSrc)
  const [usedFallback, setUsedFallback] = useState(false)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    setImageSrc(primaryImageSrc)
    setUsedFallback(false)
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }
  }, [primaryImageSrc, product._id])

  const handleIncrease = () => {
    if (quantity === 0) addToCart(product)
    else increaseQuantity(product._id)
  }

  const handleDecrease = () => {
    if (quantity <= 1) removeFromCart(product._id)
    else decreaseQuantity(product._id)
  }

  const isCompact = !!compact
  const cardToneClass =
    tone === "gray"
      ? "bg-[#f0f1f3] border border-[#d7dbe0] shadow-sm hover:shadow-lg"
      : "bg-white/90 border border-green-100 shadow-sm hover:shadow-xl"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className={`w-full max-w-[240px] mx-auto sm:max-w-none sm:mx-0 rounded-2xl overflow-hidden transition ${cardToneClass}`}
    >
      {/* Image */}
      <div className="relative group">
        <img
          src={imageSrc || undefined}
          alt={product.name}
          onError={async () => {
            const imageUrl = normalizeRemoteUrl(product.imageUrl)
            if (!objectUrl && imageUrl) {
              try {
                const res = await fetch(imageUrl, { credentials: "include" })
                if (res.ok) {
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  setObjectUrl(url)
                  setImageSrc(url)
                  return
                }
              } catch {
                // fall through to fallback handling
              }
            }
            if (!usedFallback && fallbackImageSrc !== imageSrc) {
              setImageSrc(fallbackImageSrc)
              setUsedFallback(true)
              return
            }
            setImageSrc("")
          }}
          className={`w-full ${imageFit === "contain" ? "object-contain bg-white" : "object-cover"} transition-transform duration-500 ${
            isCompact ? "h-32 sm:h-40 md:h-44" : "h-40 sm:h-48 md:h-52"
          }`}
        />

        {/* Category Badge */}
        <button
          onClick={() => onCategoryClick?.(categoryName)}
          className="absolute top-3 left-3 z-10 bg-white/90 text-green-900 text-xs px-3 py-1 rounded-full border border-green-100 hover:border-green-300 transition"
        >
          {categoryName}
        </button>
      </div>

      {/* Content */}
      <div className={`flex flex-col ${isCompact ? "p-3 gap-2" : "p-4 gap-3"}`}>
        <h2
          className={`font-semibold text-green-950 line-clamp-2 sm:line-clamp-1 ${
            isCompact ? "text-sm sm:text-base" : "text-base sm:text-lg"
          }`}
        >
          {product.name}
        </h2>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
          <p className={`text-green-900 font-bold ${isCompact ? "text-base sm:text-lg" : "text-lg sm:text-xl"}`}>
            PKR {product.price}
          </p>
          <span className="text-[11px] sm:text-xs text-[#5f6f61] bg-green-50 px-2 py-1 rounded-full w-fit">
            {theme.content.productCardReadyToShipText || "Ready to ship"}
          </span>
        </div>

        <div
          className="flex items-center justify-between flex-wrap gap-2"
        >
          <div className="flex items-center gap-2 order-1">
            <button
              onClick={handleDecrease}
              disabled={quantity === 0}
              className={`rounded-full border border-green-100 flex items-center justify-center transition ${
                isCompact ? "w-8 h-8" : "w-9 h-9"
              } ${
                quantity === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "hover:bg-green-600 hover:text-white text-green-900"
              }`}
              aria-label="Decrease quantity"
            >
              <Minus size={isCompact ? 14 : 16} />
            </button>
            <span className="min-w-[20px] text-center font-semibold text-green-950">
              {quantity}
            </span>
            <button
              onClick={handleIncrease}
              className={`rounded-full border border-green-100 flex items-center justify-center text-green-900 hover:bg-green-600 hover:text-white transition ${
                isCompact ? "w-8 h-8" : "w-9 h-9"
              }`}
              aria-label="Increase quantity"
            >
              <Plus size={isCompact ? 14 : 16} />
            </button>
          </div>

          <button
            onClick={handleIncrease}
            className={`inline-flex items-center justify-center text-center bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition whitespace-nowrap w-full order-2 ${
              isCompact ? "px-2 py-1 text-[11px] sm:text-xs" : "px-3 py-1.5 text-xs sm:text-sm"
            }`}
            aria-label="Add to cart"
          >
            {theme.content.productCardAddToCartText || "Add to Cart"}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

