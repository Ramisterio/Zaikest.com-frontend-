"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tag } from "lucide-react"
import ProductCard from "../../../components/ProductCard"
import { useSearchParams } from "next/navigation"
import PromoPosters from "../../../components/PromoPosters"
import { getCategoryIcon } from "../../../utils/categoryIcon"
import { API_BASE } from "../../../config/env"
import { normalizeRemoteUrl, resolveAssetUrl } from "../../../utils/assetUrl"

type Category = { _id: string; name: string }
type Product = {
  _id: string
  name: string
  price: number
  image?: string
  imageUrl?: string
  category?: Category
  description?: string
}

const PRODUCTS_API = `${API_BASE}/v1/products`
const CATEGORIES_API = `${API_BASE}/v1/categories`

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>(["All"])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const searchQuery = (searchParams.get("search") || "").trim()

  useEffect(() => {
    const categoryParam = searchParams.get("category")
    if (categoryParam && categories.includes(categoryParam)) {
      setSelectedCategory(categoryParam)
    } else if (categoryParam) {
      setSelectedCategory("All")
    }
  }, [searchParams, categories])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError("")
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(PRODUCTS_API, { credentials: "include" }),
          fetch(CATEGORIES_API, { credentials: "include" }),
        ])

        const productsJson = await productsRes.json()
        const categoriesJson = await categoriesRes.json()

        const fetchedProducts: Product[] = productsJson.data || []
        const fetchedCategories: Category[] = categoriesJson.data || []

        setProducts(fetchedProducts)
        setCategories(["All", ...fetchedCategories.map((c) => c.name)])
      } catch (e) {
        setError("Failed to load products. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const productsWithImages = useMemo(
    () =>
      products.map((p) => ({
        ...p,
        imageUrl: normalizeRemoteUrl(p.imageUrl || resolveAssetUrl(p.image, "")),
      })),
    [products]
  )

  const searchFilteredProducts = productsWithImages.filter((p) => {
    const searchValue = searchQuery.toLowerCase()
    const haystack = [p.name, p.category?.name, p.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return searchValue ? haystack.includes(searchValue) : true
  })

  const filteredProducts =
    selectedCategory === "All"
      ? searchFilteredProducts
      : searchFilteredProducts.filter((p) => p.category?.name === selectedCategory)

  const categoriesToRender = categories.filter((cat) => cat !== "All")

  const groupedProducts = categoriesToRender.map((cat) => ({
    category: cat,
    products: searchFilteredProducts.filter((p) => p.category?.name === cat),
  }))

  return (
    <main className="py-12 max-w-7xl mx-auto px-4">
      <div className="relative overflow-hidden rounded-3xl border border-green-200 bg-white mb-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 animate-hero-pan"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=2000&q=80)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />
        <div className="relative text-center px-6 py-12 sm:px-10 sm:py-16 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow">
            Zaikest Grocery
          </h1>
          <p className="text-white/90 text-lg font-semibold drop-shadow">
            Shop category wise for dishes, pastes, spices, snacks, and pantry staples.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {[...categories].sort((a, b) => {
            if (a === "All") return -1
            if (b === "All") return 1
            return 0
          }).map((cat) => {
            const Icon = getCategoryIcon(cat) || Tag
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-5 py-2 rounded-full font-semibold transition border inline-flex items-center gap-2
                  ${
                    selectedCategory === cat
                      ? "bg-green-700 text-white border-green-700"
                      : "bg-white text-green-900 border-green-100 hover:border-green-300"
                  }
                `}
              >
                <Icon size={16} />
                {cat}
              </button>
            )
          })}
        </div>
      </motion.div>

      <div className="mb-10">
        <PromoPosters />
      </div>

      {loading ? (
        <p className="text-center text-[#5f6f61] mt-10">Loading products...</p>
      ) : error ? (
        <p className="text-center text-green-600 mt-10">{error}</p>
      ) : selectedCategory === "All" ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="all-categories"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            {groupedProducts.map((group) =>
              group.products.length === 0 ? null : (
                <section key={group.category}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-green-950">
                      {group.category}
                    </h2>
                    <button
                      onClick={() => setSelectedCategory(group.category)}
                      className="text-sm font-semibold text-green-700 hover:text-green-800"
                    >
                      View all
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
                    {group.products.map((product) => (
                      <div key={product._id} className="w-full max-w-[240px]">
                        <ProductCard
                          product={product}
                          onCategoryClick={(cat) => setSelectedCategory(cat)}
                          compact
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center"
          >
            {filteredProducts.map((product) => (
              <div key={product._id} className="w-full max-w-[240px]">
                <ProductCard
                  product={product}
                  onCategoryClick={(cat) => setSelectedCategory(cat)}
                  compact
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {!loading && !error && (
        <>
          {selectedCategory === "All" && filteredProducts.length === 0 && (
            <p className="text-center text-[#5f6f61] mt-10">
              {searchQuery
                ? `No products found for "${searchQuery}".`
                : "No products found."}
            </p>
          )}
          {selectedCategory !== "All" && filteredProducts.length === 0 && (
            <p className="text-center text-[#5f6f61] mt-10">
              {searchQuery
                ? `No products found for "${searchQuery}".`
                : "No products found in this category."}
            </p>
          )}
        </>
      )}
    </main>
  )
}

