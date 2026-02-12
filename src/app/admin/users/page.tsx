"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE } from "../../../config/env";

type User = {
  _id?: string;
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  role?: string | { name?: string; permissions?: string[] };
  permissions?: string[];
  phone?: string;
  createdAt?: string;
};

const USERS_API = `${API_BASE}/v1/admin/users`;
const CACHE_KEY = "admin_users_cache_v1";
const CACHE_TTL_MS = 60_000;

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (authLoading || hasLoadedRef.current) return;
        const canViewUsers =
          user?.role === "admin" ||
          (user?.permissions || []).includes("VIEW_USERS");
        if (!canViewUsers) {
          setError("Permission denied: VIEW_USERS");
          setUsers([]);
          return;
        }
        hasLoadedRef.current = true;
        setLoading(true);
        setError("");

        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { ts: number; users: User[] };
          if (Date.now() - parsed.ts < CACHE_TTL_MS) {
            setUsers(parsed.users);
            setLoading(false);
            return;
          }
        }

        const res = await fetch(USERS_API, { credentials: "include" });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setError(json?.message || "Failed to load users.");
          return;
        }
        const json = await res.json();
        const extracted = json?.users || json?.data?.users || json?.data || [];
        const nextUsers = Array.isArray(extracted) ? extracted : [extracted];
        const normalized = nextUsers.map((item: User) => ({
          ...item,
          role:
            typeof item.role === "string" ? item.role : item.role?.name || "user",
          permissions:
            item.permissions ||
            (typeof item.role !== "string" ? item.role?.permissions : []) ||
            [],
        }));
        setUsers(normalized);
        sessionStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ts: Date.now(), users: normalized })
        );
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [authLoading, user]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-center py-10">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-center py-10 text-gray-500">No users found.</p>
      ) : (
        <div className="overflow-x-auto border rounded bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="text-left">Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id || u.id || u.userId} className="border-t">
                  <td className="p-3 font-semibold">{u.name || "--"}</td>
                  <td>{u.email || "--"}</td>
                  <td className="text-center">{u.role || "user"}</td>
                  <td className="text-center">{u.phone || "--"}</td>
                  <td className="text-center text-xs text-gray-500">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleString()
                      : "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
