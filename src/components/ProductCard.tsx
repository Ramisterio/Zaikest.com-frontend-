"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Minus, Plus } from "lucide-react"
import { useCart } from "../context/CartContext"
import { normalizeRemoteUrl } from "../utils/assetUrl"

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
}: {
  product: Product
  onCategoryClick?: (category: string) => void
  compact?: boolean
}) {
  const { cart, addToCart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart()
  const cartItem = cart.find((item) => item._id === product._id)
  const quantity = cartItem?.quantity ?? 0
  const categoryName =
    typeof product.category === "string"
      ? product.category
      : product.category?.name || "Uncategorized"
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="bg-white/90 rounded-2xl overflow-hidden border border-green-100 shadow-sm hover:shadow-xl transition"
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
          className={`w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isCompact ? "h-40" : "h-48"
          }`}
        />

        {/* Category Badge */}
        <button
          onClick={() => onCategoryClick?.(categoryName)}
          className="absolute top-3 left-3 bg-white/90 text-green-900 text-xs px-3 py-1 rounded-full border border-green-100 hover:border-green-300 transition"
        >
          {categoryName}
        </button>
      </div>

      {/* Content */}
      <div className={`flex flex-col ${isCompact ? "p-3 gap-2" : "p-4 gap-3"}`}>
        <h2
          className={`font-semibold text-green-950 line-clamp-1 ${
            isCompact ? "text-sm" : "text-base"
          }`}
        >
          {product.name}
        </h2>

        <div className="flex items-center justify-between">
          <p className={`text-green-900 font-bold ${isCompact ? "text-base" : "text-lg"}`}>
            PKR {product.price}
          </p>
          <span className="text-xs text-[#5f6f61] bg-green-50 px-2 py-1 rounded-full">
            Ready to ship
          </span>
        </div>

        <div
          className={`flex items-center justify-between ${
            isCompact ? "gap-2 flex-nowrap" : "gap-3"
          }`}
        >
          <div className="flex items-center gap-2">
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
            className={`inline-flex items-center justify-center text-center bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition whitespace-nowrap ${
              isCompact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
            }`}
            aria-label="Add to cart"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  )
}

