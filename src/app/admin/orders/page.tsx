"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { API_BASE, SITE_ORIGIN } from "../../../config/env";
import { downloadOrderSlipPdf } from "../../../utils/orderSlip";

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
  summaryUrl?: string;
  summarySlipUrl?: string;
  receiptUrl?: string;
  invoiceUrl?: string;
  downloadUrl?: string;
  summarySlip?: {
    summarySlipUrl?: string;
    summaryUrl?: string;
    receiptUrl?: string;
    invoiceUrl?: string;
    downloadUrl?: string;
    url?: string;
    fileUrl?: string;
  };
  summary?: {
    summarySlipUrl?: string;
    summaryUrl?: string;
    receiptUrl?: string;
    invoiceUrl?: string;
    downloadUrl?: string;
    url?: string;
    fileUrl?: string;
  };
  receipt?: any;
  invoice?: {
    summarySlipUrl?: string;
    summaryUrl?: string;
    receiptUrl?: string;
    invoiceUrl?: string;
    downloadUrl?: string;
    url?: string;
    fileUrl?: string;
  };
};

const ORDERS_API = `${API_BASE}/v1/admin/orders`;
const STATUS_OPTIONS = ["Pending", "Shipped", "Delivered", "Cancelled"];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resolvingLinkId, setResolvingLinkId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [pendingStatus, setPendingStatus] = useState<Record<string, string>>({});
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const canUpdateStatus =
    user?.role === "admin" || (user?.permissions || []).includes("orders:update");

  const fetchOrders = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    if (!canUpdateStatus) {
      setError("You do not have permission to update orders.");
      return;
    }
    try {
      setSavingId(orderId);
      setError("");
      setSuccessMsg("");
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
      setSuccessMsg(`Order updated to ${status}.`);
      window.setTimeout(() => setSuccessMsg(""), 2500);
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
          : "--",
        statusLabel:
          order.orderStatus?.toLowerCase() === "pending"
            ? "Pending"
            : order.orderStatus?.toLowerCase() === "shipped"
            ? "Shipped"
            : order.orderStatus?.toLowerCase() === "delivered"
            ? "Delivered"
            : order.orderStatus?.toLowerCase() === "cancelled"
            ? "Cancelled"
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

  const pickFirstString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }
    return "";
  };

  const getDownloadUrl = (order: Order) =>
    pickFirstString(
      order.summarySlipUrl,
      order.summaryUrl,
      order.receiptUrl,
      order.invoiceUrl,
      order.downloadUrl,
      order.summarySlip?.summarySlipUrl,
      order.summarySlip?.summaryUrl,
      order.summarySlip?.receiptUrl,
      order.summarySlip?.invoiceUrl,
      order.summarySlip?.downloadUrl,
      order.summarySlip?.url,
      order.summarySlip?.fileUrl,
      order.summary?.summarySlipUrl,
      order.summary?.summaryUrl,
      order.summary?.receiptUrl,
      order.summary?.invoiceUrl,
      order.summary?.downloadUrl,
      order.summary?.url,
      order.summary?.fileUrl,
      order.receipt?.summarySlipUrl,
      order.receipt?.summaryUrl,
      order.receipt?.receiptUrl,
      order.receipt?.invoiceUrl,
      order.receipt?.downloadUrl,
      order.receipt?.url,
      order.receipt?.fileUrl,
      order.invoice?.summarySlipUrl,
      order.invoice?.summaryUrl,
      order.invoice?.receiptUrl,
      order.invoice?.invoiceUrl,
      order.invoice?.downloadUrl,
      order.invoice?.url,
      order.invoice?.fileUrl
    );

  const extractDownloadFromPayload = (payload: any) => {
    const slip = payload?.summarySlip || payload?.summary || payload?.receipt || payload?.invoice || {};
    const direct = pickFirstString(
      payload?.summarySlipUrl,
      payload?.summaryUrl,
      payload?.receiptUrl,
      payload?.invoiceUrl,
      payload?.downloadUrl,
      slip?.summarySlipUrl,
      slip?.summaryUrl,
      slip?.receiptUrl,
      slip?.invoiceUrl,
      slip?.downloadUrl,
      slip?.url,
      slip?.fileUrl
    );
    return direct;
  };

  const resolveDownloadUrl = async (order: (typeof rows)[number]) => {
    const direct = getDownloadUrl(order);
    if (direct) return direct;

    const idCandidate = (order.orderId || order._id || "").trim();
    const phone = order.customer?.phone?.trim();
    if (!phone) return "";

    const findInList = (list: any[]) => {
      if (!Array.isArray(list) || list.length === 0) return "";
      if (idCandidate) {
        const exact = list.find((candidate: any) => {
          const candidateId = String(candidate?.orderId || candidate?._id || "");
          return candidateId === idCandidate;
        });
          const exactUrl = extractDownloadFromPayload(exact);
        if (exactUrl) return exactUrl;
      }
      for (const candidate of list) {
        const url = extractDownloadFromPayload(candidate);
        if (url) return url;
      }
      return "";
    };

    try {
      setResolvingLinkId(idCandidate);
      const withIdParams = new URLSearchParams({ phone });
      if (idCandidate) withIdParams.set("orderId", idCandidate);
      const resWithId = await fetch(`${API_BASE}/v1/orders/track?${withIdParams.toString()}`, {
        credentials: "include",
      });

      if (resWithId.ok) {
        const json = await resWithId.json().catch(() => null);
        const rawList = json?.data || json?.orders || [];
        const list = Array.isArray(rawList) ? rawList : [rawList];
        const foundWithId = findInList(list);
        if (foundWithId) return foundWithId;
      }

      const phoneOnlyParams = new URLSearchParams({ phone });
      const resPhoneOnly = await fetch(`${API_BASE}/v1/orders/track?${phoneOnlyParams.toString()}`, {
        credentials: "include",
      });
      if (!resPhoneOnly.ok) return "";

      const phoneOnlyJson = await resPhoneOnly.json().catch(() => null);
      const phoneOnlyRawList = phoneOnlyJson?.data || phoneOnlyJson?.orders || [];
      const phoneOnlyList = Array.isArray(phoneOnlyRawList) ? phoneOnlyRawList : [phoneOnlyRawList];
      return findInList(phoneOnlyList);
    } catch {
      return "";
    } finally {
      setResolvingLinkId((prev) => (prev === idCandidate ? null : prev));
    }
  };

  const handleDownload = async (order: (typeof rows)[number]) => {
    const id = order.orderId || order._id || "summary";
    if (id && id !== "summary") {
      try {
        await downloadOrderSlipPdf(id, undefined, true);
        return;
      } catch {
        // Continue to backend direct-link fallback below.
      }
    }

    const url = await resolveDownloadUrl(order);
    if (!url) return;
    try {
      const res = await fetch(url, { credentials: "include" });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("pdf")) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `order-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch {
      // fall through to direct download
    }

    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = `order-${id}`;
    a.click();
  };

  const copyOrderDetails = async (order: (typeof rows)[number]) => {
    const id = order._id || order.orderId || "";
    const resolvedDownloadUrl = await resolveDownloadUrl(order);
    const orderPhone = (order.customer?.phone || "").trim();
    const publicSiteOrigin = (
      SITE_ORIGIN || (typeof window !== "undefined" ? window.location.origin : "")
    ).replace(/\/+$/, "");
    const publicOrdersSlipUrl =
      orderPhone && id
        ? `${publicSiteOrigin}/orders?phone=${encodeURIComponent(orderPhone)}&orderId=${encodeURIComponent(id)}&download=slip`
        : "";

    const links = [
      ["Summary slip", order.summarySlipUrl],
      ["Summary", order.summaryUrl],
      ["Receipt", order.receiptUrl],
      ["Invoice", order.invoiceUrl],
      ["Download", order.downloadUrl],
      ["Download slip", publicOrdersSlipUrl || resolvedDownloadUrl],
    ]
      .filter(([, value], index, arr) => Boolean(value) && arr.findIndex(([, v]) => v === value) === index)
      .map(([label, value]) => `${label}: ${value}`);

    const itemsText =
      order.items && order.items.length > 0
        ? order.items
            .map((item, idx) => {
              const qty = item.quantity ?? 0;
              const price = item.price ?? 0;
              return `${idx + 1}. ${item.name || "Item"} | Qty: ${qty} | Price: PKR ${price} | Line Total: PKR ${qty * price}`;
            })
            .join("\n")
        : "No items";

    const text = [
      "Order Details",
      `Order ID: ${order.orderId || order._id || "N/A"}`,
      `Status: ${order.statusLabel || "Pending"}`,
      `Date: ${order.createdAtLabel || "N/A"}`,
      "",
      "Customer",
      `Name: ${order.customer?.name || "N/A"}`,
      `Phone: ${order.customer?.phone || "N/A"}`,
      `Address: ${order.customer?.address || "N/A"}`,
      `City: ${order.customer?.city || "N/A"}`,
      "",
      "Amounts",
      `Subtotal: PKR ${order.subtotalLabel ?? 0}`,
      `Delivery: PKR ${order.deliveryLabel ?? 0}`,
      `Total: PKR ${order.totalLabel ?? 0}`,
      "",
      "Items",
      itemsText,
      "",
      "Download Links",
      ...(links.length > 0 ? links : ["No download link available"]),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 1500);
    } catch {
      setError("Could not copy order details. Please allow clipboard permission.");
    }
  };

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((order) => {
      const effectiveStatus = (
        pendingStatus[order._id || order.orderId || ""] || order.statusLabel || ""
      ).toLowerCase();
      if (statusFilter !== "All" && effectiveStatus !== statusFilter.toLowerCase()) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        order.orderId,
        order._id,
        order.customer?.name,
        order.customer?.phone,
        order.customer?.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, searchText, statusFilter, pendingStatus]);

  const summary = useMemo(() => {
    const pending = rows.filter((r) => (r.statusLabel || "").toLowerCase() === "pending").length;
    const shipped = rows.filter((r) => (r.statusLabel || "").toLowerCase() === "shipped").length;
    const delivered = rows.filter((r) => (r.statusLabel || "").toLowerCase() === "delivered").length;
    return { total: rows.length, pending, shipped, delivered };
  }, [rows]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-sm text-gray-500">
              Review orders, update status, and share downloadable order slips.
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-gray-500">Total</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{summary.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-amber-600">Pending</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{summary.pending}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-sky-600">Shipped</div>
          <div className="mt-1 text-2xl font-bold text-sky-700">{summary.shipped}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase text-green-600">Delivered</div>
          <div className="mt-1 text-2xl font-bold text-green-700">{summary.delivered}</div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by order id, customer, phone, address"
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200"
          >
            <option value="All">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-500">
            Showing {filteredRows.length} of {rows.length} orders
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border bg-white py-16 text-center text-gray-500 shadow-sm">
          Loading orders...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="rounded-2xl border bg-white py-16 text-center text-gray-500 shadow-sm">
          No orders found.
        </div>
      ) : (
        <section className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
          <table className="min-w-[1200px] table-fixed text-sm">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                <th className="w-[9%] p-3 text-left">Order</th>
                <th className="w-[27%] p-3 text-left">Customer</th>
                <th className="w-[10%] p-3 text-center">Items</th>
                <th className="w-[14%] p-3 text-center">Total</th>
                <th className="w-[13%] p-3 text-center">Status</th>
                <th className="w-[12%] p-3 text-center">Date</th>
                <th className="w-[15%] p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((order) => {
                const rowId = order._id || order.orderId || "";
                const selectedStatus = pendingStatus[rowId] || order.statusLabel || "Pending";
                return (
                  <tr key={rowId} className="border-t align-top hover:bg-gray-50/60">
                    <td className="p-3 font-semibold text-gray-900">#{(order.orderId || order._id || "ORDER").slice(-6)}</td>
                    <td className="p-3">
                      <div className="font-semibold text-gray-900">{order.customer?.name || "Customer"}</div>
                      <div className="text-xs text-gray-500">{order.customer?.phone || "--"}</div>
                      <div className="text-xs leading-relaxed text-gray-500 break-words">{order.customer?.address || "--"}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-semibold text-gray-900">
                        {(order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)}
                      </div>
                      <div className="text-[11px] text-gray-500">{(order.items || []).length} types</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="space-y-0.5">
                        <div className="text-xs text-gray-500">Sub: PKR {order.subtotalLabel}</div>
                        <div className="text-xs text-gray-500">Del: PKR {order.deliveryLabel}</div>
                        <div className="font-semibold text-gray-900">PKR {order.totalLabel}</div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="mb-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            (order.statusLabel || "").toLowerCase() === "delivered"
                              ? "bg-green-100 text-green-700"
                              : (order.statusLabel || "").toLowerCase() === "shipped"
                              ? "bg-sky-100 text-sky-700"
                              : (order.statusLabel || "").toLowerCase() === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {order.statusLabel || "Pending"}
                        </span>
                      </div>
                      <select
                        value={selectedStatus}
                        onChange={(e) =>
                          setPendingStatus((prev) => ({ ...prev, [rowId]: e.target.value }))
                        }
                        disabled={!canUpdateStatus || savingId === rowId}
                        className="w-full rounded border px-2 py-1 text-xs"
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3 text-center text-xs text-gray-500">{order.createdAtLabel}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => handleDownload(order)}
                          disabled={resolvingLinkId === rowId}
                          className="rounded border border-green-300 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
                        >
                          {resolvingLinkId === rowId ? "Finding..." : "Download slip"}
                        </button>
                        <button
                          onClick={() => copyOrderDetails(order)}
                          className="rounded border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {copiedId === rowId ? "Copied" : "Copy order"}
                        </button>
                        <button
                          onClick={() => updateStatus(rowId, selectedStatus)}
                          disabled={!canUpdateStatus || savingId === rowId}
                          className="rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                        >
                          Update
                        </button>
                        {savingId === rowId && (
                          <span className="self-center text-xs text-gray-500">Updating...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
