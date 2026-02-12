"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useCart } from "../../../../context/CartContext"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { API_BASE } from "../../../../config/env"
import { normalizeRemoteUrl } from "../../../../utils/assetUrl"

interface Product {
  _id: string
  name: string
  price: number
  image?: string
  imageUrl?: string
  description?: string
}

export default function ProductDetailPage() {
  const { slug } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageSrc, setImageSrc] = useState("/images/zaikest-logo.png")
  const [usedFallback, setUsedFallback] = useState(false)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  const PRODUCTS_API = `${API_BASE}/v1/products`

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await fetch(PRODUCTS_API, {
          credentials: "include",
        })
        const json = await res.json()
        const items: Product[] = json.data || []
        const found = items.find((p) => p._id === slug)
        if (found) {
          setProduct(found)
          const resolved = normalizeRemoteUrl(found.imageUrl)
          setImageSrc(resolved)
          setUsedFallback(false)
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
            setObjectUrl(null)
          }
        }
      } catch {
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    if (slug) fetchProduct()
  }, [slug])

  if (loading) {
    return (
      <div className="py-24 text-center text-[#5f6f61]">Loading product...</div>
    )
  }

  if (!product) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-4xl font-bold mb-4">Product not found</h1>
        <Link href="/products" className="text-green-700 hover:text-green-800 transition">
          Back to products
        </Link>
      </div>
    )
  }

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white/90 rounded-[28px] p-8 shadow-xl border border-green-100"
        >
          <img
            src={imageSrc || undefined}
            alt={product.name}
            onError={async () => {
              if (!usedFallback) {
                const imageUrl = normalizeRemoteUrl(product.imageUrl)
                if (!objectUrl && imageUrl) {
                  try {
                    const res = await fetch(imageUrl, {
                      credentials: "include",
                    })
                    if (res.ok) {
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      setObjectUrl(url)
                      setImageSrc(url)
                      return
                    }
                  } catch {
                    // fall through to clearing the image
                  }
                }
                setUsedFallback(true)
              }
              setImageSrc("")
            }}
            className="w-full rounded-2xl object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <p className="text-sm uppercase tracking-[0.2em] text-green-700 mb-3">Zaikest special</p>
          <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 text-green-950">
            {product.name}
          </h1>

          <p className="text-3xl font-semibold text-green-900 mb-6">
            PKR {product.price}
          </p>

          <p className="text-[#5f6f61] leading-relaxed mb-8 max-w-lg">
            {product.description || "Freshly prepared and ready to deliver."}
          </p>

          <ul className="space-y-3 text-sm text-green-900 mb-10">
            {[
              "Handmade with authentic spices",
              "Delivered fresh and sealed",
              "Ready in 20-30 minutes",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-800">
                  <Check size={14} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => addToCart(product)}
              className="bg-green-700 text-white px-10 py-4 rounded-full font-semibold shadow-lg hover:bg-green-800 transition-all"
            >
              Add to Cart
            </motion.button>

            <Link
              href="/products"
              className="text-green-700 hover:text-green-800 transition font-semibold"
            >
              Back to products
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
