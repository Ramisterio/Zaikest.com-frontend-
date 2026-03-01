"use client";

import { useState, useEffect, ChangeEvent, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import { sanitizeNumber, sanitizeText } from "../../../utils/sanitize";
import { API_BASE } from "../../../config/env";
import { normalizeRemoteUrl, resolveAssetUrl } from "../../../utils/assetUrl";

type Category = {
  _id: string;
  name: string;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  stock: number;
  category: Category;
  image?: string;
  imageUrl?: string;
};

type AdminImageProps = {
  src?: string;
  alt?: string;
  className?: string;
};

const PRODUCTS_API = `${API_BASE}/v1/products`;
const CATEGORIES_API = `${API_BASE}/v1/categories`;

const AdminImage = ({ src, alt = "", className = "" }: AdminImageProps) => {
  const normalizedSrc = normalizeRemoteUrl(src || "");
  const [imageSrc, setImageSrc] = useState(normalizedSrc);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setImageSrc(normalizedSrc);
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, [normalizedSrc]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  if (!imageSrc) {
    return <div className={`${className} bg-gray-100`} aria-hidden />;
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      <Image
        src={imageSrc}
        alt={alt}
        fill
        unoptimized
        sizes="(max-width: 768px) 80px, 40px"
        className="object-cover"
        onError={async () => {
          if (!objectUrlRef.current && normalizedSrc) {
            try {
              const res = await fetch(normalizedSrc, { credentials: "include" });
              if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                objectUrlRef.current = url;
                setImageSrc(url);
                return;
              }
            } catch {
              // fall through
            }
          }
          setImageSrc("");
        }}
      />
    </div>
  );
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);
  const [newProductStock, setNewProductStock] = useState(0);
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductImage, setNewProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  /* ================= MESSAGE ================= */
  const showMsg = (text: string, type: "error" | "success" = "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  /* ================= FETCH ================= */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [p, c] = await Promise.all([
        fetch(PRODUCTS_API, { credentials: "include" }),
        fetch(CATEGORIES_API, { credentials: "include" }),
      ]);
      setProducts((await p.json()).data || []);
      setCategories((await c.json()).data || []);
    } catch {
      showMsg("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ================= IMAGE ================= */
  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewProductImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ================= ADD ================= */
  const handleAdd = async () => {
    if (!newProductName || !newProductCategory || newProductPrice <= 0)
      return showMsg("Fill all required fields");

    try {
      const fd = new FormData();
      fd.append("name", newProductName);
      fd.append("price", newProductPrice.toString());
      fd.append("stock", newProductStock.toString());
      fd.append("category", newProductCategory);
      if (newProductImage) fd.append("image", newProductImage);

      const res = await fetch(PRODUCTS_API, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message);

      setProducts((prev) => [json.data, ...prev]);
      showMsg("Product added", "success");
      setShowForm(false);

      // reset
      setNewProductName("");
      setNewProductPrice(0);
      setNewProductStock(0);
      setNewProductCategory("");
      setNewProductImage(null);
      setImagePreview("");
    } catch (e: any) {
      showMsg(e.message);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (product: Product) => {
    setEditingId(product._id);
    setShowForm(true);
    setNewProductName(product.name || "");
    setNewProductPrice(product.price || 0);
    setNewProductStock(product.stock || 0);
    setNewProductCategory(product.category?._id || "");
    setNewProductImage(null);
    const preview = normalizeRemoteUrl(
      product.imageUrl || resolveAssetUrl(product.image, "")
    );
    setImagePreview(preview);
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!newProductName || !newProductCategory || newProductPrice <= 0)
      return showMsg("Fill all required fields");

    try {
      const fd = new FormData();
      fd.append("name", newProductName);
      fd.append("price", newProductPrice.toString());
      fd.append("stock", newProductStock.toString());
      fd.append("category", newProductCategory);
      if (newProductImage) fd.append("image", newProductImage);

      const res = await fetch(`${PRODUCTS_API}/${editingId}`, {
        method: "PUT",
        credentials: "include",
        body: fd,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update product");

      setProducts((prev) =>
        prev.map((p) => (p._id === editingId ? json.data || p : p))
      );
      showMsg("Product updated", "success");
      setEditingId(null);
      setShowForm(false);
      setNewProductName("");
      setNewProductPrice(0);
      setNewProductStock(0);
      setNewProductCategory("");
      setNewProductImage(null);
      setImagePreview("");
    } catch (e: any) {
      showMsg(e.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setNewProductName("");
    setNewProductPrice(0);
    setNewProductStock(0);
    setNewProductCategory("");
    setNewProductImage(null);
    setImagePreview("");
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${PRODUCTS_API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || "Failed to delete product");
      setProducts((prev) => prev.filter((p) => p._id !== id));
      showMsg("Product deleted", "success");
    } catch (e: any) {
      showMsg(e.message);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return products.filter((p) => {
      const categoryOk =
        categoryFilter === "all" || p.category?._id === categoryFilter;
      const stockOk =
        stockFilter === "all" ||
        (stockFilter === "in" ? p.stock > 0 : p.stock <= 0);
      if (!categoryOk || !stockOk) return false;
      if (!q) return true;
      const haystack = `${p.name} ${p.category?.name || ""} ${p.price} ${p.stock}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [products, searchText, categoryFilter, stockFilter]);

  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = products.filter((p) => p.stock <= 0).length;
    return {
      total: products.length,
      outOfStock,
      lowStock,
      inventoryValue: totalValue,
    };
  }, [products]);

  if (loading) return <p className="text-center py-10">Loading…</p>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500">
              Manage catalog, stock levels, pricing, and product media.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                if (showForm && editingId) handleCancelEdit();
                else setShowForm(!showForm);
              }}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
            >
              {showForm ? "Close" : "+ Add Product"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-500">Total Products</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-red-600">Out Of Stock</div>
          <div className="mt-1 text-2xl font-bold text-red-700">{stats.outOfStock}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-amber-600">Low Stock</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{stats.lowStock}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-green-600">Inventory Value</div>
          <div className="mt-1 text-2xl font-bold text-green-700">PKR {stats.inventoryValue}</div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            value={searchText}
            onChange={(e) => setSearchText(sanitizeText(e.target.value))}
            placeholder="Search name, category, price, stock"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200 md:col-span-2"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
          >
            <option value="all">All stock</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
      </section>

      {/* MESSAGE */}
      {message && (
        <div
          className={`mb-4 p-3 rounded text-lg font-semibold ${
            message.type === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ADD FORM */}
      {showForm && (
        <div className="rounded-2xl border bg-white p-4 grid grid-cols-1 md:grid-cols-6 gap-4 shadow-sm">
          <input
            placeholder="Product name"
            className="border p-2 rounded md:col-span-2 w-full"
            value={newProductName}
            onChange={(e) => setNewProductName(sanitizeText(e.target.value))}
          />
          <input
            type="number"
            placeholder="Price"
            className="border p-2 rounded w-full"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(sanitizeNumber(e.target.value))}
          />
          <input
            type="number"
            placeholder="Stock"
            className="border p-2 rounded w-full"
            value={newProductStock}
            onChange={(e) => setNewProductStock(sanitizeNumber(e.target.value))}
          />
          <select
            className="border p-2 rounded w-full"
            value={newProductCategory}
            onChange={(e) => setNewProductCategory(e.target.value)}
          >
            <option value="">Category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input className="w-full" type="file" onChange={handleImage} />
          {imagePreview && (
            <AdminImage src={imagePreview} className="h-16 w-16 rounded object-cover" />
          )}
          <div className="md:col-span-6 flex gap-2">
            {editingId ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800"
                >
                  Update Product
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleAdd}
                className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800"
              >
                Save Product
              </button>
            )}
          </div>
        </div>
      )}

      {/* MOBILE CARDS */}
      <div className="grid gap-4 md:hidden">
        {filteredProducts.map((p) => (
          <div key={p._id} className="border rounded p-3 bg-white shadow">
            <div className="flex gap-3">
              <AdminImage
                src={normalizeRemoteUrl(
                  p.imageUrl || resolveAssetUrl(p.image, "/images/zaikest-logo.png")
                )}
                className="h-20 w-20 object-cover rounded"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.category?.name}</p>
                <p className="font-bold">${p.price}</p>
                <p className="text-sm">Stock: {p.stock}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="px-3 py-1 rounded bg-yellow-400 text-white text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="px-3 py-1 rounded bg-red-600 text-white text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="text-center">Price</th>
              <th className="text-center">Stock</th>
              <th className="text-center">Category</th>
              <th className="text-center">Image</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{p.name}</td>
                <td className="text-center">PKR {p.price}</td>
                <td className="text-center">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.stock <= 0
                        ? "bg-red-100 text-red-700"
                        : p.stock <= 5
                        ? "bg-amber-100 text-amber-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {p.stock}
                  </span>
                </td>
                <td className="text-center">{p.category?.name}</td>
                <td className="text-center">
                  {p.image && (
                    <AdminImage
                      src={normalizeRemoteUrl(
                        p.imageUrl || resolveAssetUrl(p.image, "/images/zaikest-logo.png")
                      )}
                      className="h-10 w-10 object-cover rounded"
                    />
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="px-3 py-1 rounded bg-yellow-400 text-white text-xs"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="px-3 py-1 rounded bg-red-600 text-white text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

