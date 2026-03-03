"use client";

import { useState, useEffect, useCallback } from "react";
import { sanitizeText } from "../../../utils/sanitize";
import { API_BASE } from "../../../config/env";

type Category = {
  _id: string;
  name: string;
};

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL = `${API_BASE}/v1/categories`;

  /* ================= FETCH CATEGORIES ================= */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(API_URL, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch categories");

      const json = await res.json();
      setCategories(json.data || []);
    } catch (err) {
      console.error("Fetch categories error:", err);
      setError("Failed to fetch categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ================= ADD CATEGORY ================= */
  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    try {
      setActionLoading(true);
      setError("");
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newCategory }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to add category");
      }

      setNewCategory("");
      fetchCategories();
    } catch (err: any) {
      console.error("Add category error:", err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= DELETE CATEGORY ================= */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      setActionLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to delete category");
      }
      fetchCategories();
    } catch (err: any) {
      console.error("Delete category error:", err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* ================= EDIT CATEGORY ================= */
  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSave = async () => {
    if (!editingName.trim() || !editingId) return;
    try {
      setActionLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editingName }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || "Failed to update category");
      }

      setEditingId(null);
      setEditingName("");
      fetchCategories();
    } catch (err: any) {
      console.error("Update category error:", err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p>Loading categories...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Category Management</h1>

      {/* ERROR MESSAGE */}
      {error && <p className="text-red-600 mb-4 font-semibold">{error}</p>}

      {/* ADD CATEGORY */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <input
          type="text"
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(sanitizeText(e.target.value))}
          className="border p-2 rounded w-full"
        />
        <button
          onClick={handleAdd}
          disabled={actionLoading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Add Category
        </button>
      </div>

      {/* CATEGORY TABLE */}
      <table className="w-full border shadow">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">#</th>
            <th className="p-2 border text-left">Name</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center p-4 text-gray-500">
                No categories found
              </td>
            </tr>
          )}

          {categories.map((category, idx) => (
            <tr key={category._id}>
              <td className="p-2 border">{idx + 1}</td>
              <td className="p-2 border">
                {editingId === category._id ? (
                  <input
                    value={editingName}
                    onChange={(e) => setEditingName(sanitizeText(e.target.value))}
                    className="border p-1 w-full"
                  />
                ) : (
                  category.name
                )}
              </td>
              <td className="p-2 border">
                <div className="flex gap-2 justify-center">
                {editingId === category._id ? (
                  <button
                    onClick={handleSave}
                    disabled={actionLoading}
                    className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(category._id, category.name)}
                    className="bg-yellow-400 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(category._id)}
                  disabled={actionLoading}
                  className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-50"
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
  );
}

