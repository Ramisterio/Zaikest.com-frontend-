"use client";

import { useState, useEffect, ChangeEvent } from "react";
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

const AdminImage = ({ src, alt = "", className = "" }: AdminImageProps) => {
  const normalizedSrc = normalizeRemoteUrl(src || "");
  const [imageSrc, setImageSrc] = useState(normalizedSrc);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    setImageSrc(normalizedSrc);
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
  }, [normalizedSrc]);

  return (
    <img
      src={imageSrc || undefined}
      alt={alt}
      className={className}
      onError={async () => {
        if (!objectUrl && normalizedSrc) {
          try {
            const res = await fetch(normalizedSrc, { credentials: "include" });
            if (res.ok) {
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              setObjectUrl(url);
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

  const API_URL = `${API_BASE}/v1/products`;
  const CATEGORY_API = `${API_BASE}/v1/categories`;

  /* ================= MESSAGE ================= */
  const showMsg = (text: string, type: "error" | "success" = "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  /* ================= FETCH ================= */
  useEffect(() => {
    (async () => {
      try {
        const [p, c] = await Promise.all([
          fetch(API_URL, { credentials: "include" }),
          fetch(CATEGORY_API, { credentials: "include" }),
        ]);
        setProducts((await p.json()).data || []);
        setCategories((await c.json()).data || []);
      } catch {
        showMsg("Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

      const res = await fetch(API_URL, {
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

      const res = await fetch(`${API_URL}/${editingId}`, {
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
      const res = await fetch(`${API_URL}/${id}`, {
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

  if (loading) return <p className="text-center py-10">Loading…</p>;

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => {
            if (showForm && editingId) handleCancelEdit();
            else setShowForm(!showForm);
          }}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          {showForm ? "Close" : "+ Add Product"}
        </button>
      </div>

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
        <div className="bg-white border rounded p-4 mb-6 grid grid-cols-1 md:grid-cols-6 gap-3 shadow">
          <input
            placeholder="Product name"
            className="border p-2 rounded md:col-span-2"
            value={newProductName}
            onChange={(e) => setNewProductName(sanitizeText(e.target.value))}
          />
          <input
            type="number"
            placeholder="Price"
            className="border p-2 rounded"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(sanitizeNumber(e.target.value))}
          />
          <input
            type="number"
            placeholder="Stock"
            className="border p-2 rounded"
            value={newProductStock}
            onChange={(e) => setNewProductStock(sanitizeNumber(e.target.value))}
          />
          <select
            className="border p-2 rounded"
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
          <input type="file" onChange={handleImage} />
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
        {products.map((p) => (
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
      <div className="hidden md:block overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Category</th>
              <th>Image</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t hover:bg-gray-50">
                <td className="p-3">{p.name}</td>
                <td>${p.price}</td>
                <td>{p.stock}</td>
                <td>{p.category?.name}</td>
                <td>
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

