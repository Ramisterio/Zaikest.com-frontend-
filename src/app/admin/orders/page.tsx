"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE } from "../../../config/env";

type OrderItem = {
  name?: string;
  quantity?: number;
  price?: number;
};

type Order = {
  _id?: string;
  orderId?: string;
  status?: string;
  orderStatus?: string;
  total?: number;
  totalAmount?: number;
  subtotal?: number;
  deliveryFee?: number;
  createdAt?: string;
  orderDate?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  items?: OrderItem[];
};

const ORDERS_API = `${API_BASE}/v1/admin/orders`;
const STATUS_OPTIONS = ["Pending", "Shipped", "Delivered"];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({});

  const canUpdateStatus =
    user?.role === "admin" || (user?.permissions || []).includes("orders:update");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(ORDERS_API, { credentials: "include" });
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setError(json?.message || "Failed to load orders.");
          return;
        }
        const json = await res.json();
        const extracted = json?.orders || json?.data?.orders || json?.data || [];
        setOrders(Array.isArray(extracted) ? extracted : [extracted]);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    if (!canUpdateStatus) {
      setError("You do not have permission to update orders.");
      return;
    }
    try {
      setSavingId(orderId);
      setError("");
      const res = await fetch(`${API_BASE}/v1/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderStatus: status.toUpperCase() }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Failed to update status");
      }
      setOrders((prev) =>
        prev.map((order) => {
          const id = order._id || order.orderId;
          return id === orderId
            ? { ...order, status, orderStatus: status.toUpperCase() }
            : order;
        })
      );
    } catch (err: any) {
      setError(err.message || "Failed to update order status.");
    } finally {
      setSavingId(null);
    }
  };

  const rows = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        createdAtLabel: order.orderDate
          ? new Date(order.orderDate).toLocaleString()
          : order.createdAt
          ? new Date(order.createdAt).toLocaleString()
          : "—",
        statusLabel:
          order.orderStatus?.toLowerCase() === "pending"
            ? "Pending"
            : order.orderStatus?.toLowerCase() === "shipped"
            ? "Shipped"
            : order.orderStatus?.toLowerCase() === "delivered"
            ? "Delivered"
            : order.status || "Pending",
        subtotalLabel:
          order.subtotal ??
          (order.items || []).reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
            0
          ),
        deliveryLabel: order.deliveryFee ?? 0,
        totalLabel:
          order.totalAmount ??
          order.total ??
          ((order.subtotal ??
            (order.items || []).reduce(
              (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
              0
            )) + (order.deliveryFee ?? 0)),
      })),
    [orders]
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders Management</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-center py-10">Loading orders…</p>
      ) : rows.length === 0 ? (
        <p className="text-center py-10 text-gray-500">No orders found.</p>
      ) : (
        <div className="overflow-x-auto border rounded bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Order</th>
                <th className="text-left">Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order._id || order.orderId} className="border-t">
                  <td className="p-3 font-semibold">
                    #{(order.orderId || order._id || "ORDER").slice(-6)}
                  </td>
                  <td>
                    <div className="text-sm font-semibold">
                      {order.customer?.name || "Customer"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customer?.phone || "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.customer?.address || "—"}
                    </div>
                  </td>
                  <td className="text-center">
                    {(order.items || []).reduce(
                      (sum, item) => sum + (item.quantity || 0),
                      0
                    )}
                  </td>
                  <td className="text-center">
                    <div className="leading-tight">
                      <div className="text-xs text-gray-500">Sub: PKR {order.subtotalLabel}</div>
                      <div className="text-xs text-gray-500">Del: PKR {order.deliveryLabel}</div>
                      <div className="font-semibold">PKR {order.totalLabel}</div>
                    </div>
                  </td>
                  <td className="text-center">
                    <select
                      value={
                        pendingStatus[order._id || order.orderId || ""] ??
                        order.statusLabel ??
                        "Pending"
                      }
                      onChange={(e) =>
                        setPendingStatus((prev) => ({
                          ...prev,
                          [order._id || order.orderId || ""]: e.target.value,
                        }))
                      }
                      disabled={!canUpdateStatus || savingId === (order._id || order.orderId)}
                      className="border rounded px-2 py-1"
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-center text-xs text-gray-500">
                    {order.createdAtLabel}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          updateStatus(
                            order._id || order.orderId || "",
                            pendingStatus[order._id || order.orderId || ""] ??
                              order.statusLabel ??
                              "Pending"
                          )
                        }
                        disabled={
                          !canUpdateStatus || savingId === (order._id || order.orderId)
                        }
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-60"
                      >
                        Update
                      </button>
                      {savingId === (order._id || order.orderId) && (
                        <span className="text-xs text-gray-500">Updating…</span>
                      )}
                    </div>
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
